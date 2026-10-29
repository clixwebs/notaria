import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {tariffCommand} from '../src/lib/tariff-domain.ts';
import {caseCommand,quoteTotals} from '../src/lib/case-domain.ts';
import {hasPermission} from '../src/server/access.ts';
const input={requestId:randomUUID(),revision:1,tariffId:null,baseVersion:0,code:'HON-01',description:'Honorarios comerciales',category:'Honorarios',unitAmount:'0.10',act:null,active:true,reason:'Publicación de prueba'};
test('tarifario: importe positivo exacto, sin redondeo ni campos fiscales implícitos',()=>{
  assert.equal(tariffCommand.parse(input).unitAmount,'0.10');
  for(const unitAmount of ['0','0.00','-1','1e3','1.001','1,00','1000000000.00'])assert.equal(tariffCommand.safeParse({...input,unitAmount}).success,false);
  assert.equal(tariffCommand.safeParse({...input,igv:'18'}).success,false);
  assert.equal(tariffCommand.safeParse({...input,code:'honorario'}).success,false);
});
test('tarifario: permisos de lectura y administración son independientes de revisión legal',()=>{
  for(const role of ['administracion','recepcion','caja','abogado','notario']){
    assert.equal(hasPermission(role,'tariff:read'),true);
    assert.equal(hasPermission(role,'tariff:manage'),role==='administracion');
  }
  assert.equal(hasPermission('desconocido','tariff:read'),false);
  assert.equal(hasPermission('administracion','case:review'),false);
});
test('presupuesto: admite referencia de tarifa, conserva decimal y rechaza instantánea aportada',()=>{
  const line={description:'Honorarios',category:'Honorarios',quantity:3,unitAmount:'0.10',tariffVersionId:randomUUID()};
  const command={type:'quote',revision:1,baseVersion:0,validUntil:'2099-12-31',lines:[line]};
  assert.equal(caseCommand.safeParse(command).success,true);
  assert.equal(quoteTotals([line as Parameters<typeof quoteTotals>[0][number]]),'0.30');
  assert.equal(caseCommand.safeParse({...command,lines:[{...line,tariffSource:{code:'FALSO',version:1}}]}).success,false);
});
