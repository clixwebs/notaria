import {z} from 'zod';
import {HttpError} from './access.ts';

export const personLookupInput=z.object({documentType:z.literal('DNI'),documentNumber:z.string().regex(/^\d{8}$/,'El DNI debe tener ocho dígitos.')}).strict();
const part=z.string().trim().min(1).max(80).refine(s=>!/[\u0000-\u001f\u007f]/.test(s));
const providerResponse=z.object({success:z.literal(true),data:z.object({numero:z.string().regex(/^\d{8}$/),nombres:part,apellido_paterno:part,apellido_materno:z.string().trim().max(80).refine(s=>!/[\u0000-\u001f\u007f]/.test(s)).optional().default('')})});
export type PersonLookup={documentType:'DNI';documentNumber:string;name:string;source:'apiperu';identityVerified:false};

// Fixed provider, server token only; no public proxy, redirects, cache or raw errors.
export async function lookupPerson(raw:unknown,options:{token?:string;fetcher?:typeof fetch}={}):Promise<PersonLookup>{
 const input=personLookupInput.parse(raw),token=options.token??process.env.APIPERU_TOKEN;
 if(!token)throw new HttpError(503,'La consulta de DNI todavía no está activada. Puedes completar el nombre manualmente.');
 try{
  const response=await(options.fetcher??fetch)('https://api.apiperu.dev/dni',{method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({dni:input.documentNumber}),signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
  if(response.status===404)throw new HttpError(404,'El proveedor no encontró datos para este DNI. Comprueba el número o completa el nombre manualmente.');
  if(response.status===429)throw new HttpError(429,'El proveedor alcanzó su límite de consultas. Inténtalo más tarde o completa el nombre manualmente.');
  if(!response.ok)throw new HttpError(502,'No se pudo consultar el DNI. Puedes completar el nombre manualmente.');
  const reader=response.body?.getReader();if(!reader)throw new Error('Missing provider body');
  let size=0;const chunks:Uint8Array[]=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new Error('Provider body limit');}chunks.push(value);}
  const json:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(json&&typeof json==='object'&&'code' in json&&json.code==='document_not_found')throw new HttpError(404,'El proveedor no encontró datos para este DNI. Puedes completar el nombre manualmente.');
  const parsed=providerResponse.safeParse(json);if(!parsed.success||parsed.data.data.numero!==input.documentNumber)throw new Error('Invalid provider contract');
  const d=parsed.data.data,name=[d.nombres,d.apellido_paterno,d.apellido_materno].filter(Boolean).join(' ');
  if(name.length>150)throw new Error('Name exceeds person contract');
  return {...input,name,source:'apiperu',identityVerified:false};
 }catch(error){
  if(error instanceof HttpError)throw error;
  throw new HttpError(502,'El servicio de consulta no respondió correctamente. Puedes completar el nombre manualmente.');
 }
}
