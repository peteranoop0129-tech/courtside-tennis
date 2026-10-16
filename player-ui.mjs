import {PLAYERS,getPlayer,learningReference} from './players.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
let selected='federer',group='all',notify=()=>{},getOptions=()=>({stroke:'forehand',hand:'right'});
export function selectedReference(){const o=getOptions();return learningReference(selected,o.stroke,o.hand);}
export function selectedPlayerId(){return selected;}
function populate(){
 const picker=$('player-select');picker.replaceChildren();
 for(const p of PLAYERS.filter(p=>group==='all'||p.group===group)){const option=el('option',p.name+' / '+p.english);option.value=p.id;picker.append(option);}
 picker.value=selected;
}
export function renderPlayer(){
 const ref=selectedReference(),p=getPlayer(selected);
 $('player-name').textContent=p.name;$('player-english').textContent=p.english;
 $('player-meta').textContent=(p.group==='men'?'男子':'女子')+' · '+(p.hand==='left'?'左手持拍':'右手持拍')+' · '+(p.backhand==='backhand1'?'单手反手':'双手反手');
 $('player-focus').textContent=ref.focus;
 $('player-checklist').replaceChildren(...ref.checklist.map(text=>el('li',text)));
 $('player-warning').replaceChildren(...ref.warnings.map(text=>el('p',text)));$('player-warning').hidden=!ref.warnings.length;
 $('player-caution').textContent=ref.caution;
 $('player-provenance').textContent=ref.provenance+' '+ref.modelEffect;
 $('player-profile').href=ref.profile;$('player-profile').textContent='查看'+p.name+'的官方资料 ↗';
 $('player-watch').hidden=!ref.video;
 if(ref.video){$('player-watch').href=ref.video.url;$('player-watch').textContent=ref.video.title+' ↗';$('player-video-kind').textContent=ref.video.kind+'；仅打开外站，不下载到本应用。';}
 else $('player-video-kind').textContent=ref.compatible?'没有与当前动作对应的已核实片段，可导入自己的参考。':'换一个反手打法相同的选手，或自行切换练习动作。';
 $('reference-local-title').textContent=p.name+' · 我的参考片段';
 $('player-section').dataset.player=selected;$('player-section').dataset.compatible=String(ref.compatible);
 $('player-filters').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===group)));
}
function choose(id){selected=getPlayer(id).id;try{localStorage.setItem('courtside-learning-player-v5',selected);}catch(_){}renderPlayer();notify(selected);}
export function initializePlayers(options,callback){
 getOptions=options;notify=callback;
 try{const previous=localStorage.getItem('courtside-learning-player-v5');if(PLAYERS.some(p=>p.id===previous))selected=previous;}catch(_){}
 populate();renderPlayer();
 $('player-select').addEventListener('change',event=>choose(event.target.value));
 $('player-filters').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
  group=button.dataset.group;
  if(group!=='all'&&getPlayer(selected).group!==group)selected=PLAYERS.find(p=>p.group===group).id;
  populate();choose(selected);
 }));
 return selected;
}
