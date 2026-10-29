import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { platform, query, audit, baseURL } from '@/server/platform';
import { actor, assertOrigin, HttpError, requirePerson } from '@/server/access';
import { credentials, personInput, rolesInput, validateFile } from '@/server/validation';
import {lookupPerson,personLookupInput} from '@/server/person-lookup';
export const runtime = 'nodejs';
const uuid = z.uuid();
async function json(request: Request) {
  if (Number(request.headers.get('content-length')) > 20_000) throw new HttpError(413,'Solicitud demasiado grande.');
  const body = await boundedBody(request,20_000);
  try { return JSON.parse(Buffer.from(body).toString()); } catch { throw new HttpError(400,'Solicitud JSON no válida.'); }
}
async function boundedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = []; let size = 0;
  for (;;) { const {done,value} = await reader.read(); if (done) break; size+=value.length; if (size>limit) { await reader.cancel(); throw new HttpError(413,'Solicitud demasiado grande.'); } parts.push(value); }
  return Buffer.concat(parts);
}
async function handler(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const [area,id,operation] = path;
    const method = request.method;
    if (method !== 'GET') assertOrigin(request);
    const { db, auth } = await platform();
    if (area==='state' && method==='GET') {
      const [row] = await query<{count:string}>(db,'SELECT count(*)::text AS count FROM staff');
      return result({ needsSetup: row.count==='0' });
    }
    if (area==='bootstrap' && method==='POST') {
      if (!['127.0.0.1','localhost'].includes(new URL(baseURL).hostname)) throw new HttpError(403,'La instalación inicial se realiza desde el entorno local.');
      const input = credentials.parse(await json(request));
      if ((await query(db,'SELECT user_id FROM staff LIMIT 1')).length) throw new HttpError(409,'La instalación inicial ya se completó.');
      const claim = await query(db,'INSERT INTO setup_claim(id) VALUES(1) ON CONFLICT DO NOTHING RETURNING id');
      if (!claim.length) throw new HttpError(409,'La instalación ya está en curso.');
      try {
        const created = await auth.api.signUpEmail({ body: input });
        await db.transaction().execute(async tx => {
          await query(tx,'INSERT INTO staff(user_id,role) VALUES($1,$2)',[created.user.id,'administracion']);
          await audit(tx,created.user.id,'installation.complete','notary');
        });
      } catch (e) { await query(db,'DELETE FROM setup_claim WHERE id=1'); throw e; }
      return result({ ok:true });
    }
    if (area==='me' && method==='GET') return result(await actor(request.headers,undefined,{enrollment:true}));
    if (area==='people') {
      const user = await actor(request.headers,method==='GET'?'people:read':'people:write');
      if(id==='lookup'&&method==='POST'){
        const input=personLookupInput.parse(await json(request));
        // A durable per-user budget shared by all Vercel instances. No DNI/name in logs.
        await db.transaction().execute(async tx=>{
          await query(tx,'SELECT user_id FROM staff WHERE user_id=$1 AND office_id=$2 FOR UPDATE',[user.id,user.office]);
          const [count]=await query<{n:number}>(tx,"SELECT count(*)::int AS n FROM audit_events WHERE actor_id=$1 AND action='person.lookup.request' AND at>now()-interval '1 minute'",[user.id]);
          if(count.n>=10)throw new HttpError(429,'Alcanzaste el límite de consultas. Espera un minuto o completa el nombre manualmente.');
          await audit(tx,user.id,'person.lookup.request','provider:apiperu','attempt');
        });
        try{const found=await lookupPerson(input);await audit(db,user.id,'person.lookup.result','provider:apiperu','found');return result(found);}
        catch(error){await audit(db,user.id,'person.lookup.result','provider:apiperu',error instanceof HttpError?'http-'+error.status:'failed');throw error;}
      }
      if (method==='GET') return result(await db.transaction().execute(async tx => {
        await audit(tx,user.id,'people.list','office:'+user.office);
        return query(tx,'SELECT id,name,document_type,document_number,revision,created_at FROM persons WHERE office_id=$1 ORDER BY created_at DESC LIMIT 200',[user.office]);
      }));
      if (operation==='representations' && method==='POST') {
        uuid.parse(id); const body = z.object({ principalId:uuid, reference:z.string().trim().min(3).max(200) }).strict().parse(await json(request));
        if (id===body.principalId) throw new HttpError(400,'Selecciona dos personas distintas.');
        await db.transaction().execute(async tx => {
          await requirePerson(tx,id,user.office); await requirePerson(tx,body.principalId,user.office);
          const repId=randomUUID();
          await query(tx,'INSERT INTO representations(id,person_id,principal_id,reference) VALUES($1,$2,$3,$4)',[repId,id,body.principalId,body.reference]);
          await audit(tx,user.id,'representation.create',repId);
        }); return result({ok:true});
      }
      if (method==='POST' || method==='PATCH') {
        const input=personInput.parse(await json(request)); const personId=method==='POST'?randomUUID():uuid.parse(id);
        await db.transaction().execute(async tx => {
          if (method==='POST') await query(tx,'INSERT INTO persons(id,office_id,name,document_type,document_number) VALUES($1,$2,$3,$4,$5)',[personId,user.office,input.name,input.documentType,input.documentNumber]);
          else {
            if (!input.revision) throw new HttpError(400,'Falta la versión esperada.');
            const rows=await query(tx,'UPDATE persons SET name=$1,document_type=$2,document_number=$3,revision=revision+1 WHERE id=$4 AND office_id=$5 AND revision=$6 RETURNING id',[input.name,input.documentType,input.documentNumber,personId,user.office,input.revision]);
            if (!rows.length) throw new HttpError(409,'La ficha cambió o no está disponible. Recarga antes de guardar.');
          }
          await audit(tx,user.id,method==='POST'?'person.create':'person.update',personId);
        }); return result({id:personId});
      }
    }
    if (area==='representations' && method==='GET') {
      const user=await actor(request.headers,'people:read');
      return result(await db.transaction().execute(async tx => { await audit(tx,user.id,'representations.list','office:'+user.office); return query(tx,'SELECT r.id,r.reference,p.name AS representative,q.name AS principal FROM representations r JOIN persons p ON p.id=r.person_id JOIN persons q ON q.id=r.principal_id WHERE p.office_id=$1 AND q.office_id=$1 ORDER BY r.created_at DESC',[user.office]); }));
    }
    if (area==='documents') {
      const user=await actor(request.headers,method==='GET'?'documents:read':operation==='review'?'documents:release':'documents:write',{fresh:operation==='review'});
      if (method==='GET' && !id) return result(await db.transaction().execute(async tx => {
        await audit(tx,user.id,'documents.list','office:'+user.office);
        return query(tx,'SELECT v.id,v.document_id,v.version,v.filename,v.size,v.sha256,v.status,v.created_at,d.title,p.name AS person FROM document_versions v JOIN private_documents d ON d.id=v.document_id JOIN persons p ON p.id=d.person_id WHERE d.office_id=$1 ORDER BY v.created_at DESC LIMIT 200',[user.office]);
      }));
      if (method==='GET' && operation==='download') {
        uuid.parse(id);
        const file=await db.transaction().execute(async tx => {
          const [row]=await query<{filename:string;media_type:string;content:Uint8Array;status:string}>(tx,'SELECT v.filename,v.media_type,v.content,v.status FROM document_versions v JOIN private_documents d ON d.id=v.document_id WHERE v.id=$1 AND d.office_id=$2',[id,user.office]);
          if (!row) throw new HttpError(404,'Archivo no disponible.');
          if (row.status!=='liberado') throw new HttpError(423,'El archivo permanece en cuarentena o fue rechazado.');
          await audit(tx,user.id,'document.download',id); return row;
        });
        return new Response(Buffer.from(file.content),{headers:{'Content-Type':file.media_type,'Content-Disposition':`attachment; filename="archivo"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
      }
      if (method==='POST' && operation==='review') {
        uuid.parse(id); const input=z.object({ status:z.enum(['liberado','rechazado']), note:z.string().trim().min(15).max(500) }).strict().parse(await json(request));
        await db.transaction().execute(async tx => {
          const rows=await query(tx,'UPDATE document_versions v SET status=$1,review_note=$2,reviewed_by=$3 FROM private_documents d WHERE v.id=$4 AND v.document_id=d.id AND d.office_id=$5 AND v.status=$6 RETURNING v.id',[input.status,input.note,user.id,id,user.office,'cuarentena']);
          if (!rows.length) throw new HttpError(409,'Archivo no disponible para revisión.');
          await audit(tx,user.id,'document.'+input.status,id);
        }); return result({ok:true});
      }
      if (method==='POST' && (!id || operation==='versions')) {
        const bytes=await boundedBody(request,5*1024*1024+64*1024);
        const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();
        const file=form.get('file'); if (!(file instanceof File)) throw new HttpError(400,'Falta el archivo.');
        const personId=uuid.parse(form.get('personId'));
        const title=z.string().trim().min(3).max(150).parse(form.get('title'));
        const filename=file.name.replace(/[\r\n\\/"\x00-\x1f]/g,'_').slice(0,150);
        const content=Buffer.from(await file.arrayBuffer()); let mediaType:string;
        try { mediaType=validateFile(content,filename); } catch(e) { throw new HttpError(400,(e as Error).message); }
        const docId=id?uuid.parse(id):randomUUID(); const versionId=randomUUID();
        const expected=id?z.coerce.number().int().positive().parse(form.get('expectedVersion')):0;
        await db.transaction().execute(async tx => {
          await requirePerson(tx,personId,user.office);
          if (!id) await query(tx,'INSERT INTO private_documents(id,office_id,person_id,title) VALUES($1,$2,$3,$4)',[docId,user.office,personId,title]);
          const [doc]=await query<{person_id:string}>(tx,'SELECT person_id FROM private_documents WHERE id=$1 AND office_id=$2 FOR UPDATE',[docId,user.office]);
          if (!doc || doc.person_id!==personId) throw new HttpError(404,'Documento no disponible.');
          const [last]=await query<{version:number}>(tx,'SELECT version FROM document_versions WHERE document_id=$1 ORDER BY version DESC LIMIT 1',[docId]);
          if ((last?.version||0)!==expected) throw new HttpError(409,'La versión cambió. Recarga antes de subir otra versión.');
          await query(tx,'INSERT INTO document_versions(id,document_id,version,filename,media_type,size,sha256,content,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[versionId,docId,expected+1,filename,mediaType,content.length,createHash('sha256').update(content).digest('hex'),content,user.id]);
          await audit(tx,user.id,'document.upload',versionId);
        }); return result({id:versionId});
      }
    }
    if (area==='settings') {
      const user=await actor(request.headers,method==='GET'?undefined:'settings:manage',{fresh:method!=='GET'});
      if (method==='GET') return result((await query(db,'SELECT name,office,revision FROM notary_settings WHERE id=1'))[0]);
      if (method==='PATCH') {
        const input=z.object({name:z.string().trim().min(3).max(100),office:z.string().trim().min(3).max(100),revision:z.number().int().positive()}).strict().parse(await json(request));
        await db.transaction().execute(async tx=>{ const rows=await query(tx,'UPDATE notary_settings SET name=$1,office=$2,revision=revision+1 WHERE id=1 AND revision=$3 RETURNING id',[input.name,input.office,input.revision]); if(!rows.length)throw new HttpError(409,'La configuración cambió; recarga antes de guardar.'); await audit(tx,user.id,'settings.update','notary'); }); return result({ok:true});
      }
    }
    if (area==='audit' && method==='GET') {
      const user=await actor(request.headers,'audit:read',{fresh:true});
      return result(await db.transaction().execute(async tx=>{await audit(tx,user.id,'audit.read','events');return query(tx,'SELECT id::text,actor_id,action,resource,result,at FROM audit_events ORDER BY id DESC LIMIT 200');}));
    }
    if (area==='users') {
      const user=await actor(request.headers,'users:manage',{fresh:true});
      if (method==='GET') return result(await db.transaction().execute(async tx=>{await audit(tx,user.id,'users.list','staff');return query(tx,'SELECT u.id,u.name,u.email,u."twoFactorEnabled" AS mfa,s.role,s.active FROM "user" u JOIN staff s ON s.user_id=u.id ORDER BY u."createdAt"');}));
      if (method==='POST') {
        const input=credentials.extend({role:rolesInput}).parse(await json(request));
        const created=await auth.api.signUpEmail({body:{name:input.name,email:input.email,password:input.password}});
        await db.transaction().execute(async tx=>{await query(tx,'INSERT INTO staff(user_id,role) VALUES($1,$2)',[created.user.id,input.role]);await audit(tx,user.id,'user.create',created.user.id);});return result({ok:true});
      }
      if (method==='PATCH') {
        const input=z.object({role:rolesInput,active:z.boolean()}).strict().parse(await json(request));
        if (id===user.id) throw new HttpError(400,'No puedes cambiar tu propia habilitación o perfil.');
        await db.transaction().execute(async tx=>{const rows=await query(tx,'UPDATE staff SET role=$1,active=$2 WHERE user_id=$3 RETURNING user_id',[input.role,input.active,id]);if(!rows.length)throw new HttpError(404,'Usuario no disponible.');await query(tx,'DELETE FROM session WHERE "userId"=$1',[id]);await audit(tx,user.id,'user.permissions-and-revoke',id);});return result({ok:true});
      }
    }
    throw new HttpError(404,'Operación no disponible.');
  } catch(error) {
    if(error instanceof z.ZodError)return result({message:error.issues[0]?.message||'Revisa los datos.'},400);
    if(error instanceof HttpError)return result({message:error.message},error.status);
    const code=(error as {code?:string}).code;
    if(code==='23505')return result({message:'El registro ya existe o cambió su versión.'},409);
    // Do not return SQL, paths, credentials or personal data through error responses.
    console.error('Platform request failed:', error instanceof Error ? error.name : 'UnknownError');
    return result({message:'No se pudo completar la operación. Revisa los datos o vuelve a intentarlo.'},503);
  }
}
function result(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export {handler as GET,handler as POST,handler as PATCH};
