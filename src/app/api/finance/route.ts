import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {financeOverview,mutateFinance,financePermission} from '@/server/finance';
import {financeCommand} from '@/lib/finance-domain';
export const runtime='nodejs';
function result(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
async function handler(request:Request){
  try{
    if(request.method==='GET'){
      const user=await actor(request.headers,'finance:read');const {db}=await platform();const url=new URL(request.url);
      const person=url.searchParams.get('personId');const page=z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get('page')||1);const size=z.coerce.number().int().min(1).max(50).parse(url.searchParams.get('pageSize')||25);
      return result(await financeOverview(db,user,person?z.uuid().parse(person):null,page,size));
    }
    assertOrigin(request);
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos.');let size=0;const chunks:Uint8Array[]=[];
    for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>20000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Solicitud JSON no válida.');}
    const command=financeCommand.parse(raw);const user=await actor(request.headers,financePermission(command),{fresh:true});const {db}=await platform();return result(await mutateFinance(db,user,command));
  }catch(e){
    if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);
    if(e instanceof HttpError)return result({message:e.message},e.status);
    if((e as {code?:string}).code==='23505')return result({message:'La referencia, el proveedor o el cargo de origen ya fue registrado. Consulta los movimientos antes de repetirlo.'},409);
    console.error('Finance request failed:',e instanceof Error?e.name:'UnknownError');return result({message:'No se pudo completar la operación. No se han confirmado cambios parciales.'},503);
  }
}
export {handler as GET,handler as POST};
