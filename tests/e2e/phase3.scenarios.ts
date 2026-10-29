import {test,expect,type APIRequestContext} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {randomUUID,createHash} from 'node:crypto';
import {canonicalJSON,type CaseDetail} from '../../src/lib/case-domain';
const origin='http://127.0.0.1:3101';const password='Solo-pruebas-Local-2026!';
export function registerCaseScenarios(options:{admin:()=>APIRequestContext;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(context:APIRequestContext)=>Promise<string[]>;evidencePrefix?:string}){
  let person:string,caseId:string,second:string;let lawyer:APIRequestContext;let cashier:APIRequestContext;
  const post=(path:string,data:unknown,context=options.admin())=>context.post(path,{headers:{Origin:origin},data});
  const detail=async()=>{const r=await options.admin().get('/api/cases/'+caseId);expect(r.status()).toBe(200);return await r.json() as CaseDetail;};
  const command=async(value:Record<string,unknown>,context=options.admin())=>{const c=await detail();return post('/api/cases/'+caseId,{...value,revision:c.revision},context);};
  test('expedientes: reintento idempotente y numeración interna concurrente sin duplicados',async()=>{
    const response=await post('/api/platform/people',{name:'Rosa Luján Ficticia',documentType:'DEMO',documentNumber:'CASE-100'});expect(response.status()).toBe(200);person=(await response.json()).id;
    const input={requestId:randomUUID(),act:'Compraventa',subject:'Compra de inmueble ficticio',personId:person};
    const repeated=await Promise.all([post('/api/cases',input),post('/api/cases',input)]);expect(repeated.map(r=>r.status())).toEqual([200,200]);const ids=await Promise.all(repeated.map(r=>r.json()));expect(ids[0].id).toBe(ids[1].id);caseId=ids[0].id;
    expect((await post('/api/cases',{...input,subject:'Otro contenido para misma clave'})).status()).toBe(409);
    const parallel=await Promise.all(Array.from({length:6},(_,i)=>post('/api/cases',{...input,requestId:randomUUID(),subject:'Expediente paralelo '+i})));expect(parallel.every(r=>r.status()===200)).toBe(true);const data=await Promise.all(parallel.map(r=>r.json()));expect(new Set(data.map(c=>c.kardex)).size).toBe(6);
    const certification=await post('/api/cases',{...input,requestId:randomUUID(),act:'Certificación de firmas'});expect(certification.status()).toBe(200);second=(await certification.json()).id;
    expect((await(await options.admin().get('/api/cases/'+second)).json()).requirements.length).toBe(2);
    expect((await detail()).requirements.length).toBe(4);
  });
  test('instantánea de intervinientes y requisitos: no se reescribe historia ni se admite sustento ajeno',async()=>{
    let c=await detail();const personData=(await(await options.admin().get('/api/platform/people')).json()).find((p:{id:string})=>p.id===person);
    expect((await options.admin().patch('/api/platform/people/'+person,{headers:{Origin:origin},data:{name:'Rosa Ficha Actualizada',documentType:'DEMO',documentNumber:'CASE-100',revision:personData.revision}})).status()).toBe(200);
    expect((await detail()).participants[0].snapshot.name).toBe('Rosa Luján Ficticia');
    const foreign=(await(await options.admin().get('/api/cases/'+second)).json()).requirements[0];
    expect((await command({type:'requirement',requirementId:foreign.id,done:true,note:'Sustento ajeno',evidenceId:null})).status()).toBe(404);
    const file=await options.admin().post('/api/platform/documents',{headers:{Origin:origin},multipart:{personId:person,title:'Sustento de requisito',file:{name:'sustento-requisito.txt',mimeType:'text/plain',buffer:Buffer.from('Sustento ficticio del expediente')}}});expect(file.status()).toBe(200);const fileId=(await file.json()).id;
    expect((await command({type:'requirement',requirementId:c.requirements[0].id,done:true,note:'Intento con archivo en cuarentena',evidenceId:fileId})).status()).toBe(400);
    expect((await post('/api/platform/documents/'+fileId+'/review',{status:'liberado',note:'Revisión manual ficticia del original completada.'})).status()).toBe(200);
    expect((await command({type:'requirement',requirementId:c.requirements[0].id,done:true,note:'Sustento revisado por el equipo',evidenceId:fileId})).status()).toBe(200);
    c=await detail();const race=await Promise.all([true,false].map(done=>post('/api/cases/'+caseId,{type:'requirement',revision:c.revision,requirementId:c.requirements[1].id,done,note:'Actualización simultánea',evidenceId:null})));expect(race.map(r=>r.status()).sort()).toEqual([200,409]);expect((await detail()).requirementHistory.length).toBe(2);
    for(const requirement of (await detail()).requirements)if(!requirement.done)expect((await command({type:'requirement',requirementId:requirement.id,done:true,note:'Revisión ficticia del requisito',evidenceId:null})).status()).toBe(200);
  });
  test('roles de revisión y denegación por API directa de expedientes',async({playwright,request})=>{
    for(const [email,role] of [['abogado-casos@example.test','abogado'],['caja-casos@example.test','caja']]){
      expect((await post('/api/platform/users',{name:role+' Casos QA',email,password,role})).status()).toBe(200);const context=await playwright.request.newContext({baseURL:origin});expect((await post('/api/auth/sign-in/email',{email,password},context)).status()).toBe(200);await options.enroll(context);if(role==='abogado')lawyer=context;else cashier=context;
    }
    expect((await request.get('/api/cases/'+caseId)).status()).toBe(401);
    expect((await cashier.get('/api/cases/'+caseId)).status()).toBe(403);
    expect((await cashier.get('/api/cases')).status()).toBe(403);
    expect((await command({type:'draft',baseVersion:0,body:'Texto inicial ficticio de compraventa para revisión.'})).status()).toBe(200);
    const c=await detail();expect((await command({type:'review',draftId:c.drafts[0].id,note:'Revisión intentada por administración'})).status()).toBe(403);
  });
  test('versiones: revisión exacta, invalidación por cambios y conservación de bytes/contexto anteriores',async()=>{
    let c=await detail();const original=c.drafts[0];
    expect((await command({type:'review',draftId:original.id,note:'Revisión profesional ficticia de preparación'},lawyer)).status()).toBe(200);expect((await detail()).reviewed).toBe(true);
    expect((await command({type:'draft',baseVersion:1,body:'Segundo texto ficticio. <script>window.__bad=true</script> Se conserva como texto plano.'})).status()).toBe(200);
    c=await detail();expect(c.reviewed).toBe(false);expect(c.drafts.find(d=>d.id===original.id)?.body).toBe(original.body);
    expect(original.sha256).toBe(createHash('sha256').update(canonicalJSON({body:original.body,snapshot:original.snapshot})).digest('hex'));
    expect((await command({type:'review',draftId:original.id,note:'Intento de revisión sobre versión histórica'},lawyer)).status()).toBe(409);
    expect((await command({type:'review',draftId:c.drafts[0].id,note:'Revisión de la segunda versión del borrador'},lawyer)).status()).toBe(200);
    c=await detail();expect(c.reviewed).toBe(true);
    expect((await command({type:'requirement',requirementId:c.requirements[0].id,done:true,note:'Cambió el contexto documental de revisión',evidenceId:c.requirements[0].evidence_id})).status()).toBe(200);expect((await detail()).reviewed).toBe(false);
  });
  test('presupuesto decimal, aceptación sobre versión exacta y orden sin movimientos de caja',async()=>{
    const lines=[{description:'Honorarios ficticios',quantity:3,unitAmount:'0.10',category:'Honorarios'},{description:'Trámite a terceros ficticio',quantity:1,unitAmount:'0.20',category:'Terceros'}];
    expect((await command({type:'quote',baseVersion:0,validUntil:'2099-01-01',lines})).status()).toBe(200);let c=await detail();expect(c.quotes[0].total).toBe('0.50');
    expect((await command({type:'quote',baseVersion:1,validUntil:'2000-01-01',lines})).status()).toBe(400);
    expect((await command({type:'quote',baseVersion:1,validUntil:'2099-01-01',lines:[{...lines[0],unitAmount:'1.001'}]})).status()).toBe(400);
    const quote1=c.quotes[0];expect((await command({type:'accept-quote',quoteId:quote1.id,participantId:c.participants[0].id,reference:'Aceptación ficticia por comunicación de prueba'})).status()).toBe(200);
    c=await detail();expect(c.quote_accepted).toBe(true);expect(c.order?.accepted_quote_id).toBe(quote1.id);expect(c).not.toHaveProperty('payments');
    const oldOrder=c.order?.reference;
    expect((await command({type:'quote',baseVersion:1,validUntil:'2099-01-02',lines:[{...lines[0],unitAmount:'10.00'}]})).status()).toBe(200);
    c=await detail();expect(c.quote_accepted).toBe(false);expect(c.order?.accepted_quote_id).toBe(quote1.id);expect(c.quotes.find(q=>q.id===quote1.id)?.total).toBe('0.50');
    expect((await command({type:'accept-quote',quoteId:quote1.id,participantId:c.participants[0].id,reference:'Intento con presupuesto histórico'})).status()).toBe(409);
    const responses=await Promise.all([1,2].map(()=>post('/api/cases/'+caseId,{type:'accept-quote',revision:c.revision,quoteId:c.quotes[0].id,participantId:c.participants[0].id,reference:'Nueva aceptación ficticia sobre la versión dos'})));expect(responses.map(r=>r.status()).sort()).toEqual([200,409]);
    c=await detail();expect(c.order?.reference).toBe(oldOrder);expect(c.order?.revision).toBe(2);expect(c.quotes.filter(q=>q.accepted_at)).toHaveLength(2);
  });
  test('tareas, observaciones, búsquedas y filtros persisten con auditoría',async()=>{
    expect((await command({type:'task',title:'Revisar sustento ficticio',dueDate:'2099-01-02'})).status()).toBe(200);let c=await detail();expect((await command({type:'task-check',taskId:c.tasks[0].id,done:true})).status()).toBe(200);
    expect((await command({type:'note',body:'Observación de prueba para revisión del expediente.'})).status()).toBe(200);c=await detail();expect(c.tasks[0].done).toBe(true);expect(c.notes).toHaveLength(1);
    const searched=await(await options.admin().get('/api/cases?search='+encodeURIComponent('Rosa Luján Ficticia')+'&pageSize=2')).json();expect(searched.total).toBe(8);expect(searched.items).toHaveLength(2);
    const filtered=await(await options.admin().get('/api/cases?act='+encodeURIComponent('Certificación de firmas'))).json();expect(filtered.items.every((item:{act:string})=>item.act==='Certificación de firmas')).toBe(true);
    expect(c.events.some(e=>e.action==='case.accept-quote')).toBe(true);const audit=await(await options.admin().get('/api/platform/audit')).json();expect(audit.some((e:{resource:string;action:string})=>e.resource===caseId&&e.action==='case.draft')).toBe(true);
  });
  test('interfaz: crea expediente, requisito, borrador y presupuesto; mantiene formularios ante conflicto',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/expedientes/nuevo');await page.getByRole('radio',{name:'Carta notarial'}).check();await page.getByRole('combobox',{name:'Solicitante',exact:true}).selectOption(person);await page.getByLabel('Asunto del expediente').fill('Carta ficticia creada desde la interfaz');await page.getByRole('button',{name:'Crear expediente',exact:true}).click();await expect(page.getByRole('heading',{name:/Expediente \d{4}-/})).toBeVisible();
    await page.getByRole('link',{name:'Requisitos',exact:true}).click();await page.getByRole('button',{name:'Revisar requisito'}).first().click();await page.getByRole('checkbox',{name:'Requisito revisado'}).check();await page.getByLabel('Constancia u observación').fill('Revisión desde la interfaz ficticia');await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await expect(page.getByText('Revisión desde la interfaz ficticia',{exact:true})).toBeVisible();
    await page.getByRole('link',{name:'Documento',exact:true}).click();await page.getByRole('button',{name:'Redactar primer borrador'}).click();await page.getByLabel('Contenido del borrador').fill('Carta notarial de prueba: contenido ficticio para revisar sin efectos legales.');await page.getByRole('button',{name:'Guardar nueva versión',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('link',{name:'Presupuesto',exact:true}).click();await page.getByRole('button',{name:'Crear presupuesto',exact:true}).click();await page.getByLabel('Descripción',{exact:true}).fill('Honorarios de carta de prueba');await page.getByLabel('Importe unitario en soles').fill('150.25');await page.getByRole('button',{name:'Guardar versión de presupuesto'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByText('S/ 150.25').first()).toBeVisible();
    await page.getByRole('button',{name:'Registrar aceptación',exact:true}).click();await page.getByLabel('Referencia de la aceptación').fill('Aceptación ficticia de prueba recibida presencialmente');await page.getByRole('button',{name:'Confirmar aceptación de esta versión'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await expect(page.getByText('Aceptación comunicada',{exact:true})).toBeVisible();
    // Force a stale form while keeping the actual server revision authoritative.
    const urlId=page.url().split('/')[4];await page.getByRole('button',{name:'Crear nueva versión de presupuesto'}).click();await page.getByLabel('Descripción',{exact:true}).fill('Contenido conservado después de conflicto');const current=await(await options.admin().get('/api/cases/'+urlId)).json();expect((await post('/api/cases/'+urlId,{type:'note',revision:current.revision,body:'Cambio paralelo mientras el formulario permanece abierto'})).status()).toBe(200);
    await page.getByRole('button',{name:'Guardar versión de presupuesto'}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('El expediente cambió');await expect(page.getByLabel('Descripción',{exact:true})).toHaveValue('Contenido conservado después de conflicto');await page.getByRole('button',{name:'Actualizar contexto sin cerrar'}).click();await expect.poll(async()=>page.locator('.case-context').innerText()).toContain('Revisión '+(current.revision+1));await page.getByRole('button',{name:'Guardar versión de presupuesto'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(errors).toEqual([]);await context.close();
  });
  test('expediente y presupuesto: reflujo, contraste y navegación por teclado negro/azul',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage(),reducedMotion:'reduce'});const page=await context.newPage();
    for(const width of [1440,683,390]){await page.setViewportSize({width,height:1000});await page.goto(origin+'/expedientes/'+caseId+'/presupuesto');await expect(page.getByRole('heading',{name:'Presupuesto por conceptos'})).toBeVisible();await expect(page.getByText('S/ 30.00').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-3'}-presupuesto-${width}.png`,fullPage:true});}
    await page.getByRole('button',{name:'Activar tema oscuro'}).click();const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(dark.violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:'docs/evidence/'+(options.evidencePrefix||'fase-3')+'-presupuesto-oscuro.png',fullPage:true});await page.keyboard.press('Control+k');await expect(page.getByRole('dialog',{name:'Buscar expediente'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
    await page.goto(origin+'/expedientes/'+caseId+'/documento');await expect(page.locator('.draft-body')).toContainText('<script>');expect(await page.evaluate(()=>Object.hasOwn(window,'__bad'))).toBe(false);await context.close();await lawyer.dispose();await cashier.dispose();
  });
}
