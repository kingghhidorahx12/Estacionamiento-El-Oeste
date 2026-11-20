const VERSION='__CLOUD_VERSION__',CACHE='oeste-cloud-shell-'+VERSION,FILES=__CLOUD_FILES__;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));await self.skipWaiting();}));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(key=>(key.startsWith('oeste-cloud-shell-')||key.startsWith('oeste-shell-'))&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
  for(const client of await self.clients.matchAll({type:'window'}))client.postMessage({type:'cloud-ui-version',version:VERSION});
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/health'||event.request.method!=='GET')return;
 const allowed=FILES.includes(url.pathname+url.search)||FILES.includes(url.pathname),vendor=url.pathname.startsWith('/vendor/');
 if(!allowed&&!vendor)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(vendor){const cached=await cache.match(event.request);if(cached)return cached;}
  try{
   const response=await fetch(new Request(event.request,{cache:vendor?'default':'no-store'}));
   if(response.ok)event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
   return response;
  }catch{
   return await cache.match(event.request)||new Response('Servidor sin conexión',{status:503});
  }
 })());
});
