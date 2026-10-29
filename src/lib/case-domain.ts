import { z } from 'zod';
import type {TemplateSource} from './template-domain.ts';
export const acts=['Compraventa','Certificación de firmas','Carta notarial'] as const;
export const requirementsByAct:Record<typeof acts[number],string[]>={
  Compraventa:['Minuta para revisión','Documentos de intervinientes','Representación aplicable','Antecedente registral'],
  'Certificación de firmas':['Documento para certificación','Documentos de comparecientes'],
  'Carta notarial':['Texto de la carta','Datos y dirección del destinatario'],
};
export const policyVersion='orientativa-2026-01';
const decimal=z.string().regex(/^\d{1,9}(\.\d{1,2})?$/,'Usa un importe positivo con hasta dos decimales, sin separador de miles.');
export const quoteLineSchema=z.object({description:z.string().trim().min(3).max(150),quantity:z.number().int().min(1).max(9999),unitAmount:decimal,category:z.enum(['Honorarios','Terceros','Otros']),tariffVersionId:z.uuid().optional()}).strict();
export type QuoteLine=z.infer<typeof quoteLineSchema>&{tariffSource?:{code:string;version:number}};
export function toMinor(value:string):bigint{
  if(!/^\d{1,9}(\.\d{1,2})?$/.test(value))throw new Error('Importe decimal no válido.');
  const [whole,part='']=value.split('.');return BigInt(whole)*100n+BigInt(part.padEnd(2,'0'));
}
export function fromMinor(value:bigint):string{return `${value/100n}.${String(value%100n).padStart(2,'0')}`;}
export function quoteTotals(lines:QuoteLine[]){
  const total=lines.reduce((sum,line)=>{const value=toMinor(line.unitAmount);if(value<=0n||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>9999)throw new Error('Revisa los importes y cantidades de cada concepto.');return sum+value*BigInt(line.quantity);},0n);
  if(!lines.length||total<=0n||total>99999999999999n)throw new Error('El total excede el rango permitido.');
  return fromMinor(total);
}
export const revisionSchema=z.number().int().positive();
export const civilDate=z.iso.date();
export const createCaseInput=z.object({requestId:z.uuid(),act:z.enum(acts),subject:z.string().trim().min(5).max(200),personId:z.uuid()}).strict();
export const caseCommand=z.discriminatedUnion('type',[
  z.object({type:z.literal('participant'),revision:revisionSchema,personId:z.uuid(),role:z.string().trim().min(3).max(80)}).strict(),
  z.object({type:z.literal('requirement'),revision:revisionSchema,requirementId:z.uuid(),done:z.boolean(),note:z.string().trim().max(500),evidenceId:z.uuid().nullable()}).strict(),
  z.object({type:z.literal('requirement-add'),revision:revisionSchema,title:z.string().trim().min(5).max(200)}).strict(),
  z.object({type:z.literal('draft'),revision:revisionSchema,baseVersion:z.number().int().min(0),body:z.string().trim().min(20).max(40000)}).strict(),
  z.object({type:z.literal('review'),revision:revisionSchema,draftId:z.uuid(),note:z.string().trim().min(10).max(500)}).strict(),
  z.object({type:z.literal('quote'),revision:revisionSchema,baseVersion:z.number().int().min(0),validUntil:civilDate,lines:z.array(quoteLineSchema).min(1).max(30)}).strict(),
  z.object({type:z.literal('accept-quote'),revision:revisionSchema,quoteId:z.uuid(),participantId:z.uuid(),reference:z.string().trim().min(10).max(500)}).strict(),
  z.object({type:z.literal('task'),revision:revisionSchema,title:z.string().trim().min(5).max(200),dueDate:civilDate.nullable()}).strict(),
  z.object({type:z.literal('task-check'),revision:revisionSchema,taskId:z.uuid(),done:z.boolean()}).strict(),
  z.object({type:z.literal('note'),revision:revisionSchema,body:z.string().trim().min(5).max(2000)}).strict(),
]);
export type CaseCommand=z.infer<typeof caseCommand>;
export type PersonSnapshot={name:string;documentType:string;documentNumber:string;personRevision:number};
export type CaseSummary={id:string;kardex:string;subject:string;act:typeof acts[number];owner:string;revision:number;created_at:string;applicant:string;pending:number;draft_version:number;reviewed:boolean;quote_version:number;quote_accepted:boolean};
export type CaseDetail=CaseSummary&{content_revision:number;policy_version:string;requirementHistory:{id:string;title:string;done:boolean;note:string;evidence_id:string|null;baseline:boolean;created_at:string;actor:string}[];participants:{id:string;person_id:string;snapshot:PersonSnapshot;role:string}[];requirements:{id:string;title:string;done:boolean;note:string;evidence_id:string|null}[];drafts:{id:string;version:number;body:string;snapshot:{participants:unknown[];requirements:unknown[];policyVersion:string;templateSource?:TemplateSource};sha256:string;created_at:string;author:string}[];reviews:{id:string;draft_id:string;context_revision:number;note:string;reviewer:string;created_at:string}[];quotes:{id:string;version:number;valid_until:string;lines:QuoteLine[];total:string;created_at:string;accepted_at:string|null;accepted_by:PersonSnapshot|null;acceptance_reference:string|null}[];order:{reference:string;accepted_quote_id:string;revision:number}|null;tasks:{id:string;title:string;due_date:string|null;done:boolean}[];notes:{id:string;body:string;author:string;created_at:string}[];events:{id:string;action:string;actor:string;created_at:string}[]};
export function caseStatus(c:CaseSummary){return c.pending?'Requisitos pendientes':!c.draft_version?'Por redactar':c.reviewed?'Preparación revisada':'En revisión';}
export function formatPEN(value:string){const [whole,part='00']=value.split('.');return `S/ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')}.${part.padEnd(2,'0')}`;}
export function canonicalJSON(value:unknown):string{
  if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJSON((value as Record<string,unknown>)[key])).join(',')+'}';
  return JSON.stringify(value);
}
