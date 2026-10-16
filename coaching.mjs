import {configFor} from './strokes.mjs';
// Practice counts are suggested session sizes, not research-derived thresholds.
const PRACTICE={
 forehand:{title:'先练提前准备，给挥拍留空间',source:'usta',why:'正手先把准备和人与球的距离做从容，再考虑加速。本次先试一个更从容的准备节奏。',steps:['先做5次轻松空挥：转身准备，再自然向前挥拍，不把手臂夹紧身体。','再用慢速腰高来球练10球，优先提前移动到舒服的位置，不追求大力。'],check:'同一机位再拍一组，自己记录10球中有几球临时挤着身体打、几球需要伸手够。比较前后是否更从容；这些次数需你记录，AI没有识别落点。',avoid:'不为追求角度锁直手肘，不刻意深蹲。'},
 backhand1:{title:'先练换握拍与转身，再让持拍臂自然展开',source:'onehand',why:'单反把准备做早、把前挥做顺，比照抄某个职业选手的直臂造型更有用。本次先从准备与展开的衔接做对照。',steps:['先做5次慢速空挥：换到反手握拍、转身准备，再让持拍臂自然向前展开。','再用10次慢速腰高来球练同一过程。非持拍手按原有习惯帮助准备，不用硬拉手肘。'],check:'用相同机位对照两组视频：有没有在球到面前后才急着换握拍、是否有足够空间完成前挥。先看动作是否顺畅，不以“肘越直越好”验收。',avoid:'削球不套用这组练法；不追求费德勒相同的角度。'},
 backhand2:{title:'先练两手一起准备，留出自然挥拍空间',source:'twohand',why:'双反可以有不同的弯臂组合。先把换握拍与转身衔接顺，不要求两只肘的角度相同。',steps:['先做5次慢速双反空挥，换握拍与转身一起完成，让两手平顺带动球拍。','再用10次慢速腰高来球练准备到前挥，双肘不刻意夹紧躯干，也不刻意外撑。'],check:'同机位回看前后两组：是否更少出现临时换握拍、双臂被身体挤住的情况。用自己的舒适度与可见动作核对，不从双肘角度推断发力。',avoid:'不套单反直臂要求；双臂看不清时不比较左右角度。'},
 serve:{title:'先练抛球与举拍的衔接，暂时不追求球速',source:'serve',why:'把准备节奏做顺是这一组的练习目标，暂时不追求更大力量。',steps:['先做5次轻松空挥，走完整个准备、举拍、向上挥拍到收拍的过程。','再做5次只抛球、不击球的练习；抛球让你需要勉强够时就重来。最后尝试5次低强度发球。'],check:'固定相同机位，比较举拍到向上挥拍是否更连贯；自己记录有几次抛球后需要勉强够球。AI不检测抛球轨迹，也不按球速判断改进。',avoid:'不强压肩背、强行起跳或加深屈膝。不适时停止。'}
};
const targetedCheck=f=>{
 if(f.title.includes('腿')||f.title.includes('膝')||f.title.includes('绷直'))return '同机位再拍轻松的一组，核对准备是否更自然、是否仍能随时移动。不要用“膝角更小”或“蹲得更深”判断练对了。';
 if(f.title.includes('抛球侧'))return '先核对举拍参考有没有标晚，再看抛球臂从上举到自然回落的顺序。不要为了通过提醒一直举着手臂。';
 if(f.title.includes('手腕'))return '先把触球参考标准确，再看向上挥拍是否自然完整。AI看不到球，不能用“手腕更高”替代对实际触球的判断。';
 if(f.title.includes('侧倾'))return '同一机位、相似来球再拍一组，观察是否更少出现勉强伸手够球。记录自己的感受，不为了角度小而强行掰直身体。';
 return '先核对回看画面与标记，再用相同机位、相似来球比较下一组：动作是否更顺、挥拍空间是否更舒服。不要为了数值变化改变本来舒适的姿势。';
};
function observationSuggestion(result,options,practice){
 const candidates=options.stroke==='backhand2'?['armSpace','auxElbow','elbow']:options.stroke==='serve'?['tossLift','elbow','knee']:options.view==='front'?['tilt','elbow']:['elbow','knee'];
 const labels={elbow:'持拍肘夹角',auxElbow:'辅助手肘夹角',armSpace:'双肘离肩髋线的平均距离',tossLift:'抛球侧上臂抬起角',knee:'持拍侧膝夹角',tilt:'肩髋中线倾斜'};
 const key=candidates.find(key=>result.metrics?.[key]?.count>=6&&result.rows?.filter(r=>r.valid&&Number.isFinite(r[key])).length>=6);
 if(!key)return null;
 const rows=result.rows.filter(r=>r.valid&&Number.isFinite(r[key]));
 const metric=result.metrics[key];const target=(metric.low+metric.high)/2;
 const sample=rows.reduce((a,b)=>Math.abs(a[key]-target)<=Math.abs(b[key]-target)?a:b);
 const display=n=>key==='armSpace'?Math.round(n*100)+'%':Math.round(n)+'°';
 const observation=`这段可见采样中，${labels[key]}的主要范围是 ${display(metric.low)} 至 ${display(metric.high)}${key==='armSpace'?'（相对躯干长度）':''}。这只是当前画面记录，不是好坏判定或目标范围。`;
 const plans={
  elbow:{title:options.stroke==='backhand1'?'把单反准备和向前展开接得更顺':options.stroke==='serve'?'让举拍到向上挥拍更连贯':'让准备到前挥的衔接更从容',steps:options.stroke==='serve'?['先按平时节奏做5次低强度发球，作为对照。','再做5次轻松空挥，只关注举拍到向上挥拍的连贯；无不适再试5次低强度发球。']:['先按原动作练5球，记录自己的舒适度，不急着改造型。','再用相似的慢速来球练5球，只尝试更早完成转身准备，让前挥自然接上；力量与站位先不刻意改变。'],check:'固定同一个机位比较两组：是否更少临时赶拍、前挥是否更连贯、是否更舒服。角度无需变大或变小；觉得更别扭就回到原动作。'},
  auxElbow:{title:'试试让双手准备与转身更同步',steps:['按原有双反节奏练5球，作为对照。','再做5次慢速空挥，让换握拍与转身衔接在一起，再用相似来球试5球。不要求两个肘角度相同。'],check:'比较前后两组：是否更少临时补换握拍、双手前挥是否更顺。不要用双臂角度更对称当作成功。'},
  armSpace:{title:'试一个更舒服的双臂挥拍空间',steps:['按现在的站位和双臂感觉练5球，保留这一组作对照。','再用相似慢速来球练5球，只通过小步调整人与球的距离，寻找不用夹紧也不用硬撑开双肘的位置。'],check:'比较两组挥拍是否更顺、是否更少挤着或够着击球。不是距离越大越好，也不要为了百分比改变舒适姿势。'},
  tossLift:{title:'把抛球、举拍和向上挥拍接得更顺',steps:['按原有节奏做5次轻松空挥，记住自己舒服的节奏。','再做5次只抛球不击球的练习，把注意力放在举拍与抛球的衔接；无不适再试5次低强度发球，抛偏就重来。'],check:'同机位比较过程是否更连贯，自己记录是否更少出现勉强够球。抛球臂随后自然回落，不要求始终高举或抬得更高。'},
  knee:{title:'试试更轻松、随时能移动的准备姿势',steps:['按平时习惯做5次轻松动作，先保留原来的准备姿势。','再做5次，只尝试让腿部不刻意绷紧、让准备与前挥自然衔接。保持原有强度，不增加下蹲深度。'],check:'比较哪组更容易进入下一步、动作更舒服。不要把屈膝更深或角度更小当作改进。'},
  tilt:{title:'试试用小步调整间距，而不是靠上身够球',steps:['按原有方式练5球，观察自己是否舒适。','再用相似来球练5球，只关注提前用小步找到舒服的距离。允许上身自然倾斜，不用强行站直。'],check:'自己比较是否更少需要临时伸手够、挥拍是否更轻松。身体倾斜可以保留，不用角度变小当作目标。'}
 };
 const plan=plans[key];
 return {kind:'suggestion',title:plan.title,why:observation+' '+(options.ordinary?'可以用下面的小幅尝试做前后对照。':'以下作为所选动作的练习尝试；若视频不是这种动作，先切换类型。'),time:sample.t,evidence:'该时间是用于查看可见动作的采样画面，不是自动识别的击球点。',steps:plan.steps,check:plan.check,avoid:practice.avoid,source:practice.source,priority:'本次优化尝试',observation:{metric:key,low:metric.low,high:metric.high,count:metric.count,sampleTime:sample.t},rule:'根据可见身体部位选择练习方向，不把测量范围当作理想范围；不是已证实的动作缺陷，也不保证尝试一定更好。'};
}
export function buildAdvice(result,options={}){
 const meta=configFor(options.stroke),practice=PRACTICE[options.stroke]||PRACTICE.forehand;
 const notes=[];
 if(options.plan?.overview)notes.push('整段抽样适合找练习方向；选一小段细看，可以把建议定位到一次完整动作。');
 if(!result.phaseReady&&!options.plan?.overview)notes.push('可以直接试下面的练法；补标触球参考后，能进一步对照击球前后的动作。');
 if(!options.ordinary)notes.push('先按所选动作给练习方向；来球类型确认后，再细看对应阶段。');
 if(options.view==='unknown')notes.push('机位不确定，先做同机位前后对照，不用角度大小判断好坏。');
 const unusable=result.status==='unusable'||result.status==='limited';
 if(unusable){
  return {kind:'capture',heading:'先把动作拍清楚，再谈怎么改',summary:'先调整拍摄，让持拍臂和完整动作清楚可见。拍清楚后，才能把建议与你这一拍对应起来。',notes,cards:[{kind:'capture',title:options.stroke==='backhand2'?'换一个双臂都可见的机位':'固定手机，把完整动作拍进来',why:result.findings.find(f=>f.kind==='quality')?.body||'可见人体动作不足。',time:null,steps:['只让练习者一人占据主要画面，脚、肩和持拍臂都不要切掉。','在明亮处固定手机，录一段清楚的完整动作；发球给头顶留空间，双反确保双肘双腕可见。'],check:'导入后检查骨架是否跟随你本人、关键部位是否经常消失。清楚后再做动作建议，不拿识别缺失当动作正确。',avoid:'先改善拍摄，不根据当前不清楚的画面强改动作。',source:null}]};
 }
 const hasPersonalContext=result.phaseReady&&options.ordinary&&options.view!=='unknown'&&!options.plan?.overview;
 const reviews=hasPersonalContext?result.findings.filter(f=>f.kind==='review'&&f.drill&&Number.isFinite(f.time)).slice(0,2):[];
 if(reviews.length){return {kind:'video',heading:'下一组，先试这一项',summary:'根据这次可见动作，建议先试第一项。对比调整前后的舒适度与表现，再决定是否保留；不要求你把当前动作当成错误。',notes,cards:reviews.map((f,i)=>({kind:'video',title:f.title,why:f.body,time:f.time,evidence:f.evidence||'',rule:f.rule||'',steps:[f.drill,meta.name==='发球'?'先轻松空挥5次；无不适再做5次低强度发球。':'先慢做5次，再用较慢、条件相近的来球练10球。'],check:targetedCheck(f),avoid:practice.avoid,source:f.source||practice.source,priority:i===0?'先练这一项':'之后再试'}))};}
 const suggestion=observationSuggestion(result,options,practice);
 if(suggestion)return {kind:'suggestion',heading:'这一组，可以这样优化',summary:'下面是结合可见动作的一次练习尝试。没有明显错误也能继续优化；先保持原动作做一组，再只改一个环节做对照。',notes,cards:[suggestion]};
 return {kind:'general',heading:'下一组，可以先试这个',summary:'先从'+meta.name+'的准备与衔接做一个小调整。按下面的方法练一组，比较是否更顺、更轻松，再决定保留。',notes,cards:[{kind:'general',title:practice.title,why:practice.why,time:null,steps:practice.steps,check:practice.check,avoid:practice.avoid,source:practice.source,priority:'通用练习'}]};
}
