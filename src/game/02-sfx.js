// ========================================================
// ③ 効果音
// ========================================================
let actx = null, noiseBuf = null;
function unlockAudio() {
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const len = actx.sampleRate * 1.2;
      noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) {}
}
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', e => {
  unlockAudio();
  if (scene === 'battle' && !editingText(e.target) && !e.isComposing && [32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
});
// Native focus is retained for typing, selection, and mobile keyboards.

function tone(f1, f2, dur, vol, type, delay) {
  if (!actx || document.hidden || prefs.volume<=0) return;
  const t = actx.currentTime + (delay || 0), o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
  g.gain.setValueAtTime(0.0001, actx.currentTime);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(vol, t+.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(audioBus());
  o.start(t); o.stop(t + dur + 0.02);
}
function noiseHit(dur, vol, freq, hp, delay) {
  if (!actx || document.hidden || prefs.volume<=0) return;
  const t = actx.currentTime + (delay || 0), s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, actx.currentTime);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(vol, t+.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(audioBus());
  s.start(t); s.stop(t + dur);
}
function sfxHit(p) { const v=Math.min(p,16);noiseHit(.035+v*.002,Math.min(.22+v*.015,.48),1600+v*100);tone(150+v*5,48,.10+v*.003,.18,'triangle'); }
function sfxKO() { noiseHit(0.7, 0.7, 900); tone(140, 30, 0.7, 0.5, 'sawtooth'); tone(1000, 200, 0.35, 0.15, 'square'); }
function sfxJump() { tone(420, 820, 0.08, 0.05, 'sine'); }
function sfxDodge() { noiseHit(0.15, 0.25, 3000, true); tone(600, 1300, 0.1, 0.05, 'sine'); }
function sfxCounterReady() { tone(900, 1400, 0.06, 0.07, 'triangle'); }
function sfxChargeFull() { tone(1300, 1300, 0.07, 0.08, 'square'); tone(1950, 1950, 0.1, 0.08, 'square', 0.07); }
function sfxStun() { tone(700, 180, 0.5, 0.15, 'sawtooth'); for (let i = 0; i < 4; i++) tone(900, 700, 0.1, 0.06, 'triangle', 0.15 + i * 0.12); }
function sfxCounter() {
  noiseHit(0.18, 0.6, 6000, true);
  tone(2637, 2600, 1.0, 0.16, 'sine'); tone(3951, 3900, 0.8, 0.09, 'sine');
  [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, f, 0.11, 0.1, 'square', 0.06 + i * 0.065));
}
function sfxCounterBoom() { noiseHit(0.9, 0.85, 1100); tone(170, 28, 0.9, 0.6, 'sawtooth'); tone(85, 30, 1.0, 0.7, 'sine'); tone(2093, 4186, 0.25, 0.08, 'triangle'); }
function sfxKOHit() {noiseHit(.035,.4,1700);tone(180,55,.16,.32,'triangle');tone(80,40,.27,.28,'sine');}
function sfxKOBoom() {noiseHit(.04,.5,2200);noiseHit(.38,.4,620);tone(150,32,.42,.42,'triangle');tone(70,28,.55,.36,'sine');}
function sfxShot() { noiseHit(0.06, 0.3, 4000, true); tone(900, 200, 0.07, 0.07, 'square'); }
function sfxHado() { tone(630,130,.19,.1,'triangle');noiseHit(.11,.17,1900);tone(1100,280,.09,.035,'sine'); }
function sfxShuri() { noiseHit(0.07, 0.2, 6000, true); tone(2400, 1800, 0.05, 0.04, 'triangle'); }
function sfxThrow() { noiseHit(0.1, 0.2, 2000, true); }
function sfxMine() { tone(300, 300, 0.06, 0.1, 'square'); tone(500, 500, 0.06, 0.1, 'square', 0.08); }
function sfxBoom() { noiseHit(.035,.4,3400,true);noiseHit(.4,.45,750);tone(115,28,.42,.3,'triangle');tone(60,27,.45,.22,'sine'); }
function sfxSmoke() {noiseHit(.16,.23,3300,true);tone(430,110,.11,.11,'triangle');}
function sfxPickup() { tone(700, 1400, 0.1, 0.08, 'triangle'); tone(1400, 1400, 0.08, 0.06, 'triangle', 0.08); }
function sfxBlock() { tone(2200, 1800, 0.15, 0.12, 'square'); noiseHit(0.05, 0.3, 5000, true); }
function sfxSlash() { noiseHit(.055,.28,6500,true);tone(2900,650,.06,.065,'triangle'); }
function sfxArmor() { tone(300, 260, 0.15, 0.2, 'square'); noiseHit(0.06, 0.25, 1500); }
function sfxWindup() {noiseHit(.14,.12,1800,true);tone(130,250,.13,.09,'triangle');}
function sfxNo() { tone(180, 160, 0.08, 0.06, 'square'); }
function sfxKOReady() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.1, 0.08, 'square', i * 0.07)); }
function sfxRise() {tone(210,570,.13,.075,'triangle');noiseHit(.12,.18,2400,true);}
function sfxRage() {noiseHit(.35,.32,850);tone(115,39,.45,.36,'triangle');tone(62,32,.55,.3,'sine');tone(240,360,.34,.07,'triangle',.12);}
function sfxSenkuCharge() { tone(420, 920, 0.55, 0.11, 'sine'); tone(1100, 2100, 0.38, 0.07, 'triangle', 0.16); }
function sfxSenku() { noiseHit(0.22, 0.65, 7200, true); tone(2800, 620, 0.32, 0.18, 'sawtooth'); tone(3900, 1500, 0.22, 0.10, 'triangle'); }
function sfxCount() { tone(880, 880, 0.15, 0.15, 'square'); }
function sfxGo() { tone(1320, 1320, 0.35, 0.18, 'square'); tone(1760, 1760, 0.35, 0.1, 'square'); }
function sfxGame() { noiseHit(0.8, 0.6, 800); [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.25, 0.12, 'square', i * 0.1)); }

