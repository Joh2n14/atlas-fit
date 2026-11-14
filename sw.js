/* ATLAS Fit — cache de l’application.
 * Les appels Open Food Facts ne sont pas mis en cache par ce service worker.
 */
const VERSION='atlas-fit-shell-v1.7-crossfit';
const SHELL=["./", "./index.html", "./app.js", "./data.js", "./exercise-demos.js", "./atlas-v3.js", "./nutrition-smart.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./custom-workout.css", "./custom-workout-model.js", "./custom-workout.js", "./crossfit.css", "./crossfit-data.js", "./crossfit.js"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('atlas-fit-shell-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(new URL(event.request.url).pathname.includes('/media/exercises/')){
    event.respondWith(caches.open(VERSION).then(async cache=>{
      const cached=await cache.match(event.request); if(cached)return cached;
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }));return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
