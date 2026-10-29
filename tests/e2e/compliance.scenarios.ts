import {test,expect,type APIRequestContext} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import {limaDate,incidentDeadline,type ComplianceState} from '../../src/lib/compliance-domain';
import {validateComplianceExport} from '../../src/server/compliance';
const origin='http://127.0.0.1:3101',password='Solo-pruebas-Local-2026!',note='Evaluación sintética de cumplimiento. Sin datos ni comunicaciones reales.',evidence='Constancia sintética reservada para validar decisiones humanas.';
export function registerComplianceScenarios(o:{admin:()=>APIRequestContext;evidencePrefix?:string;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(c:APIRequestContext)=>Promise<string[]>}){
 const evidencePrefix=o.evidencePrefix||'fase-5';
 let notary:APIRequestContext,cashier:APIRequestContext,personId:string,caseId:string,policyId:string,treatmentId:string,riskId:string,holdId:string,arcoId:string,incidentId:string,exportId:string,notaryId:string;let exportText:string;let initialFinance:unknown,initialFiscal:unknown;
 const policy={type:'purpose',code:'ATENCION',title:'Atención local de prueba',basis:'Base evaluada para este ejercicio sintético, no política operativa.',notice:'Aviso sintético con finalidades, derechos y contacto para revisión.',consentRequired:true,retentionDays:365,source:'DS 016-2024-JUS, artículos aplicables sujetos a revisión jurídica local.',calendar:'habiles',holidays:['2026-11-02'],arcoDays:{informacion:8,acceso:20,rectificacion:10,cancelacion:10,oposicion:10},note,acknowledge:true};
 const post=(data:unknown,ctx=notary)=>ctx.post('/api/compliance',{headers:{Origin:origin},data});
 async function state(area='privacidad',ctx=notary){const r=await ctx.get('/api/compliance?area='+area);expect(r.status()).toBe(200);return await r.json() as ComplianceState;}
 async function cmd(data:Record<string,unknown>,ctx=notary){const area=['risk','risk-review','export','export-receipt'].includes(String(data.type))?'plaft':'privacidad';return post({requestId:randomUUID(),revision:(await state(area,ctx)).revision,...data},ctx);}
 async function ok(data:Record<string,unknown>,ctx=notary){const r=await cmd(data,ctx);expect(r.status(),await r.text()).toBe(200);return (await r.json()).id as string;}
 const getRecord=async(id:string,area='privacidad')=>(await state(area)).records.find(r=>r.id===id)!;
 test('fase 5: autenticación y separación de PLAFT respecto de roles generales',async({playwright,request})=>{
  test.setTimeout(180000);
  expect((await request.get('/api/compliance?area=plaft')).status()).toBe(401);expect((await o.admin().get('/api/compliance?area=plaft')).status()).toBe(403);
  for(const role of ['notario','caja']){const email='cumplimiento-'+role+'@example.test';expect((await o.admin().post('/api/platform/users',{headers:{Origin:origin},data:{name:'Cumplimiento QA '+role,email,password,role}})).status()).toBe(200);const ctx=await playwright.request.newContext({baseURL:origin});let r=await ctx.post('/api/auth/sign-in/email',{headers:{Origin:origin},data:{email,password}});if(r.status()===429){await new Promise(r=>setTimeout(r,61000));r=await ctx.post('/api/auth/sign-in/email',{headers:{Origin:origin},data:{email,password}});}expect(r.status()).toBe(200);expect((await ctx.get('/api/compliance?area=privacidad')).status()).toBe(403);await o.enroll(ctx);if(role==='notario'){notary=ctx;notaryId=(await(await ctx.get('/api/platform/me')).json()).id;}else cashier=ctx;}
  expect((await cashier.get('/api/compliance?area=plaft')).status()).toBe(403);expect((await cashier.get('/api/compliance?area=privacidad')).status()).toBe(403);
  expect((await notary.post('/api/compliance',{data:{},headers:{Origin:'https://other.test'}})).status()).toBe(403);
  expect((await post({...policy,requestId:randomUUID(),revision:1,submit:true})).status()).toBe(400);
  const p=await o.admin().post('/api/platform/people',{headers:{Origin:origin},data:{name:'Titular Cumplimiento QA',documentType:'DEMO',documentNumber:'CUMP-QA'}});expect(p.status()).toBe(200);personId=(await p.json()).id;
  const c=await o.admin().post('/api/cases',{headers:{Origin:origin},data:{requestId:randomUUID(),personId,act:'Compraventa',subject:'Expediente sintético de cumplimiento'}});expect(c.status()).toBe(200);caseId=(await c.json()).id;initialFinance=await(await o.admin().get('/api/finance')).json();initialFiscal=await(await o.admin().get('/api/fiscal')).json();
 });
 test('BK-22: políticas y avisos versionados, consentimiento y retiro sin borrar historia',async()=>{
  expect((await cmd(policy,o.admin())).status()).toBe(403);policyId=await ok(policy);const first=await getRecord(policyId);
  const treatment={type:'treatment',personId,purposeId:policyId,noticeAt:new Date().toISOString(),consent:'otorgado',evidence,note};treatmentId=await ok(treatment,o.admin());
  const second=await ok({...policy,title:'Aviso local actualizado'});expect((await getRecord(second)).events[0].data.version).toBe(2);expect((await cmd(treatment)).status()).toBe(409);expect(await getRecord(policyId)).toEqual(first);
  const history=await getRecord(treatmentId);expect((history.events[0].data.purpose as Record<string,unknown>).version).toBe(1);await ok({type:'consent',recordId:treatmentId,consent:'retirado',evidence,note},o.admin());expect((await getRecord(treatmentId)).events).toHaveLength(2);policyId=second;
  expect((await cmd({...treatment,purposeId:policyId,consent:'no-aplica'})).status()).toBe(400);
 });
 test('BK-21: diligencia, dinero exacto, revisión humana e idempotencia concurrente',async()=>{
  const risk={type:'risk',caseId,personId,operationDate:limaDate(),level:'alto',pep:'pendiente',beneficialOwner:'Beneficiario y verificación sintetizados para revisión.',fundsOrigin:'Origen declarado y sustento sintético individual.',signals:'SEÑAL-RESERVADA-QA-EXCLUSIVA para revisión humana.',amount:'0.10',nextReview:limaDate(),note};
  expect((await cmd({...risk,amount:0.1})).status()).toBe(400);expect((await cmd({...risk,personId:randomUUID()})).status()).toBe(400);
  const body={...risk,requestId:randomUUID(),revision:(await state('plaft')).revision};const pair=await Promise.all([post(body),post(body)]);expect(pair.map(r=>r.status())).toEqual([200,200]);expect(await pair[0].json()).toEqual(await pair[1].json());riskId=(await pair[0].json()).id;
  expect((await post({...body,note:note+' diferente'})).status()).toBe(409);expect((await state('plaft')).records.filter(r=>r.id===riskId)).toHaveLength(1);
  expect((await cmd({type:'export',period:limaDate().slice(0,7),recordIds:[riskId],note,acknowledge:true})).status()).toBe(409);
  await ok({type:'risk-review',recordId:riskId,decision:'seguimiento',level:'alto',nextReview:limaDate(),note,acknowledge:true});
  const detail=await(await o.admin().get('/api/cases/'+caseId)).text(),audit=await(await o.admin().get('/api/platform/audit')).text();expect(detail+audit).not.toContain('SEÑAL-RESERVADA-QA-EXCLUSIVA');
  expect((await getRecord(riskId,'plaft')).events[0].data.amount).toBe('0.10');
 });
 test('BK-22: ARCO exige legitimación y conserva bloqueo ante cancelación',async()=>{
  holdId=await ok({type:'hold',personId,caseId,category:'Protocolo y sustento local',until:'2026-01-01',note},o.admin());
  arcoId=await ok({type:'arco',personId,purposeId:policyId,right:'cancelacion',receivedAt:limaDate(),request:'Solicitud sintética de cancelación de datos del titular.',note},o.admin());
  const response={type:'arco-response',recordId:arcoId,decision:'atender',response:'Respuesta sintética fundada y revisada.',deliveredAt:new Date().toISOString(),evidence,note};expect((await cmd(response,o.admin())).status()).toBe(409);
  await ok({type:'arco-identity',recordId:arcoId,evidence,note},o.admin());expect((await cmd(response,o.admin())).status()).toBe(409);
  expect((await cmd({type:'hold-release',recordId:holdId,note,acknowledge:true},o.admin())).status()).toBe(403);
  await ok({...response,decision:'parcial'},o.admin());expect((await getRecord(arcoId)).events.at(-1)?.data.activeHolds).toEqual([holdId]);expect((await cmd(response)).status()).toBe(409);
  expect((await getRecord(holdId)).events).toHaveLength(1);expect((await(await o.admin().get('/api/cases/'+caseId)).json()).id).toBe(caseId);
 });
 test('BK-22: plazos ARCO y ampliación única comunicada, sin reescribir solicitud',async()=>{
  const id=await ok({type:'arco',personId,purposeId:policyId,right:'acceso',receivedAt:limaDate(),request:'Solicitud sintética de acceso al tratamiento de datos.',note});const original=(await getRecord(id)).events[0];
  const extension={type:'arco-extend',recordId:id,communicatedAt:limaDate(),evidence,note};await ok(extension);expect((await cmd(extension)).status()).toBe(409);expect((await getRecord(id)).events[0]).toEqual(original);
  const info=await ok({type:'arco',personId,purposeId:policyId,right:'informacion',receivedAt:limaDate(),request:'Solicitud sintética de información sobre finalidades.',note});expect((await cmd({...extension,recordId:info})).status()).toBe(409);
 });
 test('BK-22: incidentes por hito, no aplicación fundada y constancias separadas',async()=>{
  const knownAt=new Date(Date.now()-3600000).toISOString();incidentId=await ok({type:'incident',title:'Incidente sintético QA',knownAt,description:'Incidente ficticio, sin datos personales afectados realmente.',note},o.admin());
  expect((await cmd({type:'incident-close',recordId:incidentId,note})).status()).toBe(409);
  const assess={type:'incident-assess',recordId:incidentId,recipient:'ANPD',applicability:'aplica',triggerAt:knownAt,note};expect((await cmd({...assess,triggerAt:new Date().toISOString()})).status()).toBe(400);await ok(assess);
  expect((await getRecord(incidentId)).events.at(-1)?.data.dueAt).toBe(incidentDeadline(knownAt));
  expect((await cmd({...assess,triggerAt:new Date(Date.now()-1800000).toISOString()})).status()).toBe(400);
  await ok({type:'incident-assess',recordId:incidentId,recipient:'titular',applicability:'no-aplica',triggerAt:knownAt,note});await ok({type:'incident-assess',recordId:incidentId,recipient:'CNSD',applicability:'pendiente',triggerAt:knownAt,note});
  expect((await cmd({type:'incident-close',recordId:incidentId,note})).status()).toBe(409);
  await ok({type:'incident-receipt',recordId:incidentId,recipient:'ANPD',sentAt:new Date().toISOString(),reference:'Cargo externo sintético QA',evidence,note});await ok({type:'incident-assess',recordId:incidentId,recipient:'CNSD',applicability:'no-aplica',triggerAt:knownAt,note});await ok({type:'incident-close',recordId:incidentId,note});
  expect((await cmd(assess)).status()).toBe(409);const r=await getRecord(incidentId);expect(r.events.some(e=>e.data.applicability==='no-aplica'&&e.data.note===note)).toBe(true);expect(r.events.filter(e=>e.kind==='incident-receipt')).toHaveLength(1);
 });
 test('BK-23: exportación inmutable validada, descarga reservada y cargo explícito',async({request})=>{
  const input={type:'export',period:limaDate().slice(0,7),recordIds:[riskId],note,acknowledge:true};expect((await cmd({...input,period:'2020-01'})).status()).toBe(400);expect((await cmd({...input,recordIds:[riskId,riskId]})).status()).toBe(400);
  exportId=await ok(input);let r=await getRecord(exportId,'plaft');expect(r.events[0].data.status).toBe('preparado-no-presentado');const d=await notary.get('/api/compliance?file='+exportId);expect(d.status()).toBe(200);expect(d.headers()['cache-control']).toContain('no-store');exportText=await d.text();const v=validateComplianceExport(exportText);expect(v.entries[0].sourceEvent.data.amount).toBe('0.10');expect(v.warning).toContain('NO PRESENTADO');
  for(const ctx of [o.admin(),cashier,request])expect((await ctx.get('/api/compliance?file='+exportId)).status()).toBe(ctx===request?401:403);
  await ok({type:'risk-review',recordId:riskId,decision:'escalar',level:'alto',nextReview:limaDate(),note,acknowledge:true});expect(await(await notary.get('/api/compliance?file='+exportId)).text()).toBe(exportText);
  const next=await ok(input);expect(next).not.toBe(exportId);expect(await(await notary.get('/api/compliance?file='+next)).text()).not.toBe(exportText);
  await ok({type:'export-receipt',recordId:exportId,receivedAt:new Date().toISOString(),reference:'Referencia externa de prueba',evidence,note});r=await getRecord(exportId,'plaft');expect(r.events.at(-1)?.data.status).toBe('cargo-externo-declarado-no-verificado');
 });
 test('fase 5: formulario real conserva datos ante conflicto y registra incidente',async({browser})=>{
  const ctx=await browser.newContext({storageState:o.storage()}),p=await ctx.newPage();await p.goto(origin+'/cumplimiento/privacidad');await p.getByRole('button',{name:'Registrar actuación',exact:true}).click();const d=p.getByRole('dialog');await d.getByLabel('Tipo de actuación').selectOption('incident');await d.getByLabel('Título del incidente').fill('Incidente creado por interfaz QA');await d.getByLabel('Conocimiento o constancia (hora Lima)').fill(limaDate()+'T00:01');await d.getByLabel('Datos afectados, alcance y medidas iniciales').fill(note);await d.getByLabel('Fundamento y observaciones').fill(note);
  await ok({type:'hold',personId,caseId:null,category:'Conservación concurrente',until:null,note});await d.getByRole('button',{name:'Guardar actuación',exact:true}).click();await expect(d.getByRole('alert')).toContainText('El área cambió');await expect(d.getByLabel('Fundamento y observaciones')).toHaveValue(note);await d.getByRole('button',{name:'Actualizar contexto conservando datos'}).click();await d.getByRole('button',{name:'Guardar actuación',exact:true}).click();await expect(d).toHaveCount(0);await expect(p.getByText('Incidente creado por interfaz QA',{exact:true})).toBeVisible();await ctx.close();
 });
 test('fase 5: privacidad y PLAFT en escritorio, móvil, oscuro y teclado sin filtraciones',async({browser})=>{
  const ctx=await browser.newContext({storageState:o.storage()}),p=await ctx.newPage();const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1440,683,390]){await p.setViewportSize({width,height:1000});await p.goto(origin+'/cumplimiento/privacidad');await expect(p.getByRole('button',{name:'Registrar actuación',exact:true})).toBeVisible();await p.evaluate(()=>document.fonts.ready);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await p.screenshot({path:`docs/evidence/${evidencePrefix}-privacidad-${width}.png`,fullPage:true});}
  const opener=p.getByRole('button',{name:'Registrar actuación',exact:true});await opener.click();await p.keyboard.press('Escape');await expect(p.getByRole('dialog')).toHaveCount(0);await expect(opener).toBeFocused();await p.getByRole('button',{name:'Activar tema oscuro'}).click();await opener.click();await p.getByLabel('Tipo de actuación').selectOption('arco-response');const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a.violations.map(v=>v.id)).toEqual([]);await p.screenshot({path:`docs/evidence/${evidencePrefix}-privacidad-oscuro.png`,fullPage:true});await p.keyboard.press('Escape');await p.goto(origin+'/cumplimiento/plaft');await expect(p.locator('main [role=alert]')).toContainText('no tiene permiso');await expect(p.locator('body')).not.toContainText('SEÑAL-RESERVADA-QA-EXCLUSIVA');await ctx.close();
  const nc=await browser.newContext({storageState:await notary.storageState()}),np=await nc.newPage();await np.goto(origin+'/cumplimiento/plaft');await expect(np.getByRole('button',{name:'Registrar actuación',exact:true})).toBeVisible();await np.getByRole('button',{name:'Consultar Diligencia',exact:false}).first().click();await expect(np.getByRole('dialog')).toContainText('SEÑAL-RESERVADA-QA-EXCLUSIVA');await np.screenshot({path:`docs/evidence/${evidencePrefix}-plaft.png`,fullPage:true});expect(errors).toEqual([]);await nc.close();
 });
 test('fase 5: revocación del custodio invalida sesión y descargas',async()=>{expect(await(await o.admin().get('/api/finance')).json()).toEqual(initialFinance);expect(await(await o.admin().get('/api/fiscal')).json()).toEqual(initialFiscal);expect((await o.admin().patch('/api/platform/users/'+notaryId,{headers:{Origin:origin},data:{role:'abogado',active:true}})).status()).toBe(200);expect((await notary.get('/api/compliance?area=plaft')).status()).toBe(401);expect((await notary.get('/api/compliance?file='+exportId)).status()).toBe(401);await notary.dispose();await cashier.dispose();});
}
