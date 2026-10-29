'use client';
import {useRef,useState,type FormEvent} from 'react';
import {Plus,ArrowClockwise} from '@phosphor-icons/react';
import {api} from '@/lib/api';
import {acts,type CaseDetail} from '@/lib/case-domain';
import {variableTypes,variableLabels,type TemplateCatalog,type TemplateVersion,type TemplateVariable} from '@/lib/template-domain';
import {useCaseResource,useCaseOverview} from './case-context';
import {useUser} from './platform-context';
import {PageHeading} from './workspace';
import {CaseError} from './persistent-cases';
import {Badge,ControlledModal,Empty} from './ui';

export function TemplatePage(){
  const {data,error,reload}=useCaseResource<TemplateCatalog>('/api/templates');
  const user=useUser(),canPublish=user?.role==='abogado'||user?.role==='notario';
  const [editing,setEditing]=useState<{item:TemplateVersion|null}|null>(null),[inspect,setInspect]=useState<TemplateVersion|null>(null);
  return <><PageHeading title="Plantillas jurídicas" description="Textos de trabajo por acto, con variables y versiones conservadas."><button className="btn" onClick={reload}><ArrowClockwise size={17} aria-hidden/>Actualizar</button>{canPublish&&<button className="btn primary" disabled={!data} onClick={()=>setEditing({item:null})}><Plus size={18} aria-hidden/>Nueva plantilla</button>}</PageHeading><CaseError message={error}/>
    <section className="panel"><div className="panel-heading"><h2>Catálogo de esta oficina</h2><Badge>{data?.items.length??0} plantillas</Badge></div>{data?.items.length?<div className="table-scroll" tabIndex={0} role="region" aria-label="Plantillas con desplazamiento horizontal"><table className="case-table platform-table"><thead><tr><th>Plantilla / versión</th><th>Acto</th><th>Variables</th><th>Disponibilidad</th><th>Acción</th></tr></thead><tbody>{data.items.map(v=><tr key={v.id}><td><strong>{v.code} · v{v.version}</strong><small>{v.title}</small></td><td>{v.act}</td><td>{v.variables.length} definidas</td><td><Badge tone={v.active?'green':'amber'}>{v.active?'Disponible':'Retirada'}</Badge></td><td><div className="heading-actions"><button className="btn" onClick={()=>setInspect(v)}>Consultar {v.code}</button>{canPublish&&<button className="btn" aria-label={'Versionar '+v.code} onClick={()=>setEditing({item:v})}>Nueva versión</button>}</div></td></tr>)}</tbody></table></div>:!error&&<Empty title={data?'Aún no hay plantillas':'Cargando plantillas'}><p>Abogado o Notario publica el texto y define sus variables. No hay fórmulas jurídicas predeterminadas.</p></Empty>}</section>
    <p className="soft-note">Publicar deja constancia de una revisión profesional del texto base. Cada documento generado es un borrador y requiere su propia revisión. No autoriza, firma ni numera instrumentos.</p>
    {data&&<section className="panel form-panel platform-section"><h2>Historial de publicaciones</h2>{data.items.map(item=><details className="requirement-history" key={item.template_id}><summary>{item.code} · {item.title}</summary><ol className="history">{data.history.filter(v=>v.template_id===item.template_id).map(v=><li key={v.id}><span className="history-dot"/><div><strong>v{v.version} · {v.active?'Disponible':'Retirada'}</strong><small>{v.author} · {new Date(v.created_at).toLocaleString('es-PE',{timeZone:'America/Lima'})}</small><p>{v.reason}</p><button className="btn" onClick={()=>setInspect(v)}>Consultar versión {v.version} de {v.code}</button></div></li>)}</ol></details>)}</section>}
    {editing&&data&&<TemplateEditor item={editing.item} catalog={data} reload={reload} onClose={()=>setEditing(null)}/>}
    {inspect&&<ControlledModal title={inspect.code+' · versión '+inspect.version} onClose={()=>setInspect(null)}><p>{inspect.title} · {inspect.act}</p><div className="draft-body template-preview">{inspect.body}</div><dl className="settings-list">{inspect.variables.map(v=><div key={v.key}><dt>{v.label}</dt><dd>{v.key} · {variableLabels[v.type]}</dd></div>)}</dl><p className="file-hash">SHA-256 <code>{inspect.sha256}</code></p></ControlledModal>}
  </>;
}
function TemplateEditor({item,catalog,reload,onClose}:{item:TemplateVersion|null;catalog:TemplateCatalog;reload:()=>void;onClose:()=>void}){
  const [variables,setVariables]=useState<TemplateVariable[]>(item?.variables||[]),[baseVersion,setBaseVersion]=useState(item?.version||0);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);const request=useRef<{body:string;id:string}|null>(null);
  const current=catalog.items.find(v=>v.template_id===item?.template_id);
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const f=new FormData(e.currentTarget);
    const body=JSON.stringify({revision:catalog.revision,templateId:item?.template_id||null,baseVersion,code:f.get('code'),title:f.get('title'),act:f.get('act'),body:f.get('body'),variables,active:f.get('active')==='on',reason:f.get('reason'),acknowledgeReview:f.get('review')==='on'});
    if(request.current?.body!==body)request.current={body,id:crypto.randomUUID()};setBusy(true);setError('');
    try{await api('/api/templates',{method:'POST',body:JSON.stringify({...JSON.parse(body),requestId:request.current.id})});onClose();reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function change(i:number,patch:Partial<TemplateVariable>){setVariables(all=>all.map((v,j)=>i===j?{...v,...patch}:v));}
  return <ControlledModal title={item?'Publicar nueva versión de plantilla':'Crear plantilla jurídica'} onClose={onClose}><form className="platform-form" onSubmit={save}>
    <CaseError message={error}/>{error&&<button className="btn" type="button" onClick={reload} disabled={busy}>Actualizar contexto sin cerrar</button>}
    <p className="muted">Base v{baseVersion} · Se publicará v{baseVersion+1}. Las versiones anteriores se conservan.</p>
    {current&&current.version!==baseVersion&&<div className="soft-note">La versión vigente es v{current.version}. Consulta sus cambios antes de publicar.<button type="button" className="btn" onClick={()=>setBaseVersion(current.version)}>Usar versión vigente como base</button></div>}
    <label className="field">Código<input name="code" defaultValue={item?.code||''} readOnly={!!item} pattern="[A-Z0-9][A-Z0-9_-]{1,29}" minLength={2} maxLength={30} required/></label>
    <label className="field">Título<input name="title" defaultValue={item?.title||''} minLength={3} maxLength={150} required/></label>
    <label className="field">Acto aplicable<select name="act" defaultValue={item?.act||acts[0]}>{acts.map(a=><option key={a}>{a}</option>)}</select></label>
    <p className="muted">Escribe {'{{clave}}'} para insertar una variable. Campos del expediente disponibles: {'{{expediente.referencia}}'}, {'{{expediente.acto}}'} y {'{{expediente.asunto}}'}. Contenido plano, sin fórmulas ni HTML ejecutable.</p>
    <label className="field">Texto de la plantilla<textarea name="body" className="draft-editor" defaultValue={item?.body||''} minLength={20} maxLength={30000} required/></label>
    <h3>Variables requeridas</h3>{variables.map((v,i)=><fieldset className="quote-line" key={i}><legend>Variable {i+1}</legend><label className="field">Clave {i+1}<input value={v.key} onChange={e=>change(i,{key:e.target.value})} pattern="[a-z][a-z0-9_]{1,39}" required/></label><label className="field">Etiqueta {i+1}<input value={v.label} onChange={e=>change(i,{label:e.target.value})} minLength={2} maxLength={80} required/></label><label className="field">Tipo {i+1}<select value={v.type} onChange={e=>change(i,{type:e.target.value as TemplateVariable['type']})}>{variableTypes.map(t=><option key={t} value={t}>{variableLabels[t]}</option>)}</select></label><button type="button" className="btn" onClick={()=>setVariables(all=>all.filter((_,j)=>j!==i))}>Quitar variable {i+1}</button></fieldset>)}
    <button type="button" className="btn" disabled={variables.length>=30||busy} onClick={()=>setVariables(all=>[...all,{key:'',label:'',type:'text'}])}>Agregar variable</button>
    <label className="toggle-row"><span>Disponible para nuevos borradores</span><input name="active" type="checkbox" defaultChecked={item?.active??true}/></label>
    <label className="field">Motivo y alcance de la revisión<textarea name="reason" minLength={10} maxLength={500} required/></label>
    <label className="toggle-row"><span>He revisado el texto base y sus variables para este acto</span><input name="review" type="checkbox" required/></label>
    <button className="btn primary" disabled={busy}>{busy?'Publicando…':'Publicar versión de plantilla'}</button>
  </form></ControlledModal>;
}
export function TemplateGenerator({c,onClose,onGenerated}:{c:CaseDetail;onClose:()=>void;onGenerated:()=>void}){
  const {data,error:loadError,reload}=useCaseResource<TemplateCatalog>('/api/templates');const {refresh}=useCaseOverview();
  const [selected,setSelected]=useState(''),[values,setValues]=useState<Record<string,string>>({});
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState<{input:string;body:string;sha256:string}|null>(null);
  const request=useRef<{body:string;id:string}|null>(null);
  const templates=data?.items.filter(v=>v.active&&v.act===c.act)||[],v=templates.find(v=>v.id===selected);
  const input=JSON.stringify({caseId:c.id,revision:c.revision,baseVersion:c.draft_version,templateVersionId:selected,values});
  const ready=!!v&&preview?.input===input;
  async function render(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');setPreview(null);try{const p=await api<{body:string;sha256:string}>('/api/templates/preview',{method:'POST',body:input});setPreview({...p,input});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function generate(){if(!ready)return;if(request.current?.body!==input)request.current={body:input,id:crypto.randomUUID()};setBusy(true);setError('');try{await api('/api/templates/generate',{method:'POST',body:JSON.stringify({...JSON.parse(input),requestId:request.current.id})});refresh();onGenerated();onClose();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <ControlledModal title="Generar borrador desde plantilla" onClose={onClose}><form className="platform-form" onSubmit={render}>
    <CaseError message={loadError||error}/><div className="heading-actions"><button type="button" className="btn" onClick={reload} disabled={busy}>Actualizar plantillas</button><button type="button" className="btn" onClick={onGenerated} disabled={busy}>Actualizar contexto del expediente</button></div>
    <p className="muted">{c.act} · contexto {c.revision}. Elige valores explícitos; las fichas actuales no sustituyen las instantáneas del expediente.</p>
    <label className="field">Plantilla disponible<select value={v?.id||''} required onChange={e=>{setSelected(e.target.value);setValues({});setPreview(null);}}><option value="">Selecciona una versión publicada</option>{templates.map(t=><option key={t.id} value={t.id}>{t.code} · v{t.version} · {t.title}</option>)}</select></label>
    {data&&!templates.length&&<p>No hay plantillas disponibles para este acto. Abogado o Notario puede publicarlas desde Plantillas jurídicas.</p>}
    {selected&&!v&&<p role="status">La versión elegida ya no está vigente. Selecciona una plantilla disponible.</p>}
    {v?.variables.map(field=><label className="field" key={field.key}>{field.label}{field.type==='participant'?<select value={values[field.key]||''} required onChange={e=>setValues(all=>({...all,[field.key]:e.target.value}))}><option value="">Selecciona un interviniente</option>{c.participants.map(p=><option key={p.id} value={p.id}>{p.snapshot.name} · {p.role} · {p.snapshot.documentNumber}</option>)}</select>:<input value={values[field.key]||''} required type={field.type==='date'?'date':'text'} inputMode={field.type==='money'?'decimal':field.type==='integer'?'numeric':'text'} maxLength={field.type==='text'?2000:field.type==='date'?10:12} pattern={field.type==='money'?'[0-9]{1,9}([.][0-9]{1,2})?':field.type==='integer'?'[0-9]{1,9}':undefined} onChange={e=>setValues(all=>({...all,[field.key]:e.target.value}))}/>}<small>{variableLabels[field.type]} · {field.key}</small></label>)}
    <button className="btn" disabled={busy||!v}>{busy?'Procesando…':'Vista previa del borrador'}</button>
    {ready&&<><h3>Vista previa · borrador sin firma</h3><div className="draft-body template-preview">{preview.body}</div><p className="file-hash">SHA-256 <code>{preview.sha256}</code></p><p className="soft-note">Se creará v{c.draft_version+1}. Conservará la plantilla y los valores usados. Quedará pendiente de revisión profesional.</p><button type="button" className="btn primary" disabled={busy} onClick={()=>void generate()}>Guardar borrador generado</button></>}
    {error&&<p className="muted">Actualiza el contexto del expediente sin cerrar este formulario y vuelve a revisar la vista previa.</p>}
  </form></ControlledModal>;
}
