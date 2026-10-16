import {analyze as analyzeForehand, measurements as baseMeasurements, angle, visible, percentile, nearestFrame, SOURCES} from './analysis.mjs';
export const SOURCES_V2={...SOURCES,
  backhand:{title:'USTA：反手基础',url:'https://www.usta.com/en/home/improve/tips-and-instruction/national/learning-the-basics--backhand.html'},
  onehand:{title:'Top Tennis Training：单手反手',url:'https://www.youtube.com/watch?v=m9qd3OG0Rr8'},
  twohand:{title:'Top Tennis Training：双手反手',url:'https://www.youtube.com/watch?v=i1k8MLOsOwI'},
  serve:{title:'USTA：发球教学',url:'https://www.youtube.com/watch?v=gKAv2xiYecY'}
};
export const STROKES={
  forehand:{name:'正手',english:'FOREHAND',condition:'这段是腰高来球的一次普通正手',exclude:'高低球、跑动救球、截击不勾选。',hint:'观察准备、持拍臂空间，以及对应机位能看清的身体变化。',metrics:[['elbow','持拍肘夹角'],['knee','持拍侧膝夹角'],['tilt','肩髋中线倾斜']],focus:'先观察准备、人与球的距离和挥拍空间，再回看自己。',source:'usta'},
  backhand1:{name:'单手反手',english:'ONE-HANDED BACKHAND',condition:'这段是腰高来球的单手上旋/平击反手',exclude:'削球、截击、高低球和跑动救球不勾选。',hint:'单独观察持拍臂从引拍到前挥的展开，不要求照抄费德勒的手肘角度。',metrics:[['elbow','持拍肘夹角'],['knee','持拍侧膝夹角'],['tilt','肩髋中线倾斜']],focus:'费德勒的单反可作欣赏参考。先看准备是否从容、手臂是否有展开的空间，不强求相同造型。',source:'onehand'},
  backhand2:{name:'双手反手',english:'TWO-HANDED BACKHAND',condition:'这段是腰高来球的双手上旋/平击反手',exclude:'削球、截击、高低球和跑动救球不勾选。',hint:'双臂一起观察。持拍手指你平时打正手的手；另一只手是辅助手。不把弯肘判成错误。',metrics:[['elbow','持拍手肘夹角'],['auxElbow','辅助手肘夹角'],['armSpace','双肘离躯干线距离']],focus:'双反使用独立教学来源，不拿费德勒的单反来判你的双反。先看换握拍、转身准备与双臂空间。',source:'twohand'},
  serve:{name:'发球',english:'SERVE',condition:'这段是一次常规上手发球',exclude:'下手发球、扣杀、其他练习不勾选。先用轻松发球，不追求力量。',hint:'多标一个“举拍参考”：抛球后、开始向上挥拍前。观察该时刻的抛球臂，再回看触球附近的持拍臂。',metrics:[['elbow','持拍肘夹角'],['tossLift','抛球侧上臂抬起角'],['knee','持拍侧膝夹角']],focus:'发球先学自然的准备节奏与抛球衔接。不要为了模仿偶像强扭肩背、追求深蹲或强行压拍。',source:'serve'}
};
export function configFor(stroke){return STROKES[stroke]||STROKES.forehand;}
const sideIndices=hand=>hand==='left'?{s:11,e:13,w:15,h:23}:{s:12,e:14,w:16,h:24};
const pt=(p,w,h)=>[p.x*w,p.y*h];
function lineDistance(point,a,b,w,h){
  const [px,py]=pt(point,w,h),[ax,ay]=pt(a,w,h),[bx,by]=pt(b,w,h);
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(len<1e-5)return null;
  return Math.abs(dx*(ay-py)-(ax-px)*dy)/len;
}
export function measurementForStroke(frame,options){
  const base=baseMeasurements(frame,options),other=baseMeasurements(frame,{...options,hand:options.hand==='left'?'right':'left'});
  const p=frame.poses?.length===1?frame.poses[0]:null;
  let tossLift=null,armSpace=null,wristRise=null;
  if(p){
    const main=sideIndices(options.hand),aux=sideIndices(options.hand==='left'?'right':'left');
    tossLift=angle(p[aux.h],p[aux.s],p[aux.e],options.width,options.height);
    if([main.h,main.s,main.w].every(i=>visible(p[i]))){
      const length=Math.hypot((p[main.s].x-p[main.h].x)*options.width,(p[main.s].y-p[main.h].y)*options.height);
      if(length>options.height*.08)wristRise=(p[main.s].y-p[main.w].y)*options.height/length;
    }
    if([11,12,13,14,23,24].every(i=>visible(p[i]))){
      const torso=((Math.hypot((p[11].x-p[23].x)*options.width,(p[11].y-p[23].y)*options.height))+(Math.hypot((p[12].x-p[24].x)*options.width,(p[12].y-p[24].y)*options.height)))/2;
      const left=lineDistance(p[13],p[11],p[23],options.width,options.height),right=lineDistance(p[14],p[12],p[24],options.width,options.height);
      if(torso>options.height*.08&&left!==null&&right!==null)armSpace=(left+right)/(2*torso);
    }
  }
  return {...base,valid:base.valid&&(options.stroke!=='backhand2'||other.valid),auxElbow:other.elbow,tossLift,armSpace,wristRise};
}
function span(rows,key){const a=rows.map(r=>r[key]).filter(Number.isFinite);return a.length?{low:percentile(a,.1),high:percentile(a,.9),count:a.length}:null;}
function sustained(rows,predicate,seconds=.2){let start=null,prev=null;for(const r of rows){if(!predicate(r)){start=prev=null;continue;}if(start===null||r.t-prev>.16)start=r.t;prev=r.t;if(r.t-start>=seconds-1e-6)return true;}return false;}
function minRow(rows,key){return rows.filter(r=>r.valid&&Number.isFinite(r[key])).reduce((a,b)=>!a||b[key]<a[key]?b:a,null);}
function complete(rows,key,minimum=3){return rows.length>=minimum&&rows.filter(r=>r.valid&&Number.isFinite(r[key])).length/rows.length>=.8;}
export function analyzeStroke(frames,options){
  const stroke=STROKES[options.stroke]?options.stroke:'forehand',config={...options,stroke},meta=configFor(stroke);
  if(stroke==='forehand')return {...analyzeForehand(frames,config),version:'v5.0-observation',stroke,strokeName:meta.name};
  const {prep=0,contact=null,trophy=null,duration=0,ordinary=false,view='unknown'}=config;
  const rows=frames.map(f=>measurementForStroke(f,config)),total=frames.length,detected=frames.filter(f=>f.poses?.length===1).length,reliable=rows.filter(r=>r.valid).length,multiple=rows.filter(r=>r.multiple).length,coverage=total?reliable/total:0;
  const result={version:'v5.0-observation',stroke,strokeName:meta.name,total,detected,reliable,multiple,coverage,rows,findings:[],metrics:Object.fromEntries(['elbow','auxElbow','knee','tilt','armSpace','tossLift','wristRise'].map(key=>[key,span(rows,key)])),phaseReady:false,status:'limited'};
  const add=(kind,title,body,time=null,extra={})=>result.findings.push({kind,title,body,time,...extra});
  if(!total||!detected){result.status='unusable';add('quality','没有找到可用的人体动作','请使用单人、全身入镜的视频。不会把没有识别到当成动作正确。');return result;}
  if(multiple)add('quality','多人画面已排除',`${multiple} 个采样画面出现多人，未用来给动作建议。`,frames.find(f=>f.poses?.length>1)?.t);
  if(coverage<.5||reliable<6){add('quality','可见动作不足，暂不做纠错提醒',stroke==='backhand2'?'双反需要两侧肩肘腕都能看清。请换一个遮挡更少的斜侧机位。单侧可见值可以回看，但不能当作双臂判断。':'肩、髋或持拍臂有较多遮挡，请固定手机并把全身拍完整。');return result;}
  result.status='observed';if(coverage<.8)add('quality','部分动作有遮挡','缺失画面不补骨架、不补数字，只用足够连续的可见片段给提醒。');
  const phase=Number.isFinite(prep)&&Number.isFinite(contact)&&prep>=0&&contact>prep+.3&&contact<=duration;result.phaseReady=phase;
  if(!phase){add('guide',`先标记这次${meta.name}的准备和触球参考`,'准备起点默认片头，可以修改。触球参考需手动标记，AI 不识别球或球拍。');return result;}
  if(!ordinary){add('guide','先确认练习类型',meta.condition+'。'+meta.exclude+' 其他情况只保留测量。',contact);return result;}
  const near=rows.filter(r=>Math.abs(r.t-contact)<=.25),before=rows.filter(r=>r.t>=Math.max(prep,contact-.6)&&r.t<=contact+.1);
  let alerts=0;
  if(stroke==='backhand1'){
    if((view==='side'||view==='quarter')&&complete(before,'elbow',5)&&complete(near,'elbow')){
      const range=span(before,'elbow'),middle=percentile(near.filter(r=>r.valid).map(r=>r.elbow),.5),point=minRow(near,'elbow');
      if(range.high-range.low<15&&middle<130){
        add('review','单反前挥，回看持拍臂是否缺少展开空间',`准备末段到触球参考附近，持拍肘的主要投影变化约 ${Math.round(range.high-range.low)}°，触球附近中位数约 ${Math.round(middle)}°。先核对标记，再看有没有离球太近。不能单靠弯肘判定错误。`,point.t,{evidence:'单反 · 触球参考前0.6秒至后0.1秒',rule:'投影角中间80%范围差<15°，且触球附近中位数<130°，仅是 v5 候选片段筛选条件；并非单反标准。',drill:'先慢做引拍到前挥，给手臂自然向前展开的空间，再用较慢的腰高来球练习。不锁死手肘，也不追求和费德勒一样的角度。',source:'onehand'});alerts++;
      }
    }
    add('observation','单反看展开，不考“手肘够不够直”','手臂造型受握拍、来球和机位影响。优先回看准备和人与球的距离；没有球和球拍识别，本版不能判断击球点前后或拍面方向。',contact,{drill:'下一组先降低击球强度，观察是否有时间完成准备、是否能自然向前挥拍。只把动作做顺，不强拉手臂。',source:'backhand'});
  }
  if(stroke==='backhand2'){
    const preparation=rows.filter(r=>r.t>=Math.max(prep,contact-.7)&&r.t<=contact-.2);
    if((view==='front'||view==='quarter')&&complete(preparation,'armSpace',4)&&sustained(preparation,r=>r.valid&&r.armSpace!==null&&r.armSpace<.12,.2)){
      const point=minRow(preparation,'armSpace');
      add('review','双反击球前，双肘靠近躯干线',`连续画面中，双肘到同侧肩髋线的平均距离低于躯干长度的12%。这个投影可能来自机位压缩；先回看双臂是否真的被身体挤住。`,point.t,{evidence:'双反 · 触球参考前0.7至0.2秒 · 连续不少于0.2秒',rule:'双肘平均离肩髋线距离/躯干长<0.12，仅为 v5 提醒阈值。不是理想间距，也不是三维测量。',drill:'下一组慢做转身准备，让双臂与身体之间留出自然挥拍空间。手不要夹紧身体，也不要刻意把两个肘撑开到某个宽度。',source:'twohand'});alerts++;
    }
    const f=nearestFrame(frames,contact),r=f?measurementForStroke(f,config):null;
    if(r?.valid)add('observation','双反的两只手，不必摆成一样',`触球参考附近，持拍手肘约 ${Math.round(r.elbow)}°，辅助手肘约 ${Math.round(r.auxElbow)}°。弯臂和伸展的组合都可能合理，不套单反或正手的“直臂”要求。`,f.t,{drill:'先用较慢来球练换握拍和转身准备，再回看双手是否一起顺畅带动球拍。不追求两个肘角度相同。',source:'twohand'});
    else add('quality','触球附近至少一侧手臂看不清','该时刻不做双臂对照。换一个双肩、双肘和双腕都更清楚的机位。',contact);
  }
  if(stroke==='serve'){
    const trophyReady=Number.isFinite(trophy)&&trophy>prep+.1&&trophy<contact-.1;
    if(!trophyReady){result.phaseReady=false;add('guide','发球多标一个“举拍参考”','拖到抛球后、开始向上挥拍之前，点“举拍参考”。这是你选的阶段，不是AI识别的抛球释放或奖杯姿势。',contact);return result;}
    const loading=rows.filter(r=>Math.abs(r.t-trophy)<=.15),hit=rows.filter(r=>Math.abs(r.t-contact)<=.15);
    if(view!=='unknown'&&complete(loading,'tossLift')&&sustained(loading,r=>r.valid&&r.tossLift!==null&&r.tossLift<95,.1)){
      const point=minRow(loading,'tossLift');
      add('review','举拍参考处，抛球侧上臂已经偏低',`你标记的举拍阶段，抛球侧上臂相对同侧躯干的画面抬起角较小，最低约 ${Math.round(point.tossLift)}°。先确认举拍参考是否标晚，再回看抛球臂是否过早回落。`,point.t,{evidence:'发球 · 手动举拍参考前后0.15秒',rule:'上臂相对躯干的投影抬起角<95°，持续不少于0.1秒，仅为试用提醒。抛球臂随后自然回落是正常动作，不应一直高举。',drill:'先不击球，轻松练抛球与举拍的衔接，观察上举到自然回落的顺序。不硬抬肩，不追求固定角度；抛球不舒服就重来。',source:'serve'});alerts++;
    }
    if(view==='side'&&complete(loading,'knee')&&sustained(loading,r=>r.valid&&r.knee!==null&&r.knee>165,.1)){
      const point=minRow(loading,'knee');
      add('review','举拍阶段，持拍侧腿接近伸直',`手动举拍参考附近，持拍侧膝的可见夹角超过165°。这是准备方式的观察，不代表必须增加蹬地或蹲得更深。`,point.t,{evidence:'发球 · 侧面 · 举拍参考附近',rule:'举拍阶段膝投影角>165°，仅为 v5 提醒阈值。简化发球方式及个人活动范围不同，不以屈膝深度判断发球水平。',drill:'下一组做轻松空挥，让腿部和上身自然衔接。不要为了提示刻意深蹲、起跳或追求更大力量。',source:'serve'});alerts++;
    }
    if(view!=='unknown'&&complete(hit,'wristRise')&&sustained(hit,r=>r.valid&&r.wristRise!==null&&r.wristRise<.1,.1)){
      const point=minRow(hit,'wristRise');
      add('review','触球参考处，持拍手腕没有明显高于肩',`连续采样中，持拍手腕相对同侧肩的画面高度差较小。先检查触球参考是否选错了时刻，再回看向上挥拍的过程。模型没有看到球，不能据此断言击球点太低。`,point.t,{evidence:'发球 · 手动触球参考前后0.15秒',rule:'手腕高于肩的投影差/同侧躯干长<0.1，仅为核对片段的阈值，不是理想触球高度。',drill:'先用低强度空挥核对准备到向上挥拍的顺序。抛球位置不合适就停止这次发球重新抛，不为够球强拉肩膀。',source:'serve'});alerts++;
    }
    add('observation','这版发球看身体阶段，不测抛球轨迹','已分开回看举拍和触球参考。抛球高度、落点、握拍、拍面、拍头下降、旋转和球速都没有自动检测。不能根据骨架说你“发力正确”或“肩膀安全”。',trophy,{drill:'先把轻松发球的准备节奏做稳定。出现不适就停止，不用速度和力量换一个看起来漂亮的姿势。',source:'serve'});
  }
  if(!alerts)add('observation','没有触发该动作的试用提醒',`这不等于${meta.name}动作全部正确。只检查了部分可见特征；当前机位、遮挡或动作类型也可能让规则不适用。`,contact);
  return result;
}
