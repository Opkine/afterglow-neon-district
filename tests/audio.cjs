const test=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),p=require('node:path');
const base=p.join(__dirname,'../game');
function audioContext(){
 const saved=new Map(),clock={value:0,seq:0};
 class PersonalAudio{
  constructor(src){this.src=src;this.loop=false;this.volume=0;this.started=false;}
  play(){this.started=true;return Promise.resolve();}
  pause(){this.started=false;}
 }
 const win={};
 const globals={
  window:win,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
  setInterval:()=>++clock.seq,clearInterval:()=>{},console,
  Audio:PersonalAudio,URL:{createObjectURL:()=> 'blob:test-music',revokeObjectURL:()=>{}}
 };
 for(const script of ['sound.js','audioPlus.js'])vm.runInNewContext(fs.readFileSync(p.join(base,script),'utf8'),globals);
 return{Sound:win.PalimpsesteAudio,saved,clock};
}
test('three contrasting original offline soundtracks can be switched and saved',()=>{
 const{Sound,saved}=audioContext(),music=new Sound();
 a.deepEqual(Object.keys(Sound.tracks),['nocturne','jazz','verriere']);
 a.notDeepEqual(Sound.tracks.nocturne.melody,Sound.tracks.jazz.melody);
 a.equal(music.choose('jazz'),true);a.equal(music.track,'jazz');
 a.equal(music.choose('verriere'),true);a.equal(music.track,'verriere');
 a.equal(music.choose('invalid'),false);
 music.setMusicVolume(.36);music.setEffectsVolume(.83);music.setMusic(false);music.setEffects(true);
 const persisted=JSON.parse(saved.get('palimpseste-audio-v3'));a.equal(persisted.track,'verriere');a.equal(persisted.musicVolume,.36);
 a.equal(persisted.musicEnabled,false);a.equal(persisted.effectsEnabled,true);
 const restored=new Sound();a.equal(restored.track,'verriere');a.equal(restored.musicEnabled,false);
});
test('personal music is validated, plays locally and does not require network',async()=>{
 const{Sound}=audioContext(),music=new Sound();
 await a.rejects(()=>music.importPersonal({type:'application/pdf',name:'story.pdf',size:20}),/musique/i);
 await a.rejects(()=>music.importPersonal({type:'audio/mpeg',name:'huge.mp3',size:26*1024*1024}),/25 Mo/i);
 const result=await music.importPersonal({type:'audio/mpeg',name:'Ma valse.mp3',size:1024});
 a.equal(result.name,'Ma valse.mp3');a.equal(result.saved,false); // No IndexedDB in this strict test.
 a.equal(music.track,'personal');a.equal(music.imported.started,true);
 music.setMusic(false);a.equal(music.imported.started,false);
 a.equal(music.choose('nocturne'),true);
});
test('each of twelve clue objects has a dedicated acoustic gesture',()=>{
 const source=fs.readFileSync(p.join(base,'audioPlus.js'),'utf8');
 const{OBJECTS}=require('../game/story.js');
 for(const o of OBJECTS)a.ok(source.includes("case '"+o.id+"'"),'Missing sound for '+o.id);
});
