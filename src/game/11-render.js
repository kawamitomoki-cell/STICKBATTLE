// ========================================================
// ⑫ 描画
// ========================================================
function render() {
  const frozen = freezeT > 0;
  if(!frozen) visualFrame+=Math.min(deltaTime/FIXED_MS,2);
  background(8,14,25);
  paintArena();
  push();
  if (shake > 0) {
    if(prefs.shake) translate(random(-shake, shake), random(-shake, shake));
    if (!frozen) { shake *= 0.82; if (shake < 0.5) shake = 0; }
  }
  if(raidActive())raidApplyCamera();else scale(W / stage.w);
  paintAnimeBackdrop();
  paintPlatforms();
  for (const id in items) drawItem(items[id]);
  for (const m of mines) drawMine(m);
  for (const f of fighters) drawFighter(f);
  drawProjs();paintAnimeFx();
  paintSenkuAfter();
  for (const b of bombs) drawBombV6(b);
  paintTransientSpecials();
  drawParticles(frozen);
  if (frozen) drawFreezeWorld();
  paintTimeStopPostFx();
  drawPopups();
  pop();

  if (frozen) drawFreezeText();

  // 変身はルフィ同様、停止中の専用カットインで描画する。
  timeStopStatus();drawHUD();

  paintMatchIntro();
}


function drawSenkuThreat() {
  const p = fighters.find(f => !f.out && f.cid === 'swordsman' && f.senkuWind > 0);
  if (!p || freezeT > 0) return;
  const q = 1 - p.senkuWind / SENKU_WIND;
  noStroke(); fill(3, 9, 16, 24 + q * 40); rect(0, 0, W, WH);
  noFill(); stroke(190, 242, 255, 55 + q * 145); strokeWeight(2 + q * 4);
  rect(5, 5, W - 10, WH - 10, 12);
  if (p.senkuWind <= 14 && visualFrame % 4 < 2) {
    stroke(255, 255, 255, 170); strokeWeight(2);
    line(W * 0.12, WH * 0.18, W * 0.88, WH * 0.18);
  }
}

function burst(x, y, n, spd, c, sz) {
  for (let i = 0; i < n; i++) {
    const a = random(TWO_PI), v = random(0.3, 1) * spd;
    particles.push({ x, y, vx: cos(a) * v, vy: sin(a) * v, life: random(16, 30), max: 30, c, s: random(sz * 0.5, sz) });
  }
  const particleLimit=online?(fighters.length>=5?145:210):300;
  if(particles.length>particleLimit)particles.splice(0,particles.length-particleLimit);
}
function ring(x, y, vr, life) { particles.push({ ring: true, x, y, r: 4, vr, life, max: life }); }

function drawParticles(frozen) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    if (!frozen) q.life--;
    const al = 255 * Math.max(q.life / q.max, 0);
    if (q.ring) {
      if (!frozen) { q.r += q.vr; q.vr *= 0.88; }
      noFill(); stroke(255, 255, 255, al); strokeWeight(4);
      circle(q.x, q.y, q.r * 2);
      stroke(140,220,255,al*.35);strokeWeight(1);circle(q.x,q.y,q.r*2.18);
    } else {
      if (!frozen) { q.x += q.vx; q.y += q.vy; q.vx *= 0.9; q.vy = q.vy * 0.9 + 0.15; }
      const c = color(q.c); c.setAlpha(al);
      push(); noStroke(); const halo=color(q.c);halo.setAlpha(al*.13);fill(halo);circle(q.x,q.y,q.s*2.6);
      stroke(c);strokeWeight(Math.max(1,q.s*.32));line(q.x,q.y,q.x-q.vx*2.5,q.y-q.vy*2.5);
      noStroke();fill(c);circle(q.x,q.y,Math.max(1,q.s*.65));pop();
    }
    if (q.life <= 0) particles.splice(i, 1);
  }
}

function drawPopups() {
  for (let i = popups.length - 1; i >= 0; i--) {
    const q = popups[i];
    if(freezeT===0)q.life--;
    const t = 1 - q.life / q.max;
    const s = q.size * (t < 0.15 ? (t / 0.15) * 1.3 : 1);
    textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(s, 1));
    stroke('#24323c'); strokeWeight(7); fill(q.c);
    text(q.txt, q.x, q.y - t * 20);
    if (q.life <= 0) popups.splice(i, 1);
  }
}

function drawFreezeWorld(){if(fzType==='senku')paintSenkuWorld();else paintImpactWorld();}
function drawFreezeText(){if(fzType==='senku')paintSenkuCutin();else paintImpactText();}

function dmgColor(d) {
  const w = color(255), y = color(255, 209, 102), r = color(239, 71, 71);
  return d < 60 ? lerpColor(w, y, d / 60) : lerpColor(y, r, Math.min((d - 60) / 80, 1));
}

function drawWeapon(t, x, y, f, mode, blinkFast) {
  push();
  translate(x, y);
  if (t === 'sword') {
    scale(f, 1);
    rotate(mode === 'swing' ? 0 : mode === 'back' ? -PI * 0.8 : mode === 'icon' ? -PI / 4 : -PI / 2.6);
    stroke('#24323c'); strokeWeight(8); line(0, 0, 38, 0);
    stroke('#eef3f6'); strokeWeight(4); line(2, 0, 38, 0);
    stroke('#8d6e63'); strokeWeight(5); line(-6, 0, 2, 0);
    stroke('#ffd166'); strokeWeight(4); line(3, -7, 3, 7);
  } else if (t === 'gun') {
    scale(f, 1);
    if (mode === 'icon') rotate(-0.2);
    noStroke(); fill('#24323c');
    rect(-2, -5, 22, 8, 2); rect(0, 0, 6, 10, 2);
    fill('#ef4747'); rect(14, -5, 6, 3);
  } else if (t === 'bomb') {
    noStroke(); fill('#24323c'); circle(0, 0, 16);
    stroke('#8d6e63'); strokeWeight(2); line(4, -6, 8, -12);
    noStroke();
    const sp = blinkFast ? 4 : 10;
    fill(visualFrame % sp < sp / 2 ? '#ffd166' : '#ef4747'); circle(8, -13, 5);
  }
  pop();
}

function drawItem(it) {
  const bob = it.landed ? sin(visualFrame * 0.08) * 3 : 0;
  const x = it.x, y = it.y - 16 + bob;
  noStroke(); fill(255, 255, 255, 110 + sin(visualFrame * 0.15) * 50);
  circle(x, y, 38);
  drawWeapon(it.t, it.t === 'sword' ? x - 12 : x - 8, it.t === 'sword' ? y + 10 : y, 1, 'icon');
}

function drawMine(m) {
  noStroke(); fill('#24323c');
  arc(m.x, m.y, 26, 18, PI, TWO_PI);
  fill(m.arm > 0 ? '#888888' : (visualFrame % 20 < 10 ? '#ef4747' : '#5a1a1a'));
  circle(m.x, m.y - 6, 6);
}

function drawProjs() {
  strokeCap(ROUND);
  for (const q of projs) {
    if(q.anime){drawAnimeProjectile(q);continue;}
    if(q.kind==='arrow'){drawArrow(q);continue;}
    if (q.kind === 'hado') {
      noStroke();
      fill(110, 200, 255, 70); circle(q.x, q.y, q.r * 3.2);
      fill(110, 200, 255, 160); circle(q.x, q.y, q.r * 2.2);
      fill(255); circle(q.x, q.y, q.r * 1.1);
      noFill();stroke(180,244,255,170);strokeWeight(1.5);ellipse(q.x,q.y,q.r*1.5,q.r*2.6);
      stroke(105,214,255,110);strokeWeight(2);line(q.x-Math.sign(q.vx)*q.r,q.y-5,q.x-q.vx*6,q.y-7);line(q.x-Math.sign(q.vx)*q.r,q.y+5,q.x-q.vx*4,q.y+7);
    } else if (q.kind === 'shuri') {
      stroke(192,175,239,90);strokeWeight(2);line(q.x,q.y,q.x-q.vx*1.8,q.y);
      push(); translate(q.x, q.y); rotate(q.rot); noStroke(); fill('#5b7383');
      for (let k = 0; k < 4; k++) { rotate(HALF_PI); triangle(0, -3, 0, 3, 11, 0); } fill('#24323c'); circle(0, 0, 5); pop();
    } else if (q.kind === 'senku') {
      push(); translate(q.x,q.y); scale(q.dir || 1,1); noFill();
      const fade = constrain(q.life / 11, 0, 1);
      stroke(144,224,239,105 * fade); strokeWeight(18); bezier(18,24,150,-52,360,-48,q.range,-7);
      stroke(255,255,255,235 * fade); strokeWeight(7); bezier(18,20,150,-46,360,-42,q.range,-6);
      stroke(220,248,255,190 * fade); strokeWeight(2); bezier(12,31,165,-30,365,-29,q.range+8,2);
      noStroke(); fill(255,255,255,150 * fade); circle(q.range,-7,10); pop();
    } else {
      if(q.kind==='gunshot'){stroke(255,182,90,45);strokeWeight(11);line(q.x-q.vx*1.4,q.y,q.x,q.y);}
      stroke(255, 209, 102); strokeWeight(5); line(q.x - q.vx * 0.9, q.y, q.x, q.y);
      stroke(255); strokeWeight(2); line(q.x - q.vx * 0.4, q.y, q.x, q.y);
    }
  }
}

// Luffy visual system: presentation only. Collision, timing and network simulation are unchanged.
const LUFFY_FORMS=['','STRAW HAT','JET / STEAM','GIANT / BONE','BOUNDMAN','AWAKENING'];
function luffyFist(x,y,r,g,angle=0){
 push();translate(x,y);rotate(angle);stroke('#171c29');strokeWeight(1.5);
 fill(g===4?'#1b1522':g===2?'#ef9a87':'#e9b78c');rect(-r*.85,-r*.75,r*1.65,r*1.42,r*.42);
 fill(g===4?'#641e36':'#f4c7a2');ellipse(-r*.58,r*.36,r*.72,r*.77);
 stroke(g===4?'#f5526d':'#a86c58');strokeWeight(Math.max(.7,r*.07));
 for(let i=0;i<3;i++)line(r*(i*.36-.36),-r*.55,r*(i*.36-.36),-r*.02);
 noFill();stroke(g===4?'#ffbbc1':'#ffe2c6');strokeWeight(Math.max(1,r*.13));arc(0,-r*.13,r*1.15,r*.88,PI*1.1,PI*1.8);pop();
}
function luffyLimb(x0,y0,x1,y1,w,g,bend=0){
 noFill();stroke('#17202c');strokeWeight(w+3);bezier(x0,y0,x0+(x1-x0)*.35,y0+bend,x1-(x1-x0)*.2,y1+bend,x1,y1);
 stroke(g===4?'#251a29':g===2?'#ed9c88':'#e7b38a');strokeWeight(w);bezier(x0,y0,x0+(x1-x0)*.35,y0+bend,x1-(x1-x0)*.2,y1+bend,x1,y1);
 if(g===4){stroke('#b93650');strokeWeight(Math.max(1,w*.18));bezier(x0,y0-2,x0+(x1-x0)*.35,y0+bend-3,x1-(x1-x0)*.2,y1+bend-3,x1,y1-2);}
}
function luffySteam(g,t,front=false){
 if(g!==2&&g!==4&&g!==5)return;
 noFill();strokeCap(ROUND);
 if(g===2){if(front)return;for(let i=0;i<5;i++){const q=(t*.018+i*.21)%1,x=-20+i*10;stroke(255,237,226,(1-q)*150);strokeWeight(2.5*(1-q)+.6);bezier(x, -12-q*49,x-12,-24-q*49,x+12,-35-q*49,x-3,-45-q*49);}return;}
 const col=g===5?'#fffdf4':'#e4e6e2';
 stroke(81,98,119,75);strokeWeight(8);
 const side=front?1:-1,y=front?-25:-55;
 for(let pass=0;pass<2;pass++){if(pass){stroke(col);strokeWeight(4.5);}bezier(-30,y,-48,y-23*side,44,y-28*side,33,y-2);}
 if(front){for(let i=0;i<3;i++){const x=-29+i*30,y0=y+Math.sin(t*.07+i*2)*3;stroke(col);strokeWeight(3);arc(x,y0,12,10,.2,PI*1.65);}}
}
function luffyBody(p,g,t){
 const giant=g===4,white=g===5,skin=flash[p.id]>0?'#fff9ec':g===2?'#ed9c88':'#e7b38a';
 const walk=p.g?Math.sin(t*.33)*Math.min(Math.abs(p.vx||0),4)*2.1:5;
 // Sandals, bare shins and folded shorts remain legible at gameplay scale.
 for(const side of [-1,1]){const x=side*(giant?10:7),foot=side*10+walk*side;
 luffyLimb(x,-17,foot,-3,giant?8:5,1);stroke('#252430');strokeWeight(5);line(foot-4,0,foot+5,0);stroke('#b39b65');strokeWeight(2);line(foot-3,-2,foot+4,-2);}
 stroke('#192330');strokeWeight(1.5);fill(white?'#f7f5ed':'#2872a0');
 quad(-15,-27,15,-27,13,-12,-15,-12);fill(white?'#e4e6e8':'#d2d7ce');rect(-15,-15,12,4,1);rect(2,-15,12,4,1);
 fill(skin);if(giant)ellipse(0,-43,51,45);else quad(-10,-48,10,-48,11,-26,-11,-26);
 // Open jacket and chest scar, drawn as costume details on a blank-faced fighter.
 fill(white?'#fffdf7':'#c7343d');
 if(!giant){quad(-12,-48,-4,-49,-5,-29,-16,-24);quad(5,-49,12,-48,16,-24,6,-29);}
 else{triangle(-20,-58,-27,-32,-19,-35);triangle(20,-58,27,-32,19,-35);}
 stroke('#a65e50');strokeWeight(1.5);line(-4,-40,4,-32);line(4,-40,-4,-32);
 if(giant){noFill();stroke('#7b293e');strokeWeight(2);for(const side of [-1,1]){bezier(side*22,-57,side*13,-56,side*23,-47,side*15,-43);bezier(side*18,-59,side*10,-53,side*18,-50,side*12,-47);}stroke('#b97b64');strokeWeight(1.5);arc(-11,-48,19,13,0,PI);arc(11,-48,19,13,0,PI);line(0,-44,0,-29);}
 noStroke();fill(white?'#9862b3':'#e8bd48');rect(-15,-29,30,5,1);
 beginShape();vertex(-9,-26);bezierVertex(-20,-25,-20-Math.sin(t*.1)*3,-12,-30,-15);vertex(-27,-10);bezierVertex(-14,-11,-13,-20,-6,-25);endShape(CLOSE);
 if(!giant){fill('#eecb70');for(let i=0;i<2;i++)circle(9,-42+i*7,2.3);}
 const headY=giant?-67:-58;
 stroke('#16202c');strokeWeight(1.5);fill(skin);ellipse(0,headY,19,21);
 noStroke();fill(white?'#fffef7':'#171b23');
 if(white){for(let i=0;i<7;i++){const a=PI+i*PI/6;circle(Math.cos(a)*11,headY-3+Math.sin(a)*10,10+(i%2)*2);}noFill();stroke('#c5c7d5');strokeWeight(1);arc(-7,headY-12,7,6,.2,PI*1.65);arc(5,headY-13,8,7,.1,PI*1.7);}
 else{for(let i=0;i<6;i++)triangle(-11+i*4,headY-5,-13+i*5,headY-19-(i%2)*3,-6+i*4,headY-9);
 if(!giant){fill('#e7bf59');stroke('#6e492d');strokeWeight(1);ellipse(0,headY-12,35,7);fill('#efd17c');arc(0,headY-13,23,17,PI,TWO_PI);noStroke();fill('#ba343c');rect(-11,headY-15,22,3,1);}}
}
function drawLuffy(p){
 const C=CC(p.cid),sz=C.size,mv=p.mv,t=visualFrame;
 const shifting=fzType==='gear'&&freezeT>0&&fz?.att===p.id;
 const shiftQ=shifting?1-freezeT/freezeMax:1;
 const g=shifting&&shiftQ<.25?Math.max(1,(p.gear||2)-1):(p.gear||1);
 const attacking=p.a>0&&mv,active=attacking&&p.a>=mv.act0&&p.a<=mv.act1;
 const bounce=g===4?Math.abs(Math.sin(t*.17))*3:g===5?Math.sin(t*.12)*1.6:0;
 push();translate(p.x,p.y);scale(sz);rotate(p.r||0);
 if(p.dg>0)drawingContext.globalAlpha=.4;else if((p.remote?p.ivf:p.inv>0)&&t%6<3)drawingContext.globalAlpha=.45;
 noStroke();fill(0,0,0,45);ellipse(0,3,g===4?51:35,6);
 translate(0,-bounce);scale(p.f,1);
 luffySteam(g,t,false);
 if(g===4){fill('#d3ac54');stroke('#6d4230');strokeWeight(1);ellipse(-20,-47,13,27);stroke('#b03239');strokeWeight(3);line(-20,-56,-20,-39);}
 if(g===2&&Math.abs(p.vx||0)>2){stroke(255,162,146,100);strokeWeight(2);for(let i=0;i<3;i++)line(-25,-20-i*15,-42-i*5,-20-i*15);}
 luffyLimb(-9,-44,-19,-27,g===4?14:5,g,2);luffyFist(-19,-27,g===4?10:6,g);
 luffyBody(p,g,t);
 let hx=19,hy=-34,fr=g===4?11:g===3?14:6.5,bend=5;
 if(p.ch>0){hx=-23;hy=-31;fr=g===3?17:g===5?16:fr;noFill();stroke(255,216,144,Math.min(220,50+p.ch*3));strokeWeight(1.5);arc(hx,hy,fr*2+10,fr*2+10,t*.15,t*.15+PI*1.5);}
 if(p.ct>0||p.cs>0){hx=15;hy=-49;}
 if(p.stn>0||p.tired>0){hx=14;hy=-22;}
 if(attacking&&!p.w){
  const kind=mv.kind,up=kind==='rjump'||kind==='upper';
  const wind=Math.min(1,p.a/Math.max(1,mv.act0)),retract=Math.max(0,Math.min(1,(p.a-mv.act1)/Math.max(1,mv.end-mv.act1)));
  const reach=mv.reach/sz,ext=p.a<mv.act0?0:active?1:Math.pow(1-retract,3);
  hx=p.a<mv.act0?-12-14*wind:19+(reach-19)*ext;hy=-(mv.yo||34);bend=p.a<mv.act0?10:active?0:Math.sin(retract*PI)*18;
  fr=g===3?7+15*(p.a<mv.act0?wind:Math.max(.15,ext)):g===5?8+13*(active?1:ext):g===4?14:7;
  if(up){hx=4;hy=-48-21*ext;fr=g===3?18:g===4?13:9;bend=-10;}
  if(kind==='rflurry'&&active){
   for(let i=0;i<5;i++){const phase=((p.a-mv.act0)*.47+i*.21)%1,xx=22+(reach-22)*(1-Math.pow(1-phase,3)),yy=hy+(i-2)*9;push();drawingContext.globalAlpha*=.13+(1-phase)*.22;luffyLimb(9,-44,xx,yy,4,g,0);luffyFist(xx,yy,fr*.8,g);pop();}
   hy+=Math.sin(p.a*2.6)*6;
  }
  if(kind==='rtwin'){luffyLimb(-7,-42,hx,hy+10,g===4?12:6,g,bend);luffyFist(hx,hy+10,fr,g);hy-=9;}
  if(active){noFill();stroke(g===4?'#ed4b68':g===2?'#ffb2a2':'#fff7e5');strokeWeight(1.4);
   if(up){for(let i=0;i<3;i++)line(-15+i*14,-29,-15+i*14,-66);}
   else{for(let i=0;i<3;i++)line(Math.max(20,hx-70-i*8),hy-10+i*10,hx-8,hy-10+i*10);}
   if(g>=3){push();translate(hx,hy);strokeWeight(2);ellipse(-8,0,10,fr*2.6);pop();}
  }
 }
 if(g===4&&attacking&&p.a<mv.act0&&!p.w){noFill();stroke('#e85170');strokeWeight(2);for(let i=0;i<3;i++)ellipse(hx+6+i*6,hy,7,19-i*2);}
 luffyLimb(9,g===4?-51:-44,hx,hy,g===4?14:g===3?9:5.5,g,bend);luffyFist(hx,hy,fr,g,0);
 if(p.w)drawWeapon(p.w,hx,hy,1,attacking?'swing':p.ch?'back':'hold',false);
 if(p.ct>0||p.cs>0){noFill();stroke(135,212,255,190);strokeWeight(2);arc(4,-37,52,57,-PI*.45,PI*.45);}
 luffySteam(g,t,true);
 if(shifting){noFill();const q=shiftQ;stroke(g===5?'#ffffff':'#ffbd8d');strokeWeight(2*(1-q)+.5);ellipse(0,-35,20+q*110,35+q*110);}
 pop();
 if(p.stn>0){push();textAlign(CENTER,CENTER);textSize(12);noStroke();fill('#ffd166');for(let i=0;i<3;i++)text('★',p.x+Math.cos(t*.15+i*2.1)*17,p.y-83*sz+Math.sin(t*.15+i*2.1)*5);pop();}
 paintSpecialDetails(p);
 const top=p.y-(g===4?99:90)*sz;
 drawAttackChargeBar(p,p.x,top+16,66);
 push();textAlign(CENTER,CENTER);textStyle(BOLD);stroke('#0d1418');strokeWeight(3);fill(battleTeamMode?teamColor(p.team):p.c);textSize(12);
 text((battleTeamMode?teamName(p.team)+' ':'')+p.label,p.x,top-5);
 if(p.id===myId){noStroke();fill(battleTeamMode?teamColor(p.team):p.c);triangle(p.x-5,top+6,p.x+5,top+6,p.x,top+12);drawCool(p.x+35,top-5,p.ctc,CT_COOL*C.ctc,'#3a86ff','C');}
 if(p.w){noStroke();fill('#fff4df');textSize(10);text('残'+Math.max(0,p.am),p.x-37,top-5);}pop();
}
function paintGearCutin(){
 const lv=fz?.lv||2,t=1-freezeT/freezeMax,slide=1-Math.pow(1-Math.min(1,t*6),3),c=lv===5?'#f7f4ed':lv===4?'#ed526a':'#f7ba7a';
 push();noStroke();fill('#080d18');rect(0,0,W,23);rect(0,WH-23,W,23);
 if(t>.24&&t<.34){fill(255,247,226,(1-(t-.24)/.1)*175);rect(0,0,W,WH);}
 const y=WH*.75;fill(7,12,22,225);quad(0,y-39,W,y-61,W,y+47,0,y+61);
 fill(c);quad(0,y-39,W*.66,y-54,W*.65,y-49,0,y-34);
 textAlign(LEFT,CENTER);textStyle(BOLDITALIC);fill(c);textSize(52);text('GEAR '+lv,24-(1-slide)*230,y-2);
 textStyle(BOLD);textSize(11);fill('#f4efdf');text(LUFFY_FORMS[lv],27,y+34);
 textAlign(RIGHT,CENTER);textSize(lv===4?27:32);text(lv===4?'弾む男':lv===5?'最高地点':lv===3?'骨風船':'加速する鼓動',W-27,y+5);pop();
}
function paintAnimeFormCutin(){
 if(!fz)return;
 const pal=animeFormPalette(fz.cid,fz.form);
 const t=1-freezeT/Math.max(1,freezeMax),slide=1-Math.pow(1-Math.min(1,t*6),3);
 const ss3=fz.cid==='goku'&&fz.form===3,kagura=fz.cid==='tanjiro';
 push();
 // ルフィ版 paintGearCutin と同じ画面上下の黒帯・斜めのテロップ。
 noStroke();fill('#080d18');rect(0,0,W,23);rect(0,WH-23,W,23);
 if(t>.24&&t<.34&&!(fz.cid==='eren'&&prefs.lowFlash)){fill(255,247,230,(1-(t-.24)/.1)*(ss3?230:175));rect(0,0,W,WH);}
 const y=WH*.74;
 fill(7,12,22,230);quad(0,y-43,W,y-66,W,y+53,0,y+63);
 fill(pal.main);quad(0,y-43,W*.70,y-57,W*.70,y-51,0,y-37);
 // 大きい形態名と日本語サブタイトル。
 if(kagura){
   // 炎の専用背景。動物の形は使わない。
   for(let i=0;i<14;i++){
    const x=(i*79+17)%W,tip=y-84-(i%4)*22-Math.sin(t*10+i)*13;
    noFill();stroke(i%3===0?'#ffdd93':'#ff622d');strokeWeight(i%4===0?4:2);
    line(x+30,y-64,x-6,tip);line(x-6,tip,x+18,tip+24);
   }
 }
 textAlign(LEFT,CENTER);textFont(kagura?'sans-serif':'Impact, sans-serif');textStyle(kagura?BOLD:BOLDITALIC);fill(kagura?'#fff4e0':pal.main);
 if(kagura){stroke('#4a1715');strokeWeight(7);}else noStroke();
 textSize(kagura?Math.min(70,W*.095):ss3?49:51);text(pal.tag,24-(1-slide)*W*.45,y-5);noStroke();
 textStyle(BOLD);textSize(14);fill('#f5f1e9');text(pal.sub,27,y+35);
 textAlign(RIGHT,CENTER);textSize(12);fill(pal.hot);
 text(fz.cid==='eren'?'EREN YEAGER':fz.cid==='goku'?'SON GOKU':fz.cid==='tanjiro'?'TANJIRO KAMADO':'NARUTO UZUMAKI',W-26,y+44);
 if(ss3){
   // スーパーサイヤ人3だけシネマティック中の電撃を追加。
   noFill();stroke('#d8faff');strokeWeight(1.6);
   for(let i=0;i<5;i++){
    const x=25+i*W*.19;
    line(x,WH*.15,x+17,WH*.25);line(x+17,WH*.25,x-3,WH*.32);
   }
 }
 pop();
}

function sfxLuffyHit(g){
 noiseHit(g>=3?.17:.07,g>=3?.3:.18,g===4?1700:2300);tone(g>=3?105:170,34,g>=3?.27:.12,.22,'sine');
 if(g===4){noiseHit(.055,.16,6000,true);tone(420,95,.09,.08,'sawtooth');}
 if(g===5){tone(240,110,.13,.1,'triangle',.045);tone(85,40,.18,.16,'sine',.07);}
}
function luffyPortrait(g=1){
 const white=g===5,big=g===4,skin=g===2?'#ee9b88':'#e7b38a',jacket=white?'#fffaf0':'#c93742';
 return `<svg viewBox="0 0 100 82" aria-hidden="true"><circle cx="50" cy="39" r="35" fill="${white?'#dfe8ff':big?'#ee5673':'#f3b775'}" opacity=".1"/>
 <path d="M35 66l-7 13m34-13 9 13" stroke="${skin}" stroke-width="7"/><path d="M31 62h37v11H31z" fill="${white?'#fbf9ef':'#2e789e'}"/>
 ${big?`<ellipse cx="50" cy="48" rx="28" ry="24" fill="${skin}" stroke="#362b31"/>`:`<path d="M36 33h28l7 32H29z" fill="${skin}"/><path d="M36 33l10-2-4 34H29zM55 31l10 2 6 32H58z" fill="${jacket}"/>`}
 <path d="M43 43l13 14m0-14L43 57" stroke="#a76b59" stroke-width="2"/><path d="M31 64h38" stroke="${white?'#9769b7':'#e8bd50'}" stroke-width="6"/>
 <path d="M34 40L16 50M66 40l17 8" stroke="${big?'#291c2e':skin}" stroke-width="${big?15:7}" stroke-linecap="round"/><rect x="5" y="42" width="19" height="16" rx="6" fill="${big?'#291c2e':skin}"/><rect x="75" y="38" width="20" height="19" rx="6" fill="${big?'#291c2e':skin}"/>
 <circle cx="50" cy="22" r="11" fill="${skin}"/><path d="M39 19l-3-10 9 4 1-11 7 9 7-7 2 12 7-3-5 10" fill="${white?'#fffdf7':'#171b25'}"/>
 ${white?'<path d="M38 13q-9-9 2-10 3-10 11-2 11-6 13 5 10 1 4 11" fill="#fffdf7"/>':big?'': '<ellipse cx="50" cy="12" rx="23" ry="5" fill="#d9ae4c"/><path d="M37 11q1-16 25 0" fill="#efd080"/><path d="M38 11h24" stroke="#bb353d" stroke-width="4"/>'}
 ${g===2?'<path d="M23 31q-13-13 1-23M73 30q15-12 3-22" fill="none" stroke="#fff1e1" stroke-width="3" opacity=".8"/>':''}
 ${big||white?'<path d="M23 56C0 32 26 19 32 28M68 26C91 14 106 45 79 57" fill="none" stroke="#f3f3ec" stroke-width="4" stroke-linecap="round"/>':''}</svg>`;
}

function baseDrawFighter(p) {
  if (!p || p.out) return;
  if(p.cid==='rubber'){drawLuffy(p);return;}
  if(isAnime(p)){drawAnimeFighter(p);return;}
  if(p.cid==='swordsman'&&senkuActive&&senkuActive.id===p.id&&fzType==='senku'&&freezeT>0){drawSenkuActor(p,(SENKU_STOP-freezeT)/SENKU_STOP);return;}
  const C = CC(p.cid), sz = C.size, id = p.id, mv = p.mv;

  const tr = trails[id] || (trails[id] = []);
  if (freezeT===0 && (p.kb > 0 || p.dg > 0 || p.rise > 0 || (p.cid === 'rubber' && (p.gear === 2 || p.gear === 5) && Math.abs(p.vx || 0) > 2.5))) { tr.push({ x: p.x, y: p.y - 30 * sz }); if (tr.length > 8) tr.shift(); }
  else if (freezeT===0 && tr.length) tr.shift();
  noStroke();
  for (let i = 0; i < tr.length; i++) {
    const c = color(p.c); c.setAlpha(20 + i * 12); fill(c);
    circle(tr[i].x, tr[i].y, (10 + i * 2.5) * sz);
  }

  if ((mv && mv.glow && p.a <= mv.glow) || (p.arm > 0 && !(p.cid==='sumo'&&mv?.kind==='tsuki'))) {
    noStroke(); fill(255, 209, 102, 110 + sin(visualFrame * 0.9) * 60);
    circle(p.x, p.y - 30 * sz, 74 * sz);
  }

  if(p.cid==='sumo'&&p.arm>0)drawSumoArmor(p);
  if(p.cid==='rubber')drawGearAura(p,sz);
  const dodging = p.dg > 0;
  const invOn = p.remote ? p.ivf : p.inv > 0;
  const blink = !dodging && invOn && visualFrame % 6 < 3;
  const col = flash[id] > 0 ? '#ffffff' : (p.cid==='rubber' ? '#e7bd8b' : p.c);
  const walk = p.g ? sin(visualFrame * 0.35) * Math.min(Math.abs(p.vx || 0), 4) * 3 : 6;
  const warn = p.ch >= CH_WARN, bw = p.cid === 'sumo' ? 7 : (p.cid === 'yankee' ? 6 : 5);
  let hand = { x: p.f * 14, y: 2 - walk * 0.4 }, wmode = 'hold';

  if (rageOn(p)) {
    noStroke(); fill(239,71,71,55 + sin(visualFrame*0.7)*18); circle(p.x,p.y-30*sz,88*sz);
    noFill(); stroke(255,95,55,135); strokeWeight(4); circle(p.x,p.y-30*sz,(72+sin(visualFrame*0.45)*9)*sz);
  }
  if (p.cid === 'swordsman' && p.senkuWind > 0) {
    const q = 1 - p.senkuWind / SENKU_WIND;
    noStroke(); fill(120,220,245,28 + q*55); circle(p.x,p.y-32*sz,(70+q*48)*sz);
    noFill(); stroke(220,248,255,120 + q*100); strokeWeight(2+q*3); circle(p.x,p.y-32*sz,(52+q*36)*sz);
    stroke('#ffffff'); strokeWeight(3+q*3); line(p.x+p.f*8,p.y-38*sz,p.x+p.f*(42+q*24),p.y-(50+q*8)*sz);
  }
  push();
  translate(p.x, p.y); scale(sz); translate(0, -30);
  rotate(p.r || 0);
  if (dodging) drawingContext.globalAlpha = 0.45;
  else if (blink) drawingContext.globalAlpha = 0.35;
  if (p.ch > 0 && freezeT===0) translate(random(-1, 1) * (warn ? 3.5 : 1.5), 0);

  if (p.cid === 'bomber') {
    noStroke(); fill('#24323c'); circle(-p.f * 11, -4, 14);
    stroke('#8d6e63'); strokeWeight(2); line(-p.f * 14, -10, -p.f * 18, -16);
  }

  stroke(col); strokeWeight(bw); strokeCap(ROUND); noFill();
  line(0, -14, 0, 10);
  if (p.cid === 'sumo') {
    noStroke(); fill(col); ellipse(0, 1, 30, 28);
    stroke('#24323c'); strokeWeight(5); line(-13, 8, 13, 8);
  }
  if (p.cid === 'karate') {
    stroke('#24323c'); strokeWeight(4); line(-6, 6, 6, 6);
    strokeWeight(3); line(-p.f * 2, 6, -p.f * 8, 13);
  }
  paintCostume(p,col);
  stroke(col); strokeWeight(bw); noFill();
  line(0, 10, -8 + walk, 30);
  line(0, 10, 8 - walk, 30);

  if(p.cid==='berserker'&&p.a>0&&mv&&['axeheavy','axeup'].includes(mv.kind)){
    const pose=axePose(p);line(0,-8,p.f*pose.x,pose.y);line(0,-6,p.f*(pose.x-7),pose.y+5);hand={x:p.f*pose.x,y:pose.y};
  } else if(p.cid==='archer'&&(p.sph>0||p.sh>0)){
    const up=p.sh>0&&p.bowUp;line(0,-8,p.f*(up?4:23),up?-31:-7);line(0,-7,-p.f*(8+Math.min(p.sph/36,1)*12),-5);hand={x:p.f*(up?4:23),y:up?-31:-7};
  } else if (p.cs > 0) {
    line(0, -8, p.f * 30, -10); line(0, -8, -p.f * 10, 2);
    noFill(); stroke(255, 209, 102, 230); strokeWeight(8);
    if (p.f > 0) arc(6, -6, 80, 80, -PI / 2, PI / 2.5);
    else arc(-6, -6, 80, 80, PI - PI / 2.5, PI + PI / 2);
    hand = { x: p.f * 30, y: -10 }; wmode = 'swing';
  } else if (p.ct > 0) {
    line(0, -8, p.f * 12, -16); line(0, -8, p.f * 12, 0);
    if (inCounter(p)) {
      noFill(); stroke(110, 200, 255, 170 + sin(visualFrame * 0.8) * 60); strokeWeight(5);
      if (C.back) circle(0, -6, 66);
      else if (p.f > 0) arc(4, -6, 64, 64, -PI / 2.5, PI / 2.5);
      else arc(-4, -6, 64, 64, PI - PI / 2.5, PI + PI / 2.5);
    }
    hand = { x: p.f * 12, y: -16 };
  } else if (p.stn > 0) {
    line(0, -8, -10, 8); line(0, -8, 10, 8);
    hand = { x: 10, y: 8 };
  } else if (p.sh > 0) {
    line(0, -8, p.f * 18, -6); line(0, -8, -p.f * 10, 4);
    hand = { x: p.f * 18, y: -6 };
    if (p.cid === 'karate') { noStroke(); fill(110, 200, 255, 150); circle(p.f * 22, -4, 16); }
  } else if (p.a > 0 && mv && RISE_KINDS.includes(mv.kind)) {
    // 上必殺技のポーズ
    const act = p.a >= mv.act0 && p.a <= mv.act1;
    if(mv.kind==='gunjump'){
      line(0,-8,p.f*6,14);line(0,-8,-p.f*12,-18);hand={x:p.f*6,y:14};
    } else if(mv.kind==='tsuki'){
      line(0,-8,-14,6);line(0,-8,14,6);hand={x:14,y:6};
    } else if (mv.kind === 'blastj') {
      line(0, -8, -14, -22); line(0, -8, 14, -22);
      hand = { x: 14, y: -22 };
    } else {
      line(0, -8, p.f * 8, -38); line(0, -8, -p.f * 10, 2);
      hand = { x: p.f * 8, y: -38 };
      if (act) {
        noFill(); strokeWeight(7);
        if (mv.kind === 'shoryu') {
          // 昇龍拳らしい縦方向の炎の軌跡
          stroke(255, 105, 35, 235); strokeWeight(9);
          arc(p.f * 5, -22, 70, 90, -PI * 0.92, -PI * 0.08);
          stroke(255, 190, 60, 225); strokeWeight(5);
          arc(p.f * 7, -26, 50, 76, -PI * 0.9, -PI * 0.1);
          noStroke();
          fill(255, 235, 130, 235); circle(p.f * 9, -43, 24);
          fill(255, 110, 40, 180);
          circle(-p.f * 5, 7, 14 + sin(visualFrame * 0.8) * 3);
          circle(p.f * 1, -7, 11 + sin(visualFrame * 1.1) * 2);
          circle(-p.f * 2, -20, 8 + sin(visualFrame * 1.3) * 2);
        } else if (mv.kind === 'tsuki') {
          // Recovery only: no overhead attack effect.
        } else if (mv.kind === 'swordup') {
          stroke('#eef3f6'); strokeWeight(8); arc(0,-42,82,64,-PI,0); stroke('#90e0ef'); strokeWeight(3); arc(0,-42,92,72,-PI,0);
        } else if (mv.kind === 'lanceup') {
          stroke('#eef3f6'); strokeWeight(6); arc(0,-52,105,70,-PI*0.95,-PI*0.05);
        } else if (mv.kind === 'gunjump') {
          stroke('#ffd166'); strokeWeight(5); line(p.f*4,14,p.f*10,46); line(p.f*4,14,-p.f*14,40); line(p.f*4,14,p.f*26,38);
        } else if (mv.kind === 'shotgunup') {
          stroke('#ffd166'); strokeWeight(5); line(-24,-44,-50,-86); line(0,-48,0,-96); line(24,-44,50,-86);
        } else {
          stroke(255, 209, 102, 230); arc(p.f * 6, -20, 56, 66, -PI * 0.85, -PI * 0.15);
        }
      }
    }
  } else if (p.a > 0 && mv && mv.rubber) {
    // 伸びる腕：出だしで縮み、当たり中は最大まで伸び、終わりに戻ってくる
    const k = p.a < mv.act0 ? 0.08 : p.a <= mv.act1 ? 1 : Math.max(0, 1 - (p.a - mv.act1) / Math.max(1, mv.end - mv.act1));
    const fr = gearStat(p).fist, rocket = mv.kind === 'rrocket', arms = mv.kind === 'rflurry' ? 3 : (rocket || mv.kind === 'rtwin') ? 2 : 1;
    for (let i = 0; i < arms; i++) {
      let L = rocket ? 70 : 10 + (mv.reach - 10) * k;
      if (mv.kind === 'rtwin' && p.a < mv.act0) L = 10 - 8 * (p.a / mv.act0); // 後ろへ引き絞ってから
      if (mv.kind === 'rflurry') L *= 0.5 + 0.5 * Math.abs(Math.sin(visualFrame * 0.9 + i * 2.1));
      const yy = -4 + (arms > 1 ? (i - (arms - 1) / 2) * 9 : 0);
      stroke(col); strokeWeight(bw * 0.8); noFill(); beginShape();
      for (let q = 0; q <= 10; q++) { const u = q / 10; vertex(p.f * L * u, -8 + (yy + 8) * u + Math.sin(u * PI * 4 + visualFrame * 0.7) * (1 - k * 0.7) * 2.5); }
      endShape();
      noStroke(); fill('#ff8a3d'); circle(p.f * L, yy, fr * 2); fill(255, 255, 255, 110); circle(p.f * L - 2, yy - 2, fr * 0.6);
    }
    stroke(col); strokeWeight(bw); if (!rocket && mv.kind !== 'rtwin') line(0, -8, -p.f * 10, 2);
    hand = { x: p.f * 10, y: -4 };
  } else if (p.a > 0 && mv) {
    const act = p.a >= mv.act0 && p.a <= mv.act1;
    if (mv.kind === 'upper') {
      if (p.a < mv.act0) { line(0, -8, p.f * 8, 10); hand = { x: p.f * 8, y: 10 }; }
      else {
        line(0, -8, p.f * 10, -36); hand = { x: p.f * 10, y: -36 };
        if (act) { noFill(); stroke(255, 209, 102, 230); strokeWeight(8); arc(p.f * 8, -14, 66, 66, -PI * 0.85, -PI * 0.15); }
      }
      stroke(col); strokeWeight(bw); line(0, -8, -p.f * 10, 2);
    } else if (mv.kind === 'harite') {
      if (p.a < mv.act0) { line(0, -8, -p.f * 14, -4); hand = { x: -p.f * 14, y: -4 }; }
      else {
        line(0, -8, p.f * 30, -6); hand = { x: p.f * 30, y: -6 };
        if (act) {
          noFill(); stroke(255, 255, 255, 220); strokeWeight(7);
          if (p.f > 0) arc(8, -6, 90, 90, -PI / 3, PI / 3); else arc(-8, -6, 90, 90, PI - PI / 3, PI + PI / 3);
          noStroke(); fill(col); ellipse(p.f * 33, -6, 15, 22);
        }
      }
      stroke(col); strokeWeight(bw); line(0, -8, -p.f * 10, 2);
    } else {
      const ext = act ? (mv.kind === 'charge' ? 28 : 22) : 10;
      line(0, -8, p.f * ext, -4); line(0, -8, -p.f * 10, 2);
      if (act) {
        const R = (mv.sword ? 16 : 0) + (mv.kind === 'charge' ? 34 : 26);
        noFill(); stroke(255, 255, 255, 220); strokeWeight(mv.kind === 'charge' ? 7 : 4);
        if (p.f > 0) arc(6, -4, R * 2, R * 2, -PI / 2.2, PI / 3);
        else arc(-6, -4, R * 2, R * 2, PI - PI / 3, PI + PI / 2.2);
        if (!p.w && p.cid !== 'boxer') { noStroke(); fill(col); circle(p.f * ext, -4, mv.kind === 'charge' ? 15 : 10); }
        wmode = 'swing';
      }
      hand = { x: p.f * ext, y: -4 };
    }
  } else if (p.ch > 0 || p.sph > 0) {
    line(0, -8, -p.f * 14, -2); line(0, -8, -p.f * 10, 4);
    hand = { x: -p.f * 14, y: -2 }; wmode = 'back';
    if (p.ch > 0) {
      const full = p.ch >= CH_FULL;
      noStroke();
      if (warn && visualFrame % 6 < 3) fill(239, 71, 71, 230);
      else if (full) fill(255, 209, 102, 230);
      else fill(255, 220, 80, 90 + p.ch * 2);
      circle(-p.f * 14, -2, 10 + Math.min(p.ch, CH_FULL) * 0.6 + (full ? sin(visualFrame * 0.6) * 3 : 0));
    } else if (p.cid === 'bomber') {
      drawWeapon('bomb', -p.f * 16, -4, 1, 'icon', p.sph > 10);
    } else if (p.cid === 'lancer') {
      const q = Math.min(p.sph / 60, 1);
      noFill(); stroke(255,209,102,120 + q*120); strokeWeight(4 + q*3); circle(-p.f*18,-3,18 + q*34);
      hand = { x: -p.f * 18, y: -3 };
    } else if (p.cid === 'gunman') {
      const q = Math.min(p.sph / 24, 1);
      noStroke(); fill(255,209,102,90 + q*140); circle(-p.f*14,-3,10 + q*12);
      hand = { x: -p.f * 14, y: -3 };
    }
  } else if (p.kb > 0) {
    line(0, -8, -12, -20); line(0, -8, 12, -20);
    hand = { x: 12, y: -20 };
  } else {
    line(0, -8, p.f * 14, 2 - walk * 0.4); line(0, -8, -p.f * 12, 4);
  }

  if(p.cid==='archer'&&(!p.w||p.sph>0||p.sh>0))drawBow(p,hand);
  if(p.cid==='berserker'&&(!p.w||['axeheavy','axeup'].includes(mv?.kind)))drawAxe(p,hand,wmode);
  if (p.cid === 'swordsman' && !p.w) drawKatana(hand.x, hand.y, p.f, wmode);
  if (p.cid === 'lancer' && !p.w) {
    push(); translate(hand.x,hand.y); scale(p.f,1); rotate(wmode==='back' ? -2.6 : wmode==='swing' ? -0.1 : -0.45);
    stroke('#8d6e63'); strokeWeight(5); line(-8,0,58,0); stroke('#eef3f6'); strokeWeight(4); line(58,0,76,0); line(76,0,64,-7); line(76,0,64,7); pop();
  }
  if (p.cid === 'gunman' && !p.w) drawRevolver(hand.x, hand.y, p.f, wmode, p);
  if (p.cid === 'rubber' && !p.w && !(p.a > 0 && mv && mv.rubber)) {
    const fr = gearStat(p).fist; noStroke(); fill('#ff8a3d'); circle(hand.x, hand.y, fr * 2); fill(255,255,255,100); circle(hand.x - 2, hand.y - 2, fr * 0.6);
  }
  if (p.cid === 'boxer' && !p.w) {
    noStroke(); fill(p.ko >= 100 ? '#f4ca76' : '#ef4747');
    circle(hand.x, hand.y, 14);
    fill(255, 255, 255, 120); circle(hand.x - 2, hand.y - 2, 4);
  }
  if (p.w) drawWeapon(p.w, hand.x, hand.y, p.f, wmode, false);

  stroke("#0a1526"); strokeWeight(2); fill(col);
  circle(0, -24, 20);

  noStroke();
  if (p.cid === 'sumo') {
    fill('#24323c'); ellipse(0, -36, 10, 7);
  } else if (p.cid === 'ninja') {
    fill('#24323c'); rect(-10,-33,20,3,1);
    stroke('#24323c'); strokeWeight(3);
    const wv = sin(visualFrame * 0.3) * 3;
    line(-p.f * 8, -27, -p.f * 22, -31 + wv); line(-p.f * 8, -27, -p.f * 20, -22 + wv);
  } else if (p.cid === 'karate') {
    stroke('#ef4747'); strokeWeight(4); line(-10, -28, 10, -28);
    strokeWeight(3); line(-p.f * 9, -28, -p.f * 17, -24);
  } else if (p.cid === 'bomber') {
    noStroke(); fill('#343e4c'); arc(0,-26,23,22,PI,TWO_PI); fill('#ffb861');rect(-12,-30,24,3,1);
  } else if (p.cid === 'yankee') {
    // リーゼント：前方へ大きく張り出す黒髪
    noStroke(); fill('#171b1e');
    rect(-10,-36,18,8,3); ellipse(p.f*5,-39,28,13); ellipse(p.f*15,-41,27,13); ellipse(p.f*25,-40,21,11);
    fill('#2b3238'); ellipse(p.f*28,-41,9,5);
    if (rageOn(p)) { noFill(); stroke('#ef4747'); strokeWeight(3); ellipse(p.f*15,-40,48,22);  }
  } else if (p.cid === 'swordsman') {
    // Plain blank head; the collar and uniform carry the character identity.
  } else if (p.cid === 'lancer') {
    fill('#9cabb8');noStroke();arc(0,-27,23,24,PI,TWO_PI);fill('#d4bd85');rect(-11,-34,22,3,1);fill('#a44753');triangle(-2,-38,4,-49,8,-37);
  } else if(p.cid==='archer'){
    noFill();stroke('#34594d');strokeWeight(5);arc(0,-24,27,27,PI*.82,TWO_PI+.18);noStroke();fill('#34594d');triangle(-p.f*10,-30,-p.f*20,-22,-p.f*11,-19);stroke('#d9cba0');strokeWeight(2);line(-8,-30,8,-30);
  } else if(p.cid==='berserker'){
    noStroke();fill('#596776');arc(0,-25,25,24,PI,TWO_PI);fill('#7d8a96');rect(-12.5,-27,25,3,1);fill('#d4bd88');triangle(-10,-31,-20,-41,-13,-26);triangle(10,-31,20,-41,13,-26);fill('#d87855');rect(-2,-41,4,5,1);
  } else if (p.cid === 'rubber') {
    const g=p.gear||1;
    // 肌色の顔を描き直し、麦わら帽子／ギア5の白髪でルフィらしさを出す。
    noStroke(); fill('#e7bd8b'); circle(0,-24,20);
    if(g===5){
      fill('#f5f2ea');
      triangle(-10,-31,-17,-39,-5,-35);triangle(-5,-34,-8,-44,0,-36);triangle(0,-35,4,-45,6,-35);
      triangle(5,-34,12,-43,11,-32);triangle(9,-31,18,-37,12,-27);
      noFill();stroke('#f5f2ea');strokeWeight(4);arc(0,-24,32,31,PI*.95,TWO_PI+.12);
    }else{
      fill('#15191d');triangle(-10,-30,-12,-39,-5,-33);triangle(-5,-32,-2,-42,2,-33);triangle(1,-33,7,-41,7,-31);triangle(6,-31,14,-37,10,-27);
      // 麦わら帽子：黄色い大きなつば＋赤い帯
      fill('#e5bd4d');ellipse(0,-37,34,9);fill('#f0cf67');arc(0,-38,24,15,PI,TWO_PI);fill('#c9403c');rect(-11,-39,22,3,1);
    }
    fill('#171b1e');circle(-4,-24,1.8);circle(4,-24,1.8);
    noFill();stroke('#7b3e34');strokeWeight(1.2);arc(0,-20,10,6,0,PI);
    stroke('#8d5144');strokeWeight(1);line(-7,-21,-10,-18);line(-8,-19,-10,-17);
  } else if (p.cid === 'gunman') {
    fill('#3d3338');noStroke();quad(-15,-35,14,-35,18,-31,-17,-31);quad(-9,-36,-7,-45,7,-45,10,-35);fill('#bba16d');rect(-9,-38,18,3,1);
  }
  pop();

  if (p.stn > 0) {
    textAlign(CENTER, CENTER); textSize(13); noStroke(); fill('#ffd166');
    for (let i = 0; i < 3; i++) {
      const ang = visualFrame * 0.15 + i * TWO_PI / 3;
      text('★', p.x + cos(ang) * 18, p.y - 62 * sz + sin(ang) * 5);
    }
  }

  paintSpecialDetails(p);
  const top = p.y - 74 * sz;
  drawAttackChargeBar(p,p.x,top+18,66);
  textAlign(CENTER, CENTER); textStyle(BOLD);
  if (p.id === myId) {
    noStroke(); fill(battleTeamMode?teamColor(p.team):p.c); triangle(p.x - 7, top, p.x + 7, top, p.x, top + 8);
    stroke('#0d1418'); strokeWeight(3); fill(255); textSize(13);
    text((battleTeamMode?teamName(p.team)+' ':'' )+p.label, p.x, top - 10);
    drawCool(p.x + 26, top - 10, p.ctc, CT_COOL * C.ctc, '#3a86ff', 'C');
    if (p.cid === 'sumo') drawCool(p.x + 44, top - 10, p.spc, 150, '#9b5de5', 'S');
    if (p.cid === 'yankee') { noStroke(); fill('#24323c'); rect(p.x-28,top+5,56,4); fill(rageOn(p)?'#ef4747':'#ff6b35'); rect(p.x-28,top+5,56*(rageOn(p)?p.rageT/RAGE_T:p.rage/RAGE_MAX),4); }
    if (p.cid === 'swordsman') { noStroke(); fill('#24323c'); rect(p.x-28,top+5,56,4); fill('#90e0ef'); rect(p.x-28,top+5,56*p.senku/SENKU_MAX,4); }
    if (p.w === 'gun' || p.w === 'sword') { noStroke(); fill(p.w === 'sword' && p.am <= 2 ? '#ef4747' : '#24323c'); textSize(11); text(`残${Math.max(0,p.am)}`, p.x - 28, top - 10); }
  } else {
    stroke('#0d1418'); strokeWeight(3); fill(battleTeamMode?teamColor(p.team):p.c); textSize(12);
    text((battleTeamMode?teamName(p.team)+' ':'')+p.label, p.x, top - 4);
  }
}

function drawGearAura(p, sz) {
  const g = p.gear || 1, cx = p.x, cy = p.y - 30 * sz;
  push(); noFill();
  if (p.tired > 0) { noStroke(); fill(160, 170, 180, 70); circle(cx, cy, 60 * sz); for (let i = 0; i < 3; i++) { fill('#9fd4ff'); circle(cx - 14 + i * 14, cy - 40 - ((visualFrame * 1.5 + i * 9) % 18), 4); } pop(); return; }
  if (g === 2) { stroke(255, 155, 74, 150); strokeWeight(2); for (let i = 0; i < 5; i++) { const y = cy - 22 + i * 11; line(cx - p.f * 22, y, cx - p.f * (40 + (visualFrame * 3 + i * 13) % 20), y); } noStroke(); fill(255, 155, 74, 40); circle(cx, cy, 62 * sz); }
  if (g === 3) { noStroke(); fill(255, 93, 93, 45); circle(cx, cy, 70 * sz); stroke(255, 93, 93, 140); strokeWeight(2); circle(cx, cy, (66 + Math.sin(visualFrame * 0.2) * 5) * sz); }
  if (g === 4) { stroke(197, 140, 255, 150); strokeWeight(3); ellipse(cx, p.y + 2, 54 + Math.abs(Math.sin(visualFrame * 0.25)) * 18, 10); noStroke(); fill(197, 140, 255, 40); circle(cx, cy, 68 * sz); }
  if (g === 5) {
    // ギア5：白い雲と自由に弾むようなオーラ。残り時間はHUDだけに表示する。
    noStroke(); fill(255, 255, 255, 42 + Math.sin(visualFrame * 0.3) * 14); circle(cx, cy, 96 * sz);
    stroke(255, 255, 255, 210); strokeWeight(3);
    for (let i = 0; i < 4; i++) { const r = (58 + i * 14) * sz, a0 = visualFrame * (0.045 + i * 0.015) + i * 1.6; arc(cx, cy, r, r * 0.56, a0, a0 + PI * 0.82); }
    noStroke(); for (let i = 0; i < 7; i++) { const a = visualFrame * 0.035 + i * TWO_PI / 7; fill('#ffffff'); circle(cx + Math.cos(a) * 46 * sz, cy + Math.sin(a) * 31 * sz, 4 + (i%2)*2); }
  }
  pop();
}
function drawCool(cx, cy, t, max, col, label) {
  if (t > 0) {
    const fr = 1 - t / max;
    noFill(); stroke(255, 255, 255, 90); strokeWeight(3); circle(cx, cy, 14);
    if (fr > 0.02) { stroke(col); arc(cx, cy, 14, 14, -HALF_PI, -HALF_PI + TWO_PI * fr); }
  } else {
    noStroke(); fill(col); circle(cx, cy, 15);
    fill(255); textSize(9); text(label, cx, cy + 0.5);
  }
}

