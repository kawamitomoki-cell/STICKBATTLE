// ========================================================
// ⑥ オンライン：状態の送受信・イベント
// ========================================================
function isLocal(f) { return !online || f.owner === myId; }
const byId = id => fighters.find(f => f.id === id);

function send(e){writeEvent(e);}

function stateOf(f) {
  return { x: Math.round(f.x), y: Math.round(f.y), vx: f.timeStopT>0?0:Math.round(f.vx * 10) / 10, f: f.f, r: Math.round(f.r * 100) / 100,
    a: f.a, mk: f.mv ? f.mv.kind : '', ch: f.ch, ct: f.ct, cs: f.cs, stn: f.stn > 0 ? 1 : 0, dg: f.dg > 0 ? 1 : 0,
    iv: isInvuln(f) ? 1 : 0, kb: f.kb > 0 ? 1 : 0, w: f.w || '', sh: f.sh > 0 ? 1 : 0, sph: f.sph, acs: f.cid==='goku'&&f.castStyle==='charge'&&f.sph>0?'charge':'', ri: f.rise > 0 ? 1 : 0,
    am: f.arm > 0 ? 1 : 0, cid: f.cid, sc:f.shadowClone?1:0,so:f.shadowOwner||'',
    ae:Math.round(f.energy||0),af:f.form||0,at:f.modeT||0,az:f.fatigue||0,an:f.cloneT||0,ai:f.infinityCd||0,asl:f.slowT||0,adom:f.domainT||0,ats:f.timeStopT||0,atsf:f.timeStopSelfT||0,aoc:f.orbColor||"blue",
    d: Math.round(f.d), s: f.s, o: f.out ? 1 : 0, ko: Math.round(f.ko), g: f.g ? 1 : 0,
    rg: Math.round(f.rage || 0), rt: Math.round(f.rageT || 0), sk: Math.round(f.senku || 0), sw: Math.round(f.senkuWind || 0),
    gr: f.gear || 1, gm: Math.round(f.gearM || 0), gt: Math.round(f.gearT || 0), td: f.tired > 0 ? 1 : 0,
    bu:f.bowUp?1:0, bl: f.bullets ?? GUN_MAX, rl: Math.round(f.reloadT || 0),
    dp:f.dropPl,dt:f.dropT,vy: f.timeStopT>0?0:Math.round((f.vy || 0) * 10) / 10, rd: curRound };
}

// 【ラグ対策の要】以前は「前の送信がサーバーに届いた返事」を待ってから次を送っていたため、
// 実際の送信頻度が 33ms ごとではなく「往復時間ごと（シンガポール往復で約100〜200ms）」に落ちていた。
// Firebaseは送信を順番どおりに流してくれるので、返事を待たずに送ってよい（詰まり過ぎ防止に上限だけ設ける）。
let sendInflight=0,lastSentKey='',lastSentAt=0,lastStatsAt=0,netRtt=0;
function legacy_sendLocal() {
  if(!online||!battleSessionActive()||!roomRef)return;
  if(sendInflight>=4)return;                       // 回線が詰まっている時だけ間引く
  const now=Date.now(),upd={};let key='';
  for(const f of fighters)if(isLocal(f)){const st=stateOf(f);upd[f.id]=st;key+=JSON.stringify(st);}
  if(!key)return;
  if(key===lastSentKey&&now-lastSentAt<250)return; // 止まっている時は送信を減らして回線を空ける
  const withStats=now-lastStatsAt>1000||bt.phase!=='play';
  for(const id in upd){upd[id].ts=now;if(withStats)upd[id].stats=byId(id)?.stats||null;}
  if(withStats)lastStatsAt=now;
  lastSentKey=key;lastSentAt=now;sendInflight++;
  const started=performance.now();
  try{Promise.resolve(roomRef.child('p').update(safeWire(upd)))
    .then(()=>{netIssue='';const r=performance.now()-started;netRtt=netRtt?netRtt*0.85+r*0.15:r;})
    .catch(networkError).finally(()=>{sendInflight=Math.max(0,sendInflight-1);});}
  catch(err){sendInflight=Math.max(0,sendInflight-1);networkError(err);}
}

function legacy_onP(s) {
  const f = byId(s.key);
  if (!f || !f.remote) return;
  const v = s.val();
  if (!v || v.rd !== curRound || !['x','y','vx','r','d','s','ts'].every(k=>Number.isFinite(v[k]))) return;
  if(f.buf.length&&v.ts<f.buf[f.buf.length-1].ts)return;
  const lat = Date.now() - v.ts;
  if (f.off === null || lat < f.off) f.off = lat;
  else f.off += (lat - f.off) * 0.02;
  const arr=Date.now();
  if(f.lastRecv){const gap=Math.min(arr-f.lastRecv,500);f.gapAvg=f.gapAvg?f.gapAvg*0.9+gap*0.1:gap;f.jit=(f.jit||0)*0.9+Math.abs(gap-f.gapAvg)*0.1;}
  f.lastRecv=arr;
  f.buf.push(v);
  if (f.buf.length > 60) f.buf.shift();
}

function legacy_updateRemote() {
  const now = Date.now();
  for (const f of fighters) {
    if (!f.remote || !f.buf.length) continue;
    // 届く間隔＋揺れに合わせて「表示を遅らせる幅」を自動調整（固定80msだと間に合わずカクつく）
    const want=constrain((f.gapAvg||SEND_MS)+(f.jit||0)*2.5+12,50,220);
    f.interp=f.interp?f.interp+(want-f.interp)*0.04:want;
    const rt = now - f.off - f.interp;
    let a = null, b = null;
    for (let i = f.buf.length - 1; i >= 0; i--) {
      if (f.buf[i].ts <= rt) { a = f.buf[i]; b = f.buf[i + 1] || null; break; }
    }
    const s = a || f.buf[0];
    let x = s.x, y = s.y, r = s.r;
    if (a && b) {
      const t = constrain((rt - a.ts) / Math.max(b.ts - a.ts, 1), 0, 1);
      if (Math.hypot(b.x - a.x, b.y - a.y) > 150) { x = t < 0.5 ? a.x : b.x; y = t < 0.5 ? a.y : b.y; }
      else { x = lerp(a.x, b.x, t); y = lerp(a.y, b.y, t); r = a.r + (b.r - a.r) * t; }
    } else if (a && !b) {
      // 通信が遅れた時は、最後の向きに少し進めておく（止まって見えない）
      const k=Math.min((rt - a.ts) / 16.7, 6)*(a.asl>0?.38:1);
      x = a.x + (a.vx || 0) * k;
      if(!a.g&&Number.isFinite(a.vy)) y = a.y + a.vy * k + 0.5 * GRAV * k * k;
    }
    if(f.dispX!==undefined&&Math.hypot(x-f.dispX,y-f.dispY)<60){x=f.dispX+(x-f.dispX)*0.55;y=f.dispY+(y-f.dispY)*0.55;}
    f.dispX=x;f.dispY=y;
    Object.assign(f, { x, y, r, vx: s.vx, f: s.f, a: s.a, ch: s.ch, ct: s.ct, cs: s.cs, stn: s.stn, dg: s.dg,
      ivf: s.iv, kb: s.kb, w: s.w || null, sh: s.sh, sph: s.sph, castStyle: s.acs==='charge'?'charge':'', rise: s.ri, arm: s.am || 0, cid: s.cid || f.cid,
      d: s.d, s: s.s, ko: s.ko, g: s.g, rage: s.rg || 0, rageT: s.rt || 0, senku: s.sk || 0, senkuWind: s.sw || 0,
      energy:s.ae||0,form:s.af||0,modeT:s.at||0,fatigue:s.az||0,cloneT:s.an||0,infinityCd:s.ai||0,slowT:s.asl||0,domainT:s.adom||0,timeStopT:s.ats||0,timeStopSelfT:s.atsf||0,orbColor:s.aoc||"blue",
      gear: s.gr || 1, gearM: s.gm || 0, gearT: s.gt || 0, tired: s.td ? 1 : 0,
      bowUp:!!s.bu, bullets: s.bl ?? f.bullets, reloadT: s.rl || 0, stats: s.stats || f.stats });
    f.mv = mkMv(s.mk, s.w);animeRemoteMove(f);
    if (f.cid === 'rubber' && f.mv) decorateRubber(f.mv, f);
    if (s.o && !f.out) { f.out = true; if (!elim.includes(f.id)) elim.push(f.id); }
    while (f.buf.length > 2 && f.buf[1].ts < rt - 300) f.buf.shift();
  }
}

function onEvent(e){receiveNetEvent(e);}
function handleGameplayEvent(e) {
 if(e.k==='shadow-pop'){shadowCloneReceivePop(e);return;}
  if(e.k==='animefx'||e.k==='animearea'){
    const actor=byId(e.id);if(!actor||!isAnime(actor)||e.by&&e.by!==actor.owner||!Number.isFinite(e.x)||!Number.isFinite(e.y))return;
    if(e.k==='animefx'){if(!['transform','merge','purple','beam','blue','red','infinity','clone','rasengan','rise','starjump','blink','instant','domain','dragon','echo','stepclone','ora','starfinger','timestop'].includes(e.kind))return;animeVisual({...e,life:Math.max(1,Math.min(240,e.life||36))});}
    else if(['blue','red','domain','timestop'].includes(e.kind))animeArea(e);
    return;
  }
  if(['mh','ph'].includes(e.k)){const h=e.k==='mh'?e.mv:e.q;if(!h||!['dm','k0','ks','up'].every(k=>Number.isFinite(h[k])))return;}
  if (e.k === 'mh') { const t = byId(e.to); if (t && isLocal(t)) resolveMelee({ id: e.a, x: e.ax, f: e.f, c: e.c, mv: e.mv, contact:e.contact }, t); }
  else if (e.k === 'ph') { const t = byId(e.to); if (t && isLocal(t)) resolveProj(e.q, t); }
  else if (e.k === 'fx') playFx(e, true);
  else if (e.k === 'ctr') doCounter(e);
  else if (e.k === 'vfx') vfx(e);
  else if (e.k === 'senku') receiveSenku(e);
  else if (e.k === 'rage') doRageTransform(e, true);
  else if (e.k === 'proj') {
    projs.push({ ...e.q, local: false });
    if(e.q.anime)animeSound(e.q.kind==='ki'?'red':e.q.kind==='purple'?'purple':'beam');
    else if (e.q.kind === 'hado') sfxHado(); else if (e.q.kind === 'shuri') sfxShuri();
    else if (e.q.kind === 'senku') sfxSenku(); else if(e.q.kind==='gunshot')sfxRevolver(); else if(e.q.kind==='arrow'){if(e.q.sound)sfxBowRelease();}else sfxShot();
  }
  else if (e.k === 'pg') {
    const i = projs.findIndex(q => q.pid === e.pid);
    if (i >= 0) projs.splice(i, 1);
    if (e.sl) fxSlash(e.x, e.y);
  }
  else if (e.k === 'projs' && Array.isArray(e.list)) {
    for (const q of e.list) projs.push({ ...q, local: false });
    if (e.list.some(q => q.kind === 'arrow')) sfxBowRelease();
  }
  else if (e.k === 'bomb') { bombs.push({ ...e.b }); sfxThrow(); }
  else if (e.k === 'bx') {
    const i = bombs.findIndex(b => b.bid === e.bid);
    if (i >= 0) { bombs.splice(i, 1); explode(e.x, e.y, 92, e.o); }
  }
  else if (e.k === 'mine') { mines.push({ ...e.m }); }
  else if (e.k === 'mb') {
    const i = mines.findIndex(m => m.mid === e.mid);
    if (i >= 0) { const m = mines[i]; mines.splice(i, 1); explode(m.x, m.y - 8, 80, m.o); }
  }
  else if (e.k === 'ko') { koFx(e); if (e.out && !elim.includes(e.id)) elim.push(e.id); }
}

