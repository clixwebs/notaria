import {z} from 'zod';
import type {PersonSnapshot} from './case-domain.ts';
export const procedurePolicyVersion='procedimiento-local-v1';
const base={requestId:z.uuid(),revision:z.number().int().positive()};
const note=z.string().trim().min(20).max(1500);
const evidenceId=z.uuid();
export const identityResults=['coincide','no-coincide','error-tecnico','desconocido'] as const;
export const identityLabels:Record<string,string>={coincide:'Coincidencia simulada','no-coincide':'No coincidencia','error-tecnico':'Error técnico',desconocido:'Resultado desconocido',excepcion:'Excepción local del notario'};
export const diligenceLabels:Record<string,string>={entregada:'Entregada al destinatario',rechazada:'Recepción rechazada','no-encontrado':'Destinatario no encontrado','error-tecnico':'Error técnico',desconocido:'Resultado desconocido'};
export const procedureCommand=z.discriminatedUnion('type',[
  z.object({...base,type:z.literal('identity'),participantId:z.uuid(),draftId:z.uuid(),scenario:z.enum(identityResults),note}).strict(),
  z.object({...base,type:z.literal('identity-resolve'),attemptId:z.uuid(),scenario:z.enum(['coincide','no-coincide','error-tecnico']),note}).strict(),
  z.object({...base,type:z.literal('identity-exception'),attemptId:z.uuid(),evidenceId,note,acknowledge:z.literal(true)}).strict(),
  z.object({...base,type:z.literal('grant'),participantId:z.uuid(),draftId:z.uuid(),identityId:z.uuid(),evidenceId,note,acknowledge:z.literal(true)}).strict(),
  z.object({...base,type:z.literal('authorize'),draftId:z.uuid(),folios:z.number().int().min(1).max(500),note,acknowledge:z.literal(true)}).strict(),
  z.object({...base,type:z.literal('void'),instrumentId:z.uuid(),note}).strict(),
  z.object({...base,type:z.literal('schedule'),instrumentId:z.uuid(),recipient:z.string().trim().min(3).max(200),address:z.string().trim().min(10).max(500),scheduledAt:z.iso.datetime({offset:true}),assigneeId:z.string().min(1).max(100),note}).strict(),
  z.object({...base,type:z.literal('diligence'),attemptId:z.uuid(),outcome:z.enum(['entregada','rechazada','no-encontrado','error-tecnico','desconocido']),occurredAt:z.iso.datetime({offset:true}),evidenceId,note}).strict(),
  z.object({...base,type:z.literal('diligence-resolve'),attemptId:z.uuid(),outcome:z.enum(['entregada','rechazada','no-encontrado','error-tecnico']),occurredAt:z.iso.datetime({offset:true}),evidenceId,note}).strict(),
  z.object({...base,type:z.literal('certificate'),instrumentId:z.uuid(),note,acknowledge:z.literal(true)}).strict(),
  z.object({...base,type:z.literal('delivery'),instrumentId:z.uuid(),participantId:z.uuid(),evidenceId,note,acknowledge:z.literal(true)}).strict(),
]);
export type ProcedureCommand=z.infer<typeof procedureCommand>;
export type ProcedureEvent={id:string;kind:string;data:Record<string,unknown>;created_at:string;author:string};
export type IdentityEvidence={id:string;participantId:string;draftId:string;result:typeof identityResults[number]|'excepcion';snapshot:PersonSnapshot;attemptId?:string;evidenceId?:string;note:string};
export type Instrument={id:string;number:string;act:string;draftId:string;body:string;draftHash:string;contentRevision:number;folioStart:number;folioEnd:number;participants:unknown[];requirements:unknown[];identities:IdentityEvidence[];grants:ProcedureEvent[];note:string};
export type ProcedureState={revision:number;mode:'simulation';events:ProcedureEvent[];identities:IdentityEvidence[];instruments:Instrument[];assignees:{id:string;name:string}[];evidence:{id:string;title:string;version:number;person_id:string;status:string}[]};
export function latestIdentities(events:ProcedureEvent[]):IdentityEvidence[]{
  const seen=new Set<string>(),items:IdentityEvidence[]=[];
  for(const e of [...events].reverse())if(['identity','identity-resolve','identity-exception'].includes(e.kind)){
    const v=e.data as IdentityEvidence,key=v.participantId+':'+v.draftId;
    if(!seen.has(key)){seen.add(key);items.push({...v,id:e.id});}
  }
  return items;
}
export const procedureLabels:Record<string,string>={identity:'Identificación simulada','identity-resolve':'Consulta de resultado simulado','identity-exception':'Excepción local del notario',grant:'Comparecencia / conformidad de prueba',authorize:'Instrumento local registrado',void:'Incidencia: instrumento dejado sin efecto',schedule:'Intento de carta programado',diligence:'Resultado de diligencia','diligence-resolve':'Aclaración de resultado de diligencia',certificate:'Constancia interna de carta',delivery:'Entrega al solicitante'};
export function instrumentActive(events:ProcedureEvent[],id:string){return !events.some(e=>e.kind==='void'&&e.data.instrumentId===id);}
export function internalRecord(instrument:Instrument,events:ProcedureEvent[]){
  const related=events.filter(e=>e.data.instrumentId===instrument.id||['diligence','diligence-resolve'].includes(e.kind)&&events.some(a=>a.kind==='schedule'&&a.id===e.data.attemptId&&a.data.instrumentId===instrument.id));
  const people=instrument.participants.map(v=>{const p=v as {snapshot:PersonSnapshot;role:string};return p.snapshot.name+' · '+p.role+' · '+p.snapshot.documentType+' '+p.snapshot.documentNumber;});
  return 'NOTARIAOS · SIMULACIÓN · SIN FIRMA NI VALIDEZ NOTARIAL\n'+instrument.number+' · '+instrument.act+'\nFolios internos de prueba '+instrument.folioStart+'–'+instrument.folioEnd+'\n'+(instrumentActive(events,instrument.id)?'Registro local':'DEJADO SIN EFECTO')+'\n\nINTERVINIENTES DE LA VERSIÓN\n'+people.join('\n')+'\n\nDOCUMENTO REGISTRADO\n'+instrument.body+'\n\nEvaluación local: '+instrument.note+'\nSHA-256 del borrador: '+instrument.draftHash+'\n\n'+related.map(e=>procedureLabels[e.kind]+' · '+e.author+' · '+new Date(e.created_at).toLocaleString('es-PE',{timeZone:'America/Lima'})+'\n'+procedureEventText(e)).join('\n\n');
}
export function procedureEventText(e:ProcedureEvent){
  const d=e.data,lines:string[]=[];
  if(d.number)lines.push('Número interno: '+d.number);
  if(d.result)lines.push('Identificación: '+(identityLabels[String(d.result)]||d.result));
  if(d.outcome)lines.push('Resultado: '+(diligenceLabels[String(d.outcome)]||d.outcome));
  if(d.recipient)lines.push('Destinatario: '+d.recipient);
  if(d.address)lines.push('Dirección: '+d.address);
  if(d.assignee)lines.push('Responsable: '+d.assignee);
  for(const [key,label] of [['scheduledAt','Programado'],['occurredAt','Realizado']])if(d[key])lines.push(label+': '+new Date(String(d[key])).toLocaleString('es-PE',{timeZone:'America/Lima'}));
  if(d.snapshot){const p=d.snapshot as PersonSnapshot;lines.push('Interviniente: '+p.name+' · '+p.documentType+' '+p.documentNumber);}
  if(d.note)lines.push('Constancia: '+d.note);
  return lines.join('\n');
}
