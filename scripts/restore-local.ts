import {PGlite} from '@electric-sql/pglite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,join} from 'node:path';
import {createHash} from 'node:crypto';
if(!process.argv[2]||!process.argv[3])throw new Error('Uso: npm run restore:local -- backups/<copia> .notaria-restaurada-nueva');
const [source,target]=process.argv.slice(2,4).map(p=>resolve(p));
for(const path of [source,target])if(relative(process.cwd(),path).startsWith('..')||isAbsolute(relative(process.cwd(),path)))throw new Error('Los destinos deben pertenecer al proyecto.');
const archive=await readFile(join(source,'postgres.tgz'));const manifest=JSON.parse(await readFile(join(source,'manifest.json'),'utf8'));
if(manifest.format!==1||manifest.engine!=='pglite'||createHash('sha256').update(archive).digest('hex')!==manifest.sha256)throw new Error('Copia no válida o checksum diferente.');
const secret=await readFile(join(source,'auth-secret'));
await mkdir(target); // No overwrite, merge or removal of an existing database.
const db=new PGlite(join(target,'postgres'),{loadDataDir:new Blob([archive])});
try{await db.waitReady;await writeFile(join(target,'auth-secret'),secret,{flag:'wx',mode:0o600});console.log('Restauración aislada creada:',target);}finally{await db.close();}
