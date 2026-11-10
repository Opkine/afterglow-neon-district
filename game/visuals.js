/* Original vector art direction for AFTERGLOW. Rendered locally on Canvas 2D. */
(() => {
  'use strict';
  const PALETTE = [
    ['#65f4ff','#0a9fc8','#d8ffff'],
    ['#ff91da','#dd3197','#fff0fc'],
    ['#ffe18e','#eb9c32','#fff8d5'],
    ['#93ffc1','#16af80','#edfff2'],
    ['#ceb4ff','#7256d5','#f5eaff']
  ];
  const RGBA=(hex,a)=>{const x=parseInt(hex.slice(1),16);return `rgba(${x>>16&255},${x>>8&255},${x&255},${a})`;};
  function polygon(ctx,points){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();}
  function mix(a,b,p){return a+(b-a)*p;}
  const ease=t=>1-Math.pow(1-t,3);
  function crystal(ctx,kind,x,y,w,h,t,selected=false){
    const [base,dark,light]=PALETTE[kind]||PALETTE[0],cw=w*.74,ch=h*.76;
    const cx=x+w*.5,cy=y+h*.5+(selected?-2:Math.sin(t*.0015+kind)*.75);
    ctx.save();
    // Raised mechanical socket, etched inner ring, and contact points.
    const slot=ctx.createLinearGradient(x,y,x+w,y+h);
    slot.addColorStop(0,'#23365a');slot.addColorStop(.42,'#0a112d');slot.addColorStop(1,'#131c39');
    ctx.shadowColor='#020415';ctx.shadowBlur=9;ctx.shadowOffsetY=4;
    ctx.fillStyle=slot;ctx.beginPath();ctx.roundRect(x+3,y+3,w-6,h-6,18);ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=selected?RGBA(base,.95):'#5b7eb044';ctx.lineWidth=selected?3:1.2;ctx.stroke();
    ctx.strokeStyle=RGBA(base,selected?.72:.23);ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,Math.min(cw,ch)*.49,.14,Math.PI*1.42);ctx.stroke();
    // A beveled, thick seven-sided gemstone: each facet has its own lighting.
    const shape=[[-.24,-.47],[.23,-.47],[.48,-.20],[.43,.26],[.12,.48],[-.28,.42],[-.48,.10],[-.45,-.23]];
    const pts=shape.map(([px,py])=>[cx+px*cw,cy+py*ch]);
    ctx.shadowColor=base;ctx.shadowBlur=selected?37:20;ctx.shadowOffsetY=selected?0:5;
    const outer=ctx.createLinearGradient(cx-cw*.4,cy-ch*.45,cx+cw*.35,cy+ch*.48);
    outer.addColorStop(0,light);outer.addColorStop(.34,base);outer.addColorStop(.78,dark);outer.addColorStop(1,'#18213d');
    polygon(ctx,pts);ctx.fillStyle=outer;ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    const center=[cx,cy-ch*.06];
    const facets=[
      [[pts[0],pts[1],center],RGBA('#ffffff',.19)],
      [[pts[1],pts[2],pts[3],center],RGBA(light,.25)],
      [[pts[3],pts[4],center],RGBA(dark,.44)],
      [[pts[4],pts[5],center],RGBA('#080e34',.21)],
      [[pts[5],pts[6],pts[7],center],RGBA('#031437',.23)],
      [[pts[7],pts[0],center],RGBA('#ffffff',.13)]
    ];
    for(const [p,color] of facets){polygon(ctx,p);ctx.fillStyle=color;ctx.fill();}
    polygon(ctx,pts);ctx.strokeStyle=RGBA(light,selected?.95:.74);ctx.lineWidth=selected?3.2:2.1;ctx.stroke();
    ctx.strokeStyle=RGBA('#ffffff',.44);ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(pts[0][0]+2,pts[0][1]+3);ctx.lineTo(pts[1][0]-3,pts[1][1]+3);ctx.stroke();
    // A distinctive arcane circuit sigil in each gemstone.
    ctx.translate(cx,cy);ctx.strokeStyle=RGBA('#ffffff',selected?.94:.82);
    ctx.shadowColor=base;ctx.shadowBlur=6;ctx.lineWidth=2.8;ctx.lineCap='round';ctx.lineJoin='round';
    const r=Math.min(cw,ch)*.19;ctx.beginPath();
    if(kind===0){ctx.arc(0,0,r,0,Math.PI*2);ctx.moveTo(-r*1.45,0);ctx.lineTo(-r*.85,0);ctx.moveTo(r*.85,0);ctx.lineTo(r*1.45,0);}
    if(kind===1){ctx.moveTo(0,-r*1.28);ctx.lineTo(r*1.1,r*.9);ctx.lineTo(-r*1.1,r*.9);ctx.closePath();ctx.moveTo(0,-r*.5);ctx.lineTo(0,r*.53);}
    if(kind===2){ctx.rect(-r*.86,-r*.86,r*1.72,r*1.72);ctx.moveTo(-r*.86,-r*.86);ctx.lineTo(r*.86,r*.86);}
    if(kind===3){ctx.moveTo(-r*1.15,0);ctx.lineTo(0,-r*1.2);ctx.lineTo(r*1.15,0);ctx.lineTo(0,r*1.2);ctx.closePath();ctx.moveTo(0,-r*.65);ctx.lineTo(0,r*.65);}
    if(kind===4){for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,v=k%2?r*.57:r*1.25;ctx.lineTo(Math.cos(a)*v,Math.sin(a)*v);}ctx.closePath();}
    ctx.stroke();ctx.shadowBlur=0;
    const gleam=(t*.00055+kind*.22)%2.3;
    if(gleam<1.15 && !selected){ctx.globalAlpha=.32*(1-Math.abs(gleam-.55)*1.7);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(-cw*.17,-ch*.26,3.8,0,Math.PI*2);ctx.fill();}
    if(selected){ctx.globalAlpha=.25+.17*Math.sin(t*.016);ctx.strokeStyle=base;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,Math.min(cw,ch)*.60,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }

  let cache=null,cacheKey='';
  function hash(n){let x=Math.imul(n+1031,2654435761);x=Math.imul(x^(x>>>16),2246822507);return((x^(x>>>13))>>>0)/4294967296;}
  function beam(ctx,x,y,w,h,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=17;ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.restore();}
  function building(ctx,x,baseY,w,h,depth,i,progress,accent){
    const y=baseY-h,lit=progress>.001&&(i*3+depth)%65 < progress*81+3;
    const g=ctx.createLinearGradient(x,y,x+w,baseY);
    if(depth===0){g.addColorStop(0,'#1b2849');g.addColorStop(1,'#172540');}
    else if(depth===1){g.addColorStop(0,'#172343');g.addColorStop(1,'#071229');}
    else {g.addColorStop(0,'#11213f');g.addColorStop(1,'#060b20');}
    ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
    ctx.fillStyle=depth===2?'#121e39':'#2c3e62';ctx.fillRect(x-3,y-3,w+6,4);
    // Right side shade adds an architectural side-face.
    ctx.fillStyle='#020a20b3';ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w+7,y-5);ctx.lineTo(x+w+7,baseY-6);ctx.lineTo(x+w,baseY);ctx.fill();
    if(i%5===0){ctx.fillStyle='#1b3554';ctx.fillRect(x+w*.45,y-15,3,14);if(lit)beam(ctx,x+w*.45-1,y-17,5,2,accent);}
    if(i%7===0){ctx.fillStyle='#253957';ctx.fillRect(x+5,y-12,w*.46,9);ctx.fillStyle='#41587e';ctx.fillRect(x+5,y-12,w*.46,2);}
    for(let wy=y+13,row=0;wy<baseY-8;wy+=13,row++)for(let wx=x+7,col=0;wx<x+w-5;wx+=11,col++){
      const seed=i*1711+depth*291+row*37+col*71,on=lit&&hash(seed)>(depth===2?.35:.52);
      const tint=seed%8===0?'#ff8cc6':seed%6===0?'#ffe4a1':'#60dff4';
      ctx.fillStyle=on?tint:'#2d3e61';ctx.globalAlpha=on?(depth===2?.86:.58):.38;
      ctx.fillRect(wx,wy,4.5,6.5);
    }
    ctx.globalAlpha=1;
    if(lit&&depth===2&&i%4===1){beam(ctx,x+5,y+2,w-10,2.5,accent,.82);}
    if(lit&&depth===2&&i%8===3){
      ctx.shadowColor=accent;ctx.shadowBlur=15;ctx.strokeStyle=accent;ctx.lineWidth=1.6;
      ctx.strokeRect(x+7,y+23,w-14,15);ctx.shadowBlur=0;
      ctx.fillStyle=accent;ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.fillText(['NOVA','LUX','ECHO','Ø7'][i%4],x+w/2,y+33);
    }
  }
  function makeCity(progress,theme){
    const c=document.createElement('canvas');c.width=720;c.height=310;
    const x=c.getContext('2d'),W=720,H=310;
    // Cinematic gradient, nebula, haze and far parallax ridge.
    const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,theme.bg||'#080d23');sky.addColorStop(.52,'#132952');sky.addColorStop(.77,'#182c4c');sky.addColorStop(1,'#07152d');x.fillStyle=sky;x.fillRect(0,0,W,H);
    let haze=x.createRadialGradient(570,89,2,570,89,260);haze.addColorStop(0,'#7385cd55');haze.addColorStop(.33,'#8b58ad1b');haze.addColorStop(1,'#030b1f00');x.fillStyle=haze;x.fillRect(0,0,W,H);
    const gl=x.createRadialGradient(150,180,0,150,180,260);gl.addColorStop(0,'#0068bc45');gl.addColorStop(1,'#055b9c00');x.fillStyle=gl;x.fillRect(0,0,W,H);
    for(let i=0;i<115;i++){const a=hash(i+45),b=hash(i+367);x.fillStyle=i%4?'#bdd8ff':'#fcffff';x.globalAlpha=.18+hash(i+9)*.64;x.fillRect(a*W,b*195,hash(i+200)*1.4+.55,hash(i+200)*1.4+.55);}x.globalAlpha=1;
    // The moon is layered, rim-lit and partly submerged in passing clouds.
    x.shadowColor='#96baff';x.shadowBlur=55;x.fillStyle='#aec6ff';x.beginPath();x.arc(578,78,28,0,Math.PI*2);x.fill();x.shadowBlur=0;
    let lunar=x.createRadialGradient(565,62,3,578,78,35);lunar.addColorStop(0,'#f4f5ff');lunar.addColorStop(.5,'#a8bdff');lunar.addColorStop(1,'#6b8bd9');x.fillStyle=lunar;x.beginPath();x.arc(578,78,28,0,Math.PI*2);x.fill();
    x.globalAlpha=.19;x.fillStyle='#465f9b';for(const [px,py,r] of [[573,72,5],[588,83,4],[563,87,2]]){x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}x.globalAlpha=1;
    x.fillStyle='#101d39';x.beginPath();x.moveTo(0,210);for(let i=0;i<30;i++)x.lineTo(i*28,160+hash(i+530)*25);x.lineTo(W,310);x.lineTo(0,310);x.fill();
    // Three architectural depths, growing density and signage as power returns.
    for(let depth=0;depth<3;depth++){
      const unit=depth===0?44:depth===1?38:40,base=depth===0?247:depth===1?270:281;
      for(let i=0;i<23;i++){
        const bx=i*unit-(depth*29+21),bw=(depth===0?27:32)+hash(i*2+depth*37)*25;
        const bh=(depth===0?56:depth===1?97:118)+hash(i+depth*111)*88;
        building(x,bx,base,bw,bh,depth,i,progress,theme.color||'#55dff4');
      }
    }
    // Quayside neon and water/reflections give a high-end sense of place.
    x.fillStyle='#081125';x.fillRect(0,275,720,35);
    x.fillStyle='#2a4064';x.fillRect(0,274,720,2);
    if(progress>.02){for(let i=0;i<16;i++){
      const wx=hash(i+14)*W,l=7+hash(i+38)*22;
      x.fillStyle=i%3?'#23d7f566':'#fe7bc655';x.fillRect(wx,282+hash(i+900)*21,l,1);
      x.fillRect(wx+5,287+hash(i+301)*17,l*.65,1);
    }}
    x.fillStyle='#071121';x.fillRect(0,305,W,5);
    return c;
  }
  function city(ctx,t,progress,theme,flash,reduceMotion){
    const key=[Math.floor(progress*80),theme.name].join(':');
    if(!cache || key!==cacheKey){cache=makeCity(progress,theme);cacheKey=key;}
    ctx.clearRect(0,0,720,310);ctx.drawImage(cache,0,0);
    const time=reduceMotion?0:t;
    ctx.save();
    // Slow, transparent atmospheric veils drift at different speeds.
    for(let i=0;i<4;i++){
      const x=((hash(i+500)*750+time*.006*(i%2?1:-1))+780)%990-160;
      const y=42+i*28;
      const cloud=ctx.createRadialGradient(x,y,0,x,y,135);
      cloud.addColorStop(0,i%2?'#7389d710':'#bd5ba90e');cloud.addColorStop(1,'#00000000');ctx.fillStyle=cloud;ctx.fillRect(x-135,y-55,270,140);
    }
    // Little airborne lights, distant craft and twinkling beacons.
    for(let i=0;i<4;i++){
      const px=((time*.015*(i%2?-1:1)+hash(i+900)*800+850)%850)-45,py=101+i*36+Math.sin(time*.0007+i)*5;
      if(progress>.01){beam(ctx,px,py,10,2,i%2?'#fa80c6':'#69eeff',.55);ctx.fillStyle='#d3ecff';ctx.fillRect(px+3,py-1,3,1);}
    }
    for(let i=0;i<13;i++){
      const ix=hash(i+201)*720,iy=hash(i+91)*174;
      ctx.globalAlpha=.18+.32*(.5+.5*Math.sin(time*.0019+i*1.7));
      ctx.fillStyle='#dffaff';ctx.beginPath();ctx.arc(ix,iy,1.1,0,Math.PI*2);ctx.fill();
    }ctx.globalAlpha=1;
    if(progress>.015){for(let k=0;k<3;k++){
      const px=(time*.043*(k+1)+k*265)%800-30;
      beam(ctx,px,292+k%2*5,22,4,k%2?'#f770c7':'#49eaff',.8);
    }}
    if(flash>0){ctx.fillStyle=`rgba(91,238,255,${Math.min(.32,flash*.12)})`;ctx.fillRect(0,0,720,310);}
    ctx.restore();
  }
  window.AfterglowArt={crystal,city,ease};
})();
