import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {templateCatalog,publishTemplate,previewTemplate,generateTemplate} from '@/server/templates';
export const runtime='nodejs';
const result=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handler(request:Request,context:{params:Promise<{path?:string[]}>}){
  try{
    const {path=[]}=await context.params;
    if(path.length>1||path.length===1&&!['preview','generate'].includes(path[0]))throw new HttpError(404,'Ruta no disponible.');
    if(request.method==='GET'&&!path.length){const user=await actor(request.headers,'template:read');return result(await templateCatalog((await platform()).db,user));}
    if(request.method!=='POST')throw new HttpError(404,'Operación no disponible.');
    assertOrigin(request);const user=await actor(request.headers,path.length?'template:use':'template:publish',{fresh:true});
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos.');let size=0;const chunks:Uint8Array[]=[];
    for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>250000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Solicitud JSON no válida.');}
    const {db}=await platform();return result(await (path[0]==='preview'?previewTemplate(db,user,raw):path[0]==='generate'?generateTemplate(db,user,raw):publishTemplate(db,user,raw)));
  }catch(e){
    if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);
    if(e instanceof HttpError)return result({message:e.message},e.status);
    if((e as {code?:string}).code==='23505')return result({message:'El código, versión o solicitud ya existe. Actualiza el contexto.'},409);
    console.error('Template request failed:',e instanceof Error?e.name:'UnknownError');return result({message:'No se pudo completar la operación. No se han confirmado cambios parciales.'},503);
  }
}
export {handler as GET,handler as POST};
