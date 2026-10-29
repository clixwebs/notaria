'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { seedCases } from '@/lib/fixtures';
import { transition, type Case, type CaseAction } from '@/lib/domain';

type Store = { cases: Case[]; add: (c: Case) => void; update: (id: string, action: CaseAction) => string | null; notify: (s: string) => void; reset: () => void; dark: boolean; setDark: (b: boolean) => void };
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState(seedCases);
  const [message, setMessage] = useState('');
  const [dark, setDark] = useState(false);
  function update(id: string, action: CaseAction) {
    const c = cases.find(item => item.id === id);
    if (!c) return 'No se encontró el expediente.';
    try {
      const next = transition(c, action, crypto.randomUUID());
      setCases(items => items.map(item => item.id === id ? next : item));
      setMessage(next.history[0].text);
      return null;
    } catch (e) { return e instanceof Error ? e.message : 'No se pudo completar la acción demo.'; }
  }
  return <Context value={{ cases, add: c => setCases(items => [c, ...items]), update, notify: setMessage, reset: () => { setCases(seedCases()); setMessage('Escenario inicial restaurado'); }, dark, setDark }}>
    <div data-theme={dark ? 'dark' : 'light'}>{children}<div className="toast" role="status" aria-live="polite">{message && <><span>{message}</span><button aria-label="Cerrar aviso" onClick={() => setMessage('')}>×</button></>}</div></div>
  </Context>;
}
export function useDemo() { const context = useContext(Context); if (!context) throw new Error('Falta DemoProvider'); return context; }
