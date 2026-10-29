import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission } from '../src/server/access.ts';
import { personInput,validateFile } from '../src/server/validation.ts';
test('unknown roles deny every action and administrative roles do not imply notarial authority',()=>{
  assert.equal(hasPermission('supervisor','people:read'),false);
  assert.equal(hasPermission('caja','documents:read'),false);
  assert.equal(hasPermission('recepcion','documents:release'),false);
  assert.equal(hasPermission('notario','users:manage'),false);
  assert.equal(hasPermission('administracion','users:manage'),true);
});
test('person input rejects malformed identity and unsolicited fields',()=>{
  assert.equal(personInput.safeParse({name:'Persona Ficticia',documentType:'DNI',documentNumber:'123'}).success,false);
  assert.equal(personInput.safeParse({name:'Persona Ficticia',documentType:'DEMO',documentNumber:'DEMO-1',office:'otra'}).success,false);
});
test('file limits and byte-level signatures reject masqueraded and active file types',()=>{
  assert.throws(()=>validateFile(Buffer.from('<script>bad</script>'),'fake.pdf'));
  assert.throws(()=>validateFile(Buffer.from('<svg/>'),'fake.svg'));
  assert.throws(()=>validateFile(Buffer.alloc(5*1024*1024+1),'large.txt'));
  assert.throws(()=>validateFile(Buffer.from([0xc0,0x80]),'bad.txt'));
  assert.equal(validateFile(Buffer.from('Texto de prueba'),'prueba.txt'),'text/plain');
});
