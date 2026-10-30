// Menu-only helpers. Combat, input transport and fighter simulation are untouched.
let menuRosterFilter='all';
const menuNormalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().trim();
function menuFighterMatches(id,query,filter){
 const c=CHARS[id];if(!c)return false;
 const special=SPECIAL_IDS.includes(id);
 return (filter==='all'||filter==='special'&&special||filter==='normal'&&!special)&&menuNormalize(c.name+' '+c.en+' '+id).includes(menuNormalize(query));
}
function menuApplyFilter(){
 const query=document.getElementById('fighter-search')?.value||'';
 let visible=0,total=0;
 document.querySelectorAll('#char-grid .ci').forEach(card=>{card.hidden=!menuFighterMatches(card.dataset.cid,query,menuRosterFilter);total++;if(!card.hidden)visible++;});
 document.querySelectorAll('#char-grid .roster-group').forEach(group=>{group.hidden=![...group.querySelectorAll('.ci')].some(card=>!card.hidden);});
 document.querySelectorAll('[data-roster-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rosterFilter===menuRosterFilter)));
 setTxt(document.getElementById('fighter-search-status'),visible?visible+' / '+total+' FIGHTERS':'見つかりませんでした。名前や絞り込みを変えてみてください。');
}
function menuUpdateArena(){
 const target=document.getElementById('menu-arena-preview'),map=MAPS[settings.map]||MAPS.std;
 const selected=document.querySelector('#stage-grid .stc.sel');
 const choice=settings.arenaChoice||settings.map;
 if(target&&ARENA_RANDOM[choice]){const ids=arenaCandidates(choice);target.innerHTML='<div class="arena-random-hero"><span aria-hidden="true">?</span><b>'+arenaChoiceName(choice)+'</b><p>開始時に '+ids.length+' ステージから抽選</p><small>'+(choice==='random-small'?'幅800のコンパクトな地形':choice==='random-wide'?'幅960〜1600の大きな地形':'すべての広さ・地形が対象')+'</small></div><div class="arena-pool-list"></div>';target.querySelector('.arena-pool-list').textContent=ids.map(id=>MAPS[id].name).join(' ／ ');}
 else if(target&&selected){target.innerHTML=(selected.querySelector('svg')?.outerHTML||'')+'<div><b></b><small>SELECTED ARENA</small></div>';target.querySelector('b').textContent=map.name;target.querySelector('svg')?.setAttribute('aria-hidden','true');}
 const names=offlineMode==='training'?[settings.trainingCpuCid]:Array.from({length:settings.cpuN},(_,i)=>settings.cpuCids?.[i]);
 const opponents=offlineMode==='kumite'?'勝ち抜き戦':offlineMode==='tournament'?'8人トーナメント':names.map(id=>CHARS[id]?.name||'ランダム').join('・');
 setTxt(document.getElementById('menu-match-summary'),CC(settings.cid).name+' vs '+opponents+' ／ '+settings.stocks+'ストック ／ '+(settings.wpn?'武器あり':'武器なし')+(settings.teamMode?' ／ チーム戦':''));
}
const menuStageBase=renderStageGrid;
renderStageGrid=function(id,current,pick){menuStageBase(id,current,pick);
 const grid=document.getElementById(id),randomRow=document.createElement('div');randomRow.className='arena-random-options';
 for(const choice of Object.keys(ARENA_RANDOM)){
  const button=document.createElement('button');button.type='button';button.className='stc random-arena'+(choice===current?' sel':'');button.dataset.arenaChoice=choice;
  const count=arenaCandidates(choice).length;button.innerHTML='<span class="random-arena-symbol" aria-hidden="true">?</span><div class="stage-meta"><b>'+ARENA_RANDOM[choice]+'</b><small>'+count+' STAGES / '+(choice==='random-small'?'幅800':choice==='random-wide'?'幅960以上':'すべての広さ')+'</small></div>';
  button.onclick=()=>pick(choice);randomRow.appendChild(button);
 }
 grid.prepend(randomRow);
 document.querySelectorAll('#'+id+' .stc').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('sel'))));if(id==='stage-grid')menuUpdateArena();};
const menuShowBase=show;
show=function(id){const result=menuShowBase(id);if(id==='sc-stage')menuUpdateArena();if(id!=='battle'){const screen=document.getElementById(id);if(screen){screen.scrollTop=0;const heading=screen.querySelector('.hd,h2');heading?.setAttribute('tabindex','-1');heading?.focus?.({preventScroll:true});}}return result;};
const menuBuildBase=buildMenus;
buildMenus=function(){
 menuBuildBase();
 const previousRender=renderChars;
 renderChars=function(){const focused=document.activeElement?.dataset?.cid;previousRender();menuApplyFilter();if(focused)document.querySelector('#char-grid [data-cid="'+focused+'"]')?.focus?.({preventScroll:true});};
 document.getElementById('fighter-search').addEventListener('input',menuApplyFilter);
 document.querySelectorAll('[data-roster-filter]').forEach(b=>b.addEventListener('click',()=>{menuRosterFilter=b.dataset.rosterFilter;menuApplyFilter();}));
 document.getElementById('menu-title-back').onclick=()=>show('sc-title');
 document.getElementById('sc-stage').addEventListener('click',()=>queueMicrotask(menuUpdateArena));
 document.getElementById('char-grid').addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.matches('.ci'))return;
  const cards=[...document.querySelectorAll('#char-grid .ci')].filter(c=>!c.hidden),index=cards.indexOf(event.target);
  const next=event.key==='Home'?0:event.key==='End'?cards.length-1:Math.max(0,Math.min(cards.length-1,index+(event.key==='ArrowRight'?1:-1)));
  event.preventDefault();cards[next]?.focus();
 });
 setTxt(document.getElementById('menu-facts'),Object.keys(CHARS).length+' FIGHTERS  /  '+Object.keys(MAPS).length+' ARENAS  /  UP TO 8 PLAYERS');
 menuApplyFilter();menuUpdateArena();
};
// Original vector artwork, retained DOM only. No timers, external images or menu animation loop.
document.querySelector('.title-art').setAttribute('aria-hidden','true');
document.querySelector('.title-art').innerHTML=`<svg viewBox="0 0 680 720" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="premium-light" x1="180" y1="100" x2="480" y2="620" gradientUnits="userSpaceOnUse"><stop stop-color="#eee8dc"/><stop offset=".35" stop-color="#8c969f"/><stop offset="1" stop-color="#1a2431"/></linearGradient><linearGradient id="premium-beam"><stop stop-color="#c5ad7b" stop-opacity="0"/><stop offset=".5" stop-color="#c5ad7b" stop-opacity=".22"/><stop offset="1" stop-color="#c5ad7b" stop-opacity="0"/></linearGradient><radialGradient id="premium-halo"><stop stop-color="#727060" stop-opacity=".22"/><stop offset="1" stop-color="#151a24" stop-opacity="0"/></radialGradient></defs><ellipse cx="360" cy="330" rx="310" ry="320" fill="url(#premium-halo)"/><path d="M115 610L510 95 618 95 224 610Z" fill="url(#premium-beam)"/><path d="M167 614L552 108M202 614L587 108" stroke="#aa9160" stroke-opacity=".35"/><circle cx="371" cy="352" r="222" stroke="#a4adb8" stroke-opacity=".12"/><path d="M35 610H648M87 628H601M133 643H557" stroke="#b9aa8e" stroke-opacity=".35"/><g fill="#101722" stroke="url(#premium-light)" stroke-width="2"><path d="M300 302L337 285 387 309 407 385 376 427 315 420 285 376Z"/><path d="M314 419L338 424 316 506 275 589 241 586 283 493Z"/><path d="M357 425L380 413 401 490 449 575 419 591 367 515Z"/><path d="M300 312L282 312 241 355 184 330 169 346 237 386 263 379 303 348Z"/><path d="M384 312L404 310 442 354 484 307 501 320 451 387 428 387 392 350Z"/><path d="M318 244C314 212 331 192 354 192 384 191 399 212 392 245L378 277 340 280Z"/></g><path d="M319 241L390 236 382 265 343 273Z" fill="#080e17"/><path d="M339 243L354 242M371 240L384 239" stroke="#d8c39c" stroke-width="3"/><path d="M312 310L345 337 383 314M345 337L340 402" stroke="#d4c6ab" stroke-opacity=".5"/><path d="M243 586L224 601 280 601 275 589M419 591L421 605 470 603 449 575" fill="#1a2430" stroke="#8b949e"/><g stroke="#6b7684" stroke-opacity=".4" stroke-linecap="round" stroke-width="17"><path d="M167 383L143 460 104 530M143 460L185 527M167 383L192 352 224 374M167 383L130 369 112 340"/></g><circle cx="174" cy="345" r="20" fill="#1d2835" stroke="#67727e"/><path d="M86 642H652" stroke="#b7a27d"/><text x="84" y="675" fill="#8e99a6" font-family="system-ui,sans-serif" font-size="10" letter-spacing="6">MASTER YOUR OWN STYLE</text></svg>`;
