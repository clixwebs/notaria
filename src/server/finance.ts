import {createHash,randomUUID} from 'node:crypto';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {HttpError,hasPermission,type actor} from './access.ts';
import {financeCommand,cents,money,type FinanceCommand,type FinanceData,type FinanceEntry,type FinanceAccount,type FinanceSession,type FinanceKind} from '../lib/finance-domain.ts';
import {canonicalJSON,type QuoteLine} from '../lib/case-domain.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export function financePermission(command:FinanceCommand){return ['expense','reverse','reconcile','unreconcile'].includes(command.type)?'finance:manage':'finance:write';}
const live=`NOT EXISTS(SELECT 1 FROM finance_entries rev WHERE rev.reverses_id=e.id)`;
const remaining=`CASE WHEN e.kind IN ('charge','expense','advance','third-in') AND ${live} THEN e.amount-COALESCE((SELECT sum(c.amount) FROM finance_entries c WHERE (c.source_id=e.id OR c.target_id=e.id) AND c.kind IN ('collect','apply','refund','third-out','third-refund','pay-expense') AND NOT EXISTS(SELECT 1 FROM finance_entries rv WHERE rv.reverses_id=c.id)),0) ELSE 0 END`;
const entryColumns=`e.id,e.sequence,e.reference,e.kind,e.person_id,e.case_id,e.snapshot->>'name' AS person_name,e.snapshot->>'document' AS person_document,e.snapshot->>'kardex' AS kardex,e.amount::text,e.cash_delta::text,e.receivable_delta::text,e.advance_delta::text,e.third_delta::text,e.method,e.external_reference,e.note,e.source_id,e.target_id,e.reverses_id,e.quote_id,e.supplier_id,e.bucket,e.due_date::text,e.evidence_id,e.snapshot,e.created_at,u.name AS actor,NOT (${live}) AS reversed,(${remaining})::text AS remaining,(SELECT m.id FROM finance_matches m WHERE m.entry_id=e.id AND NOT EXISTS(SELECT 1 FROM finance_unmatches x WHERE x.match_id=m.id) LIMIT 1) AS match_id,(SELECT m.statement FROM finance_matches m WHERE m.entry_id=e.id AND NOT EXISTS(SELECT 1 FROM finance_unmatches x WHERE x.match_id=m.id) LIMIT 1) AS statement`;
async function entries(tx:Connection,office:string,person:string|null=null,limit=50,offset=0){return query<FinanceEntry>(tx,`SELECT ${entryColumns} FROM finance_entries e JOIN "user" u ON u.id=e.created_by WHERE e.office_id=$1 AND ($2::uuid IS NULL OR e.person_id=$2) ORDER BY e.sequence DESC LIMIT $3 OFFSET $4`,[office,person,limit,offset]);}
async function getEntry(tx:Connection,office:string,id:string){const [row]=await query<FinanceEntry>(tx,`SELECT ${entryColumns} FROM finance_entries e JOIN "user" u ON u.id=e.created_by WHERE e.id=$1 AND e.office_id=$2`,[id,office]);if(!row)throw new HttpError(404,'Movimiento no disponible.');return row;}
async function sessions(tx:Connection,office:string){return query<FinanceSession>(tx,`SELECT s.id,s.opening::text,s.previous_count::text,s.replenishment::text,s.created_at AS opened_at,u.name AS opener,c.created_at AS closed_at,c.counted::text,c.expected::text,c.difference::text,COALESCE(c.note,s.note) AS note FROM finance_sessions s JOIN "user" u ON u.id=s.created_by LEFT JOIN finance_closings c ON c.session_id=s.id WHERE s.office_id=$1 ORDER BY s.created_at DESC,s.id DESC LIMIT 20`,[office]);}
async function currentSession(tx:Connection,office:string){const [s]=await query<{id:string;opening:string}>(tx,'SELECT s.id,s.opening::text FROM finance_sessions s WHERE s.office_id=$1 AND NOT EXISTS(SELECT 1 FROM finance_closings c WHERE c.session_id=s.id)',[office]);return s;}
async function cashExpected(tx:Connection,session:{id:string;opening:string}){const [v]=await query<{total:string}>(tx,"SELECT COALESCE(sum(cash_delta),0)::text AS total FROM finance_entries WHERE session_id=$1 AND method='efectivo'",[session.id]);return cents(session.opening)+cents(v.total);}
async function accounts(tx:Connection,office:string){return query<FinanceAccount>(tx,`SELECT e.person_id,p.name,p.document_type||' '||p.document_number AS document,e.case_id,r.kardex,sum(e.receivable_delta)::text AS receivable,sum(e.advance_delta)::text AS advance,sum(e.third_delta)::text AS third,COALESCE(sum(CASE WHEN e.kind='expense' THEN (${remaining}) ELSE 0 END),0)::text AS expense_pending FROM finance_entries e JOIN persons p ON p.id=e.person_id JOIN case_records r ON r.id=e.case_id WHERE e.office_id=$1 GROUP BY e.person_id,p.name,p.document_type,p.document_number,e.case_id,r.kardex ORDER BY p.name,r.kardex`,[office]);}
function totals(items:FinanceAccount[]){return Object.fromEntries(['receivable','advance','third','expense_pending'].map(key=>[key,money(items.reduce((s,a)=>s+cents(a[key as keyof Pick<FinanceAccount,'receivable'|'advance'|'third'|'expense_pending'>]),0n))])) as Pick<FinanceData,'receivable'|'advance'|'third'|'expense_pending'>;}
export async function financeOverview(db:Kysely<Database>,user:Actor,personId:string|null,page=1,pageSize=25){
  if(!hasPermission(user.role,'finance:read'))throw new HttpError(403,'Tu perfil no tiene acceso a caja.');
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,personId?'finance.statement.read':'finance.read',personId||'office:'+user.office);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM finance_state WHERE office_id=$1',[user.office]);
    const clients=await query<{id:string;name:string;document:string}>(tx,"SELECT DISTINCT p.id,p.name,p.document_type||' '||p.document_number AS document FROM persons p JOIN case_participants cp ON cp.person_id=p.id JOIN case_records r ON r.id=cp.case_id WHERE p.office_id=$1 AND r.office_id=$1 ORDER BY p.name,p.id",[user.office]);
    const client=personId?clients.find(c=>c.id===personId):null;if(personId&&!client)throw new HttpError(404,'Cliente no disponible.');
    const cases=await query(tx,'SELECT r.id,r.kardex,cp.person_id FROM case_records r JOIN case_participants cp ON cp.case_id=r.id WHERE r.office_id=$1 ORDER BY r.year DESC,r.sequence DESC',[user.office]);
    const suppliers=await query(tx,'SELECT id,name,document FROM finance_suppliers WHERE office_id=$1 ORDER BY name',[user.office]);
    const quotes=await query(tx,"SELECT q.id,q.case_id,q.version,COALESCE((SELECT sum((line->>'quantity')::numeric*(line->>'unitAmount')::numeric) FROM jsonb_array_elements(q.lines) line WHERE line->>'category'<>'Terceros'),0)::text AS own_total,EXISTS(SELECT 1 FROM finance_entries e WHERE e.quote_id=q.id AND e.kind='charge') AS imported FROM case_quotes q JOIN service_orders o ON o.accepted_quote_id=q.id JOIN case_records r ON r.id=q.case_id WHERE r.office_id=$1 ORDER BY q.version DESC",[user.office]);
    const evidence=await query(tx,"SELECT DISTINCT v.id,r.id AS case_id,v.filename,v.version FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN case_participants cp ON cp.person_id=d.person_id JOIN case_records r ON r.id=cp.case_id WHERE d.office_id=$1 AND r.office_id=$1 AND v.status='liberado' ORDER BY v.filename,v.version",[user.office]);
    const all=await accounts(tx,user.office);const ss=await sessions(tx,user.office);const open=ss.find(s=>!s.closed_at)||null;
    const cash=open?money(await cashExpected(tx,open)):ss[0]?.counted||'0.00';
    const [count]=await query<{n:number}>(tx,'SELECT count(*)::int AS n FROM finance_entries WHERE office_id=$1 AND ($2::uuid IS NULL OR person_id=$2)',[user.office,personId]);
    const rows=await entries(tx,user.office,personId,pageSize,(page-1)*pageSize);
    const openItems=await query<FinanceEntry>(tx,`SELECT ${entryColumns} FROM finance_entries e JOIN "user" u ON u.id=e.created_by WHERE e.office_id=$1 AND e.kind IN ('charge','expense','advance','third-in') AND (${remaining})>0 ORDER BY e.sequence DESC`,[user.office]);
    const own=personId?all.filter(a=>a.person_id===personId):[];
    return {revision:state?.revision||0,entries:rows,openItems,total:count.n,page,pageSize,accounts:all,clients,cases,suppliers,quotes,evidence,sessions:ss,open,cash,...totals(all),expected_opening:ss[0]?.counted||null,statement:client?{client,entries:rows,accounts:own,...totals(own),total:count.n,page,pageSize}:null} as FinanceData;
  });
}
export async function mutateFinance(db:Kysely<Database>,user:Actor,raw:unknown){
  const c=financeCommand.parse(raw);
  if(!hasPermission(user.role,financePermission(c)))throw new HttpError(403,'Tu perfil no tiene permiso para esta acción de caja.');
  const hash=createHash('sha256').update(canonicalJSON(c)).digest('hex');
  return db.transaction().execute(async tx=>{
    // One office-wide serialization point: covers cross-case allocations, closures and retries.
    await query(tx,'INSERT INTO finance_state(office_id) VALUES($1) ON CONFLICT DO NOTHING',[user.office]);
    const [state]=await query<{revision:number;sequence:number}>(tx,'SELECT revision,sequence FROM finance_state WHERE office_id=$1 FOR UPDATE',[user.office]);
    const [prior]=await query<{hash:string;actor_id:string;result:unknown}>(tx,'SELECT hash,actor_id,result FROM finance_requests WHERE office_id=$1 AND request_id=$2',[user.office,c.requestId]);
    if(prior){if(prior.hash!==hash||prior.actor_id!==user.id)throw new HttpError(409,'Esta solicitud ya fue utilizada con otros datos.');return prior.result;}
    if(c.revision!==state.revision)throw new HttpError(409,'Caja cambió. Actualiza el contexto y revisa los saldos antes de guardar. El formulario se conserva.');
    let result:Record<string,unknown>={};const session=await currentSession(tx,user.office);
    if(c.type==='open'){
      if(session)throw new HttpError(409,'Ya existe una caja abierta.');
      const [last]=await query<{counted:string}>(tx,'SELECT c.counted::text FROM finance_closings c JOIN finance_sessions s ON s.id=c.session_id WHERE s.office_id=$1 ORDER BY c.created_at DESC LIMIT 1',[user.office]);
      if(cents(c.replenishment)>0n&&!hasPermission(user.role,'finance:manage'))throw new HttpError(403,'Solo Administración registra una reposición del fondo de caja.');
      if(!last&&cents(c.replenishment)>0n)throw new HttpError(400,'La primera apertura declara su fondo inicial sin reposición.');
      if(last&&cents(c.opening)!==cents(last.counted)+cents(c.replenishment))throw new HttpError(400,'La apertura debe coincidir con el último conteo más la reposición explícita de Administración.');
      const [held]=await query<{n:string}>(tx,"SELECT COALESCE(sum(third_delta),0)::text AS n FROM finance_entries WHERE office_id=$1 AND method='efectivo'",[user.office]);
      if(cents(c.opening)<cents(held.n))throw new HttpError(400,'El efectivo contado no cubre los fondos de terceros en custodia. Resuelve la diferencia antes de abrir.');
      const id=randomUUID();await query(tx,'INSERT INTO finance_sessions(id,office_id,opening,previous_count,replenishment,created_by,note) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,user.office,c.opening,last?.counted||null,c.replenishment,user.id,c.note]);result={id};
    }else if(c.type==='close'){
      if(!session)throw new HttpError(409,'No hay una caja abierta.');
      const expected=money(await cashExpected(tx,session));const difference=money(cents(c.counted)-cents(expected));
      await query(tx,'INSERT INTO finance_closings(session_id,expected,counted,difference,note,created_by) VALUES($1,$2,$3,$4,$5,$6)',[session.id,expected,c.counted,difference,c.note,user.id]);result={id:session.id,expected,counted:c.counted,difference};
    }else if(c.type==='supplier'){
      const id=randomUUID();await query(tx,'INSERT INTO finance_suppliers(id,office_id,name,document,created_by) VALUES($1,$2,$3,$4,$5)',[id,user.office,c.name,c.document.toUpperCase(),user.id]);result={id};
    }else if(c.type==='reconcile'){
      const e=await getEntry(tx,user.office,c.entryId);if(e.reversed||e.kind==='reverse'||!e.method||e.method==='efectivo'||cents(e.cash_delta)===0n)throw new HttpError(400,'Selecciona un movimiento bancario vigente.');
      if(e.match_id)throw new HttpError(409,'El movimiento ya está conciliado.');
      if((await query(tx,'SELECT m.id FROM finance_matches m WHERE m.office_id=$1 AND m.statement=$2 AND NOT EXISTS(SELECT 1 FROM finance_unmatches x WHERE x.match_id=m.id)',[user.office,c.statement])).length)throw new HttpError(409,'La línea de extracto ya se aplicó a otro movimiento.');
      const id=randomUUID();await query(tx,'INSERT INTO finance_matches(id,office_id,entry_id,statement,note,created_by) VALUES($1,$2,$3,$4,$5,$6)',[id,user.office,e.id,c.statement,c.note,user.id]);result={id};
    }else if(c.type==='unreconcile'){
      const [m]=await query(tx,'SELECT m.id FROM finance_matches m WHERE m.id=$1 AND m.office_id=$2 AND NOT EXISTS(SELECT 1 FROM finance_unmatches x WHERE x.match_id=m.id)',[c.matchId,user.office]);if(!m)throw new HttpError(404,'Conciliación no disponible.');
      await query(tx,'INSERT INTO finance_unmatches(match_id,note,created_by) VALUES($1,$2,$3)',[c.matchId,c.note,user.id]);result={id:c.matchId};
    }else{
      let personId:string,caseId:string,snap:Record<string,unknown>,kind:FinanceKind,amountValue:bigint;
      let cash=0n,receivable=0n,advance=0n,third=0n;
      let sourceId:string|null=null,targetId:string|null=null,reversesId:string|null=null,quoteId:string|null=null,supplierId:string|null=null,evidenceId:string|null=null,bucket:string|null=null,dueDate:string|null=null;
      let method:string|null=null,external:string|null=null;
      if(c.type==='reverse'){
        const original=await getEntry(tx,user.office,c.entryId);
        if(original.reversed||original.kind==='reverse')throw new HttpError(409,'El movimiento ya fue revertido o es un reverso.');
        if(original.match_id)throw new HttpError(409,'Retira la conciliación antes de corregir este movimiento.');
        const children=await query(tx,`SELECT e.id FROM finance_entries e WHERE (e.source_id=$1 OR e.target_id=$1) AND e.kind<>'reverse' AND ${live}`,[original.id]);
        if(children.length)throw new HttpError(409,'Primero revierte las aplicaciones, recuperaciones o pagos que dependen de este movimiento.');
        personId=original.person_id;caseId=original.case_id;snap=original.snapshot;kind='reverse';amountValue=cents(original.amount);
        cash=-cents(original.cash_delta);receivable=-cents(original.receivable_delta);advance=-cents(original.advance_delta);third=-cents(original.third_delta);
        reversesId=original.id;method=original.method;supplierId=original.supplier_id;bucket=original.bucket;
      }else{
        personId=c.personId;caseId=c.caseId;kind=c.type==='quote-charge'?'charge':c.type;
        const [p]=await query<{name:string;document:string;kardex:string}>(tx,"SELECT p.name,p.document_type||' '||p.document_number AS document,r.kardex FROM persons p JOIN case_participants cp ON cp.person_id=p.id JOIN case_records r ON r.id=cp.case_id WHERE p.id=$1 AND r.id=$2 AND p.office_id=$3 AND r.office_id=$3 FOR SHARE OF p,r",[personId,caseId,user.office]);
        if(!p)throw new HttpError(404,'Cliente o expediente no disponible en esta oficina.');
        snap={name:p.name,document:p.document,kardex:p.kardex};
        amountValue='amount' in c?cents(c.amount):0n;
        async function related(id:string,allowed:FinanceKind[]){const e=await getEntry(tx,user.office,id);if(e.person_id!==personId||e.case_id!==caseId||!allowed.includes(e.kind)||e.reversed)throw new HttpError(400,'El origen y destino deben estar vigentes y pertenecer al mismo cliente y expediente.');return e;}
        function available(e:FinanceEntry){if(amountValue>cents(e.remaining))throw new HttpError(400,'El importe supera el saldo disponible del movimiento seleccionado.');}
        if(c.type==='quote-charge'){
          if((await query(tx,`SELECT e.id FROM finance_entries e WHERE e.case_id=$1 AND e.office_id=$2 AND e.kind='charge' AND e.quote_id IS NOT NULL AND ${live}`,[caseId,user.office])).length)throw new HttpError(409,'Este expediente ya tiene un cargo de presupuesto vigente. Corrige el cargo anterior y sus aplicaciones antes de trasladar otra versión.');
          const [q]=await query<{id:string;version:number;lines:QuoteLine[]}>(tx,'SELECT q.id,q.version,q.lines FROM case_quotes q JOIN service_orders o ON o.accepted_quote_id=q.id WHERE q.id=$1 AND q.case_id=$2 FOR SHARE OF o',[c.quoteId,caseId]);
          if(!q)throw new HttpError(409,'Selecciona el presupuesto aceptado vigente de la orden de servicio.');
          const lines=q.lines.filter(l=>l.category!=='Terceros');amountValue=lines.reduce((sum,l)=>sum+cents(l.unitAmount)*BigInt(l.quantity),0n);
          if(amountValue<=0n)throw new HttpError(400,'El presupuesto no contiene conceptos propios para generar un cargo.');
          quoteId=q.id;snap={...snap,quoteVersion:q.version,lines};receivable=amountValue;
        }else if(c.type==='charge'){
          receivable=amountValue;
          if(c.expenseId){const e=await related(c.expenseId,['expense']);if(e.bucket!=='own'||amountValue>cents(e.amount))throw new HttpError(400,'Solo se recupera un gasto propio por un importe que no supere el autorizado.');targetId=e.id;snap={...snap,recoveredExpense:e.reference};}
        }else if(c.type==='collect'){
          const target=await related(c.targetId,['charge']);available(target);targetId=target.id;cash=amountValue;receivable=-amountValue;
        }else if(c.type==='advance'){cash=amountValue;advance=amountValue;}
        else if(c.type==='apply'){
          const source=await related(c.sourceId,['advance']);const target=await related(c.targetId,['charge']);available(source);available(target);sourceId=source.id;targetId=target.id;advance=-amountValue;receivable=-amountValue;
        }else if(c.type==='refund'){
          const source=await related(c.sourceId,['advance']);available(source);sourceId=source.id;cash=-amountValue;advance=-amountValue;
        }else if(c.type==='third-in'){cash=amountValue;third=amountValue;}
        else if(c.type==='third-out'||c.type==='third-refund'){
          const source=await related(c.sourceId,['third-in']);available(source);if(source.method!==c.method)throw new HttpError(400,'Usa el mismo medio del fondo recibido; las transferencias entre medios requieren un corte posterior.');sourceId=source.id;cash=-amountValue;third=-amountValue;
          if(c.type==='third-out'){const target=await related(c.targetId,['expense']);if(target.bucket!=='third')throw new HttpError(400,'El gasto debe estar autorizado por cuenta de terceros.');available(target);targetId=target.id;supplierId=target.supplier_id;}
        }else if(c.type==='expense'){
          const [supplier]=await query<{name:string;document:string}>(tx,'SELECT name,document FROM finance_suppliers WHERE id=$1 AND office_id=$2',[c.supplierId,user.office]);if(!supplier)throw new HttpError(404,'Proveedor no disponible.');
          const [evidence]=await query<{filename:string;version:number}>(tx,"SELECT v.filename,v.version FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN case_participants p ON p.person_id=d.person_id WHERE v.id=$1 AND v.status='liberado' AND d.office_id=$2 AND p.case_id=$3",[c.evidenceId,user.office,caseId]);if(!evidence)throw new HttpError(400,'El gasto requiere una versión privada liberada de un interviniente del expediente.');
          supplierId=c.supplierId;bucket=c.bucket;dueDate=c.dueDate;evidenceId=c.evidenceId;snap={...snap,supplier,evidence,approvedBy:user.name};
        }else if(c.type==='pay-expense'){
          const target=await related(c.targetId,['expense']);if(target.bucket!=='own')throw new HttpError(400,'Los gastos por cuenta de terceros se pagan con su fondo específico.');available(target);targetId=target.id;supplierId=target.supplier_id;cash=-amountValue;
        }
        if('method' in c){method=c.method;external=c.reference;}
      }
      if(cash!==0n){
        if(!session)throw new HttpError(409,'Abre caja antes de registrar entradas, salidas o reversos monetarios.');
        if(method==='efectivo'){
          const expected=await cashExpected(tx,session);
          const [held]=await query<{n:string}>(tx,"SELECT COALESCE(sum(third_delta),0)::text AS n FROM finance_entries WHERE office_id=$1 AND method='efectivo'",[user.office]);
          if(expected+cash<0n||expected+cash<cents(held.n)+third)throw new HttpError(400,'El efectivo disponible no cubre la salida o invadiría fondos de terceros.');
        }
      }
      const id=randomUUID(),sequence=state.sequence+1,reference='MOV-'+String(sequence).padStart(7,'0');
      await query(tx,`INSERT INTO finance_entries(id,office_id,sequence,reference,kind,person_id,case_id,amount,cash_delta,receivable_delta,advance_delta,third_delta,method,external_reference,session_id,source_id,target_id,reverses_id,quote_id,supplier_id,bucket,due_date,evidence_id,snapshot,note,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,[id,user.office,sequence,reference,kind,personId,caseId,money(amountValue),money(cash),money(receivable),money(advance),money(third),method,external,cash!==0n?session!.id:null,sourceId,targetId,reversesId,quoteId,supplierId,bucket,dueDate,evidenceId,JSON.stringify(snap),c.note,user.id]);
      await query(tx,'UPDATE finance_state SET sequence=$1 WHERE office_id=$2',[sequence,user.office]);result={id,reference,amount:money(amountValue)};
    }
    await query(tx,'UPDATE finance_state SET revision=revision+1 WHERE office_id=$1',[user.office]);
    result={...result,revision:state.revision+1};
    await audit(tx,user.id,'finance.'+c.type,String(result.id));
    await query(tx,'INSERT INTO finance_requests(office_id,request_id,actor_id,hash,result) VALUES($1,$2,$3,$4,$5)',[user.office,c.requestId,user.id,hash,JSON.stringify(result)]);
    return result;
  });
}
