/* PALIMPSESTE v0.4: three location-bound scores and offline acoustic clues. */
(()=>{
 'use strict';
 const Base=window.PalimpsesteAudio,KEY='palimpseste-audio-v4';
 const TRACKS={
  nocturne:{title:'Chambre 307',mood:'Valse d’ombres · piano et cordes',scene:'room'},
  jazz:{title:'Grand hall',mood:'Jazz noir · contrebasse, cuivre et batterie',scene:'lobby'},
  verriere:{title:'Jardin sous verre',mood:'Valse botanique · harpe, guitare et violoncelle',scene:'garden'}
 };
 const LOCATIONS={room:'nocturne',lobby:'jazz',garden:'verriere'};
 const FX={clock:'clock',suitcase:'luggage',postcard:'paper',letter:'paper',balcony:'wind',register:'book',bell:'bell',umbrella:'rain',telegram:'telegram',photo:'camera',key:'keys',notebook:'book'};
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 class Director extends Base{
  constructor(){
   super();this.track='nocturne';this.scene='room';this.musicEnabled=true;this.effectsEnabled=true;
   this.musicVolume=.76;this.effectsVolume=.86;this.active=null;this.fading=null;this.fadeTimer=null;
   this.contextUnlocked=false;this.currentFx=[];
   try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');
    if(typeof p.musicEnabled==='boolean')this.musicEnabled=p.musicEnabled;
    if(typeof p.effectsEnabled==='boolean')this.effectsEnabled=p.effectsEnabled;
    if(typeof p.musicVolume==='number')this.musicVolume=clamp(p.musicVolume);
    if(typeof p.effectsVolume==='number')this.effectsVolume=clamp(p.effectsVolume);
   }catch(_){}
  }
  static get tracks(){return TRACKS;}
  savePrefs(){try{localStorage.setItem(KEY,JSON.stringify({musicEnabled:this.musicEnabled,effectsEnabled:this.effectsEnabled,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume}));}catch(_){}}
  startScore(){} // Full-length embedded scores replace the old oscillator loop.
  bar(){}
  createMusic(id){
   if(typeof Audio!=='function')return null;
   const a=new Audio('audio/'+id+'.ogg');a.loop=true;a.preload='auto';a.volume=0;
   a.addEventListener?.('error',()=>{if(this.active===a)this.active=null;});
   return a;
  }
  ensure(){
   if(this.off)this.off=false;
   this.contextUnlocked=true;
   // All clips are offline audio assets: no old synthesizer or residual sea loop.
   if(this.musicEnabled)this.playScene();
  }
  setLocation(id){
   if(!LOCATIONS[id])return false;
   const next=LOCATIONS[id],changed=this.track!==next;
   this.scene=id;this.track=next;
   if(changed&&this.musicEnabled&&this.contextUnlocked)this.playScene();
   return changed;
  }
  playScene(){
   if(!this.musicEnabled||!this.contextUnlocked||typeof Audio!=='function')return;
   if(this.active&&this.active.datasetTrack===this.track){this.active.volume=this.musicVolume*.86;this.active.play()?.catch?.(()=>{});return;}
   const old=this.active,next=this.createMusic(this.track);if(!next)return;
   next.datasetTrack=this.track;this.active=next;next.play()?.catch?.(()=>{});
   if(this.fadeTimer){clearInterval(this.fadeTimer);this.fadeTimer=null;}
   if(this.fading&&this.fading!==old){this.fading.pause();this.fading=null;}
   this.fading=old;
   if(!old){next.volume=this.musicVolume*.86;return;}
   const start=Date.now(),oldStart=old.volume,duration=1400;
   this.fadeTimer=setInterval(()=>{
    const p=Math.min(1,(Date.now()-start)/duration);
    next.volume=this.musicEnabled?this.musicVolume*.86*Math.sin(p*Math.PI/2):0;
    old.volume=oldStart*Math.cos(p*Math.PI/2);
    if(p>=1){old.pause();this.fading=null;clearInterval(this.fadeTimer);this.fadeTimer=null;}
   },55);
  }
  setMusic(on){this.musicEnabled=!!on;
   if(!on){this.active?.pause();this.fading?.pause();if(this.fadeTimer)clearInterval(this.fadeTimer);this.fadeTimer=null;}
   else this.ensure();this.savePrefs();
  }
  setEffects(on){this.effectsEnabled=!!on;this.savePrefs();}
  setMusicVolume(v){this.musicVolume=clamp(v);if(this.active)this.active.volume=this.musicEnabled?this.musicVolume*.86:0;this.savePrefs();}
  setEffectsVolume(v){this.effectsVolume=clamp(v);this.savePrefs();}
  playFx(id){
   if(!this.effectsEnabled||typeof Audio!=='function')return false;
   const a=new Audio('audio/fx/'+id+'.ogg');a.volume=Math.max(.03,this.effectsVolume*.92);a.preload='auto';
   this.currentFx.push(a);if(this.currentFx.length>12)this.currentFx.shift()?.pause();
   a.addEventListener?.('ended',()=>{this.currentFx=this.currentFx.filter(e=>e!==a);});
   a.play()?.catch?.(()=>{});return true;
  }
  effect(key){
   if(!this.effectsEnabled)return;
   if(key.startsWith('collect:')){this.playFx('discovery');this.playFx(FX[key.slice(8)]||'paper');return;}
   if(key.startsWith('object:')){this.playFx(FX[key.slice(7)]||'paper');return;}
   if(key==='tick'){this.playFx('scrub');return;}
   if(key==='location'){this.playFx('door');return;}
   if(key==='notify'){this.playFx('notify');return;}
   if(key==='page'||key==='open'){this.playFx('paper');return;}
   if(key==='voice'){this.playFx('voice');return;}
   if(key==='solve'){this.playFx('resolution');return;}
   if(key==='fail'){this.playFx('wrong');return;}
   this.playFx('discovery');
  }
  pause(){this.active?.pause();this.fading?.pause();this.ctx?.suspend?.().catch(()=>{});}
  resume(){this.ctx?.resume?.().catch(()=>{});if(this.musicEnabled)this.playScene();}
 }
 window.PalimpsesteAudio=Director;
})();
