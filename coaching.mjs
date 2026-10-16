import {configFor} from './strokes.mjs';
// Practice counts are suggested session sizes, not research-derived thresholds.
const PRACTICE={
 forehand:{title:'先练提前准备，给挥拍留空间',source:'usta',why:'正手先把准备和人与球的距离做从容，再考虑加速。这里没有判定你准备晚。',steps:['先做5次轻松空挥：转身准备，再自然向前挥拍，不把手臂夹紧身体。','再用慢速腰高来球练10球，优先提前移动到舒服的位置，不追求大力。'],check:'同一机位再拍一组，自己记录10球中有几球临时挤着身体打、几球需要伸手够。比较前后是否更从容；这些次数需你记录，AI没有识别落点。',avoid:'不为追求角度锁直手肘，不刻意深蹲。'},
 backhand1:{title:'先练换握拍与转身，再让持拍臂自然展开',source:'onehand',why:'单反把准备做早、把前挥做顺，比照抄某个职业选手的直臂造型更有用。这里没有判定你已经做错。',steps:['先做5次慢速空挥：换到反手握拍、转身准备，再让持拍臂自然向前展开。','再用10次慢速腰高来球练同一过程。非持拍手按原有习惯帮助准备，不用硬拉手肘。'],check:'用相同机位对照两组视频：有没有在球到面前后才急着换握拍、是否有足够空间完成前挥。先看动作是否顺畅，不以“肘越直越好”验收。',avoid:'削球不套用这组练法；不追求费德勒相同的角度。'},
 backhand2:{title:'先练两手一起准备，留出自然挥拍空间',source:'twohand',why:'双反可以有不同的弯臂组合。先把换握拍与转身衔接顺，不要求两只肘的角度相同。',steps:['先做5次慢速双反空挥，换握拍与转身一起完成，让两手平顺带动球拍。','再用10次慢速腰高来球练准备到前挥，双肘不刻意夹紧躯干，也不刻意外撑。'],check:'同机位回看前后两组：是否更少出现临时换握拍、双臂被身体挤住的情况。用自己的舒适度与可见动作核对，不从双肘角度推断发力。',avoid:'不套单反直臂要求；双臂看不清时不比较左右角度。'},
 serve:{title:'先练抛球与举拍的衔接，暂时不追求球速',source:'serve',why:'把准备节奏做顺是这一组的练习目标，不代表AI已经确认你的抛球不稳定。',steps:['先做5次轻松空挥，走完整个准备、举拍、向上挥拍到收拍的过程。','再做5次只抛球、不击球的练习；抛球让你需要勉强够时就重来。最后尝试5次低强度发球。'],check:'固定相同机位，比较举拍到向上挥拍是否更连贯；自己记录有几次抛球后需要勉强够球。AI不检测抛球轨迹，也不按球速判断改进。',avoid:'不强压肩背、强行起跳或加深屈膝。不适时停止。'}
};
const targetedCheck=f=>{
 if(f.title.includes('腿')||f.title.includes('膝')||f.title.includes('绷直'))return '同机位再拍轻松的一组，核对准备是否更自然、是否仍能随时移动。不要用“膝角更小”或“蹲得更深”判断练对了。';
 if(f.title.includes('抛球侧'))return '先核对举拍参考有没有标晚，再看抛球臂从上举到自然回落的顺序。不要为了通过提醒一直举着手臂。';
 if(f.title.includes('手腕'))return '先把触球参考标准确，再看向上挥拍是否自然完整。AI看不到球，不能用“手腕更高”替代对实际触球的判断。';
 if(f.title.includes('侧倾'))return '同一机位、相似来球再拍一组，观察是否更少出现勉强伸手够球。记录自己的感受，不为了角度小而强行掰直身体。';
 return '先核对回看画面与标记，再用相同机位、相似来球比较下一组：动作是否更顺、挥拍空间是否更舒服。不要为了数值变化改变本来舒适的姿势。';
};
export function buildAdvice(result,options={}){
 const meta=configFor(options.stroke),practice=PRACTICE[options.stroke]||PRACTICE.forehand;
 const notes=[];
 if(options.plan?.overview)notes.push('这次是整段抽样概览，不逐拍诊断。选一段最多30秒细看，才检查具体动作问题。');
 if(!result.phaseReady&&!options.plan?.overview)notes.push('未完成有效的动作阶段标记，目前不把建议写成你的个人动作诊断。');
 if(!options.ordinary)notes.push('请确认动作适用条件；未确认前只给基础练习，不判个人缺陷。');
 if(options.view==='unknown')notes.push('机位不确定，先按通用练习处理，不解释投影角度为动作错误。');
 const unusable=result.status==='unusable'||result.status==='limited';
 if(unusable){
  return {kind:'capture',heading:'先把动作拍清楚，再谈怎么改',summary:'这段画面不足以可靠评估你的技术。下面是拍摄改进，不是假装看出了你的动作问题。',notes,cards:[{kind:'capture',title:options.stroke==='backhand2'?'换一个双臂都可见的机位':'固定手机，把完整动作拍进来',why:result.findings.find(f=>f.kind==='quality')?.body||'可见人体动作不足。',time:null,steps:['只让练习者一人占据主要画面，脚、肩和持拍臂都不要切掉。','在明亮处固定手机，录一段清楚的完整动作；发球给头顶留空间，双反确保双肘双腕可见。'],check:'导入后检查骨架是否跟随你本人、关键部位是否经常消失。清楚后再做动作建议，不拿识别缺失当动作正确。',avoid:'先改善拍摄，不根据当前不清楚的画面强改动作。',source:null}]};
 }
 const hasPersonalContext=result.phaseReady&&options.ordinary&&options.view!=='unknown'&&!options.plan?.overview;
 const reviews=hasPersonalContext?result.findings.filter(f=>f.kind==='review'&&f.drill&&Number.isFinite(f.time)).slice(0,2):[];
 if(reviews.length){return {kind:'video',heading:'下一组，先改这一处',summary:'以下建议由这次画面触发，仍需先回看核对。默认先练第一项，其他项暂时别一起改。',notes,cards:reviews.map((f,i)=>({kind:'video',title:f.title,why:f.body,time:f.time,evidence:f.evidence||'',rule:f.rule||'',steps:[f.drill,meta.name==='发球'?'先轻松空挥5次；无不适再做5次低强度发球。':'先慢做5次，再用较慢、条件相近的来球练10球。'],check:targetedCheck(f),avoid:practice.avoid,source:f.source||practice.source,priority:i===0?'先练这一项':'之后再试'}))};}
 return {kind:'general',heading:'下一组怎么练',summary:'没有足够证据指出你的具体错误。这里给的是'+meta.name+'基础练习，不是针对你个人的诊断。',notes,cards:[{kind:'general',title:practice.title,why:practice.why,time:null,steps:practice.steps,check:practice.check,avoid:practice.avoid,source:practice.source,priority:'通用练习'}]};
}
