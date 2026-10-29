import {test,expect,type APIRequestContext} from '@playwright/test';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import {registerProcedureScenarios} from './procedure.scenarios';
const origin='http://127.0.0.1:3101',password='Solo-pruebas-Local-2026!';
let admin:APIRequestContext,storage:Awaited<ReturnType<APIRequestContext['storageState']>>;
async function enroll(ctx:APIRequestContext){const r=await ctx.post('/api/auth/two-factor/enable',{headers:{Origin:origin},data:{password}});expect(r.status()).toBe(200);const v=await r.json(),secret=new URL(v.totpURI).searchParams.get('secret')!;expect((await ctx.post('/api/auth/two-factor/verify-totp',{headers:{Origin:origin},data:{code:await createOTP(base32.decode(secret)).totp(),trustDevice:false}})).status()).toBe(200);return v.backupCodes as string[];}
test.describe.serial('Procedimiento completo en QA nueva',()=>{
  test.beforeAll(async({playwright})=>{admin=await playwright.request.newContext({baseURL:origin});expect((await admin.post('/api/platform/bootstrap',{headers:{Origin:origin},data:{name:'Administración QA',email:'admin@example.test',password}})).status()).toBe(200);expect((await admin.post('/api/auth/sign-in/email',{headers:{Origin:origin},data:{email:'admin@example.test',password}})).status()).toBe(200);await enroll(admin);storage=await admin.storageState();});
  registerProcedureScenarios({admin:()=>admin,storage:()=>storage,enroll});
  test('cierre de sesión conserva revocación de servidor',async()=>{expect((await admin.post('/api/auth/sign-out',{headers:{Origin:origin},data:{}})).status()).toBe(200);expect((await admin.get('/api/procedures/00000000-0000-4000-8000-000000000001')).status()).toBe(401);await admin.dispose();});
});
