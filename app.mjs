import {visible, nearestFrame, CONNECTIONS} from './analysis.mjs';
import {analyzeStroke as analyze, measurementForStroke as measurements, configFor, SOURCES_V2 as SOURCES} from './strokes.mjs';
import {VIDEO_LIMITS,durationError,sizeError,makePlan,formatTime,markerCovered} from './video-plan.mjs';
import {buildAdvice} from './coaching.mjs';
import {buildPlayerAdvice} from './player-coaching.mjs';
import {initializePlayers,renderPlayer,selectedReference,selectedPlayerId} from './player-ui.mjs';
const $ = id => document.getElementById(id);
const video=$('video'), overlay=$('overlay'), ctx=overlay.getContext('2d');
const referenceClips=new Map();
const state={url:null,file:null,duration:0,plan:null,advice:null,frames:[],result:null,prep:0,contact:null,trophy:null,busy:false,token:0,worker:null,requests:new Map(),requestId:0,referenceURL:null,loading:false,loadId:0};
const controls=['play','scrub','back-frame','next-frame','mark-prep','mark-trophy','mark-contact','clear-marks','stroke','hand','view','ordinary','analyze','video-file','video-file-empty','speed','analysis-scope','clip-start','clip-end','set-clip-start','set-clip-end'];
const escapeTime=t=>`${Number(t).toFixed(2)}s`;
const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
const config=()=>({stroke:$('stroke').value,trophy:state.trophy,width:video.videoWidth,height:video.videoHeight,hand:$('hand').value,view:$('view').value,ordinary:$('ordinary').checked,prep:state.prep,contact:state.contact,duration:state.duration,plan:state.plan,learningPlayer:selectedPlayerId()});
function syncControls(){
  const loaded=!!state.url&&!state.loading;
  for(const id of controls){
    const independent=['stroke','hand','view','ordinary','speed','video-file','video-file-empty'].includes(id);
    $(id).disabled=state.busy||state.loading||(!independent&&!loaded);
  }
  $('export').disabled=!state.result||state.busy||state.loading;
}
function setBusy(busy){state.busy=busy;$('busy-overlay').hidden=!busy;$('progress').hidden=!busy;syncControls();document.body.dataset.busy=String(busy);}
function clearResults(){state.frames=[];state.result=null;state.plan=null;state.advice=null;$('results-body').hidden=true;$('results-empty').hidden=false;$('findings').replaceChildren();$('metrics').replaceChildren();$('export').disabled=true;draw();}
function stopWorker(){
  if(state.worker)state.worker.terminate();state.worker=null;
  for(const {reject,timer} of state.requests.values()){clearTimeout(timer);reject(new Error('分析已停止'));}
  state.requests.clear();
}
function cancel(){
  if(!state.busy)return;
  state.token++;stopWorker();setBusy(false);clearResults();video.pause();status('已停止。视频仍留在这里，可以重新分析。');updateTime();
}
function workerRequest(type,payload={},transfer=[]){
  const worker=state.worker;if(!worker)return Promise.reject(new Error('分析已停止'));
  const id=++state.requestId;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{state.requests.delete(id);reject(new Error(type==='init'?'模型加载超时，请重试。':'当前画面处理超时，请用更短的视频重试。'));},type==='init'?90000:30000);
    state.requests.set(id,{resolve,reject,timer});worker.postMessage({id,type,...payload},transfer);
  });
}
function startWorker(){
  stopWorker();state.worker=new Worker(new URL('./pose-worker.js',import.meta.url));
  state.worker.onmessage=({data})=>{const request=state.requests.get(data.id);if(!request)return;clearTimeout(request.timer);state.requests.delete(data.id);data.ok?request.resolve(data):request.reject(new Error(data.error));};
  state.worker.onerror=event=>{const message=event.message||'浏览器无法运行本地模型。请尝试近期版本的 Chrome 或 Safari。';for(const {reject,timer} of state.requests.values()){clearTimeout(timer);reject(new Error(message));}state.requests.clear();};
}
function waitEvent(target,event,timeout=12000){
  return new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);target.removeEventListener(event,done);target.removeEventListener('error',fail);};
    const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(new Error('浏览器无法解码这段视频。请尝试导出 H.264 MP4 后重试。'));};
    const timer=setTimeout(()=>{cleanup();reject(new Error('视频读取超时。请尝试较短的 H.264 MP4。'));},timeout);
    target.addEventListener(event,done,{once:true});target.addEventListener('error',fail,{once:true});
  });
}
async function seek(t){
  const target=Math.max(0,Math.min(state.duration-.025,t));
  if(Math.abs(video.currentTime-target)<.002&&video.readyState>=2)return;
  const ready=waitEvent(video,'seeked');video.currentTime=target;await ready;
  await new Promise(r=>requestAnimationFrame(()=>r()));
}
async function loadVideo(file){
  if(!file)return;if(state.busy){status('请先停止分析，再更换视频。',true);return;}
  const fileError=sizeError(file.size);if(fileError){status(fileError,true);return;}
  if(!file.type.startsWith('video/')&&!/\.(mp4|mov|m4v|webm|avi)$/i.test(file.name)){status('请选择视频文件。',true);return;}
  const loadId=++state.loadId;state.loading=true;syncControls();state.token++;video.pause();clearResults();
  if(state.url)URL.revokeObjectURL(state.url);
  state.url=URL.createObjectURL(file);state.file=file.name;state.duration=0;state.prep=0;state.contact=null;state.trophy=null;
  video.hidden=false;overlay.hidden=false;$('empty-state').hidden=true;$('overlay-state').hidden=false;$('overlay-state').textContent='等待分析';$('file-name').textContent=file.name;$('file-name').title=file.name;status('正在读取视频…');
  try{
    const ready=waitEvent(video,'loadedmetadata');video.src=state.url;video.load();await ready;
    if(loadId!==state.loadId)return;
    const error=durationError(video.duration);if(error)throw new Error(error);
    state.duration=video.duration;video.playbackRate=Number($('speed').value);$('scrub').max=state.duration;
    $('analysis-scope').value='full';$('clip-start').value='0';$('clip-end').value=Math.min(30,state.duration).toFixed(1);$('clip-start').max=state.duration;$('clip-end').max=state.duration;updateRange();
    if(video.readyState<2)await waitEvent(video,'loadeddata');
    if(loadId!==state.loadId)return;
    updateMarks();updateTime();status(state.duration>30?'长视频已就绪。可先做整段概览，或选一段最多30秒细看动作。':'视频已就绪。分析后会给下一组练法；标记触球参考可获得更具体的建议。');
  }catch(error){
    if(loadId!==state.loadId)return;
    if(state.url)URL.revokeObjectURL(state.url);state.url=null;state.duration=0;state.file=null;video.removeAttribute('src');video.load();video.hidden=true;overlay.hidden=true;$('empty-state').hidden=false;$('overlay-state').hidden=true;$('file-name').textContent='你的训练视频';status(error.message,true);updateMarks();updateTime();
  }finally{if(loadId===state.loadId){state.loading=false;syncControls();}}
}
function updateRange(){
  const detail=$('analysis-scope').value==='detail';$('range-detail').hidden=!detail;
  try{const plan=makePlan(state.duration,$('analysis-scope').value,Number($('clip-start').value),Number($('clip-end').value));
    $('range-note').textContent=`${formatTime(plan.start)} 至 ${formatTime(plan.end)} · ${plan.count}个采样画面 · ${plan.overview?'每秒2帧概览，不逐拍判错；想看具体动作请选一小段。':'每秒10帧细看；准备、触球和举拍标记都要在这段里。'}`;
  }catch(error){$('range-note').textContent=state.url?error.message:'先导入视频。最长5分钟，联网直接分析。';}
}
function rangeChanged(){if(state.busy)return;video.pause();clearResults();state.prep=$('analysis-scope').value==='detail'?Number($('clip-start').value):0;state.contact=null;state.trophy=null;updateMarks();updateRange();syncControls();}
function renderAdvice(){
  const advice=state.advice;if(!advice)return;
  const summary=$('coach-summary');summary.replaceChildren(node('span',advice.kind==='player'?'你的学习对象 · 本轮练习计划':advice.kind==='video'?'画面提示 · 值得尝试':advice.kind==='suggestion'?'结合可见动作 · 优化尝试':advice.kind==='general'?'基础练习 · 可以直接试':'先改善拍摄','advice-label'),node('h2',advice.heading),node('p',advice.summary));
  for(const note of advice.notes)summary.append(node('p',note,'advice-note'));
  $('coach-cards').replaceChildren();
  for(const card of advice.cards){
    const article=node('article',null,'coach-card');article.append(node('span',card.priority||'先完成这一步','section-label'),node('h3',card.title));
    if(card.learn){const learn=node('div',null,'player-learn');learn.append(node('h4','向'+card.playerName+'借鉴什么'),node('p',card.learn),node('small',card.provenance==='sourced-inspiration'?'选手借鉴点有来源；具体训练由应用编排。':'这项按所选球员和通用教学编排，不是已核实的球员独家方法。','practice-note'));article.append(learn);}
    if(card.cue){const cue=node('div',null,'court-cue');cue.append(node('span','上场只记这一句'),node('strong',card.cue));article.append(cue);}
    if(card.change)article.append(node('h4','这次只改什么'),node('p',card.change));
    if(card.learn)article.append(node('h4','对照你的视频'));
    article.append(node('p',card.why,'coach-why'));
    if(card.observe)article.append(node('p',card.observe,'observe-task'));
    if(Number.isFinite(card.time)){const jump=node('button',`先看 ${formatTime(card.time)} 的画面 ↗`,'small-button');jump.addEventListener('click',()=>jumpTo(card.time));article.append(jump);}
    const steps=node('ol');for(const step of card.steps)steps.append(node('li',step));article.append(node('h4','下一组怎么练'),steps,node('h4','练完怎么判断是否有用'),node('p',card.check),node('p','不要这样练：'+card.avoid,'coach-avoid'));
    if(card.source&&SOURCES[card.source]){const link=node('a',SOURCES[card.source].title+' ↗','coach-source');link.href=SOURCES[card.source].url;link.target='_blank';link.rel='noopener noreferrer';article.append(link);}
    if(card.rule){const details=node('details');details.append(node('summary','借鉴来源与使用边界'),node('p',card.rule));if(card.inspiration){details.append(node('p',card.inspiration.fact));const link=node('a',card.inspiration.title+' ↗','coach-source');link.href=card.inspiration.url;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}if(card.adaptation)details.append(node('p',card.adaptation));if(card.scope)details.append(node('p','适用练习：'+card.scope));article.append(details);}
    article.append(node('small','练习次数是本次试用的建议安排，不是技术标准；不适时停止。','practice-note'));$('coach-cards').append(article);
  }
  const reference=selectedReference();
  if(advice.kind!=='capture'&&advice.kind!=='player'){const box=node('div',null,'reference-note-result');box.append(node('strong','你选择的学习对象：'+reference.name),node('p',reference.compatible?reference.focus:'当前反手类型不匹配，学习参考不参与这次动作建议。'),node('p','这是额外的观看练习方向，AI测量与建议不会改成职业选手相似度评分。'));if(reference.warnings.length)box.append(node('p',reference.warnings.join(' ')));$('coach-cards').append(box);}
  if(state.plan?.overview){const detail=node('button','以当前播放位置选一段细看 ↗','small-button');detail.addEventListener('click',()=>{const start=Math.max(0,Math.min(state.duration-.5,video.currentTime-2));$('analysis-scope').value='detail';$('clip-start').value=start.toFixed(1);$('clip-end').value=Math.min(state.duration,start+10).toFixed(1);rangeChanged();status('已选好当前附近的片段。标记这次动作后，再点分析。');});summary.append(detail);}
}
async function run(){
  if(!state.url||state.busy||state.loading)return;
  let plan;try{plan=makePlan(state.duration,$('analysis-scope').value,Number($('clip-start').value),Number($('clip-end').value));}catch(error){status(error.message,true);return;}
  video.pause();const token=++state.token;const before=video.currentTime;
  clearResults();setBusy(true);$('progress').value=0;$('busy-label').textContent='加载本机姿态模型';$('busy-detail').textContent='不会上传视频，也不会调用云端大模型';status('正在加载本地模型…');
  const temporary=[];
  try{
    startWorker();await workerRequest('init');if(token!==state.token)return;
    const capture=document.createElement('canvas');const scale=Math.min(1,960/video.videoWidth,960/video.videoHeight);
    capture.width=Math.round(video.videoWidth*scale);capture.height=Math.round(video.videoHeight*scale);
    const captureContext=capture.getContext('2d',{alpha:false});
    const count=plan.count;
    for(let i=0;i<count;i++){
      if(token!==state.token)return;
      const t=plan.times[i];await seek(t);if(token!==state.token)return;
      captureContext.drawImage(video,0,0,capture.width,capture.height);
      const bitmap=await createImageBitmap(capture);
      if(token!==state.token){bitmap.close();return;}
      const result=await workerRequest('frame',{bitmap,timestamp:t*1000+1},[bitmap]);
      if(token!==state.token)return;
      temporary.push({t,poses:result.landmarks});
      const percent=Math.round((i+1)*100/count);$('progress').value=percent;$('busy-label').textContent=`正在看第 ${i+1} / ${count} 个画面`;$('busy-detail').textContent=`${percent}% · ${plan.label} · 每秒${plan.fps}个采样画面`;status(`分析中 ${percent}%，请保持页面打开。`);
    }
    if(token!==state.token)return;
    state.frames=temporary;state.plan={...plan,times:undefined};renderReport();await seek(state.contact??before);
    status(state.result.status==='unusable'?'分析结束，但没有可用人体动作。请查看拍摄建议。':'分析完成。点提醒旁的时间，回到对应画面。');
  }catch(error){
    if(token!==state.token)return;
    clearResults();status(`分析未完成：${error.message} 不会用模拟结果替代。`,true);
    try{await seek(before);}catch(_){/* preserve the original error */}
  }finally{
    if(token===state.token){stopWorker();setBusy(false);updateTime();}
  }
}
function updateMarks(){
  $('prep-time').textContent=state.url?escapeTime(state.prep):'未导入';$('contact-time').textContent=state.contact===null?'待标记':escapeTime(state.contact);$('trophy-time').textContent=state.trophy===null?'待标记':escapeTime(state.trophy);
}
function mark(which){
  if(!state.url||state.busy)return;video.pause();const t=video.currentTime;
  if(which==='prep'){
    state.prep=t;
    if(state.trophy!==null&&state.trophy<=t+.1)state.trophy=null;
    if(state.contact!==null&&state.contact<=t+.3){state.contact=null;status('准备起点已修改。请在至少0.3秒之后重新标记触球参考。');}
    else status('准备起点已标记。');
  }else if(which==='trophy'){
    if(t<=state.prep+.1||(state.contact!==null&&t>=state.contact-.1)){status('举拍参考应在准备起点之后、触球参考之前，各留至少0.1秒。',true);return;}
    state.trophy=t;status('举拍参考已标记。请确认它是抛球后、开始向上挥拍之前。');
  }else{
    if(t<=state.prep+.3){status('触球参考需要在准备起点至少0.3秒之后。请向后拖动视频。',true);return;}
    state.contact=t;if(state.trophy!==null&&state.trophy>=t-.1)state.trophy=null;status('触球参考已标记。已有分析会按新时刻更新，不必重新识别。');
  }
  updateMarks();if(state.frames.length)renderReport();updateTime();
}
function updateTime(){
  $('time').textContent=`${(video.currentTime||0).toFixed(2)} / ${state.duration.toFixed(2)}`;$('scrub').value=video.currentTime||0;$('play').textContent=video.paused?'▶':'Ⅱ';$('play').setAttribute('aria-label',video.paused?'播放视频':'暂停视频');draw();
}
function draw(){
  if(!state.url||video.hidden)return;
  const rect=$('stage').getBoundingClientRect();const dpr=window.devicePixelRatio||1;
  if(overlay.width!==Math.round(rect.width*dpr)||overlay.height!==Math.round(rect.height*dpr)){overlay.width=Math.round(rect.width*dpr);overlay.height=Math.round(rect.height*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
  if(!state.frames.length){$('overlay-state').textContent='等待分析';return;}
  const frame=nearestFrame(state.frames,video.currentTime,state.plan?.overview ? .27 : .16);
  if(!frame||frame.poses.length!==1){$('overlay-state').textContent=frame?.poses.length>1?'多人画面 · 不画骨架':'当前画面未可靠识别';return;}
  const pose=frame.poses[0];const measured=measurements(frame,config());
  $('overlay-state').textContent=`AI采样 ${escapeTime(frame.t)}${measured.elbow!==null?' · 持拍肘约'+Math.round(measured.elbow)+'°':''}`;
  if(!$('show-pose').checked)return;
  const scale=Math.min(rect.width/video.videoWidth,rect.height/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale,ox=(rect.width-w)/2,oy=(rect.height-h)/2;
  const xy=p=>[ox+p.x*w,oy+p.y*h];
  ctx.lineWidth=2.5;ctx.strokeStyle='#d7ee72';ctx.lineCap='round';
  for(const [a,b] of CONNECTIONS){if(!visible(pose[a])||!visible(pose[b]))continue;ctx.beginPath();ctx.moveTo(...xy(pose[a]));ctx.lineTo(...xy(pose[b]));ctx.stroke();}
  for(const i of [...new Set(CONNECTIONS.flat())]){if(!visible(pose[i]))continue;ctx.beginPath();ctx.arc(...xy(pose[i]),3.3,0,Math.PI*2);ctx.fillStyle='#f9ffe8';ctx.fill();ctx.strokeStyle='#173d31';ctx.lineWidth=1;ctx.stroke();}
}
function node(tag,text,className){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(className)e.className=className;return e;}
function renderReport(){
  if(!state.frames.length)return;
  const opts=config();const covered=markerCovered(state.plan,opts.prep,opts.contact,opts.trophy,opts.stroke);
  const result=analyze(state.frames,covered?opts:{...opts,prep:null,contact:null,trophy:null,ordinary:false});
  result.analysisRange=state.plan;
  if(state.plan?.overview)result.findings=result.findings.filter(f=>f.kind==='quality');
  state.advice=buildPlayerAdvice(buildAdvice(result,opts),result,opts);result.advice=state.advice;state.result=result;renderAdvice();$('results-empty').hidden=true;$('results-body').hidden=false;
  $('quality-label').textContent=result.status==='unusable'?'无法判断':result.status==='limited'?'画面信息不足':'已生成动作观察';
  $('quality-detail').textContent=`${state.plan?formatTime(state.plan.start)+'–'+formatTime(state.plan.end)+' · '+state.plan.label+' · ':''}${result.total} 个采样画面 · ${result.reliable} 个可用躯干/持拍臂画面 · 可用比例 ${Math.round(result.coverage*100)}%（非准确率）`;
  $('metrics').replaceChildren();
  const definitions=configFor($('stroke').value).metrics;
  for(const [key,label] of definitions){const metric=result.metrics[key];const item=node('div',null,'metric');item.append(node('span',label),node('strong',metric?(key==='armSpace'?`${Math.round(metric.low*100)}% ~ ${Math.round(metric.high*100)}%`:`${Math.round(metric.low)}° ~ ${Math.round(metric.high)}°`):'暂无可靠测量'),node('small',metric?(key==='armSpace'?'占躯干长度比例 · 2D投影':'可见样本中间80%范围 · 2D投影'):'关键点不足，不补数字'));$('metrics').append(item);}
  $('findings').replaceChildren();
  const tags={review:'建议回看',quality:'画面质量',guide:'补一步',observation:'动作观察'};
  for(const finding of result.findings){
    const article=node('article',null,`finding ${finding.kind}`),label=node('div',null,'finding-label'),body=node('div');
    label.append(node('span',tags[finding.kind],'tag'));
    if(finding.time!==null&&Number.isFinite(finding.time)){const jump=node('button',`↗ ${escapeTime(finding.time)} 回看`,'jump');jump.addEventListener('click',()=>jumpTo(finding.time));label.append(jump);}
    body.append(node('h3',finding.title),node('p',finding.body));if(finding.evidence)body.append(node('p',finding.evidence,'evidence'));
    if(finding.drill){const drill=node('div',null,'drill');drill.append(node('strong','下一组只试这一件事'),node('span',finding.drill));body.append(drill);}
    if(finding.rule||finding.source){const details=node('details');details.append(node('summary','教学来源与判断限制'));if(finding.rule)details.append(node('p',finding.rule));const source=SOURCES[finding.source];if(source){const link=node('a',`${source.title} ↗`);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}body.append(details);}
    article.append(label,body);$('findings').append(article);
  }
  syncControls();requestAnimationFrame(drawChart);
}
function drawChart(){
  const canvas=$('chart');if(!state.result||canvas.getBoundingClientRect().width===0)return;
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const c=canvas.getContext('2d');c.scale(dpr,dpr);
  const left=31,right=12,top=9,bottom=24,plotW=rect.width-left-right,plotH=rect.height-top-bottom;
  const start=state.plan?.start??0,end=state.plan?.end??state.duration,span=end-start;
  c.font='10px sans-serif';c.textBaseline='middle';c.fillStyle='#647169';c.strokeStyle='#e0e5db';c.lineWidth=1;
  for(const val of [0,90,180]){const y=top+plotH*(1-val/180);c.fillText(String(val)+'°',0,y);c.beginPath();c.moveTo(left,y);c.lineTo(rect.width-right,y);c.stroke();}
  c.fillText(formatTime(start),left,rect.height-7);c.textAlign='right';c.fillText(formatTime(end),rect.width-right,rect.height-7);c.textAlign='left';
  c.strokeStyle='#3d682f';c.lineWidth=2;c.beginPath();let connected=false,previous=-1;
  for(const r of state.result.rows){if(r.elbow===null){connected=false;continue;}const x=left+plotW*(r.t-start)/span,y=top+plotH*(1-r.elbow/180);if(connected&&r.t-previous<=(state.plan?.overview ? .55 : .16))c.lineTo(x,y);else c.moveTo(x,y);connected=true;previous=r.t;}
  c.stroke();
  if(state.contact!==null&&state.contact>=start&&state.contact<=end){const x=left+plotW*(state.contact-start)/span;c.strokeStyle='#906a22';c.setLineDash([4,3]);c.beginPath();c.moveTo(x,top);c.lineTo(x,rect.height-bottom);c.stroke();c.setLineDash([]);}
}
async function jumpTo(t){if(state.busy||!state.url)return;video.pause();try{await seek(t);updateTime();$('stage').animate([{outline:'3px solid #a1bc46'},{outline:'3px solid transparent'}],{duration:800});$('play').focus({preventScroll:true});status(`已定位到 ${escapeTime(t)}。可用上方播放器慢放回看。`);}catch(e){status(e.message,true);}}
function exportReport(){
  if(!state.result)return;
  const {rows,...summary}=state.result;
  const report={app:'COURTSIDE',version:'v6',generatedAt:new Date().toISOString(),video:{name:state.file,duration:state.duration,width:video.videoWidth,height:video.videoHeight},settings:config(),learningReference:selectedReference(),summary,sources:SOURCES,limitations:['AI人体识别加规则式提醒，不是云端视觉大模型。','仅二维投影，数值阈值未经个人及教练标注校准。','不检测球、球拍、准确触球、真实力量、重心或损伤。','可用画面比例不是识别准确率。没有触发提醒不等于动作正确。','本报告不包含视频或原始人体关键点。']};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='网球练习报告_v6_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('报告已保存到浏览器下载目录，不包含视频。');
}
function applyStroke(reset=true){
  const stroke=$('stroke').value,meta=configFor(stroke),isServe=stroke==='serve';
  $('practice-eyebrow').textContent='PERSONAL PRACTICE / '+meta.english;
  $('stroke-hint').textContent=meta.hint;
  $('condition-label').textContent=meta.condition;$('condition-exclude').textContent=meta.exclude;
  $('mark-trophy').hidden=!isServe;document.querySelector('.phase-strip').classList.toggle('serve',isServe);
  $('reference-focus').textContent=meta.focus;
  $('chart-label').textContent=meta.name+' · 持拍肘画面夹角随时间变化';
  $('reference-links').replaceChildren();
  const keys=[meta.source, ...(stroke==='forehand'?['review']:stroke.startsWith('backhand')?['backhand']:[])];
  for(const key of [...new Set(keys)]){const source=SOURCES[key],link=node('a',source.title+' ↗');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';$('reference-links').append(link);}
  if(reset){
    video.pause();state.prep=$('analysis-scope').value==='detail'?Number($('clip-start').value):0;state.contact=null;state.trophy=null;$('ordinary').checked=false;updateMarks();
    if(state.frames.length)renderReport();
    status('已切换到'+meta.name+'。请重新确认练习类型并标记阶段，已有关键点可直接复用。');
  }
  renderPlayer();showReferenceClip();draw();
}
$('analysis-scope').addEventListener('change',rangeChanged);
for(const id of ['clip-start','clip-end'])$(id).addEventListener('change',rangeChanged);
$('set-clip-start').addEventListener('click',()=>{$('clip-start').value=video.currentTime.toFixed(1);if(Number($('clip-end').value)<=video.currentTime||Number($('clip-end').value)-video.currentTime>30)$('clip-end').value=Math.min(state.duration,video.currentTime+10).toFixed(1);rangeChanged();});
$('set-clip-end').addEventListener('click',()=>{$('clip-end').value=video.currentTime.toFixed(1);rangeChanged();});
$('stroke').addEventListener('change',()=>applyStroke(true));
for(const id of ['video-file','video-file-empty'])$(id).addEventListener('change',event=>{loadVideo(event.target.files?.[0]);event.target.value='';});
$('analyze').addEventListener('click',run);$('cancel').addEventListener('click',cancel);
$('play').addEventListener('click',async()=>{if(state.busy)return;if(video.paused){try{await video.play();}catch(e){status('视频暂时无法播放：'+e.message,true);}}else video.pause();});
$('scrub').addEventListener('input',()=>{video.pause();video.currentTime=Math.max(0,Math.min(state.duration-.025,Number($('scrub').value)));});
$('speed').addEventListener('change',()=>{video.playbackRate=Number($('speed').value);});
$('back-frame').addEventListener('click',()=>jumpTo(video.currentTime-1/30));$('next-frame').addEventListener('click',()=>jumpTo(video.currentTime+1/30));
$('mark-prep').addEventListener('click',()=>mark('prep'));$('mark-trophy').addEventListener('click',()=>mark('trophy'));$('mark-contact').addEventListener('click',()=>mark('contact'));
$('clear-marks').addEventListener('click',()=>{state.prep=$('analysis-scope').value==='detail'?Number($('clip-start').value):0;state.contact=null;state.trophy=null;updateMarks();if(state.frames.length)renderReport();status('准备起点已恢复当前分析范围起点，触球和举拍参考已清空。');});
for(const id of ['hand','view','ordinary'])$(id).addEventListener('change',()=>{renderPlayer();if(state.frames.length)renderReport();draw();});
$('show-pose').addEventListener('change',draw);$('export').addEventListener('click',exportReport);
for(const event of ['timeupdate','seeked','play','pause','ended','loadeddata'])video.addEventListener(event,updateTime);
if(video.requestVideoFrameCallback){const callback=()=>{if(!state.busy)updateTime();video.requestVideoFrameCallback(callback);};video.requestVideoFrameCallback(callback);}
new ResizeObserver(()=>{draw();drawChart();}).observe($('stage'));
window.addEventListener('resize',drawChart);
$('chart').addEventListener('click',event=>{const rect=$('chart').getBoundingClientRect();jumpTo((state.plan?.start??0)+Math.min(1,Math.max(0,(event.clientX-rect.left-31)/(rect.width-43)))*((state.plan?.end??state.duration)-(state.plan?.start??0)));});
$('guide-open').addEventListener('click',()=>$('guide').showModal());$('guide-close').addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide')){const r=$('guide').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('guide').close();}});
for(const event of ['dragover','dragenter'])$('stage').addEventListener(event,e=>{e.preventDefault();$('stage').classList.add('dragging');});
for(const event of ['dragleave','drop'])$('stage').addEventListener(event,e=>{e.preventDefault();$('stage').classList.remove('dragging');if(event==='drop')loadVideo(e.dataTransfer?.files?.[0]);});
function referenceKey(){return selectedPlayerId()+':'+$('stroke').value;}
function showReferenceClip(){const clip=referenceClips.get(referenceKey()),ref=$('reference-video');ref.pause();if(clip){if(ref.src!==clip.url)ref.src=clip.url;ref.hidden=false;$('reference-empty').hidden=true;$('reference-status').textContent=clip.name;state.referenceURL=clip.url;ref.playbackRate=Number($('reference-speed').value);}else{ref.removeAttribute('src');ref.load();ref.hidden=true;$('reference-empty').hidden=false;$('reference-status').textContent='';state.referenceURL=null;}}
$('reference-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>250*1024*1024){$('reference-status').textContent='参考视频请控制在250MB以内。';return;}
  const key=referenceKey(),previous=referenceClips.get(key);if(previous)URL.revokeObjectURL(previous.url);referenceClips.set(key,{url:URL.createObjectURL(file),name:file.name});showReferenceClip();
});
$('reference-video').addEventListener('error',()=>{$('reference-status').textContent='参考视频无法解码。请尝试H.264 MP4。';});
$('reference-speed').addEventListener('change',()=>{$('reference-video').playbackRate=Number($('reference-speed').value);});
window.addEventListener('pagehide',()=>{stopWorker();if(state.url)URL.revokeObjectURL(state.url);for(const clip of referenceClips.values())URL.revokeObjectURL(clip.url);referenceClips.clear();});
if(location.protocol==='file:')status('请用项目内的启动脚本打开。本地模型需要通过本机HTTP服务加载，不能直接双击HTML。',true);
initializePlayers(config,()=>{showReferenceClip();if(state.result&&!state.busy)renderReport();});applyStroke(false);syncControls();document.body.dataset.ready='true';
