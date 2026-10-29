import {randomUUID,createHash} from 'node:crypto';
import type {Kysely} from 'kysely';
import {query,audit,type Connection,type Database} from './platform.ts';
import {HttpError,hasPermission,type actor} from './access.ts';
import {tariffCommand,type TariffCatalog,type TariffVersion} from '../lib/tariff-domain.ts';
import {canonicalJSON,fromMinor,toMinor,type QuoteLine} from '../lib/case-domain.ts';
type Actor=Awaited<ReturnType<typeof actor>>;
export async function tariffCatalog(db:Kysely<Database>,user:Actor):Promise<TariffCatalog>{
  if(!hasPermission(user.role,'tariff:read'))throw new HttpError(403,'Tu perfil no tiene acceso al tarifario.');
  return db.transaction().setIsolationLevel('repeatable read').execute(async tx=>{
    await audit(tx,user.id,'tariff.read','office:'+user.office);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM tariff_state WHERE office_id=$1',[user.office]);
    const history=await query<TariffVersion>(tx,`SELECT v.*,v.unit_amount::text AS unit_amount,i.code,u.name AS author FROM tariff_versions v JOIN tariff_items i ON i.id=v.tariff_id JOIN "user" u ON u.id=v.created_by WHERE i.office_id=$1 ORDER BY i.code,v.version DESC`,[user.office]);
    const seen=new Set<string>();const items=history.filter(v=>{if(seen.has(v.tariff_id))return false;seen.add(v.tariff_id);return true;});
    return {revision:state?.revision||1,items,history};
  });
}
export async function publishTariff(db:Kysely<Database>,user:Actor,raw:unknown){
  if(!hasPermission(user.role,'tariff:manage'))throw new HttpError(403,'Solo Administración puede publicar tarifas.');
  const command=tariffCommand.parse(raw);const hash=createHash('sha256').update(canonicalJSON(command)).digest('hex');
  return db.transaction().execute(async tx=>{
    await query(tx,'INSERT INTO tariff_state(office_id) VALUES($1) ON CONFLICT DO NOTHING',[user.office]);
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM tariff_state WHERE office_id=$1 FOR UPDATE',[user.office]);
    const [previous]=await query<{office_id:string;actor_id:string;request_hash:string;result:{id:string;tariffId:string;version:number}}>(tx,'SELECT office_id,actor_id,request_hash,result FROM tariff_requests WHERE request_id=$1',[command.requestId]);
    if(previous){if(previous.office_id!==user.office||previous.actor_id!==user.id||previous.request_hash!==hash)throw new HttpError(409,'La clave de solicitud ya se utilizó con otros datos.');return previous.result;}
    if(state.revision!==command.revision)throw new HttpError(409,'El tarifario cambió. Actualiza el contexto antes de guardar; tu formulario se conserva.');
    let tariffId=command.tariffId;
    if(tariffId){
      const [item]=await query<{code:string;version:number}>(tx,'SELECT i.code,(SELECT max(version)::int FROM tariff_versions WHERE tariff_id=i.id) AS version FROM tariff_items i WHERE i.id=$1 AND i.office_id=$2',[tariffId,user.office]);
      if(!item)throw new HttpError(404,'Tarifa no disponible.');
      if(item.code!==command.code||item.version!==command.baseVersion)throw new HttpError(409,'La versión o el código de la tarifa cambió. Revisa el historial.');
    }else{
      if(command.baseVersion!==0)throw new HttpError(400,'Una tarifa nueva empieza en la versión uno.');
      tariffId=randomUUID();await query(tx,'INSERT INTO tariff_items(id,office_id,code) VALUES($1,$2,$3)',[tariffId,user.office,command.code]);
    }
    const id=randomUUID();const version=command.baseVersion+1;
    await query(tx,'INSERT INTO tariff_versions(id,tariff_id,version,description,category,unit_amount,act,active,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,tariffId,version,command.description,command.category,fromMinor(toMinor(command.unitAmount)),command.act,command.active,command.reason,user.id]);
    await query(tx,'UPDATE tariff_state SET revision=revision+1 WHERE office_id=$1',[user.office]);
    const result={id,tariffId,version};
    await audit(tx,user.id,'tariff.publish',id);
    await query(tx,'INSERT INTO tariff_requests(request_id,office_id,actor_id,request_hash,result) VALUES($1,$2,$3,$4,$5)',[command.requestId,user.office,user.id,hash,JSON.stringify(result)]);
    return result;
  });
}
// Lock the catalogue through quote commit: a concurrent publication cannot make
// the version stale between validation, snapshot and immutable link insertion.
export async function resolveTariffLines(tx:Connection,user:Actor,act:string,lines:QuoteLine[]):Promise<QuoteLine[]>{
  if(!lines.some(l=>l.tariffVersionId))return lines;
  await query(tx,'SELECT office_id FROM tariff_state WHERE office_id=$1 FOR SHARE',[user.office]);
  const resolved:QuoteLine[]=[];
  for(const line of lines){
    if(!line.tariffVersionId){resolved.push(line);continue;}
    const [v]=await query<TariffVersion>(tx,`SELECT v.*,v.unit_amount::text AS unit_amount,i.code FROM tariff_versions v JOIN tariff_items i ON i.id=v.tariff_id WHERE v.id=$1 AND i.office_id=$2 AND v.version=(SELECT max(version) FROM tariff_versions WHERE tariff_id=i.id)`,[line.tariffVersionId,user.office]);
    if(!v||!v.active||(v.act&&v.act!==act))throw new HttpError(409,'La tarifa seleccionada cambió, está inactiva o no corresponde al acto. Vuelve a seleccionarla.');
    if(line.description!==v.description||line.category!==v.category||toMinor(line.unitAmount)!==toMinor(v.unit_amount))throw new HttpError(400,'El concepto vinculado debe conservar descripción, clasificación e importe de la tarifa. Usa un concepto manual para acordar otro precio.');
    resolved.push({...line,unitAmount:v.unit_amount,tariffSource:{code:v.code,version:v.version}});
  }
  return resolved;
}
