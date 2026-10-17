// Measurements are 2D observations. Alert thresholds are provisional engineering
// triggers, not medical limits, validated coaching standards, or Federer targets.
export const RULES_VERSION = 'v6.0-observation';
export const CONNECTIONS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
export const SOURCES = {
  usta: { title: 'USTA 官方正手教学', url: 'https://www.youtube.com/watch?v=WXSI9PZrmI0' },
  review: { title: '正手动作生物力学综述', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3761830/' }
};
export function visible(p) {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 &&
    Number.isFinite(p.visibility) && p.visibility >= .7 &&
    (p.presence == null || p.presence >= .5);
}
export function angle(a, b, c, width, height) {
  if (![a,b,c].every(visible) || !(width > 0 && height > 0)) return null;
  const u = [(a.x-b.x)*width, (a.y-b.y)*height];
  const v = [(c.x-b.x)*width, (c.y-b.y)*height];
  const denominator = Math.hypot(...u) * Math.hypot(...v);
  if (denominator < 1e-6) return null;
  return Math.acos(Math.min(1, Math.max(-1, (u[0]*v[0]+u[1]*v[1])/denominator))) * 180 / Math.PI;
}
export function percentile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  if (!sorted.length) return null;
  const index = (sorted.length-1)*q, lo = Math.floor(index), hi = Math.ceil(index);
  return sorted[lo] + (sorted[hi]-sorted[lo])*(index-lo);
}
export function measurements(frame, { width, height, hand = 'right' }) {
  const poses = frame.poses || [];
  const p = poses.length === 1 ? poses[0] : null;
  const side = hand === 'left' ? {s:11,e:13,w:15,h:23,k:25,a:27} : {s:12,e:14,w:16,h:24,k:26,a:28};
  if (!p) return {t:frame.t, valid:false, multiple:poses.length>1, elbow:null, knee:null, tilt:null};
  const torso = [11,12,23,24].every(i => visible(p[i]));
  let tilt = null;
  if (torso) {
    const dx = ((p[11].x+p[12].x)-(p[23].x+p[24].x))*width/2;
    const dy = ((p[23].y+p[24].y)-(p[11].y+p[12].y))*height/2;
    if (dy > height*.04) tilt = Math.atan2(Math.abs(dx), dy)*180/Math.PI;
  }
  const elbow = angle(p[side.s],p[side.e],p[side.w],width,height);
  const knee = angle(p[side.h],p[side.k],p[side.a],width,height);
  return {t:frame.t, valid:torso && elbow!==null, multiple:false, elbow,knee,tilt};
}
export function nearestFrame(frames, t, maxGap=.16) {
  if (!frames.length) return null;
  let lo = 0, hi = frames.length-1;
  while (lo<hi) {const mid=Math.floor((lo+hi)/2);if(frames[mid].t<t)lo=mid+1;else hi=mid;}
  const next=frames[lo], prev=frames[Math.max(0,lo-1)];
  const selected = Math.abs(next.t-t)<Math.abs(prev.t-t)?next:prev;
  return Math.abs(selected.t-t)<=maxGap?selected:null;
}
function span(rows, key) {
  const values=rows.map(r=>r[key]).filter(Number.isFinite);
  return values.length ? {low:percentile(values,.1),high:percentile(values,.9),count:values.length} : null;
}
function maximum(rows,key) {return rows.filter(r=>Number.isFinite(r[key])).reduce((best,r)=>!best||r[key]>best[key]?r:best,null);}
function durationSupported(rows, predicate, minSeconds=.3) {
  let first=null, last=null;
  for(const r of rows) {
    if(!predicate(r)){first=last=null;continue;}
    if(first===null || (last!==null && r.t-last>.16))first=r.t;
    last=r.t;
    if(last-first>=minSeconds-1e-6)return true;
  }
  return false;
}
export function analyze(frames, options) {
  const {width,height,hand='right',view='quarter',ordinary=false,prep=null,contact=null,duration=0}=options;
  const rows=frames.map(f=>measurements(f,{width,height,hand}));
  const detected=frames.filter(f=>f.poses?.length===1).length;
  const reliable=rows.filter(r=>r.valid).length;
  const multiple=rows.filter(r=>r.multiple).length;
  const coverage=frames.length?reliable/frames.length:0;
  const result={version:RULES_VERSION,total:frames.length,detected,reliable,multiple,coverage,rows,findings:[],metrics:{elbow:span(rows,'elbow'),knee:span(rows,'knee'),tilt:span(rows,'tilt')},phaseReady:false,status:'limited'};
  const add=(kind,title,body,time=null,extra={})=>result.findings.push({kind,title,body,time,...extra});
  if(!frames.length || detected===0) {
    result.status='unusable';
    add('quality','没有找到可用的人体动作','请换一段单人、全身入镜的视频。不要把“没识别到”当作“动作没有问题”。');
    return result;
  }
  if(multiple>0) add('quality','画面里出现了不止一个人',`有 ${multiple} 个采样画面检测到多人，这些画面已排除。只拍你自己，避免切换识别对象。`,frames.find(f=>f.poses?.length>1)?.t);
  if(coverage<.5 || reliable<6) {
    add('quality','这段画面不足以给动作建议','肩、髋或持拍臂有较多遮挡。把全身拍完整，人物稍大一些，固定手机，再录一段。可见关节的测量值仍可回看，但不据此判断动作问题。');
    return result;
  }
  result.status='observed';
  if(coverage<.8) add('quality','部分动作被遮挡','部分采样画面无法可靠看清持拍臂或躯干。断线位置不补画，缺失位置不补数字。');
  const hasPhase=Number.isFinite(prep)&&Number.isFinite(contact)&&prep>=0&&contact>prep+.3&&contact<=duration;
  result.phaseReady=hasPhase;
  if(!hasPhase) {
    add('guide','标记准备起点和触球参考，建议才更具体','拖动进度条，分别标记这一次正手的准备起点、你认为拍碰到球的时刻。AI 不识别球拍和球，不能替你确认触球。');
    return result;
  }
  const preparing=rows.filter(r=>r.t>=prep&&r.t<contact);
  const near=rows.filter(r=>Math.abs(r.t-contact)<=.25);
  if(!ordinary) {
    add('guide','先确认这次练习的来球条件','目前只对“腰高来球的一次普通正手”给试用提醒。高球、低球、跑动救球和截击先保留测量，不套用同一规则。',contact);
    return result;
  }
  let alerts=0;
  if(view==='side') {
    const knees=preparing.filter(r=>r.valid&&r.knee!==null);
    if(preparing.length>=4 && knees.length/preparing.length>=.8 && durationSupported(preparing,r=>r.valid&&r.knee!==null&&r.knee>165,.4)) {
      const point=knees.reduce((a,b)=>a.knee>b.knee?a:b);
      add('review','准备阶段，回看腿有没有一直绷直',`持拍侧膝盖在连续画面中接近伸直，画面夹角超过 165°。这是候选问题，不是已经判定的错误。侧面投影仍会受身体转动影响。`,point.t,{evidence:'侧面 · 准备区间 · 连续不少于0.4秒',rule:'膝角 >165°，仅为 v6 提醒阈值，未经个人校准。不是理想角度。',drill:'下一组先慢做几次准备动作，保持腿部自然放松、可移动，再正常击球。不要为了角度刻意深蹲。',source:'usta'});alerts++;
    }
  }
  if(view==='front' && near.length>=3) {
    const tilts=near.filter(r=>r.valid&&r.tilt!==null);
    if(tilts.length/near.length>=.8 && durationSupported(near,r=>r.valid&&r.tilt!==null&&r.tilt>25,.2)) {
      const point=maximum(tilts,'tilt');
      add('review','击球附近，上身侧倾值得回看',`肩髋中线与画面竖直方向最大约 ${Math.round(point.tilt)}°。对于你勾选的腰高正手练习，先检查是不是站位离球不合适。画面侧倾不等于真实重心不稳。`,point.t,{evidence:'正面 · 触球参考前后0.25秒',rule:'投影侧倾 >25° 且持续不少于0.2秒，仅为 v6 提醒阈值；手机本身歪斜会影响结果。',drill:'下一组降低来球速度，提前用小步调整与球的距离。先把站位调舒服，不要硬把上身掰直。',source:'usta'});alerts++;
    }
  }
  const armRows=near.filter(r=>r.valid&&r.elbow!==null);
  if((view==='side'||view==='quarter')&&near.length>=3&&armRows.length/near.length>=.8&&durationSupported(near,r=>r.valid&&r.elbow!==null&&r.elbow<70,.2)) {
    const point=armRows.reduce((a,b)=>a.elbow<b.elbow?a:b);
    add('review','持拍臂收得较紧，看看有没有被球挤住',`触球参考附近，持拍肘的画面夹角较小，最小约 ${Math.round(point.elbow)}°。先回看手臂与躯干之间是否有空间；仅凭弯肘不能判错。`,point.t,{evidence:'侧面或斜侧 · 触球参考前后0.25秒',rule:'肘部投影夹角 <70° 且持续不少于0.2秒，仅为试用提醒阈值。弯臂正手本身不是错误。',drill:'下一组用较慢来球练习提前移动，让球位于身体侧前方，留出自然挥拍空间。不要求把手肘锁直，也不照抄费德勒的手臂形状。',source:'usta'});alerts++;
  }
  const point=nearestFrame(frames,contact);
  const measured=point?measurements(point,{width,height,hand}):null;
  if(measured && measured.elbow!==null) add('observation','把触球附近这一帧留作对照',`持拍肘的画面夹角约 ${Math.round(measured.elbow)}°。这是测量值，不是目标值。下次尽量保持相同拍摄角度，观察动作是否更自然、击球是否更稳定。`,point.t);
  else add('quality','触球参考附近的持拍臂看不清','该时刻不输出肘部角度，也不使用相隔较远的画面代替。',contact);
  if(!alerts) add('observation','本次没有触发试用提醒','不代表动作全部正确。当前规则只检查有限的可见特征，不能判断握拍、拍面、击球点、转速和真实发力。可结合参考视频，优先看准备与挥拍空间。',contact);
  return result;
}
