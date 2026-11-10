/* Original offline procedural score: felt-piano tones, soft surf and tactile clues. */
(()=>{'use strict';
  class MemorySound{
    constructor(){this.ctx=null;this.off=false;this.timer=null;this.count=0;this.amb=null;this.volume=0.27;}
    ensure(){if(this.off)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!this.ctx){this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.6;this.master.connect(this.ctx.destination);this.startSea();}
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});this.startScore();
    }
    tone(freq,duration,vol=.04,type='sine',delay=0,slide=1){if(this.off||!this.ctx||this.ctx.state!=='running')return;
      const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
      if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(24,freq*slide),t+duration);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.014);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);
    }
    startSea(){if(!this.ctx||this.amb)return;const c=this.ctx,n=2*c.sampleRate,buffer=c.createBuffer(1,n,c.sampleRate),a=buffer.getChannelData(0);
      let last=0;for(let i=0;i<n;i++){last=(last+Math.random()*.09-.045)*.998;a[i]=last*.5;}
      const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=410;g.gain.value=.035;
      src.connect(filter);filter.connect(g);g.connect(this.master);src.start();this.amb={src,g};
    }
    startScore(){if(this.timer)return;this.bar();this.timer=setInterval(()=>this.bar(),4500);}
    bar(){if(this.off||!this.ctx||this.ctx.state!=='running')return;const notes=[[196,246.94,293.66],[174.61,220,261.63],[164.81,220,261.63],[146.83,196,246.94]][this.count++%4];
      notes.forEach((n,i)=>{this.tone(n,3.8,.014,'sine',i*.38);this.tone(n*2,1.4,.009,'triangle',i*.38+.06);});
      this.tone(notes[0]*2,1,.012,'sine',2.8);
    }
    effect(k){if(this.off||!this.ctx)return;
      if(k==='tick')this.tone(570,.075,.035,'triangle',0,.92);
      else if(k==='open'){this.tone(205,.3,.035,'triangle',0,1.25);this.tone(410,.4,.025,'sine',.08,.94);}
      else if(k==='clue'){[440,554,659,880].forEach((n,i)=>this.tone(n,.7,.042,'sine',i*.1,1.03));}
      else if(k==='fail'){this.tone(245,.35,.06,'triangle',0,.6);}
      else if(k==='solve'){[261.63,329.6,392,523.25,659.25].forEach((n,i)=>this.tone(n,1.1,.05,'sine',i*.17,1.01));}
      else if(k==='voice'){this.tone(330,.11,.025,'triangle',0,1.2);}
    }
    mute(flag){this.off=!!flag;if(!this.ctx)return;if(flag)this.ctx.suspend().catch(()=>{});else this.ensure();}
  }
  window.PalimpsesteAudio=MemorySound;
})();
