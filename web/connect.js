'use strict';
const target=new URLSearchParams(location.search).get('target')||'';
if(/^http:\/\/[0-9.]+:8788\/[A-Za-z0-9_-]{20,100}$/.test(target)){
  const qr=qrcode(0,'M');qr.addData(target);qr.make();document.querySelector('#connection-qr').innerHTML=qr.createSvgTag({cellSize:4,margin:16,scalable:true});
}
