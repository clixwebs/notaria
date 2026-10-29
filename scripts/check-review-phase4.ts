import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto('http://127.0.0.1:3100/acceso');expect(response?.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.login-office')).toContainText('Fase 4');
  expect((await context.request.get('http://127.0.0.1:3100/api/finance')).status()).toBe(401);expect((await context.request.get('http://127.0.0.1:3100/api/cases')).status()).toBe(401);expect(errors).toEqual([]);
  console.log('Revisión local: acceso fase 4 correcto; finanzas/expedientes protegidos sin sesión; sin errores de página.');await context.close();
}finally{await browser.close();}
