import {PGlite} from '@electric-sql/pglite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,join} from 'node:path';
import {createHash} from 'node:crypto';
const source=resolve(process.argv[2]||'.notaria');
if(relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('El origen debe pertenecer al proyecto.');
// Stop the server first: a PGlite directory has exactly one owning process.
const secret=await readFile(join(source,'auth-secret'));
const output=resolve('backups','local-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(output,{recursive:true});
await readFile(join(source,'postgres','PG_VERSION'));
const db=new PGlite(join(source,'postgres'));
try{
  await db.waitReady;const archive=Buffer.from(await(await db.dumpDataDir('gzip')).arrayBuffer());
  await writeFile(join(output,'postgres.tgz'),archive,{flag:'wx',mode:0o600});
  await writeFile(join(output,'auth-secret'),secret,{flag:'wx',mode:0o600});
  await writeFile(join(output,'manifest.json'),JSON.stringify({format:1,engine:'pglite',createdAt:new Date().toISOString(),sha256:createHash('sha256').update(archive).digest('hex')},null,2),{flag:'wx'});
  console.log('Copia local creada:',output);
}finally{await db.close();}
