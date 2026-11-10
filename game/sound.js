/* Procedural original ambience and responsive synthesised SFX — zero asset downloads. */
(()=>{
  'use strict';
  class AstralAudio{
    constructor(){this.ctx=null;this.music=true;this.effects=true;this.ambient=null;this.ambientTimer=null;this.tick=0;}
    unlock(){
      if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
        this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.65;this.master.connect(this.ctx.destination);
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      this.syncMusic();
    }
    tone(freq,seconds=.18,type='sine',volume=.1,glide=1,delay=0){
      if(!this.ctx)return;const at=this.ctx.currentTime+delay;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);
      if(glide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*glide),at+seconds);
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+Math.min(.023,seconds*.3));g.gain.exponentialRampToValueAtTime(.0001,at+seconds);
      o.connect(g);g.connect(this.master);o.start(at);o.stop(at+seconds+.04);
    }
    event(kind,detail={}){
      if(!this.effects||!this.ctx)return;
      const color=detail.type||0;
      if(kind==='capture'){
        const f=[523,587,659][color];this.tone(f,.16,'sine',.085,1.36);this.tone(f*2,.27,'triangle',.045,1.12,.06);
        if(detail.combo>2)this.tone(f*1.5,.31,'sine',.055,1.1,.12);
      }else if(kind==='pulse'){
        this.tone(145,.65,'sawtooth',.055,4);this.tone(410,.79,'sine',.12,1.7,.05);this.tone(820,.85,'sine',.04,.6,.08);
      }else if(kind==='miss')this.tone(190,.24,'triangle',.055,.56);
      else if(kind==='shield')this.tone(320,.3,'triangle',.09,1.5);
      else if(kind==='win'){
        [523,659,784,1046].forEach((f,i)=>this.tone(f,.52,'sine',.075,1.05,i*.12));
      }else if(kind==='lose'){
        [312,260,196].forEach((f,i)=>this.tone(f,.25,'triangle',.07,.94,i*.19));
      }else if(kind==='click')this.tone(710,.08,'sine',.038,1.22);
    }
    syncMusic(){
      if(!this.ctx||!this.music||this.ambientTimer){if(!this.music&&this.ambientTimer){clearInterval(this.ambientTimer);this.ambientTimer=null;}return;}
      this.ambientTimer=setInterval(()=>this.musicBar(),3100);this.musicBar();
    }
    musicBar(){
      if(!this.ctx||!this.music||this.ctx.state!=='running')return;
      const chords=[[130.81,164.81,196],[146.83,174.61,220],[110,164.81,196],[130.81,174.61,220]];
      const ch=chords[this.tick++%chords.length];ch.forEach((n,i)=>{
        this.tone(n,3.7,'sine',.014,1,0);
        this.tone(n*2,2.1,'sine',.007,1,.35+i*.22);
      });
      this.tone(ch[0]*4,.7,'triangle',.016,1.004,.8);
      this.tone(ch[1]*4,.6,'sine',.014,1.002,1.65);
    }
    setPreferences({music,sound}){this.music=music!==false;this.effects=sound!==false;this.syncMusic();}
    suspend(){if(this.ctx)this.ctx.suspend().catch(()=>{});}
    resume(){if(this.ctx)this.ctx.resume().catch(()=>{});this.syncMusic();}
  }
  window.AstralAudio=AstralAudio;
})();
