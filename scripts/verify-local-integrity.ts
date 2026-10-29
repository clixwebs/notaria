import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
if(!process.argv[2])throw new Error('Indica la base QA detenida, dentro de este proyecto.');
const source=resolve(process.argv[2]);if(relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Origen fuera del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));
const db=new PGlite(join(source,'postgres'));
try{
  await db.waitReady; console.log("Base QA abierta.");
  const persons=(await db.query<{n:number}>('SELECT count(*)::int AS n FROM persons')).rows[0].n;
  const documents=(await db.query<{n:number}>('SELECT count(*)::int AS n FROM document_versions')).rows[0].n;
  const events=(await db.query<{n:number}>('SELECT count(*)::int AS n FROM audit_events')).rows[0].n;
  assert.ok(persons>0&&documents>=2&&events>0); console.log("Conteos correctos.");
  await assert.rejects(db.query("UPDATE audit_events SET result='alterado'")); console.log("Auditoría rechaza cambios.");
  await assert.rejects(db.query("UPDATE document_versions SET content='alterado'::bytea")); console.log("Versiones rechazan cambios.");
  await assert.rejects(db.query('DELETE FROM document_versions')); console.log('Versiones rechazan borrado.');
  const id=randomUUID();
  await assert.rejects(db.transaction(async tx=>{await tx.query("INSERT INTO persons(id,office_id,name,document_type,document_number) VALUES($1,'principal','Rollback QA','DEMO',$2)",[id,id]);await tx.query("INSERT INTO audit_events(action,resource) VALUES(NULL,'failure-test')");}));
  assert.equal((await db.query('SELECT id FROM persons WHERE id=$1',[id])).rows.length,0);
  console.log('Controles transaccionales correctos. Creando instantánea.');
  const original=await db.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:original});
  try{
    await restored.waitReady;
    for(const [table,count] of [['persons',persons],['document_versions',documents],['audit_events',events]] as const)assert.equal((await restored.query<{n:number}>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,count);
    const files=(await restored.query<{content:Uint8Array;sha256:string}>('SELECT content,sha256 FROM document_versions')).rows;
    for(const f of files)assert.equal(createHash('sha256').update(f.content).digest('hex'),f.sha256);
    const secret=await readFile(join(source,'auth-secret'));assert.ok(secret.length>=32);
    const report={date:'2026-10-29',engine:'PGlite 0.5.13',persons,documentVersions:documents,auditEvents:events,checks:{auditUpdateRejected:true,documentContentUpdateRejected:true,versionDeleteRejected:true,auditFailureRollsBackBusinessChange:true,snapshotRestored:true,countsMatch:true,documentHashesMatch:true,authKeyPresent:true},limits:['A snapshot restore in an isolated embedded database; does not establish production RPO/RTO or managed PostgreSQL recovery.']};
    await writeFile('docs/evidence/fase-2-restauracion.json',JSON.stringify(report,null,2));console.log('Integridad y restauración aislada: 8 controles correctos.');
  }finally{await restored.close();}
}finally{await db.close();}
