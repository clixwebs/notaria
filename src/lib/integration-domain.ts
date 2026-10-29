import {z} from 'zod';
export const channels=['reniec','sunarp','fiscal'] as const;
export type IntegrationChannel=typeof channels[number];
export const channelLabels:Record<IntegrationChannel,string>={reniec:'Identidad y lector',sunarp:'Firma y traslado asistido',fiscal:'Facturación · preparación de demo'};
export const requirements:Record<IntegrationChannel,readonly string[]>={
 reniec:['Convenio y modalidad RENIEC de la notaría','Lector, modelo, controlador y equipo autorizados','Contrato técnico, tratamiento de biometría y contingencia','Credenciales fuera del ERP y autorización de pruebas reales'],
 sunarp:['Certificado y titular habilitados; custodia del dispositivo','Validador de firma, cadena, revocación y sello de tiempo','Acceso SID y actos/canal admitidos confirmados','Formato del traslado y autorización de presentación'],
 fiscal:['Proveedor y cuenta de prueba propios de la notaría','Contrato, catálogos y reglas tributarias revisados','Certificado, series y secretos en custodia segura','Autorización de demo real; habilitación productiva separada'],
};
export const integrationLabels:Record<string,string>={assessment:'Evaluación de dependencias',spike:'Prueba local del contrato de identidad',transfer:'Preparar traslado de ejercicio',assisted:'Seguimiento de archivo externo',signature:'Validación de firma simulada',validation:'Informe externo de firma declarado',receipt:'Registrar cargo',tracking:'Registrar seguimiento',demo:'Evidencia declarada de demo externa'};
const note=z.string().trim().min(10).max(2000),base={requestId:z.uuid(),revision:z.number().int().positive(),channel:z.enum(channels),note};
export const signatureOutcomes=['valid','invalid','revoked','unavailable'] as const;
export const integrationCommand=z.discriminatedUnion('type',[
 z.object({...base,type:z.literal('assessment'),responsible:z.string().trim().min(3).max(120),facts:note,pending:note,acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('spike'),channel:z.literal('reniec'),device:z.string().trim().min(3).max(200)}).strict(),
 z.object({...base,type:z.literal('transfer'),channel:z.literal('sunarp'),caseId:z.uuid(),instrumentId:z.uuid(),acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('assisted'),channel:z.literal('sunarp'),caseId:z.uuid(),evidenceId:z.uuid(),acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('validation'),channel:z.literal('sunarp'),recordId:z.uuid(),artifactHash:z.string().regex(/^[a-f0-9]{64}$/),outcome:z.enum(signatureOutcomes),validator:z.string().trim().min(3).max(150),reportId:z.uuid(),occurredAt:z.iso.datetime({offset:true}),acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('signature'),channel:z.literal('sunarp'),recordId:z.uuid(),artifactHash:z.string().regex(/^[a-f0-9]{64}$/),outcome:z.enum(signatureOutcomes)}).strict(),
 z.object({...base,type:z.literal('receipt'),channel:z.literal('sunarp'),recordId:z.uuid(),validationId:z.uuid(),artifactHash:z.string().regex(/^[a-f0-9]{64}$/),reference:z.string().trim().min(3).max(120),occurredAt:z.iso.datetime({offset:true}),proofId:z.uuid().nullable(),acknowledge:z.literal(true)}).strict(),
 z.object({...base,type:z.literal('tracking'),channel:z.literal('sunarp'),recordId:z.uuid(),receiptId:z.uuid(),status:z.enum(['observado','subsanado','inscrito','tachado','desconocido']),reference:z.string().trim().min(3).max(120),occurredAt:z.iso.datetime({offset:true})}).strict(),
 z.object({...base,type:z.literal('demo'),channel:z.literal('fiscal'),documentId:z.uuid(),xmlHash:z.string().regex(/^[a-f0-9]{64}$/),outcome:z.enum(['accepted','rejected','unknown','unavailable']),reference:z.string().trim().min(3).max(120),occurredAt:z.iso.datetime({offset:true}),evidence:note,acknowledge:z.literal(true)}).strict(),
]);
export type IntegrationCommand=z.infer<typeof integrationCommand>;
export type IntegrationEvent={id:string;sequence:number;kind:string;data:Record<string,unknown>;sha256:string;created_at:string;author:string};
export type IntegrationRecord={id:string;kind:string;title:string;case_id:string|null;events:IntegrationEvent[]};
export type IntegrationState={channel:IntegrationChannel;revision:number;realEnabled:false;requirements:readonly string[];records:IntegrationRecord[];instruments:{id:string;caseId:string;label:string}[];documents:{id:string;reference:string;xmlHash:string}[];evidence:{id:string;caseId:string;label:string}[]};
export function integrationStatus(r:IntegrationRecord){
 const last=r.events.at(-1)!;
 if(r.kind==='assessment')return 'Declarado · Conexión real bloqueada';
 if(r.kind==='spike')return 'Contrato local probado · Hardware no probado';
 if(r.kind==='demo')return 'Declaración no verificada · '+String(last.data.outcome);
 if(r.kind==='assisted')return last.kind==='assisted'?'Archivo externo · Sin validación ni presentación acreditadas': 'Declarado, no verificado · '+String(last.data.status||last.data.outcome||'cargo externo');
 if(last.kind==='transfer')return 'Preparado · Sin firma ni presentación';
 if(last.kind==='signature')return 'Firma simulada · '+String(last.data.outcome);
 if(last.kind==='receipt')return 'Cargo simulado · Sin presentación real';
 return 'Seguimiento simulado · '+String(last.data.status);
}
