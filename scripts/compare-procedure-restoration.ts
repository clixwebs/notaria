import {PGlite} from '@electric-sql/pglite';
import {resolve,relative,isAbsolute,basename,join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const inputs=process.argv.slice(2);if(inputs.length!==2)throw new Error('Indica las dos bases QA de procedimiento detenidas.');
const tables=['private_documents','document_versions','persons','representations','procedure_events','procedure_requests','instrument_counters','template_state','legal_templates','legal_template_versions','template_requests','case_draft_templates','case_records','case_participants','case_requirements','case_drafts','case_draft_reviews','case_requirement_checks','case_events','fiscal_state','fiscal_series','fiscal_documents','fiscal_projection','fiscal_events','fiscal_requests','fiscal_sim_receipts','tariff_state','tariff_items','tariff_versions','tariff_requests','case_quote_tariffs','case_quotes','quote_acceptances','service_orders','finance_state','finance_entries','finance_requests','finance_sessions','finance_closings','finance_matches','finance_unmatches'];
const snapshots:Record<string,{count:number;sha256:string}>[]=[];
for(const input of inputs){
  const source=resolve(input);
  if(!/^\.notaria-procedure-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Solo bases QA de procedimiento dentro del proyecto.');
  await readFile(join(source,'postgres','PG_VERSION'));const db=new PGlite(join(source,'postgres'));
  try{
    await db.waitReady;const snapshot:typeof snapshots[number]={};
    for(const table of tables){const {rows}=await db.query<{count:number;data:string}>(`SELECT count(*)::int AS count,COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text AS data FROM ${table} t`);snapshot[table]={count:rows[0].count,sha256:createHash('sha256').update(rows[0].data).digest('hex')};}
    snapshots.push(snapshot);
  }finally{await db.close();}
}
assert.deepEqual(snapshots[0],snapshots[1]);
assert.deepEqual(await readFile(join(resolve(inputs[0]),'auth-secret')),await readFile(join(resolve(inputs[1]),'auth-secret')));
await writeFile('docs/evidence/fase-3-procedimiento-restauracion.json',JSON.stringify({date:'2026-10-29',equal:true,privateDocumentBytesCompared:true,localKeyEqualWithoutDisclosure:true,tables:snapshots[0],notes:['Comparación secuencial de dos bases QA detenidas; auditoría de verificaciones excluida porque las lecturas agregan evidencia. No se imprime contenido ni credenciales.']},null,2));
console.log('Restauración CLI: las 41 tablas comparadas conservan exactamente sus filas.');
