import {test,expect,type APIRequestContext} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {randomUUID} from 'node:crypto';
import type {TariffCatalog,TariffCommand,TariffVersion} from '../../src/lib/tariff-domain';
import type {CaseDetail} from '../../src/lib/case-domain';
const origin='http://127.0.0.1:3101';const password='Solo-pruebas-Local-2026!';
export function registerTariffScenarios(options:{admin:()=>APIRequestContext;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(context:APIRequestContext)=>Promise<string[]>;evidencePrefix?:string}){
  let first:TariffVersion,third:TariffVersion,caseId:string,personId:string,accepted:CaseDetail['quotes'][number];let receiver:APIRequestContext;
  const post=(path:string,data:unknown,context=options.admin())=>context.post(path,{headers:{Origin:origin},data});
  const catalog=async()=>{const response=await options.admin().get('/api/tariffs');expect(response.status()).toBe(200);return await response.json() as TariffCatalog;};
  const detail=async()=>await(await options.admin().get('/api/cases/'+caseId)).json() as CaseDetail;
  const publication=async(values:Partial<TariffCommand>={}):Promise<TariffCommand>=>({requestId:randomUUID(),revision:(await catalog()).revision,tariffId:null,baseVersion:0,code:'HON-QA',description:'Honorarios del tarifario QA',category:'Honorarios',unitAmount:'0.10',act:'Compraventa',active:true,reason:'Publicación comercial sintética QA',...values});
  const version=async(item:TariffVersion,values:Partial<TariffCommand>={})=>publication({tariffId:item.tariff_id,baseVersion:item.version,code:item.code,description:item.description,category:item.category,unitAmount:item.unit_amount,act:item.act,active:item.active,...values});
  const quote=async(lines:unknown[])=>{const c=await detail();return post('/api/cases/'+caseId,{type:'quote',revision:c.revision,baseVersion:c.quote_version,validUntil:'2099-12-31',lines});};
  const line=(v:TariffVersion,quantity=1)=>({description:v.description,category:v.category,unitAmount:v.unit_amount,quantity,tariffVersionId:v.id});
  test('tarifario: autenticación, TOTP, origen, permiso servidor y catálogo vacío sin semillas',async({playwright,request})=>{
    test.setTimeout(100000);
    expect((await request.get('/api/tariffs')).status()).toBe(401);
    expect((await catalog()).items).toEqual([]);
    expect((await options.admin().post('/api/tariffs',{data:{},headers:{Origin:'https://other.example'}})).status()).toBe(403);
    expect((await post('/api/platform/users',{name:'Recepción Tarifas QA',email:'tarifas-qa@example.test',password,role:'recepcion'})).status()).toBe(200);
    receiver=await playwright.request.newContext({baseURL:origin});
    let login=await post('/api/auth/sign-in/email',{email:'tarifas-qa@example.test',password},receiver);
    if(login.status()===429){await new Promise(r=>setTimeout(r,61000));login=await post('/api/auth/sign-in/email',{email:'tarifas-qa@example.test',password},receiver);}
    expect(login.status()).toBe(200);expect((await receiver.get('/api/tariffs')).status()).toBe(403);await options.enroll(receiver);
    expect((await receiver.get('/api/tariffs')).status()).toBe(200);
    expect((await post('/api/tariffs',await publication(),receiver)).status()).toBe(403);
    expect((await post('/api/tariffs',await publication({unitAmount:'0.00'}))).status()).toBe(400);
    expect((await catalog()).items).toHaveLength(0);
  });
  test('tarifario: reintentos concurrentes, huella y conflicto de revisión sin doble publicación',async()=>{
    const input=await publication();const repeated=await Promise.all([post('/api/tariffs',input),post('/api/tariffs',input)]);expect(repeated.map(r=>r.status())).toEqual([200,200]);
    const results=await Promise.all(repeated.map(r=>r.json()));expect(results[0]).toEqual(results[1]);first=(await catalog()).items[0];expect(first.unit_amount).toBe('0.10');
    expect((await post('/api/tariffs',{...input,unitAmount:'0.11'})).status()).toBe(409);
    const state=await catalog();const a=await publication({revision:state.revision,code:'THIRD-QA',description:'Fondo previsto para terceros QA',category:'Terceros',unitAmount:'20.01',act:null});
    const race=await Promise.all([post('/api/tariffs',a),post('/api/tariffs',{...a,requestId:randomUUID(),code:'RACE-QA'})]);expect(race.map(r=>r.status()).sort()).toEqual([200,409]);
    // Resolve whichever valid request won without relying on scheduler order.
    if(!(await catalog()).items.some(v=>v.code==='THIRD-QA'))expect((await post('/api/tariffs',await publication({...a,requestId:randomUUID(),revision:(await catalog()).revision}))).status()).toBe(200);
    third=(await catalog()).items.find(v=>v.code==='THIRD-QA')!;
    expect((await post('/api/tariffs',await publication({code:first.code}))).status()).toBe(409);
    expect((await post('/api/tariffs',input)).status()).toBe(200);
    expect((await post('/api/tariffs',input,receiver)).status()).toBe(403);
  });
  test('presupuesto: instantánea de tarifa verificada en servidor y aceptación sin movimiento financiero',async()=>{
    const p=await post('/api/platform/people',{name:'Cliente Tarifario Ficticio',documentType:'DEMO',documentNumber:'TAR-QA'});expect(p.status()).toBe(200);personId=(await p.json()).id;
    const c=await post('/api/cases',{requestId:randomUUID(),personId,act:'Compraventa',subject:'Expediente de tarifas ficticio'});expect(c.status()).toBe(200);caseId=(await c.json()).id;
    expect((await quote([{...line(first),unitAmount:'0.01'}])).status()).toBe(400);
    expect((await quote([{...line(first),category:'Terceros'}])).status()).toBe(400);
    expect((await quote([{...line(first),description:'Texto manipulado'}])).status()).toBe(400);
    const before=await(await options.admin().get('/api/finance')).json();
    expect((await quote([line(first,3),line(third)])).status()).toBe(200);
    let d=await detail();expect(d.quotes[0].total).toBe('20.31');expect(d.quotes[0].lines[0].tariffSource).toEqual({code:'HON-QA',version:1});
    expect((await post('/api/cases/'+caseId,{type:'accept-quote',revision:d.revision,quoteId:d.quotes[0].id,participantId:d.participants[0].id,reference:'Aceptación ficticia de la versión tarifada QA.'})).status()).toBe(200);
    d=await detail();accepted=d.quotes[0];const after=await(await options.admin().get('/api/finance')).json();for(const key of ['receivable','advance','third','cash','total'])expect(after[key]).toBe(before[key]);
  });
  test('tarifa nueva o inactiva no reescribe presupuesto, aceptación ni orden; rechaza versión vieja y acto ajeno',async()=>{
    expect((await post('/api/tariffs',await version(first,{unitAmount:'0.20'}))).status()).toBe(200);
    const v2=(await catalog()).items.find(v=>v.tariff_id===first.tariff_id)!;
    expect((await detail()).quotes[0]).toEqual(accepted);
    expect((await quote([line(first)])).status()).toBe(409);
    expect((await post('/api/tariffs',await version(v2,{active:false}))).status()).toBe(200);
    const inactive=(await catalog()).items.find(v=>v.tariff_id===first.tariff_id)!;
    expect((await quote([line(inactive)])).status()).toBe(409);
    const notApplicable=await publication({code:'CARTA-QA',act:'Carta notarial'});expect((await post('/api/tariffs',notApplicable)).status()).toBe(200);
    const carta=(await catalog()).items.find(v=>v.code==='CARTA-QA')!;expect((await quote([line(carta)])).status()).toBe(409);
    expect((await detail()).quotes[0]).toEqual(accepted);expect((await detail()).order?.accepted_quote_id).toBe(accepted.id);
    expect((await catalog()).history.filter(v=>v.tariff_id===first.tariff_id).map(v=>v.version)).toEqual([3,2,1]);
    const finance=await(await options.admin().get('/api/finance')).json();
    const charge=await post('/api/finance',{type:'quote-charge',requestId:randomUUID(),revision:finance.revision,quoteId:accepted.id,personId,caseId,note:'Traslado del presupuesto tarifado aceptado QA'});expect(charge.status()).toBe(200);expect((await charge.json()).amount).toBe('0.30');
    const after=await(await options.admin().get('/api/finance')).json();expect(after.third).toBe(finance.third);expect(after.advance).toBe(finance.advance);expect(after.cash).toBe(finance.cash);
  });
  test('UI tarifario: versión, conflicto conservando formulario y publicación por Administración',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/tarifario');await page.getByRole('button',{name:'Nueva tarifa',exact:true}).click();const modal=page.getByRole('dialog');
    await modal.getByLabel('Código',{exact:true}).fill('UI-QA');await modal.getByLabel('Descripción',{exact:true}).fill('Concepto desde interfaz QA');await modal.getByLabel('Importe unitario en soles').fill('15.25');await modal.getByLabel('Motivo de la publicación').fill('Alta documentada desde interfaz de pruebas');
    const extra=await publication({code:'CONFLICT-QA'});expect((await post('/api/tariffs',extra)).status()).toBe(200);
    await modal.getByRole('button',{name:'Publicar versión de tarifa'}).click();await expect(modal.getByRole('alert')).toContainText('tarifario cambió');await expect(modal.getByLabel('Descripción',{exact:true})).toHaveValue('Concepto desde interfaz QA');
    await modal.getByRole('button',{name:'Actualizar contexto sin cerrar'}).click();await expect(modal.getByText('Revisión del catálogo:',{exact:false})).toContainText(String((await catalog()).revision));
    await modal.getByRole('button',{name:'Publicar versión de tarifa'}).click();await expect(modal).not.toBeVisible();await expect(page.getByText('UI-QA · v1',{exact:true})).toBeVisible();
    await page.reload();await expect(page.getByText('UI-QA · v1',{exact:true})).toBeVisible();expect(errors).toEqual([]);await context.close();
  });
  test('UI presupuesto: elegir tarifa, importe exacto, procedencia y conversión manual explícita',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();await page.goto(origin+'/expedientes/'+caseId+'/presupuesto');
    await page.getByRole('button',{name:'Crear nueva versión de presupuesto'}).click();const modal=page.getByRole('dialog');const v=(await catalog()).items.find(v=>v.code==='UI-QA')!;
    await modal.getByRole('combobox',{name:'Tarifa del concepto 1',exact:true}).selectOption(v.id);await expect(modal.getByLabel('Importe unitario en soles').first()).toHaveValue('15.25');
    await modal.getByLabel('Cantidad',{exact:true}).first().fill('2');await modal.getByRole('button',{name:'Quitar concepto 2'}).click();
    await modal.getByRole('button',{name:'Guardar versión de presupuesto'}).click();await expect(modal).not.toBeVisible();await expect(page.getByText('UI-QA · v1',{exact:true})).toBeVisible();expect((await detail()).quotes[0].total).toBe('30.50');
    await page.getByRole('button',{name:'Crear nueva versión de presupuesto'}).click();await modal.getByLabel('Importe unitario en soles').fill('15.24');await expect(modal.getByRole('combobox',{name:'Tarifa del concepto 1',exact:true})).toHaveValue('');
    await modal.getByRole('button',{name:'Guardar versión de presupuesto'}).click();await expect(modal).not.toBeVisible();const d=await detail();expect(d.quotes[0].total).toBe('30.48');expect(d.quotes[0].lines[0].tariffVersionId).toBeUndefined();expect(d.quotes.find(v=>v.id===accepted.id)).toEqual(accepted);
    await context.close();
  });
  test('tarifario ELDIAL: teclado, escritorio, móvil, oscuro y errores de página',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    for(const width of [1440,683,390]){
      await page.setViewportSize({width,height:1000});await page.goto(origin+'/tarifario');await expect(page.getByText('UI-QA · v1',{exact:true})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
      await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4-1'}-tarifario-${width}.png`,fullPage:true});
    }
    await page.getByRole('button',{name:'Activar tema oscuro'}).click();await page.getByRole('button',{name:'Versionar UI-QA'}).click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4-1'}-tarifario-oscuro.png`,fullPage:true});
    await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(page.getByRole('button',{name:'Versionar UI-QA'})).toBeFocused();expect(errors).toEqual([]);
    await context.close();await receiver.dispose();
  });
}
