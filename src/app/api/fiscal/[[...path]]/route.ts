import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {fiscalOverview,fiscalDetail,fiscalArtifact,mutateFiscal,fiscalPermission} from '@/server/fiscal';
import {fiscalCommand} from '@/lib/fiscal-domain';
export const runtime='nodejs';
function result(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
async function handler(request:Request,context:{params:Promise<{path?:string[]}>}){
  try{
    const {path=[]}=await context.params;
    if(request.method==='GET'){
      const user=await actor(request.headers,'fiscal:read');const {db}=await platform();
      if(!path.length){const url=new URL(request.url);const page=z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get('page')||1),size=z.coerce.number().int().min(1).max(50).parse(url.searchParams.get('pageSize')||20);return result(await fiscalOverview(db,user,page,size));}
      const id=z.uuid().parse(path[0]);if(path.length===1)return result(await fiscalDetail(db,user,id));
      if(path.length===2){const kind=z.enum(['xml','qr','response']).parse(path[1]);const file=await fiscalArtifact(db,user,id,kind);return new Response(new Uint8Array(file.bytes),{headers:{'Content-Type':file.type,'Content-Disposition':`${kind==='qr'?'inline':'attachment'}; filename="${file.filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
      throw new HttpError(404,'Ruta no disponible.');
    }
    assertOrigin(request);if(path.length)throw new HttpError(404,'Ruta no disponible.');
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos.');const chunks:Uint8Array[]=[];let size=0;
    for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>20000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Solicitud JSON no válida.');}
    const command=fiscalCommand.parse(raw);const user=await actor(request.headers,fiscalPermission(command),{fresh:true});const {db}=await platform();return result(await mutateFiscal(db,user,command));
  }catch(e){
    if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);
    if(e instanceof HttpError)return result({message:e.message},e.status);
    if((e as {code?:string}).code==='23505')return result({message:'El cargo, correlativo o solicitud ya tiene un documento de prueba. Actualiza antes de repetir.'},409);
    console.error('Fiscal request failed:',e instanceof Error?e.name:'UnknownError');return result({message:'No se pudo completar la operación. No se han confirmado cambios parciales.'},503);
  }
}
export {handler as GET,handler as POST};
