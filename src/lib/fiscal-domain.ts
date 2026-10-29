import {z} from 'zod';
import {cents,money} from './finance-domain.ts';
import type {QuoteLine} from './case-domain.ts';

export const fiscalContractVersion='notariaos-fiscal-sim-v1';
export const simulationLegend='SIMULACIÓN · SIN VALIDEZ TRIBUTARIA · SIN ENVÍO A SUNAT';
export const simulatedIssuer={ruc:'00000000000',name:'EMISOR FICTICIO NOTARIAOS',address:'DOMICILIO DE PRUEBA · SIN REGISTRO FISCAL'} as const;
export const fiscalStatuses=['prepared','unknown','processing','not-found','technical-error','accepted','rejected','discarded'] as const;
export type FiscalStatus=typeof fiscalStatuses[number];
export const fiscalStatusLabels:Record<FiscalStatus,string>={prepared:'Preparado · simulación',unknown:'Resultado desconocido · consultar',processing:'En proceso · simulado','not-found':'No registrado · simulado','technical-error':'Fallo técnico · sin registro',accepted:'Aceptado por simulador',rejected:'Rechazado por simulador',discarded:'Descartado internamente'};
export const fiscalScenarios=['accept','reject','processing','timeout-after','timeout-before','unavailable'] as const;
export const fiscalScenarioLabels:Record<typeof fiscalScenarios[number],string>={accept:'Aceptación simulada',reject:'Rechazo simulado',processing:'Procesamiento y consulta posterior','timeout-after':'Timeout después de registrar','timeout-before':'Timeout antes de registrar',unavailable:'Fallo técnico antes de registrar'};
export const taxTreatments=['gravado18','exonerado','inafecto'] as const;
export type TaxTreatment=typeof taxTreatments[number];
export const taxLabels:Record<TaxTreatment,string>={gravado18:'Gravado 18% incluido · prueba',exonerado:'Exonerado · prueba',inafecto:'Inafecto · prueba'};
export function validXMLText(value:string){return [...value].every(c=>{const v=c.codePointAt(0)!;return v===9||v===10||v===13||(v>=32&&v<=0xd7ff)||(v>=0xe000&&v<=0xfffd)||(v>=0x10000&&v<=0x10ffff);});}
const name=z.string().trim().min(3).max(150).refine(validXMLText,'El texto contiene caracteres no admitidos en XML.');
export const fiscalReceiver=z.object({name,documentType:z.enum(['1','4','6','7']),documentNumber:z.string().trim().min(3).max(20).regex(/^[A-Z0-9]+$/)}).strict().superRefine((v,c)=>{
  const valid=v.documentType==='6'?/^\d{11}$/.test(v.documentNumber):v.documentType==='1'?/^\d{8}$/.test(v.documentNumber):v.documentType==='4'?/^\d{9,12}$/.test(v.documentNumber):/^[A-Z0-9]{3,20}$/.test(v.documentNumber);
  if(!valid)c.addIssue({code:'custom',path:['documentNumber'],message:'Revisa el formato del documento del receptor de prueba.'});
});
export const fiscalTaxChoice=z.object({lineIndex:z.number().int().min(0).max(29),tax:z.enum(taxTreatments),purpose:z.enum(['service','identity-query'])}).strict();
const base={requestId:z.uuid(),revision:z.number().int().min(0)};
const doc={documentId:z.uuid(),documentRevision:z.number().int().positive()};
export const fiscalCommand=z.discriminatedUnion('type',[
  z.object({...base,type:z.literal('prepare'),chargeId:z.uuid(),documentType:z.enum(['01','03']),receiver:fiscalReceiver,taxes:z.array(fiscalTaxChoice).min(1).max(30),scenario:z.enum(fiscalScenarios),acknowledgeSimulation:z.literal(true)}).strict(),
  z.object({...base,...doc,type:z.literal('submit')}).strict(),
  z.object({...base,...doc,type:z.literal('consult')}).strict(),
  z.object({...base,...doc,type:z.literal('discard'),reason:z.string().trim().min(10).max(500)}).strict(),
]);
export type FiscalCommand=z.infer<typeof fiscalCommand>;
export type FiscalLine={sourceIndex:number;description:string;category:'Honorarios'|'Otros';quantity:number;unitGross:string;base:string;taxAmount:string;gross:string;tax:TaxTreatment;purpose:'service'|'identity-query';tariffVersionId?:string};
export type FiscalSnapshot={contractVersion:typeof fiscalContractVersion;mode:'simulation';issuer:typeof simulatedIssuer;receiver:z.infer<typeof fiscalReceiver>;documentType:'01'|'03';issueDate:string;reference:string;series:'SIM-F001'|'SIM-B001';sequence:number;source:{chargeId:string;chargeReference:string;caseId:string;personId:string;quoteId:string;quoteVersion:number};lines:FiscalLine[];base:string;tax:string;total:string;legend:typeof simulationLegend};
export function fiscalLines(lines:QuoteLine[],choices:z.infer<typeof fiscalTaxChoice>[],chargeAmount:string){
  const own=lines.map((line,index)=>({line,index})).filter(({line})=>line.category!=='Terceros');
  if(!own.length||choices.length!==own.length||new Set(choices.map(t=>t.lineIndex)).size!==own.length)throw new Error('Selecciona un tratamiento de prueba para cada concepto propio, sin duplicados.');
  const result:FiscalLine[]=own.map(({line,index})=>{
    const choice=choices.find(t=>t.lineIndex===index);if(!choice)throw new Error('El tratamiento no corresponde a los conceptos propios del cargo.');
    if(!validXMLText(line.description))throw new Error('Un concepto contiene caracteres no admitidos en XML; corrige la propuesta por una nueva versión.');
    if(line.category==='Terceros')throw new Error('Los fondos de terceros no son conceptos propios.');
    const gross=cents(line.unitAmount)*BigInt(line.quantity);if(gross<=0n)throw new Error('El concepto debe tener importe positivo.');
    // Explicit TEST policy: gross prices are preserved; half-up rounding per line.
    const net=choice.tax==='gravado18'?(gross*100n+59n)/118n:gross;
    return {sourceIndex:index,description:line.description,category:line.category,quantity:line.quantity,unitGross:money(cents(line.unitAmount)),base:money(net),taxAmount:money(gross-net),gross:money(gross),tax:choice.tax,purpose:choice.purpose,...(line.tariffVersionId?{tariffVersionId:line.tariffVersionId}:{})};
  });
  const total=result.reduce((s,l)=>s+cents(l.gross),0n);if(total!==cents(chargeAmount)||total>99999999999999n)throw new Error('Los conceptos propios no coinciden con el importe exacto del cargo.');
  const net=result.reduce((s,l)=>s+cents(l.base),0n);return {lines:result,base:money(net),tax:money(total-net),total:money(total)};
}
export type FiscalDocument={id:string;reference:string;document_type:'01'|'03';issue_date:string;source_charge_id:string;total:string;tax:string;status:FiscalStatus;revision:number;scenario:typeof fiscalScenarios[number];created_at:string;author:string;source_reversed:boolean};
export type FiscalEventResponse={status:FiscalStatus;code:string;description:string;mode:'simulation'};
export type FiscalEvent={id:string;version:number;operation:string;status:FiscalStatus;response:FiscalEventResponse;actor:string;created_at:string;note:string};
export type FiscalDetail=FiscalDocument&{snapshot:FiscalSnapshot;xml_sha256:string;qr_sha256:string;qr_payload:string;events:FiscalEvent[]};
export type FiscalData={revision:number;documents:FiscalDocument[];total:number;page:number;pageSize:number;charges:{id:string;reference:string;kardex:string;person_name:string;amount:string;quote_version:number;lines:QuoteLine[]}[]};
