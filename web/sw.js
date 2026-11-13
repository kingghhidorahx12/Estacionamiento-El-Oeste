const CACHE='oeste-shell-v4';
const FILES=['/','/index.html','/app.js','/icons.js','/style.css','/atelier.css','/assets/mark.svg','/assets/icon-180.png','/assets/icon-192.png','/assets/icon-512.png','/assets/icons.svg','/assets/oeste-panorama.png','/assets/fonts/Manrope-regular.ttf','/assets/fonts/Manrope-semibold.ttf','/icon.svg','/manifest.webmanifest','/vendor/jsQR.js','/vendor/qrcode.js','/vendor/tesseract.min.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==location.origin||url.pathname.startsWith('/api/')||event.request.method!=='GET')return;
  // Only the application shell and public OCR models are cached; no photos or financial responses.
  event.respondWith(fetch(event.request).then(response=>{if(response.ok&&(FILES.includes(url.pathname)||url.pathname.startsWith('/vendor/'))){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(value=>value||new Response('Servidor local sin conexión',{status:503}))));
});
