import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCase, parseCents, transition, balance, authorizationBlockers, deliveryBlockers, limaDate } from '../src/lib/domain.ts';
function ready() {
  const c = createCase('2026-0100', 'Compraventa', 'Persona Demo', 'Escenario ficticio');
  c.requirements = c.requirements.map(r => ({ ...r, done: true }));
  c.participants = c.participants.map(p => ({ ...p, identity: 'Coincidencia simulada' }));
  c.reviewedVersion = c.version;
  return c;
}
test('importes exactos en céntimos; rechaza negativos, exponentes y fracciones extra', () => {
  assert.equal(parseCents('750.01'), 75001);
  assert.equal(parseCents('0,10'), 10);
  for (const value of ['-1', '1e4', '0', '0.001', '1,234.00', '', 'NaN']) assert.equal(parseCents(value), null);
});
test('una no coincidencia y un error técnico bloquean la actuación', () => {
  for (const result of ['No coincidencia', 'Error técnico'] as const) {
    const c = ready();
    const next = transition(c, { type: 'identity', participantId: c.participants[0].id, result }, 'evt');
    assert(authorizationBlockers(next).length > 0);
    assert.throws(() => transition(next, { type: 'authorize' }, 'deny'));
  }
});
test('la versión nueva requiere otra revisión y conserva el objeto anterior', () => {
  const before = ready(); const next = transition(before, { type: 'new-version' }, 'version');
  assert.equal(before.version, 1); assert.equal(next.version, 2); assert.equal(next.reviewedVersion, null);
  assert.throws(() => transition(next, { type: 'authorize' }, 'deny'));
});
test('la actuación demo inmoviliza versión y requisitos', () => {
  const c = transition(ready(), { type: 'authorize' }, 'authorize');
  assert.throws(() => transition(c, { type: 'new-version' }, 'deny'));
  assert.throws(() => transition(c, { type: 'requirement', requirementId: 'r0', done: false }, 'deny'));
});
test('no se duplica un pago con la misma referencia; impide sobrepago', () => {
  const c = ready(); const payment = { id: 'payment-1', cents: 30001, method: 'Efectivo demo' };
  const once = transition(c, { type: 'payment', payment }, 'first');
  assert.equal(balance(once), 94999);
  assert.deepEqual(transition(once, { type: 'payment', payment }, 'duplicate'), once);
  assert.throws(() => transition(once, { type: 'payment', payment: { ...payment, id: 'different', cents: 95000 } }, 'overpay'));
});
test('entrega exige actuación actual, saldo cero y destinatario conocido', () => {
  const c = ready(); assert(deliveryBlockers(c).length > 0);
  const authorized = transition(c, { type: 'authorize' }, 'authorize');
  const paid = transition(authorized, { type: 'payment', payment: { id: 'full', cents: c.feeCents, method: 'Demo' } }, 'pay');
  assert.throws(() => transition(paid, { type: 'deliver', recipient: 'Persona ajena' }, 'deny'));
  const delivered = transition(paid, { type: 'deliver', recipient: c.participants[0].name }, 'delivery');
  assert(delivered.delivered);
  assert.throws(() => transition(delivered, { type: 'review' }, 'deny'));
});
test('carta conserva un intento sin respuesta sin afirmar entrega al destinatario', () => {
  const c = ready(); c.act = 'Carta notarial';
  const paid = transition(transition(c, { type: 'authorize' }, 'authorize'), { type: 'payment', payment: { id: 'full', cents: c.feeCents, method: 'Demo' } }, 'pay');
  assert(deliveryBlockers(paid).some(s => s.includes('diligencia')));
  const attempted = transition(paid, { type: 'attempt', attempt: { id: 'attempt', result: 'Sin respuesta', note: 'Escenario de prueba' } }, 'attempt');
  assert.equal(attempted.attempts[0].result, 'Sin respuesta');
  assert.equal(attempted.delivered, false);
  assert.equal(deliveryBlockers(attempted).length, 0);
});
test('el calendario de negocio usa Lima cerca del cambio de día UTC', () => {
  assert.equal(limaDate(new Date('2026-10-30T03:00:00Z')), '2026-10-29');
  assert.equal(limaDate(new Date('2026-10-30T05:00:00Z')), '2026-10-30');
});
