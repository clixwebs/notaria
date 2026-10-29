import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {tariffCatalog,publishTariff} from '@/server/tariffs';
export const runtime='nodejs';
function result(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
async function handler(request:Request){
  try{
    if(request.method==='GET'){const user=await actor(request.headers,'tariff:read');const {db}=await platform();return result(await tariffCatalog(db,user));}
    assertOrigin(request);const user=await actor(request.headers,'tariff:manage',{fresh:true});
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos.');const chunks:Uint8Array[]=[];let size=0;
    for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>10000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Solicitud JSON no válida.');}
    const {db}=await platform();return result(await publishTariff(db,user,raw));
  }catch(e){
    if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);
    if(e instanceof HttpError)return result({message:e.message},e.status);
    if((e as {code?:string}).code==='23505')return result({message:'El código o solicitud ya existe. Revisa el tarifario antes de repetir.'},409);
    console.error('Tariff request failed:',e instanceof Error?e.name:'UnknownError');return result({message:'No se pudo completar la operación. No se han confirmado cambios parciales.'},503);
  }
}
export {handler as GET,handler as POST};
