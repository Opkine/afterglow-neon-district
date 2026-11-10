const assert=require('node:assert/strict');
const {KEYS,BOOSTS,cells,hint}=require('../game/skills.js');
const board=Array.from({length:42},(_,i)=>i%5);
assert.deepEqual(KEYS,['bomb','row','column','color']);
assert.equal(Object.keys(BOOSTS).length,4);
assert.deepEqual(cells('row',14,board),[12,13,14,15,16,17]);
assert.deepEqual(cells('column',14,board),[2,8,14,20,26,32,38]);
assert.deepEqual(cells('bomb',14,board),[7,8,9,13,14,15,19,20,21]);
assert.equal(cells('bomb',0,board).length,4,'Corner radius must respect bounds');
assert.deepEqual(cells('color',0,board),board.map((v,i)=>v===board[0]?i:-1).filter(i=>i>=0));
assert.deepEqual(cells('laser',0,board),[],'Reject unknown powers');
assert.deepEqual(hint(board,[0,1],[0,0,0,0,0],10),[],'Impossible board must have no misleading hint');
const playable=Array.from({length:42},(_,i)=>i%5);
playable[0]=playable[1]=playable[7]=2;
const path=hint(playable,[2,1],[0,0,0,0,0],10);
assert(path.length>=3&&path.length<=8);
assert(path.every(i=>playable[i]===playable[path[0]]));
for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i];assert.equal(Math.abs(a%6-b%6)+Math.abs(Math.floor(a/6)-Math.floor(b/6)),1);
}
console.log('PASS: 4 booster geometries, edges, color purge, invalid power, deterministic actionable hints.');
