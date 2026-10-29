import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {procedureCommand,latestIdentities,identityResults,type ProcedureEvent} from '../src/lib/procedure-domain.ts';
import {identityAdapter} from '../src/server/identity-adapter.ts';
import {hasPermission} from '../src/server/access.ts';
test('solo Notario autoriza y exceptúa; Caja no recibe contenido jurídico',()=>{
  for(const r of ['administracion','recepcion','abogado','caja'])assert.equal(hasPermission(r,'procedure:authorize'),false);
  assert.equal(hasPermission('notario','procedure:authorize'),true);assert.equal(hasPermission('caja','procedure:read'),false);
});
test('contrato estricto: no acepta identidad real, números ni autorización implícita',()=>{
  const v={type:'authorize',requestId:randomUUID(),revision:1,draftId:randomUUID(),folios:2,note:'Evaluación sintética de prueba.',acknowledge:true};
  assert.equal(procedureCommand.safeParse(v).success,true);
  for(const extra of [{number:'OFICIAL-1'},{mode:'real'},{acknowledge:false},{folios:0},{folios:1.5}])assert.equal(procedureCommand.safeParse({...v,...extra}).success,false);
});
test('adaptador mantiene distintos coincidencia, no coincidencia, error e incertidumbre',()=>{
  assert.equal(identityAdapter.mode,'simulation');for(const result of identityResults)assert.deepEqual(identityAdapter.check(result),{mode:'simulation',result});
});
test('evidencia vigente por participante y versión; resolución conserva intento',()=>{
  const event=(id:string,participantId:string,draftId:string,result:string,kind='identity'):ProcedureEvent=>({id,kind,data:{participantId,draftId,result},created_at:'2026-10-29',author:'QA'});
  const events=[event('a','p','v1','desconocido'),event('b','p','v1','no-coincide','identity-resolve'),event('c','p','v2','coincide'),event('d','q','v1','error-tecnico')];
  const latest=latestIdentities(events);assert.equal(latest.length,3);assert.equal(latest.find(i=>i.participantId==='p'&&i.draftId==='v1')?.id,'b');assert.equal(events[0].data.result,'desconocido');
});
