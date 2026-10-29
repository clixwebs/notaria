import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {query,type Database} from '../src/server/platform.ts';
import {mutateFiscal,fiscalOverview,fiscalDetail,hashFiscal} from '../src/server/fiscal.ts';
import {buildFiscalXML,buildFiscalQR} from '../src/server/fiscal-xml.ts';
import {simulatedFiscalAdapter,type FiscalAdapter} from '../src/server/fiscal-adapter.ts';
import {canonicalJSON} from '../src/lib/case-domain.ts';
import type {FiscalSnapshot,FiscalStatus} from '../src/lib/fiscal-domain.ts';
import type {Role} from '../src/server/access.ts';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||!/^\.notaria-phase4[23]-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Indica una base QA de fase 4.2 detenida, dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const [owner]=await query<{id:string;office_id:string}>(db,'SELECT created_by AS id,office_id FROM fiscal_documents LIMIT 1');assert.ok(owner);
  const actor={id:owner.id,name:'QA',email:'qa@example.test',role:'administracion' as Role,office:owner.office_id,mfa:true,sessionId:'qa-integrity'};
  // QA-only recovery fixture: leave one timeout unresolved on disk so restoration
  // must recover its existing receipt, rather than issue a replacement number.
  let [pending]=await query<{id:string}>(db,"SELECT d.id FROM fiscal_documents d JOIN fiscal_projection p ON p.document_id=d.id WHERE p.status='unknown' AND d.scenario='timeout-after' LIMIT 1");
  if(!pending){
    const context=await fiscalOverview(db,actor);const sourceCharge=context.charges[0];assert.ok(sourceCharge);
    const created=await mutateFiscal(db,actor,{type:'prepare',requestId:randomUUID(),revision:context.revision,chargeId:sourceCharge.id,documentType:'01',receiver:{name:'Receptor Recuperación Ficticio',documentType:'6',documentNumber:'20000000001'},taxes:sourceCharge.lines.map((_,lineIndex)=>({lineIndex,tax:'inafecto',purpose:'service'})),scenario:'timeout-after',acknowledgeSimulation:true});
    const state=await fiscalOverview(db,actor);await mutateFiscal(db,actor,{type:'submit',requestId:randomUUID(),revision:state.revision,documentId:created.id,documentRevision:created.revision});pending={id:created.id};
  }
  const immutable=['fiscal_documents','fiscal_events','fiscal_requests','fiscal_sim_receipts'];
  const fiscalTables=['fiscal_state','fiscal_series','fiscal_projection',...immutable];
  async function digests(){const out:Record<string,string>={};for(const table of [...fiscalTables,'finance_state','finance_entries','finance_sessions','finance_closings']){const [r]=await query<{data:string}>(db,`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS data FROM ${table} t`);out[table]=hashFiscal(r.data);}return out;}
  for(const table of immutable){assert.ok((await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n>0);await assert.rejects(query(db,`DELETE FROM ${table}`));const column=table==='fiscal_documents'?'reference':table==='fiscal_events'?'note':table==='fiscal_requests'?'hash':'xml_hash';await assert.rejects(query(db,`UPDATE ${table} SET ${column}=${column}`));}
  const docs=await query<{id:string;snapshot:FiscalSnapshot;snapshot_hash:string;xml:string;xml_sha256:string;qr_payload:string;qr_png:Uint8Array;qr_sha256:string}>(db,'SELECT id,snapshot,snapshot_hash,xml,xml_sha256,qr_payload,qr_png,qr_sha256 FROM fiscal_documents');
  assert.ok(docs.length>=7);
  for(const d of docs){assert.equal(d.snapshot.mode,'simulation');assert.equal(d.snapshot.issuer.ruc,'00000000000');assert.ok(d.snapshot.reference.startsWith('SIM-'));assert.equal(d.snapshot_hash,hashFiscal(canonicalJSON(d.snapshot)));assert.equal(d.xml_sha256,hashFiscal(d.xml));assert.equal(d.qr_sha256,hashFiscal(d.qr_png));assert.equal(d.xml,buildFiscalXML(d.snapshot));assert.equal(d.qr_payload,buildFiscalQR(d.snapshot,d.xml_sha256));assert.ok(!d.xml.includes('SignatureValue'));assert.ok(d.snapshot.lines.every(l=>l.category!=='Terceros' as string));}
  const [projectionMismatch]=await query<{n:number}>(db,`SELECT count(*)::int AS n FROM fiscal_projection p JOIN LATERAL (SELECT status,version FROM fiscal_events e WHERE e.document_id=p.document_id ORDER BY version DESC LIMIT 1) e ON true WHERE p.status<>e.status OR p.revision<>e.version`);assert.equal(projectionMismatch.n,0);
  const [numberMismatch]=await query<{n:number}>(db,`SELECT count(*)::int AS n FROM fiscal_series s WHERE s.sequence<>(SELECT max(d.sequence) FROM fiscal_documents d WHERE d.office_id=s.office_id AND d.document_type=s.document_type)`);assert.equal(numberMismatch.n,0);
  const [requestMismatch]=await query<{n:number}>(db,`SELECT count(*)::int AS n FROM fiscal_state s WHERE s.revision<>(SELECT count(*) FROM fiscal_requests r WHERE r.office_id=s.office_id)`);assert.equal(requestMismatch.n,0);
  const foreign=await fiscalOverview(db,{...actor,office:'ajena'});assert.deepEqual(foreign.documents,[]);assert.deepEqual(foreign.charges,[]);assert.equal(foreign.total,0);
  await assert.rejects(fiscalDetail(db,{...actor,office:'ajena'},docs[0].id),e=>(e as {status:number}).status===404);
  await assert.rejects(fiscalDetail(db,{...actor,role:'recepcion'},docs[0].id),e=>(e as {status:number}).status===403);
  const before=await digests();const overview=await fiscalOverview(db,actor);const charge=overview.charges[0];assert.ok(charge);
  const prepare={type:'prepare',requestId:randomUUID(),revision:overview.revision,chargeId:charge.id,documentType:'01',receiver:{name:'Ficticio Rollback QA',documentType:'6',documentNumber:'20000000001'},taxes:charge.lines.map((_,lineIndex)=>({lineIndex,tax:'inafecto',purpose:'service'})),scenario:'accept',acknowledgeSimulation:true};
  const [prepared]=await query<{document_id:string;revision:number}>(db,"SELECT p.document_id,p.revision FROM fiscal_projection p JOIN fiscal_documents d ON d.id=p.document_id WHERE p.status='prepared' AND d.scenario='accept' LIMIT 1");assert.ok(prepared);
  const submit={type:'submit',requestId:randomUUID(),revision:overview.revision,documentId:prepared.document_id,documentRevision:prepared.revision};
  await query(db,`CREATE FUNCTION qa_fail_fiscal_audit() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE s text; BEGIN IF NEW.action IN ('fiscal.prepare','fiscal.submit') THEN SELECT status INTO s FROM fiscal_events WHERE document_id=NEW.resource::uuid ORDER BY version DESC LIMIT 1; RAISE EXCEPTION 'QA fiscal rollback status=%',s; END IF; RETURN NEW; END; $$`);
  await query(db,'CREATE TRIGGER qa_fiscal_audit_failure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_fiscal_audit()');
  try{
    await assert.rejects(mutateFiscal(db,actor,prepare),e=>(e as Error).message.includes('prepared'));
    await assert.rejects(mutateFiscal(db,actor,submit),e=>(e as Error).message.includes('accepted'));
    const wrong:FiscalAdapter={...simulatedFiscalAdapter,submit(input){return {...simulatedFiscalAdapter.submit(input),key:randomUUID()};}};
    await assert.rejects(mutateFiscal(db,actor,submit,wrong),e=>(e as Error).message.includes('unknown'));
    const wrongHash:FiscalAdapter={...simulatedFiscalAdapter,submit(input){return {...simulatedFiscalAdapter.submit(input),xmlHash:'f'.repeat(64)};}};
    await assert.rejects(mutateFiscal(db,actor,submit,wrongHash),e=>(e as Error).message.includes('unknown'));
  }finally{await query(db,'DROP TRIGGER qa_fiscal_audit_failure ON audit_events');await query(db,'DROP FUNCTION qa_fail_fiscal_audit()');}
  assert.deepEqual(await digests(),before);
  const allowed:Record<FiscalStatus,FiscalStatus[]>={prepared:['accepted','rejected','processing','unknown','technical-error','discarded'],unknown:['accepted','rejected','processing','unknown','not-found','technical-error'],processing:['accepted','rejected','processing','unknown','not-found','technical-error'],'not-found':['accepted','rejected','processing','unknown','technical-error','discarded'],'technical-error':['accepted','rejected','processing','unknown','technical-error','discarded'],accepted:[],rejected:['discarded'],discarded:[]};
  for(const d of docs){const events=await query<{status:FiscalStatus;version:number;response:{mode:string;code:string;status:string}}>(db,'SELECT status,version,response FROM fiscal_events WHERE document_id=$1 ORDER BY version',[d.id]);assert.equal(events[0].status,'prepared');events.forEach((e,i)=>{assert.equal(e.version,i+1);assert.equal(e.response.mode,'simulation');assert.ok(e.response.code.startsWith('SIM-'));assert.equal(e.response.status,e.status);if(i)assert.ok(allowed[events[i-1].status].includes(e.status));});}
  const counts:Record<string,number>={};for(const table of fiscalTables)counts[table]=(await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n;
  const archive=await pg.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:archive});
  const restoredDb=new Kysely<Database>({dialect:new PGliteDialect({pglite:restored})});
  try{
    await restored.waitReady;for(const [table,count] of Object.entries(counts))assert.equal((await restored.query<{n:number}>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,count);
    const restoredDocs=(await restored.query<{id:string;xml:string;qr_png:Uint8Array}>('SELECT id,xml,qr_png FROM fiscal_documents')).rows;
    for(const d of restoredDocs){const original=docs.find(v=>v.id===d.id)!;assert.equal(hashFiscal(d.xml),original.xml_sha256);assert.equal(hashFiscal(d.qr_png),original.qr_sha256);}
    const old=await fiscalDetail(restoredDb,actor,pending.id);assert.equal(old.status,'unknown');
    const oldSeries=await query(restoredDb,'SELECT * FROM fiscal_series ORDER BY office_id,document_type');
    const oldFinance=await query(restoredDb,'SELECT * FROM finance_state ORDER BY office_id');
    const context=await fiscalOverview(restoredDb,actor);const request={type:'consult',requestId:randomUUID(),revision:context.revision,documentId:old.id,documentRevision:old.revision};
    const first=await mutateFiscal(restoredDb,actor,request);assert.equal(first.status,'accepted');assert.deepEqual(await mutateFiscal(restoredDb,actor,request),first);
    const recovered=await fiscalDetail(restoredDb,actor,old.id);assert.equal(recovered.reference,old.reference);assert.equal(recovered.xml_sha256,old.xml_sha256);assert.equal(recovered.events.length,old.events.length+1);
    assert.deepEqual(await query(restoredDb,'SELECT * FROM fiscal_series ORDER BY office_id,document_type'),oldSeries);assert.deepEqual(await query(restoredDb,'SELECT * FROM finance_state ORDER BY office_id'),oldFinance);
  }finally{await restoredDb.destroy();}
  await writeFile(basename(source).startsWith('.notaria-phase43-')?'docs/evidence/fase-4-3-fiscal-integridad'+(basename(source).includes('restaurada')?'-restaurada':'')+'.json':'docs/evidence/fase-4-2-integridad.json',JSON.stringify({date:'2026-10-29',counts,checks:{fourFiscalHistoriesRejectUpdatesAndDeletes:true,frozenXMLQRAndSnapshotsHaveMatchingHashes:true,projectionsRebuildFromEvents:true,seriesAndRequestsMatchCounters:true,officeAndRoleIsolation:true,auditFailureRollsBackPreparationNumberArtifactsAndRequest:true,auditFailureRollsBackSimulatedReceiptAndEvent:true,wrongAdapterDocumentOrHashCannotClaimAcceptance:true,fiscalFailureDoesNotChangeFinancialTables:true,eventTransitionsAndSimulationMarkersConsistent:true,restorationRetainsCountsAndArtifactBytes:true,unknownResultSurvivesRestartAndResolvesOnceWithSameReference:true},limits:['Simulación local sin red. No es validación XSD/UBL integral, firma, CDR ni aceptación fiscal real.','El verificador crea una única preparación/timeout de recuperación en esta base QA si no existe; no toca la base principal.']},null,2));
  console.log('Fase 4.2: 12 grupos de integridad, rollback, aislamiento, contratos y recuperación tras reinicio correctos.');
}finally{await db.destroy();}
