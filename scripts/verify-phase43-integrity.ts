import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {query,type Database} from '../src/server/platform.ts';
import {publishTemplate,templateCatalog,previewTemplate,generateTemplate,templateHash,templateContent} from '../src/server/templates.ts';
import {renderTemplate,type TemplateVersion,type TemplateSource,type TemplateContext} from '../src/lib/template-domain.ts';
import {canonicalJSON} from '../src/lib/case-domain.ts';
import type {Role} from '../src/server/access.ts';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||!/^\.notaria-phase43-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Indica una base QA de fase 4.3 detenida dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const immutable=['legal_templates','legal_template_versions','template_requests','case_draft_templates'];
  const all=[...immutable,'template_state','case_records','case_participants','case_requirements','case_drafts','case_draft_reviews','case_events','case_quotes','quote_acceptances','service_orders','finance_state','finance_entries','finance_requests','finance_sessions','finance_closings','fiscal_documents','fiscal_events','fiscal_requests','fiscal_projection','tariff_versions','tariff_requests'];
  async function digests(connection=db){const result:Record<string,{count:number;sha256:string}>={};for(const table of all){const [r]=await query<{count:number;data:string}>(connection,`SELECT count(*)::int AS count,COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS data FROM ${table} t`);result[table]={count:r.count,sha256:templateHash(r.data)};}return result;}
  const versions=await query<TemplateVersion&{created_by:string;office_id:string}>(db,'SELECT v.*,t.code,t.office_id FROM legal_template_versions v JOIN legal_templates t ON t.id=v.template_id');assert.ok(versions.length>=7);
  for(const v of versions)assert.equal(v.sha256,templateHash(templateContent(v)));
  for(const table of immutable){assert.ok((await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n>0);await assert.rejects(query(db,`DELETE FROM ${table}`));const col=table==='legal_templates'?'code':table==='legal_template_versions'?'body':table==='template_requests'?'request_hash':'source';await assert.rejects(query(db,`UPDATE ${table} SET ${col}=${col}`));}
  const generated=await query<{id:string;case_id:string;version:number;body:string;snapshot:{participants:TemplateContext['participants'];templateSource:TemplateSource};sha256:string;template_version_id:string;source:TemplateSource;kardex:string;act:string;subject:string}>(db,'SELECT d.*,l.template_version_id,l.source,c.kardex,c.act,c.subject FROM case_drafts d JOIN case_draft_templates l ON l.draft_id=d.id JOIN case_records c ON c.id=d.case_id');assert.ok(generated.length>=3);
  for(const d of generated){const s=d.snapshot.templateSource,v=versions.find(v=>v.id===d.template_version_id)!;assert.ok(v);assert.equal(s.versionId,v.id);assert.equal(s.templateHash,v.sha256);assert.deepEqual(d.source,s);assert.equal(d.sha256,templateHash({body:d.body,snapshot:d.snapshot}));assert.equal(s.body,v.body);assert.deepEqual(s.variables,v.variables);const rendered=renderTemplate(v,s.values,{...d,participants:d.snapshot.participants});assert.equal(rendered.body,d.body);assert.equal(canonicalJSON(rendered.resolved),canonicalJSON(s.resolved));}
  const [mismatch]=await query<{n:number}>(db,"SELECT count(*)::int AS n FROM template_state s WHERE revision<>1+(SELECT count(*) FROM template_requests r WHERE r.office_id=s.office_id AND r.kind='publish')");assert.equal(mismatch.n,0);
  const [owner]=versions;const professional={id:owner.created_by,name:'QA',email:'qa@example.test',role:'abogado' as Role,office:owner.office_id,mfa:true,sessionId:'qa-integrity'};
  const cat=await templateCatalog(db,professional);const active=cat.items.find(v=>v.code==='JUR-QA')!;assert.ok(active.active);
  const sample=generated.find(d=>d.source.code==='JUR-QA')!;
  const [c]=await query<{revision:number;version:number}>(db,'SELECT revision,(SELECT max(version)::int FROM case_drafts WHERE case_id=c.id) AS version FROM case_records c WHERE id=$1',[sample.case_id]);
  const gen={requestId:randomUUID(),caseId:sample.case_id,revision:c.revision,baseVersion:c.version,templateVersionId:active.id,values:sample.source.values};
  const previewInput={caseId:gen.caseId,revision:gen.revision,baseVersion:gen.baseVersion,templateVersionId:gen.templateVersionId,values:gen.values};
  const pub={requestId:randomUUID(),revision:cat.revision,templateId:active.template_id,baseVersion:active.version,code:active.code,...templateContent(active),acknowledgeReview:true};
  const before=await digests();
  assert.deepEqual((await templateCatalog(db,{...professional,office:'ajena'})).history,[]);
  for(const role of ['caja','recepcion','administracion'] as Role[])await assert.rejects(publishTemplate(db,{...professional,role},pub),e=>(e as {status:number}).status===403);
  await assert.rejects(previewTemplate(db,{...professional,office:'ajena'},previewInput),e=>(e as {status:number}).status===404);
  await assert.rejects(generateTemplate(db,{...professional,office:'ajena'},gen),e=>(e as {status:number}).status===404);
  // Failure is raised after all domain writes, proving rollback includes
  // generation, relation, revision, event, request and publication counter.
  await query(db,`CREATE FUNCTION qa_fail_template_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action IN ('template.publish','template.generate') THEN RAISE EXCEPTION 'QA template audit rollback'; END IF; RETURN NEW; END; $$`);
  await query(db,'CREATE TRIGGER qa_template_audit_failure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_template_audit()');
  try{await assert.rejects(publishTemplate(db,professional,pub),/QA template audit rollback/);await assert.rejects(generateTemplate(db,professional,gen),/QA template audit rollback/);}finally{await query(db,'DROP TRIGGER qa_template_audit_failure ON audit_events');await query(db,'DROP FUNCTION qa_fail_template_audit()');}
  assert.deepEqual(await digests(),before);
  const archive=await pg.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:archive});const restoredDb=new Kysely<Database>({dialect:new PGliteDialect({pglite:restored})});
  try{await restored.waitReady;assert.deepEqual(await digests(restoredDb),before);const preview=await previewTemplate(restoredDb,professional,previewInput);assert.ok(preview.body.includes('Interviniente Plantilla Ficticio'));const result=await generateTemplate(restoredDb,professional,gen);assert.deepEqual(await generateTemplate(restoredDb,professional,gen),result);const after=await digests(restoredDb);assert.equal(after.case_drafts.count,before.case_drafts.count+1);for(const table of ['finance_entries','finance_requests','finance_state','fiscal_documents','fiscal_events','fiscal_requests','fiscal_projection','tariff_versions','tariff_requests'])assert.deepEqual(after[table],before[table]);}finally{await restoredDb.destroy();}
  assert.deepEqual(await digests(),before);
  await writeFile('docs/evidence/fase-4-3-integridad'+(basename(source).includes('restaurada')?'-restaurada':'')+'.json',JSON.stringify({date:'2026-10-29',source:basename(source),counts:Object.fromEntries(Object.entries(before).map(([t,v])=>[t,v.count])),checks:{fourHistoriesRejectUpdateDelete:true,allPublishedHashesMatch:true,generationRebuildsFromFrozenTemplateValuesAndContext:true,immutableSourceLinksMatchSnapshots:true,catalogRevisionMatchesPublications:true,officeAndProfessionalPermissionIsolation:true,auditFailureRollsBackPublicationAndGeneration:true,noFinancialFiscalOrTariffSideEffects:true,restartRetainsAllComparedTables:true,retryAfterRestorationCreatesExactlyOneDraft:true,originalDiskUnchangedByRestoredGeneration:true},limits:['Solo textos sintéticos QA. No valida contenido jurídico, firma ni autorización notarial.','La prueba de generación tras reinicio se ejecuta en copia en memoria.']},null,2));
  console.log('BK-14: once grupos de integridad, rollback, aislamiento y restauración correctos.');
}finally{await db.destroy();}
