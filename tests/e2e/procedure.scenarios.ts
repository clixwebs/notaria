import {test,expect,type APIRequestContext} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import type {CaseDetail} from '../../src/lib/case-domain';
import type {ProcedureState} from '../../src/lib/procedure-domain';
const origin='http://127.0.0.1:3101',password='Solo-pruebas-Local-2026!',note='Constancia sintética para probar el procedimiento local.';
export function registerProcedureScenarios(o:{admin:()=>APIRequestContext;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(c:APIRequestContext)=>Promise<string[]>;evidencePrefix?:string}){
  const evidencePrefix=o.evidencePrefix||'fase-3-procedimiento';
  let notary:APIRequestContext,cashier:APIRequestContext,personId:string,evidenceId:string,quarantine:string;
  let sale:string,cert:string,letter:string;let firstInstrument:string;let confirmed:Record<string,unknown>;
  const post=(path:string,data:unknown,ctx=o.admin())=>ctx.post(path,{headers:{Origin:origin},data});
  const detail=async(id:string)=>(await(await o.admin().get('/api/cases/'+id)).json()) as CaseDetail;
  const state=async(id:string)=>{const r=await o.admin().get('/api/procedures/'+id);expect(r.status()).toBe(200);return await r.json() as ProcedureState;};
  async function command(id:string,value:Record<string,unknown>,ctx=o.admin()){return post('/api/procedures/'+id,{requestId:randomUUID(),revision:(await detail(id)).revision,...value},ctx);}
  async function setupCase(act:string){const r=await post('/api/cases',{requestId:randomUUID(),personId,act,subject:'Procedimiento sintético '+act});expect(r.status()).toBe(200);const id=(await r.json()).id;let c=await detail(id);
    expect((await post('/api/cases/'+id,{type:'draft',revision:c.revision,baseVersion:0,body:'DOCUMENTO SINTÉTICO DE PRUEBA. Sin validez notarial.'})).status()).toBe(200);
    c=await detail(id);for(const q of c.requirements){c=await detail(id);expect((await post('/api/cases/'+id,{type:'requirement',revision:c.revision,requirementId:q.id,done:true,note:'Revisión sintética del requisito.',evidenceId})).status()).toBe(200);}
    c=await detail(id);expect((await post('/api/cases/'+id,{type:'review',revision:c.revision,draftId:c.drafts[0].id,note},notary)).status()).toBe(200);return id;
  }
  async function identifyGrant(id:string){const c=await detail(id),p=c.participants[0];expect((await command(id,{type:'identity',participantId:p.id,draftId:c.drafts[0].id,scenario:'coincide',note})).status()).toBe(200);const s=await state(id);expect((await command(id,{type:'grant',participantId:p.id,draftId:c.drafts[0].id,identityId:s.identities[0].id,evidenceId,note,acknowledge:true})).status()).toBe(200);}
  test('procedimiento: permisos, segundo factor y aislamiento de evidencias',async({playwright,request})=>{
    test.setTimeout(180000);
    for(const [role,email] of [['notario','procedimiento-notario@example.test'],['caja','procedimiento-caja@example.test']]){
      expect((await post('/api/platform/users',{name:'Procedimiento QA '+role,email,password,role})).status()).toBe(200);const ctx=await playwright.request.newContext({baseURL:origin});let login=await post('/api/auth/sign-in/email',{email,password},ctx);if(login.status()===429){await new Promise(r=>setTimeout(r,61000));login=await post('/api/auth/sign-in/email',{email,password},ctx);}expect(login.status()).toBe(200);
      expect((await ctx.get('/api/procedures/'+randomUUID())).status()).toBe(403);await o.enroll(ctx);if(role==='notario')notary=ctx;else cashier=ctx;
    }
    const r=await post('/api/platform/people',{name:'Compareciente Procedimiento QA',documentType:'DEMO',documentNumber:'PROC-QA'});expect(r.status()).toBe(200);personId=(await r.json()).id;
    async function upload(title:string){const r=await o.admin().post('/api/platform/documents',{headers:{Origin:origin},multipart:{personId,title,file:{name:'prueba.txt',mimeType:'text/plain',buffer:Buffer.from('Evidencia sintética, sin datos reales.')}}});expect(r.status()).toBe(200);return (await r.json()).id as string;}
    evidenceId=await upload('Sustento procedimiento QA');quarantine=await upload('Sustento cuarentena QA');expect((await post('/api/platform/documents/'+evidenceId+'/review',{status:'liberado',note})).status()).toBe(200);
    sale=await setupCase('Compraventa');cert=await setupCase('Certificación de firmas');letter=await setupCase('Carta notarial');
    expect((await request.get('/api/procedures/'+sale)).status()).toBe(401);expect((await cashier.get('/api/procedures/'+sale)).status()).toBe(403);expect((await command(sale,{type:'authorize',draftId:(await detail(sale)).drafts[0].id,folios:1,note,acknowledge:true})).status()).toBe(403);
    const c=await detail(sale);expect((await command(sale,{type:'identity',participantId:(await detail(cert)).participants[0].id,draftId:c.drafts[0].id,scenario:'coincide',note})).status()).toBe(400);
    expect((await command(sale,{type:'identity',participantId:c.participants[0].id,draftId:randomUUID(),scenario:'coincide',note})).status()).toBe(409);
    expect((await post('/api/procedures/'+sale,{},notary)).status()).toBe(400);expect((await notary.post('/api/procedures/'+sale,{data:{},headers:{Origin:'https://other.example'}})).status()).toBe(403);
  });
  test('BK-15: no coincidencia, incertidumbre, consulta y excepción individual del notario',async()=>{
    const c=await detail(sale),p=c.participants[0],base={type:'identity',participantId:p.id,draftId:c.drafts[0].id,note};
    expect((await command(sale,{...base,scenario:'desconocido'})).status()).toBe(200);let s=await state(sale);expect(s.identities[0].result).toBe('desconocido');
    expect((await command(sale,{...base,scenario:'coincide'})).status()).toBe(409);
    expect((await command(sale,{type:'identity-exception',attemptId:s.identities[0].id,evidenceId,note,acknowledge:true},notary)).status()).toBe(409);
    expect((await command(sale,{type:'identity-resolve',attemptId:s.identities[0].id,scenario:'no-coincide',note})).status()).toBe(200);s=await state(sale);
    expect((await command(sale,{type:'grant',participantId:p.id,draftId:c.drafts[0].id,identityId:s.identities[0].id,evidenceId,note,acknowledge:true})).status()).toBe(409);
    const exception={type:'identity-exception',attemptId:s.identities[0].id,evidenceId,note,acknowledge:true};expect((await command(sale,exception)).status()).toBe(403);expect((await command(sale,{...exception,evidenceId:quarantine},notary)).status()).toBe(400);expect((await command(sale,exception,notary)).status()).toBe(200);
    s=await state(sale);expect(s.events.filter(e=>e.kind.startsWith('identity'))).toHaveLength(3);expect(s.identities[0].result).toBe('excepcion');expect((await detail(sale)).reviewed).toBe(true);
    expect((await command(sale,{type:'grant',participantId:p.id,draftId:c.drafts[0].id,identityId:s.identities[0].id,evidenceId,note,acknowledge:true})).status()).toBe(200);
  });
  test('BK-16: bloqueos, otorgamientos, asignación concurrente e idempotencia real',async()=>{
    const c=await detail(sale),missing={type:'authorize',draftId:(await detail(cert)).drafts[0].id,folios:2,note,acknowledge:true};
    expect((await command(cert,missing,notary)).status()).toBe(409);
    confirmed={requestId:randomUUID(),revision:c.revision,type:'authorize',draftId:c.drafts[0].id,folios:3,note,acknowledge:true};const pair=await Promise.all([post('/api/procedures/'+sale,confirmed,notary),post('/api/procedures/'+sale,confirmed,notary)]);expect(pair.map(r=>r.status())).toEqual([200,200]);expect(await pair[0].json()).toEqual(await pair[1].json());firstInstrument=(await pair[0].json()).id;
    const s=await state(sale);expect(s.instruments).toHaveLength(1);expect(s.instruments[0].number).toMatch(/^SIM-ESCR-/);expect(s.instruments[0].folioStart).toBe(1);expect(s.instruments[0].folioEnd).toBe(3);
    expect((await post('/api/procedures/'+sale,{...confirmed,note:note+' diferente'},notary)).status()).toBe(409);expect((await post('/api/procedures/'+sale,confirmed)).status()).toBe(403);
    expect((await command(sale,{type:'authorize',draftId:c.drafts[0].id,folios:1,note,acknowledge:true},notary)).status()).toBe(409);
    await identifyGrant(cert);await identifyGrant(letter);
    const results=await Promise.all([command(cert,missing,notary),command(letter,{...missing,draftId:(await detail(letter)).drafts[0].id},notary)]);expect(results.map(r=>r.status())).toEqual([200,200]);
    expect((await state(cert)).instruments[0].number).toMatch(/^SIM-CERT-/);expect((await state(letter)).instruments[0].number).toMatch(/^SIM-CARTA-/);
  });
  test('BK-16: incidencia, número no reutilizado y cambio documental no reescribe historia',async()=>{
    const original=(await state(sale)).instruments[0];let c=await detail(sale);
    expect((await post('/api/cases/'+sale,{type:'draft',revision:c.revision,baseVersion:c.draft_version,body:'SEGUNDA VERSIÓN SINTÉTICA. Sin validez notarial.'})).status()).toBe(200);c=await detail(sale);expect(c.reviewed).toBe(false);expect((await state(sale)).instruments[0]).toEqual(original);
    expect((await command(sale,{type:'void',instrumentId:firstInstrument,note},notary)).status()).toBe(200);
    expect((await command(sale,{type:'authorize',draftId:c.drafts[0].id,folios:2,note,acknowledge:true},notary)).status()).toBe(409);
    expect((await post('/api/cases/'+sale,{type:'review',revision:(await detail(sale)).revision,draftId:c.drafts[0].id,note},notary)).status()).toBe(200);await identifyGrant(sale);
    const revision=(await detail(sale)).revision,body={type:'authorize',revision,draftId:c.drafts[0].id,folios:2,note,acknowledge:true};const pair=await Promise.all([post('/api/procedures/'+sale,{...body,requestId:randomUUID()},notary),post('/api/procedures/'+sale,{...body,requestId:randomUUID()},notary)]);expect(pair.map(r=>r.status()).sort()).toEqual([200,409]);
    const s=await state(sale);expect(s.instruments).toHaveLength(2);expect(s.instruments[1].number).not.toBe(original.number);expect(s.instruments[1].folioStart).toBe(4);expect(s.instruments[0]).toEqual(original);
    expect((await post('/api/procedures/'+sale,confirmed,notary)).status()).toBe(200);expect((await state(sale)).instruments).toHaveLength(2);
  });
  test('BK-16: dos expedientes concurrentes del mismo registro reciben números y folios distintos',async()=>{
    const ids=await Promise.all([setupCase('Compraventa'),setupCase('Compraventa')]);for(const id of ids)await identifyGrant(id);
    const pair=await Promise.all(ids.map(async id=>command(id,{type:'authorize',draftId:(await detail(id)).drafts[0].id,folios:2,note,acknowledge:true},notary)));expect(pair.map(r=>r.status())).toEqual([200,200]);
    const instruments=await Promise.all(ids.map(async id=>(await state(id)).instruments[0]));expect(instruments[0].number).not.toBe(instruments[1].number);const sorted=instruments.sort((a,b)=>a.folioStart-b.folioStart);expect(sorted[0].folioEnd+1).toBe(sorted[1].folioStart);
  });
  test('BK-17: certificación y entrega idempotente sin cambiar finanzas',async()=>{
    const finance=await(await o.admin().get('/api/finance')).json(),fiscal=await(await o.admin().get('/api/fiscal')).json(),s=await state(cert),i=s.instruments[0],c=await detail(cert);
    expect((await command(cert,{type:'schedule',instrumentId:i.id,recipient:'Ficticio',address:'Dirección sintética QA',scheduledAt:new Date().toISOString(),assigneeId:(await state(cert)).assignees[0].id,note})).status()).toBe(400);
    const body={requestId:randomUUID(),revision:c.revision,type:'delivery',instrumentId:i.id,participantId:c.participants[0].id,evidenceId,note,acknowledge:true};const pair=await Promise.all([post('/api/procedures/'+cert,body),post('/api/procedures/'+cert,body)]);expect(pair.map(r=>r.status())).toEqual([200,200]);
    expect((await command(cert,{...body,requestId:randomUUID(),revision:(await detail(cert)).revision})).status()).toBe(409);
    const download=await o.admin().get('/api/procedures/'+cert+'?instrument='+i.id);expect(download.status()).toBe(200);expect(download.headers()['content-disposition']).toContain('attachment');expect(await download.text()).toContain('SIN FIRMA NI VALIDEZ NOTARIAL');expect((await cashier.get('/api/procedures/'+cert+'?instrument='+i.id)).status()).toBe(403);
    expect(await(await o.admin().get('/api/finance')).json()).toEqual(finance);expect(await(await o.admin().get('/api/fiscal')).json()).toEqual(fiscal);
  });
  test('BK-17: varios intentos, desconocido aclarado, constancia y entrega separadas',async()=>{
    const s=await state(letter),i=s.instruments[0],c=await detail(letter),delivery={type:'delivery',instrumentId:i.id,participantId:c.participants[0].id,evidenceId,note,acknowledge:true};
    expect((await command(letter,delivery)).status()).toBe(409);
    const schedule={type:'schedule',instrumentId:i.id,recipient:'Destinatario sintético de la carta',address:'Calle sintética número 100, Lima',scheduledAt:new Date().toISOString(),assigneeId:s.assignees[0].id,note};
    const first=await command(letter,schedule);expect(first.status()).toBe(200);const attemptId=(await first.json()).id;expect((await command(letter,schedule)).status()).toBe(409);
    expect((await command(letter,{type:'diligence',attemptId,outcome:'no-encontrado',occurredAt:new Date().toISOString(),evidenceId,note})).status()).toBe(200);
    const second=await command(letter,schedule);expect(second.status()).toBe(200);const secondId=(await second.json()).id;expect((await command(letter,{type:'diligence',attemptId:secondId,outcome:'desconocido',occurredAt:new Date().toISOString(),evidenceId,note})).status()).toBe(200);
    const certificate={type:'certificate',instrumentId:i.id,note,acknowledge:true};expect((await command(letter,certificate,notary)).status()).toBe(409);
    expect((await command(letter,{type:'diligence-resolve',attemptId:secondId,outcome:'rechazada',occurredAt:new Date().toISOString(),evidenceId,note})).status()).toBe(200);
    expect((await command(letter,certificate)).status()).toBe(403);expect((await command(letter,certificate,notary)).status()).toBe(200);expect((await command(letter,schedule)).status()).toBe(409);
    expect((await state(letter)).events.some(e=>e.kind==='delivery')).toBe(false);expect((await command(letter,delivery)).status()).toBe(200);const after=await state(letter);expect(after.events.filter(e=>e.kind==='schedule')).toHaveLength(2);expect(after.events.filter(e=>e.kind==='diligence')).toHaveLength(2);expect(after.events.filter(e=>e.kind==='delivery')).toHaveLength(1);
  });
  test('procedimiento UI: recorrido completo de certificación entre administración y notario',async({browser})=>{
    const id=await setupCase('Certificación de firmas'),adminContext=await browser.newContext({storageState:o.storage()}),p=await adminContext.newPage();
    await p.goto(origin+'/expedientes/'+id+'/identificacion');await p.getByRole('button',{name:'Nuevo intento simulado'}).click();let d=p.getByRole('dialog');await d.getByLabel('Fundamento y constancia').fill(note);await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d).not.toBeVisible();await expect(p.getByText('Coincidencia simulada',{exact:true})).toBeVisible();
    await p.getByRole('link',{name:'Actuación',exact:true}).click();await p.getByRole('button',{name:'Registrar comparecencia para certificación'}).click();d=p.getByRole('dialog');await d.getByLabel('Sustento privado liberado').selectOption(evidenceId);await d.getByLabel('Fundamento y constancia').fill(note);await d.getByRole('checkbox').check();await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d).not.toBeVisible();await expect(p.getByText('Conformidad registrada para versión y contexto vigentes',{exact:true})).toBeVisible();
    const notaryContext=await browser.newContext({storageState:await notary.storageState()}),n=await notaryContext.newPage();await n.goto(origin+'/expedientes/'+id+'/actuacion');await n.getByRole('button',{name:'Registrar instrumento local',exact:true}).click();d=n.getByRole('dialog');await d.getByLabel('Cantidad de folios internos de prueba').fill('2');await d.getByLabel('Fundamento y constancia').fill(note);await d.getByRole('checkbox').check();await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d).not.toBeVisible();await expect(n.getByRole('heading',{name:/SIM-CERT-/})).toBeVisible();
    await p.goto(origin+'/expedientes/'+id+'/entrega');await p.getByRole('button',{name:'Registrar entrega al solicitante'}).click();d=p.getByRole('dialog');await d.getByLabel('Sustento privado liberado').selectOption(evidenceId);await d.getByLabel('Fundamento y constancia').fill(note);await d.getByRole('checkbox').check();await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d).not.toBeVisible();await expect(p.getByText('Entregado al solicitante',{exact:true})).toBeVisible();await adminContext.close();await notaryContext.close();
  });
  test('procedimiento UI: identificación, formulario conservado, móvil, oscuro y constancia',async({browser})=>{
    const context=await browser.newContext({storageState:o.storage()}),p=await context.newPage(),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(origin+'/expedientes/'+sale+'/identificacion');await p.getByRole('button',{name:'Nuevo intento simulado'}).click();let d=p.getByRole('dialog');await d.getByLabel('Fundamento y constancia').fill(note);
    await post('/api/cases/'+sale,{type:'note',revision:(await detail(sale)).revision,body:'Observación concurrente para probar conflicto de UI.'});await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d.getByRole('alert')).toBeVisible();await expect(d.getByLabel('Fundamento y constancia')).toHaveValue(note);await d.getByRole('button',{name:'Actualizar contexto sin cerrar'}).click();await expect(d.getByLabel('Fundamento y constancia')).toHaveValue(note);await p.keyboard.press('Escape');await expect(d).not.toBeVisible();await expect(p.getByRole('button',{name:'Nuevo intento simulado'})).toBeFocused();
    await p.goto(origin+'/expedientes/'+cert+'/identificacion');await p.getByRole('button',{name:'Nuevo intento simulado'}).click();d=p.getByRole('dialog');await d.getByLabel('Escenario de simulación').selectOption('error-tecnico');await d.getByLabel('Fundamento y constancia').fill(note);await d.getByRole('button',{name:'Confirmar registro local'}).click();await expect(d).not.toBeVisible();await expect(p.getByText('Error técnico',{exact:true})).toBeVisible();
    for(const width of [1440,683,390]){await p.setViewportSize({width,height:1000});await p.goto(origin+'/expedientes/'+letter+'/entrega');await expect(p.getByRole('heading',{name:'Diligencia y entrega',exact:true})).toBeVisible();await p.evaluate(()=>document.fonts.ready);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a.violations.map(v=>v.id)).toEqual([]);await p.screenshot({path:`docs/evidence/${evidencePrefix}-${width}.png`,fullPage:true});}
    await p.getByRole('button',{name:'Activar tema oscuro'}).click();await p.getByRole('button',{name:'Ver constancia interna'}).click();d=p.getByRole('dialog');await expect(d).toContainText('SIN FIRMA NI VALIDEZ NOTARIAL');const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a.violations.map(v=>v.id)).toEqual([]);await p.screenshot({path:`docs/evidence/${evidencePrefix}-oscuro.png`,fullPage:true});expect(errors).toEqual([]);await context.close();await notary.dispose();await cashier.dispose();
  });
}
