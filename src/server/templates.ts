import {randomUUID,createHash} from 'node:crypto';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {HttpError,hasPermission,type actor} from './access.ts';
import {templateCommand,generationInput,generateCommand,renderTemplate,type TemplateCatalog,type TemplateVersion,type TemplateSource,type TemplateContext,type GenerationInput} from '../lib/template-domain.ts';
import {canonicalJSON} from '../lib/case-domain.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export const templateHash=(v:unknown)=>createHash('sha256').update(canonicalJSON(v)).digest('hex');
export function templateContent(v:Pick<TemplateVersion,'title'|'act'|'body'|'variables'|'active'|'reason'>){return {title:v.title,act:v.act,body:v.body,variables:v.variables,active:v.active,reason:v.reason};}
function allow(user:Actor,p:'template:read'|'template:publish'|'template:use'){if(!hasPermission(user.role,p))throw new HttpError(403,'Tu perfil no tiene permiso para esta acción de plantillas.');}
async function prior(tx:Connection,user:Actor,requestId:string,hash:string,kind:string){
  const [p]=await query<{office_id:string;actor_id:string;request_hash:string;kind:string;result:{id:string;version:number}}>(tx,'SELECT * FROM template_requests WHERE request_id=$1',[requestId]);
  if(p&&(p.office_id!==user.office||p.actor_id!==user.id||p.request_hash!==hash||p.kind!==kind))throw new HttpError(409,'La clave de solicitud ya se utilizó con otros datos.');return p?.result;
}
async function remember(tx:Connection,user:Actor,requestId:string,hash:string,kind:string,result:unknown){await query(tx,'INSERT INTO template_requests(request_id,office_id,actor_id,request_hash,kind,result) VALUES($1,$2,$3,$4,$5,$6)',[requestId,user.office,user.id,hash,kind,JSON.stringify(result)]);}
export async function templateCatalog(db:Kysely<Database>,user:Actor):Promise<TemplateCatalog>{
  allow(user,'template:read');return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,'template.read','office:'+user.office);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM template_state WHERE office_id=$1',[user.office]);
    const history=await query<TemplateVersion>(tx,'SELECT v.*,t.code,u.name AS author FROM legal_template_versions v JOIN legal_templates t ON t.id=v.template_id JOIN "user" u ON u.id=v.created_by WHERE t.office_id=$1 ORDER BY t.code,v.version DESC',[user.office]);
    for(const v of history)if(v.sha256!==templateHash(templateContent(v)))throw new HttpError(503,'La integridad de una plantilla no coincide.');
    const seen=new Set<string>();const items=history.filter(v=>{if(seen.has(v.template_id))return false;seen.add(v.template_id);return true;});return {revision:state?.revision||1,items,history};
  });
}
export async function publishTemplate(db:Kysely<Database>,user:Actor,raw:unknown){
  allow(user,'template:publish');const c=templateCommand.parse(raw),hash=templateHash(c);
  return db.transaction().execute(async tx=>{
    await query(tx,'INSERT INTO template_state(office_id) VALUES($1) ON CONFLICT DO NOTHING',[user.office]);
    const [s]=await query<{revision:number}>(tx,'SELECT revision FROM template_state WHERE office_id=$1 FOR UPDATE',[user.office]);
    const previous=await prior(tx,user,c.requestId,hash,'publish');if(previous)return previous;
    if(s.revision!==c.revision)throw new HttpError(409,'El catálogo cambió. Actualiza el contexto y revisa tu formulario antes de publicar.');
    let templateId=c.templateId;
    if(templateId){const [t]=await query<{code:string;version:number}>(tx,'SELECT t.code,(SELECT max(version)::int FROM legal_template_versions WHERE template_id=t.id) AS version FROM legal_templates t WHERE t.id=$1 AND t.office_id=$2',[templateId,user.office]);if(!t)throw new HttpError(404,'Plantilla no disponible.');if(t.code!==c.code||t.version!==c.baseVersion)throw new HttpError(409,'Cambió la versión base o el código de la plantilla.');}
    else{if(c.baseVersion!==0)throw new HttpError(400,'Una plantilla nueva empieza en la versión uno.');templateId=randomUUID();await query(tx,'INSERT INTO legal_templates(id,office_id,code) VALUES($1,$2,$3)',[templateId,user.office,c.code]);}
    const id=randomUUID(),version=c.baseVersion+1;
    await query(tx,'INSERT INTO legal_template_versions(id,template_id,version,title,act,body,variables,active,reason,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[id,templateId,version,c.title,c.act,c.body,JSON.stringify(c.variables),c.active,c.reason,templateHash(templateContent(c)),user.id]);
    await query(tx,'UPDATE template_state SET revision=revision+1 WHERE office_id=$1',[user.office]);const result={id,templateId,version};
    await audit(tx,user.id,'template.publish',id);await remember(tx,user,c.requestId,hash,'publish',result);return result;
  });
}
// Lock order: case first, then catalogue. Publication never locks a case.
async function prepare(tx:Connection,user:Actor,c:GenerationInput){
  const [record]=await query<TemplateContext&{revision:number;policy_version:string}>(tx,'SELECT kardex,act,subject,revision,policy_version FROM case_records WHERE id=$1 AND office_id=$2',[c.caseId,user.office]);
  if(!record)throw new HttpError(404,'Expediente no disponible.');
  if(record.revision!==c.revision)throw new HttpError(409,'El expediente cambió. Actualiza el contexto y revisa los valores.');
  const [last]=await query<{version:number}>(tx,'SELECT version FROM case_drafts WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[c.caseId]);
  if((last?.version||0)!==c.baseVersion)throw new HttpError(409,'La versión del borrador cambió.');
  await query(tx,'SELECT office_id FROM template_state WHERE office_id=$1 FOR SHARE',[user.office]);
  const [v]=await query<TemplateVersion>(tx,'SELECT v.*,t.code FROM legal_template_versions v JOIN legal_templates t ON t.id=v.template_id WHERE v.id=$1 AND t.office_id=$2 AND v.version=(SELECT max(version) FROM legal_template_versions WHERE template_id=t.id)',[c.templateVersionId,user.office]);
  if(!v||!v.active||v.act!==record.act)throw new HttpError(409,'La plantilla cambió, está inactiva o no corresponde al acto. Vuelve a seleccionarla.');
  if(v.sha256!==templateHash(templateContent(v)))throw new HttpError(503,'La integridad de la plantilla no coincide.');
  const participants=await query<TemplateContext['participants'][number]>(tx,'SELECT id,person_id,snapshot,role FROM case_participants WHERE case_id=$1 ORDER BY created_at,id',[c.caseId]);
  const requirements=await query(tx,'SELECT title,done,note,evidence_id FROM case_requirements WHERE case_id=$1 ORDER BY title,id',[c.caseId]);
  let rendered;try{rendered=renderTemplate(v,c.values,{...record,participants});}catch(e){throw new HttpError(400,(e as Error).message);}
  const source:TemplateSource={engine:'plain-v1',versionId:v.id,code:v.code,version:v.version,title:v.title,act:v.act,body:v.body,variables:v.variables,templateHash:v.sha256,values:rendered.values,resolved:rendered.resolved};
  const snapshot={participants,requirements,policyVersion:record.policy_version,templateSource:source};
  return {body:rendered.body,snapshot,sha256:templateHash({body:rendered.body,snapshot})};
}
export async function previewTemplate(db:Kysely<Database>,user:Actor,raw:unknown){
  allow(user,'template:use');const c=generationInput.parse(raw);return db.transaction().execute(async tx=>{
    await query(tx,'SELECT id FROM case_records WHERE id=$1 AND office_id=$2 FOR SHARE',[c.caseId,user.office]);const data=await prepare(tx,user,c);await audit(tx,user.id,'template.preview',c.caseId);return data;
  });
}
export async function generateTemplate(db:Kysely<Database>,user:Actor,raw:unknown){
  allow(user,'template:use');const c=generateCommand.parse(raw),hash=templateHash(c);return db.transaction().execute(async tx=>{
    const record=await query(tx,'SELECT id FROM case_records WHERE id=$1 AND office_id=$2 FOR UPDATE',[c.caseId,user.office]);if(!record.length)throw new HttpError(404,'Expediente no disponible.');
    const previous=await prior(tx,user,c.requestId,hash,'generate');if(previous)return previous;
    const data=await prepare(tx,user,c),id=randomUUID(),version=c.baseVersion+1;
    await query(tx,'INSERT INTO case_drafts(id,case_id,version,body,snapshot,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,c.caseId,version,data.body,JSON.stringify(data.snapshot),data.sha256,user.id]);
    await query(tx,'INSERT INTO case_draft_templates(draft_id,template_version_id,source) VALUES($1,$2,$3)',[id,c.templateVersionId,JSON.stringify(data.snapshot.templateSource)]);
    await query(tx,'UPDATE case_records SET revision=revision+1,content_revision=content_revision+1,updated_at=now() WHERE id=$1',[c.caseId]);
    await query(tx,'INSERT INTO case_events(case_id,actor_id,action) VALUES($1,$2,$3)',[c.caseId,user.id,'case.template-draft']);
    const result={id,version};await audit(tx,user.id,'template.generate',id);await remember(tx,user,c.requestId,hash,'generate',result);return result;
  });
}
