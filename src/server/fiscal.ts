import {createHash,randomUUID} from 'node:crypto';
import QRCode from 'qrcode';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {HttpError,hasPermission,type actor,type Permission} from './access.ts';
import {canonicalJSON,type QuoteLine} from '../lib/case-domain.ts';
import {fiscalCommand,fiscalLines,fiscalContractVersion,simulatedIssuer,simulationLegend,type FiscalEventResponse,type FiscalCommand,type FiscalData,type FiscalDetail,type FiscalDocument,type FiscalSnapshot,type FiscalStatus} from '../lib/fiscal-domain.ts';
import {limaDate} from '../lib/domain.ts';
import {buildFiscalXML,buildFiscalQR} from './fiscal-xml.ts';
import {simulatedFiscalAdapter,adapterResponse,canSubmit,canConsult,canDiscard,type FiscalAdapter,type AdapterInput,type AdapterResponse} from './fiscal-adapter.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export const hashFiscal=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const cols=`d.id,d.reference,d.document_type,d.issue_date::text,d.source_charge_id,d.total::text,d.tax::text,d.scenario,d.created_at,u.name AS author,p.status,p.revision,EXISTS(SELECT 1 FROM finance_entries r WHERE r.reverses_id=d.source_charge_id) AS source_reversed`;
type Stored=FiscalDocument&{snapshot:FiscalSnapshot;snapshot_hash:string;xml:string;xml_sha256:string;qr_payload:string;qr_png:Uint8Array;qr_sha256:string};
export function fiscalPermission(c:FiscalCommand):Permission{return c.type==='prepare'||c.type==='discard'?'fiscal:prepare':'fiscal:simulate';}
export async function fiscalOverview(db:Kysely<Database>,user:Actor,page=1,pageSize=20):Promise<FiscalData>{
  if(!hasPermission(user.role,'fiscal:read'))throw new HttpError(403,'Tu perfil no tiene acceso al laboratorio fiscal.');
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,'fiscal.list','office:'+user.office);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM fiscal_state WHERE office_id=$1',[user.office]);
    const [count]=await query<{total:number}>(tx,'SELECT count(*)::int AS total FROM fiscal_documents WHERE office_id=$1',[user.office]);
    const documents=await query<FiscalDocument>(tx,`SELECT ${cols} FROM fiscal_documents d JOIN fiscal_projection p ON p.document_id=d.id JOIN "user" u ON u.id=d.created_by WHERE d.office_id=$1 ORDER BY d.created_at DESC,d.id DESC LIMIT $2 OFFSET $3`,[user.office,pageSize,(page-1)*pageSize]);
    const charges=await query<FiscalData['charges'][number]>(tx,`SELECT e.id,e.reference,e.snapshot->>'kardex' AS kardex,e.snapshot->>'name' AS person_name,e.amount::text,q.version AS quote_version,q.lines FROM finance_entries e JOIN case_quotes q ON q.id=e.quote_id WHERE e.office_id=$1 AND e.kind='charge' AND NOT EXISTS(SELECT 1 FROM finance_entries r WHERE r.reverses_id=e.id) AND NOT EXISTS(SELECT 1 FROM fiscal_projection p WHERE p.source_charge_id=e.id AND p.status<>'discarded') ORDER BY e.sequence DESC`,[user.office]);
    return {revision:state?.revision||0,documents,total:count.total,page,pageSize,charges:charges.map(c=>({...c,lines:c.lines.filter(l=>l.category!=='Terceros')}))};
  });
}
async function stored(tx:Connection,user:Actor,id:string){
  const [d]=await query<Stored>(tx,`SELECT ${cols},d.snapshot,d.snapshot_hash,d.xml,d.xml_sha256,d.qr_payload,d.qr_png,d.qr_sha256 FROM fiscal_documents d JOIN fiscal_projection p ON p.document_id=d.id JOIN "user" u ON u.id=d.created_by WHERE d.id=$1 AND d.office_id=$2`,[id,user.office]);
  if(!d)throw new HttpError(404,'Documento de prueba no disponible.');return d;
}
function verifyArtifact(d:Stored){if(hashFiscal(canonicalJSON(d.snapshot))!==d.snapshot_hash||hashFiscal(d.xml)!==d.xml_sha256||hashFiscal(d.qr_png)!==d.qr_sha256||buildFiscalQR(d.snapshot,d.xml_sha256)!==d.qr_payload)throw new HttpError(503,'La integridad del documento de prueba no coincide. No se confirma la operación.');}
export async function fiscalDetail(db:Kysely<Database>,user:Actor,id:string):Promise<FiscalDetail>{
  if(!hasPermission(user.role,'fiscal:read'))throw new HttpError(403,'Tu perfil no tiene acceso al laboratorio fiscal.');
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    const d=await stored(tx,user,id);verifyArtifact(d);await audit(tx,user.id,'fiscal.read',id);
    const events=await query<FiscalDetail['events'][number]>(tx,'SELECT e.id,e.version,e.operation,e.status,e.response,e.note,e.created_at,u.name AS actor FROM fiscal_events e JOIN "user" u ON u.id=e.actor_id WHERE e.document_id=$1 ORDER BY e.version DESC',[id]);
    return {id:d.id,reference:d.reference,document_type:d.document_type,issue_date:d.issue_date,source_charge_id:d.source_charge_id,total:d.total,tax:d.tax,status:d.status,revision:d.revision,scenario:d.scenario,created_at:d.created_at,author:d.author,source_reversed:d.source_reversed,snapshot:d.snapshot,xml_sha256:d.xml_sha256,qr_sha256:d.qr_sha256,qr_payload:d.qr_payload,events};
  });
}
export async function fiscalArtifact(db:Kysely<Database>,user:Actor,id:string,kind:'xml'|'qr'|'response'){
  if(!hasPermission(user.role,'fiscal:read'))throw new HttpError(403,'Tu perfil no tiene acceso al laboratorio fiscal.');
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    const d=await stored(tx,user,id);verifyArtifact(d);await audit(tx,user.id,'fiscal.download.'+kind,id);
    if(kind==='xml')return {bytes:Buffer.from(d.xml),type:'application/xml; charset=utf-8',filename:d.reference+'-SIN-VALIDEZ.xml'};
    if(kind==='qr')return {bytes:Buffer.from(d.qr_png),type:'image/png',filename:d.reference+'-SIMULACION.png'};
    const [event]=await query<{response:FiscalEventResponse}>(tx,'SELECT response FROM fiscal_events WHERE document_id=$1 ORDER BY version DESC LIMIT 1',[id]);
    return {bytes:Buffer.from(JSON.stringify({legend:simulationLegend,contract:fiscalContractVersion,reference:d.reference,xmlSha256:d.xml_sha256,response:event.response},null,2)),type:'application/json; charset=utf-8',filename:d.reference+'-resultado-simulado.json'};
  });
}
export async function mutateFiscal(db:Kysely<Database>,user:Actor,raw:unknown,adapter:FiscalAdapter=simulatedFiscalAdapter){
  const c=fiscalCommand.parse(raw);if(!hasPermission(user.role,fiscalPermission(c)))throw new HttpError(403,'Tu perfil no tiene permiso para esta acción fiscal de prueba.');
  if(adapter.mode!=='simulation')throw new HttpError(403,'Solo está habilitado el adaptador local simulado.');
  const hash=hashFiscal(canonicalJSON(c));
  return db.transaction().execute(async tx=>{
    // Same ordering as finance: finance state before any case/financial source.
    await query(tx,'INSERT INTO finance_state(office_id) VALUES($1) ON CONFLICT DO NOTHING',[user.office]);
    await query(tx,'SELECT office_id FROM finance_state WHERE office_id=$1 FOR UPDATE',[user.office]);
    await query(tx,'INSERT INTO fiscal_state(office_id) VALUES($1) ON CONFLICT DO NOTHING',[user.office]);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM fiscal_state WHERE office_id=$1 FOR UPDATE',[user.office]);
    const [prior]=await query<{actor_id:string;hash:string;result:{id:string;status:FiscalStatus;revision:number;reference:string}}>(tx,'SELECT actor_id,hash,result FROM fiscal_requests WHERE office_id=$1 AND request_id=$2',[user.office,c.requestId]);
    if(prior){if(prior.actor_id!==user.id||prior.hash!==hash)throw new HttpError(409,'La clave de solicitud ya se usó con otros datos o responsable.');return prior.result;}
    if(state.revision!==c.revision)throw new HttpError(409,'El laboratorio fiscal cambió. Actualiza el contexto; tu formulario se conserva.');
    let id:string,reference:string,revision:number,status:FiscalStatus;
    let response:FiscalEventResponse;let note='';
    if(c.type==='prepare'){
      const [charge]=await query<{id:string;reference:string;case_id:string;person_id:string;quote_id:string;version:number;amount:string;lines:QuoteLine[]}>(tx,`SELECT e.id,e.reference,e.case_id,e.person_id,e.quote_id,e.amount::text,q.version,q.lines FROM finance_entries e JOIN case_quotes q ON q.id=e.quote_id WHERE e.id=$1 AND e.office_id=$2 AND e.kind='charge' AND NOT EXISTS(SELECT 1 FROM finance_entries r WHERE r.reverses_id=e.id)`,[c.chargeId,user.office]);
      if(!charge)throw new HttpError(404,'Selecciona un cargo propio de presupuesto vigente y no revertido.');
      if(c.documentType==='01'&&c.receiver.documentType!=='6')throw new HttpError(400,'La factura de prueba requiere receptor con RUC de 11 dígitos.');
      let amounts:ReturnType<typeof fiscalLines>;try{amounts=fiscalLines(charge.lines.filter(l=>l.category!=='Terceros'),c.taxes,charge.amount);}catch(e){throw new HttpError(400,(e as Error).message);}
      if((await query(tx,"SELECT document_id FROM fiscal_projection WHERE source_charge_id=$1 AND status<>'discarded'",[charge.id])).length)throw new HttpError(409,'Este cargo ya tiene un documento de prueba activo. Consulta su historial.');
      const [counter]=await query<{sequence:number}>(tx,'INSERT INTO fiscal_series(office_id,document_type,sequence) VALUES($1,$2,1) ON CONFLICT(office_id,document_type) DO UPDATE SET sequence=fiscal_series.sequence+1 RETURNING sequence',[user.office,c.documentType]);
      if(counter.sequence>99999999)throw new HttpError(409,'La serie interna de pruebas agotó su rango.');
      id=randomUUID();const series=c.documentType==='01'?'SIM-F001':'SIM-B001';reference=series+'-'+String(counter.sequence).padStart(8,'0');status='prepared';revision=1;
      const snapshot:FiscalSnapshot={contractVersion:fiscalContractVersion,mode:'simulation',issuer:simulatedIssuer,receiver:c.receiver,documentType:c.documentType,issueDate:limaDate(),reference,series,sequence:counter.sequence,source:{chargeId:charge.id,chargeReference:charge.reference,caseId:charge.case_id,personId:charge.person_id,quoteId:charge.quote_id,quoteVersion:charge.version},...amounts,legend:simulationLegend};
      const xml=buildFiscalXML(snapshot),xmlHash=hashFiscal(xml),qrPayload=buildFiscalQR(snapshot,xmlHash);
      const png=await QRCode.toBuffer(qrPayload,{type:'png',errorCorrectionLevel:'M',margin:4,scale:5});
      await query(tx,'INSERT INTO fiscal_documents(id,office_id,reference,sequence,document_type,source_charge_id,issue_date,scenario,contract_version,snapshot,snapshot_hash,total,tax,xml,xml_sha256,qr_payload,qr_png,qr_sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)',[id,user.office,reference,counter.sequence,c.documentType,charge.id,snapshot.issueDate,c.scenario,fiscalContractVersion,JSON.stringify(snapshot),hashFiscal(canonicalJSON(snapshot)),snapshot.total,snapshot.tax,xml,xmlHash,qrPayload,png,hashFiscal(png),user.id]);
      await query(tx,'INSERT INTO fiscal_projection(document_id,source_charge_id,status,revision) VALUES($1,$2,$3,1)',[id,charge.id,status]);
      response={mode:'simulation',status:'prepared',code:'SIM-PREPARED',description:'Artefactos locales preparados, sin envío ni firma.'};
    }else{
      const d=await stored(tx,user,c.documentId);verifyArtifact(d);id=d.id;reference=d.reference;revision=d.revision+1;
      if(d.revision!==c.documentRevision)throw new HttpError(409,'El documento cambió. Actualiza su estado antes de continuar.');
      if(c.type==='discard'){
        if(!canDiscard(d.status))throw new HttpError(409,'No se descarta un documento aceptado, en proceso o de resultado desconocido. Consulta primero.');
        status='discarded';note=c.reason;response={mode:'simulation',status:'discarded',code:'SIM-DISCARDED',description:'Descarte interno del documento de prueba; no es baja ni nota fiscal.'};
      }else{
        if(c.type==='submit'&&(!canSubmit(d.status)||d.source_reversed))throw new HttpError(409,'No se puede simular otro envío en este estado o con cargo revertido. Consulta si hay resultado desconocido.');
        if(c.type==='consult'&&!canConsult(d.status))throw new HttpError(409,'La consulta corresponde a documentos en proceso o con resultado desconocido.');
        const [receipt]=await query<{xml_hash:string;response:AdapterResponse}>(tx,'SELECT xml_hash,response FROM fiscal_sim_receipts WHERE document_id=$1',[id]);
        const [attempts]=await query<{n:number}>(tx,"SELECT count(*)::int AS n FROM fiscal_events WHERE document_id=$1 AND operation='submit'",[id]);
        const input:AdapterInput={key:id,xmlHash:d.xml_sha256,scenario:d.scenario,attempt:attempts.n+1,receipt:receipt?{key:id,xmlHash:receipt.xml_hash,response:receipt.response}:null};
        let remote:AdapterInput['receipt']=null;
        try{
          if(c.type==='submit'){const result=adapter.submit(input);if(result.key!==id||result.xmlHash!==d.xml_sha256)throw new Error('Respuesta ajena');response=adapterResponse.parse(result.observed);remote=result.receipt;if(remote){adapterResponse.parse(remote.response);if(remote.key!==id||remote.xmlHash!==d.xml_sha256||!['accepted','rejected'].includes(remote.response.status))throw new Error('Respuesta de otra clave o contenido.');}}
          else{const result=adapter.consult(input);if(result.key!==id||result.xmlHash!==d.xml_sha256)throw new Error('Respuesta ajena');response=adapterResponse.parse(result.observed);}
        }catch{remote=null;response={mode:'simulation',status:'unknown',code:'SIM-INVALID-RESPONSE',description:'Respuesta inesperada del adaptador simulado; no se afirma aceptación.'};}
        status=response.status;
        if(remote&&!receipt)await query(tx,'INSERT INTO fiscal_sim_receipts(document_id,xml_hash,response) VALUES($1,$2,$3)',[id,remote.xmlHash,JSON.stringify(remote.response)]);
      }
      await query(tx,'UPDATE fiscal_projection SET status=$1,revision=$2 WHERE document_id=$3',[status,revision,id]);
    }
    await query(tx,'INSERT INTO fiscal_events(id,document_id,version,operation,status,response,note,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),id,revision,c.type,status,JSON.stringify(response),note,user.id]);
    await audit(tx,user.id,'fiscal.'+c.type,id);
    await query(tx,'UPDATE fiscal_state SET revision=revision+1 WHERE office_id=$1',[user.office]);
    const result={id,reference,status,revision};await query(tx,'INSERT INTO fiscal_requests(office_id,request_id,actor_id,hash,result) VALUES($1,$2,$3,$4,$5)',[user.office,c.requestId,user.id,hash,JSON.stringify(result)]);return result;
  });
}
