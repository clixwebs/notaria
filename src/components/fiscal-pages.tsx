'use client';
import {useRef,useState,type FormEvent} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowClockwise,Plus} from '@phosphor-icons/react';
import {api} from '@/lib/api';
import {formatPEN} from '@/lib/case-domain';
import {fiscalStatusLabels,fiscalScenarios,fiscalScenarioLabels,taxTreatments,taxLabels,simulationLegend,type FiscalData,type FiscalDetail,type FiscalStatus} from '@/lib/fiscal-domain';
import {useCaseResource} from './case-context';
import {useUser} from './platform-context';
import {PageHeading} from './workspace';
import {CaseError} from './persistent-cases';
import {ControlledModal,Badge,Empty,Pagination} from './ui';
const sendable=(s:FiscalStatus)=>['prepared','not-found','technical-error'].includes(s);
const consultable=(s:FiscalStatus)=>['unknown','processing'].includes(s);
const discardable=(s:FiscalStatus)=>['prepared','rejected','not-found','technical-error'].includes(s);
export function FiscalPage(){
  const user=useUser();const allowed=!!user&&['administracion','caja'].includes(user.role);const manage=user?.role==='administracion';
  const [page,setPage]=useState(1);const {data,error:loadError,reload}=useCaseResource<FiscalData>('/api/fiscal?page='+page);
  const [preparing,setPreparing]=useState(false);const [chargeId,setChargeId]=useState('');const [detailId,setDetailId]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const retry=useRef<{signature:string;payload:Record<string,unknown>}|null>(null);
  function refresh(){retry.current=null;reload();}
  async function command(value:Record<string,unknown>){
    if(!data||busy)return false;setBusy(true);setError('');const signature=JSON.stringify(value);
    if(retry.current?.signature!==signature)retry.current={signature,payload:{...value,revision:data.revision,requestId:crypto.randomUUID()}};
    try{await api('/api/fiscal',{method:'POST',body:JSON.stringify(retry.current.payload)});retry.current=null;reload();return true;}
    catch(e){const err=e as Error&{status?:number};setError(err.message);if(err.status&&err.status!==503)retry.current=null;return false;}finally{setBusy(false);}
  }
  async function prepare(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const f=new FormData(e.currentTarget);const charge=data?.charges.find(c=>c.id===chargeId);if(!charge)return;
    const saved=await command({type:'prepare',chargeId,documentType:f.get('kind'),receiver:{name:f.get('name'),documentType:f.get('documentType'),documentNumber:f.get('documentNumber')},taxes:charge.lines.map((_,lineIndex)=>({lineIndex,tax:f.get('tax-'+lineIndex),purpose:f.get('purpose-'+lineIndex)})),scenario:f.get('scenario'),acknowledgeSimulation:f.get('ack')==='on'});
    if(saved){setPreparing(false);setChargeId('');}
  }
  if(!user)return <Empty title="Cargando laboratorio fiscal"/>;
  if(!allowed)return <><PageHeading title="Laboratorio fiscal"/><Empty title="Acceso restringido"><p>Este espacio de prueba corresponde a Administración y Caja.</p></Empty></>;
  const charge=data?.charges.find(c=>c.id===chargeId);
  return <>
    <PageHeading title="Laboratorio fiscal" description="Contrato XML/QR y respuestas simuladas, con historial por documento.">
      <button className="btn" onClick={refresh}><ArrowClockwise size={17} aria-hidden/>Actualizar</button>
      {manage&&<button className="btn primary" disabled={!data?.charges.length} onClick={()=>{setError('');retry.current=null;setPreparing(true);}}><Plus size={18} aria-hidden/>Preparar documento de prueba</button>}
    </PageHeading>
    <p className="soft-note"><strong>{simulationLegend}</strong><br/>Emisor ficticio, numeración interna SIM y archivos sin firma digital. Ninguna acción de este módulo cambia saldos o pagos.</p>
    <CaseError message={loadError||(!preparing&&!detailId?error:'')}/>
    <section className="panel"><div className="panel-heading"><h2>Documentos de prueba</h2><Badge>{data?.total??0} documentos</Badge></div>
      {data?.documents.length?<div className="table-scroll" tabIndex={0} role="region" aria-label="Documentos fiscales de prueba con desplazamiento horizontal"><table className="case-table platform-table"><thead><tr><th>Documento interno</th><th>Tipo</th><th>Total</th><th>Estado de prueba</th><th>Acción</th></tr></thead><tbody>{data.documents.map(d=><tr key={d.id}><td><strong>{d.reference}</strong><small>{d.issue_date} · {d.author}</small>{d.source_reversed&&<small>Cargo de origen revertido</small>}</td><td>{d.document_type==='01'?'Factura · prueba':'Boleta · prueba'}</td><td>{formatPEN(d.total)}</td><td><Badge tone={d.status==='accepted'?'green':d.status==='rejected'||d.status==='unknown'?'amber':'blue'}>{fiscalStatusLabels[d.status]}</Badge></td><td><button className="btn" aria-label={'Abrir '+d.reference} onClick={()=>{setError('');retry.current=null;setDetailId(d.id);}}>Ver documento</button></td></tr>)}</tbody></table></div>:!loadError&&<Empty title={data?'Sin documentos de prueba':'Cargando documentos'}><p>Primero registra un presupuesto aceptado y genera explícitamente su cargo propio en Caja.</p><Link className="btn" href="/caja">Abrir caja y cobros</Link></Empty>}
      {data&&<div className="table-footer"><span>{data.total} documentos · página {page}</span><Pagination current={page} total={Math.max(1,Math.ceil(data.total/20))} onChange={setPage}/></div>}
    </section>
    {!data?.charges.length&&<p className="muted">No hay cargos de presupuesto disponibles sin un documento de prueba activo. Los anticipos y fondos de terceros no se ofrecen como origen.</p>}
    {preparing&&<ControlledModal title="Preparar documento de prueba" onClose={()=>setPreparing(false)}><form className="platform-form" onSubmit={prepare}>
      <CaseError message={error}/>{error&&<button type="button" className="btn" onClick={refresh}>Actualizar contexto sin cerrar</button>}
      <label className="field">Cargo propio de presupuesto<select value={chargeId} required onChange={e=>setChargeId(e.target.value)}><option value="">Selecciona un cargo</option>{data?.charges.map(c=><option value={c.id} key={c.id}>{c.reference} · {c.person_name} · {formatPEN(c.amount)}</option>)}</select></label>
      {charge&&<p className="muted">{charge.kardex} · presupuesto v{charge.quote_version} · {formatPEN(charge.amount)}. Solo conceptos propios; Terceros queda excluido.</p>}
      <label className="field">Tipo de documento de prueba<select name="kind" required><option value="01">Factura de prueba</option><option value="03">Boleta de prueba</option></select></label>
      <label className="field">Nombre del receptor de prueba<input name="name" minLength={3} maxLength={150} required/></label>
      <label className="field">Documento del receptor<select name="documentType" required><option value="6">RUC · formato de 11 dígitos</option><option value="1">DNI · formato de 8 dígitos</option><option value="4">Carné de extranjería</option><option value="7">Pasaporte</option></select></label>
      <label className="field">Número del receptor de prueba<input name="documentNumber" minLength={3} maxLength={20} pattern="[A-Z0-9]+" required/></label>
      <p className="muted">Validación de formato local, sin consulta de identidad o RUC. La factura de prueba requiere RUC.</p>
      {charge?.lines.map((line,i)=><fieldset className="quote-line-editor" key={charge.id+'-'+i}><legend>Concepto propio {i+1}</legend><strong>{line.description}</strong><p>{line.quantity} × {formatPEN(line.unitAmount)}</p><label className="field">Tratamiento de prueba {i+1}<select name={'tax-'+i} defaultValue="" required><option value="" disabled>Elegir supuesto tributario</option>{taxTreatments.map(t=><option key={t} value={t}>{taxLabels[t]}</option>)}</select></label><label className="field">Finalidad del concepto {i+1}<select name={'purpose-'+i}><option value="service">Servicio propio</option><option value="identity-query">Consulta de identidad · concepto separado</option></select></label></fieldset>)}
      <p className="soft-note">Los importes del cargo se tratan como precios finales para este ejercicio. El supuesto gravado desglosa 18% incluido por línea, sin añadir dinero al cargo. Estos supuestos no configuran el tratamiento fiscal real de la notaría.</p>
      <label className="field">Escenario del simulador<select name="scenario" required>{fiscalScenarios.map(s=><option key={s} value={s}>{fiscalScenarioLabels[s]}</option>)}</select></label>
      <label className="toggle-row"><span>Confirmo que prepararé una simulación sin validez tributaria</span><input type="checkbox" name="ack" required/></label>
      <button className="btn primary" disabled={busy||!charge}>{busy?'Preparando…':'Guardar documento de prueba'}</button>
    </form></ControlledModal>}
    {detailId&&<FiscalDocumentModal id={detailId} manage={manage} busy={busy} error={error} refresh={refresh} command={command} onClose={()=>setDetailId('')}/>}
  </>;
}
function FiscalDocumentModal({id,manage,busy,error,refresh,command,onClose}:{id:string;manage:boolean;busy:boolean;error:string;refresh:()=>void;command:(v:Record<string,unknown>)=>Promise<boolean>;onClose:()=>void}){
  const {data:d,error:loadError,reload}=useCaseResource<FiscalDetail>('/api/fiscal/'+id);const [discarding,setDiscarding]=useState(false);
  async function act(type:string,reason?:string){if(!d)return;if(await command({type,documentId:id,documentRevision:d.revision,...(reason?{reason}:{})})){reload();setDiscarding(false);}}
  return <ControlledModal title="Documento fiscal de prueba" onClose={onClose}><CaseError message={loadError||error}/>{error&&<button type="button" className="btn" onClick={()=>{refresh();reload();}}>Actualizar contexto sin cerrar</button>}{d?<div className="platform-form">
    <strong>{d.reference}</strong><Badge tone={d.status==='accepted'?'green':'amber'}>{fiscalStatusLabels[d.status]}</Badge>
    <p className="soft-note">{simulationLegend}. La respuesta del simulador no es una CDR de SUNAT.</p>
    <dl className="settings-list"><div><dt>Receptor de prueba</dt><dd>{d.snapshot.receiver.name} · {d.snapshot.receiver.documentNumber}</dd></div><div><dt>Origen</dt><dd>{d.snapshot.source.chargeReference} · presupuesto v{d.snapshot.source.quoteVersion}</dd></div><div><dt>Base del ejercicio</dt><dd>{formatPEN(d.snapshot.base)}</dd></div><div><dt>Impuesto del ejercicio</dt><dd>{formatPEN(d.tax)}</dd></div><div><dt>Total conservado</dt><dd>{formatPEN(d.total)}</dd></div></dl>
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Conceptos y supuestos tributarios"><table className="case-table platform-table"><thead><tr><th>Concepto</th><th>Supuesto</th><th>Base</th><th>Impuesto</th><th>Total</th></tr></thead><tbody>{d.snapshot.lines.map((l,i)=><tr key={i}><td>{l.description}<small>{l.purpose==='identity-query'?'Consulta de identidad separada':'Servicio propio'}</small></td><td>{taxLabels[l.tax]}</td><td>{formatPEN(l.base)}</td><td>{formatPEN(l.taxAmount)}</td><td>{formatPEN(l.gross)}</td></tr>)}</tbody></table></div>
    <Image unoptimized src={'/api/fiscal/'+id+'/qr'} width={300} height={300} alt="QR de simulación sin validez tributaria" style={{maxWidth:'100%',height:'auto'}}/>
    <p className="file-hash">SHA-256 XML <code>{d.xml_sha256}</code></p>
    <div className="heading-actions"><a className="btn" href={'/api/fiscal/'+id+'/xml'}>Descargar XML de prueba</a><a className="btn" href={'/api/fiscal/'+id+'/qr'} download>Descargar QR de prueba</a><a className="btn" href={'/api/fiscal/'+id+'/response'}>Descargar respuesta simulada</a></div>
    {d.source_reversed&&<p className="form-error">El cargo de origen está revertido; no se permite simular otro envío.</p>}
    <button className="btn primary" disabled={busy||!sendable(d.status)||d.source_reversed} onClick={()=>void act('submit')}>{busy?'Procesando…':'Simular envío local'}</button>
    <button className="btn" disabled={busy||!consultable(d.status)} onClick={()=>void act('consult')}>Consultar resultado simulado</button>
    {manage&&<button className="btn" disabled={busy||!discardable(d.status)} onClick={()=>setDiscarding(v=>!v)}>Descartar documento de prueba</button>}
    {discarding&&<form className="platform-form" onSubmit={e=>{e.preventDefault();void act('discard',String(new FormData(e.currentTarget).get('reason')));}}><label className="field">Motivo del descarte<textarea name="reason" minLength={10} maxLength={500} required/></label><button className="btn" disabled={busy}>Confirmar descarte interno</button></form>}
    <h3>Historial inmutable</h3><ol className="history">{d.events.map(e=><li key={e.id}><span className="history-dot"/><div><strong>v{e.version} · {fiscalStatusLabels[e.status]}</strong><small>{e.actor} · {new Date(e.created_at).toLocaleString('es-PE',{timeZone:'America/Lima'})}</small><p>{e.response.code} · {e.response.description}</p>{e.note&&<p>{e.note}</p>}</div></li>)}</ol>
  </div>:!loadError&&<Empty title="Cargando documento de prueba"/>}</ControlledModal>;
}
