'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {api} from '@/lib/api';

export type PersonFormValue={id:string;name:string;document_type:string;document_number:string;revision:number};
type Lookup={documentType:'DNI';documentNumber:string;name:string;source:'apiperu';identityVerified:false};
export function PersonForm({person,onSaved}:{person:PersonFormValue|null;onSaved:()=>void}){
 const [type,setType]=useState(person?.document_type||'DNI'),[number,setNumber]=useState(person?.document_number||''),[name,setName]=useState(person?.name||'');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[looking,setLooking]=useState(false),[lookupMessage,setLookupMessage]=useState(''),[attempt,setAttempt]=useState(0);
 const current=useRef(0),nameRevision=useRef(0);
 useEffect(()=>{
  // Editing an existing record never sends its document to a provider implicitly.
  if(person||type!=='DNI'||!/^\d{8}$/.test(number))return;
  const controller=new AbortController(),revision=nameRevision.current,version=++current.current;
  const timer=setTimeout(async()=>{
   setLooking(true);setLookupMessage('Consultando DNI…');
   try{
    const data=await api<Lookup>('people/lookup',{method:'POST',body:JSON.stringify({documentType:'DNI',documentNumber:number}),signal:controller.signal});
    if(controller.signal.aborted||version!==current.current)return;
    if(data.documentNumber!==number||data.documentType!=='DNI')throw new Error('La respuesta no corresponde al documento consultado.');
    if(nameRevision.current===revision){setName(data.name);setLookupMessage('Nombre obtenido. Revisa los datos antes de guardar.');}
    else setLookupMessage('Consulta terminada. Se conservó el nombre que escribiste; revisa los datos antes de guardar.');
   }catch(error){if(!controller.signal.aborted&&version===current.current)setLookupMessage((error as Error).message);}
   finally{if(!controller.signal.aborted&&version===current.current)setLooking(false);}
  },700);
  return()=>{clearTimeout(timer);controller.abort();};
 },[type,number,attempt,person]);
 function changeDocument(nextType:string,nextNumber:string){current.current++;setType(nextType);setNumber(nextNumber);setLooking(false);setLookupMessage('');if(!person){setName('');nameRevision.current++;}}
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage('');try{
  await api(person?'people/'+person.id:'people',{method:person?'PATCH':'POST',body:JSON.stringify({name,documentType:type,documentNumber:number,...(person?{revision:person.revision}:{})})});onSaved();
 }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}
 return <form className="platform-form" onSubmit={save}>
  <label className="field">Tipo de documento<select name="type" value={type} onChange={e=>changeDocument(e.target.value,'')} disabled={busy}>{['DNI','CE','PASAPORTE','DEMO'].map(t=><option key={t}>{t}</option>)}</select></label>
  <label className="field">Número de documento<input name="number" value={number} onChange={e=>changeDocument(type,type==='DNI'?e.target.value.replace(/\D/g,'').slice(0,8):e.target.value)} minLength={type==='DNI'?8:3} maxLength={type==='DNI'?8:30} inputMode={type==='DNI'?'numeric':'text'} pattern={type==='DNI'?'[0-9]{8}':undefined} required disabled={busy} aria-describedby="person-lookup-status"/></label>
  <div id="person-lookup-status" role="status" aria-live="polite">{lookupMessage||(!person&&type==='DNI'?'Al completar ocho dígitos se consultan nombres y apellidos.':'Completa los datos manualmente.')}</div>
  {!person&&type==='DNI'&&/^\d{8}$/.test(number)&&<button className="btn" type="button" disabled={looking||busy} onClick={()=>setAttempt(n=>n+1)}>Volver a consultar DNI</button>}
  <label className="field">Nombre completo<input name="name" value={name} onChange={e=>{nameRevision.current++;setName(e.target.value);}} minLength={2} maxLength={150} required disabled={busy}/></label>
  {!person&&type==='DNI'&&<p className="muted">La consulta completa nombres desde un proveedor externo. No verifica identidad ni sustituye la identificación notarial.</p>}
  {message&&<p className="form-error" role="alert">{message}</p>}
  <button className="btn primary" disabled={busy||looking}>{busy?'Guardando…':'Guardar persona'}</button>
 </form>;
}
