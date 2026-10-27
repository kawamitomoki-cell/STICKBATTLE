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
function aiSelectSpecial(p,t,I,A,L,plan,adx,dy){
 if(!aiReady(p))return false;
 const aligned=Math.abs(dy)<78,veryAligned=Math.abs(dy)<55,prob=Math.min(.98,L.spec*1.50*plan.skill+.09);
 const near=adx<plan.near,mid=adx>=plan.near&&adx<plan.shoot;
 if(p.cid==='boxer')return p.ko>=100&&aligned&&adx<78&&aiUseSpecial(p,I,A,2);
 if(p.cid==='yankee')return p.rage>=RAGE_MAX&&p.rageT<=0&&aiUseSpecial(p,I,A,2);
 if(p.cid==='swordsman')return p.senku>=SENKU_MAX&&adx<340&&veryAligned&&aiUseSpecial(p,I,A,2);
 if(p.cid==='rubber'){
  if(p.gearM>=100&&p.gear<5&&!p.tired)return aiUseSpecial(p,I,A,2,'down');
  if(mid&&veryAligned&&Math.random()<prob)return aiUseSpecial(p,I,A,2,'side');
  if(adx<185&&veryAligned&&Math.random()<prob*.60)return aiUseSpecial(p,I,A,2);
  return false;
 }
 if(isAnime(p)){
  if(p.cid==='goku'){
   if(p.energy>=100&&p.form<3)return aiUseSpecial(p,I,A,2,'down');
   if(adx>210&&p.energy<88&&Math.random()<prob*.65)return aiUseSpecial(p,I,A,35,'down');
   if(adx>280&&veryAligned&&Math.random()<prob)return aiUseSpecial(p,I,A,65);
   if(mid&&veryAligned&&Math.random()<prob*.55)return aiUseSpecial(p,I,A,2);
  }else if(p.cid==='gojo'){
   if(p.energy>=100&&adx<285)return aiUseSpecial(p,I,A,2,'down');
   if(veryAligned&&adx<130&&Math.random()<prob)return aiUseSpecial(p,I,A,2,'side');
   if(veryAligned&&adx<440&&Math.random()<prob)return aiUseSpecial(p,I,A,adx>250?155:adx>160?43:5);
  }else if(p.cid==='tanjiro'){
   if(p.energy>=100&&!p.modeT)return aiUseSpecial(p,I,A,2,'down');
   if(veryAligned&&adx<190&&Math.random()<prob)return aiUseSpecial(p,I,A,2,adx<95?'neutral':'side');
  }else if(p.cid==='naruto'){
   if(p.energy>=100&&p.form<2)return aiUseSpecial(p,I,A,2,'down');
   if(veryAligned&&adx<165&&Math.random()<prob)return aiUseSpecial(p,I,A,2,'side');
   if(veryAligned&&adx>115&&adx<430&&Math.random()<prob)return aiUseSpecial(p,I,A,2);
  }else if(p.cid==='jotaro'){
   if(p.energy>=100)return aiUseSpecial(p,I,A,2,'down');
   if(veryAligned&&adx<105&&Math.random()<prob)return aiUseSpecial(p,I,A,2);
   if(veryAligned&&adx<240&&Math.random()<prob)return aiUseSpecial(p,I,A,2,'side');
  }
  return false;
 }
 if(p.cid==='gunman'){
  if(p.bullets<=0){if(p.reloadT<=0)return aiUseSpecial(p,I,A,28);return false;}
  if(veryAligned&&adx<plan.shoot&&adx>80&&Math.random()<prob)return aiUseSpecial(p,I,A,2);
  if(p.bullets<=2&&adx>220&&Math.random()<prob*.75)return aiUseSpecial(p,I,A,27);
  return false;
 }
 if(p.cid==='archer')return veryAligned&&adx>105&&adx<plan.shoot&&Math.random()<prob&&aiUseSpecial(p,I,A,adx>220?42:24);
 if(p.cid==='lancer')return veryAligned&&adx>=90&&adx<290&&Math.random()<prob&&aiUseSpecial(p,I,A,26+Math.floor(Math.random()*23));
 if(p.cid==='bomber')return veryAligned&&adx>=115&&adx<385&&Math.random()<prob&&aiUseSpecial(p,I,A,Math.random()<.24?21:2);
 if(p.cid==='ninja')return veryAligned&&adx>=62&&adx<280&&Math.random()<prob&&aiUseSpecial(p,I,A,2);
 if(p.cid==='karate')return veryAligned&&adx>=100&&adx<345&&Math.random()<prob&&aiUseSpecial(p,I,A,2);
 if(p.cid==='sumo')return veryAligned&&adx<90&&Math.random()<prob&&aiUseSpecial(p,I,A,2);
 if(p.cid==='berserker')return veryAligned&&adx<130&&Math.random()<prob&&aiUseSpecial(p,I,A,2);
 return false;
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
function aiStep(p){
 const A=p.ai,I=A.inp,L=AI_LV[aiLv]||AI_LV[1],plan=AI_CHARACTER_PLAN[p.cid]||AI_CHARACTER_PLAN.karate;
 A.jumpCd=Math.max(0,(A.jumpCd||0)-1);A.dropCd=Math.max(0,(A.dropCd||0)-1);A.upCd=Math.max(0,(A.upCd||0)-1);
 if(A.hold>0){A.hold--;if(A.hold===0&&I.a){I.a=false;I.rc++;}}
 if(A.shold>0){A.shold--;if(A.shold===0){I.s=false;I.u=false;I.gd=false;I.d=false;I.sideSpecial=0;I.neutralSpecial=false;}}
 if(A.dropHold>0){I.d=true;I.u=false;I.l=false;I.r=false;A.dropHold--;if(A.dropHold===0)I.d=false;A.t=1;return;}
 I.d=false;
 if(p.out)return;
 if(--A.t>0)return;
 A.t=Math.max(2,L.think+Math.floor(Math.random()*Math.max(1,L.think*.6)));
 if(A.hold>0||A.shold>0)return;
 I.l=false;I.r=false;I.u=false;I.sideSpecial=0;I.neutralSpecial=false;
 if(!overGround(p)){
  I[p.x<stageMid()?'r':'l']=true;
  if(p.vy>=-2){if(p.jn<jumpsOf(p)&&A.jumpCd===0){I.jc++;A.jumpCd=15;}
   else if(!p.rec&&A.upCd===0)aiUpSpecial(p,I,A);}
  A.t=3;return;
 }
 const t=nearestFoe(p);if(!t)return;
 const dx=t.x-p.x,dy=t.y-p.y,adx=Math.abs(dx),aligned=Math.abs(dy)<67,ideal=plan.ideal;
 const danger=nearExplosive(p,115),incoming=incomingProj(p,175);
 if(danger&&Math.random()<L.read){const dir=p.x>=danger.x?1:-1;
  if(aiCounterAction(p,I,A,dir,true))return;aiAim(I,dir*150);A.t=3;return;}
 if(incoming&&Math.random()<L.read){const dir=p.x>=incoming.x?1:-1;
  if(aiCounterAction(p,I,A,0,false))return;
  aiAim(I,dir*120);A.t=3;return;}
 // 戦闘と追跡を両立。上下差がある時は届かない水平攻撃を出さない。
 if(aiNavigationV27(p,t,I,A,L,plan))return;
 // 着地直後に敵が接近していた場合も、高低差が小さければ格闘判断へ。
 const ready=aiReady(p);
 const enemyAttacking=t.mv&&t.a>0&&t.a<=Math.max(t.mv.act0+3,t.mv.act1);
 if(ready&&aligned&&enemyAttacking&&adx<110&&Math.random()<L.read*plan.guard){
   const normal=t.mv.type==='normal';
   if(normal&&aiCounterAction(p,I,A,0,false))return;
   if(!normal&&aiCounterAction(p,I,A,dx>0?-1:1,true))return;
 }
 if(ready&&aligned&&t.ch>=CH_TH&&adx<110&&Math.random()<L.read*.65){
   if(aiCounterAction(p,I,A,dx>0?-1:1,true))return;
 }
 // キャラクターの得意距離。射撃キャラは後退するが、接近戦の通常技も使う。
 let desired=0;
 if(adx>ideal+(ideal>140?35:16))desired=Math.sign(dx);
 else if(adx<plan.near&&plan.ideal>100)desired=-Math.sign(dx);
 if(p.cid==='gunman'||p.cid==='archer'||p.cid==='bomber'){
   if(adx<plan.near&&Math.random()<.75)desired=-Math.sign(dx);
   if(adx>plan.far)desired=Math.sign(dx);
 }
 const sameY=Math.abs(dy)<55;
 // 正面を向いて技を使用。p.f は実際の移動方向入力で更新される。
 if(sameY&&ready&&p.cd===0&&adx<=Math.max(92,plan.shoot)){
  if(p.f!==Math.sign(dx)&&adx>12){aiAim(I,dx);A.t=2;return;}
  // 相手が近すぎるときは遠隔技にこだわらず格闘で切り返す。
  if(adx<plan.near+18){
   const roll=Math.random();
   if(roll<L.read*.21&&aiCounterAction(p,I,A,0,false))return;
   if(roll<.50){aiTap(I,A);A.t=2;return;}
   if(roll<.78){I.a=true;I.ac++;A.hold=18+Math.floor(Math.random()*29);A.t=3;return;}
   if(aiSelectSpecial(p,t,I,A,L,plan,adx,dy))return;
   aiTap(I,A);A.t=2;return;
  }
  // 使いどころがよければ必殺技、そうでなければ通常・溜め・移動を選ぶ。
  if(Math.random()<Math.min(.90,L.spec*1.8+plan.skill*.20)&&aiSelectSpecial(p,t,I,A,L,plan,adx,dy))return;
  if(adx<Math.max(plan.near+19,81)&&Math.random()<.45){
   if(Math.random()<plan.charge){I.a=true;I.ac++;A.hold=CH_FULL-4+Math.floor(Math.random()*6);}
   else aiTap(I,A);
   A.t=3;return;
  }
 }
 // 敵と接触して詰まるケース：距離をずらして仕切り直す／ジャンプで背後へ。
 if(adx<26&&aligned&&p.g&&Math.random()<.26){I.jc++;A.jumpCd=15;A.t=3;return;}
 if(desired){aiAim(I,desired*100);if(aiEdgeControl(p,I,p.x+desired*160))A.t=5;}
 if(!desired&&adx<plan.near&&aligned){
   // 射撃キャラでも近距離の格闘を使う。近接キャラは通常攻撃やカウンターで応戦。
   if(ready&&p.cd===0){if(Math.random()<.65)aiTap(I,A);else if(!aiCounterAction(p,I,A,0,false))aiTap(I,A);}
 }
 if(aiLv<2&&Math.random()<L.err*.55){I.l=Math.random()<.5;I.r=!I.l;}
 A.t=Math.max(2,Math.floor(L.think*.65));
}

