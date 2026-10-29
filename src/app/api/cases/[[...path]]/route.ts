import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {createPersistentCase,caseDetail,listCases,mutateCase,overview} from '@/server/cases';
import {acts,caseCommand} from '@/lib/case-domain';
export const runtime='nodejs';
async function body(request:Request){
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos de la solicitud.');
  const chunks:Uint8Array[]=[];let size=0;for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>200000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}
  try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Solicitud JSON no válida.');}
}
async function handler(request:Request,context:{params:Promise<{path?:string[]}>}){
  try{
    const {path=[]}=await context.params;const id=path[0];if(path.length>1)throw new HttpError(404,'Ruta no disponible.');
    if(request.method!=='GET')assertOrigin(request);
    const input=request.method==='POST'?await body(request):null;
    const command=id&&request.method==='POST'?caseCommand.parse(input):null;
    const permission=request.method==='GET'?'case:read':command?.type==='review'?'case:review':command?.type==='quote'||command?.type==='accept-quote'?'quote:write':'case:write';
    const user=await actor(request.headers,permission,{fresh:command?.type==='review'||command?.type==='accept-quote'});const {db}=await platform();
    if(request.method==='GET'&&!id){
      const url=new URL(request.url);const page=z.coerce.number().int().min(1).max(100000).parse(url.searchParams.get('page')||1);const size=z.coerce.number().int().min(1).max(50).parse(url.searchParams.get('pageSize')||10);const search=z.string().max(150).parse(url.searchParams.get('search')||'');const act=z.union([z.literal(''),z.enum(acts)]).parse(url.searchParams.get('act')||'');
      return result(await listCases(db,user,search,page,size,act));
    }
    if(request.method==='GET'&&id==='overview')return result(await overview(db,user));
    if(request.method==='GET'&&id)return result(await caseDetail(db,user,z.uuid().parse(id)));
    if(request.method==='POST'&&!id)return result(await createPersistentCase(db,user,input));
    if(request.method==='POST'&&id)return result(await mutateCase(db,user,z.uuid().parse(id),command));
    throw new HttpError(404,'Operación no disponible.');
  }catch(e){
    if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);
    if(e instanceof HttpError)return result({message:e.message},e.status);
    if((e as {code?:string}).code==='23505')return result({message:'Ya existe ese registro o aceptación. Actualiza el expediente.'},409);
    console.error('Case request failed:',e instanceof Error?e.name:'UnknownError');return result({message:'No se pudo completar la operación. No se han confirmado cambios parciales.'},503);
  }
}
function result(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export {handler as GET,handler as POST};
