export const VIDEO_LIMITS={maxSeconds:300,maxBytes:1024*1024*1024,detailSeconds:30,denseFps:10,overviewFps:2};
export function durationError(seconds){if(!Number.isFinite(seconds)||seconds<.5)return '视频时长无效或不足0.5秒，请换一段完整动作。';if(seconds>VIDEO_LIMITS.maxSeconds+.001)return '视频超过5分钟，请先截到5分钟以内再导入。';return null;}
export function sizeError(bytes){return bytes>VIDEO_LIMITS.maxBytes?'视频超过1GiB（约1.07GB）。请压缩到1080p或降低码率后重试。':null;}
export function makePlan(duration,scope='full',start=0,end=duration){
 const error=durationError(duration);if(error)throw new Error(error);
 if(scope!=='full'&&scope!=='detail')throw new Error('请选择整段概览或片段细看。');
 if(scope==='full'){start=0;end=duration;}
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration+.001||end-start<.5)throw new Error('分析范围至少0.5秒，且必须位于视频内。');
 if(scope==='detail'&&end-start>VIDEO_LIMITS.detailSeconds+.001)throw new Error('片段细看最多选30秒；整段视频可以保留，不需要另行裁剪。');
 const overview=scope==='full'&&duration>30;
 const fps=overview?VIDEO_LIMITS.overviewFps:VIDEO_LIMITS.denseFps;
 const times=[];
 for(let i=0;i<Math.ceil((end-start)*fps);i++){
  const t=Math.min(start+i/fps,end-.025);
  if(!times.length||t>times[times.length-1])times.push(Number(t.toFixed(6)));
 }
 return {scope,start,end,overview,fps,times,count:times.length,label:overview?'整段概览':'片段细看'};
}
export function formatTime(t){if(!Number.isFinite(t))return '0:00.0';const minutes=Math.floor(t/60);const seconds=(t-minutes*60).toFixed(1).padStart(4,'0');return `${minutes}:${seconds}`;}
export function markerCovered(plan,prep,contact,trophy,stroke){
 if(!plan||plan.overview)return false;
 if(!Number.isFinite(prep)||!Number.isFinite(contact)||prep<plan.start-.001||contact>plan.end||contact<=prep+.3)return false;
 return stroke!=='serve'||(Number.isFinite(trophy)&&trophy>prep+.1&&trophy<contact-.1);
}
