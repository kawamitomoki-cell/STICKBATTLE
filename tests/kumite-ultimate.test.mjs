import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const modes=read('src/game/06-game-modes.js'),ui=read('src/index.template.html');
test('all kumite opponents use the ultimate AI even after a win',()=>{
 assert.ok(modes.includes('const KUMITE_CPU_LEVEL=3'));
 assert.ok(modes.includes("aiLv=offlineMode==='kumite'?KUMITE_CPU_LEVEL:settings.cpuLv"));
 assert.ok(modes.includes('aiLv=KUMITE_CPU_LEVEL; // CPUは連戦中も最強で固定。'));
 assert.ok(modes.includes("['training','kumite'].includes(offlineMode)?'none':'flex'"));
});
test('leaderboard uses only existing lv3 and never loads other levels',()=>{
 assert.ok(modes.includes("db.ref(KUMITE_RANK_PATH+'/lv'+KUMITE_CPU_LEVEL).orderByChild('wins')"));
 assert.ok(modes.includes("db.ref(KUMITE_RANK_PATH+'/lv'+KUMITE_CPU_LEVEL).push()"));
 assert.ok(modes.includes('lv:KUMITE_CPU_LEVEL'));
 assert.ok(modes.includes('Number(r.lv)===KUMITE_CPU_LEVEL'));
 assert.ok(!modes.includes('renderRankTabs('));
});
test('ranking UI has no difficulty tabs',()=>{
 assert.ok(ui.includes('CPU最強固定'));
 assert.ok(ui.includes('最強CPU限定'));
 assert.ok(!ui.includes('id="rank-levels"'));
});
