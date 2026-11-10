/* Three original interchangeable scores, imported personal audio, 12 tactile
   acoustic clues. Extends the offline base synthesizer without cloud services. */
(()=>{
 'use strict';
 const Base=window.PalimpsesteAudio,KEY='palimpseste-audio-v3',DB='palimpseste-imported-music',MAX=25*1024*1024;
 const TRACKS={
  nocturne:{title:'Nocturne à l’hôtel',mood:'Piano feutré · vagues lointaines',period:4700,
   chords:[[174.61,220,261.63],[164.81,207.65,246.94],[146.83,196,246.94],[155.56,196,233.08]],
   melody:[[349.23,329.63,261.63],[392,329.63,246.94],[293.66,261.63,220],[311.13,293.66,233.08]]},
  jazz:{title:'Le hall après minuit',mood:'Jazz discret · contrebasse et balais',period:3500,
   chords:[[174.61,220,261.63],[220,261.63,329.63],[196,246.94,293.66],[164.81,220,293.66]],
   melody:[[349.23,440,392],[392,440,523.25],[293.66,349.23,392],[329.63,293.66,261.63]]},
  verriere:{title:'Sous la verrière',mood:'Boîte à musique · jardin endormi',period:5500,
   chords:[[261.63,329.63,392],[246.94,311.13,369.99],[220,293.66,349.23],[233.08,293.66,349.23]],
   melody:[[784,659.25,523.25],[739.99,622.25,493.88],[698.46,587.33,440],[783.99,698.46,587.33]]}
 };
 const limit=(v)=>Math.max(0,Math.min(1,Number(v)||0));
 class Director extends Base{
  constructor(){
   super();this.track='nocturne';this.musicEnabled=true;this.effectsEnabled=true;this.musicVolume=.65;this.effectsVolume=.8;
   this.imported=null;this.importedUrl=null;this.importedName='';this.channel='effects';this.barIndex=0;
   this.builtin=null;this.builtinTrack=null;this.forceProcedural=false;
   try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');if(TRACKS[x.track]||x.track==='personal')this.track=x.track;
    if(typeof x.musicEnabled==='boolean')this.musicEnabled=x.musicEnabled;
    if(typeof x.effectsEnabled==='boolean')this.effectsEnabled=x.effectsEnabled;
    if(typeof x.musicVolume==='number')this.musicVolume=limit(x.musicVolume);
    if(typeof x.effectsVolume==='number')this.effectsVolume=limit(x.effectsVolume);
   }catch(_){}
  }
  static get tracks(){return TRACKS;}
  savePrefs(){try{localStorage.setItem(KEY,JSON.stringify({track:this.track,musicEnabled:this.musicEnabled,effectsEnabled:this.effectsEnabled,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume}));}catch(_){}}
  tone(freq,duration,vol=.04,type='sine',delay=0,slide=1){
   const music=this.channel==='music';
   if((music&&!this.musicEnabled)||(!music&&!this.effectsEnabled))return;
   return super.tone(freq,duration,vol*(music?this.musicVolume*1.25:this.effectsVolume),type,delay,slide);
  }
  noise(duration=.16,volume=.025,delay=0,center=1300){
   if(!this.ctx||(!this.musicEnabled&&this.channel==='music')||(!this.effectsEnabled&&this.channel!=='music'))return;
   const c=this.ctx,b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),a=b.getChannelData(0);
   for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1);
   const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),at=c.currentTime+delay;
   src.buffer=b;f.type='bandpass';f.frequency.value=center;f.Q.value=.7;
   g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
   src.connect(f);f.connect(g);g.connect(this.master);src.start(at);src.stop(at+duration+.01);
  }
  ensure(){
   if(this.off)this.off=false;
   super.ensure();this.syncVolume();
   if(this.track==='personal'){this.stopScore();this.playPersonal();}
   else if(!this.musicEnabled)this.stopScore();
   else if(this.playBuiltin())this.stopScore();
  }
  syncVolume(){
   if(this.amb)this.amb.g.gain.value=this.musicEnabled&&this.track!=='personal'&&!this.builtin?(this.track==='verriere'?.029:.016):0;
   if(this.imported)this.imported.volume=this.musicEnabled?this.musicVolume*.78:0;
   if(this.builtin)this.builtin.volume=this.musicEnabled?this.musicVolume*.85:0;
  }
  stopScore(){if(this.timer){clearInterval(this.timer);this.timer=null;}}
  startScore(){
   if(this.timer||!this.ctx||!this.musicEnabled||this.track==='personal'||(typeof Audio==='function'&&!this.forceProcedural))return;
   this.bar();this.timer=setInterval(()=>this.bar(),TRACKS[this.track].period);
  }
  bar(){
   if(!this.musicEnabled||this.track==='personal'||!this.ctx)return;
   const score=TRACKS[this.track]||TRACKS.nocturne,i=this.barIndex++%4,chord=score.chords[i],melody=score.melody[i],len=score.period/1000;
   this.channel='music';
   if(this.track==='jazz'){
    for(let beat=0;beat<4;beat++){this.tone(chord[beat%3]/2,.43,.038,'triangle',beat*.79,.92);this.noise(.11,.007,beat*.79+.37,1800);}
    chord.forEach((f,j)=>this.tone(f*2,.65,.014,'triangle',.13+j*.09));
    melody.forEach((f,j)=>{this.tone(f,.49,.009,'sawtooth',.33+j*1.01,.98);this.tone(f,.39,.012,'sine',.33+j*1.01);});
   }else if(this.track==='verriere'){
    chord.forEach((f,j)=>this.tone(f,len*.88,.010,'sine',j*.15));
    melody.forEach((f,j)=>{this.tone(f,1.43,.024,'sine',.21+j*1.3);this.tone(f*2,.56,.006,'triangle',.24+j*1.3);});
    this.noise(.5,.004,2.6,2250);
   }else{
    chord.forEach((f,j)=>{this.tone(f,len*.86,.011,'sine',j*.1);this.tone(f*2,1.4,.006,'triangle',j*.14+.03);});
    melody.forEach((f,j)=>{this.tone(f,.86,.021,'sine',.6+j*.94);this.tone(f*2,.31,.003,'triangle',.64+j*.94);});
   }
   this.channel='effects';
  }
  choose(id){
   if(id!=='personal'&&!TRACKS[id])return false;
   if(id==='personal'&&!this.imported)return false;
   this.stopScore();this.imported?.pause();this.builtin?.pause();this.track=id;this.barIndex=0;this.count=0;this.forceProcedural=false;
   if(id==='personal')this.playPersonal();else if(this.musicEnabled&&!this.playBuiltin())this.startScore();
   this.syncVolume();this.savePrefs();return true;
  }
  setMusic(on){this.musicEnabled=!!on;if(!on){this.stopScore();this.imported?.pause();this.builtin?.pause();}else this.ensure();this.syncVolume();this.savePrefs();}
  setEffects(on){this.effectsEnabled=!!on;this.savePrefs();}
  setMusicVolume(v){this.musicVolume=limit(v);this.syncVolume();this.savePrefs();}
  setEffectsVolume(v){this.effectsVolume=limit(v);this.savePrefs();}
  mute(flag){this.setMusic(!flag);this.setEffects(!flag);}
  playBuiltin(){
   if(this.track==='personal'||!this.musicEnabled||typeof Audio!=='function')return false;
   if(this.builtinTrack!==this.track){
    this.builtin?.pause();this.builtin=new Audio('audio/'+this.track+'.ogg');
    this.builtinTrack=this.track;this.builtin.loop=true;this.builtin.preload='auto';
    this.builtin.addEventListener?.('error',()=>{this.forceProcedural=true;this.startScore();});
   }
   this.syncVolume();
   const result=this.builtin.play();result?.catch?.(()=>{this.forceProcedural=true;this.startScore();});
   return true;
  }
  playPersonal(){if(this.track==='personal'&&this.musicEnabled&&this.imported){const result=this.imported.play();result?.catch?.(()=>{});}}
  attachPersonal(blob,name){
   if(this.imported){this.imported.pause();this.imported.src='';}
   if(this.importedUrl)URL.revokeObjectURL(this.importedUrl);
   this.importedUrl=URL.createObjectURL(blob);this.imported=new Audio(this.importedUrl);this.imported.loop=true;
   this.imported.preload='auto';this.importedName=name;this.syncVolume();
  }
  db(){return new Promise((resolve,reject)=>{
   if(!window.indexedDB){reject(Error('Stockage musical indisponible'));return;}
   const request=window.indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('tracks'))request.result.createObjectStore('tracks');};
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Accès impossible'));
  });}
  async savePersonal(file){const database=await this.db();return new Promise((resolve,reject)=>{
   const tx=database.transaction('tracks','readwrite');tx.objectStore('tracks').put({blob:file,name:file.name},'chosen');
   tx.oncomplete=()=>{database.close();resolve();};tx.onerror=()=>{database.close();reject(tx.error||Error('Stockage impossible'));};
  });}
  async restorePersonal(){let database;try{database=await this.db();const record=await new Promise((resolve,reject)=>{
    const tx=database.transaction('tracks','readonly'),req=tx.objectStore('tracks').get('chosen');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });if(record?.blob){this.attachPersonal(record.blob,record.name);this.syncVolume();this.playPersonal();return record.name;}
   return null;}catch(_){return null;}finally{database?.close();}
  }
  async importPersonal(file){
   if(!file||!((file.type||'').startsWith('audio/')||/\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i.test(file.name||'')))throw Error('Choisis une musique MP3, M4A, WAV ou OGG.');
   if(file.size>MAX)throw Error('Le fichier doit faire 25 Mo au maximum.');
   this.attachPersonal(file,file.name);this.choose('personal');
   let saved=true;try{await this.savePersonal(file);}catch(_){saved=false;}
   return{name:file.name,saved};
  }
  objectEffect(id){
   if(!this.effectsEnabled)return;
   switch(id){
    case 'clock':this.tone(690,.055,.042,'square');this.tone(540,.05,.039,'square',.21);break;
    case 'suitcase':this.tone(158,.21,.049,'triangle',0,.69);this.noise(.12,.025,.04,700);break;
    case 'postcard':case 'letter':this.noise(.32,.025,0,2300);this.noise(.15,.018,.21,3200);break;
    case 'balcony':this.noise(.57,.016,0,440);break;
    case 'register':this.tone(137,.18,.048,'triangle');this.noise(.11,.037,.05,600);break;
    case 'bell':this.tone(880,.9,.038,'sine');this.tone(1320,.58,.015,'sine',.04);break;
    case 'umbrella':for(let i=0;i<4;i++)this.tone(780+i*103,.09,.019,'sine',i*.1,.76);break;
    case 'telegram':for(const [t,d] of [[0,.09],[.13,.09],[.29,.24]])this.tone(710,d,.030,'sine',t);break;
    case 'photo':this.noise(.06,.065,0,1350);this.tone(175,.12,.037,'square',.06);break;
    case 'key':for(let i=0;i<3;i++)this.tone(1080+i*153,.42,.016,'sine',i*.09);break;
    case 'notebook':this.noise(.41,.021,0,1150);this.tone(280,.1,.013,'triangle',.16);break;
   }
  }
  effect(key){
   if(!this.effectsEnabled)return;
   this.channel='effects';
   if(key.startsWith('object:')){this.objectEffect(key.slice(7));return;}
   if(key.startsWith('collect:')){super.effect('clue');this.objectEffect(key.slice(8));return;}
   if(key==='page'){this.noise(.24,.02,0,1900);return;}
   if(key==='location'){this.noise(.25,.019,0,720);this.tone(255,.39,.025,'sine',.04,1.08);return;}
   if(key==='notify'){this.tone(659,.22,.021,'sine');this.tone(880,.4,.016,'sine',.14);return;}
   super.effect(key);
  }
  pause(){this.imported?.pause();this.builtin?.pause();this.ctx?.suspend().catch(()=>{});}
  resume(){this.ctx?.resume().catch(()=>{});if(this.track==='personal')this.playPersonal();else if(this.musicEnabled)this.playBuiltin();}
 }
 window.PalimpsesteAudio=Director;
})();
