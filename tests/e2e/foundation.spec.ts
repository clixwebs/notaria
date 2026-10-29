import {test,expect,type APIRequestContext,type BrowserContext} from '@playwright/test';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import AxeBuilder from '@axe-core/playwright';
const origin='http://127.0.0.1:3101';
// These credentials belong ONLY to an isolated QA instance, never the review installation.
const password='Solo-pruebas-Local-2026!';
let admin:APIRequestContext;let storage:Awaited<ReturnType<APIRequestContext['storageState']>>;let backupCodes:string[];let personId:string;let fileId:string;let docId:string;let cashierId:string;
async function post(context:APIRequestContext,path:string,data:unknown){return context.post(path,{data,headers:{Origin:origin}});}
async function enroll(context:APIRequestContext){
  const enabled=await post(context,'/api/auth/two-factor/enable',{password});expect(enabled.status()).toBe(200);
  const data=await enabled.json();const secret=new URL(data.totpURI).searchParams.get('secret')!;
  const code=await createOTP(base32.decode(secret)).totp();
  const verified=await post(context,'/api/auth/two-factor/verify-totp',{code,trustDevice:false});expect(verified.status()).toBe(200);
  return data.backupCodes as string[];
}
test.describe.serial('Fundamentos persistentes y permisos',()=>{
  test.beforeAll(async({playwright})=>{
    admin=await playwright.request.newContext({baseURL:origin});
    const response=await post(admin,'/api/platform/bootstrap',{name:'Administración QA',email:'admin@example.test',password});expect(response.status()).toBe(200);
    expect((await post(admin,'/api/auth/sign-in/email',{email:'admin@example.test',password})).status()).toBe(200);
  });
  test('sin sesión: rechaza datos, archivos y registro público; exige origen',async({request})=>{
    expect((await request.get('/api/platform/people')).status()).toBe(401);
    expect((await request.get('/api/platform/documents')).status()).toBe(401);
    expect((await request.post('/api/auth/sign-up/email',{data:{name:'Intruso',email:'other@example.test',password},headers:{Origin:origin}})).status()).toBe(404);
    expect((await request.post('/api/platform/people',{data:{},headers:{Origin:'https://other.example'}})).status()).toBe(403);
  });
  test('sesión sin TOTP no puede acceder a datos; verificarlo habilita el núcleo',async()=>{
    expect((await admin.get('/api/platform/people')).status()).toBe(403);
    backupCodes=await enroll(admin);
    expect((await admin.get('/api/platform/people')).status()).toBe(200);
    storage=await admin.storageState();
    expect((await post(admin,'/api/platform/bootstrap',{name:'Otro administrador',email:'other@example.test',password})).status()).toBe(409);
  });
  test('personas: persiste, evita duplicados y detecta actualización concurrente',async()=>{
    const input={name:'Persona Ficticia QA',documentType:'DEMO',documentNumber:'QA-100'};
    const response=await post(admin,'/api/platform/people',input);expect(response.status()).toBe(200);personId=(await response.json()).id;
    expect((await post(admin,'/api/platform/people',input)).status()).toBe(409);
    const updates=await Promise.all(['A','B'].map(s=>admin.patch('/api/platform/people/'+personId,{data:{...input,name:'Persona Ficticia '+s,revision:1},headers:{Origin:origin}})));
    expect(updates.map(r=>r.status()).sort()).toEqual([200,409]);
    const all=await (await admin.get('/api/platform/people')).json();expect(all.find((p:{id:string})=>p.id===personId).revision).toBe(2);
  });
  test('documentos: cuarentena, liberación, descarga privada y versiones inmutables',async()=>{
    const response=await admin.post('/api/platform/documents',{headers:{Origin:origin},multipart:{personId,title:'Sustento ficticio QA',file:{name:'sustento.txt',mimeType:'text/plain',buffer:Buffer.from('Contenido sintético versión 1')}}});expect(response.status()).toBe(200);fileId=(await response.json()).id;
    expect((await admin.get('/api/platform/documents/'+fileId+'/download')).status()).toBe(423);
    expect((await post(admin,'/api/platform/documents/'+fileId+'/review',{status:'liberado',note:'Revisión manual del original ficticio completada.'})).status()).toBe(200);
    const downloaded=await admin.get('/api/platform/documents/'+fileId+'/download');expect(downloaded.status()).toBe(200);expect(await downloaded.text()).toBe('Contenido sintético versión 1');expect(downloaded.headers()['cache-control']).toContain('no-store');expect(downloaded.headers()['content-disposition']).toContain('attachment');
    const files=await(await admin.get('/api/platform/documents')).json();docId=files.find((d:{id:string})=>d.id===fileId).document_id;
    const response2=await admin.post('/api/platform/documents/'+docId+'/versions',{headers:{Origin:origin},multipart:{personId,title:'Sustento ficticio QA',expectedVersion:'1',file:{name:'sustento-v2.txt',mimeType:'text/plain',buffer:Buffer.from('Contenido sintético versión 2')}}});expect(response2.status()).toBe(200);
    expect(await(await admin.get('/api/platform/documents/'+fileId+'/download')).text()).toBe('Contenido sintético versión 1');
    const bad=await admin.post('/api/platform/documents',{headers:{Origin:origin},multipart:{personId,title:'Rechazo de cabecera',file:{name:'falso.pdf',mimeType:'application/pdf',buffer:Buffer.from('<html>bad</html>')}}});expect(bad.status()).toBe(400);
  });
  test('perfil caja no accede por API directa a personas, archivos o auditoría',async({playwright})=>{
    expect((await post(admin,'/api/platform/users',{name:'Caja QA',email:'caja@example.test',password,role:'caja'})).status()).toBe(200);
    const users=await(await admin.get('/api/platform/users')).json();cashierId=users.find((u:{email:string})=>u.email==='caja@example.test').id;
    const cashier=await playwright.request.newContext({baseURL:origin});
    expect((await post(cashier,'/api/auth/sign-in/email',{email:'caja@example.test',password})).status()).toBe(200);await enroll(cashier);
    expect((await cashier.get('/api/platform/people')).status()).toBe(403);
    expect((await cashier.get('/api/platform/documents/'+fileId+'/download')).status()).toBe(403);
    expect((await cashier.get('/api/platform/audit')).status()).toBe(403);
    expect((await admin.patch('/api/platform/users/'+cashierId,{headers:{Origin:origin},data:{role:'recepcion',active:true}})).status()).toBe(200);
    expect((await cashier.get('/api/platform/me')).status()).toBe(401);
    await cashier.dispose();
  });
  test('otro código de recuperación funciona una sola vez; revocar sesión la invalida',async({playwright})=>{
    const other=await playwright.request.newContext({baseURL:origin});
    const login=await post(other,'/api/auth/sign-in/email',{email:'admin@example.test',password});expect((await login.json()).twoFactorRedirect).toBe(true);
    expect((await other.get('/api/platform/people')).status()).toBe(401);
    expect((await post(other,'/api/auth/two-factor/verify-backup-code',{code:backupCodes[0],disableSession:false,trustDevice:false})).status()).toBe(200);
    const me=await(await other.get('/api/platform/me')).json();
    const sessions=await(await admin.get('/api/auth/list-sessions')).json();const current=sessions.find((s:{id:string})=>s.id===me.sessionId);
    expect((await post(admin,'/api/auth/revoke-session',{token:current.token})).status()).toBe(200);
    expect((await other.get('/api/platform/me')).status()).toBe(401);
    await post(other,'/api/auth/sign-in/email',{email:'admin@example.test',password});
    expect((await post(other,'/api/auth/two-factor/verify-backup-code',{code:backupCodes[0],disableSession:false,trustDevice:false})).status()).toBe(401);
    await other.dispose();
  });
  test('configuración concurrente y evidencia durable de lecturas y cambios',async()=>{
    const settings=await(await admin.get('/api/platform/settings')).json();
    const changed=await admin.patch('/api/platform/settings',{headers:{Origin:origin},data:{name:'Notaría de prueba QA',office:'Oficina de pruebas · Lima',revision:settings.revision}});expect(changed.status()).toBe(200);
    expect((await admin.patch('/api/platform/settings',{headers:{Origin:origin},data:settings})).status()).toBe(409);
    const audit=await(await admin.get('/api/platform/audit')).json();
    for(const action of ['person.create','person.update','document.upload','document.download','access.denied','settings.update','user.permissions-and-revoke'])expect(audit.some((e:{action:string})=>e.action===action)).toBe(true);
  });
  test('pantallas y formularios: sin errores, persistencia al recargar y cierre de sesión',async({browser})=>{
    const context=await browser.newContext({storageState:storage});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    for(const route of ['/inicio','/expedientes','/personas','/documentos','/seguridad','/configuracion','/auditoria']){await page.goto(origin+route);await expect(page.locator('h1')).toBeVisible();}
    await page.goto(origin+'/personas');await expect(page.getByRole('button',{name:'Editar ficha'})).toHaveCount(1);await page.reload();await expect(page.getByRole('button',{name:'Editar ficha'})).toHaveCount(1);
    await page.getByRole('button',{name:'Nueva persona'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);await context.close();
  });
  test('usuario nuevo configura TOTP desde la interfaz y edita una ficha persistente',async({browser})=>{
    expect((await post(admin,'/api/platform/users',{name:'Recepción UI QA',email:'recepcion@example.test',password,role:'recepcion'})).status()).toBe(200);
    const context=await browser.newContext();const page=await context.newPage();await page.goto(origin+'/acceso');
    await page.getByLabel('Correo de acceso').fill('recepcion@example.test');await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Ingresar',exact:true}).click();
    await expect(page).toHaveURL(origin+'/seguridad');await page.getByLabel('Confirma tu contraseña').fill(password);await page.getByRole('button',{name:'Configurar segundo factor'}).click();
    const key=await page.getByLabel('Clave de configuración').inputValue();await page.getByLabel('Código de seis dígitos').fill(await createOTP(base32.decode(key)).totp());await page.getByRole('button',{name:'Verificar segundo factor'}).click();
    await expect(page.locator('.recovery-codes code')).toHaveCount(10);await page.getByRole('button',{name:'Guardé mis códigos. Continuar'}).click();await expect(page).toHaveURL(origin+'/inicio');
    await page.goto(origin+'/personas');await page.getByRole('button',{name:'Editar ficha'}).click();await page.getByLabel('Nombre completo').fill('Persona Sintética Revisada');await page.getByRole('button',{name:'Guardar persona'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.reload();await expect(page.getByText('Persona Sintética Revisada',{exact:true})).toBeVisible();await context.close();
  });
  test('paleta negra y azul: contraste, reflujo y capturas en escritorio y móvil',async({browser})=>{
    const context:BrowserContext=await browser.newContext({storageState:storage});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,683,390]){await page.setViewportSize({width,height:900});await page.goto(origin+'/personas');await expect(page.getByRole('button',{name:'Editar ficha'})).toHaveCount(1);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await page.screenshot({path:`docs/evidence/fase-2-personas-${width}.png`,fullPage:true});}
    await page.getByRole('button',{name:'Activar tema oscuro'}).click();const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(dark.violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:'docs/evidence/fase-2-personas-oscuro.png',fullPage:true});
    await context.close();
  });
test('compraventa: bloqueo, revisión de versión, identificación, cobro y entrega', async ({ page }) => {
  await page.context().addCookies(storage.cookies);
  await page.goto('/expedientes/2026-0048/actuacion');
  await expect(page.getByRole('button', { name: 'Simular actuación notarial' })).toBeDisabled();
  await page.getByRole('link', { name: 'Requisitos', exact: true }).click();
  await page.getByRole('checkbox', { name: /Representación aplicable/ }).check();
  await page.getByRole('link', { name: 'Documento', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar versión revisada' }).click();
  await page.getByRole('button', { name: 'Crear nueva versión demo' }).click();
  await expect(page.getByText('Revisión pendiente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar versión revisada' }).click();
  await page.getByRole('link', { name: 'Identificación', exact: true }).click();
  const result = page.getByLabel('Resultado de prueba');
  await result.selectOption('No coincidencia');
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).first().click();
  await page.getByRole('link', { name: 'Actuación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Simular actuación notarial' })).toBeDisabled();
  await page.getByRole('link', { name: 'Identificación', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).first().click();
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).nth(1).click();
  await page.getByRole('link', { name: 'Actuación', exact: true }).click();
  await page.getByRole('button', { name: 'Simular actuación notarial' }).click();
  await expect(page.getByRole('heading', { name: 'Actuación simulada registrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Entrega', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registrar entrega demo' })).toBeDisabled();
  await page.getByRole('link', { name: 'Cobros', exact: true }).click();
  await page.getByLabel('Importe en soles').fill('750.01');
  await page.getByRole('button', { name: 'Registrar cobro demo', exact: true }).click();
  await expect(page.locator('#payment-error')).toContainText('no superar el saldo');
  await page.getByLabel('Importe en soles').fill('750');
  await page.getByRole('button', { name: 'Registrar cobro demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saldo cancelado en demo' })).toBeDisabled();
  await page.getByRole('link', { name: 'Entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar entrega demo' }).click();
  await expect(page.getByRole('heading', { name: 'Entrega demo completada' })).toBeVisible();
});
test('certificación y carta usan requisitos distintos; creación y diligencias', async ({ page }) => {
  await page.context().addCookies(storage.cookies);
  await page.goto('/expedientes/nuevo');
  await page.getByRole('radio', { name: /Certificación de firmas/ }).check();
  await page.getByLabel('Nombre ficticio del solicitante').fill('Sofía Ficticia');
  await page.getByLabel('Asunto del expediente').fill('Certificación de contrato de prueba');
  await page.getByRole('button', { name: 'Crear expediente' }).click();
  await page.getByRole('link', { name: 'Requisitos', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: /Minuta/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Diligencia', exact: true })).toHaveCount(0);
  await page.getByText('Más', { exact: true }).click();
  await page.getByRole('link', { name: 'Diligencias', exact: true }).click();
  await page.getByRole('link', { name: /2026-0046/ }).click();
  await page.getByLabel('Observación ficticia').fill('Intento ficticio sin respuesta; sin datos reales.');
  await page.getByRole('button', { name: 'Registrar intento demo' }).click();
  await expect(page.getByText('Intento 1: Sin respuesta')).toBeVisible();
  await page.getByRole('combobox', { name: 'Resultado', exact: true }).selectOption('Entregada');
  await page.getByLabel('Observación ficticia').fill('Segundo intento de demostración.');
  await page.getByRole('button', { name: 'Registrar intento demo' }).click();
  await expect(page.getByText('Intento 1: Sin respuesta')).toBeVisible();
  await expect(page.getByText('Intento 2: Entregada')).toBeVisible();
});
test('búsqueda, filtros, páginas, tablero y diálogo por teclado', async ({ page }) => {
  await page.context().addCookies(storage.cookies);
  await page.goto('/expedientes');
  await page.getByLabel('Buscar en expedientes').fill('no-existe-demo');
  await expect(page.getByRole('heading', { name: 'No hay expedientes con estos filtros' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByRole('link', { name: /Abrir expediente 2026-0042/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tablero', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Listo para entrega/ })).toBeVisible();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Kardex, persona o acto').fill('Valeria');
  await expect(dialog.getByRole('link')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

  test('cerrar sesión revoca el acceso de servidor',async({browser})=>{const context=await browser.newContext({storageState:storage});const page=await context.newPage();await page.goto(origin+'/inicio');await page.getByRole('button',{name:'Cerrar sesión',exact:true}).last().click();await expect(page).toHaveURL(origin+'/acceso');expect((await admin.get('/api/platform/people')).status()).toBe(401);for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.getByRole('button',{name:'Ingresar',exact:true})).toBeEnabled();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);await page.screenshot({path:`docs/evidence/fase-2-login-${width}.png`,fullPage:true});}await context.close();});
});
