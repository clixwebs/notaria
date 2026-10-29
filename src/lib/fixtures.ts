import { createCase, type Act, type Case } from './domain';
const examples: [string, Act, string, string, string, string][] = [
  ['0048', 'Compraventa', 'Valeria Ríos · Demo', 'Compraventa de inmueble', 'Lucía · Demo', '10:30'],
  ['0047', 'Certificación de firmas', 'Mateo Salas · Demo', 'Certificación de dos firmas', 'Ana · Demo', '11:00'],
  ['0046', 'Carta notarial', 'Camila Vega · Demo', 'Carta de requerimiento', 'Diego · Demo', '11:30'],
  ['0045', 'Compraventa', 'Gabriel Prado · Demo', 'Transferencia de departamento', 'Lucía · Demo', '12:00'],
  ['0044', 'Certificación de firmas', 'Elena Soto · Demo', 'Certificación de firma en contrato', 'Ana · Demo', '12:30'],
  ['0043', 'Carta notarial', 'Nicolás Paz · Demo', 'Carta de comunicación', 'Diego · Demo', '15:00'],
  ['0042', 'Compraventa', 'Marina León · Demo', 'Compraventa de estacionamiento', 'Lucía · Demo', '15:30'],
  ['0041', 'Certificación de firmas', 'Tomás Vidal · Demo', 'Certificación de una firma', 'Ana · Demo', '16:00'],
  ['0040', 'Carta notarial', 'Julia Costa · Demo', 'Carta de requerimiento de pago', 'Diego · Demo', '16:30'],
];
export function seedCases(): Case[] {
  return examples.map(([n, act, name, subject, owner, due], i) => {
    const c = createCase(`2026-${n}`, act, name, subject);
    c.created = '2026-10-29'; c.owner = owner; c.due = due;
    c.requirements = c.requirements.map((r, j) => ({ ...r, done: i !== 0 || j !== 2 }));
    if (act === 'Compraventa') c.participants.push({ id: `${c.id}-p2`, name: 'Adrián Montes · Demo', document: `DEMO-B${n}`, role: 'Interviniente', identity: 'Pendiente' });
    if (i > 1) c.reviewedVersion = 1;
    if (i > 2) c.participants = c.participants.map(p => ({ ...p, identity: 'Coincidencia simulada' }));
    if (i > 4) c.authorizedVersion = 1;
    if (i > 5) c.payments = [{ id: `seed-${i}`, cents: c.feeCents, method: 'Transferencia demo' }];
    if (i === 8) c.attempts = [{ id: 'seed-attempt', result: 'Entregada', note: 'Escenario ficticio de diligencia.' }];
    if (i > 6) c.delivered = true;
    if (i === 0) c.payments = [{ id: 'seed-advance', cents: 50000, method: 'Transferencia demo' }];
    return c;
  });
}
