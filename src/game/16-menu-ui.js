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
 if(target&&selected){target.innerHTML=(selected.querySelector('svg')?.outerHTML||'')+'<div><b></b><small>SELECTED ARENA</small></div>';target.querySelector('b').textContent=map.name;target.querySelector('svg')?.setAttribute('aria-hidden','true');}
 const names=offlineMode==='training'?[settings.trainingCpuCid]:Array.from({length:settings.cpuN},(_,i)=>settings.cpuCids?.[i]);
 const opponents=offlineMode==='kumite'?'勝ち抜き戦':offlineMode==='tournament'?'8人トーナメント':names.map(id=>CHARS[id]?.name||'ランダム').join('・');
 setTxt(document.getElementById('menu-match-summary'),CC(settings.cid).name+' vs '+opponents+' ／ '+settings.stocks+'ストック ／ '+(settings.wpn?'武器あり':'武器なし')+(settings.teamMode?' ／ チーム戦':''));
}
const menuStageBase=renderStageGrid;
renderStageGrid=function(id,current,pick){menuStageBase(id,current,pick);document.querySelectorAll('#'+id+' .stc').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('sel'))));if(id==='stage-grid')menuUpdateArena();};
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
document.querySelector('.title-art').innerHTML=`<svg viewBox="0 0 620 620" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="320" cy="310" r="237" fill="#d9ee60"/><circle cx="320" cy="310" r="202" stroke="#172027" stroke-width="1" stroke-dasharray="4 11"/><path d="M73 486L563 417" stroke="#172027" stroke-width="14"/><path d="M92 505L550 440" stroke="#bcc8b0" stroke-width="3"/><path d="M470 98L145 487" stroke="#ed472f" stroke-width="30"/><path d="M513 106L188 495" stroke="#ed472f" stroke-width="3"/><g stroke="#172027" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"><path d="M244 284L211 357 148 375M211 357L262 424M244 284L292 264 345 287M244 284L197 259 183 211"/><path d="M395 283L421 349 482 365M421 349L380 428M395 283L346 270 303 301M395 283L430 242 467 246"/></g><circle cx="253" cy="235" r="28" fill="#172027"/><circle cx="386" cy="231" r="28" fill="#172027"/><path d="M231 224L270 231M367 223L404 232" stroke="#f4f3ee" stroke-width="5"/><path d="M278 303L312 337 353 303M313 287V351M281 320H344" stroke="#f4f3ee" stroke-width="4"/><path d="M118 129H178M148 99V159M505 341H539M522 324V358" stroke="#172027" stroke-width="2"/><text x="100" y="570" fill="#172027" font-family="system-ui,sans-serif" font-weight="800" font-size="14" letter-spacing="4">EVERY FIGHT HAS A STORY.</text></svg>`;
