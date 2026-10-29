'use client';
import {useRef,useState,type FormEvent} from 'react';
import {Plus,ArrowClockwise} from '@phosphor-icons/react';
import {api} from '@/lib/api';
import {acts,formatPEN} from '@/lib/case-domain';
import type {TariffCatalog,TariffVersion} from '@/lib/tariff-domain';
import {useCaseResource} from './case-context';
import {useUser} from './platform-context';
import {PageHeading} from './workspace';
import {CaseError} from './persistent-cases';
import {Badge,ControlledModal,Empty} from './ui';

export function TariffPage(){
  const {data,error:loadError,reload}=useCaseResource<TariffCatalog>('/api/tariffs');
  const user=useUser();const canManage=user?.role==='administracion';
  const [editing,setEditing]=useState<{item:TariffVersion|null}|null>(null);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const request=useRef<{body:string;id:string}|null>(null);
  function begin(item:TariffVersion|null){setError('');request.current=null;setEditing({item});}
  const base=editing?.item?data?.items.find(v=>v.tariff_id===editing.item?.tariff_id):null;
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!data||!editing)return;
    const f=new FormData(e.currentTarget);const body=JSON.stringify({revision:data.revision,tariffId:editing.item?.tariff_id||null,baseVersion:base?.version||0,code:f.get('code'),description:f.get('description'),category:f.get('category'),unitAmount:f.get('amount'),act:f.get('act')||null,active:f.get('active')==='on',reason:f.get('reason')});
    if(request.current?.body!==body)request.current={body,id:crypto.randomUUID()};
    setBusy(true);setError('');
    try{await api('/api/tariffs',{method:'POST',body:JSON.stringify({...JSON.parse(body),requestId:request.current.id})});setEditing(null);reload();}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <>
    <PageHeading title="Tarifario" description="Conceptos comerciales en soles, con versiones e historial.">
      <button className="btn" onClick={reload}><ArrowClockwise size={17} aria-hidden/>Actualizar</button>
      {canManage&&<button className="btn primary" disabled={!data} onClick={()=>begin(null)}><Plus size={18} aria-hidden/>Nueva tarifa</button>}
    </PageHeading>
    <CaseError message={loadError}/>
    <section className="panel">
      <div className="panel-heading"><h2>Catálogo de esta oficina</h2><Badge>{data?.items.length??0} conceptos</Badge></div>
      {data?.items.length?<div className="table-scroll" tabIndex={0} role="region" aria-label="Tarifario con desplazamiento horizontal"><table className="case-table platform-table"><thead><tr><th>Concepto / versión</th><th>Acto</th><th>Clasificación</th><th>Importe unitario</th><th>Estado</th>{canManage&&<th>Acción</th>}</tr></thead><tbody>{data.items.map(v=><tr key={v.id}><td><strong>{v.code} · v{v.version}</strong><small>{v.description}</small></td><td>{v.act||'Todos los actos'}</td><td>{v.category}</td><td>{formatPEN(v.unit_amount)}</td><td><Badge tone={v.active?'green':'amber'}>{v.active?'Activa':'Inactiva'}</Badge></td>{canManage&&<td><button className="btn" onClick={()=>begin(v)} aria-label={'Versionar '+v.code}>Nueva versión</button></td>}</tr>)}</tbody></table></div>:!loadError&&<Empty title={data?'Aún no hay tarifas':'Cargando tarifario'}><p>Administración registra los conceptos acordados por la notaría.</p></Empty>}
    </section>
    <p className="soft-note">Cada publicación conserva el historial. Cambiar o desactivar una tarifa no modifica presupuestos ni aceptaciones anteriores. Los importes son propuestas comerciales; el tratamiento tributario y la emisión fiscal siguen pendientes.</p>
    {data&&<section className="panel form-panel platform-section"><h2>Historial de publicaciones</h2>{data.items.map(item=><details className="requirement-history" key={item.tariff_id}><summary>{item.code} · {item.description}</summary><ol className="history">{data.history.filter(v=>v.tariff_id===item.tariff_id).map(v=><li key={v.id}><span className="history-dot"/><div><strong>v{v.version} · {formatPEN(v.unit_amount)} · {v.active?'Activa':'Inactiva'}</strong><small>{v.author} · {new Date(v.created_at).toLocaleString('es-PE',{timeZone:'America/Lima'})}</small><p>{v.description} · {v.category} · {v.act||'Todos los actos'}</p><p>{v.reason}</p></div></li>)}</ol></details>)}</section>}
    {editing&&<ControlledModal title={editing.item?'Publicar nueva versión de tarifa':'Crear tarifa'} onClose={()=>setEditing(null)}><form className="platform-form" onSubmit={save}>
      <CaseError message={error}/>{error&&<button className="btn" type="button" disabled={busy} onClick={reload}>Actualizar contexto sin cerrar</button>}
      <p className="muted">Se publicará como v{(base?.version||0)+1}. Revisión del catálogo: {data?.revision}. Las versiones anteriores permanecen.</p>
      <label className="field">Código<input name="code" defaultValue={editing.item?.code||''} readOnly={!!editing.item} minLength={2} maxLength={30} pattern="[A-Z0-9][A-Z0-9_-]{1,29}" required/></label>
      <label className="field">Descripción<input name="description" defaultValue={editing.item?.description||''} minLength={3} maxLength={150} required/></label>
      <label className="field">Clasificación<select name="category" defaultValue={editing.item?.category||'Honorarios'}>{['Honorarios','Terceros','Otros'].map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="field">Acto aplicable<select name="act" defaultValue={editing.item?.act||''}><option value="">Todos los actos</option>{acts.map(a=><option key={a}>{a}</option>)}</select></label>
      <label className="field">Importe unitario en soles<input name="amount" inputMode="decimal" pattern="[0-9]{1,9}([.][0-9]{1,2})?" defaultValue={editing.item?.unit_amount||''} required/></label>
      <label className="toggle-row"><span>Disponible para nuevos presupuestos</span><input type="checkbox" name="active" defaultChecked={editing.item?.active??true}/></label>
      <label className="field">Motivo de la publicación<textarea name="reason" minLength={10} maxLength={500} required/></label>
      <button className="btn primary" disabled={busy||!data}>{busy?'Publicando…':'Publicar versión de tarifa'}</button>
    </form></ControlledModal>}
  </>;
}
