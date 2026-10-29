import {createHash,randomUUID} from 'node:crypto';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {hasPermission,HttpError,type actor,type Permission} from './access.ts';
import {canonicalJSON} from '../lib/case-domain.ts';
import {integrationCommand,requirements,type IntegrationChannel,type IntegrationRecord,type IntegrationEvent,type IntegrationState} from '../lib/integration-domain.ts';
import {procedureEvents} from './procedures.ts';
import {instrumentActive} from '../lib/procedure-domain.ts';
import {identityContractSpike,signatureAdapter} from './integration-adapters.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export const integrationHash=(v:unknown)=>createHash('sha256').update(canonicalJSON(v)).digest('hex');
export const channelPermission=(channel:IntegrationChannel):Permission=>channel==='fiscal'?'fiscal:read':'procedure:read';
function fail(message:string,status=409):never{throw new HttpError(status,message);}
function allow(user:Actor,channel:IntegrationChannel){if(!hasPermission(user.role,channelPermission(channel)))fail('Tu perfil no tiene permiso para este canal.',403);}
function past(v:string){if(new Date(v).getTime()>Date.now())fail('La fecha no puede estar en el futuro.',400);}
async function history(tx:Connection,id:string){const events=await query<IntegrationEvent>(tx,'SELECT e.id,e.sequence,e.kind,e.data,e.sha256,e.created_at::text,u.name AS author FROM integration_events e JOIN "user" u ON u.id=e.actor_id WHERE record_id=$1 ORDER BY sequence',[id]);let previous='';for(const e of events){if(e.sha256!==integrationHash({recordId:id,sequence:e.sequence,kind:e.kind,data:e.data,previous}))fail('La integridad del historial no coincide.',503);previous=e.sha256;}return events;}
async function record(tx:Connection,user:Actor,id:string,channel:IntegrationChannel):Promise<IntegrationRecord>{const [r]=await query<Omit<IntegrationRecord,'events'>>(tx,'SELECT id,kind,title,case_id FROM integration_records WHERE id=$1 AND office_id=$2 AND channel=$3',[id,user.office,channel]);if(!r)fail('Registro no disponible.',404);return {...r,events:await history(tx,id)};}
async function released(tx:Connection,user:Actor,caseId:string,id:string){const [v]=await query<{id:string;sha256:string;content:Uint8Array;title:string;version:number}>(tx,`SELECT v.id,v.sha256,v.content,d.title,v.version FROM document_versions v JOIN private_documents d ON d.id=v.document_id WHERE v.id=$1 AND d.office_id=$2 AND v.status='liberado' AND EXISTS(SELECT 1 FROM case_participants p WHERE p.case_id=$3 AND p.person_id=d.person_id)`,[id,user.office,caseId]);if(!v)fail('Selecciona una versión privada liberada de un interviniente.',400);if(createHash('sha256').update(v.content).digest('hex')!==v.sha256)fail('No coincide la huella del archivo privado.',503);return {id:v.id,sha256:v.sha256,title:v.title,version:v.version};}
async function artifact(tx:Connection,r:IntegrationRecord){const [a]=await query<{content:string;sha256:string}>(tx,'SELECT content,sha256 FROM integration_artifacts WHERE id=$1',[r.id]);if(!a||createHash('sha256').update(a.content).digest('hex')!==a.sha256||r.events[0].data.manifestHash!==a.sha256)fail('La integridad del manifiesto no coincide.',503);return a;}
export async function integrationState(db:Kysely<Database>,user:Actor,channel:IntegrationChannel):Promise<IntegrationState>{allow(user,channel);return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
 const [s]=await query<{revision:number}>(tx,'SELECT revision FROM integration_state WHERE office_id=$1 AND channel=$2',[user.office,channel]);const rows=await query<{id:string}>(tx,'SELECT id FROM integration_records WHERE office_id=$1 AND channel=$2 ORDER BY id',[user.office,channel]);const records=[];for(const row of rows)records.push(await record(tx,user,row.id,channel));
 const instruments:IntegrationState['instruments']=[];
 if(channel==='sunarp'){const cases=await query<{id:string;kardex:string}>(tx,'SELECT id,kardex FROM case_records WHERE office_id=$1 ORDER BY kardex DESC',[user.office]);for(const c of cases){const events=await procedureEvents(tx,c.id);for(const e of events)if(e.kind==='authorize'&&instrumentActive(events,e.id))instruments.push({id:e.id,caseId:c.id,label:c.kardex+' · '+String(e.data.number)});}}
 const documents=channel==='fiscal'?await query<IntegrationState['documents'][number]>(tx,'SELECT id,reference,xml_sha256 AS "xmlHash" FROM fiscal_documents WHERE office_id=$1 ORDER BY reference',[user.office]):[];
 const evidence=channel==='sunarp'?await query<IntegrationState['evidence'][number]>(tx,`SELECT v.id,c.id AS "caseId",c.kardex||' · '||d.title||' v'||v.version AS label FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN case_participants p ON p.person_id=d.person_id JOIN case_records c ON c.id=p.case_id WHERE d.office_id=$1 AND c.office_id=$1 AND v.status='liberado' ORDER BY c.kardex,d.title`,[user.office]):[];
 await audit(tx,user.id,'integration.read',channel);return {channel,revision:s?.revision||1,realEnabled:false,requirements:requirements[channel],records,instruments,documents,evidence};
 });}
export async function executeIntegration(db:Kysely<Database>,user:Actor,raw:unknown){const c=integrationCommand.parse(raw);allow(user,c.channel);
 if(['signature','validation','receipt'].includes(c.type)&&user.role!=='notario')fail('La constancia de firma o cargo corresponde a Notario.',403);
 if(c.type==='assessment'&&!['administracion','notario'].includes(user.role))fail('La evaluación corresponde a Administración o Notario.',403);
 const hash=integrationHash(c);return db.transaction().execute(async tx=>{
 // Case precedes channel; this order also protects against concurrent procedure voids.
 let caseId='caseId' in c?c.caseId:null;
 if('recordId' in c){const [r]=await query<{case_id:string|null}>(tx,'SELECT case_id FROM integration_records WHERE id=$1 AND office_id=$2 AND channel=$3',[c.recordId,user.office,c.channel]);if(!r)fail('Registro no disponible.',404);caseId=r.case_id;}
 if(caseId){const found=await query(tx,'SELECT id FROM case_records WHERE id=$1 AND office_id=$2 FOR UPDATE',[caseId,user.office]);if(!found.length)fail('Expediente no disponible.',404);}
 await query(tx,'INSERT INTO integration_state(office_id,channel) VALUES($1,$2) ON CONFLICT DO NOTHING',[user.office,c.channel]);const [s]=await query<{revision:number}>(tx,'SELECT revision FROM integration_state WHERE office_id=$1 AND channel=$2 FOR UPDATE',[user.office,c.channel]);
 const [prior]=await query<{office_id:string;actor_id:string;request_hash:string;result:{id:string}}>(tx,'SELECT * FROM integration_requests WHERE request_id=$1',[c.requestId]);if(prior){if(prior.office_id!==user.office||prior.actor_id!==user.id||prior.request_hash!==hash)fail('La clave de solicitud ya se utilizó con otros datos.');return prior.result;}if(s.revision!==c.revision)fail('El canal cambió. Actualiza el contexto conservando datos.');
 const id='recordId' in c?c.recordId:randomUUID(),r='recordId' in c?await record(tx,user,id,c.channel):null;
 let data:Record<string,unknown>={...c,realEnabled:false};delete data.requestId;delete data.revision;let title='',content:string|undefined;
 if(c.type==='assessment'){title='Evaluación · '+c.responsible;data={...data,requirements:requirements[c.channel],status:'declarado-no-habilita',mode:'declaration'};}
 if(c.type==='spike'){title='Contrato de identidad · '+c.device;data={...data,...identityContractSpike(),deviceStatus:'descrito-no-probado'};}
 if(c.type==='transfer'){
  const events=await procedureEvents(tx,c.caseId),e=events.find(e=>e.id===c.instrumentId&&e.kind==='authorize');if(!e||!instrumentActive(events,e.id))fail('Selecciona un instrumento local activo.');
  const [draft]=await query<{body:string;snapshot:unknown;sha256:string}>(tx,'SELECT body,snapshot,sha256 FROM case_drafts WHERE id=$1 AND case_id=$2',[e.data.draftId,c.caseId]);if(!draft||draft.sha256!==e.data.draftHash||integrationHash({body:draft.body,snapshot:draft.snapshot})!==draft.sha256)fail('No coincide el documento de origen.',503);
  content=canonicalJSON({contract:'notariaos-transfer-review-v1',warning:'SIMULACIÓN · SIN FIRMA NI VALIDEZ NOTARIAL · NO PRESENTADO',recordId:id,caseId:c.caseId,instrument:e});const manifestHash=createHash('sha256').update(content).digest('hex');title='Traslado de ejercicio · '+String(e.data.number);data={...data,mode:'simulation',source:e,artifactHash:manifestHash,manifestHash,status:'preparado-no-presentado'};
 }
 if(c.type==='assisted'){
  const file=await released(tx,user,c.caseId,c.evidenceId);content=canonicalJSON({contract:'notariaos-external-tracking-v1',warning:'REFERENCIA EXTERNA DECLARADA · NO VERIFICA FIRMA NI PRESENTACIÓN',recordId:id,caseId:c.caseId,file});const manifestHash=createHash('sha256').update(content).digest('hex');title='Archivo externo · '+file.title;data={...data,file,artifactHash:file.sha256,manifestHash,mode:'declaration',status:'archivo-sin-validacion-acreditada'};
 }
 if(r){
  if(!['transfer','assisted'].includes(r.kind))fail('Selecciona un traslado o archivo externo.',400);await artifact(tx,r);const first=r.events[0].data;
  if(r.kind==='transfer'){const events=await procedureEvents(tx,r.case_id!);if(!instrumentActive(events,String(first.instrumentId)))fail('El instrumento fue dejado sin efecto. Conserva el historial sin nuevos cargos.');}
  else await released(tx,user,r.case_id!,String(first.evidenceId));
  const mode=r.kind==='transfer'?'simulation':'declaration';data={...data,mode,verifiedExternally:false};
  if(c.type==='signature'||c.type==='validation'){
   if(r.events.some(e=>e.kind==='receipt'))fail('El cargo congela la validación utilizada. Abre otro registro para otro archivo.');if(c.artifactHash!==first.artifactHash)fail('La validación no corresponde a la huella exacta.');
   if(c.type==='signature'){if(r.kind!=='transfer')fail('El archivo externo requiere informe declarado, no simulador.',400);data={...data,...signatureAdapter.validate(c.artifactHash,c.outcome)};}
   else {if(r.kind!=='assisted')fail('Un traslado simulado no admite informe real.',400);past(c.occurredAt);if(c.reportId===first.evidenceId)fail('El informe debe ser una versión distinta del archivo evaluado.',400);data={...data,report:await released(tx,user,r.case_id!,c.reportId),status:'informe-declarado-no-verificado'};}
  }
  if(c.type==='receipt'){
   past(c.occurredAt);if(mode==='declaration'){if(!c.proofId||c.proofId===first.evidenceId)fail('Selecciona la versión privada del cargo externo.',400);data={...data,proof:await released(tx,user,r.case_id!,c.proofId)};}else if(c.proofId)fail('Un cargo simulado no admite sustento externo.',400);
   if(r.events.some(e=>e.kind==='receipt'))fail('Ya hay un cargo. Conserva la referencia original.');const validation=r.events.filter(e=>['signature','validation'].includes(e.kind)).at(-1);
   if(!validation||validation.id!==c.validationId||validation.data.outcome!=='valid'||validation.data.artifactHash!==c.artifactHash||c.artifactHash!==first.artifactHash)fail('Falta una validación vigente favorable de la huella exacta.');
   if(validation.kind==='validation'&&new Date(c.occurredAt)<new Date(String(validation.data.occurredAt)))fail('El cargo no puede preceder al informe de firma.',400);data={...data,status:mode==='simulation'?'cargo-simulado-no-presentado':'cargo-externo-declarado-no-verificado'};
  }
  if(c.type==='tracking'){
   past(c.occurredAt);const receipt=r.events.find(e=>e.kind==='receipt'&&e.id===c.receiptId);if(!receipt)fail('Registra el cargo exacto antes del seguimiento.');const previous=r.events.filter(e=>['receipt','tracking'].includes(e.kind)).at(-1)!;if(new Date(c.occurredAt)<new Date(String(previous.data.occurredAt)))fail('El seguimiento no puede preceder al hito anterior.',400);if(r.events.some(e=>e.kind==='tracking'&&['inscrito','tachado'].includes(String(e.data.status))))fail('El seguimiento terminó; una corrección requiere otro registro explícito.');data={...data,classification:mode==='simulation'?'resultado-simulado':'resultado-declarado-no-verificado'};
  }
 }
 if(c.type==='demo'){
  past(c.occurredAt);const [d]=await query<{reference:string;xml_sha256:string;xml:string}>(tx,'SELECT reference,xml_sha256,xml FROM fiscal_documents WHERE id=$1 AND office_id=$2',[c.documentId,user.office]);if(!d)fail('Documento fiscal no disponible.',404);if(d.xml_sha256!==c.xmlHash||createHash('sha256').update(d.xml).digest('hex')!==c.xmlHash)fail('La evidencia no corresponde al XML exacto.');title='Demo declarada · '+d.reference;data={...data,mode:'declaration',status:'no-verificado-no-CDR',sourceReference:d.reference,affectsFiscalStatus:false};
 }
 if(!r)await query(tx,'INSERT INTO integration_records(id,office_id,channel,kind,title,case_id) VALUES($1,$2,$3,$4,$5,$6)',[id,user.office,c.channel,c.type,title,caseId]);
 if(content)await query(tx,'INSERT INTO integration_artifacts(id,content,sha256) VALUES($1,$2,$3)',[id,content,createHash('sha256').update(content).digest('hex')]);
 const sequence=(r?.events.length||0)+1,eventId=randomUUID(),sha256=integrationHash({recordId:id,sequence,kind:c.type,data,previous:r?.events.at(-1)?.sha256||''});
 await query(tx,'INSERT INTO integration_events(id,record_id,sequence,kind,data,sha256,actor_id) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7)',[eventId,id,sequence,c.type,JSON.stringify(data),sha256,user.id]);await query(tx,'UPDATE integration_state SET revision=revision+1 WHERE office_id=$1 AND channel=$2',[user.office,c.channel]);const result={id,eventId};await query(tx,'INSERT INTO integration_requests(request_id,office_id,actor_id,request_hash,result) VALUES($1,$2,$3,$4,$5::jsonb)',[c.requestId,user.office,user.id,hash,JSON.stringify(result)]);await audit(tx,user.id,'integration.'+c.type,c.channel);return result;
 });}
export async function downloadIntegration(db:Kysely<Database>,user:Actor,id:string,channel:IntegrationChannel){allow(user,channel);return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{const r=await record(tx,user,id,channel);const a=await artifact(tx,r);await audit(tx,user.id,'integration.download',channel);return a.content;});}
