const C='ef-adaptada-v3';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','native.js','fonts.css',
'AtkinsonHyperlegible-400-latin.woff2','AtkinsonHyperlegible-400-latin-ext.woff2','AtkinsonHyperlegible-700-latin.woff2','AtkinsonHyperlegible-700-latin-ext.woff2','LilitaOne-400-latin.woff2','LilitaOne-400-latin-ext.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
