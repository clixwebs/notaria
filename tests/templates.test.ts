import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {templateCommand,generateCommand,renderTemplate,checkTemplate,type TemplateContext} from '../src/lib/template-domain.ts';
import {hasPermission} from '../src/server/access.ts';
const variables=[{key:'nombre',label:'Nombre',type:'text' as const}];
const input={requestId:randomUUID(),revision:1,templateId:null,baseVersion:0,code:'QA-01',title:'Plantilla sintética',act:'Compraventa',body:'Texto sintético de {{nombre}} para {{expediente.referencia}}.',variables,active:true,reason:'Revisión sintética de prueba',acknowledgeReview:true};
const participant=randomUUID();
const context:TemplateContext={kardex:'QA-0001',act:'Compraventa',subject:'Asunto QA',participants:[{id:participant,snapshot:{name:'Instantánea Ficticia',documentType:'DEMO',documentNumber:'QA-100',personRevision:1},role:'Solicitante'}]};
test('plantillas: publicación explícita y esquema estricto sin campos de autoridad implícita',()=>{
  assert.equal(templateCommand.safeParse(input).success,true);
  for(const patch of [{acknowledgeReview:false},{office:'ajena'},{signed:true},{variables:[...variables,...variables]},{variables:[],body:input.body},{body:'Texto de {{sin_definir}} para prueba.'},{body:'Texto de {{ nombre }} para prueba.'},{body:'Texto QA\u0000 con control inválido'}])assert.equal(templateCommand.safeParse({...input,...patch}).success,false);
});
test('plantillas: todas las variables se usan y solo la gramática literal se interpreta',()=>{
  assert.throws(()=>checkTemplate('Texto sin variables',variables));
  assert.throws(()=>checkTemplate('Texto {{nombre.toUpperCase()}}',variables));
  assert.throws(()=>checkTemplate('Texto {{{{nombre}}}}',variables));
  assert.doesNotThrow(()=>checkTemplate('Texto {{expediente.acto}} sin campos manuales',[]));
});
test('plantillas: valores completos, sin extras ni expansión recursiva',()=>{
  for(const values of [{},{nombre:' '},{nombre:'{{expediente.asunto}}'},{nombre:'Rosa',extra:'oculto'}])assert.throws(()=>renderTemplate(input,values as Record<string,string>,context));
  const body=renderTemplate(input,{nombre:'<script>window.__bad=1</script> & $&'},context).body;
  assert.ok(body.includes('<script>'));assert.ok(body.includes('$&'));assert.ok(body.includes('QA-0001'));
});
test('plantillas: fechas civiles válidas, sin fecha implícita ni zona UTC',()=>{
  const t={body:'Fecha de prueba {{fecha}}.',variables:[{key:'fecha',label:'Fecha',type:'date' as const}]};
  assert.equal(renderTemplate(t,{fecha:'2028-02-29'},context).body,'Fecha de prueba 29/02/2028.');
  for(const fecha of ['2026-02-29','2026-13-01','0000-01-01','29/10/2026'])assert.throws(()=>renderTemplate(t,{fecha},context));
});
test('plantillas: importes exactos de texto, sin Float ni operaciones financieras',()=>{
  const t={body:'Importe de prueba {{monto}}.',variables:[{key:'monto',label:'Monto',type:'money' as const}]};
  for(const [value,want] of [['0.1','0.10'],['999999999.99','999999999.99'],['0','0.00']])assert.equal(renderTemplate(t,{monto:value},context).body,'Importe de prueba S/ '+want+'.');
  for(const monto of ['1e3','-1','1.001','1,00','1000000000'])assert.throws(()=>renderTemplate(t,{monto},context));
});
test('plantillas: interviniente por selección explícita de instantánea y entero acotado',()=>{
  const t={body:'Compareciente {{persona}}; copias {{copias}}.',variables:[{key:'persona',label:'Persona',type:'participant' as const},{key:'copias',label:'Copias',type:'integer' as const}]};
  const out=renderTemplate(t,{persona:participant,copias:'0003'},context);assert.ok(out.body.includes('Instantánea Ficticia · DEMO QA-100 · Solicitante'));assert.equal(out.values.copias,'3');
  assert.throws(()=>renderTemplate(t,{persona:randomUUID(),copias:'1'},context));assert.throws(()=>renderTemplate(t,{persona:participant,copias:'1.5'},context));
});
test('plantillas: límite final y solicitud solo admite entradas, sin cuerpo/instantánea aportados',()=>{
  const t={body:Array(30).fill('{{nombre}}').join(' '),variables};assert.throws(()=>renderTemplate(t,{nombre:'x'.repeat(2000)},context));
  const g={requestId:randomUUID(),caseId:randomUUID(),revision:1,baseVersion:0,templateVersionId:randomUUID(),values:{nombre:'QA'}};
  assert.equal(generateCommand.safeParse(g).success,true);assert.equal(generateCommand.safeParse({...g,body:'Texto inyectado'}).success,false);
});
test('plantillas: rol profesional publica, caja excluida, administración no adquiere revisión',()=>{
  for(const role of ['administracion','recepcion','abogado','notario','caja','ajeno']){
    assert.equal(hasPermission(role,'template:publish'),['abogado','notario'].includes(role));assert.equal(hasPermission(role,'template:use'),['administracion','recepcion','abogado','notario'].includes(role));assert.equal(hasPermission(role,'template:read'),['administracion','recepcion','abogado','notario'].includes(role));
  }
  assert.equal(hasPermission('administracion','case:review'),false);
});
