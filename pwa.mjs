const $=id=>document.getElementById(id);
const message=$('pwa-status');
let registration=null,deferredInstall=null,ready=false,busy=false;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isApple=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function show(text,error=false){message.textContent=text;message.classList.toggle('pwa-error',error);}
function updateNetwork(){
  $('network-state').textContent=navigator.onLine?'在线':'离线';
  if(ready)show(navigator.onLine?'离线资源已准备好。电脑不用开着，断网也可分析。':'当前离线，程序和模型已就绪，可以选视频分析。');
  if(standalone()){$('install-app').textContent='安装说明';$('pwa-title').textContent='手机练习，直接开始。';}
}
function askWorker(type,onProgress){
  return new Promise((resolve,reject)=>{
    const worker=registration?.active||navigator.serviceWorker.controller;if(!worker){reject(new Error('离线服务尚未启动，请稍后再试。'));return;}
    const channel=new MessageChannel();let timer;
    const armTimeout=()=>{clearTimeout(timer);timer=setTimeout(()=>{channel.port1.close();reject(new Error('离线资源下载超时，请检查网络后重试。'));},180000);};
    armTimeout();
    channel.port1.onmessage=({data})=>{armTimeout();if(data.type==='progress'){onProgress?.(data);return;}clearTimeout(timer);channel.port1.close();data.type==='error'?reject(new Error(data.message)):resolve(data);};
    worker.postMessage({type},[channel.port2]);
  });
}
async function prepare(){
  if(!registration||busy)return;busy=true;$('offline-prepare').disabled=true;$('offline-progress').hidden=false;$('offline-progress').value=0;
  show('正在把程序和姿态模型保存到当前设备，请保持页面打开。');
  try{
    const result=await askWorker('warm',data=>{$('offline-progress').value=data.done/data.total*100;show(data.bytes?`正在下载离线组件 ${data.done+1}/${data.total} · 本项已接收 ${(data.bytes/1000000).toFixed(1)}MB`:`正在准备离线资源 ${data.done}/${data.total}，首次下载约25MB。`);});
    ready=result.ready;if(!ready)throw new Error('离线资源尚未准备完整。');
    $('offline-prepare').textContent='检查模型缓存';updateNetwork();
    document.body.dataset.offlineReady='true';
    if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  }catch(error){ready=false;document.body.dataset.offlineReady='false';show(error.message+' 未完成前请保持联网使用。',true);}
  finally{busy=false;$('offline-prepare').disabled=false;$('offline-progress').hidden=true;}
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;$('install-app').textContent='安装到手机桌面';});
window.addEventListener('appinstalled',()=>{deferredInstall=null;updateNetwork();});
$('install-app').addEventListener('click',async()=>{
  if(deferredInstall){const event=deferredInstall;deferredInstall=null;try{await event.prompt();await event.userChoice;}catch(_){$('install-guide').showModal();}return;}
  $('apple-install').classList.toggle('preferred',isApple());$('android-install').classList.toggle('preferred',!isApple());$('install-guide').showModal();
});
$('install-close').addEventListener('click',()=>$('install-guide').close());
$('offline-prepare').addEventListener('click',prepare);
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);
if('serviceWorker' in navigator && window.isSecureContext){
  navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:'./',updateViaCache:'none'}).then(async reg=>{
    registration=await navigator.serviceWorker.ready;
    const result=await askWorker('status');ready=result.ready;document.body.dataset.offlineReady=String(ready);
    $('offline-prepare').disabled=false;
    if(ready){$('offline-prepare').textContent='检查模型缓存';updateNetwork();}
    else show('联网可直接导入视频。缓存模型是可选项，准备好后可断网使用。');
    reg.update().catch(()=>{});
  }).catch(error=>show('离线服务未启动。请在手机 Safari 或 Chrome 中通过 HTTPS 打开。'+error.message,true));
}else show('当前地址或浏览器不支持离线安装。请用 HTTPS 链接在手机 Safari 或 Chrome 中打开。',true);
updateNetwork();
