import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {cents,money,financeCommand} from '../src/lib/finance-domain.ts';
import {hasPermission} from '../src/server/access.ts';
test('céntimos exactos, signo y límite monetario sin pérdida binaria',()=>{
  assert.equal(money(cents('0.10')*3n+cents('0.20')),'0.50');
  assert.equal(money(-1n),'-0.01');assert.equal(money(-101n),'-1.01');
  assert.equal(money(cents('999999999999.99')),'999999999999.99');
  assert.throws(()=>cents('1.001'));assert.throws(()=>cents('1e3'));assert.throws(()=>cents('NaN'));
});
test('comandos financieros rechazan exceso de precisión, sumas aportadas y montos no positivos',()=>{
  const input={type:'advance',requestId:randomUUID(),revision:0,personId:randomUUID(),caseId:randomUUID(),amount:'1.00',method:'efectivo',reference:'REC-001',note:'Prueba sintética'};
  assert.equal(financeCommand.safeParse(input).success,true);
  for(const amount of ['0','-0.10','1.001','1000000000000.00','1e3','1,000.00'])assert.equal(financeCommand.safeParse({...input,amount}).success,false);
  assert.equal(financeCommand.safeParse({...input,balance:'0.00'}).success,false);
});
test('caja registra cobros pero la autorización y corrección pertenecen a administración',()=>{
  assert.equal(hasPermission('caja','finance:write'),true);assert.equal(hasPermission('caja','finance:read'),true);assert.equal(hasPermission('caja','finance:manage'),false);
  assert.equal(hasPermission('administracion','finance:manage'),true);
  for(const role of ['recepcion','abogado','notario','unknown'])assert.equal(hasPermission(role,'finance:read'),false);
  assert.equal(hasPermission('caja','case:read'),false);assert.equal(hasPermission('caja','documents:read'),false);
});
