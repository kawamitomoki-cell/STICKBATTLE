// Assemble an unchanged classic-script game from ordered source files.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const manifest=JSON.parse(read('src/manifest.json'));
let html=read('src/index.template.html');
manifest.styles.forEach((file,i)=>{html=html.replace('{{STYLE_'+i+'}}','<style>'+read(file)+'</style>')});
html=html.replace('{{GAME_SCRIPT}}','<script>'+manifest.scripts.map(read).join('')+'</script>');
if(html.includes('{{STYLE_')||html.includes('{{GAME_SCRIPT}}'))throw Error('Unexpanded template placeholder');
if(process.argv.includes('--check')){
 if(read('index.html')!==html){console.error('Generated index.html is outdated. Run npm run build.');process.exitCode=1}
 else console.log('index.html matches all source files');
}else{
 writeFileSync(resolve(root,'index.html'),html);
 console.log('Built index.html');
}
