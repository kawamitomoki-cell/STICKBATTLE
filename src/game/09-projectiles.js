// ========================================================
// ⑩ 飛び道具・爆弾・地雷・武器
// ========================================================
function spawnProj(p, kind) {
  const sz = CC(p.cid).size;
  const q = { pid: p.id + '_' + (objSeq++), o: p.id, kind, x: Math.round(p.x + p.f * 26 * sz), y: Math.round(p.y - 36 * sz), rot: 0 };
  if (kind === 'hado')   Object.assign(q, { vx: p.f * 5, life: 150, r: 14, dm: 7, k0: 6, ks: 0.06, up: 0.5 });
  if (kind === 'shuri')  Object.assign(q, { vx: p.f * 14, life: 22, r: 8, dm: 4, k0: 3.5, ks: 0.03, up: 0.35 });
  if (kind === 'bullet') Object.assign(q, { vx: p.f * 16, life: 55, r: 6, dm: 8, k0: 6.5, ks: 0.07, up: 0.45 });
  if (kind === 'gunshot') Object.assign(q, { vx: p.f * 21, life: 50, r: 7, dm: 19, k0: 10.5, ks: 0.085, up: 0.42 });
  if (kind === 'senku') Object.assign(q, { vx: 0, dir: p.f, life: 11, r: 26, range: 520, dm: 26, k0: 17, ks: 0.115, up: 0.32, senku: true, resolved: false });
  send({ k: 'proj', q: { ...q } });
  q.local = true;
  projs.push(q);
}

function fireGun(p) {
  p.am--; p.cd = 7; p.sh = 6;
  spawnProj(p, 'bullet'); sfxShot();
  p.vx -= p.f * 1.2;
  if (p.am <= 0) { p.w = null; popups.push({ x: p.x, y: p.y - 110, txt: 'EMPTY!', life: 30, max: 30, size: 22, c: '#ffffff' }); }
}

function throwBomb(p) {
  const sz = CC(p.cid).size;
  const b = { bid: p.id + '_' + (objSeq++), o: p.id, x: Math.round(p.x + p.f * 16), y: Math.round(p.y - 40 * sz),
              vx: Math.round((p.f * 11 + p.vx * 0.4) * 10) / 10, vy: -3, t: 0 };
  bombs.push(b); send({ k: 'bomb', b: { ...b } });
  p.sh = 10; sfxThrow();
}

function placeMine(p) {
  const m = { mid: p.id + '_' + (objSeq++), o: p.id, x: Math.round(p.x), y: Math.round(p.y), vy: 0, landed: p.g, arm: 30, c: p.c };
  mines.push(m); send({ k: 'mine', m: { ...m } });
  const own = mines.filter(q => q.o === p.id);
  if (own.length > 8) mines.splice(mines.indexOf(own[0]), 1);
  sfxMine();
  popups.push({ x: p.x, y: p.y - 100, txt: 'MINE SET', life: 28, max: 28, size: 18, c: '#ffffff' });
}

function tryPickup(p, id, it) {
  const give = () => {
    if (p.w || p.out) return;
    p.w = it.t; p.am = it.am || (it.t === 'gun' ? 15 : SWORD_DUR);
    if (!p.cpu) sfxPickup();
    popups.push({ x: p.x, y: p.y - 110, txt: it.t === 'sword' ? 'SWORD!' : 'GUN!', life: 35, max: 35, size: 20, c: '#ffffff' });
  };
  if (!online) { delete items[id]; give(); return; }
  it.pend = true;
  roomRef.child('items/' + id).transaction(cur => {
    if (!cur || cur.o) return;
    cur.o = p.id;
    return cur;
  }).then(r => {
    if (r.committed && r.snapshot.val() && r.snapshot.val().o === p.id) { give(); roomRef.child('items/' + id).remove(); }
    else if (items[id]) items[id].pend = false;
  }).catch(() => { if (items[id]) items[id].pend = false; });
}

function dropWeapon(p, blown) {
  if (!p.w) return;
  if (p.am > 0) {
    const it = { t: p.w, x: Math.round(p.x + (blown ? 0 : p.f * 20)), y: Math.round(p.y - 40), am: p.am || 0 };
    if (online) roomRef.child('items').push(it);
    else items['i' + (itemSeq++)] = { ...it, vy: -3, landed: false };
  }
  p.w = null; p.am = 0; p.plk = 40;
}

function breakSword(p) {
  p.w = null; p.am = 0;
  burst(p.x + p.f * 20, p.y - 34, 14, 6, '#dfe8ee', 6);
  popups.push({ x: p.x, y: p.y - 110, txt: 'BROKEN!', life: 34, max: 34, size: 22, c: '#dfe8ee' });
  tone(2600, 900, 0.09, 0.08, 'triangle'); noiseHit(0.06, 0.2, 5200, true);
}
function fxSlash(x, y) {
  burst(x, y, 14, 7, '#ffffff', 7);
  popups.push({ x, y: y - 24, txt: 'SLASH!', life: 30, max: 30, size: 24, c: '#ffffff' });
  sfxSlash();
}

function stepProjs() {
  for (let i = projs.length - 1; i >= 0; i--) {
    const q = projs[i];
    if(pausedObject(q.o))continue;
    if(q.anime){if(animeProjStep(q))projs.splice(i,1);continue;}
    if (q.kind === 'senku') {
      q.life--; q.rot += 0.15;
      if (q.local && !q.resolved) {
        q.resolved = true;
        for (const t of fighters) {
          if (t.id === q.o || t.out || sameTeam(byId(q.o), t)) continue;
          const tsz = CC(t.cid).size;
          const dx = (t.x - q.x) * q.dir;
          const dy = Math.abs((t.y - 32 * tsz) - q.y);
          if (dx >= 12 && dx <= q.range && dy <= 54 + 12 * tsz) {
            const Q = { o:q.o, x:q.x, vx:0, dir:q.dir, dm:q.dm, k0:q.k0, ks:q.ks, up:q.up, senku:true };
            if (isLocal(t)) resolveProj(Q, t); else send({ k:'ph', to:t.id, q:Q });
          }
        }
      }
      if (q.life <= 0) projs.splice(i, 1);
      continue;
    }
    q.x += q.vx; q.y += q.vy||0; q.life--; q.rot += 0.5;
    let gone = q.life <= 0 || q.x < -100 || q.x > stage.w + 100 || q.y < -350 || q.y > stage.h+160;
    if (!gone && q.local) {
      if (q.kind !== 'senku') for (const f of fighters) {
        if (f.id === q.o || f.out || sameTeam(byId(q.o), f) || f.w !== 'sword' || !isActive(f)) continue;
        const sz = CC(f.cid).size;
        if (Math.hypot(q.x - (f.x + f.f * f.mv.reach * sz), q.y - (f.y - 34 * sz)) < f.mv.R * sz + q.r) {
          gone = true;
          fxSlash(q.x, q.y);
          send({ k: 'pg', pid: q.pid, sl: 1, x: Math.round(q.x), y: Math.round(q.y) });
          break;
        }
      }
      if (!gone) {
        for (const t of fighters) {
          if (t.id === q.o || t.out || sameTeam(byId(q.o), t)) continue;
          const sz = CC(t.cid).size;
          if (Math.abs(q.x - t.x) < 14 * sz + q.r && q.y > t.y - 64 * sz - q.r && q.y < t.y + q.r) {
            if (isInvuln(t)) continue;
            if (q.pierce) { q.hitIds = q.hitIds || {}; if (q.hitIds[t.id]) continue; q.hitIds[t.id] = 1; }
            else gone = true;
            const Q = { o: q.o, x: Math.round(q.x), vx: q.vx, dir:q.dir || Math.sign(q.vx) || 1, dm: q.dm, k0: q.k0, ks: q.ks, up: q.up, senku: false };
            if (isLocal(t)) resolveProj(Q, t);
            else {
              send({ k: 'ph', to: t.id, q: Q });
              const front = fromFront(t, q.x) || CC(t.cid).back;
              if (!(inCounter(t) && front)) {
                localHitFx(t.id, q.x, q.y, (q.k0 + (t.d + q.dm) * q.ks) * weightFactor(t));
                predicted[q.o] = Date.now();
              }
            }
            if (!q.pierce) { send({ k: 'pg', pid: q.pid }); break; }
          }
        }
      }
    }
    if (gone) projs.splice(i, 1);
  }
}

function stepBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if(pausedObject(b.o))continue;
    b.t++;
    b.vy = Math.min(b.vy + 0.28, 12);
    const py = b.y;
    b.x += b.vx; b.y += b.vy;
    for (const pl of stage.plats) {
      if (b.vy > 0 && b.x > pl.x && b.x < pl.x + pl.w && py <= pl.y - 6 && b.y >= pl.y - 6) {
        b.y = pl.y - 6; b.vy *= -0.35; b.vx *= 0.8;
      }
    }
    if (b.y > stage.h + 200 || b.x < -150 || b.x > stage.w + 150) { bombs.splice(i, 1); continue; }
    let hit = false;
    for (const f of fighters) {
      if (!isLocal(f) || f.out || f.id === b.o || sameTeam(byId(b.o), f) || isInvuln(f)) continue;
      const sz = CC(f.cid).size;
      if (Math.abs(b.x - f.x) < 16 * sz + 8 && b.y > f.y - 64 * sz && b.y < f.y + 4) { hit = true; break; }
    }
    if (hit) {
      send({ k: 'bx', bid: b.bid, o: b.o, x: Math.round(b.x), y: Math.round(b.y) });
      explode(b.x, b.y, 92, b.o);
      bombs.splice(i, 1);
      continue;
    }
    if (b.t >= 48) { explode(b.x, b.y, 92, b.o); bombs.splice(i, 1); }
  }
}

function stepMines() {
  for (let i = mines.length - 1; i >= 0; i--) {
    const m = mines[i];
    if(pausedObject(m.o))continue;
    if (!m.landed) {
      m.vy = Math.min(m.vy + 0.5, 12);
      const py = m.y; m.y += m.vy;
      for (const pl of stage.plats) {
        if (m.x > pl.x && m.x < pl.x + pl.w && py <= pl.y && m.y >= pl.y) { m.y = pl.y; m.landed = true; }
      }
      if (m.y > stage.h + 200) { mines.splice(i, 1); continue; }
    }
    if (m.arm > 0) { m.arm--; continue; }
    for (const f of fighters) {
      if (!isLocal(f) || f.out || f.id === m.o || sameTeam(byId(m.o), f)) continue;
      if (Math.abs(f.x - m.x) < 26 && Math.abs(f.y - m.y) < 30) {
        mines.splice(i, 1);
        send({ k: 'mb', mid: m.mid });
        explode(m.x, m.y - 8, 80, m.o);
        break;
      }
    }
  }
}

function explode(x, y, R, ownerId) {
  burst(x, y, 40, 13, '#f4a261', 14);
  burst(x, y, 20, 10, '#ffffff', 10);
  ring(x, y, 22, 20);
  shake = Math.max(shake, 14);
  sfxBoom();
  for (const f of fighters) {
    if (!isLocal(f) || f.out || isInvuln(f) || (f.id !== ownerId && sameTeam(byId(ownerId), f))) continue;
    if (Math.hypot(f.x - x, (f.y - 30 * CC(f.cid).size) - y) < R) {
      const h = { dm: 14, k0: 9, ks: 0.085, up: 0.9, f: Math.sign(f.x - x) || 1 };
      if (f.id === ownerId && f.cid === 'bomber') { h.dm *= 0.5; h.k0 *= 0.6; }
      if(rageOn(f)){f.d+=h.dm;addDealt(ownerId,h.dm);gainRage(f,h.dm);}
      else applyHit(f, h, false, ownerId);
      flash[f.id] = 6;
    }
  }
}

function spawnItems() {
  if (!battleWpn) return;
  if (--itemTimer > 0) return;
  itemTimer = 300 + Math.floor(Math.random() * 200);
  if (Object.keys(items).length >= 2) return;
  const pl = stage.plats[Math.floor(Math.random() * stage.plats.length)];
  items['i' + (itemSeq++)] = { t: Math.random() < 0.5 ? 'sword' : 'gun', x: pl.x + 30 + Math.random() * (pl.w - 60), y: -40, vy: 0, landed: false, am: 0 };
}

function stepItems() {if(activeTimeStopFx())return;
  for (const id in items) {
    const it = items[id];
    if (it.landed) continue;
    it.vy = Math.min(it.vy + 0.4, 12);
    const py = it.y; it.y += it.vy;
    for (const pl of stage.plats) {
      if (it.vy > 0 && it.x > pl.x && it.x < pl.x + pl.w && py <= pl.y && it.y >= pl.y) { it.y = pl.y; it.vy = 0; it.landed = true; }
    }
    if (it.y > stage.h + 200) {
      delete items[id];
      if (online && isHost) roomRef.child('items/' + id).remove();
    }
  }
}

