import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {channels,integrationCommand} from '@/lib/integration-domain';
import {integrationState,executeIntegration,downloadIntegration,channelPermission} from '@/server/integrations';
export const runtime='nodejs';
const result=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handler(request:Request){try{
 await actor(request.headers);const {db}=await platform(),url=new URL(request.url);
 if(request.method==='GET'){
  const channel=z.enum(channels).parse(url.searchParams.get('channel')),user=await actor(request.headers,channelPermission(channel)),file=url.searchParams.get('file');
  if(file){z.uuid().parse(file);return new Response(await downloadIntegration(db,user,file,channel),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="manifiesto-local-${file}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
  return result(await integrationState(db,user,channel));
 }
 assertOrigin(request);const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan datos.');let size=0;const chunks:Uint8Array[]=[];for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>20000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'JSON no válido.');}
 const c=integrationCommand.parse(raw),user=await actor(request.headers,channelPermission(c.channel),{fresh:true});return result(await executeIntegration(db,user,c));
 }catch(e){if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);if(e instanceof HttpError)return result({message:e.message},e.status);if((e as {code?:string}).code==='23505')return result({message:'Solicitud duplicada. Revisa el contexto.'},409);console.error('Integration failed:',e instanceof Error?e.name:'Unknown');return result({message:'No se confirmó la operación. Reintenta con la misma solicitud.'},503);}}
export {handler as GET,handler as POST};
