// ========================================================
// ④ p5.js メインループ
// ========================================================
function setup() {
  pixelDensity(window.matchMedia('(hover: hover) and (pointer: fine)').matches?2:1);                          // スマホで重くならないよう等倍で描く
  const c = createCanvas(W, H);
  c.parent('wrap');
  textFont('sans-serif');
  buildMenus();
  document.querySelectorAll('[data-portrait]').forEach(el=>el.innerHTML=portrait(el.dataset.portrait));
  if (urlRoom) document.getElementById('title-tap').innerText = 'タップしてルーム ' + urlRoom + ' に参加';
}

function simulateFrame() {
  if(!online&&document.getElementById('bracket-dialog')?.open)return; // 対戦表を確認する間、ソロは一時停止
  tickNotices();readHuman();pumpCinematics();
  syncGokuMp3();
  animeWorldTick();
  if (bt.phase === 'count') {
    if (bt.t === 200 || bt.t === 140 || bt.t === 80) sfxCount();
    if (bt.t === 20) sfxGo();
    bt.t--;
    if (bt.t <= 0) bt.phase = 'play';
    if (online) updateRemote();
  } else if (bt.phase === 'play' || bt.phase === 'game') {
    if (freezeT > 0) {
      freezeT--;
      if(fzType==='senku'&&SENKU_STOP-freezeT===31)strikeSenku();
      if (freezeT === 0) { endFreeze(); finishCinematic(); }
    } else if (bt.phase === 'play') {
      if (online) updateRemote();
      for (const f of fighters) if (f.cpu && isLocal(f)) {
        if(!online&&offlineMode==='training'&&trainingAiMode===0&&!f.shadowClone){f.ai.inp=blankInput();continue;}
        const oldLv=aiLv;
        if(f.shadowClone)aiLv=3;
        else if(!online&&offlineMode==='training')aiLv=trainingAiMode===2?3:1;
        aiStep(f);aiLv=oldLv;
      }
      for (const f of fighters) if (isLocal(f)) {
        stepFighter(f, f.cpu ? f.ai.inp : hin);
        if (freezeT>0) return;
      }
      for (const f of fighters) {meleeCheck(f);if(freezeT>0)return;}
      shadowClonePrune();stepItems();stepProjs();if(freezeT>0)return;stepBombs();stepMines();
      if (!online) { spawnItems(); checkEnd(); }
    } else {
      bt.t--;
      if (bt.t <= 0) showResult();
    }
  }
  for (const k in flash) if (flash[k] > 0) flash[k]--;
}

function draw() {
  if (!battleSessionActive()) return;
  const observedFps=1000/Math.max(1,deltaTime||FIXED_MS);
  netPerfFps=netPerfFps*.96+Math.min(90,observedFps)*.04;
  recoverCinematic();
  simAcc += Math.min(deltaTime || FIXED_MS, 100);
  let steps = 0;
  while (simAcc >= FIXED_MS && steps < MAX_SIM_STEPS) {
    simulateFrame();
    simAcc -= FIXED_MS;
    steps++;
  }
  if (steps === MAX_SIM_STEPS) simAcc = 0; // 長い停止後の暴走追いつきを防ぐ
  render();
  updateControlUI();
}

