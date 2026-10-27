
// ========================================================
// Vertical tournament bracket / bottom-to-top championship path
// Data source is unchanged (t.history, t.matches, t.winners, t.champion).
// ========================================================
function tourBracketLinks(lowerCount){
 const upperCount=Math.max(1,lowerCount/2), paths=[];
 for(let j=0;j<upperCount;j++){
  const parent=(j+.5)*1000/upperCount;
  const left=(2*j+.5)*1000/lowerCount;
  const right=(2*j+1.5)*1000/lowerCount;
  paths.push('M'+left+' 58 V29 H'+parent+' V0');
  paths.push('M'+right+' 58 V29 H'+parent);
 }
 return '<div class="bracket-links" aria-hidden="true"><svg viewBox="0 0 1000 58" preserveAspectRatio="none" focusable="false"><path d="'+paths.join(' ')+'"/></svg></div>';
}
function tourBoardHTML(t){
 if(!t)return '<div class="bracket-empty">組み合わせを準備中…</div>';
 const total=(t.entrants||[]).length;
 const rounds=total>=8?3:total>=4?2:1;
 const results=Array.isArray(t.history)?t.history.slice():[];
 const matches=Array.isArray(t.matches)?t.matches:[];
 const winners=Array.isArray(t.winners)?t.winners:[];
 const details=Array.isArray(t.details)?t.details:[];
 if(!t.champion)results.push({round:t.round,pairs:matches.map((ids,i)=>({ids,winner:i<t.index?winners[i]:null,detail:details[i],active:i===t.index}))});
 const title=total>=8?'8 PLAYER TOURNAMENT':total>=4?'4 PLAYER TOURNAMENT':'CHAMPIONSHIP';
 const champion=t.champion?'<div class="bracket-champion-fighter">'+tourFighterHTML(t,t.champion,t.champion)+'</div>':'<div class="bracket-champion-pending">優勝者は誰だ？</div>';
 const safeMap=esc(MAPS[t.map]?.name||'ステージ未定');
 const stocks=Number(t.stocks)||Number(settings.stocks)||DEFAULT_STOCK;
 const journal=results.flatMap(r=>(r.pairs||[]).filter(m=>m.winner).map((m,i)=>({round:r.round,i,m})));
 const matchHistory=journal.length?'<details class="bracket-history"><summary>試合結果・履歴 <span>'+journal.length+' 試合</span></summary><div class="bracket-history-list">'+journal.map(({round,i,m})=>'<div class="bracket-history-row"><span>'+round+'回戦</span><b>'+esc(tourName(t,m.winner))+' 勝利</b><small>'+esc(tourName(t,m.ids?.find(id=>id!==m.winner)))+' に勝利'+(m.detail?.method==='cpu-sim'?' · CPU自動判定':'')+'</small></div>').join('')+'</div></details>':'';
 let tree='<div class="bracket-champion '+(t.champion?'is-complete':'')+'"><span class="bracket-crown-mark" aria-hidden="true">♛</span><span class="bracket-crown-label">CHAMPION / 優勝</span>'+champion+'</div><div class="bracket-crown-link" aria-hidden="true"><span>↑</span></div>';
 for(let round=rounds;round>=1;round--){
  const count=Math.max(1,Math.pow(2,rounds-round));
  const data=results.find(r=>r.round===round);
  const pairs=(data?.pairs||Array.from({length:count},()=>({ids:[null,null],winner:null,active:false})));
  const stageName=round===rounds?'決勝':round===rounds-1?'準決勝':'1回戦';
  const stageEnglish=round===rounds?'GRAND FINAL':round===rounds-1?'SEMI FINAL':'ROUND 1';
  const cards=Array.from({length:count},(_,i)=>{
   const m=pairs[i]||{ids:[null,null]};
   const ids=Array.isArray(m.ids)?m.ids:[null,null];
   const won=!!m.winner, active=!!m.active;
   const text=won?'WINNER DECIDED':active?'NEXT MATCH':'AWAITING MATCH';
   const foot=won?(m.detail?.method==='cpu-sim'?'CPU自動判定':'勝者が次へ進出'):active?'● 次の対戦':'対戦待ち';
   return '<div class="bracket-match '+(won?'is-done ':'')+(active?'is-current':'')+'"><div class="bracket-match-top"><span>MATCH '+(i+1)+'</span><span>'+text+'</span></div><div class="bracket-competitors">'+ids.map(id=>id?tourFighterHTML(t,id,m.winner):'<div class="tour-fighter bracket-tbd"><span>勝ち上がり待ち</span></div>').join('<div class="bracket-vs">VS</div>')+'</div><div class="bracket-match-foot">'+foot+'</div></div>';
  }).join('');
  tree+='<section class="bracket-tier" aria-label="'+stageName+'"><div class="bracket-tier-label"><span>'+stageEnglish+'</span><b>'+stageName+'</b><small>'+count+'試合</small></div><div class="bracket-tier-grid" style="--match-count:'+count+'">'+cards+'</div></section>';
  if(round>1)tree+=tourBracketLinks(count*2);
 }
 return '<div class="bracket-panel"><div class="bracket-panel-header"><div><span class="bracket-panel-kicker">'+title+'</span><h3>ROAD TO THE TOP</h3><p>下から上へ。勝者が次のラウンドに進む。</p></div><div class="bracket-panel-meta"><span>'+safeMap+'</span><span>残機 '+stocks+'</span><span>'+(t.champion?'優勝決定':'第'+(t.round||1)+'ラウンド')+'</span></div></div><div class="bracket-scroller" role="region" tabindex="0" aria-label="トーナメント表。左右にスクロールできます"><div class="bracket-vertical">'+tree+'</div></div><p class="bracket-pan-tip">↑ 優勝に向かって勝ち上がる <span>／ 横に動かして全体を確認</span></p>'+matchHistory+'</div>';
}
