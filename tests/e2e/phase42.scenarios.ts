import {test,expect,type APIRequestContext} from '@playwright/test';
import {randomUUID,createHash} from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import jsQR from 'jsqr';
import type {FiscalData,FiscalDetail} from '../../src/lib/fiscal-domain';
const origin='http://127.0.0.1:3101',password='Solo-pruebas-Local-2026!';
export function registerFiscalScenarios(options:{admin:()=>APIRequestContext;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(context:APIRequestContext)=>Promise<string[]>;evidencePrefix?:string}){
  let cashier:APIRequestContext,receiver:APIRequestContext;let firstId:string,chargeId:string;let prepareInput:Record<string,unknown>;
  const post=(path:string,data:unknown,context=options.admin())=>context.post(path,{headers:{Origin:origin},data});
  const data=async()=>{const r=await options.admin().get('/api/fiscal');expect(r.status()).toBe(200);return await r.json() as FiscalData;};
  const detail=async(id:string)=>{const r=await options.admin().get('/api/fiscal/'+id);expect(r.status()).toBe(200);return await r.json() as FiscalDetail;};
  async function source(){
    const person=await post('/api/platform/people',{name:'Cliente Fiscal Ficticio',documentType:'DEMO',documentNumber:'FIS-'+randomUUID().slice(0,8)});expect(person.status()).toBe(200);const personId=(await person.json()).id;
    const c=await post('/api/cases',{requestId:randomUUID(),personId,act:'Compraventa',subject:'Asunto jurídico ficticio privado fiscal'});expect(c.status()).toBe(200);const caseId=(await c.json()).id;
    let d=await(await options.admin().get('/api/cases/'+caseId)).json();
    const lines=[{description:'Honorarios & <fiscal QA>',category:'Honorarios',unitAmount:'118.00',quantity:1},{description:'Consulta identidad separada QA',category:'Otros',unitAmount:'0.10',quantity:1},{description:'Fondos terceros no facturables QA',category:'Terceros',unitAmount:'30.00',quantity:1}];
    expect((await post('/api/cases/'+caseId,{type:'quote',revision:d.revision,baseVersion:0,validUntil:'2099-12-31',lines})).status()).toBe(200);
    d=await(await options.admin().get('/api/cases/'+caseId)).json();expect((await post('/api/cases/'+caseId,{type:'accept-quote',revision:d.revision,quoteId:d.quotes[0].id,participantId:d.participants[0].id,reference:'Aceptación sintética para validar contrato fiscal de prueba'})).status()).toBe(200);
    const finance=await(await options.admin().get('/api/finance')).json();const charge=await post('/api/finance',{type:'quote-charge',requestId:randomUUID(),revision:finance.revision,personId,caseId,quoteId:d.quotes[0].id,note:'Cargo propio para documento de prueba fiscal'});expect(charge.status()).toBe(200);
    return {chargeId:(await charge.json()).id as string,personId,caseId};
  }
  async function prepare(charge:string,scenario='accept',extra:Record<string,unknown>={}){
    return {type:'prepare',requestId:randomUUID(),revision:(await data()).revision,chargeId:charge,documentType:'01',receiver:{name:'Receptor Fiscal Ficticio & Cía.',documentType:'6',documentNumber:'20000000001'},taxes:[{lineIndex:0,tax:'gravado18',purpose:'service'},{lineIndex:1,tax:'inafecto',purpose:'identity-query'}],scenario,acknowledgeSimulation:true,...extra};
  }
  async function create(scenario:string,extra:Record<string,unknown>={}){const s=await source();const r=await post('/api/fiscal',await prepare(s.chargeId,scenario,extra));expect(r.status()).toBe(200);return {s,id:(await r.json()).id as string};}
  async function input(id:string,type:string,extra:Record<string,unknown>={}){const d=await detail(id);return {type,documentId:id,documentRevision:d.revision,requestId:randomUUID(),revision:(await data()).revision,...extra};}
  async function cmd(id:string,type:string,extra:Record<string,unknown>={},context=options.admin()){const r=await post('/api/fiscal',await input(id,type,extra),context);expect(r.status()).toBe(200);return r.json();}
  const finance=async()=>await(await options.admin().get('/api/finance')).json();
  test('fiscal: catálogo vacío, sesión/TOTP/origen y permisos por acción; sin archivos para perfiles ajenos',async({playwright,request})=>{
    test.setTimeout(150000);expect((await request.get('/api/fiscal')).status()).toBe(401);expect((await request.get('/api/fiscal/'+randomUUID()+'/xml')).status()).toBe(401);expect((await data()).total).toBe(0);
    expect((await options.admin().post('/api/fiscal',{data:{},headers:{Origin:'https://other.example'}})).status()).toBe(403);
    for(const role of ['caja','recepcion']){
      const email='fiscal-'+role+'@example.test';expect((await post('/api/platform/users',{name:'Fiscal '+role+' QA',email,password,role})).status()).toBe(200);const context=await playwright.request.newContext({baseURL:origin});
      let login=await post('/api/auth/sign-in/email',{email,password},context);if(login.status()===429){await new Promise(r=>setTimeout(r,61000));login=await post('/api/auth/sign-in/email',{email,password},context);}expect(login.status()).toBe(200);
      expect((await context.get('/api/fiscal')).status()).toBe(403);await options.enroll(context);if(role==='caja')cashier=context;else receiver=context;
    }
    expect((await cashier.get('/api/fiscal')).status()).toBe(200);expect((await receiver.get('/api/fiscal')).status()).toBe(403);expect((await receiver.get('/api/fiscal/'+randomUUID()+'/qr')).status()).toBe(403);
    expect((await cashier.get('/api/cases')).status()).toBe(403);
  });
  test('preparación fiscal: UUID concurrente, decimal exacto, XML/QR inmutables y solo cargo propio',async()=>{
    const s=await source();chargeId=s.chargeId;prepareInput=await prepare(chargeId);
    expect((await post('/api/fiscal',prepareInput,cashier)).status()).toBe(403);
    expect((await post('/api/fiscal',{...prepareInput,mode:'production'})).status()).toBe(400);
    expect((await post('/api/fiscal',{...prepareInput,receiver:{name:'Ficticio QA',documentType:'1',documentNumber:'00000000'}})).status()).toBe(400);
    expect((await post('/api/fiscal',{...prepareInput,taxes:[{lineIndex:0,tax:'gravado18',purpose:'service'}]})).status()).toBe(400);
    const before=await finance();const pair=await Promise.all([post('/api/fiscal',prepareInput),post('/api/fiscal',prepareInput)]);expect(pair.map(r=>r.status())).toEqual([200,200]);const results=await Promise.all(pair.map(r=>r.json()));expect(results[0]).toEqual(results[1]);firstId=results[0].id;
    const d=await detail(firstId);expect(d.total).toBe('118.10');expect(d.tax).toBe('18.00');expect(d.snapshot.base).toBe('100.10');expect(d.snapshot.lines).toHaveLength(2);expect(d.snapshot.lines[1].purpose).toBe('identity-query');expect(d.events).toHaveLength(1);expect(JSON.stringify(d)).not.toContain('Asunto jurídico');expect(JSON.stringify(d)).not.toContain('Fondos terceros no facturables');
    expect(d.reference).toMatch(/^SIM-F001-\d{8}$/);expect(d.snapshot.issuer.ruc).toBe('00000000000');
    expect((await post('/api/fiscal',{...prepareInput,requestId:randomUUID(),revision:(await data()).revision})).status()).toBe(409);
    expect((await post('/api/fiscal',{...prepareInput,scenario:'reject'})).status()).toBe(409);
    const after=await finance();for(const key of ['revision','total','receivable','advance','third','cash','expense_pending'])expect(after[key]).toBe(before[key]);
  });
  test('simulador: envío idempotente, resultado por clave/huella y aceptación sin movimientos de caja',async()=>{
    const before=await finance();const request=await input(firstId,'submit');const pair=await Promise.all([post('/api/fiscal',request),post('/api/fiscal',request)]);expect(pair.map(r=>r.status())).toEqual([200,200]);expect(await pair[0].json()).toEqual(await pair[1].json());
    const d=await detail(firstId);expect(d.status).toBe('accepted');expect(d.events).toHaveLength(2);expect(d.events[0].response.code).toBe('SIM-ACCEPTED');
    expect((await post('/api/fiscal',request,cashier)).status()).toBe(409);
    expect((await post('/api/fiscal',await input(firstId,'submit'))).status()).toBe(409);expect((await post('/api/fiscal',await input(firstId,'discard',{reason:'No es una baja tributaria válida'}))).status()).toBe(409);
    expect((await post('/api/fiscal',prepareInput)).status()).toBe(200);expect((await detail(firstId)).status).toBe('accepted');
    const artifact=await options.admin().get('/api/fiscal/'+firstId+'/xml');expect(artifact.status()).toBe(200);expect(artifact.headers()['cache-control']).toBe('private, no-store');expect(artifact.headers()['content-disposition']).toContain('SIN-VALIDEZ.xml');expect(createHash('sha256').update(await artifact.body()).digest('hex')).toBe(d.xml_sha256);
    const after=await finance();for(const key of ['revision','total','receivable','advance','third','cash','expense_pending'])expect(after[key]).toBe(before[key]);
  });
  test('timeout posterior: bloquea reenvío, consulta concurrente recupera aceptación del mismo documento',async()=>{
    const {id}=await create('timeout-after');const initial=await detail(id);const send=await input(id,'submit');expect((await post('/api/fiscal',send,cashier)).status()).toBe(200);expect((await detail(id)).status).toBe('unknown');
    expect((await post('/api/fiscal',await input(id,'submit'))).status()).toBe(409);expect((await post('/api/fiscal',await input(id,'discard',{reason:'No se descarta un resultado desconocido'}))).status()).toBe(409);
    const query=await input(id,'consult');const pair=await Promise.all([post('/api/fiscal',query,cashier),post('/api/fiscal',query,cashier)]);expect(pair.map(r=>r.status())).toEqual([200,200]);expect(await pair[0].json()).toEqual(await pair[1].json());
    const d=await detail(id);expect(d.status).toBe('accepted');expect(d.events).toHaveLength(3);expect(d.reference).toBe(initial.reference);expect(d.xml_sha256).toBe(initial.xml_sha256);expect(d.qr_sha256).toBe(initial.qr_sha256);expect(d.snapshot).toEqual(initial.snapshot);
    expect((await post('/api/fiscal',send,cashier)).status()).toBe(200);expect((await detail(id)).events).toHaveLength(3);
  });
  test('timeout previo y fallo técnico: no encontrado y reintento con el mismo número; proceso separado',async()=>{
    const {id}=await create('timeout-before');const old=await detail(id);await cmd(id,'submit');expect((await detail(id)).status).toBe('unknown');await cmd(id,'consult');expect((await detail(id)).status).toBe('not-found');await cmd(id,'submit');const d=await detail(id);expect(d.status).toBe('accepted');expect(d.reference).toBe(old.reference);expect(d.events).toHaveLength(4);
    const unavailable=await create('unavailable');await cmd(unavailable.id,'submit');expect((await detail(unavailable.id)).status).toBe('technical-error');await cmd(unavailable.id,'submit');expect((await detail(unavailable.id)).status).toBe('accepted');
    const processing=await create('processing');await cmd(processing.id,'submit');expect((await detail(processing.id)).status).toBe('processing');await cmd(processing.id,'consult');expect((await detail(processing.id)).status).toBe('accepted');
  });
  test('rechazo y descarte interno: historial intacto, nuevo número y boleta sin falsa baja/CDR',async()=>{
    const {id,s}=await create('reject');await cmd(id,'submit');const rejected=await detail(id);expect(rejected.status).toBe('rejected');
    expect((await post('/api/fiscal',await input(id,'discard',{reason:'Descarte por perfil caja no permitido'}),cashier)).status()).toBe(403);
    await cmd(id,'discard',{reason:'Corregir datos de prueba por una nueva preparación'});expect((await detail(id)).status).toBe('discarded');
    const revised=await post('/api/fiscal',await prepare(s.chargeId,'accept',{documentType:'03',receiver:{name:'Receptor Boleta Ficticio',documentType:'1',documentNumber:'00000000'}}));expect(revised.status()).toBe(200);const newDoc=await detail((await revised.json()).id);expect(newDoc.reference).toMatch(/^SIM-B001-/);expect(newDoc.reference).not.toBe(rejected.reference);expect((await detail(id)).snapshot).toEqual(rejected.snapshot);
    const response=await(await options.admin().get('/api/fiscal/'+id+'/response')).json();expect(response.response.mode).toBe('simulation');expect(response.legend).toContain('SIN VALIDEZ TRIBUTARIA');expect(JSON.stringify(response)).not.toMatch(/https?:|SignatureValue/);
  });
  test('cargo revertido y orígenes impropios: no prepara ni simula desde fondos de terceros o reversos',async()=>{
    const {id,s}=await create('accept');const f=await finance();expect((await post('/api/finance',{type:'reverse',requestId:randomUUID(),revision:f.revision,entryId:s.chargeId,note:'Corrección financiera sintética posterior a preparación'})).status()).toBe(200);
    expect((await detail(id)).source_reversed).toBe(true);expect((await post('/api/fiscal',await input(id,'submit'))).status()).toBe(409);
    await cmd(id,'discard',{reason:'Cargo de origen revertido antes de simular envío'});expect((await post('/api/fiscal',await prepare(s.chargeId))).status()).toBe(404);
    const third=(await finance()).openItems.find((e:{kind:string})=>e.kind==='third-in');expect(third).toBeTruthy();expect((await post('/api/fiscal',await prepare(third.id))).status()).toBe(404);
  });
  test('UI fiscal: preparación con supuestos explícitos, timeout/consulta, XML bien formado y QR decodificado',async({browser})=>{
    const s=await source();const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
    await page.goto(origin+'/fiscal');await page.getByRole('button',{name:'Preparar documento de prueba',exact:true}).click();const modal=page.getByRole('dialog');
    await modal.getByRole('combobox',{name:'Cargo propio de presupuesto',exact:true}).selectOption(s.chargeId);await modal.getByLabel('Nombre del receptor de prueba').fill('Receptor UI Ficticio & Cía.');await modal.getByLabel('Número del receptor de prueba').fill('20000000001');
    await modal.getByRole('combobox',{name:'Tratamiento de prueba 1',exact:true}).selectOption('gravado18');await modal.getByRole('combobox',{name:'Tratamiento de prueba 2',exact:true}).selectOption('inafecto');await modal.getByRole('combobox',{name:'Finalidad del concepto 2',exact:true}).selectOption('identity-query');await modal.getByRole('combobox',{name:'Escenario del simulador',exact:true}).selectOption('timeout-after');await modal.getByRole('checkbox').check();
    await modal.getByRole('button',{name:'Guardar documento de prueba'}).click();await expect(modal).not.toBeVisible();const doc=(await data()).documents.find(d=>d.source_charge_id===s.chargeId)!;
    await page.getByRole('button',{name:'Abrir '+doc.reference}).click();await expect(modal.getByText(doc.reference,{exact:true})).toBeVisible();
    await modal.getByRole('button',{name:'Simular envío local'}).click();await expect(modal.getByRole('button',{name:'Consultar resultado simulado'})).toBeEnabled();await expect(modal.getByRole('button',{name:'Simular envío local'})).toBeDisabled();await modal.getByRole('button',{name:'Consultar resultado simulado'}).click();await expect(modal.getByText('Aceptado por simulador',{exact:true}).first()).toBeVisible();
    const xml=await(await context.request.get('/api/fiscal/'+doc.id+'/xml')).text();const parsed=await page.evaluate(xml=>{const d=new DOMParser().parseFromString(xml,'application/xml');return {errors:d.querySelectorAll('parsererror').length,root:d.documentElement.localName,ns:d.documentElement.namespaceURI,description:d.getElementsByTagNameNS('urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2','Description')[0]?.textContent};},xml);expect(parsed).toEqual({errors:0,root:'Invoice',ns:'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',description:'Honorarios & <fiscal QA>'});
    const img=modal.getByRole('img',{name:'QR de simulación sin validez tributaria'});await expect(img).toBeVisible();const pixels=await img.evaluate(async(el:HTMLImageElement)=>{await el.decode();const c=document.createElement('canvas');c.width=el.naturalWidth;c.height=el.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(el,0,0);return {width:c.width,height:c.height,data:Array.from(ctx.getImageData(0,0,c.width,c.height).data)};});expect(jsQR(new Uint8ClampedArray(pixels.data),pixels.width,pixels.height)?.data).toBe((await detail(doc.id)).qr_payload);
    expect(external).toEqual([]);await context.close();
  });
  test('ELDIAL fiscal: reflujo, contraste, teclado, móvil y oscuro con documentos de prueba',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    for(const width of [1440,683,390]){await page.setViewportSize({width,height:1000});await page.goto(origin+'/fiscal');await expect(page.getByRole('heading',{name:'Documentos de prueba',exact:true})).toBeVisible();await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4-2'}-fiscal-${width}.png`,fullPage:true});}
    await page.getByRole('button',{name:'Activar tema oscuro'}).click();const opener=page.getByRole('button',{name:'Abrir '+(await detail(firstId)).reference});await opener.click();const modal=page.getByRole('dialog');await expect(modal.getByRole('img')).toBeVisible();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4-2'}-fiscal-oscuro.png`,fullPage:true});await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(opener).toBeFocused();expect(errors).toEqual([]);
    await context.close();await cashier.dispose();await receiver.dispose();
  });
}
