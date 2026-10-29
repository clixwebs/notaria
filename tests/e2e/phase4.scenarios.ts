import {test,expect,type APIRequestContext} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import type {FinanceData} from '../../src/lib/finance-domain';
const origin='http://127.0.0.1:3101',password='Solo-pruebas-Local-2026!';
export function registerFinanceScenarios(options:{admin:()=>APIRequestContext;storage:()=>Awaited<ReturnType<APIRequestContext['storageState']>>;enroll:(context:APIRequestContext)=>Promise<string[]>;evidencePrefix?:string}){
  let personId:string,caseId:string,otherCase:string,otherPerson:string,otherClientCase:string,evidenceId:string,supplierId:string,quoteId:string,chargeId:string,advanceId:string,thirdId:string,expenseId:string,bankPaymentId:string,cashCollectionId:string;
  let cashier:APIRequestContext,receiver:APIRequestContext;
  const post=(path:string,data:unknown,ctx=options.admin())=>ctx.post(path,{data,headers:{Origin:origin}});
  const data=async()=>{const r=await options.admin().get('/api/finance?pageSize=50');expect(r.status()).toBe(200);return await r.json() as FinanceData;};
  const raw=async(value:Record<string,unknown>,ctx=options.admin())=>post('/api/finance',{requestId:randomUUID(),revision:(await data()).revision,...value},ctx);
  const cmd=async(value:Record<string,unknown>,ctx=options.admin())=>{const r=await raw(value,ctx);expect(r.status(),await r.text()).toBe(200);return r.json();};
  const account=(extra:Record<string,unknown>)=>({personId,caseId,note:'Control financiero sintético QA',...extra});
  const flow=(extra:Record<string,unknown>)=>account({method:'efectivo',reference:'REF-'+randomUUID(),...extra});
  test('finanzas: acceso por función, MFA y clientes por identidad, sin contenido jurídico para caja',async({playwright,request})=>{
    test.setTimeout(100000);
    expect((await request.get('/api/finance')).status()).toBe(401);
    expect((await request.post('/api/finance',{data:{},headers:{Origin:'https://other.example'}})).status()).toBe(403);
    for(const [role,email] of [['caja','fin-caja@example.test'],['recepcion','fin-recepcion@example.test']]){
      expect((await post('/api/platform/users',{name:'Finanzas QA '+role,email,password,role})).status()).toBe(200);
      const context=await playwright.request.newContext({baseURL:origin});let login=await post('/api/auth/sign-in/email',{email,password},context);
      // Respect the real per-IP authentication rate limit; never weaken it for QA.
      if(login.status()===429){await new Promise(resolve=>setTimeout(resolve,61000));login=await post('/api/auth/sign-in/email',{email,password},context);}
      expect(login.status()).toBe(200);
      expect((await context.get('/api/finance')).status()).toBe(403);await options.enroll(context);
      if(role==='caja')cashier=context;else receiver=context;
    }
    expect((await cashier.get('/api/finance')).status()).toBe(200);expect((await receiver.get('/api/finance')).status()).toBe(403);
    expect((await cashier.get('/api/cases')).status()).toBe(403);expect((await cashier.get('/api/platform/people')).status()).toBe(403);
    const p=await post('/api/platform/people',{name:'Cliente Financiero Ficticio',documentType:'DEMO',documentNumber:'FIN-001'});personId=(await p.json()).id;
    otherPerson=(await(await post('/api/platform/people',{name:'Cliente Financiero Ficticio',documentType:'DEMO',documentNumber:'FIN-002'})).json()).id;
    for(let i=0;i<3;i++){const r=await post('/api/cases',{requestId:randomUUID(),act:'Carta notarial',subject:'Control financiero por expediente '+i,personId:i===2?otherPerson:personId});expect(r.status()).toBe(200);const id=(await r.json()).id;if(i===0)caseId=id;else if(i===1)otherCase=id;else otherClientCase=id;}
    const file=await options.admin().post('/api/platform/documents',{headers:{Origin:origin},multipart:{personId,title:'Sustento financiero ficticio',file:{name:'sustento-financiero.txt',mimeType:'text/plain',buffer:Buffer.from('Documento sintético para gastos QA')}}});expect(file.status()).toBe(200);evidenceId=(await file.json()).id;
    expect((await post('/api/platform/documents/'+evidenceId+'/review',{status:'liberado',note:'Sustento financiero ficticio revisado manualmente.'})).status()).toBe(200);
    const d=await data();expect(d.clients.filter(p=>p.name==='Cliente Financiero Ficticio')).toHaveLength(2);expect(d.cases.some(c=>c.id===caseId)).toBe(true);expect(JSON.stringify(d)).not.toContain('Control financiero por expediente');
  });
  test('presupuesto: aceptación no cobra; cargo explícito exacto una sola vez y excluye terceros',async()=>{
    let c=await(await options.admin().get('/api/cases/'+caseId)).json();
    expect((await post('/api/cases/'+caseId,{type:'quote',revision:c.revision,baseVersion:0,validUntil:'2099-12-31',lines:[{description:'Servicio propio',category:'Honorarios',quantity:1,unitAmount:'100.00'},{description:'Fondo previsto registral',category:'Terceros',quantity:1,unitAmount:'30.00'}]})).status()).toBe(200);
    c=await(await options.admin().get('/api/cases/'+caseId)).json();quoteId=c.quotes[0].id;
    expect((await post('/api/cases/'+caseId,{type:'accept-quote',revision:c.revision,quoteId,participantId:c.participants[0].id,reference:'Aceptación ficticia documentada para prueba financiera.'})).status()).toBe(200);
    expect((await data()).total).toBe(0);
    const before=await data();const input={...account({type:'quote-charge',quoteId}),requestId:randomUUID(),revision:before.revision};
    const pair=await Promise.all([post('/api/finance',input),post('/api/finance',input)]);expect(pair.map(r=>r.status())).toEqual([200,200]);const results=await Promise.all(pair.map(r=>r.json()));expect(results[0].id).toBe(results[1].id);chargeId=results[0].id;expect(results[0].amount).toBe('100.00');
    expect((await post('/api/finance',{...input,note:'Otra carga con la misma clave'})).status()).toBe(409);
    expect((await raw(account({type:'quote-charge',quoteId}))).status()).toBe(409);
    const d=await data();expect(d.receivable).toBe('100.00');expect(d.third).toBe('0.00');expect(d.cash).toBe('0.00');
    expect((await raw(flow({type:'collect',targetId:chargeId,amount:'1.00'}))).status()).toBe(409);
  });
  test('caja: apertura única, cobro parcial, anticipo, aplicación y devolución sin compensación implícita',async()=>{
    await cmd({type:'open',opening:'100.00',note:'Fondo inicial sintético QA'},cashier);
    expect((await raw({type:'open',opening:'100.00',note:'Apertura duplicada'})).status()).toBe(409);
    cashCollectionId=(await cmd(flow({type:'collect',targetId:chargeId,amount:'20.00'}),cashier)).id;
    const bankref='BANK-ADVANCE-001';advanceId=(await cmd(flow({type:'advance',amount:'50.00',method:'transferencia',reference:bankref}),cashier)).id;
    expect((await raw(flow({type:'advance',amount:'50.00',method:'transferencia',reference:bankref}))).status()).toBe(409);
    let d=await data();expect(d.receivable).toBe('80.00');expect(d.advance).toBe('50.00');expect(d.cash).toBe('120.00');
    await cmd(account({type:'apply',sourceId:advanceId,targetId:chargeId,amount:'30.00'}),cashier);
    await cmd(flow({type:'refund',sourceId:advanceId,amount:'5.00',method:'transferencia'}),cashier);
    d=await data();expect(d.receivable).toBe('50.00');expect(d.advance).toBe('15.00');expect(d.cash).toBe('120.00');
    for(const value of [account({type:'apply',sourceId:advanceId,targetId:chargeId,amount:'15.01'}),flow({type:'collect',targetId:chargeId,amount:'50.01'}),account({type:'apply',sourceId:advanceId,targetId:chargeId,amount:'1.00',caseId:otherCase})])expect((await raw(value)).status()).toBe(400);
    expect((await raw(account({type:'charge',amount:'1.001',expenseId:null}))).status()).toBe(400);
    expect((await raw(flow({type:'advance',amount:'1.00',caseId:otherClientCase}))).status()).toBe(404);
  });
  test('proveedores, gasto autorizado con sustento y fondos de terceros sin invasión ni duplicación',async()=>{
    supplierId=(await cmd({type:'supplier',name:'Proveedor Ficticio QA',document:'PROV-001'},cashier)).id;
    expect((await raw({type:'supplier',name:'Duplicado ficticio',document:'prov-001'})).status()).toBe(409);
    thirdId=(await cmd(flow({type:'third-in',amount:'40.00'}),cashier)).id;
    const expense=account({type:'expense',amount:'30.00',supplierId,bucket:'third',dueDate:'2026-10-29',evidenceId});
    expect((await raw(expense,cashier)).status()).toBe(403);
    expect((await raw({...expense,evidenceId:randomUUID()})).status()).toBe(400);
    const thirdExpense=(await cmd(expense)).id;
    expect((await raw(flow({type:'pay-expense',targetId:thirdExpense,amount:'1.00'}))).status()).toBe(400);
    await cmd(flow({type:'third-out',sourceId:thirdId,targetId:thirdExpense,amount:'15.00'}),cashier);
    await cmd(flow({type:'third-out',sourceId:thirdId,targetId:thirdExpense,amount:'15.00'}),cashier);
    expect((await raw(flow({type:'third-out',sourceId:thirdId,targetId:thirdExpense,amount:'0.01'}))).status()).toBe(400);
    expect((await raw(flow({type:'third-refund',sourceId:thirdId,amount:'10.01'}))).status()).toBe(400);
    expect((await raw(flow({type:'third-refund',sourceId:thirdId,amount:'1.00',method:'transferencia'}))).status()).toBe(400);
    await cmd(flow({type:'third-refund',sourceId:thirdId,amount:'10.00'}),cashier);
    let d=await data();expect(d.third).toBe('0.00');expect(d.cash).toBe('120.00');expect(d.receivable).toBe('50.00');expect(d.expense_pending).toBe('0.00');
    expenseId=(await cmd(account({type:'expense',amount:'20.00',supplierId,bucket:'own',dueDate:'2026-10-29',evidenceId}))).id;
    bankPaymentId=(await cmd(flow({type:'pay-expense',targetId:expenseId,amount:'5.00',method:'transferencia'}),cashier)).id;
    await cmd(flow({type:'pay-expense',targetId:expenseId,amount:'15.00'}),cashier);
    d=await data();expect(d.expense_pending).toBe('0.00');expect(d.receivable).toBe('50.00');expect(d.cash).toBe('105.00');
    await cmd(account({type:'charge',amount:'20.00',expenseId}));
    expect((await raw(account({type:'charge',amount:'20.00',expenseId}))).status()).toBe(409);
    expect((await data()).receivable).toBe('70.00');
  });
  test('concurrencia: dos aplicaciones sobre la misma revisión conservan un único efecto',async()=>{
    const d=await data();const pair=await Promise.all([0,1].map(()=>post('/api/finance',{...account({type:'apply',sourceId:advanceId,targetId:chargeId,amount:'10.00'}),requestId:randomUUID(),revision:d.revision})));expect(pair.map(r=>r.status()).sort()).toEqual([200,409]);
    const after=await data();expect(after.advance).toBe('5.00');expect(after.receivable).toBe('60.00');
  });
  test('reversos: prohíbe borrar efectos dependientes y conserva original, saldo e identidad',async()=>{
    expect((await raw({type:'reverse',entryId:chargeId,note:'Corrección que tiene dependencias'})).status()).toBe(409);
    const charge=(await cmd(account({type:'charge',amount:'7.00',expenseId:null}))).id;
    const collected=(await cmd(flow({type:'collect',targetId:charge,amount:'7.00',method:'transferencia'}))).id;
    expect((await raw({type:'reverse',entryId:collected,note:'Corrección no autorizada'},cashier)).status()).toBe(403);
    expect((await raw({type:'reverse',entryId:charge,note:'Corrección con aplicación activa'})).status()).toBe(409);
    await cmd({type:'reverse',entryId:collected,note:'Reverso del cobro erróneo documentado'});
    await cmd({type:'reverse',entryId:charge,note:'Reverso del cargo erróneo documentado'});
    expect((await raw({type:'reverse',entryId:collected,note:'Segundo intento de corrección'})).status()).toBe(409);
    const d=await data();expect(d.receivable).toBe('60.00');expect(d.entries.find(e=>e.id===collected)?.reversed).toBe(true);expect(d.entries.some(e=>e.reverses_id===collected)).toBe(true);
  });
  test('conciliación manual: una línea única, retiro trazable y reverso sujeto a conciliación',async()=>{
    const first=await cmd({type:'reconcile',entryId:bankPaymentId,statement:'BANCO-CUENTA-202610-LINEA001',note:'Extracto ficticio cotejado'});
    expect((await raw({type:'reconcile',entryId:advanceId,statement:'BANCO-CUENTA-202610-LINEA001',note:'Línea repetida del extracto'})).status()).toBe(409);
    expect((await raw({type:'reverse',entryId:bankPaymentId,note:'Intento con conciliación vigente'})).status()).toBe(409);
    await cmd({type:'unreconcile',matchId:first.id,note:'Retiro documentado de cotejo incorrecto'});
    expect((await raw({type:'unreconcile',matchId:first.id,note:'Intento repetido de retiro'})).status()).toBe(404);
    await cmd({type:'reconcile',entryId:bankPaymentId,statement:'BANCO-CUENTA-202610-LINEA002',note:'Extracto ficticio rectificado'});
    expect((await raw({type:'reconcile',entryId:cashCollectionId,statement:'BANCO-LINEA-CASH',note:'El efectivo no es bancario'})).status()).toBe(400);
  });
  test('cuenta consolidada: separa identidades iguales y agrega varios expedientes sin netear custodia',async()=>{
    await cmd(account({type:'charge',caseId:otherCase,amount:'0.30',expenseId:null}));
    const charge=(await data()).openItems.find(e=>e.kind==='charge'&&e.case_id===otherCase)!;
    await cmd(flow({type:'collect',caseId:otherCase,targetId:charge.id,amount:'0.10',method:'transferencia'}));
    await cmd(flow({type:'advance',caseId:otherCase,amount:'0.20',method:'transferencia'}));
    const statement=await(await options.admin().get('/api/finance?personId='+personId+'&pageSize=2')).json() as FinanceData;
    expect(statement.statement?.receivable).toBe('60.20');expect(statement.statement?.advance).toBe('5.20');expect(statement.statement?.accounts).toHaveLength(2);expect(statement.entries).toHaveLength(2);expect(statement.total).toBeGreaterThan(2);
    const other=await(await options.admin().get('/api/finance?personId='+otherPerson)).json() as FinanceData;expect(other.statement?.receivable).toBe('0.00');expect(other.entries).toHaveLength(0);
    expect((await options.admin().get('/api/finance?personId='+randomUUID())).status()).toBe(404);
  });
  test('cierre reproducible, diferencia declarada, bloqueo de movimientos y continuidad de apertura',async()=>{
    const close=await cmd({type:'close',counted:'104.00',note:'Arqueo ficticio con diferencia de un sol'},cashier);expect(close.expected).toBe('105.00');expect(close.difference).toBe('-1.00');
    expect((await raw(flow({type:'advance',amount:'1.00'}))).status()).toBe(409);
    expect((await raw({type:'open',opening:'105.00',note:'Apertura que no coincide con conteo'})).status()).toBe(400);
    await cmd({type:'open',opening:'104.00',note:'Apertura conforme al arqueo anterior'},cashier);
    await cmd({type:'reverse',entryId:cashCollectionId,note:'Corrección posterior conservando el cierre previo'});
    const d=await data();expect(d.cash).toBe('84.00');expect(d.sessions.find(s=>s.closed_at)?.expected).toBe('105.00');expect(d.sessions.find(s=>s.closed_at)?.difference).toBe('-1.00');
    // Cash belonging to third parties cannot finance an own expense/refund.
    await cmd(flow({type:'third-in',amount:'100.00'}));
    const own=(await cmd(account({type:'expense',amount:'85.00',supplierId,bucket:'own',dueDate:'2026-10-29',evidenceId}))).id;
    expect((await raw(flow({type:'pay-expense',targetId:own,amount:'85.00'}))).status()).toBe(400);
    const shortClose=await cmd({type:'close',counted:'99.00',note:'Arqueo sintético con custodia no cubierta'});expect(shortClose.expected).toBe('184.00');
    expect((await raw({type:'open',opening:'99.00',note:'Conteo insuficiente para custodiar fondos'})).status()).toBe(400);
    expect((await raw({type:'open',opening:'100.00',replenishment:'1.00',note:'Caja no puede declarar reposición'},cashier)).status()).toBe(403);
    await cmd({type:'open',opening:'100.00',replenishment:'1.00',note:'Administración documenta reposición física de un sol'});
    expect((await data()).sessions[0].replenishment).toBe('1.00');
  });
  test('UI financiera: cobro, constancia, cuenta por cliente y conflicto sin perder el formulario',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/caja');
    await expect(page.getByRole('heading',{name:'Caja y cobros',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Cargo manual',exact:true}).click();const dialog=page.getByRole('dialog');
    await dialog.getByRole('combobox',{name:'Cliente',exact:true}).selectOption(personId);await dialog.getByRole('combobox',{name:'Expediente del cliente',exact:true}).selectOption(otherCase);await dialog.getByLabel('Importe en soles').fill('1.23');await dialog.getByLabel('Detalle o motivo').fill('Cargo conservado ante conflicto de caja');
    await cmd(account({type:'charge',amount:'0.01',expenseId:null}));
    await dialog.getByRole('button',{name:'Guardar registro',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Caja cambió');await expect(dialog.getByLabel('Importe en soles')).toHaveValue('1.23');
    const refreshed=page.waitForResponse(r=>r.url().includes('/api/finance?')&&r.request().method()==='GET');await dialog.getByRole('button',{name:'Actualizar contexto sin cerrar'}).click();await refreshed;
    await dialog.getByRole('button',{name:'Guardar registro',exact:true}).click();await expect(dialog).toHaveCount(0);
    const savedRow=page.getByRole('row').filter({hasText:'Cargo conservado ante conflicto de caja'});await expect(savedRow).toHaveCount(1);await savedRow.getByRole('button',{name:'Constancia',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Cargo conservado ante conflicto de caja');await page.keyboard.press('Escape');
    const charge=(await data()).openItems.find(e=>e.note==='Cargo conservado ante conflicto de caja')!;
    await page.getByRole('button',{name:'Registrar cobro',exact:true}).click();
    await dialog.getByRole('combobox',{name:'Cliente',exact:true}).selectOption(personId);await dialog.getByRole('combobox',{name:'Expediente del cliente',exact:true}).selectOption(otherCase);await dialog.getByRole('combobox',{name:'Cargo de destino',exact:true}).selectOption(charge.id);await dialog.getByLabel('Importe en soles').fill('1.23');await dialog.getByRole('combobox',{name:'Medio de pago',exact:true}).selectOption('transferencia');await dialog.getByLabel('Referencia del movimiento').fill('BANK-UI-001');await dialog.getByLabel('Detalle o motivo').fill('Cobro parcial realizado desde la interfaz');await dialog.getByRole('button',{name:'Guardar registro',exact:true}).click();await expect(dialog).toHaveCount(0);await page.reload();await expect(page.getByText('Cobro parcial realizado desde la interfaz',{exact:true})).toBeVisible();
    await page.goto(origin+'/caja/clientes/'+personId);await expect(page.getByRole('heading',{name:'Saldos por expediente'})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'Saldos por expediente'})).toBeVisible();
    for(const route of ['/caja/gastos','/caja/proveedores','/caja/cierres','/caja/conciliacion']){await page.goto(origin+route);await expect(page.locator('h1').first()).toHaveText('Caja y cobros');}
    expect(errors).toEqual([]);await context.close();
  });
  test('ELDIAL negro/azul: caja y formularios accesibles en escritorio, móvil y oscuro',async({browser})=>{
    const context=await browser.newContext({storageState:options.storage()});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,683,390]){
      await page.setViewportSize({width,height:1000});await page.goto(origin+'/caja');await expect(page.getByRole('button',{name:'Cargo manual',exact:true})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
      await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4'}-caja-${width}.png`,fullPage:true});
    }
    await page.getByRole('button',{name:'Registrar cobro',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Activar tema oscuro'}).click();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:`docs/evidence/${options.evidencePrefix||'fase-4'}-caja-oscuro.png`,fullPage:true});
    await page.goto(origin+'/caja/gastos');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
    await context.close();await cashier.dispose();await receiver.dispose();
  });
}
