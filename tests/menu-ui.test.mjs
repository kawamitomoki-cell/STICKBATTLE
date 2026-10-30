import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
test('fighter search supports Japanese, English and normalized full-width text',()=>{const g=game();for(const q of ['金木','kaneki','ＫＡＮＥＫＩ',' KEN ']){g.ctx.query=q;assert.equal(g.run('menuFighterMatches("kaneki",query,"all")'),true);}assert.equal(g.run('menuFighterMatches("eren","kaneki","all")'),false);});
test('fighter type filters keep all registered fighters correctly partitioned',()=>{const g=game();assert.equal(g.run('Object.keys(CHARS).filter(id=>menuFighterMatches(id,"","all")).length'),19);assert.equal(g.run('Object.keys(CHARS).filter(id=>menuFighterMatches(id,"","special")).length'),8);assert.equal(g.run('Object.keys(CHARS).filter(id=>menuFighterMatches(id,"","normal")).length'),11);assert.equal(g.run('menuFighterMatches("kaneki","","normal")'),false);assert.equal(g.run('menuFighterMatches("missing","","all")'),false);});
