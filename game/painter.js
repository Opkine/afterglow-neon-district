/* Hand-authored 2D painting, particles and celestial-garden visual system. */
(()=>{
  'use strict';
  const {W,H,COLORS}=window.AstraEngine;
  const TAU=Math.PI*2;
  function glow(ctx,x,y,r,color,alpha=.6){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
  function star(ctx,x,y,r,color,arms=4){ctx.beginPath();for(let i=0;i<arms*2;i++){const a=-Math.PI/2+i*Math.PI/arms,rad=i%2?r*.24:r,pX=x+Math.cos(a)*rad,pY=y+Math.sin(a)*rad;if(i===0)ctx.moveTo(pX,pY);else ctx.lineTo(pX,pY);}ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  class Painter{
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.bg=new Image();this.ready=false;this.bg.onload=()=>this.ready=true;this.bg.src='assets/cosmos.webp';this.particles=[];this.clock=0;this.skin=0;this.reduced=false;this.stars=Array.from({length:86},(_,i)=>({x:(i*383.72)%W,y:(i*171.47)%H,r:.5+(i%4)*.53,phase:i*2.3}));}
    event(e){if(this.reduced)return;const count=e.kind==='capture'?24:e.kind==='pulse'?80:e.kind==='miss'?17:0;
      const x=e.x??360,y=e.y??550,c=e.kind==='miss'?'#ff8a99':COLORS[e.type??0];
      for(let i=0;i<count;i++){const a=Math.random()*TAU,s=50+Math.random()*(e.kind==='pulse'?480:200);this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.65,max:.95,r:2+Math.random()*4,c});}
      if(this.particles.length>220)this.particles.splice(0,this.particles.length-220);
    }
    render(game,pointer,dt=1/60){const c=this.ctx;this.clock+=dt;const t=this.clock;
      c.clearRect(0,0,W,H);
      if(this.ready)c.drawImage(this.bg,0,0,W,H);else{let g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#26305d');g.addColorStop(.56,'#110f34');g.addColorStop(1,'#090d22');c.fillStyle=g;c.fillRect(0,0,W,H);}
      c.fillStyle='#030b26a8';c.fillRect(0,0,W,H);
      c.fillStyle='#090b2c55';c.fillRect(0,850,W,270);
      for(const s of this.stars){c.globalAlpha=.2+.4*(Math.sin(t*.9+s.phase)*.5+.5);c.fillStyle='#ecffff';c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.fill();}c.globalAlpha=1;
      const starPalette=this.skin===1?['#fdabe8','#ffc9b7','#ffe7b3']:this.skin===2?['#a6fdc3','#95f4eb','#d2dbfe']:COLORS;
      // The three destinations pulse and reflect light on the cosmic sea.
      for(const gate of game.gates){const phase=t*1.55+gate.type*1.8,r=gate.r;
        glow(c,gate.x,gate.y,130,starPalette[gate.type]||COLORS[gate.type],.2);
        c.save();c.translate(gate.x,gate.y);c.strokeStyle=starPalette[gate.type]||COLORS[gate.type];c.lineWidth=7;c.shadowBlur=24;c.shadowColor=c.strokeStyle;
        c.globalAlpha=.5;c.beginPath();c.arc(0,0,r+17,0,TAU);c.stroke();
        c.globalAlpha=.8;c.lineWidth=4;c.setLineDash([25,11]);c.lineDashOffset=-t*31*(gate.type%2?1:-1);c.beginPath();c.arc(0,0,r+28,0,TAU);c.stroke();c.setLineDash([]);
        c.lineWidth=5;c.globalAlpha=.9;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
        c.globalAlpha=.85;c.lineWidth=1.5;for(let i=0;i<8;i++){const a=i*TAU/8+phase*.16;c.beginPath();c.moveTo(Math.cos(a)*(r-10),Math.sin(a)*(r-10));c.lineTo(Math.cos(a)*(r+11),Math.sin(a)*(r+11));c.stroke();}
        star(c,0,0,22+2*Math.sin(phase),starPalette[gate.type]||COLORS[gate.type],5);c.restore();
      }
      // Dangerous singularities bend trajectories and need to be anticipated.
      for(const h of game.hazards){c.save();c.translate(h.x,h.y);const color=h.type==='void'?'#ee77eb':'#ffaa77';glow(c,0,0,110,color,.3);
        c.rotate(t*(h.type==='void'?-.8:1.7));for(let j=0;j<3;j++){c.strokeStyle=color;c.lineWidth=3-j*.7;c.globalAlpha=.7-j*.14;c.beginPath();c.ellipse(0,0,41+j*12,19+j*7,j*.8,0,TAU);c.stroke();}
        c.globalAlpha=1;c.fillStyle='#08051a';c.shadowColor=color;c.shadowBlur=30;c.beginPath();c.arc(0,0,h.r,0,TAU);c.fill();star(c,0,0,11,'#ffd6fa',6);c.restore();}
      // A gravity hand appears as a responsive, moving lens, not a flat cursor.
      if(pointer.active){const x=pointer.x,y=pointer.y,r=275+game.perks.radius*35;
        const g=c.createRadialGradient(x,y,8,x,y,r);g.addColorStop(0,'#bdf6fe28');g.addColorStop(.37,'#b3acff13');g.addColorStop(1,'#72eaff00');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
        c.save();c.globalAlpha=.43;c.strokeStyle='#b8f7ff';c.setLineDash([14,12]);c.lineDashOffset=-t*40;c.lineWidth=2;c.beginPath();c.arc(x,y,70+10*Math.sin(t*3),0,TAU);c.stroke();c.setLineDash([]);c.beginPath();c.arc(x,y,29,0,TAU);c.stroke();c.restore();glow(c,x,y,40,'#b7faff',.49);star(c,x,y,9,'#ebfeff');
      }
      for(const m of game.motes){const color=starPalette[m.type]||COLORS[m.type];
        c.save();for(let j=1;j<m.trail.length;j++){const a=m.trail[j-1],b=m.trail[j];c.strokeStyle=color;c.lineWidth=1+j*.65;c.globalAlpha=(j/m.trail.length)*.65;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}c.globalAlpha=1;glow(c,m.x,m.y,45,color,.6);
        c.shadowBlur=22;c.shadowColor=color;c.fillStyle=color;c.beginPath();c.arc(m.x,m.y,12,0,TAU);c.fill();c.shadowBlur=0;star(c,m.x,m.y,8,'#fffdf6',4);c.restore();
      }
      for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}p.vy+=18*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.987;p.vy*=.987;c.globalAlpha=Math.min(1,p.life/.5);c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,TAU);c.fill();}c.globalAlpha=1;
      c.fillStyle='#e9f8ffb8';c.textAlign='center';c.font='bold 13px system-ui';c.fillText('ATTIRE LES ÉTOILES VERS LEUR COULEUR',360,1087);
    }
    garden(canvas,progress){const c=canvas.getContext('2d');const w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);const t=this.clock;
      c.fillStyle='#070e2585';c.fillRect(0,0,w,h);
      for(let i=0;i<125;i++){const x=(i*197.73)%w,y=(i*73.93)%h;c.globalAlpha=.13+(i%7)*.045;c.fillStyle='#e1f9ff';c.fillRect(x,y,i%3?2:3,i%3?2:3);}c.globalAlpha=1;
      const n=Math.max(1,progress),total=24;const points=[];
      for(let i=0;i<total;i++){const ring=i<8?0:i<16?1:2,idx=i%8,a=idx*TAU/8+ring*.21-Math.PI/2;
        const radius=90+ring*93,x=w/2+Math.cos(a)*radius,y=h/2+Math.sin(a)*radius*.78;points.push({x,y,active:i<progress,color:COLORS[i%3],i});}
      c.save();c.strokeStyle='#8fa3ef39';c.lineWidth=1.5;for(let i=0;i<total;i++){const a=points[i],b=points[(i+1)%total];c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}c.restore();
      for(const p of points){if(p.active)glow(c,p.x,p.y,39,p.color,.8);c.save();c.globalAlpha=p.active?1:.34;star(c,p.x,p.y,p.active?12:6,p.active?p.color:'#9eabd5',5);c.restore();}
      glow(c,w/2,h/2,155,'#7acfff',.3);star(c,w/2,h/2,31,'#e7fdff',8);c.fillStyle='#e9faff';c.textAlign='center';c.font='900 23px system-ui';c.fillText(progress+' / 24',w/2,h/2+61);
      c.fillStyle='#b7cbea';c.font='bold 15px system-ui';c.fillText('JARDINS RÉVEILLÉS',w/2,h/2+84);
    }
  }
  window.AstraPainter=Painter;
})();
