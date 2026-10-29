export type Act = 'Compraventa' | 'Certificación de firmas' | 'Carta notarial';
export type Identity = 'Pendiente' | 'Coincidencia simulada' | 'No coincidencia' | 'Error técnico';
export type Participant = { id: string; name: string; document: string; role: string; identity: Identity };
export type Requirement = { id: string; title: string; done: boolean };
export type Payment = { id: string; cents: number; method: string };
export type Attempt = { id: string; result: 'Entregada' | 'Sin respuesta' | 'Dirección no localizada'; note: string };
export type Case = {
  id: string; act: Act; subject: string; owner: string; created: string; due: string;
  participants: Participant[]; requirements: Requirement[];
  version: number; reviewedVersion: number | null; authorizedVersion: number | null;
  feeCents: number; payments: Payment[]; attempts: Attempt[]; delivered: boolean;
  history: { id: string; text: string }[];
};

// Adaptado del calendario explícito America/Lima de ElDial/src/lib/dates.ts.
export function limaDate(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}
export const money = (cents: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(cents / 100);
export const paid = (c: Case) => c.payments.reduce((sum, p) => sum + p.cents, 0);
export const balance = (c: Case) => c.feeCents - paid(c);
export function parseCents(value: string): number | null {
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimals = ''] = value.trim().replace(',', '.').split('.');
  const result = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return result > 0 && Number.isSafeInteger(result) ? result : null;
}
export function authorizationBlockers(c: Case): string[] {
  return [
    ...c.requirements.filter(r => !r.done).map(r => `Revisar: ${r.title.toLowerCase()}`),
    ...c.participants.filter(p => p.identity !== 'Coincidencia simulada').map(p => `Identificación pendiente o no concluyente: ${p.name}`),
    ...(c.reviewedVersion !== c.version ? [`Revisar la versión ${c.version} del documento`] : []),
  ];
}
export function deliveryBlockers(c: Case): string[] {
  return [
    ...(c.authorizedVersion !== c.version ? ['Falta la actuación notarial simulada sobre la versión actual'] : []),
    ...(balance(c) > 0 ? [`Saldo pendiente: ${money(balance(c))}`] : []),
    ...(c.act === 'Carta notarial' && c.attempts.length === 0 ? ['Registrar al menos un resultado de diligencia'] : []),
  ];
}
export function status(c: Case): string {
  if (c.delivered) return 'Entregado';
  if (c.authorizedVersion === c.version) return 'Listo para entrega';
  if (c.requirements.some(r => !r.done)) return 'Observado';
  if (c.reviewedVersion !== c.version) return 'En revisión';
  if (c.participants.some(p => p.identity !== 'Coincidencia simulada')) return 'Por identificar';
  return 'Por actuación';
}
export type CaseAction =
  | { type: 'participant'; participant: Participant }
  | { type: 'requirement'; requirementId: string; done: boolean }
  | { type: 'identity'; participantId: string; result: Identity }
  | { type: 'review' } | { type: 'new-version' } | { type: 'authorize' }
  | { type: 'payment'; payment: Payment } | { type: 'attempt'; attempt: Attempt }
  | { type: 'deliver'; recipient: string };

export function transition(c: Case, action: CaseAction, eventId: string): Case {
  if (c.delivered) throw new Error('El expediente entregado está cerrado en esta demostración.');
  let next = { ...c };
  let text = '';
  switch (action.type) {
    case 'participant':
      if (c.authorizedVersion !== null) throw new Error('La versión con actuación simulada se conserva.');
      next.participants = [...c.participants, action.participant];
      next.reviewedVersion = null;
      text = 'Interviniente demo agregado; documento pendiente de revisión'; break;
    case 'requirement':
      if (c.authorizedVersion !== null) throw new Error('La versión con actuación simulada se conserva.');
      next.requirements = c.requirements.map(r => r.id === action.requirementId ? { ...r, done: action.done } : r);
      text = action.done ? 'Requisito revisado en demo' : 'Requisito marcado como pendiente'; break;
    case 'identity':
      if (c.authorizedVersion !== null) throw new Error('La versión con actuación simulada se conserva.');
      next.participants = c.participants.map(p => p.id === action.participantId ? { ...p, identity: action.result } : p);
      text = `Identificación simulada: ${action.result}`; break;
    case 'review': next.reviewedVersion = c.version; text = `Versión ${c.version} revisada en demo`; break;
    case 'new-version':
      if (c.authorizedVersion !== null) throw new Error('No se modifica un documento con actuación simulada.');
      next.version += 1; next.reviewedVersion = null; text = `Versión ${next.version} creada; revisión anterior invalidada`; break;
    case 'authorize':
      if (authorizationBlockers(c).length) throw new Error('Resuelve los pendientes antes de simular la actuación.');
      next.authorizedVersion = c.version; text = `Actuación notarial simulada sobre versión ${c.version}`; break;
    case 'payment':
      if (c.payments.some(p => p.id === action.payment.id)) return c;
      if (!Number.isSafeInteger(action.payment.cents) || action.payment.cents <= 0 || action.payment.cents > balance(c)) throw new Error('El importe debe ser positivo y no superar el saldo.');
      next.payments = [...c.payments, action.payment]; text = `Cobro demo: ${money(action.payment.cents)} (${action.payment.method})`; break;
    case 'attempt':
      if (c.act !== 'Carta notarial') throw new Error('Las diligencias corresponden a cartas notariales.');
      next.attempts = [...c.attempts, action.attempt]; text = `Diligencia demo: ${action.attempt.result}`; break;
    case 'deliver':
      if (deliveryBlockers(c).length) throw new Error('Resuelve los pendientes antes de registrar la entrega.');
      if (!c.participants.some(p => p.name === action.recipient)) throw new Error('Selecciona un destinatario del expediente demo.');
      next.delivered = true; text = `Entrega demo registrada a ${action.recipient}`; break;
  }
  next = { ...next, history: [{ id: eventId, text }, ...c.history] };
  return next;
}

export const actRequirements: Record<Act, string[]> = {
  'Compraventa': ['Minuta para revisión', 'Documentos de intervinientes', 'Representación aplicable', 'Antecedente registral de prueba'],
  'Certificación de firmas': ['Documento para certificación', 'Documentos de comparecientes'],
  'Carta notarial': ['Texto de la carta', 'Datos y dirección del destinatario'],
};
export function createCase(id: string, act: Act, name: string, subject: string): Case {
  return {
    id, act, subject, owner: 'Equipo de recepción', created: limaDate(), due: 'Por programar',
    participants: [{ id: `${id}-p1`, name, document: `DEMO-${id.slice(-4)}`, role: act === 'Compraventa' ? 'Solicitante' : 'Compareciente', identity: 'Pendiente' }],
    requirements: actRequirements[act].map((title, i) => ({ id: `r${i}`, title, done: false })),
    version: 1, reviewedVersion: null, authorizedVersion: null, feeCents: act === 'Compraventa' ? 125000 : act === 'Carta notarial' ? 15000 : 8000,
    payments: [], attempts: [], delivered: false, history: [{ id: `${id}-created`, text: 'Expediente de demostración creado' }],
  };
}
