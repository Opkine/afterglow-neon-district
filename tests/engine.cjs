const assert=require('node:assert/strict');
const test=require('node:test');
const {GravityGame,profile,gateways,W,H}=require('../game/engine.js');
test('24 campaign chapters with escalating mechanics',()=>{
  assert.equal(profile(1).colors,1);assert.equal(profile(4).colors,3);
  assert.equal(profile(2).vortex,false);assert.equal(profile(9).vortex,true);assert.equal(profile(14).meteor,true);
  assert.equal(profile(24).target>profile(1).target,true);
  assert.equal(gateways(3).length,3);assert.equal(W,720);assert.equal(H,1120);
});
test('same seed yields the same particles and time',()=>{
  const a=new GravityGame({stage:11,seed:919}),b=new GravityGame({stage:11,seed:919});
  for(let i=0;i<300;i++){a.step({active:true,x:340,y:560},1/60);b.step({active:true,x:340,y:560},1/60);}
  assert.deepEqual(a.snapshot(),b.snapshot());
});
test('a correctly coloured light enters its portal and scores',()=>{
  const g=new GravityGame({stage:2});const gate=g.gates[0];g.spawnTime=50;
  g.motes=[{id:1,type:gate.type,x:gate.x,y:gate.y-54,vx:0,vy:160,age:0,trail:[]}];
  const ev=g.step({},1/60);assert.ok(ev.find(e=>e.kind==='capture'));
  assert.equal(g.stats.captured,1);assert.equal(g.stats.score,98);assert.equal(g.stats.charge,13);
});
test('wrong portal breaks a combo and loses a heart',()=>{
  const g=new GravityGame({stage:2});const gate=g.gates[0];g.spawnTime=50;g.stats.combo=3;
  g.motes=[{id:1,type:1,x:gate.x,y:gate.y,vx:0,vy:110,age:0,trail:[]}];
  const ev=g.step({},1/60);assert.equal(g.stats.lives,g.config.lives-1);assert.equal(g.stats.combo,0);assert.ok(ev.some(e=>e.kind==='miss'));
});
test('shield perk absorbs a collision without consuming hearts',()=>{
  const g=new GravityGame({stage:1,shield:2});g.spawnTime=50;g.motes=[{id:1,type:0,x:330,y:1060,vx:0,vy:110,age:0,trail:[]}];
  const ev=g.step({},1/60);assert.equal(g.stats.lives,g.config.lives);assert.equal(g.perks.shield,1);assert.ok(ev.some(e=>e.kind==='shield'));
});
test('charged pulse aims motes to their assigned portals',()=>{
  const g=new GravityGame({stage:4});g.stats.charge=100;g.motes=[{id:1,type:2,x:100,y:460,vx:0,vy:110,age:0,trail:[]}];
  assert.equal(g.pulse(),true);assert.ok(g.motes[0].vx>0);assert.equal(g.stats.charge,0);assert.equal(g.pulse(),false);
});
test('victory grants stars and campaign score',()=>{
  const g=new GravityGame({stage:1});const gate=g.gates[0];g.spawnTime=50;
  for(let i=0;i<g.config.target;i++){g.motes=[{id:i+1,type:0,x:gate.x,y:gate.y,vx:0,vy:110,age:0,trail:[]}];g.step({},1/60);}
  assert.equal(g.stats.status,'win');assert.equal(g.stars,3);assert.ok(g.stats.score>0);
});
test('snapshot restoration keeps the journey intact',()=>{
  const g=new GravityGame({stage:17,radius:2,shield:1});
  for(let i=0;i<60;i++)g.step({active:true,x:300,y:400},1/60);
  const restored=GravityGame.fromSnapshot(JSON.parse(JSON.stringify(g.snapshot())));
  assert.ok(restored);assert.deepEqual(restored.snapshot(),g.snapshot());
  assert.equal(GravityGame.fromSnapshot({version:1,stats:{status:'running'},motes:[{x:NaN}]}),null);
});
test('all chapter physics modes step without crashing or nonfinite positions',()=>{
  for(let stage=1;stage<=24;stage++){
    const g=new GravityGame({stage,seed:stage});
    for(let i=0;i<550;i++){g.step({active:i%120<90,x:340+150*Math.sin(i*.07),y:650+260*Math.cos(i*.1)},1/60);
      for(const m of g.motes)assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y));
    }
  }
});
