import {PGlite} from '@electric-sql/pglite';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||!/^\.notaria-phase42-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Solo exportación de XML de una base QA 4.2 detenida dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));const db=new PGlite(join(source,'postgres'));
try{
  await db.waitReady;const {rows}=await db.query<{reference:string;xml:string}>("SELECT reference,xml FROM fiscal_documents WHERE mode='simulation'");
  const output=join(source,'xml-validation');await mkdir(output,{recursive:true});
  for(const row of rows){if(!/^SIM-[FB]001-\d{8}$/.test(row.reference))throw new Error('Referencia QA inesperada.');await writeFile(join(output,row.reference+'.xml'),row.xml,{flag:'wx'});}
  console.log('XML sintéticos exportados para validación XSD:',rows.length);
}finally{await db.close();}
