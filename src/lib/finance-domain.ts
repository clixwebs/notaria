import {z} from 'zod';
export const methods=['efectivo','transferencia','tarjeta'] as const;
export const kinds=['charge','collect','advance','apply','refund','third-in','third-out','third-refund','expense','pay-expense','reverse'] as const;
export type FinanceKind=typeof kinds[number];
export const labels:Record<FinanceKind,string>={charge:'Cargo al cliente',collect:'Cobro aplicado',advance:'Anticipo recibido',apply:'Aplicación de anticipo',refund:'Devolución de anticipo','third-in':'Fondo de terceros recibido','third-out':'Pago por cuenta de terceros','third-refund':'Devolución de fondo de terceros',expense:'Gasto autorizado','pay-expense':'Pago de gasto',reverse:'Reverso de corrección'};
export function cents(value:string):bigint{
  if(!/^-?\d{1,12}(\.\d{1,2})?$/.test(value))throw new Error('Importe decimal no válido.');
  const negative=value.startsWith('-');const [whole,part='']=value.replace('-','').split('.');
  return (BigInt(whole)*100n+BigInt(part.padEnd(2,'0')))*(negative?-1n:1n);
}
export function money(value:bigint):string{const v=value<0n?-value:value;return `${value<0n?'-':''}${v/100n}.${String(v%100n).padStart(2,'0')}`;}
export const amount=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/,'Importe: usa hasta dos decimales y ningún separador de miles.').refine(v=>{try{return cents(v)>0n&&cents(v)<=99999999999999n;}catch{return false;}},'El importe debe ser mayor que cero y estar dentro del rango permitido.');
const nonnegative=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).refine(v=>{try{return cents(v)>=0n&&cents(v)<=99999999999999n;}catch{return false;}});
const base={requestId:z.uuid(),revision:z.number().int().min(0)};
const account={personId:z.uuid(),caseId:z.uuid()};
const note=z.string().trim().min(5).max(500);
const movement={amount,method:z.enum(methods),reference:z.string().trim().min(3).max(120),note};
export const financeCommand=z.discriminatedUnion('type',[
  z.object({...base,type:z.literal('open'),opening:nonnegative,replenishment:nonnegative.default('0.00'),note}).strict(),
  z.object({...base,type:z.literal('close'),counted:nonnegative,note}).strict(),
  z.object({...base,type:z.literal('supplier'),name:z.string().trim().min(3).max(150),document:z.string().trim().min(3).max(30)}).strict(),
  z.object({...base,...account,type:z.literal('charge'),amount,note,expenseId:z.uuid().nullable()}).strict(),
  z.object({...base,...account,type:z.literal('quote-charge'),quoteId:z.uuid(),note}).strict(),
  z.object({...base,...account,...movement,type:z.literal('collect'),targetId:z.uuid()}).strict(),
  z.object({...base,...account,...movement,type:z.literal('advance')}).strict(),
  z.object({...base,...account,type:z.literal('apply'),amount,sourceId:z.uuid(),targetId:z.uuid(),note}).strict(),
  z.object({...base,...account,...movement,type:z.literal('refund'),sourceId:z.uuid()}).strict(),
  z.object({...base,...account,...movement,type:z.literal('third-in')}).strict(),
  z.object({...base,...account,...movement,type:z.literal('third-out'),sourceId:z.uuid(),targetId:z.uuid()}).strict(),
  z.object({...base,...account,...movement,type:z.literal('third-refund'),sourceId:z.uuid()}).strict(),
  z.object({...base,...account,type:z.literal('expense'),amount,note,supplierId:z.uuid(),bucket:z.enum(['own','third']),dueDate:z.iso.date(),evidenceId:z.uuid()}).strict(),
  z.object({...base,...account,...movement,type:z.literal('pay-expense'),targetId:z.uuid()}).strict(),
  z.object({...base,type:z.literal('reverse'),entryId:z.uuid(),note}).strict(),
  z.object({...base,type:z.literal('reconcile'),entryId:z.uuid(),statement:z.string().trim().min(5).max(120),note}).strict(),
  z.object({...base,type:z.literal('unreconcile'),matchId:z.uuid(),note}).strict(),
]);
export type FinanceCommand=z.infer<typeof financeCommand>;
export type FinanceEntry={id:string;sequence:number;reference:string;kind:FinanceKind;person_id:string;case_id:string;person_name:string;person_document:string;kardex:string;amount:string;cash_delta:string;receivable_delta:string;advance_delta:string;third_delta:string;method:typeof methods[number]|null;external_reference:string|null;note:string;source_id:string|null;target_id:string|null;reverses_id:string|null;quote_id:string|null;supplier_id:string|null;bucket:'own'|'third'|null;due_date:string|null;evidence_id:string|null;snapshot:Record<string,unknown>;created_at:string;actor:string;reversed:boolean;remaining:string;match_id:string|null;statement:string|null};
export type FinanceAccount={person_id:string;name:string;document:string;case_id:string;kardex:string;receivable:string;advance:string;third:string;expense_pending:string};
export type FinanceSession={id:string;opening:string;previous_count:string|null;replenishment:string;opened_at:string;opener:string;closed_at:string|null;counted:string|null;expected:string|null;difference:string|null;note:string|null};
export type FinanceData={revision:number;entries:FinanceEntry[];openItems:FinanceEntry[];total:number;page:number;pageSize:number;accounts:FinanceAccount[];clients:{id:string;name:string;document:string}[];cases:{id:string;kardex:string;person_id:string}[];suppliers:{id:string;name:string;document:string}[];quotes:{id:string;case_id:string;version:number;own_total:string;imported:boolean}[];evidence:{id:string;case_id:string;filename:string;version:number}[];sessions:FinanceSession[];open:FinanceSession|null;cash:string;receivable:string;advance:string;third:string;expense_pending:string;expected_opening:string|null;statement?:{client:{id:string;name:string;document:string};entries:FinanceEntry[];accounts:FinanceAccount[];receivable:string;advance:string;third:string;expense_pending:string;total:number;page:number;pageSize:number}|null};
