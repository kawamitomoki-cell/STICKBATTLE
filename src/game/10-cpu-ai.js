// ========================================================
// ⑪ CPU
// ========================================================
function nearestFoe(p) {
  let best = null, bd = 1e9;
  for (const f of fighters) {
    if (f === p || f.out || sameTeam(p, f)) continue;
    const d = Math.hypot(f.x - p.x, f.y - p.y);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}
function overGround(p) { return stage.plats.some(pl => p.x > pl.x - 10 && p.x < pl.x + pl.w + 10 && pl.y >= p.y - 4); }
function stageMid() {
  const xs = stage.plats.map(p => p.x), xe = stage.plats.map(p => p.x + p.w);
  return (Math.min(...xs) + Math.max(...xe)) / 2;
}
function nearExplosive(p, R) {
  for (const b of bombs) if (b.o !== p.id && !sameTeam(byId(b.o), p) && Math.hypot(b.x - p.x, b.y - (p.y - 30)) < R) return b;
  for (const m of mines) if (m.arm === 0 && m.o !== p.id && !sameTeam(byId(m.o), p) && Math.hypot(m.x - p.x, m.y - p.y) < R * 0.7) return m;
  return null;
}
function incomingProj(p, R) {
  for (const q of projs) {
    if (q.o === p.id || sameTeam(byId(q.o), p)) continue;
    if (Math.sign(q.vx) === Math.sign(p.x - q.x) && Math.abs(q.x - p.x) < R && Math.abs(q.y - (p.y - 34)) < 40) return q;
  }
  return null;
}
function aiTap(I, A) { I.a = true; I.ac++; A.hold = 2; }
function aiSpecial(I, A, hold) { I.s = true; I.sc++; A.shold = hold; }

// AI NAVIGATION V24 — 見た目の距離だけでなく、足場の高さと移動先を評価する。
// 難易度は反応速度と戦術に影響。CPUだけに不自然な移動速度・攻撃力は与えない。
function aiFloorY(){return Math.max(...stage.plats.map(pl=>pl.y));}
function aiJumpRoute(p,t){
  const rise=p.y-t.y;
  if(rise<=165)return {x:t.x,y:t.y};
  // 高すぎる相手には一気に飛ぼうとせず、中段の足場を経由。
  const via=stage.plats.map(pl=>{
    if(pl.y>=p.y-42||pl.y<p.y-168||pl.y<t.y-18)return null;
    const x=Math.max(pl.x+24,Math.min(pl.x+pl.w-24,t.x));
    const entry=Math.max(pl.x+24,Math.min(pl.x+pl.w-24,p.x));
    const score=Math.abs(entry-p.x)*.8+Math.abs(x-t.x)*.35-(p.y-pl.y)*.30;
    return {x:entry,y:pl.y,score};
  }).filter(Boolean).sort((a,b)=>a.score-b.score);
  return via[0]||{x:t.x,y:t.y};
}
function aiEdgeControl(p,I,goalX,shouldJump=false){
  // 崖を横切るときは向こう側の足場へ跳ぶ。孤立した足場の場外へは歩かない。
  if(!p.g||p.groundPl<0)return false;
  const here=stage.plats[p.groundPl];if(!here)return false;
  const dir=Math.sign(goalX-p.x);if(!dir)return false;
  const edge=dir>0?here.x+here.w:here.x;
  const dist=(edge-p.x)*dir;
  if(dist>52)return false;
  const candidates=stage.plats.filter((pl,i)=>i!==p.groundPl&&
    pl.y>=p.y-140&&pl.y<=p.y+95&&
    (dir>0?pl.x+pl.w>edge+12&&pl.x<edge+240:pl.x<edge-12&&pl.x+pl.w>edge-240));
  if(candidates.length){
    // 向こうに安全な着地先があるなら、足場の縁で跳ぶ。
    if((dist<36||shouldJump)&&p.jn<jumpsOf(p)&&p.ai.jumpCd===0){
      I.jc++;p.ai.jumpCd=17;
    }
    return false;
  }
  I.l=false;I.r=false; // 行き先がない崖では停止。
  return true;
}
function aiVerticalPursuit(p,t,I,A,L){
  const dy=t.y-p.y,dx=t.x-p.x,adx=Math.abs(dx);
  const face=dx>=0?'r':'l';
  if(dy>55){
    // プレイヤーが自分より下: 横距離を詰めてから足場をすり抜ける。
    const pl=p.groundPl>=0?stage.plats[p.groundPl]:null;
    const canDrop=!!(p.g&&pl&&pl.y<aiFloorY()-18&&p.a===0&&p.kb===0&&p.stn===0&&p.sph===0&&p.ct===0&&p.ch===0);
    if(canDrop){
      // 相手が真下でなくても、足場の内側から最も近い降下地点へ移動。
      const margin=Math.min(32,pl.w*.22);
      const downX=Math.max(pl.x+margin,Math.min(pl.x+pl.w-margin,t.x));
      if(Math.abs(p.x-downX)<42&&A.dropCd===0){
        A.dropHold=(p.cid==='rubber'||isAnime(p))?12:3;
        A.dropCd=40;
        I.l=false;I.r=false;I.u=false;I.d=true;I.dc++;
        A.t=1;return true;
      }
      if(Math.abs(p.x-downX)>22)I[downX>p.x?'r':'l']=true;
      A.t=Math.max(2,Math.ceil(L.think*.55));return true;
    }
    if(adx>28){I[face]=true;aiEdgeControl(p,I,t.x);}
    A.t=Math.max(2,Math.ceil(L.think*.55));
    return true; // 高低差がある間は空振りの攻撃・必殺技をしない。
  }
  if(dy< -58){
    const target=aiJumpRoute(p,t),goalX=target.x,off=goalX-p.x,dist=Math.abs(off);
    if(dist>24)I[off>0?'r':'l']=true;
    // 少し上の相手は普通のジャンプ。高い相手は経由する足場へ移動。
    const verticallyNeeded=target.y-p.y< -45;
    if(verticallyNeeded&&dist<155&&A.jumpCd===0&&p.jn<jumpsOf(p)&&
        (p.g||(p.vy>=-3&&p.y-target.y>45))){
      I.jc++;A.jumpCd=p.g?18:20;
    }
    aiEdgeControl(p,I,goalX,verticallyNeeded);
    A.t=Math.max(2,Math.ceil(L.think*.5));
    return true;
  }
  return false;
}

// AI V27: position -> threat/defence -> character preference -> mix-up.
// No CPU-only stat cheats; strong CPU improves decisions, not raw damage/speed.
const AI_CHARACTER_PLAN={
 karate:{ideal:50,near:39,far:280,shoot:200,skill:.40,charge:.32,guard:.34},
 ninja:{ideal:62,near:42,far:250,shoot:210,skill:.57,charge:.25,guard:.23},
 bomber:{ideal:190,near:82,far:350,shoot:230,skill:.57,charge:.20,guard:.35},
 sumo:{ideal:47,near:35,far:100,shoot:110,skill:.31,charge:.40,guard:.35},
 boxer:{ideal:45,near:34,far:94,shoot:105,skill:.32,charge:.38,guard:.46},
 yankee:{ideal:51,near:36,far:120,shoot:130,skill:.26,charge:.31,guard:.23},
 swordsman:{ideal:70,near:46,far:205,shoot:200,skill:.54,charge:.40,guard:.28},
 lancer:{ideal:83,near:60,far:300,shoot:260,skill:.64,charge:.43,guard:.28},
 gunman:{ideal:290,near:145,far:425,shoot:405,skill:.76,charge:.20,guard:.48},
 archer:{ideal:295,near:135,far:510,shoot:490,skill:.80,charge:.16,guard:.43},
 berserker:{ideal:55,near:39,far:122,shoot:125,skill:.44,charge:.57,guard:.22},
 rubber:{ideal:111,near:59,far:200,shoot:215,skill:.58,charge:.35,guard:.36},
 goku:{ideal:225,near:83,far:385,shoot:410,skill:.67,charge:.31,guard:.32},
 gojo:{ideal:204,near:80,far:380,shoot:390,skill:.76,charge:.31,guard:.40},
 tanjiro:{ideal:71,near:48,far:178,shoot:195,skill:.62,charge:.36,guard:.32},
 naruto:{ideal:173,near:70,far:370,shoot:400,skill:.73,charge:.30,guard:.30},
 jotaro:{ideal:79,near:49,far:228,shoot:230,skill:.61,charge:.32,guard:.38}
};
function aiReady(p){return p.kb===0&&p.stn===0&&p.a===0&&p.ch===0&&p.ct===0&&p.sph===0&&p.dg===0;}
function aiAim(I,dx){I.l=dx < -10;I.r=dx > 10;}
function aiCounterAction(p,I,A,dx,evade=false){
 if(p.a||p.ch||p.ct||p.sph||p.kb||p.stn)return false;
 if(evade){if(p.dgc!==0)return false;I.l=dx<0;I.r=dx>0;}else{
  if(p.ctc!==0||p.cd!==0)return false;I.l=false;I.r=false;
 }
 I.cc++;A.t=3;return true;
}
function aiUseSpecial(p,I,A,hold=2,dir='neutral'){
 if(!aiReady(p)||p.spc>0||p.reloadT>0&&p.cid==='gunman')return false;
 I.l=false;I.r=false;I.u=false;I.d=false;I.gd=false;I.neutralSpecial=false;I.sideSpecial=0;
 if(dir==='up')I.u=true;
 else if(dir==='down'){I.d=true;I.gd=true;}
 else if(dir==='side'){I[p.f>0?'r':'l']=true;I.sideSpecial=p.f;}
 else I.neutralSpecial=true;
 aiSpecial(I,A,Math.max(2,hold));A.t=2;return true;
}
function aiUpSpecial(p,I,A){
 if(p.rec||!aiReady(p)||p.spc>0&&p.cid!=='boxer'||A.upCd>0)return false;
 if(!aiUseSpecial(p,I,A,2,'up'))return false;
 A.upCd=55;return true;
}
function aiNavigationV27(p,t,I,A,L,plan){
 const dy=t.y-p.y,dx=t.x-p.x,adx=Math.abs(dx);
 const upperReady=!p.rec&&A.upCd<=0&&p.kb===0&&p.stn===0&&p.a===0&&p.sph===0;
 const floor=aiFloorY();
 if(dy>75){
  const pl=p.groundPl>=0?stage.plats[p.groundPl]:null;
  if(p.g&&pl&&pl.y<floor-15&&t.y<floor+28){
   const margin=Math.min(45,pl.w*.25),goal=Math.max(pl.x+margin,Math.min(pl.x+pl.w-margin,t.x));
   if(Math.abs(goal-p.x)>29){aiAim(I,goal-p.x);A.t=3;return true;}
   if(A.dropCd<=0){
    A.dropHold=(p.cid==='rubber'||isAnime(p))?11:3;
    A.dropCd=28;I.d=true;I.dc++;A.t=1;return true;
   }
   A.t=3;return true;
  }
  // 同じ足場にいられない位置の場合は落下を待ち、届く位置へ。
  if(adx>Math.max(85,plan.far*.65)){aiAim(I,dx);aiEdgeControl(p,I,t.x);}
  A.t=3;return true;
 }
 if(dy< -59){
  const goal=aiJumpRoute(p,t),off=goal.x-p.x,dist=Math.abs(off),height=p.y-goal.y;
  if(dist>18)aiAim(I,off);
  // 旧AIは先にreturnして上特殊を一切試さなかった。経由地にも上必殺を使う。
  if(height>90&&dist<125&&upperReady&&
      (p.jn>=jumpsOf(p)||height>148||p.vy>0&&p.y-t.y>110)&&
      (Math.random()<.17+L.read*.52)&&aiUpSpecial(p,I,A))return true;
  if(height>37&&dist<185&&A.jumpCd<=0&&p.jn<jumpsOf(p)&&
     (p.g||p.vy>-2&&p.y-goal.y>40)){
    I.jc++;A.jumpCd=17;
  }
  // ある程度移動して、ジャンプだけでは足場に届かないなら上特殊も使用。
  if(height>60&&dist<110&&upperReady&&p.jn>=jumpsOf(p)&&aiUpSpecial(p,I,A))return true;
  aiEdgeControl(p,I,goal.x,true);A.t=3;return true;
 }
 return false;
}
// Bounded utility controller. Observations contain public fighter state only;
// neither human input nor the opponent's AI command is consulted.
const AI_DIFFICULTY=[
 {reaction:24,think:12,predict:.25,error:.32,defend:.35},
 {reaction:18,think:9,predict:.50,error:.22,defend:.55},
 {reaction:12,think:6,predict:.75,error:.13,defend:.75},
 {reaction:8,think:4,predict:.90,error:.08,defend:.87}
];
// Estimates for special input adapters, not replacements for combat move data.
// startup includes holding time; range is a conservative tactical envelope.
const AI_SKILLS={
 karate:{range:300,startup:6,damage:7,hold:2},
 ninja:{range:250,startup:4,damage:4,hold:2},
 bomber:{range:300,startup:8,damage:14,hold:2},
 sumo:{move:'harite',range:85,startup:9,damage:20,hold:2},
 boxer:{move:'upper',range:65,startup:7,damage:30,hold:2,ready:p=>p.ko>=100},
 yankee:{range:220,startup:2,damage:20,hold:2,ready:p=>p.rage>=100&&!p.rageT},
 swordsman:{range:320,startup:4,damage:26,hold:2,ready:p=>p.senku>=100},
 lancer:{move:'lancerush',range:240,startup:33,damage:22,hold:26},
 gunman:{range:400,startup:5,damage:19,hold:2,ready:p=>p.bullets>0&&!p.reloadT},
 archer:{range:460,startup:29,damage:14,hold:28},
 berserker:{move:'axeheavy',range:95,startup:24,damage:48,hold:2},
 rubber:{move:'rpistol',range:155,startup:7,damage:12,hold:2},
 goku:{range:420,startup:6,damage:9,hold:2},
 gojo:{range:390,startup:33,damage:7,hold:31},
 tanjiro:{move:'tcut1',range:90,startup:5,damage:17,hold:2},
 naruto:{range:400,startup:5,damage:20,hold:2},
 jotaro:{move:'ora',range:100,startup:5,damage:14,hold:2}
};
function aiObserve(p,A,D){
 const target=nearestFoe(p);if(!target)return null;
 const samples=A.observations||(A.observations=[]);
 if(A.targetId!==target.id){A.targetId=target.id;samples.length=0;A.aggression=0;A.evasion=0;}
 samples.push({id:target.id,x:target.x,y:target.y,vx:target.vx,vy:target.vy,g:target.g,
  a:target.a,mv:target.mv?{...target.mv}:null,ch:target.ch,ct:target.ct,dg:target.dg,
  d:target.d,s:target.s,kb:target.kb,ivf:isInvuln(target),cid:target.cid});
 if(samples.length>D.reaction+1)samples.shift();
 if(samples.length<=D.reaction)return null;
 return samples[0];
}
function aiAttackScore(p,t,m,D){
 const lead=Math.min(24,m.startup)*D.predict;
 const x=t.x+t.vx*lead,y=t.y+(t.g?0:t.vy*lead+GRAV*.5*lead*lead);
 const distance=Math.abs(x-p.x),height=Math.abs(y-p.y);
 if(height>65||distance>m.range+18||t.ivf)return -Infinity;
 const recovery=t.mv&&t.a>t.mv.act1?Math.max(0,t.mv.end-t.a):0;
 const punish=recovery>m.startup?12:0;
 const risk=t.mv&&t.a<=t.mv.act1?9:0;
 return 12+m.damage*.35+punish+Math.min(t.d,200)*.025+
  (t.kb>0?5:0)-Math.max(0,distance-m.range)*.6-m.startup*.25-risk;
}
function aiTacticalAction(p,t,A,I,D,plan){
 const dx=t.x-p.x,dist=Math.abs(dx),side=Math.sign(dx)||p.f;
 A.aggression=(A.aggression||0)*.94+(t.a>0||t.ch>0?.06:0);
 A.evasion=(A.evasion||0)*.94+(t.dg>0||t.ct>0?.06:0);
 // Face using ordinary movement before issuing attacks.
 if(side!==p.f&&dist>12){aiAim(I,dx);return 'face';}
 const ready=aiReady(p)&&p.cd===0;
 const threat=t.mv&&t.a<=t.mv.act1&&Math.abs(t.y-p.y)<75&&
  dist<(t.mv.reach+t.mv.R+25)*CC(t.cid).size;
 if(ready&&threat&&Math.random()<D.defend){
  // Heavy attacks are counterable; normal attacks beat counter stance.
  const counter=t.mv.type==='heavy'&&!t.mv.pierce&&!t.mv.ko&&!AXE_KINDS.includes(t.mv.kind);
  if(aiCounterAction(p,I,A,counter?0:-side,!counter))return counter?'counter':'evade';
 }
 if(ready){
  // Safe commitment window for utility abilities, before ranged pokes consume the turn.
  if(dist>160&&!threat&&p.spc<=0){
   if(p.cid==='naruto'&&!p.shadowClone&&p.energy>=60&&shadowClonesAlive(p.id).length<NARUTO_CLONE_MAX){aiUseSpecial(p,I,A,34);return 'clone';}
   if((p.cid==='goku'&&p.energy>=100&&p.form<3||p.cid==='tanjiro'&&p.energy>=100&&!p.modeT||p.cid==='rubber'&&p.gearM>=100&&p.gear<5&&!p.tired)){aiUseSpecial(p,I,A,2,'down');return 'transform';}
  }
  if(p.cid==='jotaro'&&p.energy>=100&&dist<200&&p.spc<=0){aiUseSpecial(p,I,A,2,'down');return 'time-stop';}
  if(p.cid==='gojo'&&p.energy>=100&&dist<250&&p.spc<=0){aiUseSpecial(p,I,A,2,'down');return 'domain';}
  const candidates=[];
  const normal=mkMv('normal',p.w),charge=mkMv('charge',p.w),size=CC(p.cid).size;
  const range=m=>(m.reach+m.R)*size+12;
  candidates.push({name:'tap',score:aiAttackScore(p,t,{range:range(normal),startup:normal.act0+2,damage:6*CC(p.cid).pow},D)});
  candidates.push({name:'charge',score:aiAttackScore(p,t,{range:range(charge),startup:CH_FULL+charge.act0,damage:22*CC(p.cid).pow},D)-(A.aggression||0)*8});
  const skill=AI_SKILLS[p.cid];
  if(skill&&p.spc<=0&&(!skill.ready||skill.ready(p)))candidates.push({name:'special',score:aiAttackScore(p,t,skill,D)});
  // Feint against repeated dodge/counter, bounded so it cannot become endless waiting.
  if((A.evasion||0)>.2&&(A.feintUntil||0)<A.clock-45&&dist<110){A.feintUntil=A.clock+10;return 'feint';}
  if(A.feintUntil>A.clock)return 'feint';
  for(const c of candidates)c.score+=Math.random()*D.error*18-(A.lastAction===c.name?3:0);
  candidates.sort((a,b)=>b.score-a.score);
  const best=candidates[0];
  if(best.score>8&&Math.random()>D.error*.3){
   if(best.name==='tap')aiTap(I,A);
   else if(best.name==='charge'){I.a=true;I.ac++;A.hold=CH_FULL;}
   else aiUseSpecial(p,I,A,skill.hold);
   return best.name;
  }
  if(p.cid==='gunman'&&p.bullets<=2&&dist>200&&!p.reloadT){aiUseSpecial(p,I,A,28);return 'reload';}
 }
 // Press a recovering/knocked-back target, otherwise hold a character-specific spacing.
 const ideal=t.kb>0?Math.min(plan.ideal,90):plan.ideal;
 if(dist>ideal+18)aiAim(I,dx);
 else if(dist<plan.near&&ideal>100)aiAim(I,-dx);
 aiEdgeControl(p,I,p.x+(I.r?1:I.l?-1:0)*150);
 return I.r||I.l?'space':'watch';
}
function aiStep(p){
 const A=p.ai,I=A.inp,D=AI_DIFFICULTY[aiLv]||AI_DIFFICULTY[1];
 A.clock=(A.clock||0)+1;
 const t=aiObserve(p,A,D);
 for(const key of ['jumpCd','dropCd','upCd'])A[key]=Math.max(0,(A[key]||0)-1);
 if(A.hold>0&&!--A.hold&&I.a){I.a=false;I.rc++;}
 if(A.shold>0&&!--A.shold){I.s=I.u=I.gd=I.d=false;I.sideSpecial=0;I.neutralSpecial=false;}
 if(p.out||p.timeStopT>0||p.domainT>0)return;
 if(A.dropHold>0){A.dropHold--;I.d=true;I.l=I.r=false;return;}
 I.d=false;
 if(--A.t>0)return;
 A.t=D.think;
 if(A.hold>0||A.shold>0)return;
 I.l=I.r=I.u=false;I.sideSpecial=0;I.neutralSpecial=false;
 // Self-preservation uses own state, not delayed knowledge of the opponent.
 if(!overGround(p)){
  aiAim(I,stageMid()-p.x);
  if(p.vy>=-2&&A.jumpCd===0){
   if(p.jn<jumpsOf(p)){I.jc++;A.jumpCd=15;}
   else if(!['archer','berserker'].includes(p.cid))aiUpSpecial(p,I,A);
  }
  A.lastAction='recover';return;
 }
 if(!t)return;
 const plan=AI_CHARACTER_PLAN[p.cid]||AI_CHARACTER_PLAN.karate;
 // Only existing rising attacks with a hit volume are used as anti-air.
 if(t.y<p.y-25&&t.y>p.y-100&&Math.abs(t.x-p.x)<55&&['karate','boxer','swordsman','lancer','tanjiro'].includes(p.cid)&&aiUpSpecial(p,I,A)){A.lastAction='anti-air';return;}
 if(aiNavigationV27(p,t,I,A,AI_LV[aiLv]||AI_LV[1],plan)){A.lastAction='navigate';return;}
 // Projectile response requires a visible hazard to persist for the reaction window.
 const hazard=incomingProj(p,230)||nearExplosive(p,110);
 if(hazard){
  if(A.hazard!==hazard){A.hazard=hazard;A.hazardAt=A.clock;}
  if(A.clock-A.hazardAt>=D.reaction&&Math.random()<D.defend&&aiCounterAction(p,I,A,0,false)){A.lastAction='projectile-guard';return;}
 }else A.hazard=null;
 const action=aiTacticalAction(p,t,A,I,D,plan);A.lastAction=action;
 A.actions=A.actions||{};A.actions[action]=(A.actions[action]||0)+1;
}
