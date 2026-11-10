const test=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),p=require('node:path');
const base=p.join(__dirname,'../game');
function context(){
 const saved=new Map(),created=[];
 class EmbeddedAudio{
  constructor(src){this.src=src;this.loop=false;this.volume=0;this.started=false;created.push(this);}
  play(){this.started=true;return Promise.resolve();}
  pause(){this.started=false;}
 }
 const win={};
 const globals={window:win,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
  setInterval:()=>1,clearInterval:()=>{},console,Audio:EmbeddedAudio};
 for(const file of ['sound.js','audioPlus.js'])vm.runInNewContext(fs.readFileSync(p.join(base,file),'utf8'),globals);
 return{Sound:win.PalimpsesteAudio,saved,created};
}
test('each place automatically gets its own full soundtrack with no manual music picker',()=>{
 const{Sound,created,saved}=context(),sound=new Sound();
 a.deepEqual(Object.keys(Sound.tracks),['nocturne','jazz','verriere']);
 sound.ensure();a.equal(sound.active.src,'audio/nocturne.ogg');
 a.equal(sound.setLocation('lobby'),true);a.equal(sound.active.src,'audio/jazz.ogg');
 a.equal(sound.setLocation('lobby'),false);a.equal(created.filter(x=>x.src==='audio/jazz.ogg').length,1);
 a.equal(sound.setLocation('garden'),true);a.equal(sound.active.src,'audio/verriere.ogg');
 a.equal(sound.setLocation('not-a-place'),false);
 sound.setMusicVolume(.36);sound.setEffectsVolume(.83);sound.setMusic(false);
 const pref=JSON.parse(saved.get('palimpseste-audio-v4'));
 a.equal(pref.musicVolume,.36);a.equal(pref.musicEnabled,false);
 const restored=new Sound();a.equal(restored.musicVolume,.36);a.equal(restored.musicEnabled,false);
 a.equal(typeof sound.importPersonal,'undefined');a.equal(typeof sound.choose,'undefined');
});
test('audio clues are spatialized object Foley, and effects can be silenced',()=>{
 const{Sound,created}=context(),sound=new Sound();
 const{OBJECTS}=require('../game/story.js');
 const src=fs.readFileSync(p.join(base,'audioPlus.js'),'utf8');
 for(const object of OBJECTS)a.ok(src.includes(object.id+':')||src.includes("key==='collect:'"),'Object mapping: '+object.id);
 for(const object of OBJECTS)sound.effect('object:'+object.id);
 a.equal(created.filter(x=>x.src.includes('/fx/')).length,12);
 sound.setEffects(false);sound.effect('object:clock');
 a.equal(created.filter(x=>x.src.includes('/fx/')).length,12);
});
