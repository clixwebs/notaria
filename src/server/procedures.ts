import {randomUUID,createHash} from 'node:crypto';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {HttpError,hasPermission,type actor} from './access.ts';
import {canonicalJSON,type PersonSnapshot} from '../lib/case-domain.ts';
import {procedureCommand,procedurePolicyVersion,latestIdentities,instrumentActive,internalRecord,type ProcedureEvent,type ProcedureState,type IdentityEvidence,type Instrument} from '../lib/procedure-domain.ts';
import {identityAdapter} from './identity-adapter.ts';
import {limaDate} from '../lib/domain.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export const procedureHash=(v:unknown)=>createHash('sha256').update(canonicalJSON(v)).digest('hex');
function allow(user:Actor,p:'procedure:read'|'procedure:write'|'procedure:authorize'){if(!hasPermission(user.role,p))throw new HttpError(403,'Tu perfil no tiene permiso para esta acción del procedimiento.');}
export async function procedureEvents(tx:Connection,id:string){
  const rows=await query<ProcedureEvent&{sha256:string}>(tx,'SELECT e.id,e.kind,e.data,e.sha256,e.created_at::text,u.name AS author FROM procedure_events e JOIN "user" u ON u.id=e.actor_id WHERE e.case_id=$1 ORDER BY e.sequence',[id]);
  for(const e of rows)if(procedureHash({kind:e.kind,data:e.data})!==e.sha256)throw new HttpError(503,'La huella de un evento del procedimiento no coincide.');return rows;
}
export async function procedureState(db:Kysely<Database>,user:Actor,id:string):Promise<ProcedureState>{
  allow(user,'procedure:read');return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    const [r]=await query<{revision:number}>(tx,'SELECT revision FROM case_records WHERE id=$1 AND office_id=$2',[id,user.office]);if(!r)throw new HttpError(404,'Expediente no disponible.');
    const events=await procedureEvents(tx,id);await audit(tx,user.id,'procedure.read',id);
    const assignees=await query<{id:string;name:string}>(tx,`SELECT s.user_id AS id,u.name FROM staff s JOIN "user" u ON u.id=s.user_id WHERE s.office_id=$1 AND s.active AND s.role IN ('administracion','recepcion','abogado','notario') ORDER BY u.name`,[user.office]);
    const evidence=await query<ProcedureState['evidence'][number]>(tx,`SELECT v.id,d.title,v.version,d.person_id,v.status FROM document_versions v JOIN private_documents d ON d.id=v.document_id WHERE d.office_id=$2 AND v.status='liberado' AND EXISTS(SELECT 1 FROM case_participants p WHERE p.case_id=$1 AND p.person_id=d.person_id) ORDER BY d.title,v.version DESC`,[id,user.office]);
    return {revision:r.revision,mode:'simulation',events,identities:latestIdentities(events),instruments:events.filter(e=>e.kind==='authorize').map(e=>e.data as Instrument),assignees,evidence};
  });
}
export async function mutateProcedure(db:Kysely<Database>,user:Actor,id:string,raw:unknown){
  const c=procedureCommand.parse(raw);allow(user,['identity-exception','authorize','void','certificate'].includes(c.type)?'procedure:authorize':'procedure:write');
  const hash=procedureHash({caseId:id,command:c});return db.transaction().execute(async tx=>{
    // All procedure mutations serialize with drafts, participants, requirements and templates on the case row.
    const [r]=await query<{revision:number;content_revision:number;act:string}>(tx,'SELECT revision,content_revision,act FROM case_records WHERE id=$1 AND office_id=$2 FOR UPDATE',[id,user.office]);if(!r)throw new HttpError(404,'Expediente no disponible.');
    const [previous]=await query<{office_id:string;actor_id:string;request_hash:string;result:{id:string}}>(tx,'SELECT * FROM procedure_requests WHERE request_id=$1',[c.requestId]);
    if(previous){if(previous.office_id!==user.office||previous.actor_id!==user.id||previous.request_hash!==hash)throw new HttpError(409,'La clave de solicitud ya se utilizó con otros datos.');return previous.result;}
    if(c.revision!==r.revision)throw new HttpError(409,'El expediente cambió. Actualiza el contexto y revisa los datos; el formulario se conserva.');
    const events=await procedureEvents(tx,id),identities=latestIdentities(events),eventId=randomUUID();
    const participants=await query<{id:string;person_id:string;snapshot:PersonSnapshot;role:string}>(tx,'SELECT id,person_id,snapshot,role FROM case_participants WHERE case_id=$1 ORDER BY created_at,id',[id]);
    const participant=(pid:string)=>{const p=participants.find(p=>p.id===pid);if(!p)throw new HttpError(400,'Selecciona un interviniente de este expediente.');return p;};
    const [draft]=await query<{id:string;body:string;sha256:string;snapshot:unknown}>(tx,'SELECT id,body,sha256,snapshot FROM case_drafts WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[id]);
    const requireDraft=(draftId:string)=>{if(!draft||draft.id!==draftId)throw new HttpError(409,'Selecciona el borrador vigente.');if(procedureHash({body:draft.body,snapshot:draft.snapshot})!==draft.sha256)throw new HttpError(503,'La huella del borrador no coincide.');return draft;};
    async function evidence(eid:string,pid?:string){const rows=await query(tx,`SELECT v.id FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN case_participants p ON p.person_id=d.person_id WHERE v.id=$1 AND d.office_id=$2 AND p.case_id=$3 AND v.status='liberado' AND ($4::uuid IS NULL OR p.id=$4) FOR SHARE OF v`,[eid,user.office,id,pid||null]);if(!rows.length)throw new HttpError(400,'El sustento debe ser una versión liberada del interviniente correspondiente a este expediente.');}
    function active(iid:string){const e=events.find(e=>e.id===iid&&e.kind==='authorize');if(!e||!instrumentActive(events,iid))throw new HttpError(409,'El instrumento no existe o fue dejado sin efecto.');return e.data as Instrument;}
    function editable(iid:string){const i=active(iid);if(events.some(e=>e.kind==='delivery'&&e.data.instrumentId===iid))throw new HttpError(409,'La entrega ya cerró este recorrido. Registra una incidencia antes de otro instrumento.');return i;}
    let data:Record<string,unknown>;
    switch(c.type){
      case 'identity':{
        const p=participant(c.participantId);requireDraft(c.draftId);
        if(identities.some(i=>i.participantId===p.id&&i.draftId===c.draftId&&i.result==='desconocido'))throw new HttpError(409,'Consulta el resultado desconocido antes de otro intento.');
        data={id:eventId,participantId:p.id,draftId:c.draftId,snapshot:p.snapshot,...identityAdapter.check(c.scenario),note:c.note};break;
      }
      case 'identity-resolve':case 'identity-exception':{
        const attempt=identities.find(i=>i.id===c.attemptId);if(!attempt)throw new HttpError(409,'La evidencia de identidad cambió.');requireDraft(attempt.draftId);
        if(c.type==='identity-resolve'&&attempt.result!=='desconocido')throw new HttpError(409,'Solo se consulta un resultado desconocido.');
        if(c.type==='identity-exception'&&['coincide','excepcion','desconocido'].includes(attempt.result))throw new HttpError(409,'La excepción exige una contingencia conocida; consulta primero el resultado desconocido.');
        if(c.type==='identity-exception')await evidence(c.evidenceId,attempt.participantId);
        data={...attempt,id:eventId,attemptId:attempt.id,result:c.type==='identity-exception'?'excepcion':identityAdapter.check(c.scenario).result,note:c.note,mode:'simulation',...(c.type==='identity-exception'?{evidenceId:c.evidenceId,acknowledge:true}:{})};break;
      }
      case 'grant':{
        const p=participant(c.participantId);requireDraft(c.draftId);const identity=identities.find(i=>i.participantId===p.id&&i.draftId===c.draftId);
        if(!identity||identity.id!==c.identityId||!['coincide','excepcion'].includes(identity.result))throw new HttpError(409,'Falta identificación o excepción vigente para esta versión.');
        await evidence(c.evidenceId,p.id);data={participantId:p.id,snapshot:p.snapshot,draftId:c.draftId,draftHash:draft.sha256,identityId:identity.id,contentRevision:r.content_revision,evidenceId:c.evidenceId,note:c.note,acknowledge:true,mode:'simulation',act:r.act};break;
      }
      case 'authorize':{
        const d=requireDraft(c.draftId);
        if(events.some(e=>e.kind==='authorize'&&instrumentActive(events,e.id)))throw new HttpError(409,'Ya existe un instrumento activo. Una corrección requiere incidencia del notario; el número anterior se conserva.');
        const requirements=await query<{done:boolean}>(tx,'SELECT id,title,done,note,evidence_id FROM case_requirements WHERE case_id=$1 ORDER BY title,id',[id]);
        if(requirements.some(q=>!q.done))throw new HttpError(409,'Faltan requisitos por revisar.');
        const reviewed=await query(tx,'SELECT id FROM case_draft_reviews WHERE draft_id=$1 AND context_revision=$2',[d.id,r.content_revision]);if(!reviewed.length)throw new HttpError(409,'Falta revisión profesional de la versión y contexto vigentes.');
        const grants:ProcedureEvent[]=[],used:IdentityEvidence[]=[];
        for(const p of participants){const identity=identities.find(i=>i.participantId===p.id&&i.draftId===d.id);if(!identity||!['coincide','excepcion'].includes(identity.result))throw new HttpError(409,'Falta identificación o excepción vigente de un interviniente.');
          const grant=[...events].reverse().find(e=>e.kind==='grant'&&e.data.participantId===p.id&&e.data.draftId===d.id&&e.data.identityId===identity.id&&e.data.contentRevision===r.content_revision);
          if(!grant)throw new HttpError(409,'Falta comparecencia / conformidad de un interviniente para esta versión y contexto.');await evidence(String(grant.data.evidenceId),p.id);if(identity.evidenceId)await evidence(identity.evidenceId,p.id);used.push(identity);grants.push(grant);}
        const year=Number(limaDate().slice(0,4));
        await query(tx,'INSERT INTO instrument_counters(office_id,year,act) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[user.office,year,r.act]);
        const [n]=await query<{value:number;folio:number}>(tx,'UPDATE instrument_counters SET value=value+1,folio=folio+$4 WHERE office_id=$1 AND year=$2 AND act=$3 RETURNING value,folio',[user.office,year,r.act,c.folios]);
        const series=r.act==='Compraventa'?'ESCR':r.act==='Carta notarial'?'CARTA':'CERT';
        data={id:eventId,number:`SIM-${series}-${year}-${String(n.value).padStart(6,'0')}`,act:r.act,draftId:d.id,draftHash:d.sha256,body:d.body,contentRevision:r.content_revision,folioStart:n.folio-c.folios+1,folioEnd:n.folio,participants,requirements,identities:used,grants,note:c.note,mode:'simulation',acknowledge:true};break;
      }
      case 'void':active(c.instrumentId);data={instrumentId:c.instrumentId,note:c.note};break;
      case 'schedule':{
        const i=editable(c.instrumentId);if(i.act!=='Carta notarial')throw new HttpError(400,'Las diligencias corresponden a cartas notariales.');
        if(events.some(e=>e.kind==='certificate'&&e.data.instrumentId===i.id))throw new HttpError(409,'La constancia ya cerró los intentos de esta carta.');
        if(events.some(e=>e.kind==='schedule'&&e.data.instrumentId===i.id&&!events.some(r=>r.kind==='diligence'&&r.data.attemptId===e.id)))throw new HttpError(409,'Registra el resultado del intento pendiente antes de programar otro.');
        const [assignee]=await query<{name:string}>(tx,`SELECT u.name FROM staff s JOIN "user" u ON u.id=s.user_id WHERE s.user_id=$1 AND s.office_id=$2 AND s.active AND s.role IN ('administracion','recepcion','abogado','notario') FOR SHARE OF s`,[c.assigneeId,user.office]);if(!assignee)throw new HttpError(400,'Responsable no habilitado en esta oficina.');
        data={instrumentId:i.id,recipient:c.recipient,address:c.address,scheduledAt:c.scheduledAt,assigneeId:c.assigneeId,assignee:assignee.name,note:c.note};break;
      }
      case 'diligence':case 'diligence-resolve':{
        const attempt=events.find(e=>e.id===c.attemptId&&e.kind==='schedule');if(!attempt)throw new HttpError(400,'Intento no disponible.');editable(String(attempt.data.instrumentId));
        const priorResult=[...events].reverse().find(e=>['diligence','diligence-resolve'].includes(e.kind)&&e.data.attemptId===attempt.id);
        if(c.type==='diligence-resolve'&&priorResult?.data.outcome!=='desconocido')throw new HttpError(409,'Solo se aclara un resultado desconocido.');
        if(c.type==='diligence'&&priorResult)throw new HttpError(409,'Este intento ya tiene resultado. Conserva el resultado y programa otro si corresponde.');
        if(Date.parse(c.occurredAt)>Date.now())throw new HttpError(400,'El resultado no puede ocurrir en el futuro.');
        await evidence(c.evidenceId);data={attemptId:attempt.id,instrumentId:attempt.data.instrumentId,outcome:c.outcome,occurredAt:c.occurredAt,evidenceId:c.evidenceId,note:c.note};break;
      }
      case 'certificate':{
        const i=editable(c.instrumentId);if(i.act!=='Carta notarial')throw new HttpError(400,'La certificación de firmas ya consta en su registro local.');
        if(events.some(e=>e.kind==='certificate'&&e.data.instrumentId===i.id))throw new HttpError(409,'Ya existe una constancia para esta carta.');
        const attempts=events.filter(e=>e.kind==='schedule'&&e.data.instrumentId===i.id);
        if(!attempts.length||attempts.some(a=>!events.some(e=>e.kind==='diligence'&&e.data.attemptId===a.id)))throw new HttpError(409,'Falta intento o resultado de diligencia.');
        const results=attempts.map(a=>[...events].reverse().find(e=>['diligence','diligence-resolve'].includes(e.kind)&&e.data.attemptId===a.id)!);
        if(results.some(e=>e.data.outcome==='desconocido'))throw new HttpError(409,'La carta conserva un resultado desconocido. Requiere incidencia y evaluación; no se presume entrega.');
        data={instrumentId:i.id,attempts,results,note:c.note,acknowledge:true};break;
      }
      case 'delivery':{
        const i=editable(c.instrumentId),p=participant(c.participantId);
        if(!i.participants.some(v=>(v as {id:string}).id===p.id))throw new HttpError(400,'El destinatario debe pertenecer a la instantánea autorizada.');
        if(i.act==='Carta notarial'&&!events.some(e=>e.kind==='certificate'&&e.data.instrumentId===i.id))throw new HttpError(409,'Falta constancia de diligencias del notario.');
        await evidence(c.evidenceId,p.id);data={instrumentId:i.id,participantId:p.id,snapshot:p.snapshot,evidenceId:c.evidenceId,note:c.note,acknowledge:true};break;
      }
    }
    data={...data,officeId:user.office,mode:'simulation',policyVersion:procedurePolicyVersion};
    await query(tx,'INSERT INTO procedure_events(id,case_id,sequence,kind,data,sha256,actor_id) SELECT $1,$2,COALESCE(max(sequence),0)+1,$3,$4,$5,$6 FROM procedure_events WHERE case_id=$2',[eventId,id,c.type,JSON.stringify(data),procedureHash({kind:c.type,data}),user.id]);
    await query(tx,'UPDATE case_records SET revision=revision+1,updated_at=now() WHERE id=$1',[id]);
    await query(tx,'INSERT INTO case_events(case_id,actor_id,action) VALUES($1,$2,$3)',[id,user.id,'procedure.'+c.type]);await audit(tx,user.id,'procedure.'+c.type,eventId);
    const result={id:eventId};await query(tx,'INSERT INTO procedure_requests(request_id,office_id,actor_id,request_hash,result) VALUES($1,$2,$3,$4,$5)',[c.requestId,user.office,user.id,hash,JSON.stringify(result)]);return result;
  });
}
export async function procedureArtifact(db:Kysely<Database>,user:Actor,id:string,instrumentId:string){
  const state=await procedureState(db,user,id),i=state.instruments.find(i=>i.id===instrumentId);if(!i)throw new HttpError(404,'Instrumento no disponible.');await audit(db,user.id,'procedure.download',instrumentId);return {number:i.number,text:internalRecord(i,state.events)};
}
