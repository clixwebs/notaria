import {test,expect,type APIRequestContext} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
const origin='http://127.0.0.1:3101',password='Lookup-QA-Only-2026-Strong!',email='lookup-admin@example.test';
let ctx:APIRequestContext,storage:Awaited<ReturnType<APIRequestContext['storageState']>>,personId:string;
const post=(path:string,data:unknown)=>ctx.post(path,{headers:{Origin:origin},data});
test.describe.serial('Autocompletado DNI en QA aislada con proveedor controlado',()=>{
 test.beforeAll(async({playwright})=>{
  if(process.env.NOTARIA_LOOKUP_QA!=='1')throw new Error('Explicit new QA required.');
  ctx=await playwright.request.newContext({baseURL:origin});
  expect((await post('/api/platform/bootstrap',{name:'Lookup QA',email,password})).status()).toBe(200);
 });
 test.afterAll(async()=>{await ctx?.dispose();});
 test('consulta exige sesión, TOTP, origen y contrato válido',async()=>{
  const body={documentType:'DNI',documentNumber:'00000001'};
  expect((await post('/api/platform/people/lookup',body)).status()).toBe(401);
  expect((await post('/api/auth/sign-in/email',{email,password})).status()).toBe(200);
  expect((await post('/api/platform/people/lookup',body)).status()).toBe(403);
  const enrollment=await(await post('/api/auth/two-factor/enable',{password})).json();const secret=new URL(enrollment.totpURI).searchParams.get('secret')!;
  expect((await post('/api/auth/two-factor/verify-totp',{code:await createOTP(base32.decode(secret)).totp(),trustDevice:false})).status()).toBe(200);
  expect((await ctx.post('/api/platform/people/lookup',{headers:{Origin:'https://other.test'},data:body})).status()).toBe(403);
  expect((await post('/api/platform/people/lookup',{...body,documentNumber:'123'})).status()).toBe(400);
  storage=await ctx.storageState();
 });
 test('al completar DNI trae nombre, guarda ficha y la conserva al recargar',async({browser})=>{
  const context=await browser.newContext({storageState:storage}),page=await context.newPage();
  await page.goto(origin+'/personas');await page.getByRole('button',{name:'Nueva persona'}).click();
  await page.getByLabel('Número de documento').fill('00000001');await expect(page.getByLabel('Nombre completo')).toHaveValue('PERSONA FICTICIA QA');
  expect((await(await ctx.get('/api/platform/people')).json()).length).toBe(0);
  await page.screenshot({path:'docs/evidence/person-lookup-form.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  const box=await page.getByRole('dialog').boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'docs/evidence/person-lookup-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Guardar persona'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await expect(page.getByText('PERSONA FICTICIA QA',{exact:true})).toBeVisible();
  personId=(await(await ctx.get('/api/platform/people')).json())[0].id;await context.close();
 });
 test('respuestas atrasadas y cambios manuales no pisan el formulario actual',async({browser})=>{
  const context=await browser.newContext({storageState:storage}),page=await context.newPage();await page.goto(origin+'/personas');await page.getByRole('button',{name:'Nueva persona'}).click();
  await page.getByLabel('Número de documento').fill('00000002');await expect(page.getByRole('status')).toContainText('Consultando');await page.getByLabel('Número de documento').fill('00000003');
  await expect(page.getByLabel('Nombre completo')).toHaveValue('NUEVA FICTICIA QA');await page.waitForTimeout(1700);await expect(page.getByLabel('Nombre completo')).toHaveValue('NUEVA FICTICIA QA');
  await page.getByLabel('Número de documento').fill('00000002');await expect(page.getByRole('status')).toContainText('Consultando');await page.getByLabel('Nombre completo').fill('Nombre manual conservado');await expect(page.getByRole('status')).toContainText('Se conservó');await expect(page.getByLabel('Nombre completo')).toHaveValue('Nombre manual conservado');await context.close();
 });
 test('sin resultado admite captura manual y DEMO no envía consultas',async({browser})=>{
  const context=await browser.newContext({storageState:storage}),page=await context.newPage();await page.goto(origin+'/personas');await page.getByRole('button',{name:'Nueva persona'}).click();await page.getByLabel('Número de documento').fill('00000004');await expect(page.getByRole('status')).toContainText('no encontró');
  await page.getByLabel('Nombre completo').fill('FICTICIO QA MANUAL');await page.getByRole('button',{name:'Guardar persona'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  let lookups=0;page.on('request',r=>{if(r.url().includes('/people/lookup'))lookups++;});
  await page.getByRole('button',{name:'Nueva persona'}).click();await page.getByLabel('Tipo de documento').selectOption('DEMO');await page.getByLabel('Número de documento').fill('DEMO-LOOKUP-QA');await page.getByLabel('Nombre completo').fill('DEMO QA SIN CONSULTA');await page.waitForTimeout(900);expect(lookups).toBe(0);await page.getByRole('button',{name:'Guardar persona'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await context.close();
 });
 test('editar no consulta silenciosamente y crear expediente conserva la instantánea',async({browser})=>{
  const context=await browser.newContext({storageState:storage}),page=await context.newPage();let lookups=0;page.on('request',r=>{if(r.url().includes('/people/lookup'))lookups++;});await page.goto(origin+'/personas');await page.getByRole('row').filter({hasText:'PERSONA FICTICIA QA'}).getByRole('button',{name:'Editar ficha'}).click();await expect(page.getByLabel('Nombre completo')).toHaveValue('PERSONA FICTICIA QA');await page.waitForTimeout(900);expect(lookups).toBe(0);await context.close();
  const r=await post('/api/cases',{requestId:randomUUID(),personId,act:'Carta notarial',subject:'QA autocompletado sin efecto legal'});expect(r.status()).toBe(200);const detail=await(await ctx.get('/api/cases/'+(await r.json()).id)).json();expect(detail.participants[0].snapshot.name).toBe('PERSONA FICTICIA QA');
 });
 test('Caja no obtiene datos del proveedor y la auditoría no guarda DNI/nombres',async({playwright})=>{
  expect((await post('/api/platform/users',{name:'Caja Lookup QA',email:'lookup-caja@example.test',password,role:'caja'})).status()).toBe(200);
  const caja=await playwright.request.newContext({baseURL:origin});const p=(path:string,data:unknown)=>caja.post(path,{headers:{Origin:origin},data});await p('/api/auth/sign-in/email',{email:'lookup-caja@example.test',password});const en=await(await p('/api/auth/two-factor/enable',{password})).json();const s=new URL(en.totpURI).searchParams.get('secret')!;expect((await p('/api/auth/two-factor/verify-totp',{code:await createOTP(base32.decode(s)).totp(),trustDevice:false})).status()).toBe(200);
  expect((await p('/api/platform/people/lookup',{documentType:'DNI',documentNumber:'00000001'})).status()).toBe(403);await caja.dispose();
  const audit=await(await ctx.get('/api/platform/audit')).json();const events=audit.filter((e:{action:string})=>e.action.startsWith('person.lookup.'));expect(events.length).toBeGreaterThan(0);expect(events.every((e:{resource:string})=>e.resource==='provider:apiperu')).toBe(true);expect(JSON.stringify(events)).not.toContain('00000001');expect(JSON.stringify(events)).not.toContain('PERSONA FICTICIA');
 });
 test('límite durable de consultas se respeta con solicitudes concurrentes',async()=>{
  const responses=await Promise.all(Array.from({length:12},()=>post('/api/platform/people/lookup',{documentType:'DNI',documentNumber:'00000001'})));expect(responses.some(r=>r.status()===429)).toBe(true);expect(responses.every(r=>[200,429].includes(r.status()))).toBe(true);
 });
});
