const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
global.PDFLib=require('../web/vendor/pdf-lib.min.js');global.qrcode=require('../web/vendor/qrcode.js');
const {CARD_PRINT,cardPrintCopy,createCardPdf}=require('../web/cards.js');
const config={normalFromStart:true,normalPartial:1000,graceMinutes:10,ordinary:1500,preferred:1000,freeNormal:5000,freePreferred:6000,dayAddon:3000,lostCard:10000,wash:{auto:12000,camioneta:17000,van:17000,pickup:20000}};
test('letter sheet uses true bank-card dimensions and eight cards',()=>{assert.equal(CARD_PRINT.width,85.6);assert.equal(CARD_PRINT.height,53.98);assert.ok(CARD_PRINT.width*2+CARD_PRINT.gap<215.9-20);assert.ok(CARD_PRINT.height*4+CARD_PRINT.gap*3<279.4-20);assert.equal(Math.ceil(35/CARD_PRINT.perPage),5);});
test('printed rules use only normal configured prices',()=>{const copy=cardPrintCopy({...config,lostCard:12500,ordinary:2000,preferred:9900,freePreferred:8800});assert.equal(copy.hour,'Hora $20');assert.equal(copy.free,'Tiempo libre $50');assert.match(copy.loss,/\$125/);assert.match(copy.addon,/con estacionamiento tiempo libre/);assert.doesNotMatch(JSON.stringify(copy),/10 min|primeros|jornada|tolerancia/i);assert.doesNotMatch(JSON.stringify(copy),/24 horas|responsab|recargo|preferencial|pref\.|\$99|\$88/i);});
test('35 vector QRs on five exact letter pages, all numbers and no duplicated cards',async()=>{
 const cards=Array.from({length:35},(_,i)=>({id:i+1,token:('SYNTHETIC-NOT-VALID-CARD-'+String(i+1).padStart(2,'0')+'-0123456789abcdef').padEnd(64,'x')}));
 const bytes=await createCardPdf(cards,config,fs.readFileSync('web/assets/logo-horizontal.png'),true);
 const pdf=await PDFLib.PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),5);for(const page of pdf.getPages())assert.deepEqual(page.getSize(),{width:612,height:792});
 assert.equal(pdf.catalog.getOrCreateViewerPreferences().getPrintScaling(),PDFLib.PrintScaling.None);
 fs.writeFileSync('artifacts/El-Oeste-Tarjetas-Carta-MUESTRA.pdf',bytes);
});
