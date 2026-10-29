import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {areas,complianceCommand,commandArea} from '@/lib/compliance-domain';
import {executeCompliance,complianceState,downloadCompliance} from '@/server/compliance';
export const runtime='nodejs';
const result=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handler(request:Request){try{
 const {db}=await platform(),url=new URL(request.url);await actor(request.headers);
 if(request.method==='GET'){
  const file=url.searchParams.get('file');if(file){if(!z.uuid().safeParse(file).success)throw new HttpError(400,'Identificador no válido.');const user=await actor(request.headers,'compliance:plaft');const data=await downloadCompliance(db,user,file);return new Response(data.content,{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="revision-local-${file}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
  const area=z.enum(areas).parse(url.searchParams.get('area'));const user=await actor(request.headers,area==='plaft'?'compliance:plaft':'compliance:privacy');return result(await complianceState(db,user,area));
 }
 assertOrigin(request);const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan datos.');let size=0;const chunks:Uint8Array[]=[];for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>100000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'JSON no válido.');}const command=complianceCommand.parse(raw);const user=await actor(request.headers,commandArea(command)==='plaft'?'compliance:plaft':'compliance:privacy',{fresh:true});return result(await executeCompliance(db,user,command));
}catch(e){if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);if(e instanceof HttpError)return result({message:e.message},e.status);if((e as {code?:string}).code==='23505')return result({message:'Solicitud o versión duplicada. Actualiza el contexto.'},409);console.error('Compliance failed:',e instanceof Error?e.name:'Unknown');return result({message:'No se confirmó la operación. Reintenta con la misma solicitud.'},503);}}
export {handler as GET,handler as POST};
