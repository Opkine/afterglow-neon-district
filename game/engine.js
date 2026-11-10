/* ASTRA TIDE — original deterministic gravity-field arcade simulation.
   © 2026 LayAdam corp. No network, ads, telemetry, or purchases. */
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AstraEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const W=720,H=1120;
  const COLORS=['#63f5ff','#ff92cf','#ffe18a'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function hash(input){
    let h=2166136261;
    for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
    return h|0;
  }
  function profile(stage,mode='campaign'){
    const daily=mode==='daily',rank=daily?Math.max(8,stage):clamp(stage,1,24);
    const colors=rank===1?1:rank<=3?2:3;
    return {
      mode,stage:daily?0:rank,rank,colors,
      target:daily?14:3+Math.ceil(rank*.45),
      time:daily?90:Math.max(64,94-Math.floor(rank*.68)),
      lives:rank<4?5:4,
      frequency:Math.max(.62,1.58-rank*.034),
      anomaly:rank>=5,currents:rank>=3,vortex:rank>=9,meteor:rank>=14
    };
  }
  function gateways(colors){
    if(colors===1)return[{type:0,x:360,y:936,r:59}];
    if(colors===2)return[{type:0,x:236,y:936,r:56},{type:1,x:484,y:936,r:56}];
    return [0,1,2].map(type=>({type,x:145+215*type,y:936,r:52}));
  }
  class GravityGame{
    constructor(options={}){
      const stage=Number.isInteger(options.stage)?options.stage:1,mode=options.mode==='daily'?'daily':'campaign';
      this.config=profile(stage,mode);
      this.seed=options.seed??hash(mode==='daily'?'ASTRA-DAILY-'+(options.date||'2026-11-10'):'ASTRA-CHAPTER-'+stage);
      this.rng=this.seed|0;
      this.stats={status:'running',elapsed:0,score:0,captured:0,missed:0,lives:this.config.lives,combo:0,bestCombo:0,charge:0,usedPulse:0,created:0};
      this.motes=[];this.spawnTime=.42;this.gates=gateways(this.config.colors);
      this.events=[];this.nextId=1;
      this.perks={radius:clamp(Number(options.radius)||0,0,3),shield:clamp(Number(options.shield)||0,0,3)};
    }
    random(){
      let x=this.rng||0x763915;
      x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x|0;
      return(x>>>0)/4294967296;
    }
    emit(kind,payload={}){this.events.push({kind,...payload});}
    get hazards(){
      const t=this.stats.elapsed,h=[];
      if(this.config.anomaly)h.push({x:165+48*Math.sin(t*.75),y:495,r:28,type:'void'});
      if(this.config.vortex)h.push({x:543+54*Math.cos(t*.61),y:620,r:34,type:'void'});
      if(this.config.meteor)h.push({x:360+175*Math.cos(t*.53),y:350,r:29,type:'meteor'});
      return h;
    }
    spawn(){
      const type=Math.floor(this.random()*this.config.colors);
      const x=95+this.random()*530,speed=100+this.config.rank*2.5+this.random()*32;
      this.motes.push({id:this.nextId++,type,x,y:65,vx:(this.random()-.5)*75,vy:speed,age:0,trail:[]});
      this.stats.created++;this.emit('spawn',{type,x,y:65});
    }
    pulse(){
      if(this.stats.status!=='running'||this.stats.charge<100)return false;
      this.stats.charge=0;this.stats.usedPulse++;
      for(const mote of this.motes){
        const gate=this.gates[mote.type];if(!gate)continue;
        mote.vx+=(gate.x-mote.x)*.53;mote.vy=Math.max(mote.vy,180);
      }
      this.emit('pulse',{x:360,y:570});return true;
    }
    miss(mote,reason){
      this.stats.missed++;this.stats.combo=0;
      if(this.perks.shield>0){this.perks.shield--;this.emit('shield',{x:mote.x,y:mote.y});}
      else{this.stats.lives--;this.emit('miss',{x:mote.x,y:mote.y,reason,lives:this.stats.lives});}
    }
    step(input={},delta=1/60){
      if(this.stats.status!=='running')return[];
      const dt=clamp(Number(delta)||0,0,.05);
      this.events=[];this.stats.elapsed+=dt;
      this.spawnTime-=dt;
      if(this.spawnTime<=0){
        this.spawnTime+=this.config.frequency*(.78+this.random()*.46);
        this.spawn();
      }
      const pointer=!!input.active&&Number.isFinite(input.x)&&Number.isFinite(input.y);
      const fx=clamp(Number(input.x)||0,0,W),fy=clamp(Number(input.y)||0,0,H),reach=275+this.perks.radius*35;
      const hazardZones=this.hazards,survivors=[];
      for(const mote of this.motes){
        mote.age+=dt;let ax=0,ay=0;
        if(pointer){
          const dx=fx-mote.x,dy=fy-mote.y,dist=Math.hypot(dx,dy)||1;
          if(dist<reach){const t=1-dist/reach,strength=350+1650*t*t;ax+=dx/dist*strength;ay+=dy/dist*strength;}
        }
        if(this.config.currents)ax+=Math.sin(this.stats.elapsed*.91+mote.y*.012)*55;
        if(this.config.vortex)ax+=Math.cos(this.stats.elapsed*.31+mote.y*.014)*35;
        for(const h of hazardZones){
          const dx=h.x-mote.x,dy=h.y-mote.y,d=Math.hypot(dx,dy)||1;
          if(d<h.r+10){this.miss(mote,h.type);mote.dead=true;break;}
          if(d<145&&h.type==='void'){ax+=dx/d*(18000/(d+15));ay+=dy/d*(18000/(d+15));}
        }
        if(mote.dead)continue;
        mote.vx=clamp((mote.vx+ax*dt)*.995,-380,380);
        mote.vy=clamp(mote.vy+ay*dt,-310,410);
        mote.x+=mote.vx*dt;mote.y+=mote.vy*dt;
        if(mote.x<19){mote.x=19;mote.vx=Math.abs(mote.vx)*.62;}
        if(mote.x>W-19){mote.x=W-19;mote.vx=-Math.abs(mote.vx)*.62;}
        if(mote.y<25){mote.y=25;mote.vy=Math.abs(mote.vy)*.58;}
        mote.trail.push([mote.x,mote.y]);if(mote.trail.length>11)mote.trail.shift();
        let consumed=false;
        for(const gate of this.gates){
          if(Math.hypot(mote.x-gate.x,mote.y-gate.y)<gate.r){
            consumed=true;
            if(gate.type===mote.type){
              this.stats.captured++;this.stats.combo=clamp(this.stats.combo+1,1,30);
              this.stats.bestCombo=Math.max(this.stats.bestCombo,this.stats.combo);
              const points=80+Math.min(this.stats.combo,10)*18;
              this.stats.score+=points;this.stats.charge=clamp(this.stats.charge+13,0,100);
              this.emit('capture',{x:mote.x,y:mote.y,type:mote.type,combo:this.stats.combo,points});
            }else this.miss(mote,'wrong');
            break;
          }
        }
        if(consumed)continue;
        if(mote.y>1050){this.miss(mote,'escaped');continue;}
        survivors.push(mote);
      }
      this.motes=survivors;
      if(this.stats.captured>=this.config.target){this.stats.status='win';this.emit('win',{score:this.stats.score});}
      else if(this.stats.lives<=0||this.stats.elapsed>=this.config.time){this.stats.status='lose';this.emit('lose',{score:this.stats.score});}
      return this.events;
    }
    get stars(){
      if(this.stats.status!=='win')return 0;
      const acc=this.stats.captured/(this.stats.captured+this.stats.missed||1);
      const remaining=this.config.time-this.stats.elapsed;
      return acc>=.83&&remaining>=this.config.time*.25?3:acc>=.55?2:1;
    }
    snapshot(){
      return {version:1,mode:this.config.mode,stage:this.config.rank,seed:this.seed,rng:this.rng,
        stats:{...this.stats},perks:{...this.perks},spawnTime:this.spawnTime,nextId:this.nextId,
        motes:this.motes.map(m=>({...m,trail:m.trail.slice()}))};
    }
    static fromSnapshot(saved){
      if(!saved||saved.version!==1||!Array.isArray(saved.motes)||saved.motes.length>100||!saved.stats||!['running','win','lose'].includes(saved.stats.status))return null;
      const g=new GravityGame({mode:saved.mode,stage:saved.stage,seed:saved.seed,radius:saved.perks?.radius,shield:saved.perks?.shield});
      if(!saved.motes.every(m=>[m.x,m.y,m.vx,m.vy,m.type].every(Number.isFinite)&&Number.isInteger(m.id)&&m.type>=0&&m.type<g.config.colors))return null;
      if(!Number.isFinite(saved.stats.elapsed)||saved.stats.elapsed<0||saved.stats.elapsed>1000)return null;
      g.rng=saved.rng|0;g.stats={...g.stats,...saved.stats};
      g.spawnTime=clamp(Number(saved.spawnTime)||.8,-.1,3);g.nextId=Number.isInteger(saved.nextId)?saved.nextId:1;
      g.motes=saved.motes.map(m=>({...m,trail:Array.isArray(m.trail)?m.trail.slice(-11):[]}));
      return g;
    }
  }
  return{GravityGame,profile,gateways,COLORS,W,H,hash};
});
