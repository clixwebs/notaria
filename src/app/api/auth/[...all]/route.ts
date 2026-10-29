import { platform, audit } from '@/server/platform';
import { assertOrigin, HttpError } from '@/server/access';
export const runtime = 'nodejs';
const allowed = new Set(['sign-in/email','sign-out','get-session','two-factor/enable','two-factor/verify-totp','two-factor/verify-backup-code','two-factor/get-totp-uri','change-password','list-sessions','revoke-session','revoke-other-sessions']);
async function handler(request: Request, context: { params: Promise<{ all: string[] }> }) {
  const { all } = await context.params;
  const path = all.join('/');
  if (!allowed.has(path)) return Response.json({ message: 'Operación no disponible.' }, { status: 404 });
  try {
    if (request.method !== 'GET') assertOrigin(request);
    const { auth, db } = await platform();
    if (request.method !== 'GET') await audit(db, null, `auth.${path}`, 'authentication', 'attempt');
    // Local deployment has one connection origin; client-supplied proxy headers are not trusted.
    const headers = new Headers(request.headers);
    headers.delete('x-forwarded-for'); headers.delete('x-real-ip'); headers.set('x-notaria-internal-ip','127.0.0.1');
    const response = await auth.handler(new Request(request.url, { method:request.method, headers, ...(request.method==='GET'?{}:{body:await request.arrayBuffer()}) }));
    const outgoing = new Headers(response.headers);
    outgoing.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,headers:outgoing});
  } catch (e) {
    console.error('Authentication transport failed:',e instanceof Error ? e.message : 'UnknownError');
    return Response.json({ message: e instanceof HttpError ? e.message : 'No se pudo procesar el acceso.' }, { status: e instanceof HttpError ? e.status : 503 });
  }
}
export { handler as GET, handler as POST };
