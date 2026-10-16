// Curated learning references, NOT a popularity ranking or numeric motion templates.
// Observation prompts are authored questions, not measured athlete-specific findings.
const fedNadal={title:'温网官方：费德勒 vs 纳达尔 · 2019',url:'https://www.youtube.com/watch?v=J8__TwOgTY0',kind:'官方比赛集锦，不是逐动作示范'};
const djokAlcaraz={title:'温网官方：阿尔卡拉斯 vs 德约科维奇 · 2023',url:'https://www.youtube.com/watch?v=dvBr9Wr8BCY&xstg=CAMSBhUDze3xHw%3D%3D',kind:'官方比赛集锦，不是逐动作示范'};
const sabZheng={title:'美网官方：郑钦文 vs 萨巴伦卡 · 2023',url:'https://www.youtube.com/watch?v=BQCBYO4oHU0',kind:'官方比赛集锦，不是逐动作示范'};
const igaZheng={title:'美网官方：斯瓦泰克 vs 郑钦文 · 2026',url:'https://www.youtube.com/watch?v=rZNOgyoIGe4',kind:'官方比赛集锦，不是逐动作示范'};
export const PLAYERS=[
 {id:'federer',name:'费德勒',english:'Roger Federer',group:'men',hand:'right',backhand:'backhand1',profile:'https://www.atptour.com/en/players/roger-federer/f324/overview',video:fedNadal,
  focus:{forehand:'看准备到前挥怎样连接，而不是只截一张漂亮的收拍。',backhand1:'找一记腰高来球，观察非持拍手何时结束辅助、持拍臂如何向前展开。',serve:'把准备、举拍、向上挥拍连着看，记下节奏，而不是只记“奖杯姿势”。'},
  caution:'可以学准备与衔接，不必追求他的直臂造型或相同身体角度。'},
 {id:'nadal',name:'纳达尔',english:'Rafael Nadal',group:'men',hand:'left',backhand:'backhand2',profile:'https://www.atptour.com/en/players/rafael-nadal/n409/overview',video:fedNadal,
  focus:{forehand:'同一段里挑两次不同来球，比较收拍路线是否相同；别把一种收拍当作所有球的答案。',backhand2:'观察转身准备、前挥和击球后回位，注意画面中的左右方向与你是否一致。',serve:'先分辨左手发球的站位与挥拍方向，再看准备到向上挥拍的顺序。'},
  caution:'左右手不同先对应持拍侧与非持拍侧，不照搬画面左右，不刻意绕头收拍。'},
 {id:'djokovic',name:'德约科维奇',english:'Novak Djokovic',group:'men',hand:'right',backhand:'backhand2',profile:'https://www.atptour.com/en/players/novak-djokovic/d643/overview',video:djokAlcaraz,
  focus:{forehand:'看正常站稳的一拍和被拉开的球，分别观察准备时间与人与球的距离。',backhand2:'观察换握拍与转身有没有一起发生，前挥时两只手臂怎样配合。',serve:'挑两次完整发球，比较准备动作是否重复，不以单次好球代表固定模板。'},
  caution:'参考正常来球，不模仿极限拉伸、滑步或勉强够球的身体姿势。'},
 {id:'alcaraz',name:'阿尔卡拉斯',english:'Carlos Alcaraz',group:'men',hand:'right',backhand:'backhand2',profile:'https://www.atptour.com/en/players/carlos-alcaraz/a0e2/overview',video:djokAlcaraz,
  focus:{forehand:'把完整挥拍与击球后第一步连起来看，不只追着拍头看。',backhand2:'比较靠近底线和离底线较远时，准备大小和挥拍空间有何不同。',serve:'观察发球收拍后如何转入下一拍准备，先保留完整动作而不是只看触球瞬间。'},
  caution:'学习动作之间的衔接，不模仿速度、跳跃幅度或爆发强度。'},
 {id:'serena',name:'小威廉姆斯',english:'Serena Williams',group:'women',hand:'right',backhand:'backhand2',profile:'https://www.wtatennis.com/legends/230234/serena-williams',
  video:{title:'Essential Tennis：小威发球慢动作',url:'https://www.essentialtennis.com/serena-williams-serve-super-slow-motion-2013-cincinnati-open',kind:'第三方网球教学机构的发球片段，仅覆盖发球'},videoStrokes:['serve'],
  focus:{forehand:'另选清楚的正手片段，观察准备到前挥的空间，不把发球视频当作正手示范。',backhand2:'另选双反片段，分别看双手准备与向前挥拍，不用两侧肘角是否相同来判好坏。',serve:'利用慢动作分开看抛球臂上举、举拍和向上挥拍，再连起来看节奏。'},
  caution:'先用轻松节奏模仿流程，不追求职业选手的球速或肩背活动幅度。'},
 {id:'swiatek',name:'斯瓦泰克',english:'Iga Swiatek',group:'women',hand:'right',backhand:'backhand2',profile:'https://www.wtatennis.com/players/326408/iga-swiatek',video:igaZheng,
  focus:{forehand:'观察来球出现后什么时候开始准备，以及击球后如何恢复到能移动的状态。',backhand2:'找相近高度的两次双反，观察转身和双手前挥的衔接，不用赢分与否判断造型。',serve:'挑出完整发球过程，对照准备起点与举拍参考，不拿不同机位比较关节角度。'},
  caution:'比较相似来球下的准备方式，不把比赛里的快速移动直接当成自己的训练强度。'},
 {id:'sabalenka',name:'萨巴伦卡',english:'Aryna Sabalenka',group:'women',hand:'right',backhand:'backhand2',profile:'https://www.wtatennis.com/players/320760/aryna-sabalenka',video:sabZheng,
  focus:{forehand:'把观察点放在击球前的准备和间距，不用球速倒推动作必须更大。',backhand2:'观察双臂离身体是否留有自然空间，再看转身到前挥是否连贯。',serve:'把发球拆成准备、举拍与向上挥拍，只选一个阶段对照，不用一次模仿全部幅度。'},
  caution:'力量不是这版学习目标；先练顺序与空间，不加力硬打。'},
 {id:'zheng',name:'郑钦文',english:'Zheng Qinwen',group:'women',hand:'right',backhand:'backhand2',profile:'https://www.wtatennis.com/players/328120/qinwen-zheng',video:sabZheng,
  focus:{forehand:'挑正常腰高来球，观察转身准备、脚下调整与前挥之间的先后。',backhand2:'看球到反手侧之前如何准备，再找一拍与你机位相近的画面做对照。',serve:'选两次完整发球，观察抛球与举拍衔接是否重复；落点和球速不由人体骨架判断。'},
  caution:'先参考容易看清的正常动作，不把身高臂展与不同来球造成的差异当作错误。'}
];
const COMMON={
 forehand:['准备：找到开始转身和前挥的位置，各看一次慢放。','空间：看人与球的相对位置，再看持拍臂有没有自然挥拍空间。','衔接：从前挥看到收拍、回位，不把收拍当成单独摆出的姿势。'],
 backhand1:['准备：观察转身与非持拍手的辅助，不只看最后的手肘形状。','前挥：观察持拍臂向前展开的过程，避免只截图比较角度。','收尾：连着看收拍和回位，区分普通反手与削球。'],
 backhand2:['准备：看换握拍与转身发生的先后。','前挥：两只手臂一起观察，不要求两个肘角相同。','空间：看双臂与躯干之间是否有活动余地，再看下一拍准备。'],
 serve:['准备：找到抛球后、向上挥拍前的举拍参考。','向上挥拍：先看完整顺序，再看手臂与身体的衔接。','收尾：观察收拍到下一拍准备，不追求发球速度与大幅度。']
};
export function getPlayer(id){return PLAYERS.find(p=>p.id===id)||PLAYERS[0];}
export function learningReference(id,stroke='forehand',hand='right'){
 const player=getPlayer(id),compatible=!stroke.startsWith('backhand')||stroke===player.backhand;
 const warning=[];
 if(!compatible)warning.push(`${player.name}的常规反手是${player.backhand==='backhand1'?'单手反手':'双手反手'}，与你选择的动作不同。该选手的反手不用于当前动作示范；保留原动作，或自行换一个学习对象。`);
 if(player.hand!==hand)warning.push(`${player.name}是${player.hand==='left'?'左':'右'}手持拍，你选的是${hand==='left'?'左':'右'}手。请按“持拍侧/非持拍侧”对应，不照搬画面左右；这里没有自动镜像。`);
 const video=(!player.videoStrokes||player.videoStrokes.includes(stroke))?player.video:null;
 if(compatible&&!video)warning.push('当前已核实的观看链接不覆盖这个动作。可以查看选手资料，或导入你有权使用的对应片段。');
 return {playerId:player.id,name:player.name,english:player.english,hand:player.hand,backhand:player.backhand,stroke,compatible,warnings:warning,focus:compatible?(player.focus[stroke]||'选择一个适用动作再观察。'):'反手类型不匹配，不提供该选手的当前反手观察清单。',checklist:compatible?(COMMON[stroke]||[]):[],caution:player.caution,profile:player.profile,video:compatible?video:null,provenance:'应用编写的观看问题，不是球员本人指导，也不是对其视频的逐帧测量结论。',modelEffect:'仅改变学习参考与观看清单，不改变AI测量、纠错阈值或给出相似度分数。'};
}
