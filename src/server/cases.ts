import {randomUUID,createHash} from 'node:crypto';
import {query,audit,type Connection,type Database} from './platform.ts';
import type {Kysely} from 'kysely';
import {HttpError,type actor} from './access.ts';
import {createCaseInput,caseCommand,requirementsByAct,policyVersion,quoteTotals,canonicalJSON,type CaseSummary,type CaseDetail,type PersonSnapshot} from '../lib/case-domain.ts';
import {resolveTariffLines} from './tariffs.ts';
import {limaDate} from '../lib/domain.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
const columns=`r.id,r.kardex,r.subject,r.act,r.revision,r.content_revision,r.policy_version,r.created_at,u.name AS owner,
 (SELECT p.snapshot->>'name' FROM case_participants p WHERE p.case_id=r.id ORDER BY p.created_at,p.id LIMIT 1) AS applicant,
 (SELECT count(*)::int FROM case_requirements q WHERE q.case_id=r.id AND NOT q.done) AS pending,
 COALESCE((SELECT max(d.version) FROM case_drafts d WHERE d.case_id=r.id),0)::int AS draft_version,
 EXISTS(SELECT 1 FROM case_draft_reviews v JOIN case_drafts d ON d.id=v.draft_id WHERE d.case_id=r.id AND d.version=(SELECT max(t.version) FROM case_drafts t WHERE t.case_id=r.id) AND v.context_revision=r.content_revision) AS reviewed,
 COALESCE((SELECT max(q.version) FROM case_quotes q WHERE q.case_id=r.id),0)::int AS quote_version,
 EXISTS(SELECT 1 FROM quote_acceptances a JOIN case_quotes q ON q.id=a.quote_id WHERE q.case_id=r.id AND q.version=(SELECT max(t.version) FROM case_quotes t WHERE t.case_id=r.id)) AS quote_accepted`;
async function event(tx:Connection,user:Actor,id:string,action:string){await query(tx,'INSERT INTO case_events(case_id,actor_id,action) VALUES($1,$2,$3)',[id,user.id,action]);await audit(tx,user.id,action,id);}
async function snapshot(tx:Connection,personId:string,office:string){
  const [p]=await query<{name:string;document_type:string;document_number:string;revision:number}>(tx,'SELECT name,document_type,document_number,revision FROM persons WHERE id=$1 AND office_id=$2 FOR SHARE',[personId,office]);
  if(!p)throw new HttpError(404,'Persona no disponible para esta oficina.');
  return {name:p.name,documentType:p.document_type,documentNumber:p.document_number,personRevision:p.revision} satisfies PersonSnapshot;
}
export async function createPersistentCase(db:Kysely<Database>,user:Actor,raw:unknown){
  const input=createCaseInput.parse(raw);const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return db.transaction().execute(async tx=>{
    const year=Number(limaDate().slice(0,4));
    await query(tx,'INSERT INTO case_counters(year,value) VALUES($1,1) ON CONFLICT DO NOTHING',[year]);
    await query(tx,'SELECT year FROM case_counters WHERE year=$1 FOR UPDATE',[year]);
    const [existing]=await query<{id:string;request_hash:string;created_by:string}>(tx,'SELECT id,request_hash,created_by FROM case_records WHERE request_id=$1',[input.requestId]);
    if(existing){if(existing.request_hash!==hash||existing.created_by!==user.id)throw new HttpError(409,'La clave de solicitud ya se utilizó con otros datos.');return {id:existing.id};}
    const person=await snapshot(tx,input.personId,user.office);
    const [counter]=await query<{sequence:number}>(tx,'UPDATE case_counters SET value=value+1 WHERE year=$1 RETURNING value-1 AS sequence',[year]);
    const id=randomUUID();const kardex=`${year}-${String(counter.sequence).padStart(5,'0')}`;
    await query(tx,'INSERT INTO case_records(id,office_id,year,sequence,kardex,act,subject,owner_id,policy_version,request_id,request_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$8)',[id,user.office,year,counter.sequence,kardex,input.act,input.subject,user.id,policyVersion,input.requestId,hash]);
    await query(tx,'INSERT INTO case_participants(id,case_id,person_id,snapshot,role) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,input.personId,JSON.stringify(person),'Solicitante']);
    for(const title of requirementsByAct[input.act])await query(tx,'INSERT INTO case_requirements(id,case_id,title) VALUES($1,$2,$3)',[randomUUID(),id,title]);
    await event(tx,user,id,'case.created');return {id,kardex};
  });
}
export async function listCases(db:Kysely<Database>,user:Actor,search:string,page:number,pageSize:number,act:string){
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,'case.list','office:'+user.office);
    const term='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
    const filter=`r.office_id=$1 AND ($2='%%' OR r.kardex ILIKE $2 OR r.subject ILIKE $2 OR EXISTS(SELECT 1 FROM case_participants p WHERE p.case_id=r.id AND (p.snapshot->>'name' ILIKE $2 OR p.snapshot->>'documentNumber' ILIKE $2))) AND ($3='' OR r.act=$3)`;
    const [count]=await query<{total:number}>(tx,`SELECT count(*)::int AS total FROM case_records r WHERE ${filter}`,[user.office,term,act]);
    const items=await query<CaseSummary>(tx,`SELECT ${columns} FROM case_records r JOIN "user" u ON u.id=r.owner_id WHERE ${filter} ORDER BY r.year DESC,r.sequence DESC LIMIT $4 OFFSET $5`,[user.office,term,act,pageSize,(page-1)*pageSize]);
    return {items,total:count.total,page,pageSize};
  });
}
export async function overview(db:Kysely<Database>,user:Actor){
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,'case.overview','office:'+user.office);
    const [stats]=await query<{total:number;pending:number;reviewed:number;accepted:number}>(tx,`SELECT count(*)::int AS total,count(*) FILTER(WHERE pending>0)::int AS pending,count(*) FILTER(WHERE reviewed AND pending=0)::int AS reviewed,count(*) FILTER(WHERE quote_accepted)::int AS accepted FROM (SELECT ${columns} FROM case_records r JOIN "user" u ON u.id=r.owner_id WHERE r.office_id=$1) s`,[user.office]);
    const recent=await query<CaseSummary>(tx,`SELECT ${columns} FROM case_records r JOIN "user" u ON u.id=r.owner_id WHERE r.office_id=$1 ORDER BY r.year DESC,r.sequence DESC LIMIT 8`,[user.office]);return {...stats,recent};
  });
}
export async function caseDetail(db:Kysely<Database>,user:Actor,id:string){
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    const [record]=await query<CaseSummary&{content_revision:number;policy_version:string}>(tx,`SELECT ${columns} FROM case_records r JOIN "user" u ON u.id=r.owner_id WHERE r.id=$1 AND r.office_id=$2`,[id,user.office]);
    if(!record)throw new HttpError(404,'Expediente no disponible.');
    await audit(tx,user.id,'case.read',id);
    const participants=await query(tx,'SELECT id,person_id,snapshot,role FROM case_participants WHERE case_id=$1 ORDER BY created_at,id',[id]);
    const requirements=await query(tx,'SELECT id,title,done,note,evidence_id FROM case_requirements WHERE case_id=$1 ORDER BY title,id',[id]);
    const requirementHistory=await query(tx,'SELECT h.id,q.title,h.done,h.note,h.evidence_id,h.baseline,h.created_at,u.name AS actor FROM case_requirement_checks h JOIN case_requirements q ON q.id=h.requirement_id JOIN "user" u ON u.id=h.actor_id WHERE h.case_id=$1 ORDER BY h.created_at DESC,h.id',[id]);
    const drafts=await query(tx,'SELECT d.id,d.version,d.body,d.snapshot,d.sha256,d.created_at,u.name AS author FROM case_drafts d JOIN "user" u ON u.id=d.created_by WHERE d.case_id=$1 ORDER BY d.version DESC',[id]);
    const reviews=await query(tx,'SELECT v.id,v.draft_id,v.context_revision,v.note,v.created_at,u.name AS reviewer FROM case_draft_reviews v JOIN case_drafts d ON d.id=v.draft_id JOIN "user" u ON u.id=v.reviewer_id WHERE d.case_id=$1 ORDER BY v.created_at DESC',[id]);
    const quotes=await query(tx,"SELECT q.id,q.version,q.valid_until::text,q.lines,q.total::text,q.created_at,a.created_at AS accepted_at,a.snapshot AS accepted_by,a.reference AS acceptance_reference FROM case_quotes q LEFT JOIN quote_acceptances a ON a.quote_id=q.id WHERE q.case_id=$1 ORDER BY q.version DESC",[id]);
    const [order]=await query(tx,'SELECT reference,accepted_quote_id,revision FROM service_orders WHERE case_id=$1',[id]);
    const tasks=await query(tx,'SELECT id,title,due_date::text,done FROM case_tasks WHERE case_id=$1 ORDER BY done,due_date NULLS LAST,created_at',[id]);
    const notes=await query(tx,'SELECT n.id,n.body,n.created_at,u.name AS author FROM case_notes n JOIN "user" u ON u.id=n.created_by WHERE n.case_id=$1 ORDER BY n.created_at DESC',[id]);
    const events=await query(tx,'SELECT e.id::text,e.action,e.created_at,u.name AS actor FROM case_events e JOIN "user" u ON u.id=e.actor_id WHERE e.case_id=$1 ORDER BY e.id DESC',[id]);
    return {...record,participants,requirements,requirementHistory,drafts,reviews,quotes,order:order||null,tasks,notes,events} as CaseDetail;
  });
}
export async function mutateCase(db:Kysely<Database>,user:Actor,id:string,raw:unknown){
  const command=caseCommand.parse(raw);
  return db.transaction().execute(async tx=>{
    const [record]=await query<{id:string;revision:number;content_revision:number;kardex:string;policy_version:string;act:string}>(tx,'SELECT id,revision,content_revision,kardex,policy_version,act FROM case_records WHERE id=$1 AND office_id=$2 FOR UPDATE',[id,user.office]);
    if(!record)throw new HttpError(404,'Expediente no disponible.');
    if(record.revision!==command.revision)throw new HttpError(409,'El expediente cambió. Actualiza para revisar los cambios antes de guardar; tu formulario se conserva.');
    let changesContent=false;
    switch(command.type){
      case 'participant':{
        const person=await snapshot(tx,command.personId,user.office);
        await query(tx,'INSERT INTO case_participants(id,case_id,person_id,snapshot,role) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,command.personId,JSON.stringify(person),command.role]);changesContent=true;break;
      }
      case 'requirement-add':await query(tx,'INSERT INTO case_requirements(id,case_id,title) VALUES($1,$2,$3)',[randomUUID(),id,command.title]);changesContent=true;break;
      case 'requirement':{
        if(command.evidenceId){
          const allowed=await query(tx,"SELECT v.id FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN case_participants p ON p.person_id=d.person_id WHERE v.id=$1 AND d.office_id=$2 AND p.case_id=$3 AND v.status='liberado'",[command.evidenceId,user.office,id]);
          if(!allowed.length)throw new HttpError(400,'El sustento debe ser una versión liberada de un interviniente de este expediente.');
        }
        const rows=await query(tx,'UPDATE case_requirements SET done=$1,note=$2,evidence_id=$3,checked_by=$4,checked_at=now() WHERE id=$5 AND case_id=$6 RETURNING id',[command.done,command.note,command.evidenceId,user.id,command.requirementId,id]);if(!rows.length)throw new HttpError(404,'Requisito no disponible.');
        await query(tx,'INSERT INTO case_requirement_checks(id,case_id,requirement_id,done,note,evidence_id,actor_id,context_revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),id,command.requirementId,command.done,command.note,command.evidenceId,user.id,record.content_revision+1]);
        changesContent=true;break;
      }
      case 'draft':{
        const [last]=await query<{version:number}>(tx,'SELECT version FROM case_drafts WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[id]);
        if((last?.version||0)!==command.baseVersion)throw new HttpError(409,'La versión del borrador cambió. Actualiza antes de guardar.');
        const participants=await query(tx,'SELECT person_id,snapshot,role FROM case_participants WHERE case_id=$1 ORDER BY created_at,id',[id]);
        const requirements=await query(tx,'SELECT title,done,note,evidence_id FROM case_requirements WHERE case_id=$1 ORDER BY title,id',[id]);
        const data={participants,requirements,policyVersion:record.policy_version};
        const hash=createHash('sha256').update(canonicalJSON({body:command.body,snapshot:data})).digest('hex');
        await query(tx,'INSERT INTO case_drafts(id,case_id,version,body,snapshot,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),id,command.baseVersion+1,command.body,JSON.stringify(data),hash,user.id]);changesContent=true;break;
      }
      case 'review':{
        const [latest]=await query<{id:string}>(tx,'SELECT id FROM case_drafts WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[id]);
        if(latest?.id!==command.draftId)throw new HttpError(409,'Solo se revisa la versión vigente del borrador.');
        await query(tx,'INSERT INTO case_draft_reviews(id,draft_id,context_revision,note,reviewer_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),command.draftId,record.content_revision,command.note,user.id]);break;
      }
      case 'quote':{
        if(command.validUntil<limaDate())throw new HttpError(400,'La vigencia no puede ser anterior a hoy en Lima.');
        const lines=await resolveTariffLines(tx,user,record.act,command.lines);
        let total:string;try{total=quoteTotals(lines);}catch(e){throw new HttpError(400,(e as Error).message);}
        const [last]=await query<{version:number}>(tx,'SELECT version FROM case_quotes WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[id]);
        if((last?.version||0)!==command.baseVersion)throw new HttpError(409,'El presupuesto cambió de versión.');
        const quoteId=randomUUID();
        await query(tx,'INSERT INTO case_quotes(id,case_id,version,valid_until,lines,total,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[quoteId,id,command.baseVersion+1,command.validUntil,JSON.stringify(lines),total,user.id]);
        for(const [index,line] of lines.entries())if(line.tariffVersionId)await query(tx,'INSERT INTO case_quote_tariffs(quote_id,line_index,tariff_version_id) VALUES($1,$2,$3)',[quoteId,index,line.tariffVersionId]);break;
      }
      case 'accept-quote':{
        const [quote]=await query<{id:string;valid_until:string}>(tx,'SELECT id,valid_until::text FROM case_quotes WHERE case_id=$1 ORDER BY version DESC LIMIT 1',[id]);
        if(quote?.id!==command.quoteId)throw new HttpError(409,'Selecciona la última versión del presupuesto.');
        if(quote.valid_until<limaDate())throw new HttpError(409,'El presupuesto venció; crea una nueva versión.');
        const [participant]=await query<{snapshot:PersonSnapshot}>(tx,'SELECT snapshot FROM case_participants WHERE id=$1 AND case_id=$2',[command.participantId,id]);if(!participant)throw new HttpError(400,'La aceptación debe corresponder a un interviniente del expediente.');
        await query(tx,'INSERT INTO quote_acceptances(quote_id,participant_id,snapshot,reference,recorded_by) VALUES($1,$2,$3,$4,$5)',[command.quoteId,command.participantId,JSON.stringify(participant.snapshot),command.reference,user.id]);
        await query(tx,'INSERT INTO service_orders(id,case_id,reference,accepted_quote_id) VALUES($1,$2,$3,$4) ON CONFLICT(case_id) DO UPDATE SET accepted_quote_id=excluded.accepted_quote_id,revision=service_orders.revision+1,updated_at=now()',[randomUUID(),id,'OS-'+record.kardex,command.quoteId]);break;
      }
      case 'task':await query(tx,'INSERT INTO case_tasks(id,case_id,title,due_date,created_by) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,command.title,command.dueDate,user.id]);break;
      case 'task-check':{const rows=await query(tx,'UPDATE case_tasks SET done=$1 WHERE id=$2 AND case_id=$3 RETURNING id',[command.done,command.taskId,id]);if(!rows.length)throw new HttpError(404,'Tarea no disponible.');break;}
      case 'note':await query(tx,'INSERT INTO case_notes(id,case_id,body,created_by) VALUES($1,$2,$3,$4)',[randomUUID(),id,command.body,user.id]);break;
    }
    await query(tx,'UPDATE case_records SET revision=revision+1,content_revision=content_revision+$1,updated_at=now() WHERE id=$2',[changesContent?1:0,id]);
    await event(tx,user,id,'case.'+command.type);return {ok:true};
  });
}
