'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { X, ArrowLeft, ArrowRight, FolderOpen } from '@phosphor-icons/react';
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function statusTone(s: string) { return s === 'Observado' ? 'amber' : s === 'Entregado' || s === 'Listo para entrega' ? 'green' : 'blue'; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty"><FolderOpen size={36} aria-hidden /><h3>{title}</h3>{children}</div>; }
export function Modal({ label, title, children, className = '', icon }: { label: string; title: string; children: ReactNode; className?: string; icon?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return <><button className={className || 'btn'} onClick={() => ref.current?.showModal()}>{icon}{label}</button><dialog ref={ref} className="modal" aria-label={title}><header><h2>{title}</h2><button className="icon-btn" aria-label="Cerrar diálogo" onClick={() => ref.current?.close()}><X size={22} aria-hidden /></button></header>{children}</dialog></>;
}
export function ControlledModal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const dialog=ref.current;dialog?.showModal();
    return()=>{dialog?.close();if(opener?.isConnected)opener.focus();};
  },[]);
  return <dialog ref={ref} className="modal" aria-label={title} onCancel={e=>{e.preventDefault();onClose();}}><header><h2>{title}</h2><button className="icon-btn" aria-label="Cerrar diálogo" onClick={onClose}><X size={22} aria-hidden/></button></header>{children}</dialog>;
}
// Selección de páginas de ElDial/ui/pagination.tsx; controles nativos y aria-current adaptados.
export function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (n: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages.at(-1) !== '…') pages.push('…');
  }
  return <nav className="pagination" aria-label="Páginas de expedientes"><button className="icon-btn" disabled={current === 1} aria-label="Página anterior" onClick={() => onChange(current - 1)}><ArrowLeft aria-hidden size={18} /></button>{pages.map((p, i) => p === '…' ? <span key={`e${i}`}>…</span> : <button className={`icon-btn ${current === p ? 'selected' : ''}`} key={p} aria-current={current === p ? 'page' : undefined} onClick={() => onChange(p)}>{p}</button>)}<button className="icon-btn" disabled={current === total} aria-label="Página siguiente" onClick={() => onChange(current + 1)}><ArrowRight size={18} aria-hidden /></button></nav>;
}
export function Back({ href = '/expedientes', children = 'Expedientes' }: { href?: string; children?: ReactNode }) { return <Link className="back" href={href}><ArrowLeft size={16} aria-hidden />{children}</Link>; }
