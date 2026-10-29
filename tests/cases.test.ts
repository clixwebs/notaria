import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteTotals,toMinor,fromMinor,caseCommand,requirementsByAct} from '../src/lib/case-domain.ts';
import {hasPermission} from '../src/server/access.ts';
test('presupuesto exacto: sin redondeo binario y con límite de precisión',()=>{
  assert.equal(quoteTotals([{description:'Concepto A',quantity:3,unitAmount:'0.10',category:'Honorarios'},{description:'Concepto B',quantity:1,unitAmount:'0.20',category:'Terceros'}]),'0.50');
  assert.equal(fromMinor(toMinor('999999999.99')),'999999999.99');
  assert.throws(()=>quoteTotals([{description:'Cero',quantity:1,unitAmount:'0.00',category:'Otros'}]));
  assert.throws(()=>quoteTotals(Array.from({length:30},()=>({description:'Exceso',quantity:9999,unitAmount:'999999999.99',category:'Otros'}))));
});
test('rechaza datos financieros no previstos y no permite total aportado por el cliente',()=>{
  const input={type:'quote',revision:1,baseVersion:0,validUntil:'2099-01-01',lines:[{description:'Prueba',quantity:1,unitAmount:'1.001',category:'Honorarios'}]};
  assert.equal(caseCommand.safeParse(input).success,false);
  assert.equal(caseCommand.safeParse({...input,lines:[{...input.lines[0],unitAmount:'1.00'}],total:'0.01'}).success,false);
});
test('revisión profesional y aceptación comercial tienen permisos separados',()=>{
  assert.equal(hasPermission('administracion','case:review'),false);
  assert.equal(hasPermission('recepcion','case:review'),false);
  assert.equal(hasPermission('abogado','case:review'),true);
  assert.equal(hasPermission('abogado','quote:write'),false);
  assert.equal(hasPermission('caja','case:read'),false);
});
test('requisitos orientativos diferenciados y aceptación exige referencia e interviniente',()=>{
  assert.equal(requirementsByAct['Certificación de firmas'].length,2);
  assert.equal(requirementsByAct.Compraventa.length,4);
  assert.equal(caseCommand.safeParse({type:'accept-quote',revision:1,quoteId:'invalid',participantId:'invalid',reference:''}).success,false);
});
