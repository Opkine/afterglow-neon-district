/* Animated illustrated locations. Canvas2D, offline, capped at 30fps. */
(()=>{
 'use strict';
 const TAU=Math.PI*2;
 const random=(a,b)=>a+Math.random()*(b-a);
 const limit=(n,a,b)=>Math.min(b,Math.max(a,n));
 class Atmosphere{
  constructor(world){
   this.world=world;this.scene='room';this.canvas=document.createElement('canvas');
   this.canvas.className='scene-atmosphere';this.canvas.setAttribute('aria-hidden','true');
   this.world.append(this.canvas);this.ctx=this.canvas.getContext?.('2d');
   this.reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
   this.particles=[];this.last=0;this.t=0;this.fit();
   this.resize=()=>this.fit();window.addEventListener?.('resize',this.resize,{passive:true});
   this.setScene(this.scene);
   if(this.ctx&&!this.reduced&&window.requestAnimationFrame)window.requestAnimationFrame(t=>this.frame(t));
  }
  fit(){
   const r=this.world.getBoundingClientRect?.()||{width:390,height:844};
   this.w=Math.max(1,Math.round(r.width||390));this.h=Math.max(1,Math.round(r.height||844));
   const dpr=limit(window.devicePixelRatio||1,1,2);
   this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);
   this.ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  setScene(scene){
   if(!['room','lobby','garden'].includes(scene))return;
   if(this.scene===scene&&this.particles.length)return;
   if(this.scene!==scene)this.t=0;
   this.scene=scene;const count=scene==='garden'?55:scene==='lobby'?41:70;
   this.particles=Array.from({length:count},(_,i)=>this.seed(i));
  }
  seed(i){
   return{x:random(0,this.w),y:random(-this.h*.25,this.h),r:random(1.2,5.7),
    speed:random(14,52),phase:random(0,TAU),sway:random(7,23),opacity:random(.26,.85),i};
  }
  frame(timestamp){
   if(!this.ctx)return;
   if(timestamp-this.last<32){window.requestAnimationFrame(t=>this.frame(t));return;}
   const dt=limit((timestamp-(this.last||timestamp))/1000,0,.07);
   this.last=timestamp;this.t+=dt;const c=this.ctx,w=this.w,h=this.h,t=this.t;
   c.clearRect(0,0,w,h);
   if(!this.world.classList.contains('active-view')){window.requestAnimationFrame(x=>this.frame(x));return;}
   if(this.scene==='room')this.room(c,w,h,t,dt);
   if(this.scene==='lobby')this.lobby(c,w,h,t,dt);
   if(this.scene==='garden')this.garden(c,w,h,t,dt);
   window.requestAnimationFrame(x=>this.frame(x));
  }
  glow(c,x,y,r,color,opacity=1){
   const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',String(opacity)));
   g.addColorStop(.38,color.replace('ALPHA',String(opacity*.36)));
   g.addColorStop(1,color.replace('ALPHA','0'));
   c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  room(c,w,h,t,dt){
   // The lamp throws a noticeable oscillating amber pool over the bedroom.
   const pulse=.78+.22*Math.sin(t*2.3)+.08*Math.sin(t*7.9);
   c.globalCompositeOperation='screen';
   this.glow(c,w*.79,h*.29,w*.72,'rgba(255,166,64,ALPHA)',.29*pulse);
   this.glow(c,w*.28,h*.63,w*.50,'rgba(242,197,130,ALPHA)',.13*pulse);
   c.globalCompositeOperation='source-over';
   // Raindrops trail down the right-hand window; broad, distinctly visible.
   c.lineCap='round';
   for(const p of this.particles){
    p.y+=p.speed*dt*(1.5+p.r*.24);
    if(p.y>h+25){p.y=random(-160,-12);p.x=random(w*.40,w*.96);}
    const px=p.x+Math.sin(t*.34+p.phase)*p.sway*.16;
    const length=11+p.r*4.4;
    c.beginPath();c.moveTo(px,p.y);c.lineTo(px-2,p.y+length);
    c.strokeStyle='rgba(205,229,234,'+(p.opacity*.40).toFixed(3)+')';c.lineWidth=.7+p.r*.3;c.stroke();
   }
   // Opaque shadows move over the floor, hinting at a restless candle.
   c.save();c.translate(w*.22,h*.92);c.rotate(Math.sin(t*.55)*.09);c.fillStyle='rgba(35,21,12,.105)';
   c.beginPath();c.ellipse(0,0,w*.36,h*.13,0,0,TAU);c.fill();c.restore();
  }
  lobby(c,w,h,t,dt){
   c.globalCompositeOperation='screen';
   const sway=Math.sin(t*.75)*w*.06,shimmer=.72+.28*Math.sin(t*3.8);
   this.glow(c,w*.23+sway,h*.22,w*.55,'rgba(255,188,83,ALPHA)',.31*shimmer);
   this.glow(c,w*.79-sway*.5,h*.42,w*.48,'rgba(255,227,138,ALPHA)',.19);
   // The chandelier slowly throws a visible moving light shaft.
   const grad=c.createLinearGradient(w*.2+sway,h*.14,w*.52+sway,h*.82);
   grad.addColorStop(0,'rgba(255,214,124,.25)');grad.addColorStop(1,'rgba(255,198,102,0)');
   c.fillStyle=grad;c.beginPath();c.moveTo(w*.19+sway,h*.15);c.lineTo(w*.27+sway,h*.15);
   c.lineTo(w*.77+sway,h*.9);c.lineTo(-w*.17+sway,h*.9);c.closePath();c.fill();
   c.globalCompositeOperation='source-over';
   // Floating illuminated dust and moving reflections in the parquet.
   for(const p of this.particles){
    p.y-=p.speed*dt*.36;if(p.y<0){p.y=h+10;p.x=random(w*.06,w*.96);}
    const x=p.x+Math.sin(t*.8+p.phase)*p.sway;
    c.beginPath();c.arc(x,p.y,p.r*.58,0,TAU);
    c.fillStyle='rgba(255,231,160,'+(p.opacity*.7).toFixed(3)+')';c.fill();
   }
   for(let i=0;i<5;i++){
    const x=(i+1)*w/6,curl=Math.sin(t*1.3+i)*8;
    c.fillStyle='rgba(255,208,119,.13)';c.beginPath();
    c.ellipse(x+curl,h*(.81+i*.013),w*.08,2.6,Math.sin(t*.4+i)*.1,0,TAU);c.fill();
   }
  }
  garden(c,w,h,t,dt){
   c.globalCompositeOperation='screen';
   this.glow(c,w*.50,h*.31,w*.72,'rgba(158,238,156,ALPHA)',.19+.045*Math.sin(t*.8));
   this.glow(c,w*.72,h*.70,w*.53,'rgba(255,204,132,ALPHA)',.23);
   c.globalCompositeOperation='source-over';
   // A swarm of animated fireflies illuminates the foreground.
   for(const p of this.particles){
    p.x+=Math.cos(t*.65+p.phase)*dt*(10+p.sway*.2);
    p.y+=Math.sin(t*.86+p.phase)*dt*(7+p.sway*.2)-dt*3;
    if(p.y<0)p.y=h+10;if(p.x>w+10)p.x=0;if(p.x<0)p.x=w;
    const a=p.opacity*(.45+.55*Math.abs(Math.sin(t*1.7+p.phase))),radius=p.r*1.35;
    const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*6);
    g.addColorStop(0,'rgba(255,248,160,'+Math.min(1,a).toFixed(3)+')');
    g.addColorStop(.2,'rgba(237,250,115,'+(a*.47).toFixed(3)+')');
    g.addColorStop(1,'rgba(201,248,103,0)');
    c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,radius*6,0,TAU);c.fill();
   }
   // Blooming petals pass in front of the camera at irregular intervals.
   for(let i=0;i<12;i++){
    const x=((t*17+(i*79))%(w+120))-60,y=((t*(9+i%3*5)+i*139)%(h+120))-60;
    c.save();c.translate(x+Math.sin(t+i)*20,y);c.rotate(t*.25+i);c.fillStyle='rgba(247,183,157,.58)';
    c.beginPath();c.ellipse(0,0,3.6+i%3,7+i%3,0,0,TAU);c.fill();c.restore();
   }
  }
 }
 window.PalimpsesteAtmosphere={mount:el=>new Atmosphere(el)};
})();
