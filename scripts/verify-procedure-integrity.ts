import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {query,type Database} from '../src/server/platform.ts';
import {mutateProcedure,procedureState,procedureHash} from '../src/server/procedures.ts';
import {instrumentActive} from '../src/lib/procedure-domain.ts';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||!/^\.notaria-procedure-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Indica una base QA de procedimiento detenida dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const tables=['procedure_events','procedure_requests','instrument_counters','case_records','case_drafts','case_events','case_draft_reviews','case_participants','case_requirements','finance_state','finance_entries','finance_requests','finance_sessions','finance_closings','fiscal_documents','fiscal_events','fiscal_requests','fiscal_projection','tariff_versions','template_requests'];
  async function digests(connection=db){const result:Record<string,{count:number;hash:string}>={};for(const t of tables){const [v]=await query<{n:number;data:unknown}>(connection,`SELECT count(*)::int AS n,COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) AS data FROM ${t} t`);result[t]={count:v.n,hash:procedureHash(v.data)};}return result;}
  const rows=await query<{id:string;kind:string;data:Record<string,unknown>;sha256:string;case_id:string}>(db,'SELECT * FROM procedure_events ORDER BY case_id,sequence');assert.ok(rows.length>=25);
  for(const e of rows)assert.equal(e.sha256,procedureHash({kind:e.kind,data:e.data}));
  for(const t of ['procedure_events','procedure_requests']){await assert.rejects(query(db,`UPDATE ${t} SET ${t==='procedure_events'?'kind=kind':'office_id=office_id'}`),/append-only/);await assert.rejects(query(db,`DELETE FROM ${t}`),/append-only/);}
  const [owner]=await query<{user_id:string;office_id:string}>(db,"SELECT user_id,office_id FROM staff WHERE role='notario' AND user_id IN (SELECT actor_id FROM procedure_events WHERE kind='authorize') LIMIT 1");
  const user={id:owner.user_id,name:'QA',email:'qa@example.test',role:'notario' as const,office:owner.office_id,mfa:true,sessionId:'qa-integrity'};
  const counters=await query<{act:string;year:number;value:number;folio:number;office_id:string}>(db,'SELECT * FROM instrument_counters');
  for(const n of counters){const authorized=rows.filter(e=>e.kind==='authorize'&&e.data.act===n.act);assert.equal(n.value,authorized.length);assert.equal(n.folio,Math.max(...authorized.map(e=>Number(e.data.folioEnd))));const numbers=new Set(authorized.map(e=>e.data.number));assert.equal(numbers.size,authorized.length);const sorted=authorized.sort((a,b)=>Number(a.data.folioStart)-Number(b.data.folioStart));let next=1;for(const e of sorted){assert.equal(e.data.folioStart,next);next=Number(e.data.folioEnd)+1;}}
  for(const e of rows.filter(e=>e.kind==='authorize')){const [d]=await query<{body:string;sha256:string}>(db,'SELECT body,sha256 FROM case_drafts WHERE id=$1',[e.data.draftId]);assert.equal(e.data.body,d.body);assert.equal(e.data.draftHash,d.sha256);assert.ok(Array.isArray(e.data.grants)&&e.data.grants.length>0);for(const g of e.data.grants as {id:string}[])assert.ok(rows.some(r=>r.id===g.id&&r.case_id===e.case_id&&r.kind==='grant'));}
  const sample=rows.find(e=>e.kind==='authorize'&&e.data.act==='Compraventa')!,caseId=sample.case_id,before=await digests();
  await assert.rejects(procedureState(db,{...user,office:'otra-oficina'},caseId),e=>(e as {status:number}).status===404);
  await assert.rejects(procedureState(db,{...user,role:'caja' as never},caseId),e=>(e as {status:number}).status===403);
  // Test writes only in a disposable in-memory restored copy. Disk QA is left unchanged.
  const archive=await pg.dumpDataDir('gzip'),restored=new PGlite({loadDataDir:archive}),copy=new Kysely<Database>({dialect:new PGliteDialect({pglite:restored})});
  try{
    await restored.waitReady;assert.deepEqual(await digests(copy),before);
    await assert.rejects(query(copy,`INSERT INTO procedure_events(id,case_id,sequence,kind,data,sha256,actor_id) SELECT $1,case_id,sequence+1000000,kind,data,sha256,actor_id FROM procedure_events WHERE id=$2`,[randomUUID(),sample.id]),e=>(e as {code:string}).code==='23505');
    const state=await procedureState(copy,user,caseId),current=state.instruments.find(i=>instrumentActive(state.events,i.id))!;assert.ok(current);
    await mutateProcedure(copy,user,caseId,{requestId:randomUUID(),revision:state.revision,type:'void',instrumentId:current.id,note:'Incidencia sintética para probar rollback transaccional.'});
    const afterVoid=await digests(copy),ready=await procedureState(copy,user,caseId),command={requestId:randomUUID(),revision:ready.revision,type:'authorize',draftId:current.draftId,folios:2,note:'Prueba sintética de restauración e idempotencia.',acknowledge:true};
    await query(copy,`CREATE FUNCTION qa_procedure_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='procedure.authorize' THEN RAISE EXCEPTION 'QA procedure rollback'; END IF; RETURN NEW; END; $$`);
    await query(copy,'CREATE TRIGGER qa_fail_procedure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_procedure_fail()');
    await assert.rejects(mutateProcedure(copy,user,caseId,command),/QA procedure rollback/);assert.deepEqual(await digests(copy),afterVoid);
    await query(copy,'DROP TRIGGER qa_fail_procedure ON audit_events');await query(copy,'DROP FUNCTION qa_procedure_fail()');
    const result=await mutateProcedure(copy,user,caseId,command);assert.deepEqual(await mutateProcedure(copy,user,caseId,command),result);
    const after=await digests(copy);assert.equal(after.procedure_events.count,afterVoid.procedure_events.count+1);assert.equal(after.procedure_requests.count,afterVoid.procedure_requests.count+1);
    for(const t of ['finance_state','finance_entries','finance_requests','finance_sessions','finance_closings','fiscal_documents','fiscal_events','fiscal_requests','fiscal_projection','tariff_versions','template_requests','case_drafts'])assert.deepEqual(after[t],before[t]);
    const again=new PGlite({loadDataDir:await restored.dumpDataDir('gzip')}),againDb=new Kysely<Database>({dialect:new PGliteDialect({pglite:again})});try{await again.waitReady;assert.deepEqual(await mutateProcedure(againDb,user,caseId,command),result);assert.deepEqual(await digests(againDb),after);}finally{await againDb.destroy();}
    await query(copy,'DROP TRIGGER procedure_events_immutable ON procedure_events');
    await query(copy,`UPDATE procedure_events SET data=data||'{"note":"QA tamper"}'::jsonb WHERE id=$1`,[sample.id]);
    await assert.rejects(procedureState(copy,user,caseId),e=>(e as {status:number}).status===503);
  }finally{await copy.destroy();}
  assert.deepEqual(await digests(),before);
  await writeFile('docs/evidence/fase-3-procedimiento-integridad'+(basename(source).includes('restaurada')?'-restaurada':'')+'.json',JSON.stringify({date:'2026-10-29',source:basename(source),counts:Object.fromEntries(Object.entries(before).map(([t,v])=>[t,v.count])),checks:{eventHashes:true,twoAppendOnlyHistories:true,consecutiveUniqueNumbersAndNonOverlappingFolios:true,uniqueIndexRejectsDuplicateNumber:true,tamperIsDetected:true,frozenBodyAndDraftHash:true,grantsBelongToCase:true,officeIsolation:true,cashierDenied:true,restorationRetainsAllTables:true,auditFailureRollsBackCounterEventRevisionAndRequest:true,confirmedRetryAfterRestartHasOneEffect:true,noFinanceFiscalTariffTemplateOrDraftSideEffects:true,diskUnchangedByMemoryTests:true},limits:['Procedimiento sintético; sin identidad, firma o autorización reales.','Pruebas destructivas y nuevos registros solo en copia en memoria.']},null,2));
  console.log('Procedimiento: 14 grupos de integridad correctos.');
}finally{await db.destroy();}
