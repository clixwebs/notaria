// Explicit release command only: never imported by the application or migrations.
import {randomUUID,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import type {Kysely} from 'kysely';
import {platform,query,audit,type Database} from '../src/server/platform.ts';
import {createPersistentCase,mutateCase} from '../src/server/cases.ts';
import {mutateFinance,financeOverview} from '../src/server/finance.ts';
import {publishTariff} from '../src/server/tariffs.ts';
import {mutateFiscal} from '../src/server/fiscal.ts';
import {personInput,validateFile} from '../src/server/validation.ts';
import {limaDate} from '../src/lib/domain.ts';
import {acts,fromMinor,toMinor} from '../src/lib/case-domain.ts';
import type {actor} from '../src/server/access.ts';

const marker='demo-client-20261029-v1';
const mode=process.env.NOTARIA_DEMO_TARGET;
if(!['qa','production'].includes(mode||'')||process.env.NOTARIA_DEMO_CONFIRM!==marker||!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET||process.env.VERCEL||process.env.NOTARIA_MIGRATE)
  throw new Error('Explicit external PostgreSQL demo release configuration required.');
if(new URL(process.env.DATABASE_URL).hostname!==process.env.NOTARIA_DEMO_EXPECT_HOST)throw new Error('Demo database host does not match the explicit target.');
const {db}=await platform();
try{
 const outcome=await db.transaction().execute(async tx=>{
  await query(tx,"SELECT pg_advisory_xact_lock(hashtext($1))",[marker]);
  const [staff]=await query<{id:string;name:string;email:string;office:string;role:'administracion';mfa:boolean}>(tx,'SELECT u.id,u.name,u.email,s.office_id AS office,s.role,u."twoFactorEnabled" AS mfa FROM "user" u JOIN staff s ON s.user_id=u.id WHERE lower(u.email)=lower($1) AND s.active AND s.role=\'administracion\'',[process.env.NOTARIA_DEMO_ADMIN_EMAIL]);
  if(!staff)throw new Error('The designated active administrator is required.');
  const user={...staff,sessionId:'explicit-demo-release'} satisfies Awaited<ReturnType<typeof actor>>;
  const [done]=await query(tx,"SELECT id FROM audit_events WHERE action='demo.seed.complete' AND resource=$1",[marker]);
  if(done)return {replayed:true};
  const [existing]=await query<{n:number}>(tx,'SELECT ((SELECT count(*) FROM persons)+(SELECT count(*) FROM case_records)+(SELECT count(*) FROM finance_entries)+(SELECT count(*) FROM tariff_items)+(SELECT count(*) FROM private_documents))::int AS n');
  if(existing.n)throw new Error('Refusing to mix the demo dataset with existing business records.');
  // Domain commands keep their validation, monetary rules and audit. Their inner
  // transactions share this release transaction, so any failure rolls back ALL data.
  const domainDb={transaction:()=>({execute:<T>(fn:(connection:typeof tx)=>Promise<T>)=>fn(tx)})} as unknown as Kysely<Database>;
  await audit(tx,user.id,'demo.seed.start',marker);
  const names=['Valeria Campos','Mateo Rivas','Lucía Benavides','Diego Salazar','Camila Paredes','Gabriel Montes','Isabel Córdova','Sebastián Prado','Renata Beltrán','Nicolás Fuentes','Mariana Robles','Alonso del Valle'];
  const people:string[]=[];
  for(const [i,name] of names.entries()){
   const p=personInput.parse({name:'DEMO · '+name,documentType:'DEMO',documentNumber:'DEMO-'+String(i+1).padStart(4,'0')});
   const id=randomUUID();people.push(id);
   await query(tx,'INSERT INTO persons(id,office_id,name,document_type,document_number) VALUES($1,$2,$3,$4,$5)',[id,user.office,p.name,p.documentType,p.documentNumber]);
   await audit(tx,user.id,'person.create',id);
  }
  const tariffs=[['DEMO-CV','DEMO · Compraventa, honorarios','1200.00',acts[0]],['DEMO-CF','DEMO · Certificación de firmas','45.00',acts[1]],['DEMO-CN','DEMO · Carta notarial','180.00',acts[2]],['DEMO-COP','DEMO · Copias de trabajo','12.50',null],['DEMO-GES','DEMO · Gestión administrativa','35.00',null],['DEMO-TER','DEMO · Estimación por cuenta de terceros','250.00',null]] as const;
  const tariffVersions:string[]=[];
  for(const [i,t] of tariffs.entries()){
   const [state]=await query<{revision:number}>(tx,'SELECT revision FROM tariff_state WHERE office_id=$1',[user.office]);
   const result=await publishTariff(domainDb,user,{requestId:randomUUID(),revision:state?.revision||1,tariffId:null,baseVersion:0,code:t[0],description:t[1],category:i===5?'Terceros':i<3?'Honorarios':'Otros',unitAmount:t[2],act:t[3],active:true,reason:'DEMO: importes ficticios para presentación comercial, no tarifario aprobado.'});
   tariffVersions.push(result.id);
  }
  const finance=async(command:Record<string,unknown>)=>{
   const [state]=await query<{revision:number}>(tx,'SELECT revision FROM finance_state WHERE office_id=$1',[user.office]);
   const result=await mutateFinance(domainDb,user,{...command,requestId:randomUUID(),revision:state?.revision??0});
   if(!result||typeof result!=='object'||!('id' in result)||typeof result.id!=='string')throw new Error('Missing finance command identity.');
   return {id:result.id};
  };
  await finance({type:'open',opening:'500.00',replenishment:'0.00',note:'DEMO: fondo ficticio de apertura para presentación.'});
  const supplier=await finance({type:'supplier',name:'DEMO · Servicios Registrales Ficticios',document:'DEMO-PROV-001'});
  const subjects=['Compraventa de departamento ficticio en Miraflores','Certificación de contrato de servicios ficticio','Carta de requerimiento de pago ficticia','Compraventa de inmueble ficticio en San Borja','Certificación de autorización ficticia','Carta de devolución de garantía ficticia','Compraventa de local ficticio en Surco','Certificación de declaración ficticia','Carta de resolución de contrato ficticia'];
  const cases:string[]=[];
  for(const [i,subject] of subjects.entries()){
   const type=i%3,act=acts[type],personId=people[i];
   console.log('DEMO case',i+1);
   const record=await createPersistentCase(domainDb,user,{requestId:randomUUID(),act,subject:'DEMO · '+subject,personId});cases.push(record.id);
   const mutate=async(command:Record<string,unknown>)=>{
    const [state]=await query<{revision:number}>(tx,'SELECT revision FROM case_records WHERE id=$1',[record.id]);
    console.log('DEMO command',i+1,command.type);
    return mutateCase(domainDb,user,record.id,{...command,revision:state.revision});
   };
   if(type===0)await mutate({type:'participant',personId:people[9+i/3],role:'Comprador ficticio'});
   await mutate({type:'note',body:'DEMO: todas las personas, documentos e importes son ficticios. Sin validez jurídica ni efectos reales. No enviar comunicaciones.'});
   await mutate({type:'task',title:['DEMO · Solicitar antecedentes ficticios','DEMO · Revisar documento de ejercicio','DEMO · Coordinar diligencia ficticia'][type],dueDate:limaDate()});
   if(i>=3){
    const requirements=await query<{id:string}>(tx,'SELECT id FROM case_requirements WHERE case_id=$1 ORDER BY title',[record.id]);
    const count=i>=6?requirements.length:1;
    for(const r of requirements.slice(0,count))await mutate({type:'requirement',requirementId:r.id,done:true,note:'DEMO: comprobación administrativa ficticia para mostrar el flujo; sin validación profesional.',evidenceId:null});
    await mutate({type:'draft',baseVersion:0,body:'BORRADOR DEMO · SIN VALIDEZ JURÍDICA\n\n'+subject+'.\nEste texto sirve exclusivamente para mostrar el versionado del expediente. No constituye minuta, contrato aprobado, certificación ni instrumento notarial. Todos los participantes son ficticios.'});
    if(i===8)await mutate({type:'draft',baseVersion:1,body:'BORRADOR DEMO · VERSIÓN 2 · SIN VALIDEZ JURÍDICA\n\n'+subject+'.\nSe ajustó el texto ficticio para mostrar la conservación de versiones anteriores. Pendiente de revisión profesional; no enviar ni presentar.'});
   }
   const own=tariffs[type];
   const lines=[{description:own[1],quantity:type===1?2:1,unitAmount:own[2],category:'Honorarios',tariffVersionId:tariffVersions[type]},{description:tariffs[3][1],quantity:2,unitAmount:tariffs[3][2],category:'Otros',tariffVersionId:tariffVersions[3]},...(type===0?[{description:tariffs[5][1],quantity:1,unitAmount:tariffs[5][2],category:'Terceros',tariffVersionId:tariffVersions[5]}]:[])];
   await mutate({type:'quote',baseVersion:0,validUntil:'2027-12-31',lines});
   const [quote]=await query<{id:string;total:string}>(tx,'SELECT id,total::text FROM case_quotes WHERE case_id=$1',[record.id]);
   const [participant]=await query<{id:string}>(tx,"SELECT id FROM case_participants WHERE case_id=$1 AND role='Solicitante'",[record.id]);
   if(i!==0&&i!==4)await mutate({type:'accept-quote',quoteId:quote.id,participantId:participant.id,reference:'DEMO: aceptación ficticia del presupuesto para demostración, sin cliente real.'});
   let evidenceId:string|undefined;
   if(i<4){
    const docId=randomUUID(),versionId=randomUUID();evidenceId=versionId;
    const content=Buffer.from('DOCUMENTO DEMO · SIN VALIDEZ JURÍDICA\n'+subject+'\nContenido sintético generado para presentación comercial. No contiene documentos de identidad ni información real.\n');
    const filename='DEMO-sustento-'+String(i+1)+'.txt';validateFile(content,filename);
    await query(tx,'INSERT INTO private_documents(id,office_id,person_id,title) VALUES($1,$2,$3,$4)',[docId,user.office,personId,'DEMO · Sustento ficticio '+String(i+1)]);
    await query(tx,'INSERT INTO document_versions(id,document_id,version,filename,media_type,size,sha256,content,created_by) VALUES($1,$2,1,$3,$4,$5,$6,$7,$8)',[versionId,docId,filename,'text/plain',content.length,createHash('sha256').update(content).digest('hex'),content,user.id]);
    await audit(tx,user.id,'document.upload',versionId);
    if(i!==1){await query(tx,"UPDATE document_versions SET status='liberado',review_note=$1,reviewed_by=$2 WHERE id=$3",['DEMO: texto sintético generado e inspeccionado para demostración; sin documento real ni certificación antivirus.',user.id,versionId]);await audit(tx,user.id,'document.liberado',versionId);}
   }
   if(i!==0&&i!==4){
    const charge=await finance({type:'quote-charge',personId,caseId:record.id,quoteId:quote.id,note:'DEMO: cargo ficticio solo de conceptos propios; terceros excluidos.'});
    const ownTotal=fromMinor(toMinor(quote.total)-(type===0?25000n:0n));
    if(i===1||i===5||i===8)await finance({type:'collect',personId,caseId:record.id,targetId:charge.id,amount:ownTotal,method:i===1?'efectivo':'transferencia',reference:'DEMO-COBRO-'+String(i),note:'DEMO: cobro ficticio aplicado al cargo propio.'});
    if(i===2)await finance({type:'collect',personId,caseId:record.id,targetId:charge.id,amount:'80.00',method:'efectivo',reference:'DEMO-PARCIAL',note:'DEMO: cobro parcial ficticio, conserva saldo pendiente.'});
    if(i===3){
     const advance=await finance({type:'advance',personId,caseId:record.id,amount:'400.00',method:'transferencia',reference:'DEMO-ANTICIPO',note:'DEMO: anticipo ficticio separado de deuda y custodia.'});
     await finance({type:'apply',personId,caseId:record.id,amount:'300.00',sourceId:advance.id,targetId:charge.id,note:'DEMO: aplicación parcial del anticipo al cargo propio.'});
     const fund=await finance({type:'third-in',personId,caseId:record.id,amount:'250.00',method:'transferencia',reference:'DEMO-CUSTODIA',note:'DEMO: fondo de terceros ficticio; no es ingreso propio.'});
     const expense=await finance({type:'expense',personId,caseId:record.id,amount:'100.00',supplierId:supplier.id,bucket:'third',dueDate:limaDate(),evidenceId,note:'DEMO: gasto ficticio por cuenta de terceros, con sustento sintético.'});
     await finance({type:'third-out',personId,caseId:record.id,amount:'100.00',sourceId:fund.id,targetId:expense.id,method:'transferencia',reference:'DEMO-TERCEROS',note:'DEMO: pago ficticio al proveedor desde custodia específica.'});
    }
    if(i===1||i===2){
     const [state]=await query<{revision:number}>(tx,'SELECT revision FROM fiscal_state WHERE office_id=$1',[user.office]);
     await mutateFiscal(domainDb,user,{type:'prepare',requestId:randomUUID(),revision:state?.revision??0,chargeId:charge.id,documentType:'03',receiver:{name:'RECEPTOR DEMO FICTICIO '+String(i),documentType:'7',documentNumber:'DEMO000'+String(i)},taxes:lines.filter(l=>l.category!=='Terceros').map((_,lineIndex)=>({lineIndex,tax:'gravado18',purpose:'service'})),scenario:'accept',acknowledgeSimulation:true});
    }
   }
  }
  await audit(tx,user.id,'demo.seed.complete',marker);
  return {replayed:false,caseIds:cases};
 });
 const [counts]=await query(db,`SELECT (SELECT count(*)::int FROM persons) AS persons,(SELECT count(*)::int FROM case_records) AS cases,(SELECT count(*)::int FROM case_quotes) AS quotes,(SELECT count(*)::int FROM private_documents) AS documents,(SELECT count(*)::int FROM tariff_items) AS tariffs,(SELECT count(*)::int FROM finance_entries) AS movements,(SELECT count(*)::int FROM fiscal_documents) AS fiscal_documents,(SELECT count(*)::int FROM staff) AS staff,(SELECT count(*)::int FROM "user" WHERE "twoFactorEnabled") AS enrolled_accounts`);
 const [admin]=await query<{id:string;name:string;email:string;office:string;role:'administracion';mfa:boolean}>(db,'SELECT u.id,u.name,u.email,s.office_id AS office,s.role,u."twoFactorEnabled" AS mfa FROM "user" u JOIN staff s ON s.user_id=u.id WHERE lower(u.email)=lower($1)',[process.env.NOTARIA_DEMO_ADMIN_EMAIL]);
 const balances=await financeOverview(db,{...admin,sessionId:'explicit-demo-verification'},null);
 const report={marker,target:mode,at:new Date().toISOString(),...outcome,counts,balances:{cash:balances.cash,receivable:balances.receivable,advance:balances.advance,third:balances.third,expense_pending:balances.expense_pending},realProvidersEnabled:false};
 writeFileSync('docs/evidence/demo-'+mode+'.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{await db.destroy();}
