const test=require('node:test');const a=require('node:assert/strict');
const {CaseFile,LOCATIONS,OBJECTS,HOURS,CRITICAL,REQUIRED}=require('../game/story.js');
test('12 tangible objects, 3 distinct illustrated investigation scenes',()=>{
 a.equal(LOCATIONS.length,3);a.equal(OBJECTS.length,12);a.equal(HOURS.length,4);
 a.equal(new Set(OBJECTS.map(x=>x.id)).size,12);
 for(const l of LOCATIONS)a.ok(OBJECTS.filter(o=>o.scene===l.id).length>=4);
 for(const o of OBJECTS){a.equal(o.frames.length,4);a.ok(o.name.length>5);a.ok(o.evidence.length>30);a.ok(o.x>0&&o.x<100&&o.y>0&&o.y<100);}
});
test('each real memory must be found at the correct time then recorded',()=>{
 const f=new CaseFile();a.equal(f.study('clock',0).canCollect,false);a.equal(f.collect('clock',0),false);
 a.equal(f.study('clock',2).canCollect,true);a.equal(f.collect('clock',2),true);a.equal(f.collect('clock',2),false);
 a.equal(f.count,1);a.equal(f.completion,8);a.equal(f.study('clock',2).already,true);
});
test('players can move freely among all three independent scenes',()=>{
 const f=new CaseFile();for(const l of LOCATIONS){a.equal(f.move(l.id),true);a.equal(f.scene,l.id);}
 a.equal(f.move('nowhere'),false);a.equal(f.scene,'garden');
});
test('witness dialogue provides questions and trust without farming',()=>{
 const f=new CaseFile();const ans=f.ask('nina',1);a.ok(ans.includes('Elle souriait'));a.equal(f.trust,1);f.ask('nina',1);a.equal(f.trust,1);
 f.ask('louis',0);a.equal(f.trust,2);a.equal(f.ask('ghost',5),null);
});
test('deduction is blocked without connected evidence',()=>{
 const f=new CaseFile();for(const id of OBJECTS.slice(0,7).map(x=>x.id)){const o=OBJECTS.find(x=>x.id===id);f.collect(id,o.truth);}
 a.equal(f.canDeduce,false);a.equal(f.deduce({who:'mara',why:'garden',proof:'letter'},'protect').success,false);
});
test('correctly reconstructing facts resolves the case with two meaningful endings',()=>{
 for(const path of ['protect','reveal']){
  const f=new CaseFile();for(const o of OBJECTS)f.collect(o.id,o.truth);
  a.equal(f.canDeduce,true);a.equal(f.count,12);a.equal(f.completion,100);
  a.equal(f.deduce({who:'nina',why:'garden',proof:'letter'},path).success,false);
  a.equal(f.deduce({who:'mara',why:'garden',proof:'letter'},path).success,true);
  a.equal(f.ending,path);
 }
});
test('saved case restores clues, scene, dialogue, and ending',()=>{
 const f=new CaseFile();f.move('garden');f.collect('notebook',1);f.ask('louis',0);
 const replay=new CaseFile(JSON.parse(JSON.stringify(f.snapshot())));
 a.deepEqual(replay.snapshot(),f.snapshot());a.equal(replay.scene,'garden');
});
test('invalid memory requests do not crash or unlock anything',()=>{
 const f=new CaseFile();a.equal(f.study('not-there',0),null);a.equal(f.study('clock',99),null);
 a.equal(f.collect('clock',-1),false);a.equal(f.count,0);
});
test('critical evidence belongs to the case and references can be resolved',()=>{
 for(const id of CRITICAL)a.ok(OBJECTS.find(o=>o.id===id));
});
test('step-by-step help offers three levels of contextual hints without unlocking a clue',()=>{
 const f=new CaseFile();a.equal(f.hint('clock').tier,1);a.equal(f.hint('clock').tier,2);
 const h=f.hint('clock');a.equal(h.tier,3);a.ok(h.text.includes('Mara'));a.equal(f.hint('clock').tier,3);
 a.equal(f.count,0);a.equal(f.hint('unknown'),null);
 const restored=new CaseFile(f.snapshot());a.equal(restored.hints.clock,3);
 restored.collect('clock',2);a.equal(restored.hint('clock'),null);
});
test('notebook guides player to next essential evidence and avoids impossible deductions',()=>{
 const f=new CaseFile();const first=f.nextLead;
 a.equal(first.id,CRITICAL[0]);a.ok(LOCATIONS.some(x=>x.id===first.place.id));
 for(const id of CRITICAL){const o=OBJECTS.find(x=>x.id===id);f.collect(id,o.truth);}
 a.equal(f.essentialCount,CRITICAL.length);a.equal(f.canDeduce,false);a.equal(f.remaining,REQUIRED-CRITICAL.length);
 const extra=OBJECTS.find(x=>!CRITICAL.includes(x.id));f.collect(extra.id,extra.truth);
 a.equal(f.canDeduce,true);a.equal(f.count,REQUIRED);
});
test('verdict hints target an incorrect inference and persist progression',()=>{
 const f=new CaseFile();a.equal(f.verdictHint({who:'nina',why:'garden',proof:'letter'}).field,'who');
 a.equal(f.verdictHint({who:'mara',why:'tower',proof:'letter'}).tier,2);
 a.equal(f.verdictHint({who:'mara',why:'garden',proof:'book'}).tier,3);
 a.equal(new CaseFile(f.snapshot()).deductionHints,3);
});
