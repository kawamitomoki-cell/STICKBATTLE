// ========================================================
// ⑧ キャラの動き
// ========================================================
const TIMERS = ['inv', 'cd', 'cs', 'ctc', 'dgc', 'sh', 'plk', 'spc', 'rise', 'arm', 'dropT'];

function rageOn(p) { return !!p && p.cid === 'yankee' && p.rageT > 0; }
function weightFactor(p) { return fighterConfig(p).wt * (rageOn(p) ? RAGE_WT : 1) * gearStat(p).wt; }
function addRage(p, amount) {
  if (!p || p.cid !== 'yankee' || p.rageT > 0 || !isLocal(p) || p.rage >= RAGE_MAX) return;
  const before = p.rage;
  p.rage = Math.min(RAGE_MAX, p.rage + Math.max(0, amount));
  if (before < RAGE_MAX && p.rage >= RAGE_MAX) {
    sfxKOReady();
    popups.push({ x: p.x, y: p.y - 112, txt: 'RAGE READY!', life: 55, max: 55, size: 24, c: '#ef4747' });
  }
}
function gainRage(p, dm) { addRage(p, Math.max(0, dm) * RAGE_HIT_GAIN); }
function gainRagePassive(p) { addRage(p, RAGE_PASSIVE_FILL); }
function gainSenku(p, n) {
  if (!p || p.cid !== 'swordsman' || !isLocal(p) || p.senku >= SENKU_MAX) return;
  const before = p.senku; p.senku = Math.min(SENKU_MAX, p.senku + n);
  if (before < SENKU_MAX && p.senku >= SENKU_MAX) {
    sfxKOReady(); popups.push({ x: p.x, y: p.y - 112, txt: '旋空 READY!', life: 50, max: 50, size: 22, c: '#bde0fe' });
  }
}
function beginReload(p) {
  if (!p || p.cid !== 'gunman' || p.reloadT > 0 || p.bullets >= GUN_MAX) return;
  p.reloadT = GUN_RELOAD; p.sph = 0; p.spc = Math.max(p.spc,GUN_COOLDOWN);
  popups.push({ x: p.x, y: p.y - 105, txt: 'RELOAD...', life: 32, max: 32, size: 18, c: '#ffd166' });
  sfxReload();
}

function clearActs(p) { p.a = 0; p.mv = null; p.ch = 0; p.ct = 0; p.dg = 0; p.qa = 0; p.sh = 0; p.sph = 0; p.arm = 0; p.senkuWind = 0; }
function isInvuln(p) {
 if(p&&p.cid==='goku'&&p.form===3)return true;
 return p.remote ? !!p.ivf : (p.inv > 0 || (p.dg >= DG_INV0 && p.dg <= DG_INV1));
}
function isArmored(p) { return p.ch > 0 || p.arm > 0 || (p.cid === 'rubber' && p.gear === 5); }
function inCounter(p) { return p.ct >= CT_ON && p.ct <= CT_OFF + CC(p.cid).ctx; }
function isActive(p) { return p.mv && p.a >= p.mv.act0 && p.a <= p.mv.act1; }
const AXE_KINDS = ['axeheavy', 'axeup'];
const armorCut = (t, dm) => (t && t.cid === 'berserker' ? dm * 0.5 : dm)*(t?.cid==='eren'&&t.erenHard>0?.7:1); // 狂戦士の鎧：被ダメ半減
const fromFront = (t, ax) => Math.abs(ax - t.x) < 6 || Math.sign(ax - t.x) === t.f;

function gainKO(p, n) {
  if (!p || p.cid !== 'boxer' || p.ko >= 100 || !isLocal(p)) return;
  p.ko = Math.min(100, p.ko + n);
  if (p.ko >= 100) announceKO(p);
}

function chargeTick(p, inp) {
  if (p.ch > 0 && inp.a) {
    p.ch++;
    if (p.ch === CH_FULL && !p.cpu) sfxChargeFull();
    if (p.ch >= CH_OVER) {
      p.ch = 0; p.qa = 0; p.dg = 0; p.stn = STUN_T;
      sfxStun();
      popups.push({ x: p.x, y: p.y - 110, txt: 'OVERHEAT!', life: 50, max: 50, size: 26, c: '#ef4747' });
    }
  }
}

function fireAttack(p, ch) {
  if(animeBasic(p,ch))return;
  const C = fighterConfig(p);
  let mv;
  if (p.cid==='gojo' && ch >= CH_FULL) {
    // 五条の最大溜め攻撃は確定黒閃。通常の溜め斬りではなく、黒赤の踏み込み打撃になる。
    mv = { ...mkMv('gblackflash'), dm: 21.5, k0: 16.5, ks: 0.125, up: 0.72, lunge: 12, ko: true, pierce: true, minKb: 26, maxChargeBF: true };
  } else if (ch >= CH_TH) {
    const pw = 0.3 + 0.7 * Math.min(ch - CH_TH, CH_FULL - CH_TH) / (CH_FULL - CH_TH);
    mv = { ...mkMv('charge', p.w), dm: 10 + 12 * pw, k0: 8 + 9 * pw, ks: 0.10, up: 0.6, lunge: 7 * pw };
  } else {
    mv = { ...mkMv('normal', p.w), dm: 6, k0: 4.5, ks: 0.05, up: 0.6, lunge: 0 };
  }
  if(p.cid==='boxer'&&mv.kind==='normal'&&!p.w)mv.dm=10.5;
  if(p.cid==='yankee'&&mv.kind==='normal'&&!p.w)mv.dm=8.5;
  if(p.cid==='berserker'&&!p.w){mv.dm=mv.kind==='normal'?10:mv.dm;mv.act0+=5;mv.act1+=5;mv.end+=13;mv.reach+=18;mv.R+=4;}
  mv.dm *= C.pow; mv.k0 *= C.pow;
  if (p.cid === 'swordsman') { mv.reach += (mv.kind === 'charge' ? 22 : 18); mv.R += 5; mv.charSword = true; }
  if (p.cid === 'lancer') { mv.reach += (mv.kind === 'charge' ? 44 : 34); mv.R += 2; mv.charSpear = true; }
  if (rageOn(p)) {
    mv.dm *= RAGE_DMG; mv.k0 *= RAGE_KB; mv.ks *= RAGE_KB;
    if (mv.kind === 'normal') { mv.ragePunch = true; mv.k0 = Math.max(mv.k0, 13.5); mv.ks = Math.max(mv.ks, 0.105); }
  }
  if (p.cid === 'rubber' && !p.w) {
    const gs = gearStat(p); decorateRubber(mv, p);
    mv.act0 += 1; mv.act1 += 2; mv.end += 4; mv.dm *= gs.dm; mv.k0 *= gs.kb;
  }
  animeDecorate(p,mv);
  if (mv.sword) { mv.dm *= 1.3; mv.k0 *= 1.2; p.am -= (mv.kind === 'charge' ? 2 : 1); }
  p.mv = mv; p.a = 1; p.hit = {};
  if (p.cid==='gojo' && mv.kind==='gblackflash' && mv.maxChargeBF) animeCall(p,'黒閃','#ff646b',true,1.08,.78);
}

function startSpecial(p) {
  if (p.spc > 0 && !['boxer','yankee','swordsman','lancer','gunman'].includes(p.cid)) { if (!p.cpu) sfxNo(); return; }
  const C = fighterConfig(p);
  if(p.cid==='archer'){p.sph=1;sfxBowDraw();return;}
  if(p.cid==='berserker'){startAxe(p,false);return;}
  if (p.cid === 'karate') {
    spawnProj(p, 'hado'); p.spc = 22; p.sh = 12; sfxHado();
  } else if (p.cid === 'ninja') {
    spawnProj(p, 'shuri'); p.spc = 9; p.sh = 6; sfxShuri();
  } else if (p.cid === 'bomber') {
    p.sph = 1;
  } else if (p.cid === 'sumo') {
    p.mv = { ...mkMv('harite'), dm: 20 * C.pow, k0: 15 * C.pow, ks: 0.10, up: 0.55, lunge: 5 };
    p.a = 1; p.hit = {}; p.spc = 150; sfxWindup();
  } else if (p.cid === 'boxer') {
    if (p.ko >= 100) {
      p.mv = { ...mkMv('upper'), dm: 30 * C.pow, k0: 22 * C.pow, ks: 0.16, up: 1.5, lunge: 3, ko: true };
      p.a = 1; p.hit = {}; p.ko = 0; sfxWindup();
    } else if (!p.cpu) sfxNo();
  } else if (p.cid === 'yankee') {
    if (p.rage >= RAGE_MAX && p.rageT <= 0) triggerRage(p);
    else if (!p.cpu) sfxNo();
  } else if (p.cid === 'swordsman') {
    if (p.senku >= SENKU_MAX) {
      p.senku=0; p.senkuWind=0; p.spc=34;
      fireSenkuSlash(p);
    } else if (!p.cpu) sfxNo();
  } else if (p.cid === 'lancer') {
    if (p.spc === 0) { p.sph = 1; sfxWindup(); }
    else if (!p.cpu) sfxNo();
  } else if (p.cid === 'gunman') {
    if (p.reloadT > 0) { if (!p.cpu) sfxNo(); return; }
    if (p.bullets <= 0) { beginReload(p); return; }
    if (p.spc === 0) p.sph = 1;
    else if (!p.cpu) sfxNo();
  }
}

function triggerRage(p) {
  const e = { k: 'rage', id: p.id, x: Math.round(p.x), y: Math.round(p.y - 30) };
  doRageTransform(e, false);
}
function doRageTransform(e, remote) {
  if(online&&!cinDispatching){requestCinematic('rage',e);return;}
  const p = byId(e.id); if (!p) return;
  p.rage = 0; p.rageT = RAGE_T; p.sph = 0; p.spc = 0;
  if (isLocal(p)) { clearActs(p); p.inv = Math.max(p.inv, RAGE_FREEZE + 8); }
  freezeT = RAGE_FREEZE; freezeMax = RAGE_FREEZE; fzType = 'rage';
  fz = { x: e.x, y: e.y, att: e.id, cnt: e.id };
  shake = 8; sfxRage();
}

function fireLanceRush(p, hold) {
  const C = CC(p.cid), pw = constrain((hold - 1) / 55, 0, 1);
  p.mv = { ...mkMv('lancerush'), dm: (13 + 17 * pw) * C.pow, k0: (9 + 13 * pw) * C.pow,
    ks: 0.09 + 0.04 * pw, up: 0.42, lunge: 10 + 18 * pw, reach: 62 + 26 * pw, glow: 5, rush: 1 };
  p.a = 1; p.hit = {}; p.sph = 0; p.spc = 24; p.arm = 18; sfxWindup();
}
function fireGunmanShot(p) {
  if(p.spc>0)return;
  if (p.bullets <= 0 || p.reloadT > 0) { beginReload(p); return; }
  p.bullets--; p.spc = GUN_COOLDOWN; p.sh = 12; spawnProj(p, 'gunshot'); sfxRevolver(); p.vx -= p.f * 1.5;
  burst(p.x+p.f*40,p.y-36,7,4,'#ffe6ac',4); shake=Math.max(shake,3);
  if (p.bullets <= 0) beginReload(p);
}


// 上＋特殊：キャラごとの上必殺技（空中で1回まで、着地で回復）
function upSpecial(p, dir) {
  const C = fighterConfig(p);
  const noJump = ['archer','berserker'].includes(p.cid);
  if(['archer','berserker'].includes(p.cid)&&p.spc>0)return;
  p.rec = true; p.hit = {};
  if (!noJump) { p.jn = jumpsOf(p); p.rise = 20; p.g = false; }
  if(p.cid==='archer'){fireArrows(p,0,true);return;}
  if(p.cid==='rubber'){
    p.vy = -18.5 * gearStat(p).jump; p.vx += p.f * 1.2;
    p.mv = { ...mkMv('rjump'), dm: 7 * gearStat(p).dm, k0: 7 * gearStat(p).kb, ks: 0.07, up: 1.3 }; p.a = 1;
    popups.push({x:p.x,y:p.y-105,txt:'ゴムゴムのロケット！',life:34,max:34,size:18,c:'#ffd55e'});
    const e = { k: 'vfx', v: 'rjump', x: Math.round(p.x), y: Math.round(p.y) }; vfx(e); send(e); return;
  }
  if(p.cid==='berserker'){startAxe(p,true);return;}
  if (p.cid === 'karate') {
    p.vy = -15.2; p.vx += p.f * 2.6;
    p.mv = { ...mkMv('shoryu'), dm: 15 * C.pow, k0: 11 * C.pow, ks: 0.10, up: 1.45, R: 34, yo: 56 }; p.a = 1;
    burst(p.x + p.f * 8, p.y - 30, 10, 4.5, '#ff8c3a', 12); ring(p.x + p.f * 8, p.y - 34, 16, 12); sfxRise();
  } else if (p.cid === 'boxer') {
    p.vy = -13.5; p.mv = { ...mkMv('jupper'), dm: 7 * C.pow, k0: 6 * C.pow, ks: 0.06, up: 1.3 }; p.a = 1; sfxRise();
  } else if (p.cid === 'sumo') {
    p.vy = -12.5; p.arm = 16; p.mv = { ...mkMv('tsuki'), noHit: true, dm: 0, k0: 0, ks: 0, up: 0 }; p.a = 1; sfxWindup();
    const e={k:'vfx',v:'sumoLift',id:p.id,x:p.x,y:p.y};vfx(e);send(e);
  } else if (p.cid === 'bomber') {
    p.vy = -15.5; p.mv = { ...mkMv('blastj'), dm: 8, k0: 7.5, ks: 0.07, up: 0.9 }; p.a = 1;
    const e = { k: 'vfx', v: 'blast', x: Math.round(p.x), y: Math.round(p.y) }; vfx(e); send(e);
  } else if (p.cid === 'ninja') {
    const d = dir || p.f; const e1 = { k: 'vfx', v: 'smoke', x: Math.round(p.x), y: Math.round(p.y - 30) };
    p.x += d * 50; p.y -= 120; p.vy = -4; p.vx = d * 3; p.inv = Math.max(p.inv, 12);
    const e2 = { k: 'vfx', v: 'smoke', x: Math.round(p.x), y: Math.round(p.y - 30) }; vfx(e1); vfx(e2); send(e1); send(e2);
  } else if (p.cid === 'yankee') {
    p.vy = -15.0 * (rageOn(p) ? 1.08 : 1); p.mv = { ...mkMv('gutsj'), noHit: true, dm: 0, k0: 0, ks: 0, up: 0 }; p.a = 1;
    burst(p.x, p.y - 8, 12, 5, rageOn(p) ? '#ef4747' : '#ffffff', 9); sfxRise();
  } else if (p.cid === 'swordsman') {
    p.vy = -13.8; p.vx += p.f * 1.2;
    p.mv = { ...mkMv('swordup'), dm: 10 * C.pow, k0: 7.5 * C.pow, ks: 0.075, up: 1.25, charSword: true }; p.a = 1; sfxSlash();
  } else if (p.cid === 'lancer') {
    p.vy = -15.2; p.vx += p.f * 1.5;
    p.mv = { ...mkMv('lanceup'), dm: 12 * C.pow, k0: 9 * C.pow, ks: 0.08, up: 1.25, charSpear: true }; p.a = 1; sfxSlash(); sfxRise();
    burst(p.x, p.y - 6, 10, 4, '#e2f4ff', 8);
  } else if (p.cid === 'gunman') {
    p.vy = -15.5; p.sph = 0;
    p.mv = { ...mkMv('gunjump'), dm: 9, k0: 8, ks: 0.075, up: 0.95 }; p.a = 1; p.sh = 10;
    const e = { k: 'vfx', v: 'gunjump', x: Math.round(p.x), y: Math.round(p.y) }; vfx(e); send(e);
  }
}


function vfx(e) {
  if(e.v==='axeSwing'){sfxAxeSwing();shake=Math.max(shake,4);specialNotices.push({kind:'axeDust',x:e.x,y:e.y,life:20});burst(e.x,e.y,10,3,'#d4b99a',6);return;}
  if(e.v==='sumoLift'){specialNotices.push({kind:'sumoLift',x:e.x,y:e.y,life:24});burst(e.x,e.y+4,9,2,'#d9dddc',4);return;}
  if(e.v==='koReady'){specialNotices.push({id:e.id,life:70});sfxKOArmed();ring(e.x,e.y,9,18);return;}
  if (e.v === 'rjump') { ring(e.x, e.y + 2, 10, 12); burst(e.x, e.y, 10, 4, '#7fe3cf', 7); sfxRubber(); return; }
  if (e.v === 'gunjump') {
    burst(e.x, e.y + 4, 20, 8, '#ffd166', 10); burst(e.x, e.y + 4, 10, 5, '#ffffff', 7);
    ring(e.x, e.y + 4, 12, 12); shake = Math.max(shake, 6); sfxRevolver(); noiseHit(0.25, 0.3, 800);
    return;
  }
  if (e.v === 'blast') {
    burst(e.x, e.y, 26, 9, '#f4a261', 12); burst(e.x, e.y, 12, 6, '#ffffff', 8);
    ring(e.x, e.y, 14, 14);
    shake = Math.max(shake, 8);
    sfxBoom();
  } else if (e.v === 'smoke') {
    specialNotices.push({kind:'smoke',x:e.x,y:e.y,life:24});
    burst(e.x, e.y, 16, 4, '#9aa5ad', 14); burst(e.x, e.y, 8, 3, '#ffffff', 10);
    sfxSmoke();
  } else if (e.v === 'senkuCharge') {
    burst(e.x, e.y, 18, 5, '#90e0ef', 12); ring(e.x, e.y, 22, 18); ring(e.x, e.y, 12, 12);
    popups.push({ x:e.x, y:e.y-76, txt:'……！', life:SENKU_WIND, max:SENKU_WIND, size:28, c:'#ffffff' });
    sfxSenkuCharge();
  }
}

function stepFighter(p, inp) {
  const prev = p.prev;
  if(p.timeStopT>0){
    p.timeStopT--;p.prev={...inp};p.ch=0;p.ct=0;if(p.timeStopT===0)releaseStoppedHits(p);
    return; // 本当の時止め：入力だけでなく移動・重力・ノックバック進行も停止。受けた攻撃の速度は時が動いた瞬間に反映。
  }
  const domainLocked=p.domainT>0;
  if(domainLocked){p.domainT--;inp=blankInput();}
  p.prev = { ...inp };
  if (p.out) return;
  const C = fighterConfig(p);
  const jp = inp.jc !== prev.jc, ap = inp.ac !== prev.ac, ar = inp.rc !== prev.rc;
  const cp = inp.cc !== prev.cc, sp = inp.sc !== prev.sc, xp = inp.xc !== prev.xc;
  const dp = inp.dc !== prev.dc;
  for (const k of TIMERS) if (p[k] > 0) p[k]--;
  if(domainLocked){clearActs(p);p.ch=0;p.ct=0;}
  if (p.cid === 'boxer') gainKO(p, 100 / (18 * 60));
  if (p.cid === 'swordsman') gainSenku(p, SENKU_FILL);
  rubberTick(p);animeTick(p);
  if (p.cid === 'yankee' && p.rageT <= 0) gainRagePassive(p);
  if (p.rageT > 0) { p.rageT--; if (p.rageT === 0 && p.cid === 'yankee') popups.push({ x:p.x, y:p.y-105, txt:'RAGE END', life:32, max:32, size:18, c:'#ffffff' }); }
  if (p.cid === 'gunman' && p.reloadT > 0) {
    p.reloadT--;
    if(p.reloadT===70||p.reloadT===35)sfxReload();
    if (p.reloadT === 0) { p.bullets = GUN_MAX; p.spc = 0; popups.push({ x:p.x, y:p.y-105, txt:'RELOADED!', life:32, max:32, size:18, c:'#ffd166' }); sfxPickup(); }
  }

  if (xp && p.kb === 0) dropWeapon(p, false);

  if (p.senkuWind > 0 && p.kb === 0 && p.stn === 0) {
    p.senkuWind--;
    p.vx *= 0.45; p.r *= 0.35;
    if (p.senkuWind === 24 || p.senkuWind === 10) { ring(p.x, p.y - 34, 18 + (SENKU_WIND - p.senkuWind) * 0.7, 10); }
    if (p.senkuWind === 0) fireSenkuSlash(p);
  } else if (p.kb > 0) {
    p.kb--;
    p.r += p.vx * 0.06 + p.f * 0.05;
    p.vx *= 0.985;
    clearActs(p);
  } else if (p.stn > 0) {
    p.stn--;
    p.vx *= 0.8;
    p.r = sin(frameCount * 0.2) * 0.15;
    clearActs(p);
  } else if (p.dg > 0) {
    p.dg++;
    p.vx = p.dgd * DG_SPD * C.dgs * (1 - 0.6 * p.dg / DG_T);
    if (!p.g) p.vy *= 0.6;
    p.r *= 0.5;
    chargeTick(p, inp);
    if (ar && p.ch > 0) { p.qa = p.ch; p.ch = 0; }
    if (p.dg > DG_T) {
      p.dg = 0; p.dgc = Math.round(DG_COOL * C.dgc);
      if (p.qa) { fireAttack(p, p.qa); p.qa = 0; }
    }
  } else if (p.ct > 0) {
    p.ct++;
    p.vx *= 0.7;
    p.r *= 0.5;
    if (p.ct > CT_END + C.ctx) { p.ct = 0; p.cd = 6; }
  } else {
    p.r *= 0.5;
    const dir = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
    const axeLocked=p.a>0&&p.mv&&['axeheavy','axeup'].includes(p.mv.kind);
    const slow = animeLocked(p)?0:axeLocked?0.06:(p.cid==='archer'&&p.sph>0)?0.7:p.ch > 0 ? 0.35 : (p.cid === 'lancer' && p.sph > 0 ? 0.12 : (p.a > 0 ? (p.cid==='eren'?0.85:0.5) : 1));
    const moveSpd = animeStats(p).spd * C.spd * (rageOn(p) ? RAGE_SPD : 1) * gearStat(p).spd * (p.tired > 0 ? 0.5 : 1);
    if(animeLocked(p))p.vx=0;
    const erenGliding=p.cid==='eren'&&!p.g&&p.erenGlide>0;
    p.vx += dir * (p.g ? 1.0 : erenGliding ? 1.6 : 0.65) * slow * moveSpd;
    const rushing = p.mv && p.mv.rush && p.a >= p.mv.act0 && p.a <= p.mv.act1;
    p.vx *= p.cid==='eren'&&p.erenWire?(p.erenWire.docked?(p.g?0.80:0.90):0.99):erenGliding?(dir?0.96:0.84):rushing?0.95:(p.g?0.80:0.90);
    if(p.cid==='eren'&&!erenTitan(p)&&(p.erenWire||erenGliding))p.vx=constrain(p.vx,-EREN.wireSpeed,EREN.wireSpeed);
    if (dir !== 0 && p.a === 0) p.f = dir;

    // S / ↓ / Proコンの下入力だけで上段足場をすり抜ける。最下段は床扱い。
    let doDrop = false;
    if (dp && p.g && p.groundPl >= 0 && p.groundPl !== lowestPlatformIndex()) { if (p.cid === 'rubber'||isAnime(p)) p.dropReq = 7; else doDrop = true; }
    if (p.dropReq > 0) { if (!inp.d || sp) p.dropReq = 0; else if (--p.dropReq === 0 && p.g && p.groundPl >= 0 && p.groundPl !== lowestPlatformIndex()) doDrop = true; }
    if (doDrop) {
      p.dropPl = p.groundPl; p.dropT = 12; p.g = false; p.groundPl = -1; p.y += 7; p.vy = 2.2;
    }

    if (jp && !animeLocked(p) && !axeLocked && !(p.cid === 'lancer' && p.sph > 0)) {
      const jmul = (rageOn(p) ? RAGE_JUMP : 1) * gearStat(p).jump * (p.tired > 0 ? 0.75 : 1);
      if (p.g) { p.vy = -12.5 * C.jump * jmul; p.g = false; p.groundPl = -1; p.jn = 1; if (!p.cpu) sfxJump(); }
      else if (p.jn < jumpsOf(p)) { p.vy = -11 * C.jump * jmul; p.jn++; if (!p.cpu) sfxJump(); burst(p.x, p.y, 6, 3, '#ffffff', 6); }
    }

    let acted = false;
    if (cp && p.a === 0 && p.sph===0) {
      if (dir !== 0) {
        if (p.dgc === 0 && (p.g || !p.airDg)) {
          p.dg = 1; p.dgd = dir; p.stats.dodges++;
          if (!p.g) p.airDg = true;
          sfxDodge(); acted = true;
        }
      } else if (p.ch === 0 && p.cd === 0 && p.ctc === 0 && p.sph === 0) {
        p.ct = 1; p.ctc = Math.round(CT_COOL * C.ctc);
        sfxCounterReady(); acted = true;
      }
    }
    if (!acted && sp && p.a === 0 && p.ch === 0 && p.sph === 0) {
      if(p.cid==='kaneki'){p.dropReq=0;kanekiSpecial(p,inp);}
      else if(p.cid==='eren'){p.dropReq=0;erenSpecial(p,inp);}
      else if(isAnime(p)){p.dropReq=0;animeStart(p,inp,!!inp.u&&!inp.neutralSpecial);}
      else if (inp.u&&!inp.neutralSpecial) { if (!p.rec) upSpecial(p, dir); else if (!p.cpu) sfxNo(); }
      else if (p.cid === 'rubber' && (inp.gd || (inp.d&&!inp.neutralSpecial))) { p.dropReq = 0; gearShift(p); }
      else if (p.cid === 'rubber' && (inp.sideSpecial||(!inp.neutralSpecial&&dir))) rubberSide(p, inp.sideSpecial||dir);
      else if (p.cid === 'rubber') rubberSpecial(p);
      else startSpecial(p);
      acted = true;
    }
    if (p.sph > 0) {
      if(isAnime(p))animeHold(p,inp);
      else if (p.cid === 'bomber') {
        if (inp.s) { p.sph++; if (p.sph >= 18) { placeMine(p); p.sph = 0; p.spc = 20; } }
        else { throwBomb(p); p.sph = 0; p.spc = 30; }
      } else if(p.cid==='archer'){
        if(inp.s){p.sph=Math.min(90,p.sph+1);if(p.sph===BOW_FULL&&!p.cpu)tone(700,1200,.07,.07,'triangle');}
        else fireArrows(p,p.sph,false);
      } else if (p.cid === 'lancer') {
        if (inp.s) {
          p.sph++;
          if (p.sph >= LANCE_CHARGE_MAX) fireLanceRush(p, LANCE_CHARGE_MAX);
        } else fireLanceRush(p, p.sph);
      } else if (p.cid === 'gunman') {
        if (inp.s) { p.sph++; if (p.sph >= 24) beginReload(p); }
        else { fireGunmanShot(p); p.sph = 0; }
      }
    }
    if (!acted) {
      if (p.w === 'gun') {
        if (ap && p.cd === 0) fireGun(p);
      } else {
        if (ap && p.a === 0 && p.cd === 0 && p.ch === 0 && p.sph === 0) p.ch = 1;
        chargeTick(p, inp);
        if (ar && p.ch > 0) { fireAttack(p, p.ch); p.ch = 0; }
      }
    }
    if (p.a > 0 && p.mv) {
      const oldAttackFrame=Math.floor(p.a);p.a+=animeSlow(p);const crossedAttackFrame=Math.floor(p.a)!==oldAttackFrame;
      if (crossedAttackFrame && p.mv.multi && p.a > p.mv.act0 && p.a <= p.mv.act1 && (Math.floor(p.a) - p.mv.act0) % p.mv.multi === 0) p.hit = {};
      if(crossedAttackFrame&&p.mv.kind==='ora'&&Math.floor(p.a)===p.mv.act1){p.hit={};animeNotice(p,'オラァ！！','#fff0b8',25,30);animeSound('orafinish');}
      if(p.cid==='berserker'&&['axeheavy','axeup'].includes(p.mv.kind)&&crossedAttackFrame&&Math.floor(p.a)===p.mv.act0){const e={k:'vfx',v:'axeSwing',id:p.id,x:p.x,y:p.y,up:p.mv.kind==='axeup'};vfx(e);send(e);}
      if (p.mv.lunge && crossedAttackFrame && Math.floor(p.a) === p.mv.act0) p.vx += p.f * p.mv.lunge;
      if (p.a > p.mv.end) { p.cd = p.mv.cd || 5; p.a = 0; p.mv = null; if (p.w === 'sword' && p.am <= 0) breakSword(p); }
    }
  }

  p.vy = Math.min(p.vy + GRAV*animeSlow(p), 17);
  const prevY = p.y;
  p.x += p.vx*animeSlow(p);
  p.y += p.vy*animeSlow(p);
  p.g = false; p.groundPl = -1;
  for (let pi = 0; pi < stage.plats.length; pi++) {
    const pl = stage.plats[pi];
    if (p.dropT > 0 && p.dropPl === pi) continue;
    if (p.vy >= 0 && p.x > pl.x - 6 && p.x < pl.x + pl.w + 6 && prevY <= pl.y && p.y >= pl.y) {
      p.y = pl.y; p.vy = 0; p.g = true; p.groundPl = pi; p.jn = 0; p.airDg = false; p.rec = false; p.sideUsed = false;
      if (p.kb > 0) { p.kb = Math.min(p.kb, 6); p.vx *= 0.6; }
      break;
    }
  }
  if (p.dropT === 0) p.dropPl = -1;

  if (p.x < -120 || p.x > stage.w + 120 || p.y > stage.h + 160 || p.y < -300) { koFighter(p); return; }

  if (!p.w && p.plk === 0 && p.kb === 0) {
    for (const id in items) {
      const it = items[id];
      if (it.pend) continue;
      if (Math.abs(p.x - it.x) < 30 && Math.abs((p.y - 20) - (it.y - 14)) < 40) { tryPickup(p, id, it); break; }
    }
  }
}

function koFighter(p) {
 if(p.shadowClone){shadowClonePop(p);return;}
  if(!online&&offlineMode==='training'){
    p.stats.deaths++;koFx({x:Math.round(constrain(p.x,0,stage.w)),y:Math.round(constrain(p.y,0,stage.h)),c:p.c});
    p.s=3;p.out=false;respawn(p);p.inv=70;return;
  }
  p.stats.deaths++;
  const e = { k: 'ko', id: p.id, x: Math.round(constrain(p.x, 0, stage.w)), y: Math.round(constrain(p.y, 0, stage.h)), c: p.c, out: p.s <= 1 ? 1 : 0 };
  koFx(e); send(e);
  p.s--;
  if (p.s <= 0) { p.out = true; p.x = -9999; p.y = -9999; p.w = null; if (!elim.includes(p.id)) elim.push(p.id); }
  else respawn(p);
}

function koFx(e) {
  burst(e.x, e.y, 40, 14, e.c, 14); burst(e.x, e.y, 20, 10, '#ffffff', 10); ring(e.x, e.y, 20, 22);
  shake = 18;
  popups.push({ x: constrain(e.x, 80, stage.w - 80), y: constrain(e.y, 70, stage.h - 60), txt: 'KO!', life: 50, max: 50, size: 60, c: e.c });
  sfxKO();
}

function respawn(p) {
 shadowCloneClearOwner(p.id);
  animeInit(p);
  p.x = stage.w / 2; p.y = 40; p.vx = 0; p.vy = 0; p.d = 0; p.kb = 0; p.r = 0;
  clearActs(p); p.stn = 0; p.inv = 100; p.w = null; p.am = 0; p.rec = false; p.jn = 0;
  if (p.cid === 'boxer') p.ko = Math.min(p.ko, 60);
  if (p.cid === 'yankee') { p.rage = 0; p.rageT = 0; }
  if (p.cid === 'swordsman') p.senku = Math.min(p.senku, 50);
  if (p.cid === 'gunman') { p.bullets = GUN_MAX; p.reloadT = 0; }
  p.gear = 1; p.gearT = 0; p.tired = 0; p.gearM = Math.min(p.gearM || 0, 50); p.sideUsed = false;
}

