/* Offline cache contains program assets only, never selected videos/reports. */
const BASE = new URL('./', self.location.href);
const PREFIX = 'courtside-' + BASE.pathname.replace(/[^a-z0-9]/gi, '_') + '-';
const CACHE = PREFIX + 'v4.0.0';
const SHELL = ['index.html','style.css','v4.css','app.mjs','analysis.mjs','strokes.mjs','video-plan.mjs','coaching.mjs','pose-worker.js','pwa.mjs','manifest.webmanifest','icon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const MODEL = ['vendor/vision_bundle.mjs','vendor/wasm/vision_wasm_internal.js','vendor/wasm/vision_wasm_internal.wasm','vendor/wasm/vision_wasm_nosimd_internal.js','vendor/wasm/vision_wasm_nosimd_internal.wasm','models/pose_landmarker_lite.task'];
const ASSETS = [...SHELL,...MODEL];
const pathFor = name => new URL(name,BASE).href;
const allowed = new Set(ASSETS.map(name=>new URL(name,BASE).pathname));
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(pathFor));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
async function inventory(){const cache=await caches.open(CACHE);let count=0;for(const name of ASSETS)if(await cache.match(pathFor(name)))count++;return {count,total:ASSETS.length,ready:count===ASSETS.length,version:'v4'};}
let warming=null;
async function warm(port){
  const cache=await caches.open(CACHE);
  for(let i=0;i<ASSETS.length;i++){
    const name=ASSETS[i],url=pathFor(name);
    if(!(await cache.match(url))){
      const controller=new AbortController();let timeout;
      const keepAlive=()=>{clearTimeout(timeout);timeout=setTimeout(()=>controller.abort(),180000);};keepAlive();
      try{
        const response=await fetch(url,{cache:'reload',signal:controller.signal});
        if(!response.ok)throw new Error('资源下载失败：'+name+' ('+response.status+')');
        if(response.body){
          const reader=response.body.getReader(),chunks=[];let bytes=0,lastNotice=0;
          while(true){const {done,value}=await reader.read();if(done)break;keepAlive();chunks.push(value);bytes+=value.byteLength;if(Date.now()-lastNotice>250){port.postMessage({type:'progress',done:i,total:ASSETS.length,bytes});lastNotice=Date.now();}}
          const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');
          await cache.put(url,new Response(new Blob(chunks),{status:200,headers}));
        }else await cache.put(url,response);
      }finally{clearTimeout(timeout);}
    }
    port.postMessage({type:'progress',done:i+1,total:ASSETS.length});
  }
  const status=await inventory();if(!status.ready)throw new Error('缓存尚不完整，请重试。');
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  port.postMessage({type:'ready',...status});
}
self.addEventListener('message',event=>{
  const port=event.ports[0];if(!port)return;
  if(event.data?.type==='status')event.waitUntil(inventory().then(data=>port.postMessage({type:'status',...data})).catch(error=>port.postMessage({type:'error',message:error.message})));
  if(event.data?.type==='warm'){
    if(warming){port.postMessage({type:'error',message:'另一个窗口正在下载离线资源，请稍后再试。'});return;}
    warming=warm(port).catch(error=>port.postMessage({type:'error',message:error.message})).finally(()=>{warming=null;});event.waitUntil(warming);
  }
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin)return;
  const isHome=url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname;
  if(!isHome&&!allowed.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),key=isHome?pathFor('index.html'):new URL(url.pathname,BASE.origin).href;
    const saved=await cache.match(key);if(saved)return saved;
    try{const response=await fetch(request);if(response.ok)await cache.put(key,response.clone());return response;}
    catch(error){return new Response('离线资源未准备完整。请联网后点击“缓存模型（可选）”。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
  })());
});
