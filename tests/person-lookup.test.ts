import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupPerson} from '../src/server/person-lookup.ts';
import {HttpError} from '../src/server/access.ts';
const input={documentType:'DNI',documentNumber:'00000001'};
const body={success:true,data:{numero:'00000001',nombres:'PERSONA',apellido_paterno:'FICTICIA',apellido_materno:'PRUEBA',direccion:'NO DEBE SALIR'}};
const fetcher=(body:unknown,status=200)=>(async()=>Response.json(body,{status})) as typeof fetch;
test('DNI query uses server POST credentials and returns only the allowed person fields',async()=>{
 const result=await lookupPerson(input,{token:'test-token',fetcher:async(url,options)=>{
  assert.equal(url,'https://api.apiperu.dev/dni');assert.equal(options?.method,'POST');assert.equal(options?.redirect,'error');assert.equal(options?.cache,'no-store');
  assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer test-token');assert.deepEqual(JSON.parse(options?.body as string),{dni:'00000001'});assert.ok(options?.signal);
  return Response.json(body);
 }});
 assert.deepEqual(result,{...input,name:'PERSONA FICTICIA PRUEBA',source:'apiperu',identityVerified:false});
});
test('missing provider credential and invalid document never call a provider',async()=>{
 const noCall=(async()=>{throw new Error('Must not call');}) as typeof fetch;
 await assert.rejects(lookupPerson(input,{token:'',fetcher:noCall}),e=>e instanceof HttpError&&e.status===503);
 for(const data of [{...input,documentNumber:'123'},{...input,documentType:'DEMO'},{...input,office:'other'}])await assert.rejects(lookupPerson(data,{token:'test',fetcher:noCall}));
});
test('provider not-found and limits retain actionable safe errors',async()=>{
 for(const [remote,status] of [[404,404],[429,429],[401,502],[500,502]])await assert.rejects(lookupPerson(input,{token:'test',fetcher:fetcher({message:'RAW SECRET'},remote)}),e=>e instanceof HttpError&&e.status===status&&!e.message.includes('RAW SECRET'));
 await assert.rejects(lookupPerson(input,{token:'test',fetcher:fetcher({success:false,code:'document_not_found'})}),e=>e instanceof HttpError&&e.status===404);
});
test('mismatched numbers, malformed names and oversized replies never fill a person',async()=>{
 for(const value of [{...body,data:{...body.data,numero:'00000002'}},{...body,data:{...body.data,nombres:'A\u0000B'}},{success:true,data:{}},{...body,padding:'x'.repeat(17000)}])await assert.rejects(lookupPerson(input,{token:'test',fetcher:fetcher(value)}),e=>e instanceof HttpError&&e.status===502);
});
test('network, timeout and invalid JSON do not expose upstream errors',async()=>{
 for(const fake of [(async()=>{throw new DOMException('secret upstream URL','TimeoutError');}) as typeof fetch,(async()=>new Response('not JSON')) as typeof fetch])await assert.rejects(lookupPerson(input,{token:'test',fetcher:fake}),e=>e instanceof HttpError&&e.status===502&&!e.message.includes('secret'));
});
