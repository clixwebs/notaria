import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {fiscalCommand,fiscalLines,fiscalContractVersion,simulatedIssuer,simulationLegend,type FiscalSnapshot} from '../src/lib/fiscal-domain.ts';
import {buildFiscalXML,buildFiscalQR,escapeXML} from '../src/server/fiscal-xml.ts';
import {simulatedFiscalAdapter,canSubmit,canConsult,canDiscard,type AdapterInput} from '../src/server/fiscal-adapter.ts';
import {hasPermission} from '../src/server/access.ts';
const id=randomUUID();
const source=[{description:'Honorarios & servicio <de prueba>',quantity:1,unitAmount:'118.00',category:'Honorarios' as const},{description:'Consulta identidad separada',quantity:1,unitAmount:'0.10',category:'Otros' as const},{description:'Custodia prevista',quantity:1,unitAmount:'30.00',category:'Terceros' as const}];
const choices=[{lineIndex:0,tax:'gravado18' as const,purpose:'service' as const},{lineIndex:1,tax:'inafecto' as const,purpose:'identity-query' as const}];
const snapshot:FiscalSnapshot={contractVersion:fiscalContractVersion,mode:'simulation',issuer:simulatedIssuer,receiver:{documentType:'6',documentNumber:'20000000001',name:'Receptor Ficticio & Cía.'},documentType:'01',issueDate:'2026-10-29',reference:'SIM-F001-00000001',series:'SIM-F001',sequence:1,source:{chargeId:id,chargeReference:'CAR-QA',caseId:randomUUID(),personId:randomUUID(),quoteId:randomUUID(),quoteVersion:1},...fiscalLines(source,choices,'118.10'),legend:simulationLegend};
test('contrato fiscal: preserva bruto exacto, separa consulta de identidad y excluye terceros',()=>{
  assert.equal(snapshot.base,'100.10');assert.equal(snapshot.tax,'18.00');assert.equal(snapshot.total,'118.10');assert.equal(snapshot.lines.length,2);assert.equal(snapshot.lines[1].purpose,'identity-query');
  assert.throws(()=>fiscalLines(source,[...choices,{lineIndex:2,tax:'inafecto',purpose:'service'}],'118.10'));
  assert.throws(()=>fiscalLines(source,choices,'148.10'));
  assert.throws(()=>fiscalLines(source,[choices[0],choices[0]],'118.10'));
});
test('redondeo del ejercicio: céntimos por línea, precios finales y totales reproducibles',()=>{
  const lines=Array.from({length:30},(_,i)=>({description:'Fracción '+i,quantity:3,unitAmount:'0.01',category:'Honorarios' as const}));
  const result=fiscalLines(lines,lines.map((_,lineIndex)=>({lineIndex,tax:'gravado18',purpose:'service'})),'0.90');
  assert.equal(result.base,'0.90');assert.equal(result.tax,'0.00');assert.equal(result.total,'0.90');
  const exo=fiscalLines([source[0]],[{lineIndex:0,tax:'exonerado',purpose:'service'}],'118.00');assert.equal(exo.base,'118.00');assert.equal(exo.tax,'0.00');
});
test('XML: escape, caracteres ilegales, señal de simulación, impuestos y ausencia de firma',()=>{
  const xml=buildFiscalXML(snapshot);assert.match(xml,/UBLVersionID>2.1/);assert.match(xml,/Honorarios &amp; servicio &lt;de prueba&gt;/);assert.match(xml,/CONSULTA_IDENTIDAD/);assert.match(xml,/currencyID="PEN">118.10/);assert.match(xml,/SIN ENVÍO A SUNAT/);assert.doesNotMatch(xml,/<ds:Signature|<Signature|SignatureValue|DigestValue/);
  assert.equal(escapeXML('"<&\''),'&quot;&lt;&amp;&apos;');assert.throws(()=>escapeXML('Control\u0001'));assert.throws(()=>escapeXML('\ud800'));
});
test('QR: codificación real decodificable, mismo total/IGV/huella, marcador no fiscal',()=>{
  const xmlHash=createHash('sha256').update(buildFiscalXML(snapshot)).digest('hex');const payload=buildFiscalQR(snapshot,xmlHash);const qr=QRCode.create(payload,{errorCorrectionLevel:'M'});
  const scale=6,margin=4,size=(qr.modules.size+margin*2)*scale;const pixels=new Uint8ClampedArray(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const mx=Math.floor(x/scale)-margin,my=Math.floor(y/scale)-margin;const black=mx>=0&&my>=0&&mx<qr.modules.size&&my<qr.modules.size&&qr.modules.get(my,mx);const at=(y*size+x)*4;pixels[at]=pixels[at+1]=pixels[at+2]=black?0:255;pixels[at+3]=255;}
  assert.equal(jsQR(pixels,size,size)?.data,payload);assert.ok(payload.startsWith('NOTARIAOS:SIMULACION:v1|00000000000|01|SIM-F001|00000001|18.00|118.10|'));assert.ok(payload.endsWith('SHA256:'+xmlHash+'|SIN-FIRMA|'));
});
const input=(scenario:AdapterInput['scenario']):AdapterInput=>({key:id,xmlHash:'a'.repeat(64),scenario,attempt:1,receipt:null});
test('adaptador: timeout posterior exige consulta y conserva una sola recepción por clave/huella',()=>{
  const data=input('timeout-after');const sent=simulatedFiscalAdapter.submit(data);assert.equal(sent.observed.status,'unknown');assert.ok(sent.receipt);
  assert.equal(canSubmit('unknown'),false);assert.equal(canConsult('unknown'),true);assert.equal(canDiscard('unknown'),false);
  const recovered=simulatedFiscalAdapter.consult({...data,receipt:sent.receipt});assert.equal(recovered.observed.status,'accepted');assert.equal(recovered.key,data.key);assert.equal(recovered.xmlHash,data.xmlHash);
  assert.deepEqual(simulatedFiscalAdapter.submit({...data,receipt:sent.receipt}).receipt,sent.receipt);
  assert.throws(()=>simulatedFiscalAdapter.consult({...data,key:randomUUID(),receipt:sent.receipt}));
});
test('adaptador: timeout previo, consulta no encontrado y reintento de la misma clave; rechazo distinto de fallo',()=>{
  const data=input('timeout-before');assert.equal(simulatedFiscalAdapter.submit(data).observed.status,'unknown');assert.equal(simulatedFiscalAdapter.consult(data).observed.status,'not-found');assert.equal(simulatedFiscalAdapter.submit({...data,attempt:2}).observed.status,'accepted');
  assert.equal(simulatedFiscalAdapter.submit(input('unavailable')).observed.status,'technical-error');assert.equal(simulatedFiscalAdapter.submit(input('reject')).observed.status,'rejected');assert.equal(simulatedFiscalAdapter.submit(input('processing')).observed.status,'processing');assert.equal(canDiscard('accepted'),false);
});
test('frontera de entrada: sin importes aportados, modo real, URL ni campos XML externos',()=>{
  const command={type:'prepare',requestId:randomUUID(),revision:0,chargeId:id,documentType:'01',receiver:snapshot.receiver,taxes:choices,scenario:'accept',acknowledgeSimulation:true};
  assert.equal(fiscalCommand.safeParse(command).success,true);
  for(const extra of [{mode:'production'},{total:'0.01'},{xml:'<!DOCTYPE x>'},{providerUrl:'https://example.test'}])assert.equal(fiscalCommand.safeParse({...command,...extra}).success,false);
  assert.equal(fiscalCommand.safeParse({...command,acknowledgeSimulation:false}).success,false);
  assert.equal(fiscalCommand.safeParse({...command,receiver:{...snapshot.receiver,documentNumber:'123|456'}}).success,false);
});
test('permisos fiscales separados: caja simula y consulta; solo administración prepara y descarta',()=>{
  for(const role of ['administracion','caja','recepcion','abogado','notario']){
    assert.equal(hasPermission(role,'fiscal:read'),role==='administracion'||role==='caja');assert.equal(hasPermission(role,'fiscal:simulate'),role==='administracion'||role==='caja');assert.equal(hasPermission(role,'fiscal:prepare'),role==='administracion');
  }
});
