import {PGlite} from '@electric-sql/pglite';
import {Kysely,PGliteDialect} from 'kysely';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {query,type Database} from '../src/server/platform.ts';
import {mutateFinance,financeOverview} from '../src/server/finance.ts';
import {cents,money} from '../src/lib/finance-domain.ts';
import type {Role} from '../src/server/access.ts';
const source=resolve(process.argv[2]||'');
if(!process.argv[2]||(!basename(source).startsWith('.notaria-phase4-')&&!/^\.notaria-phase4[123]-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+$/.test(basename(source)))||relative(process.cwd(),source).startsWith('..')||isAbsolute(relative(process.cwd(),source)))throw new Error('Indica una base QA de fase 4 detenida, dentro del proyecto.');
await readFile(join(source,'postgres','PG_VERSION'));
const pg=new PGlite(join(source,'postgres'));const db=new Kysely<Database>({dialect:new PGliteDialect({pglite:pg})});
try{
  await pg.waitReady;
  const [r]=await query<{created_by:string;office_id:string;person_id:string;case_id:string}>(db,'SELECT created_by,office_id,person_id,case_id FROM finance_entries ORDER BY sequence LIMIT 1');assert.ok(r);
  const actor={id:r.created_by,name:'QA',email:'qa@example.test',role:'administracion' as Role,office:r.office_id,mfa:true,sessionId:'integrity-qa'};
  const tables=['finance_requests','finance_suppliers','finance_sessions','finance_closings','finance_entries','finance_matches','finance_unmatches'];
  for(const table of tables){const [{n}]=await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`);assert.ok(n>0,table+' requires tested rows');await assert.rejects(query(db,`DELETE FROM ${table}`));}
  await assert.rejects(query(db,"UPDATE finance_entries SET amount=0.01"));
  const empty=await financeOverview(db,{...actor,office:'otra-oficina'},null);assert.equal(empty.entries.length,0);assert.equal(empty.clients.length,0);assert.equal(empty.receivable,'0.00');
  await assert.rejects(financeOverview(db,{...actor,office:'otra-oficina'},r.person_id),e=>(e as {status:number}).status===404);
  const before=await financeOverview(db,actor,null,1,50);
  const stateBefore=await query(db,'SELECT revision,sequence FROM finance_state WHERE office_id=$1',[r.office_id]);
  const requestsBefore=await query(db,'SELECT count(*)::int AS n FROM finance_requests');
  await query(db,`CREATE FUNCTION qa_fail_finance_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action IN ('finance.charge','finance.close') THEN RAISE EXCEPTION 'QA finance audit failure'; END IF; RETURN NEW; END; $$`);
  await query(db,'CREATE TRIGGER qa_finance_audit_failure BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_finance_audit()');
  try{
    await assert.rejects(mutateFinance(db,actor,{type:'charge',personId:r.person_id,caseId:r.case_id,amount:'123.45',expenseId:null,note:'QA rollback must leave no partial financial effect',requestId:randomUUID(),revision:before.revision}));
    await assert.rejects(mutateFinance(db,actor,{type:'close',counted:before.cash,note:'QA closure must rollback with audit failure',requestId:randomUUID(),revision:before.revision}));
  }finally{await query(db,'DROP TRIGGER qa_finance_audit_failure ON audit_events');await query(db,'DROP FUNCTION qa_fail_finance_audit()');}
  const after=await financeOverview(db,actor,null,1,50);assert.equal(after.revision,before.revision);assert.equal(after.total,before.total);assert.equal(after.receivable,before.receivable);assert.equal(after.sessions.length,before.sessions.length);assert.ok(after.open);assert.equal(after.cash,before.cash);
  assert.deepEqual(await query(db,'SELECT revision,sequence FROM finance_state WHERE office_id=$1',[r.office_id]),stateBefore);
  assert.deepEqual(await query(db,'SELECT count(*)::int AS n FROM finance_requests'),requestsBefore);
  const [negative]=await query<{n:number}>(db,'SELECT count(*)::int AS n FROM (SELECT person_id,case_id FROM finance_entries GROUP BY person_id,case_id HAVING sum(receivable_delta)<0 OR sum(advance_delta)<0 OR sum(third_delta)<0) s');assert.equal(negative.n,0);
  const totals=await query<{receivable:string;advance:string;third:string}>(db,'SELECT sum(receivable_delta)::text AS receivable,sum(advance_delta)::text AS advance,sum(third_delta)::text AS third FROM finance_entries WHERE office_id=$1',[r.office_id]);assert.equal(money(cents(totals[0].receivable)),after.receivable);assert.equal(money(cents(totals[0].advance)),after.advance);assert.equal(money(cents(totals[0].third)),after.third);
  const closings=await query<{opening:string;expected:string;delta:string;counted:string;difference:string}>(db,"SELECT s.opening::text,c.expected::text,c.counted::text,c.difference::text,COALESCE((SELECT sum(e.cash_delta) FROM finance_entries e WHERE e.session_id=s.id AND e.method='efectivo'),0)::text AS delta FROM finance_sessions s JOIN finance_closings c ON c.session_id=s.id");
  assert.ok(closings.length);for(const s of closings){assert.equal(cents(s.opening)+cents(s.delta),cents(s.expected));assert.equal(cents(s.counted)-cents(s.expected),cents(s.difference));}
  const [doubleQuote]=await query<{n:number}>(db,'SELECT count(*)::int AS n FROM (SELECT case_id FROM finance_entries e WHERE quote_id IS NOT NULL AND kind=\'charge\' AND NOT EXISTS(SELECT 1 FROM finance_entries r WHERE r.reverses_id=e.id) GROUP BY case_id HAVING count(*)>1) s');assert.equal(doubleQuote.n,0);
  const counts:Record<string,number>={};for(const table of ['persons','case_records','case_quotes','case_requirement_checks','finance_state',...tables])counts[table]=(await query<{n:number}>(db,`SELECT count(*)::int AS n FROM ${table}`))[0].n;
  const archive=await pg.dumpDataDir('gzip');const restored=new PGlite({loadDataDir:archive});
  try{await restored.waitReady;for(const [table,n] of Object.entries(counts))assert.equal((await restored.query<{n:number}>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,n);
    const restoredTotals=(await restored.query<{receivable:string;advance:string;third:string}>('SELECT sum(receivable_delta)::text AS receivable,sum(advance_delta)::text AS advance,sum(third_delta)::text AS third FROM finance_entries WHERE office_id=$1',[r.office_id])).rows;assert.deepEqual(restoredTotals,totals);
    const report={date:'2026-10-29',counts,balances:{receivable:after.receivable,advance:after.advance,third:after.third,cash:after.cash},checks:{sevenFinancialHistoryTablesImmutable:true,entriesCannotBeEdited:true,wrongOfficeHasNoFinancialData:true,wrongOfficeClientReturns404:true,auditFailureRollsBackChargeRevisionSequenceAndRequest:true,auditFailureRollsBackClosure:true,noNegativeCustomerBuckets:true,totalsMatchImmutableLedger:true,closuresReconstructExactly:true,oneActiveBudgetChargePerCase:true,restorationRetainsAllCounts:true,restorationRetainsExactBalances:true},limits:['PGlite local single process; external PostgreSQL, managed recovery and real integrations are not tested.']};
    await writeFile(basename(source).startsWith('.notaria-phase43-')?'docs/evidence/fase-4-3-finanzas-integridad'+(basename(source).includes('restaurada')?'-restaurada':'')+'.json':basename(source).startsWith('.notaria-phase42-')?'docs/evidence/fase-4-2-finanzas-integridad.json':basename(source).startsWith('.notaria-phase41-')?'docs/evidence/fase-4-1-finanzas-integridad.json':'docs/evidence/fase-4-integridad.json',JSON.stringify(report,null,2));console.log('Fase 4: integridad, aislamiento, rollback de cargo/cierre y restauración correctos.');
  }finally{await restored.close();}
}finally{await db.destroy();}
