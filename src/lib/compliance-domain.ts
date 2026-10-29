import {z} from 'zod';
export const areas=['plaft','privacidad'] as const;
export type ComplianceArea=typeof areas[number];
const text=z.string().trim().min(10).max(4000), short=z.string().trim().min(3).max(200),date=z.iso.date().refine(v=>v>='1900-01-01'&&v<='2100-12-31','Usa una fecha entre 1900 y 2100.'),instant=z.iso.datetime({offset:true}),id=z.uuid();
const base={requestId:id,revision:z.number().int().positive()};
export const rights=['informacion','acceso','rectificacion','cancelacion','oposicion'] as const;
export const recipients=['ANPD','titular','CNSD'] as const;
export const complianceCommand=z.discriminatedUnion('type',[
 z.object({...base,type:z.literal('purpose'),code:z.string().regex(/^[A-Z0-9_-]{2,30}$/),title:short,basis:text,notice:text,consentRequired:z.boolean(),retentionDays:z.number().int().min(1).max(36500),source:text,holidays:z.array(date).max(500),calendar:z.enum(['habiles','calendario']),arcoDays:z.object({informacion:z.number().int().min(1).max(365),acceso:z.number().int().min(1).max(365),rectificacion:z.number().int().min(1).max(365),cancelacion:z.number().int().min(1).max(365),oposicion:z.number().int().min(1).max(365)}).strict(),note:text,acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('treatment'),personId:id,purposeId:id,noticeAt:instant,consent:z.enum(['otorgado','no-aplica']),evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('consent'),recordId:id,consent:z.enum(['otorgado','retirado']),evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('risk'),caseId:id,personId:id,operationDate:date,level:z.enum(['bajo','medio','alto']),pep:z.enum(['si','no','pendiente']),beneficialOwner:text,fundsOrigin:text,signals:text,amount:z.string().regex(/^\d{1,9}\.\d{2}$/),nextReview:date,note:text}).strict(),
 z.object({...base,type:z.literal('risk-review'),recordId:id,decision:z.enum(['seguimiento','cerrado','escalar']),level:z.enum(['bajo','medio','alto']),nextReview:date,note:text,acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('arco'),personId:id,purposeId:id,right:z.enum(rights),receivedAt:date,request:text,note:text}).strict(),
 z.object({...base,type:z.literal('arco-identity'),recordId:id,evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('arco-extend'),recordId:id,communicatedAt:date,evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('arco-response'),recordId:id,decision:z.enum(['atender','denegar','parcial']),response:text,deliveredAt:instant,evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('incident'),title:short,knownAt:instant,description:text,note:text}).strict(),
 z.object({...base,type:z.literal('incident-assess'),recordId:id,recipient:z.enum(recipients),applicability:z.enum(['aplica','no-aplica','pendiente']),triggerAt:instant,note:text}).strict(),
 z.object({...base,type:z.literal('incident-receipt'),recordId:id,recipient:z.enum(recipients),sentAt:instant,reference:short,evidence:text,note:text}).strict(),
 z.object({...base,type:z.literal('incident-close'),recordId:id,note:text}).strict(),
 z.object({...base,type:z.literal('hold'),personId:id,caseId:id.nullable(),category:short,until:date.nullable(),note:text}).strict(),
 z.object({...base,type:z.literal('hold-release'),recordId:id,note:text,acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('export'),period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),recordIds:z.array(id).min(1).max(100),note:text,acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('export-receipt'),recordId:id,receivedAt:instant,reference:short,evidence:text,note:text}).strict(),
]);
export type ComplianceCommand=z.infer<typeof complianceCommand>;
export function commandArea(c:ComplianceCommand):ComplianceArea{return c.type==='risk'||c.type==='risk-review'||c.type==='export'||c.type==='export-receipt'?'plaft':'privacidad';}
export type ComplianceEvent={id:string;kind:string;data:Record<string,unknown>;sha256:string;created_at:string;author:string;sequence:number};
export type ComplianceRecord={id:string;kind:string;title:string;person_id:string|null;case_id:string|null;created_at:string;events:ComplianceEvent[]};
export type ComplianceState={revision:number;area:ComplianceArea;records:ComplianceRecord[];people:{id:string;name:string}[];cases:{id:string;kardex:string}[]};
export function addDays(start:string,days:number,calendar:'habiles'|'calendario',holidays:string[]=[]){let d=new Date(start+'T12:00:00Z');for(let n=0;n<days;){d=new Date(d.getTime()+86400000);const s=d.toISOString().slice(0,10);if(calendar==='calendario'||(![0,6].includes(d.getUTCDay())&&!holidays.includes(s)))n++;}return d.toISOString().slice(0,10);}
export function limaDate(value=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);}
export function incidentDeadline(trigger:string){return new Date(new Date(trigger).getTime()+48*3600000).toISOString();}
export function lastEvent(r:ComplianceRecord,kind?:string){return r.events.filter(e=>!kind||e.kind===kind).at(-1);}
export function arcoDeadline(r:ComplianceRecord){const first=r.events[0].data;return String(lastEvent(r,'arco-extend')?.data.dueDate||first.dueDate);}
export const complianceLabels:Record<string,string>={purpose:'Finalidad y política',treatment:'Tratamiento y aviso',consent:'Consentimiento',risk:'Diligencia y riesgo','risk-review':'Revisión humana',arco:'Solicitud ARCO','arco-identity':'Verificación del solicitante','arco-extend':'Ampliación motivada','arco-response':'Respuesta entregada',incident:'Incidente','incident-assess':'Evaluación de aplicabilidad','incident-receipt':'Constancia de notificación externa','incident-close':'Cierre del incidente',hold:'Conservación y bloqueo','hold-release':'Levantamiento del bloqueo',export:'Exportación local','export-receipt':'Cargo externo declarado'};
