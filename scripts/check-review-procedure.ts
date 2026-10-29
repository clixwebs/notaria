import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto('http://127.0.0.1:3100/acceso');expect(response?.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();
  for(const path of ['procedures/00000000-0000-4000-8000-000000000001','templates','fiscal','tariffs','finance','cases'])expect((await context.request.get('http://127.0.0.1:3100/api/'+path)).status()).toBe(401);
  expect((await context.request.get('http://127.0.0.1:3100/api/fiscal/00000000-0000-4000-8000-000000000001/xml')).status()).toBe(401);
  await page.goto('http://127.0.0.1:3100/expedientes');await expect(page).toHaveURL('http://127.0.0.1:3100/acceso');expect(errors).toEqual([]);
  await writeFile('docs/evidence/fase-3-procedimiento-revision-local.json',JSON.stringify({date:'2026-10-29',review:'http://127.0.0.1:3100/expedientes',checks:{login200:true,anonymousProceduresTemplatesFiscalTariffsFinanceCases401:true,anonymousFiscalFile401:true,anonymousCasePageRedirectsToLogin:true,noPageErrors:true},qaAccountsCreatedHere:false},null,2));
  console.log('Revisión local de procedimiento: acceso correcto; APIs/archivos fiscales protegidos sin sesión; sin errores de página.');await context.close();
}finally{await browser.close();}
