const t=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path');
const base=p.join(__dirname,'../game');
t('original offline game resources are present and nonempty',()=>{
 for(const f of ['index.html','style.css','assistance.css','immersive.css','story.js','sound.js','audioPlus.js','atmosphere.js','main.js','assets/room.webp','assets/lobby.webp','assets/garden.webp'])a.ok(fs.statSync(p.join(base,f)).size>500,f);
 for(const name of ['nocturne','jazz','verriere']){
  const music=p.join(base,'audio',name+'.ogg');
  a.ok(fs.statSync(music).size>300000,name+' must include a substantial offline music track');
  a.equal(fs.readFileSync(music).subarray(0,4).toString(),'OggS',name+' must be an Ogg audio file');
 }
 const html=fs.readFileSync(p.join(base,'index.html'),'utf8');
 for(const f of ['story.js','sound.js','audioPlus.js','atmosphere.js','main.js','style.css','assistance.css','immersive.css'])a.ok(html.includes(f));
 a.ok(!/src="https?:\/\//.test(html));
 const code=fs.readFileSync(p.join(base,'main.js'),'utf8');
 a.ok(!/\bconfirm\s*\(/.test(code),'Replay confirmation must not call native browser dialogs');
 const android=fs.readFileSync(p.join(__dirname,'../android/app/src/main/java/com/layadam/palimpseste/MainActivity.java'),'utf8');
 for(const symbol of ['onShowFileChooser','ACTION_OPEN_DOCUMENT','onActivityResult'])a.ok(!android.includes(symbol),'Removed Android audio picker: '+symbol);
 a.ok(!/type=['"]file['"]/.test(code),'The UI no longer imports personal audio');
 a.ok(code.includes('sound.setLocation(loc.id)'),'Audio switches with the scene');
 a.ok(code.includes('atmosphere?.setScene(loc.id)'),'Canvas animation switches with the scene');
 for(const fx of ['clock','luggage','paper','wind','book','bell','rain','telegram','camera','keys','door','discovery','scrub','notify','voice','resolution','wrong']){
  const sound=p.join(base,'audio','fx',fx+'.ogg');a.ok(fs.statSync(sound).size>2000,fx+' must be an embedded audio file');
 }
});
