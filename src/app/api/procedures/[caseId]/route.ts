import {z} from 'zod';
import {platform} from '@/server/platform';
import {actor,assertOrigin,HttpError} from '@/server/access';
import {procedureState,mutateProcedure,procedureArtifact} from '@/server/procedures';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const result=(v:unknown,status=200)=>Response.json(v,{status,headers});
async function handler(request:Request,context:{params:Promise<{caseId:string}>}){
  try{
    const {caseId}=await context.params;z.uuid().parse(caseId);
    if(request.method==='POST')assertOrigin(request);
    const user=await actor(request.headers,'procedure:read',{fresh:request.method==='POST'}),{db}=await platform();
    if(request.method==='GET'){
      const instrument=new URL(request.url).searchParams.get('instrument');
      if(instrument){z.uuid().parse(instrument);const file=await procedureArtifact(db,user,caseId,instrument);return new Response(file.text,{headers:{...headers,'Content-Type':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="${file.number}.txt"`}});}
      return result(await procedureState(db,user,caseId));
    }
    const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Faltan los datos.');let size=0;const chunks:Uint8Array[]=[];
    for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>25000){await reader.cancel();throw new HttpError(413,'Solicitud demasiado grande.');}chunks.push(r.value);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'JSON no válido.');}
    return result(await mutateProcedure(db,user,caseId,raw));
  }catch(e){if(e instanceof z.ZodError)return result({message:e.issues[0]?.message||'Revisa los datos.'},400);if(e instanceof HttpError)return result({message:e.message},e.status);if((e as {code?:string}).code==='23505')return result({message:'Solicitud concurrente. Actualiza el contexto antes de continuar.'},409);console.error('Procedure failed:',e instanceof Error?e.name:'Unknown');return result({message:'No se confirmó la operación. No se guardan cambios parciales.'},503);}
}
export {handler as GET,handler as POST};
