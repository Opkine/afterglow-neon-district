const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const stored=new Map();
const noop=()=>{};
const gradient=()=>({addColorStop:noop});
const ctx=()=>new Proxy({createLinearGradient:gradient,createRadialGradient:gradient}, {get:(obj,prop)=>obj[prop]??noop,set:(obj,prop,value)=>{obj[prop]=value;return true;}});
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
  document:{hidden:false,documentElement:{style:{setProperty:noop}},getElementById:el,createElement:()=>new Element(),querySelectorAll:(s)=>s==='[data-view]'?nav:[],addEventListener:noop},
  localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},
  navigator:{vibrate:noop},location:{search:'?test=1'},URLSearchParams,
  window:{},requestAnimationFrame:noop,clearTimeout:noop,setTimeout:noop,
  performance:{now:()=>2000},Date,Math,Number,Array,Object,String,JSON,Uint8Array,console
};
vm.createContext(browser);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/visuals.js'),'utf8'),browser,{timeout:1500});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/skills.js'),'utf8'),browser,{timeout:1500});
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
  if(lv%7===0)assert.equal(state.game.energyGoal,85,`Reactor level ${lv}`);
  else if(lv%5===0)assert.equal(state.game.targets.length,3,`Three-color mission ${lv}`);
  else if(lv%9===0)assert.equal(state.game.missionType,'express',`Express mission ${lv}`);
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

// A first victory creates claimable missions; daily gifts and awards are single-use.
assert.equal(testApi.claimMission('win'),true);
assert.equal(testApi.claimMission('win'),false);
assert.equal(testApi.claimDailyGift(),true);
assert.equal(testApi.claimDailyGift(),false);
let afterGift=testApi.state();
assert(afterGift.data.inventory.bomb>=2);
assert(afterGift.data.coins>state.data.coins);

// Timed help is a valid adjacent same-color path. Boosters never spend a move.
el('next').onclick();
state=testApi.state();assert.equal(state.game.level,2);
const suggested=testApi.giveHint(false);assert(suggested.length>=3);
assert.equal(new Set(suggested).size,suggested.length);
assert(suggested.every(i=>state.game.tiles[i]===state.game.tiles[suggested[0]]));
const stock=state.data.inventory.bomb;
assert.equal(testApi.usePower('bomb',14),true);
const boosted=testApi.state();
assert.equal(boosted.game.moves,state.game.moves,'Using a booster must not spend a turn');
assert.equal(boosted.data.inventory.bomb,stock-1);
assert(boosted.game.score>state.game.score);
assert.equal(testApi.hasMove(boosted.game.tiles),true);

// Cash flow, milestone rewards and the shop are real persisted state changes.
testApi.start('level',2);
for(let lv=2;lv<=5;lv++){
  if(lv>2)testApi.start('level',lv);
  testApi.win();
  if(lv<5)el('next').onclick();
}
state=testApi.state();assert.equal(state.data.finished,5);
assert.equal(testApi.claimMilestone(5),true);
assert.equal(testApi.claimMilestone(5),false);
assert.equal(testApi.purchase('color'),true);
assert.equal(testApi.state().data.inventory.color,1);
el('viewcity').onclick();
testApi.show('shop');assert.equal(testApi.state().view,'shop');
testApi.start('level',6);state=testApi.state();
assert.equal(testApi.usePower('color',4),true);
assert.equal(testApi.state().data.inventory.color,0);

console.log('PASS: 80 campaign levels, 560 turns, saving, timed hints, booster inventory/use, quests, daily gift, milestones and shop.');
