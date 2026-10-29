import {PGlite} from '@electric-sql/pglite';
import {resolve,relative,isAbsolute,basename,join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const inputs=process.argv.slice(2);if(inputs.length!==2)throw new Error('Indica las dos bases QA de fase 4.2 detenidas.');
const tables=['fiscal_state','fiscal_series','fiscal_documents','fiscal_projection','fiscal_events','fiscal_requests','fiscal_sim_receipts','tariff_state','tariff_items','tariff_versions','tariff_requests','case_quote_tariffs','case_quotes','quote_acceptances','service_orders','finance_state','finance_entries','finance_requests','finance_sessions','finance_closings','finance_matches','finance_unmatches'];
const snapshots:Record<string,{count:number;sha256:string}>[]=[];
for(const input of inputs){
  const source=resolve(input);
  if(!/^\.notaria-phase42-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Solo bases QA de fase 4.2 dentro del proyecto.');
  await readFile(join(source,'postgres','PG_VERSION'));const db=new PGlite(join(source,'postgres'));
  try{
    await db.waitReady;const snapshot:typeof snapshots[number]={};
    for(const table of tables){const {rows}=await db.query<{count:number;data:string}>(`SELECT count(*)::int AS count,COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS data FROM ${table} t`);snapshot[table]={count:rows[0].count,sha256:createHash('sha256').update(rows[0].data).digest('hex')};}
    snapshots.push(snapshot);
  }finally{await db.close();}
}
assert.deepEqual(snapshots[0],snapshots[1]);
await writeFile('docs/evidence/fase-4-2-restauracion.json',JSON.stringify({date:'2026-10-29',equal:true,tables:snapshots[0],notes:['Comparación secuencial de dos bases QA detenidas; auditoría de verificaciones excluida porque las lecturas agregan evidencia. No se imprime contenido ni credenciales.']},null,2));
console.log('Restauración CLI: las 22 tablas comparadas conservan exactamente sus filas.');
