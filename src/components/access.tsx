'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { api, authPost } from '@/lib/api';
import Image from 'next/image';
import { Eye, EyeSlash, Pause, Play, Scales } from '@phosphor-icons/react';

function subscribe(callback: () => void) {
  const wide = window.matchMedia('(min-width: 1024px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  wide.addEventListener('change', callback); reduced.addEventListener('change', callback);
  return () => { wide.removeEventListener('change', callback); reduced.removeEventListener('change', callback); };
}
function snapshot() { return window.matchMedia('(min-width: 1024px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
export function Logo() { return <span className="product-logo"><span className="product-mark"><Scales size={30} weight="bold" aria-hidden /><i /></span><span>Notaria<span>OS</span><small>Gestión notarial</small></span></span>; }
function FlagPe() { return <span className="flag-pe" aria-hidden><i /><i /><i /></span>; }
function LoginVideo() {
  const enabled = useSyncExternalStore(subscribe, snapshot, () => false);
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  return <div className="eldial-video-card"><div className="eldial-video-frame"><Image src="/login-loop.jpg" alt="Presentación de la plataforma ERP de Clix Web Studio" fill priority sizes="(min-width: 1024px) 52vw, 1px" />{enabled && <video ref={video} autoPlay muted loop playsInline preload="auto" disablePictureInPicture aria-hidden><source src="/login-loop.mp4" type="video/mp4" /></video>}</div>{enabled && <button className="video-toggle" aria-label={paused ? 'Reproducir presentación de Clix' : 'Pausar presentación de Clix'} onClick={() => { if (paused) { void video.current?.play(); } else video.current?.pause(); setPaused(!paused); }}>{paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}{paused ? 'Reproducir' : 'Pausar'}</button>}</div>;
}
export function Access() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [setup,setSetup]=useState<boolean|null>(null);
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [code,setCode]=useState('');
  const [recovery,setRecovery]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{api<{needsSetup:boolean}>('state').then(data=>setSetup(data.needsSetup)).catch(()=>setError('No se pudo abrir el servicio. Recarga para reintentar.'));},[]);
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{
    if(setup){await api('bootstrap',{method:'POST',body:JSON.stringify({name,email,password})});setSetup(false);setError('Cuenta creada. Ingresa con tu contraseña para configurar el segundo factor.');}
    else if(step){await authPost(recovery?'two-factor/verify-backup-code':'two-factor/verify-totp',recovery?{code,disableSession:false,trustDevice:false}:{code,trustDevice:false});window.location.assign(new URL('/inicio',window.location.origin).href);}
    else{const data=await authPost<{twoFactorRedirect?:boolean}>('sign-in/email',{email,password,rememberMe:false});if(data.twoFactorRedirect)setStep(1);else window.location.assign(new URL('/seguridad',window.location.origin).href);}
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <div className="eldial-access">
    <div className="login-aurora" aria-hidden><span className="login-blob login-blob-1" /><span className="login-blob login-blob-2" /><span className="login-blob login-blob-3" /><span className="login-blob login-blob-4" /><span className="login-grain" /></div>
    <div className="eldial-access-grid"><aside className="eldial-login-story" aria-label="Clix Web Studio"><LoginVideo /><span className="peru-pill"><FlagPe />Hecho en Perú</span><h2>Un ERP hecho por peruanos, para peruanos.</h2><p>Expedientes, documentos y gestión notarial en un solo sistema, pensado para la forma de trabajar de la notaría peruana.</p></aside>
      <main className="eldial-login-main"><div className="eldial-login-wrapper"><div className="eldial-login-card"><div className="login-product"><Logo /></div><h1>{setup ? 'Configura tu espacio' : step ? 'Verificación en dos pasos' : 'Bienvenido de vuelta'}</h1><p className="login-intro">{setup ? 'Crea la cuenta administradora de esta instalación.' : step ? 'Ingresa el código de tu aplicación autenticadora.' : 'Ingresa tus credenciales para continuar.'}</p><span className="login-office"><span />Entorno de revisión · NotariaOS</span>
      <form className="eldial-login-form" onSubmit={submit}>
        {step ? <><label htmlFor="access-code">{recovery?'Código de recuperación':'Código de autenticación'}</label><input id="access-code" value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" inputMode={recovery?'text':'numeric'} required /><button className="login-back" type="button" onClick={()=>{setRecovery(!recovery);setCode('');}}>{recovery?'Usar aplicación autenticadora':'Usar un código de recuperación'}</button></> : <>
        {setup && <><label htmlFor="access-name">Nombre de administrador</label><input id="access-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" minLength={2} maxLength={100} required /></>}
        <label htmlFor="access-email">Correo de acceso</label><input id="access-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required />
        <label htmlFor="access-password">Contraseña</label><div className="eldial-password"><input id="access-password" type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={setup?'new-password':'current-password'} minLength={setup?12:1} maxLength={128} required /><button type="button" aria-label={show?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeSlash size={20} aria-hidden/>:<Eye size={20} aria-hidden/>}</button></div></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="eldial-login-submit" type="submit" disabled={busy||setup===null}>{busy?'Procesando…':setup?'Crear cuenta administradora':step?'Verificar y continuar':'Ingresar'}</button>
        <p className="login-demo-note">{setup?'Usa una contraseña de al menos 12 caracteres. El acceso a datos exige activar TOTP.':'Acceso con sesión de servidor y segundo factor. Sin credenciales prellenadas.'}</p>
      </form>
      <p className="login-restriction">Acceso restringido al personal autorizado</p></div><div className="login-peru-mobile"><FlagPe />Un ERP hecho por peruanos, para peruanos.</div><p className="eldial-login-footer">© 2026 Clix Web Studio · Todos los derechos reservados<br />Gestión jurídica con identidad Clix</p></div></main>
    </div>
  </div>;
}
