import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('game entrypoint includes its dependencies',()=>{
 assert.match(html,/<html lang="ja">/);
 assert.ok(html.includes('p5.min.js'));
 assert.ok(html.includes('firebase-database-compat.js'));
});
test('the single game script parses',()=>{
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'game script');
 execFileSync(process.execPath,['--check','-'],{input:match[1]});
});
test('audio paths are external and asset files exist',()=>{
 for(const name of ['goku_ki_charge','goku_transform','goku_teleport','goku_revert','jotaro_time_stop']){
 assert.ok(html.includes('./assets/audio/'+name+'.mp3'),name);
 assert.ok(existsSync(new URL('../assets/audio/'+name+'.mp3',import.meta.url)),name);
 }
 assert.ok(!html.includes('data:audio/mpeg;base64'));
});
