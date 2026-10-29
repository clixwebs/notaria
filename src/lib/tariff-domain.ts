import {z} from 'zod';
import {acts,revisionSchema,toMinor} from './case-domain.ts';

export const tariffCommand=z.object({
  requestId:z.uuid(),revision:revisionSchema,tariffId:z.uuid().nullable(),baseVersion:z.number().int().min(0),
  code:z.string().trim().regex(/^[A-Z0-9][A-Z0-9_-]{1,29}$/,'Usa un código de 2 a 30 letras mayúsculas, números, guion o guion bajo.'),
  description:z.string().trim().min(3).max(150),category:z.enum(['Honorarios','Terceros','Otros']),
  unitAmount:z.string().regex(/^\d{1,9}(\.\d{1,2})?$/).refine(v=>{try{return toMinor(v)>0n;}catch{return false;}},'El importe debe ser mayor que cero.'),
  act:z.enum(acts).nullable(),active:z.boolean(),reason:z.string().trim().min(10).max(500),
}).strict();
export type TariffCommand=z.infer<typeof tariffCommand>;
export type TariffVersion={id:string;tariff_id:string;code:string;version:number;description:string;category:'Honorarios'|'Terceros'|'Otros';unit_amount:string;act:typeof acts[number]|null;active:boolean;reason:string;created_at:string;author:string};
export type TariffCatalog={revision:number;items:TariffVersion[];history:TariffVersion[]};
