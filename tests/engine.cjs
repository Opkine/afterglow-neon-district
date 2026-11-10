const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const stored=new Map();
const noop=()=>{};
const gradient=()=>({addColorStop:noop});
const ctx=()=>new Proxy({createLinearGradient:gradient}, {get:(obj,prop)=>obj[prop]??noop,set:(obj,prop,value)=>{obj[prop]=value;return true;}});
class Element {
  constructor(id=''){this.id=id;this.dataset={};this.value='';this.style={};this.classList={add:noop,remove:noop,toggle:noop,contains:()=>false};this.innerHTML='';this.textContent='';this.events={};}
  getContext(){return ctx();}
  addEventListener(name,fn){this.events[name]=fn;}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:700};}
  setPointerCapture(){}
  querySelectorAll(){return [];}
  setAttribute(){}
}
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
const nav=['play','city','daily','settings'].map(v=>{const e=new Element();e.dataset.view=v;return e;});
let testApi;
const browser={
  document:{hidden:false,documentElement:{style:{setProperty:noop}},getElementById:el,querySelectorAll:(s)=>s==='[data-view]'?nav:[],addEventListener:noop},
  localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},
  navigator:{vibrate:noop},location:{search:'?test=1'},URLSearchParams,
  window:{},requestAnimationFrame:noop,clearTimeout:noop,setTimeout:noop,
  performance:{now:()=>2000},Date,Math,Number,Array,Object,String,JSON,Uint8Array,console
};
vm.createContext(browser);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/main.js'),'utf8'),browser,{timeout:1500});
testApi=browser.window.__afterglowTest;
assert(testApi,'A test interface must exist');
let state=testApi.state();
assert.equal(state.game.level,1);
assert.equal(state.game.tiles.length,42);
assert(testApi.hasMove(state.game.tiles),'The starting board must have 3 connected crystals');
assert.equal(state.modalOpen,true,'Tutorial should appear on the first install');
el('begin').onclick();
assert.equal(testApi.state().modalOpen,false);

function pathFor(tiles){
  const adj=i=>[i%6>0?i-1:-1,i%6<5?i+1:-1,i>=6?i-6:-1,i<36?i+6:-1].filter(n=>n>=0);
  function dfs(path){if(path.length>=3)return path;for(const n of adj(path.at(-1)))if(tiles[n]===tiles[path[0]]&&!path.includes(n)){const found=dfs([...path,n]);if(found)return found;}return null;}
  for(let i=0;i<tiles.length;i++){const path=dfs([i]);if(path)return path;}
  return null;
}

// A valid gesture changes only one move, scores points, and persists the board.
let p=pathFor(state.game.tiles);assert(p);
testApi.playPath(p);state=testApi.state();
assert.equal(state.game.moves,25);
assert(state.game.score>0);
assert(testApi.hasMove(state.game.tiles));
assert(stored.has('afterglow.neondistrict.save.v1'));
testApi.render();

// Campaign generation and rendering must work throughout the entire 80-level arc.
for(let lv=1;lv<=80;lv++){
  testApi.start('level',lv);state=testApi.state();
  assert.equal(state.game.level,lv);
  assert(testApi.hasMove(state.game.tiles),`Level ${lv} has no legal path`);
  testApi.render();
  // Simulate several turns, including gravity and tile refills.
  for(let turn=0;turn<Math.min(7,state.game.moves);turn++){
    p=pathFor(state.game.tiles);assert(p,`No path at level ${lv}, turn ${turn}`);
    testApi.playPath(p);state=testApi.state();
    assert(testApi.hasMove(state.game.tiles));
  }
}

// Daily seed is stable and independently playable.
testApi.start('daily');const daily=testApi.state().game;
testApi.start('daily');assert.deepEqual(testApi.state().game.tiles,daily.tiles);
assert.equal(daily.moves,24);
testApi.render();

// Award/progression path.
testApi.start('level',1);testApi.win();state=testApi.state();
assert.equal(state.data.level,2);
assert(state.data.coins>0);
assert.equal(state.data.finished,1);

console.log('PASS: 80 campaign levels, initial paths, 560 moves, gravity/refills, rendering, daily seed, saving, win/progression.');
