'use client';
import type {QuoteLine} from '@/lib/case-domain';
import {formatPEN} from '@/lib/case-domain';
import type {TariffCatalog} from '@/lib/tariff-domain';
import {useCaseResource} from './case-context';
export function manualQuoteLine(line:QuoteLine):QuoteLine{return {description:line.description,category:line.category,quantity:line.quantity,unitAmount:line.unitAmount};}
export function quoteLineInput(line:QuoteLine){return {...manualQuoteLine(line),...(line.tariffVersionId?{tariffVersionId:line.tariffVersionId}:{})};}
export function TariffPicker({line,act,index,onChange}:{line:QuoteLine;act:string;index:number;onChange:(line:QuoteLine)=>void}){
  const {data,error,reload}=useCaseResource<TariffCatalog>('/api/tariffs');
  const available=data?.items.filter(v=>v.active&&(!v.act||v.act===act))||[];
  return <>
    <label className="field">Tarifa del concepto {index+1}<select value={line.tariffVersionId||''} disabled={!data} onChange={e=>{
      const v=available.find(v=>v.id===e.target.value);onChange(v?{description:v.description,category:v.category,unitAmount:v.unit_amount,quantity:line.quantity,tariffVersionId:v.id,tariffSource:{code:v.code,version:v.version}}:manualQuoteLine(line));
    }}><option value="">Concepto manual</option>{line.tariffVersionId&&!available.some(v=>v.id===line.tariffVersionId)&&<option value={line.tariffVersionId}>Versión anterior · vuelve a seleccionar</option>}{available.map(v=><option key={v.id} value={v.id}>{v.code} · v{v.version} · {v.description} · {formatPEN(v.unit_amount)}</option>)}</select></label>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <button type="button" className="btn" onClick={reload}>Actualizar tarifas del concepto {index+1}</button>
    <small className="muted">Cambiar descripción, clasificación o precio convierte la línea en concepto manual.</small>
  </>;
}
