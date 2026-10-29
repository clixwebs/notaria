import {z} from 'zod';
import type {FiscalStatus} from '../lib/fiscal-domain.ts';
export const adapterResponse=z.object({mode:z.literal('simulation'),status:z.enum(['accepted','rejected','processing','unknown','not-found','technical-error']),code:z.string().startsWith('SIM-').max(80),description:z.string().min(3).max(300)}).strict();
export type AdapterResponse=z.infer<typeof adapterResponse>;
export type AdapterInput={key:string;xmlHash:string;scenario:'accept'|'reject'|'processing'|'timeout-after'|'timeout-before'|'unavailable';attempt:number;receipt:{key:string;xmlHash:string;response:AdapterResponse}|null};
export type AdapterResult={key:string;xmlHash:string;observed:AdapterResponse;receipt:AdapterInput['receipt']};
export interface FiscalAdapter {readonly mode:'simulation';submit(input:AdapterInput):AdapterResult;consult(input:AdapterInput):Omit<AdapterResult,'receipt'>}
const response=(status:AdapterResponse['status'],code:string,description:string):AdapterResponse=>({mode:'simulation',status,code:'SIM-'+code,description});
export const simulatedFiscalAdapter:FiscalAdapter={
  mode:'simulation',
  submit(input){
    if(input.receipt){if(input.receipt.key!==input.key||input.receipt.xmlHash!==input.xmlHash)throw new Error('La clave del simulador no corresponde al documento.');return {key:input.key,xmlHash:input.xmlHash,observed:input.receipt.response,receipt:input.receipt};}
    if(input.attempt===1&&input.scenario==='timeout-before')return {key:input.key,xmlHash:input.xmlHash,observed:response('unknown','TIMEOUT-BEFORE','Timeout simulado antes de registrar. Consulta antes de repetir.'),receipt:null};
    if(input.attempt===1&&input.scenario==='unavailable')return {key:input.key,xmlHash:input.xmlHash,observed:response('technical-error','UNAVAILABLE','Fallo técnico simulado, sin registro. Se puede reintentar.'),receipt:null};
    const final=input.scenario==='reject'?response('rejected','REJECTED','Documento rechazado por el simulador; sin comunicación con SUNAT.'):response('accepted','ACCEPTED','Aceptación únicamente del simulador; sin validez tributaria.');
    const receipt={key:input.key,xmlHash:input.xmlHash,response:final};
    const observed=input.attempt===1&&input.scenario==='timeout-after'?response('unknown','TIMEOUT-AFTER','Timeout simulado después de registrar; consulta el mismo documento.'):input.attempt===1&&input.scenario==='processing'?response('processing','PROCESSING','Registro en proceso simulado; consulta el resultado.'):final;
    return {key:input.key,xmlHash:input.xmlHash,observed,receipt};
  },
  consult(input){if(input.receipt){if(input.receipt.key!==input.key||input.receipt.xmlHash!==input.xmlHash)throw new Error('La respuesta no corresponde al documento.');return {key:input.receipt.key,xmlHash:input.receipt.xmlHash,observed:input.receipt.response};}return {key:input.key,xmlHash:input.xmlHash,observed:response('not-found','NOT-FOUND','El simulador no tiene registro de esta clave. Se puede reintentar el mismo documento.')};},
};
export function canSubmit(status:FiscalStatus){return ['prepared','not-found','technical-error'].includes(status);}
export function canConsult(status:FiscalStatus){return status==='unknown'||status==='processing';}
export function canDiscard(status:FiscalStatus){return ['prepared','rejected','not-found','technical-error'].includes(status);}
