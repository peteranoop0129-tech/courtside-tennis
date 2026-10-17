import {getPlayer,learningReference} from './players.mjs';
import {configFor} from './strokes.mjs';

// Sources support inspiration facts, not the invented drills or numeric thresholds.
export const INSPIRATION_SOURCES={
 federerHand:{title:'Feel Tennis：费德勒持拍手与拍头路线',url:'https://www.feeltennis.net/roger-federer-forehand-technique',type:'教练分析',fact:'Feel Tennis用费德勒正手说明：持拍手的路线比拍头路线短，模仿拍头轨迹容易把手臂动作做得过大。'},
 nadalPattern:{title:'Brain Game Tennis：纳达尔正手落点与回合组织',url:'https://braingametennis.com/rafael-nadals-phenomenal-forehand',type:'比赛战术分析',fact:'这篇对纳达尔2017法网的分析讨论了先用深度与斜线组织回合，再寻找变线机会。这里不把历史战术统计当你的动作标准。'},
 djokovicPrep:{title:'Tactical Tennis：德约科维奇双反准备',url:'https://www.tacticaltennis.com/the-two-backhands-of-novak-djokovic',type:'教练分析',fact:'这篇双反分析描述了德约科维奇在转肩的同时，将非持拍手从拍喉移到握柄的准备过程。'},
 alcarazShape:{title:'ATP：阿尔卡拉斯正手变化与准备伪装',url:'https://www.atptour.com/en/news/forehand-drop-shot-success-alcaraz-2023',type:'ATP战术分析',fact:'ATP分析指出，阿尔卡拉斯会先用深球建立压力，并让正手小球的准备看起来接近正常击球。当前应用不检测小球，本次只借鉴先做好准备再决定落点的思路。'},
 serenaToss:{title:'小威 MasterClass：发球公开预览',url:'https://www.masterclass.com/classes/serena-williams-teaches-tennis/chapters/the-serve',type:'球员课程公开预览',fact:'小威在公开课程预览中把抛球一致性列为改善发球的重点，并建议单独反复练习抛球。以下次数与步骤是本应用的轻量训练编排，不是课程原样复刻。'},
 igaMargin:{title:'WTA：斯瓦泰克借鉴纳达尔的正手',url:'https://www.wtatennis.com/news/4025294/why-the-swiatek-nadal-connection-is-a-story-of-mutual-admiration',type:'WTA采访与分析',fact:'WTA报道斯瓦泰克借鉴纳达尔的正手旋转，并引用教练对她“积极进攻但保留余量”的评价。这里借鉴过网余量，不照搬旋转速度。'},
 sabaOffarm:{title:'WTA：萨巴伦卡的发球技术调整',url:'https://www.wtatennis.com/news/4350009/best-decision-for-my-game-gauff-turns-to-macmillan-for-service-sustainability',type:'WTA报道',fact:'WTA回顾萨巴伦卡的发球调整时提到，非持拍臂下落过多会牵动另一侧肩；这是她当时的个案，不代表你的问题相同。'},
 zhengTargets:{title:'Tennis Abstract：郑钦文发球分析',url:'https://www.tennisabstract.com/blog/2024/01/19/qinwen-zhengs-serve-under-construction',type:'历史比赛数据分析',fact:'这篇2024年的分析讨论郑钦文一发的落点威胁，以及威力与进球稳定性的取舍。这里只借鉴先有落点再评价效果，不把她当时的数据当作你的目标。'}
};
const BASE_SOURCE={forehand:{title:'USTA 正手教学',url:'https://www.youtube.com/watch?v=WXSI9PZrmI0'},backhand1:{title:'Top Tennis Training 单手反手教学',url:'https://www.youtube.com/watch?v=m9qd3OG0Rr8'},backhand2:{title:'Top Tennis Training 双手反手教学',url:'https://www.youtube.com/watch?v=i1k8MLOsOwI'},serve:{title:'USTA 发球教学',url:'https://www.youtube.com/watch?v=gKAv2xiYecY'}};
const DRILLS={
 handPath:{title:'把持拍手的路线做简单，不跟着拍头画大圈',cue:'看手走哪儿，不看拍头绕多大。',change:'本轮只试“引拍时手的路线更简洁”，握拍、力量和站位先保持原样。',observe:'回看转身到开始前挥这段，注意手腕位置。问自己：是不是先把持拍手抬出一个大圈，再急着往前送？这需要你看画面确认，AI没有检测拍头。',steps:['按原动作打10个慢球，自己记住赶拍或挥拍不舒服的次数，作为A组。','先空手做5次：转身时让手随身体到舒服的位置，再向前伸送；不模仿球拍尖端的大弧线。然后拿拍慢做5次。','用相近的腰高慢球打10个，只保留这条更简洁的手部路线。不要为了缩小动作把肘夹死。'],check:['A、B两组各10球，分别记录临时赶拍次数和舒服击中的次数。','再看同机位视频：准备是否少了一次多余抬手，同时没有丢掉自然挥拍空间。'],stop:'若更容易挤着打、击球明显变差或手臂更紧，恢复原路线，不把“越短越好”当目标。',keys:['elbow','tilt'],trainingScope:'适用于普通腰高正手，不适用于高球救球。'},
 handSpace:{title:'先找到不挤也不够的距离，再谈动作大小',cue:'脚找距离，手走自然路线。',change:'先不缩引拍，只改最后的小步调整，让手臂有自然前挥空间。',observe:'点开这次持拍臂样本，看肘与身体有没有被挤住；再核对你标的触球位置是否准确。夹角只是回看线索，不直接判错。',steps:['先按原习惯打10个慢球，自己数挤着身体打或伸手够的次数。','做5次无球演练：向来球侧小步调整，站好后再慢慢前挥，找不用夹肘也不用硬伸直的位置。','再打10个相近慢球，只记“脚先找舒服距离”，不同时改握拍或加力。'],check:['比较两组挤着/够着的次数，目标是减少而不是追角度。','B组舒服击球不减少，才保留这个间距感觉。'],stop:'若为拉开空间导致够球、拉肩或动作僵硬，回到原站位。',keys:['elbow','armSpace'],trainingScope:'普通落地击球；来球突然偏离时不硬套。'},
 oneHandSupport:{title:'单反先把转身与辅助持拍连起来',cue:'两手准备，一手向前。',change:'本轮只试非持拍手陪伴转身准备，进入前挥后再自然分开；不追求直臂造型。',observe:'回看准备到前挥，注意非持拍手何时离开球拍以及肩膀是否已转好。AI不识别握拍或拍喉，手是否仍扶拍要你看画面。',steps:['用原动作打10个腰高慢球，记录来不及准备或前挥不顺的次数。','做5次慢空挥：非持拍手轻扶球拍完成转身；开始前挥时自然放开，持拍臂向前展开，不锁死肘。','再打10球，只记“转身准备好，再放开前挥”。先不改握拍与击球力量。'],check:['比较前后是否更少出现没转好就匆忙挥拍。','用同机位看动作衔接，并记录10球中舒服击中的数量。'],stop:'若为了扶拍更久反而拖延前挥，提前回到自然放手时机。',keys:['elbow','tilt'],trainingScope:'单手上旋或平击反手；削球另练。'},
 serveFlow:{title:'把发球练成连贯的一次动作，而不是三个定格',cue:'准备，送上去，顺着收。',change:'只调整动作衔接，不延长停顿、不加深屈膝、不追求发球速度。',observe:'先核对举拍参考，再连着回看举拍到向上挥拍。看有没有为了摆出样子而停住；采样不代表精确触球。',steps:['按平时动作做10次低强度发球，记录感觉卡顿的次数和进区次数。','不抛球做5次慢空挥，保持准备、向上挥拍、收拍连贯，中间不刻意定格。','再做10次低强度发球，沿用刚才连贯节奏；抛球不合适就放弃该次重来。'],check:['B组卡顿感是否更少，进区次数是否至少没有下降。','不要为了流畅把动作赶快；若需要赶抛球，先退回慢空挥。'],stop:'出现肩背不适就停止，不能用连贯为理由硬拉肩或腰。',keys:['tossLift','elbow','knee'],trainingScope:'常规上手发球，已能轻松完成动作。'},
 diagonalDepth:{title:'先把斜线落稳，再试一次方向变化',cue:'先稳住斜线，再决定下一拍。',change:'本轮只练固定斜线的大目标，不加旋转、不追求边线；变线先留到斜线稳定以后。',observe:'看你前挥前是否已经选定方向、身体有没有为了临时变线而赶拍。球的落点和深度要你自己记录，AI没有检测。',steps:['在对面斜线场区选一个宽松目标，避开边线；先按原打法打10球，数进入目标的次数。','慢做5次准备到前挥，每次先在心里选好同一个斜线目标，再自然挥拍。','再打10球，只改“先定方向、正常完成动作”，不在最后一刻强拧手腕变线。'],check:['比较两组进目标的次数，以及临时赶拍/改向的次数。','本次先不变线；若固定斜线更稳定，下次再单独增加方向变化。'],stop:'别为了模仿纳达尔强行绕头收拍；保留自己的自然收拍和安全强度。',keys:['elbow','tilt'],trainingScope:'落地正手或双反的方向练习，不评价球速或旋转。'},
 twoHandTurn:{title:'把换握拍和转身合成一个准备动作',cue:'认反手，手肩一起准备。',change:'只调整换握拍与转身的先后，不同时改两个肘的角度。',observe:'回看准备段：你是否先转完身才临时把辅助手移到握柄？骨架能看双臂，握拍位置仍需你在画面里确认。',steps:['先按原双反打10个慢球，记录临时补换握拍或来不及前挥的次数。','做5次无球准备：识别反手方向的同时，转肩并完成自己习惯的双反握拍；停在舒服位置看一眼，不把腕折到固定角度。','再打10个同样慢球，只记“手肩一起准备”，前挥和收拍按原习惯。'],check:['比较前后临时补换握拍的次数是否减少。','B组前挥更从容、舒服击球不减少时保留；不是越早转得越多越好。'],stop:'握拍本来舒服就别重造握拍；不要模仿极限拉伸或两肘必须伸直。',keys:['auxElbow','armSpace','elbow'],trainingScope:'双手反手，普通腰高来球。'},
 repeatTarget:{title:'同一方向连打，先让准备动作更容易重复',cue:'每一球，先回到准备。',change:'只增加击球后回到舒服准备位置这一件事，不刻意缩短所有动作。',observe:'回看两次普通来球之间，你有没有完成收拍后恢复到能移动的状态。模型不自动划分回合，要你选同类的两次动作。',steps:['先按原习惯打10个同方向慢球，记录下一球到来时还没准备好的次数。','做5次“挥拍、自然收拍、回到准备”的无球循环，不要求固定步数。','再打10球，每次收拍后回到舒服的准备状态，目标方向和力量保持不变。'],check:['比较两组下一球到来时没准备好的次数。','若恢复更从容、击球质量未下降，保留；不能为了回位而截断原有随挥。'],stop:'不急着跳步或照抄职业移动速度，先完整收拍再恢复。',keys:['elbow','tilt'],trainingScope:'可连续接慢球或发球机练习。'},
 samePrep:{title:'先统一准备，再改变目标方向',cue:'准备一样，方向先想好。',change:'只练两个普通落地球方向的准备一致性，不在这版练放小球或临时改拍面。',observe:'对照你向两个方向打球的准备画面，看是否在一开始就摆出完全不同的大动作。没有不同方向视频时，先录下面这组。',steps:['选两个离边线有余量的落地球目标，先以低强度各打5球，作为对照。','空挥5次，转身与引拍沿用同一个舒服动作；每次挥拍前先决定目标，不等到快击球才强拧方向。','再向两个目标各打5球，只保留相同的准备节奏。不会控方向时先只练一个目标。'],check:['用同机位对照两组准备是否更接近，目标命中数是否没有减少。','这里不测对手是否看穿，也不自动识别落点，命中由你记录。'],stop:'不要照搬小球拍面、突然刹拍或最后一刻甩腕。',keys:['elbow','tilt'],trainingScope:'已有基本方向控制的普通正手。'},
 nextBall:{title:'每拍后留出下一拍的准备',cue:'打完这一拍，马上准备下一拍。',change:'只增加自然收拍后的准备动作，不急着收短或抢跑。',observe:'把一次完整挥拍后的一小段也选进视频，观察是否停留在收拍姿势太久。AI不自动识别对手来球。',steps:['按原习惯连续打10球，记录有几次下一球来了仍停在上一次收拍。','空挥5次，每次让随挥自然结束，再回到能向两侧移动的准备姿势。','再打10个慢球，记“收完就准备”，不增加步幅与力量。'],check:['B组没准备好的次数更少，且没有为了赶回位而打断随挥，才算有用。','再拍时保留收拍后的画面，不只录触球一瞬。'],stop:'别把比赛中的跳跃、滑步或冲刺照搬到这组慢练。',keys:['elbow','tilt','knee'],trainingScope:'正手/双反连续慢球练习。'},
 tossRepeat:{title:'先把抛球练到不用追着它发',cue:'抛舒服，再出手。',change:'本轮只练抛球位置与释放的重复性，不同时改站位、蹬地和拍速。',observe:'在抛球侧机位回看：抛球后你是否需要明显挪身或伸手追球？人体模型不跟踪球，落点必须自己观察。',steps:['做10次只抛球、不挥拍：按原习惯抛，让球自然落地，自己记录是否偏到必须追着打的位置。','再做10次，只尝试让抛球手平稳上举并在相近位置自然释放；不强行伸直锁肘，也不抖腕把球弹高。','挑舒服的抛球做5次低强度发球；不舒服的抛球直接放弃重来，不勉强够。'],check:['两组各10次，比较需要明显追球的次数是否减少。','最后5次发球记录进区数与舒适度；抛球更集中但肩膀更紧时不保留。'],stop:'不以更高的抛球为目标；落地球及时收好，避免踩球。',keys:['tossLift','elbow'],trainingScope:'只抛球和低强度上手发球。'},
 frontArm:{title:'让抛球臂自然回落，不急着往下拽',cue:'送上去，自然回来。',change:'只关注非持拍臂回落的顺序，不要求它一直高举，也不强行固定肩膀。',observe:'先确认举拍参考标在向上挥拍之前。回看抛球臂是否像在主动用力往下拽；不能从一帧角度就认定问题。',steps:['先按原习惯低强度发5次，记录自己是否有急着把抛球手拉下的感觉。','不抛球慢空挥5次，手臂上举后随着完整动作自然回落，不把它钉在头顶，也不猛拉向地面。','再低强度发10次，只记“让手臂自然回来”；力量、抛球高度和站位先不动。'],check:['对照慢放中的回落顺序与自己的紧张感，再记录10球进区次数。','动作更轻松且进球未明显变差时再继续；不把肩膀倾角当成功标准。'],stop:'不模仿他人的肩背扭转幅度；肩或腰不适立即停止。',keys:['tossLift','elbow','tilt'],trainingScope:'常规上手发球，低强度节奏练习。'},
 netMargin:{title:'先给过网留余量，再考虑更大力量',cue:'目标留大，挥拍不停。',change:'只改变过网目标的余量，不换成极端握拍、不刻意绕头收拍。',observe:'回看普通正手的完整前挥与随挥。球是否下网、是否落在目标区由你记，人体骨架不能测旋转。',steps:['用相似腰高慢球打10球，数下网、出界和舒服打进场的次数。','把想象中的过网窗口稍抬高一点，仍朝远离边线的宽松目标；先做5次自然空挥，不用手腕硬刷。','再打10球，只尝试这个更宽松的过网窗口，力量保持原来水平。'],check:['比较A、B组下网是否减少，同时出界是否没有增加。','若只是把球打飞更高而失去控制，恢复原窗口；不以旋转量或角度数字验收。'],stop:'不追求职业选手的转速和拍头速度，也不为了上旋猛甩腕。',keys:['elbow','tilt'],trainingScope:'普通腰高正手，已有基本击球能力。'},
 directionFirst:{title:'先选一个大目标，把动作完成在同一方向',cue:'先想落点，再完整挥拍。',change:'只练目标明确的一种方向，不同时追求球速和落点精细度。',observe:'回看准备到前挥是否有临时改向造成的犹豫。AI没看到球路，是否命中必须人工记录。',steps:['在对面场区选择一个远离边线的大目标，按原习惯打10球，记录命中次数。','每球开始前先看一眼目标，再按自己原本舒服的握拍与站位准备，空挥5次。','再打10球，只保留“目标先想好”的习惯。不要在挥拍末段硬掰手腕追目标。'],check:['比较两组大目标命中次数，以及自己临时赶拍/犹豫的次数。','命中不降、动作更顺时才保留。没有必要为了像职业选手把力量加大。'],stop:'目标不放在跑动路线上的硬物旁；力量不变，不追边线。',keys:['elbow','armSpace','tilt'],trainingScope:'普通正手或双反落地球。'},
 serveTarget:{title:'先练一个宽松发球目标，不先追ACE',cue:'方向定好，轻松发进去。',change:'只改发球前的目标选择与相同强度重复，不加力追球速。',observe:'回看两次发球准备是否一致，再手动记录落点。人体模型不识别发球区或球速。',steps:['选发球区中间一个宽松目标，按平时较轻的强度发10球，记进区数和命中目标数。','每次发球前先看目标，做一次轻松空挥，再用相同强度发10球；抛球不舒服就放弃重来。','若第二组更稳定，再保留同样准备流程；本轮不缩小目标、不增加速度。'],check:['A、B两组各10球，先比较进区数，再比较目标命中数。','为了瞄准而肩膀僵硬、动作停顿或进区更少时，先回到更大的目标。'],stop:'不能用职业选手ACE或一发数据作个人达标线。',keys:['tossLift','elbow','knee'],trainingScope:'低强度常规上手发球。'},
 serveReady:{title:'发球后别停在造型里，准备接下一拍',cue:'发完，收稳，准备下一拍。',change:'只增加自然收拍后的准备，不提前转身或缩短随挥。',observe:'片段里保留发球后约一秒，回看是否一直停在收拍姿势。这里只观察后续准备，不从姿态判断落地安全。',steps:['按原节奏低强度发5球，每球后停下来记自己是否已经准备下一拍。','做5次无球循环：完整空挥、自然结束收拍，再回到能移动的准备姿势，不规定跨几步。','再低强度发10球，发完记“准备下一拍”；不用为了快回位打断发球。'],check:['自己数10球里有几次自然收拍后就准备好了，同时记录进区数是否受影响。','若更匆忙、落地别扭或动作被截断，恢复原发球节奏。'],stop:'不模仿职业选手前冲幅度或落地动作；不适停止。',keys:['elbow','knee','tilt'],trainingScope:'能轻松完成上手发球后的衔接练习。'}
};
// Non-specialty slots are explicitly application-authored routes, not athlete facts.
const ROUTES={
 federer:{forehand:{drill:'handPath',source:'federerHand',learn:'学持拍手的简洁路线，不复制拍头的大弧线。'},backhand1:{drill:'oneHandSupport',learn:'以费德勒单反为观看对象，本次练转身准备与自然展开。'},serve:{drill:'serveFlow',learn:'以费德勒发球为观看对象，本次只练连续节奏。'}},
 nadal:{forehand:{drill:'diagonalDepth',source:'nadalPattern',learn:'学先稳住斜线与深度、再选择变化的回合思路。'},backhand2:{drill:'repeatTarget',learn:'以纳达尔双反为观看对象，本次练一拍后恢复准备。'},serve:{drill:'serveTarget',learn:'以纳达尔发球为观看对象，先做左右手方向对应和固定目标练习。'}},
 djokovic:{forehand:{drill:'repeatTarget',learn:'以德约科维奇正手为观看对象，本次练能重复的准备流程。'},backhand2:{drill:'twoHandTurn',source:'djokovicPrep',learn:'学换握拍与转肩同步，不把两件准备工作拆开。'},serve:{drill:'serveFlow',learn:'以德约科维奇发球为观看对象，本次练准备到向上挥拍不中断。'}},
 alcaraz:{forehand:{drill:'samePrep',source:'alcarazShape',learn:'借鉴不轻易暴露意图的准备；先从普通落地球的准备一致性练起。'},backhand2:{drill:'nextBall',learn:'以阿尔卡拉斯双反为观看对象，本次练当前一拍与下一拍的衔接。'},serve:{drill:'serveReady',learn:'以阿尔卡拉斯发球为观看对象，本次练发球后进入下一拍准备。'}},
 serena:{forehand:{drill:'directionFirst',learn:'以小威为学习对象，本次先练目标明确的普通正手，不追求她的力量。'},backhand2:{drill:'twoHandTurn',learn:'以小威双反为观看对象，本次练两手与转身一同准备。'},serve:{drill:'tossRepeat',source:'serenaToss',learn:'学把抛球一致性单独拿出来练，不让每次发球都在追球。'}},
 swiatek:{forehand:{drill:'netMargin',source:'igaMargin',learn:'借鉴有余量的积极击球：先改善过网窗口，不追求职业转速。'},backhand2:{drill:'repeatTarget',learn:'以斯瓦泰克双反为观看对象，本次练每拍后能重复的准备位置。'},serve:{drill:'tossRepeat',learn:'以斯瓦泰克发球为观看对象，本次先做抛球与举拍的重复性练习。'}},
 sabalenka:{forehand:{drill:'directionFirst',learn:'以萨巴伦卡正手为观看对象，先练明确方向与完整挥拍，不照搬大力量。'},backhand2:{drill:'handSpace',learn:'以萨巴伦卡双反为观看对象，本次练不用夹紧双臂的挥拍空间。'},serve:{drill:'frontArm',source:'sabaOffarm',learn:'借鉴关注非持拍臂的思路，先看顺序，不直接认定你有相同问题。'}},
 zheng:{forehand:{drill:'directionFirst',learn:'以郑钦文正手为学习对象，本次按通用教学先练大目标，再考虑力量。'},backhand2:{drill:'twoHandTurn',learn:'以郑钦文双反为观看对象，本次练换握拍与转身的衔接。'},serve:{drill:'serveTarget',source:'zhengTargets',learn:'学先有目标、再兼顾进区稳定性，不只看一发威力。'}}
};
function observation(result,keys){
 const key=keys.find(key=>result.rows?.filter(r=>r.valid&&Number.isFinite(r[key])).length>=6);if(!key)return null;
 const rows=result.rows.filter(r=>r.valid&&Number.isFinite(r[key])),values=rows.map(r=>r[key]).sort((a,b)=>a-b),median=values[Math.floor(values.length/2)];
 const point=rows.reduce((a,b)=>Math.abs(a[key]-median)<=Math.abs(b[key]-median)?a:b);
 const metric=result.metrics?.[key];
 const name={elbow:'持拍臂',auxElbow:'辅助手臂',armSpace:'两侧手臂与躯干',tossLift:'抛球侧上臂',knee:'持拍侧腿部',tilt:'肩髋中线'}[key];
 return {metric:key,name,time:point.t,count:rows.length,low:metric?.low??values[0],high:metric?.high??values.at(-1)};
}
export function buildPlayerAdvice(base,result,options={}){
 if(base.kind==='capture')return base;
 const player=getPlayer(options.learningPlayer),ref=learningReference(player.id,options.stroke,options.hand),meta=configFor(options.stroke),route=ROUTES[player.id]?.[options.stroke];
 if(!ref.compatible||!route)return {...base,notes:[...base.notes,`${player.name}的反手类型与你不同。本次保留${meta.name}建议，不套用这位球员的反手。`],playerPlan:{playerId:player.id,compatible:false,reason:'反手类型不匹配'}};
 let drillId=route.drill;
 const crowding=result.findings?.find(f=>f.kind==='review'&&/被球挤住|双肘靠近/.test(f.title));
 // The same player+stroke changes task priority when an actual visible-space cue exists.
 if(crowding&&['handPath','twoHandTurn','samePrep'].includes(drillId))drillId='handSpace';
 const drill=DRILLS[drillId],sample=observation(result,drill.keys),source=route.source?INSPIRATION_SOURCES[route.source]:null;
 const adaptation=source?'来源支持借鉴方向；下面的口令、次数和步骤由本应用编排，不是球员原课或经过验证的专属处方。':'这一动作暂未核实该选手的专属技术特征。下面按你的学习选择与通用教学编排，不称作球员独家方法。';
 const notes=ref.warnings.slice();
 if(options.plan?.overview)notes.push('当前是整段抽样概览。下面可直接用来练；要精看一拍的准备与前挥，可在原视频选一小段。');
 if(!result.phaseReady)notes.push('没有标记也能练；时间按钮只定位可见身体样本，不代表AI找到了触球。');
 if(options.view==='unknown')notes.push('机位不确定，按同机位前后对照练习，不把投影角度当成三维差距。');
 if(!options.ordinary)notes.push('以下按你所选动作编排；若拍的是削球、高低球、救球或其他动作，先核对练习类型再尝试。');
 const why=sample?`这段视频里有${sample.count}个采样画面能看清${sample.name}，可以从这里回看动作。${crowding&&drillId==='handSpace'?'已有空间相关提醒，所以这次先把舒服间距放在路线调整之前。':'本轮把它作为前后比较的起点，不宣称你已出现某个技术错误。'}`:'当前能保留基础动作观察，但没有适合这项练习的清楚部位样本。本轮先按所选球员的学习方向练，暂不标个人差距。';
 const unit=sample?.metric==='armSpace'?'比例':'角度';
 const card={kind:'player',title:drill.title,priority:'本轮只练这一件事',playerId:player.id,playerName:player.name,drillId,learn:route.learn,cue:drill.cue,change:drill.change,why,time:sample?.time??null,observe:drill.observe,steps:drill.steps,checks:drill.check,check:drill.check.join(' '),avoid:drill.stop,scope:drill.trainingScope,source:options.stroke==='serve'?'serve':options.stroke==='backhand1'?'onehand':options.stroke==='backhand2'?'twohand':'usta',inspiration:source,adaptation,provenance:source?'sourced-inspiration':'application-designed',observation:sample?{metric:sample.metric,count:sample.count,low:sample.low,high:sample.high,sampleTime:sample.time,unit}:null,rule:'球员选择改变练习重点和步骤，不改变你的测量值，也没有建立职业选手角度差模型。自查中的球数、落点与舒适度由你记录，AI不会替你编造结果。'};
 const cues=result.findings?.filter(f=>f.kind==='review').map(f=>({title:f.title,body:f.body,time:f.time}))||[];
 return {kind:'player',heading:`学${player.name}，这次先练${drill.title.replace(/[。！]$/,'')}`,summary:'选手的借鉴点、你的可见画面和这次练法放在一起。先试一轮，只保留更顺、更轻松且效果没有变差的调整。',notes,cards:[card],playerPlan:{playerId:player.id,compatible:true,stroke:options.stroke,drillId,provenance:card.provenance},videoCues:cues};
}
export const PLAYER_ROUTES=ROUTES;
export const PRACTICE_DRILLS=DRILLS;
