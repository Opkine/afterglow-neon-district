const t=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path');
const base=p.join(__dirname,'../game');
t('original offline game resources are present and nonempty',()=>{
 for(const f of ['index.html','style.css','story.js','sound.js','main.js','assets/room.webp','assets/lobby.webp','assets/garden.webp'])a.ok(fs.statSync(p.join(base,f)).size>500,f);
 const html=fs.readFileSync(p.join(base,'index.html'),'utf8');
 for(const f of ['story.js','sound.js','main.js','style.css'])a.ok(html.includes(f));
 a.ok(!/src="https?:\/\//.test(html));
});
