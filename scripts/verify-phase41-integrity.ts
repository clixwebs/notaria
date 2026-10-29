import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {query,type Database} from '../src/server/platform.ts';
import {publishTariff,tariffCatalog} from '../src/server/tariffs.ts';
import {mutateCase} from '../src/server/cases.ts';
import type {Role} from '../src/server/access.ts';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||!/^\.notaria-phase4[123]-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Indica una base QA de fase 4.1 detenida, dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));
const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const [r]=await query<{created_by:string;office_id:string}>(db,'SELECT v.created_by,i.office_id FROM tariff_versions v JOIN tariff_items i ON i.id=v.tariff_id LIMIT 1');assert.ok(r);
  const actor={id:r.created_by,name:'QA',email:'qa@example.test',role:'administracion' as Role,office:r.office_id,mfa:true,sessionId:'qa-integrity'};
  const tables=['tariff_items','tariff_versions','tariff_requests','case_quote_tariffs'];
  for(const table of tables){assert.ok((await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n>0);await assert.rejects(query(db,`DELETE FROM ${table}`));await assert.rejects(query(db,`UPDATE ${table} SET ${table==='tariff_items'?'code=code':table==='tariff_versions'?'version=version':table==='tariff_requests'?'request_hash=request_hash':'line_index=line_index'}`));}
  const before=await tariffCatalog(db,actor);assert.ok(before.items.length);
  const foreign=await tariffCatalog(db,{...actor,office:'ajena'});assert.deepEqual(foreign.items,[]);assert.deepEqual(foreign.history,[]);
  const input={requestId:randomUUID(),revision:before.revision,tariffId:null,baseVersion:0,code:'ROLLBACK-QA',description:'Publicación que debe revertirse',category:'Honorarios',unitAmount:'0.10',act:null,active:true,reason:'Control deliberado de atomicidad'};
  await assert.rejects(publishTariff(db,{...actor,role:'caja'},input),e=>(e as {status:number}).status===403);
  const current=before.items.find(v=>v.active&&!v.act)!;assert.ok(current);
  const [c]=await query<{id:string;revision:number;version:number}>(db,`SELECT r.id,r.revision,(SELECT max(version)::int FROM case_quotes WHERE case_id=r.id) AS version FROM case_records r JOIN case_quotes q ON q.case_id=r.id JOIN case_quote_tariffs l ON l.quote_id=q.id WHERE r.office_id=$1 LIMIT 1`,[actor.office]);assert.ok(c);
  const [countBefore]=await query(db,'SELECT (SELECT count(*) FROM tariff_requests)::int AS requests,(SELECT count(*) FROM case_quotes)::int AS quotes,(SELECT count(*) FROM case_quote_tariffs)::int AS links');
  await query(db,`CREATE FUNCTION qa_fail_tariff_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action IN ('tariff.publish','case.quote') THEN RAISE EXCEPTION 'QA audit failure'; END IF; RETURN NEW; END; $$`);
  await query(db,'CREATE TRIGGER qa_tariff_audit_failure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_tariff_audit()');
  try{
    await assert.rejects(publishTariff(db,actor,input));
    await assert.rejects(mutateCase(db,actor,c.id,{type:'quote',revision:c.revision,baseVersion:c.version,validUntil:'2099-12-31',lines:[{description:current.description,category:current.category,unitAmount:current.unit_amount,quantity:1,tariffVersionId:current.id}]}));
  }finally{await query(db,'DROP TRIGGER qa_tariff_audit_failure ON audit_events');await query(db,'DROP FUNCTION qa_fail_tariff_audit()');}
  assert.deepEqual(await tariffCatalog(db,actor),before);
  assert.deepEqual((await query(db,'SELECT (SELECT count(*) FROM tariff_requests)::int AS requests,(SELECT count(*) FROM case_quotes)::int AS quotes,(SELECT count(*) FROM case_quote_tariffs)::int AS links'))[0],countBefore);
  assert.equal((await query<{revision:number}>(db,'SELECT revision FROM case_records WHERE id=$1',[c.id]))[0].revision,c.revision);
  const [mismatch]=await query<{n:number}>(db,`SELECT count(*)::int AS n FROM case_quote_tariffs l JOIN tariff_versions v ON v.id=l.tariff_version_id JOIN tariff_items i ON i.id=v.tariff_id JOIN case_quotes q ON q.id=l.quote_id JOIN case_records r ON r.id=q.case_id WHERE r.office_id IS DISTINCT FROM i.office_id OR q.lines->l.line_index->>'tariffVersionId' IS DISTINCT FROM v.id::text OR q.lines->l.line_index->>'description' IS DISTINCT FROM v.description OR q.lines->l.line_index->>'category' IS DISTINCT FROM v.category OR (q.lines->l.line_index->>'unitAmount')::numeric IS DISTINCT FROM v.unit_amount OR q.lines->l.line_index->'tariffSource'->>'code' IS DISTINCT FROM i.code OR (q.lines->l.line_index->'tariffSource'->>'version')::int IS DISTINCT FROM v.version`);assert.equal(mismatch.n,0);
  const counts:Record<string,number>={};for(const table of [...tables,'case_quotes','quote_acceptances','finance_entries'])counts[table]=(await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n;
  const quotes=await query(db,'SELECT id,lines,total::text FROM case_quotes ORDER BY id');
  const archive=await pg.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:archive});
  try{
    await restored.waitReady;
    for(const [table,count] of Object.entries(counts))assert.equal((await restored.query<{n:number}>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,count);
    assert.deepEqual((await restored.query('SELECT id,lines,total::text FROM case_quotes ORDER BY id')).rows,quotes);
  }finally{await restored.close();}
  const report={date:'2026-10-29',counts,checks:{fourTariffTablesRejectUpdateAndDelete:true,officeIsolation:true,cashierCannotPublish:true,auditFailureRollsBackPublicationStateVersionAndRequest:true,auditFailureRollsBackQuoteLinksAndCaseRevision:true,quoteSnapshotsMatchImmutableTariffVersions:true,restorationRetainsCountsAndExactQuotes:true},limits:['QA detenida; PGlite de un proceso. PostgreSQL externo y validación tributaria no ensayados.']};
  await writeFile(basename(source).startsWith('.notaria-phase43-')?'docs/evidence/fase-4-3-tarifas-integridad'+(basename(source).includes('restaurada')?'-restaurada':'')+'.json':basename(source).startsWith('.notaria-phase42-')?'docs/evidence/fase-4-2-tarifas-integridad.json':'docs/evidence/fase-4-1-integridad.json',JSON.stringify(report,null,2));console.log('Fase 4.1: integridad, aislamiento, rollback de publicación/presupuesto y restauración correctos.');
}finally{await db.destroy();}
