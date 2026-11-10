const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'../game');
test('self-contained offline game includes all entrypoint assets',()=>{
  for(const name of ['index.html','style.css','main.js','engine.js','sound.js','painter.js','assets/cosmos.webp'])assert.ok(fs.statSync(path.join(base,name)).size>400,name+' must be nonempty');
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
  for(const ref of ['main.js','engine.js','sound.js','painter.js','style.css'])assert.ok(html.includes(ref));
  assert.ok(!/https?:\/\//.test(html),'offline HTML should need no remote resources');
  const s=fs.readFileSync(path.join(base,'style.css'),'utf8');assert.ok(s.includes('cosmos.webp'));assert.ok(s.includes('safe-area-inset'));
});
