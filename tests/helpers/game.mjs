import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Execute the complete runtime in manifest order. Only browser/p5 boundaries are
// faked: fighter creation, simulation, collision and transport remain real.
export function game(){
 const elements=new Map(),listeners=new Map();
 function element(id=''){
  const handlers=new Map();
  const el={id,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
   children:[],dataset:{},open:false,textContent:'',value:'',
   addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn)},
   dispatch(type,event={}){for(const fn of handlers.get(type)||[])fn({type,target:el,preventDefault(){},...event})},
   setAttribute(){},querySelector(){return element()},querySelectorAll(){return []},
   getBoundingClientRect(){return {width:800,height:450,left:0,top:0}},
   setPointerCapture(){},hasPointerCapture(){return false},releasePointerCapture(){},
   appendChild(){},remove(){},closest(){return element()},
  };
  return el;
 }
 const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id)};
 const doc={getElementById:get,querySelector:get,querySelectorAll:()=>[],activeElement:null,hidden:false,
  body:element(),documentElement:element(),head:element(),createElement:element,
  addEventListener(type,fn){if(!listeners.has('document:'+type))listeners.set('document:'+type,[]);listeners.get('document:'+type).push(fn)}};
 const ctx={console,URLSearchParams,performance,Date,Math,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
  requestAnimationFrame:()=>0,document:doc,location:{search:'',href:'http://localhost/'},navigator:{getGamepads:()=>[]},
  localStorage:{getItem:()=>null,setItem(){}},innerWidth:1280,innerHeight:720,
  Audio:class {constructor(){this.paused=true} addEventListener(){} pause(){} load(){} play(){return Promise.resolve()}},
  ResizeObserver:class {observe(){}},
  matchMedia:()=>({matches:true,addEventListener(){}}),
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)},
  constrain:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,
  random:(a=1,b)=>Array.isArray(a)?a[Math.floor(Math.random()*a.length)]:b===undefined?Math.random()*a:a+Math.random()*(b-a),
  sin:Math.sin,cos:Math.cos,TWO_PI:Math.PI*2,PI:Math.PI,HALF_PI:Math.PI/2,
  pixelDensity:()=>1,UP_ARROW:38,DOWN_ARROW:40,LEFT_ARROW:37,RIGHT_ARROW:39,
  alert(){},history:{replaceState(){}},
 };
 ctx.window=ctx;vm.createContext(ctx);
 const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
 const manifest=JSON.parse(read('src/manifest.json'));
 vm.runInContext(manifest.scripts.map(read).join('\n'),ctx);
 return {ctx,run:code=>vm.runInContext(code,ctx),get,dispatch(type,e={}){for(const fn of listeners.get(type)||[])fn({type,preventDefault(){},...e})}};
}
