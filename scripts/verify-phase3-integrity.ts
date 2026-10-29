import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {caseDetail,listCases,mutateCase} from '../src/server/cases.ts';
import {query,type Database} from '../src/server/platform.ts';
import {canonicalJSON} from '../src/lib/case-domain.ts';
import type {Role} from '../src/server/access.ts';
if(!process.argv[2])throw new Error('Indica una base QA detenida del proyecto.');
const source=resolve(process.argv[2]);if(relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('La base debe pertenecer al proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));
const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const [r]=await query<{id:string;created_by:string;revision:number;office_id:string}>(db,'SELECT id,created_by,revision,office_id FROM case_records ORDER BY sequence LIMIT 1');assert.ok(r);
  const actor={id:r.created_by,name:'QA',email:'qa@example.test',role:'administracion' as Role,office:r.office_id,mfa:true,sessionId:'qa-integrity'};
  for(const statement of ["UPDATE case_participants SET role='alterado'","UPDATE case_drafts SET body='alterado'","UPDATE case_quotes SET total=0.01",'DELETE FROM quote_acceptances',"UPDATE case_requirement_checks SET note='alterado'","UPDATE case_events SET action='alterado'"])await assert.rejects(query(db,statement));
  await assert.rejects(caseDetail(db,{...actor,office:'otra-oficina'},r.id),error=>(error as {status:number}).status===404);
  assert.equal((await listCases(db,{...actor,office:'otra-oficina'},'',1,10,'')).total,0);
  const before=await caseDetail(db,actor,r.id);
  await query(db,`CREATE FUNCTION qa_fail_case_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='case.note' THEN RAISE EXCEPTION 'QA audit failure'; END IF; RETURN NEW; END; $$`);
  await query(db,'CREATE TRIGGER qa_audit_failure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_case_audit()');
  try{await assert.rejects(mutateCase(db,actor,r.id,{type:'note',revision:before.revision,body:'Esta nota no debe confirmarse si falla auditoría.'}));}finally{await query(db,'DROP TRIGGER qa_audit_failure ON audit_events');await query(db,'DROP FUNCTION qa_fail_case_audit()');}
  const after=await caseDetail(db,actor,r.id);assert.equal(after.revision,before.revision);assert.equal(after.notes.length,before.notes.length);assert.equal(after.events.length,before.events.length);
  for(const d of await query<{body:string;snapshot:unknown;sha256:string}>(db,'SELECT body,snapshot,sha256 FROM case_drafts'))assert.equal(createHash('sha256').update(canonicalJSON({body:d.body,snapshot:d.snapshot})).digest('hex'),d.sha256);
  const tables=['persons','document_versions','case_records','case_participants','case_requirements','case_requirement_checks','case_drafts','case_draft_reviews','case_quotes','quote_acceptances','service_orders','case_tasks','case_notes','case_events'];
  const counts:Record<string,number>={};for(const table of tables)counts[table]=(await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n;
  const archive=await pg.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:archive});
  try{await restored.waitReady;for(const table of tables)assert.equal((await restored.query<{n:number}>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,counts[table]);
    const reports={date:'2026-10-29',counts,checks:{appendOnlySnapshots:true,immutableRequirementChecks:true,immutableDrafts:true,immutableQuotes:true,immutableAcceptance:true,appendOnlyEvents:true,otherOfficeReadDenied:true,otherOfficeListEmpty:true,auditFailureRollsBackCaseNoteRevisionAndEvent:true,canonicalDraftHashesMatch:true,restoredAllTableCountsMatch:true},limits:['Local embedded PostgreSQL only; managed PostgreSQL and operational recovery remain untested.']};
    await writeFile('docs/evidence/fase-3-integridad.json',JSON.stringify(reports,null,2));console.log('Fase 3: integridad, aislamiento, rollback real del caso de uso y restauración correctos.');
  }finally{await restored.close();}
}finally{await db.destroy();}
