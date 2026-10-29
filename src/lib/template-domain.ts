import {z} from 'zod';
import {acts,revisionSchema,toMinor,fromMinor} from './case-domain.ts';

export const variableTypes=['text','date','money','integer','participant'] as const;
export const variableLabels={text:'Texto',date:'Fecha',money:'Importe PEN',integer:'Entero',participant:'Interviniente'};
const safeText=z.string().refine(v=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),'El texto contiene caracteres de control.');
export const templateVariable=z.object({key:z.string().regex(/^[a-z][a-z0-9_]{1,39}$/,'Clave: 2–40 letras minúsculas, números o guion bajo.'),label:safeText.pipe(z.string().trim().min(2).max(80)),type:z.enum(variableTypes)}).strict();
export type TemplateVariable=z.infer<typeof templateVariable>;
export const builtins=['expediente.referencia','expediente.acto','expediente.asunto'] as const;
export function checkTemplate(body:string,variables:TemplateVariable[]){
  const keys=variables.map(v=>v.key);
  if(new Set(keys).size!==keys.length)throw new Error('Las claves de variable no pueden repetirse.');
  const allowed=new Set<string>([...keys,...builtins]);const used=new Set<string>();
  const remainder=body.replace(/\{\{([a-z][a-z0-9_.]*)\}\}/g,(_,key:string)=>{if(!allowed.has(key))throw new Error('Variable sin definir: '+key);used.add(key);return '';});
  if(remainder.includes('{{')||remainder.includes('}}'))throw new Error('Usa variables con la sintaxis exacta {{clave}}.');
  if(keys.some(k=>!used.has(k)))throw new Error('Todas las variables definidas deben aparecer en el texto.');
}
export const templateCommand=z.object({requestId:z.uuid(),revision:revisionSchema,templateId:z.uuid().nullable(),baseVersion:z.number().int().min(0),code:z.string().regex(/^[A-Z0-9][A-Z0-9_-]{1,29}$/),title:safeText.pipe(z.string().trim().min(3).max(150)),act:z.enum(acts),body:safeText.pipe(z.string().trim().min(20).max(30000)),variables:z.array(templateVariable).max(30),active:z.boolean(),reason:safeText.pipe(z.string().trim().min(10).max(500)),acknowledgeReview:z.literal(true)}).strict().superRefine((v,ctx)=>{try{checkTemplate(v.body,v.variables);}catch(e){ctx.addIssue({code:'custom',path:['body'],message:(e as Error).message});}});
export const generationInput=z.object({caseId:z.uuid(),revision:revisionSchema,baseVersion:z.number().int().min(0),templateVersionId:z.uuid(),values:z.record(z.string().regex(/^[a-z][a-z0-9_]{1,39}$/),safeText.pipe(z.string().max(2000)))}).strict();
export const generateCommand=generationInput.extend({requestId:z.uuid()});
export type GenerationInput=z.infer<typeof generationInput>;
export type TemplateVersion={id:string;template_id:string;code:string;version:number;title:string;act:typeof acts[number];body:string;variables:TemplateVariable[];active:boolean;reason:string;created_at:string;author:string;sha256:string};
export type TemplateCatalog={revision:number;items:TemplateVersion[];history:TemplateVersion[]};
export type TemplateContext={kardex:string;act:string;subject:string;participants:{id:string;person_id?:string;snapshot:{name:string;documentType:string;documentNumber:string;personRevision:number};role:string}[]};
export type TemplateSource={engine:'plain-v1';versionId:string;code:string;version:number;title:string;act:string;body:string;variables:TemplateVariable[];templateHash:string;values:Record<string,string>;resolved:Record<string,string>};
// Deliberately a single-pass plain-text substitution. No expressions, HTML,
// filesystem includes, conditional clauses, or recursive expansion.
export function renderTemplate(template:Pick<TemplateVersion,'body'|'variables'>,values:Record<string,string>,context:TemplateContext){
  checkTemplate(template.body,template.variables);
  const expected=template.variables.map(v=>v.key);
  if(Object.keys(values).some(k=>!expected.includes(k))||expected.some(k=>!Object.hasOwn(values,k)))throw new Error('Completa exactamente las variables de esta plantilla.');
  const resolved:Record<string,string>=Object.create(null);
  resolved['expediente.referencia']=context.kardex;resolved['expediente.acto']=context.act;resolved['expediente.asunto']=context.subject;
  const normalized:Record<string,string>=Object.create(null);
  for(const v of template.variables){
    const value=values[v.key].trim();if(!value||value.includes('{{')||value.includes('}}')||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw new Error('Revisa la variable «'+v.label+'».');
    let output=value;
    if(v.type==='date'){if(!z.iso.date().safeParse(value).success||value<'0001-01-01')throw new Error('Fecha no válida: '+v.label);output=value.slice(8,10)+'/'+value.slice(5,7)+'/'+value.slice(0,4);}
    if(v.type==='money'){try{output='S/ '+fromMinor(toMinor(value));}catch{throw new Error('Importe PEN no válido: '+v.label);}}
    if(v.type==='integer'){if(!/^\d{1,9}$/.test(value))throw new Error('Entero no válido: '+v.label);output=BigInt(value).toString();}
    if(v.type==='participant'){const p=context.participants.find(p=>p.id===value);if(!p)throw new Error('Selecciona un interviniente de este expediente: '+v.label);output=`${p.snapshot.name} · ${p.snapshot.documentType} ${p.snapshot.documentNumber} · ${p.role}`;}
    normalized[v.key]=v.type==='money'?output.slice(3):v.type==='integer'?output:value;resolved[v.key]=output;
  }
  const body=template.body.replace(/\{\{([a-z][a-z0-9_.]*)\}\}/g,(_,key:string)=>resolved[key]);
  if(body.length<20||body.length>40000)throw new Error('El borrador generado debe contener entre 20 y 40000 caracteres.');
  return {body,values:normalized,resolved};
}
