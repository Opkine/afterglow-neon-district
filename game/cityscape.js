/* AFTERGLOW Cityscape v1.3 — original interactive skyline, rendered offline.
   Animated light ripples are driven by Tween.js (MIT, bundled locally). */
(() => {
  'use strict';
  const W=720,H=310,PALETTE=['#5ceaff','#fa70c9','#ffd976','#73f6a5','#b48dff','#ff925f','#72a9ff','#ef90e6'];
  const DISTRICTS=['LES TOITS','LE CANAL','NÉON PARK','LES ATELIERS','LE PHARE','LE DÔME','LE JARDIN','LE CŒUR'];
  const hash=n=>{let x=Math.imul(n+531,2654435761);x=Math.imul(x^(x>>>16),2246822507);return((x^(x>>>13))>>>0)/4294967296;};
  const rgba=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // 80 sectors are deliberately distributed across all three skyline depths:
  // early wins light up buildings all over the city, not only the left corner.
  const buildings=[];
  for(let depth=0;depth<3;depth++)for(let i=0;i<27;i++){
    const sector=(depth*27+i)*46%81+1;
    const x=i*27-14+depth*7;
    const w=24+hash(i*31+depth*53)*25;
    const h=(depth===0?48:depth===1?83:104)+hash(i*7+depth*43)*86;
    const bottom=depth===0?252:depth===1?271:281;
    buildings.push({sector,depth,x,w,h,bottom,y:bottom-h,cx:x+w*.5,color:PALETTE[(sector-1)%PALETTE.length],style:(i+depth*3)%6});
  }
  let cached=null,cacheKey='';
  let colorEpoch=0;
  const ripples=[];
  let activeFocus=null;
  function shine(ctx,x,y,color,r,alpha){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(color,alpha));g.addColorStop(.34,rgba(color,alpha*.36));g.addColorStop(1,rgba(color,0));
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  function aurora(ctx,progress){
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#28194d');sky.addColorStop(.35,'#3f3179');sky.addColorStop(.68,'#253f70');sky.addColorStop(1,'#07324b');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const bands=[
      {color:'#5ceaff',y:84,drift:18},
      {color:'#ff65c7',y:119,drift:-24},
      {color:'#bd88ff',y:154,drift:40}
    ];
    for(const b of bands){
      ctx.save();ctx.globalAlpha=.12+progress*.09;ctx.strokeStyle=b.color;ctx.lineWidth=53;ctx.shadowColor=b.color;ctx.shadowBlur=75;
      ctx.beginPath();ctx.moveTo(-90,b.y);ctx.bezierCurveTo(95,b.y-62,242,b.y+57,405,b.y-25);ctx.bezierCurveTo(540,b.y-70,640,b.y+35,790,b.y-48);ctx.stroke();ctx.restore();
    }
    shine(ctx,132,140,'#33d8fa',290,.32+progress*.14);
    shine(ctx,585,134,'#f05ed0',265,.25+progress*.15);
    shine(ctx,398,217,'#ff9c59',255,.14);
    for(let i=0;i<130;i++){
      const x=hash(i+14)*W,y=hash(i+700)*187,size=.6+hash(i+71)*1.5;
      ctx.fillStyle=i%6?'#e1efff':'#ffe5a0';ctx.globalAlpha=.22+hash(i+251)*.64;ctx.fillRect(x,y,size,size);
    }ctx.globalAlpha=1;
    shine(ctx,588,74,'#9e9eff',80,.6);
    const moon=ctx.createRadialGradient(577,61,1,588,74,33);
    moon.addColorStop(0,'#fffffa');moon.addColorStop(.6,'#cecaff');moon.addColorStop(1,'#8c9aff');
    ctx.fillStyle=moon;ctx.beginPath();ctx.arc(588,74,26,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#aab5ed55';ctx.beginPath();ctx.arc(579,81,5,0,Math.PI*2);ctx.arc(598,72,3,0,Math.PI*2);ctx.fill();
  }
  function tower(ctx,b,done){
    const lit=b.sector<=done||(done===80&&b.sector===81),color=b.color,{x,y,w,h,depth}=b;
    ctx.save();
    const wall=ctx.createLinearGradient(x,y,x+w,b.bottom);
    if(lit){wall.addColorStop(0,depth===0?'#465786':'#263d72');wall.addColorStop(.35,depth===2?'#273862':'#334570');wall.addColorStop(1,'#101d42');}
    else{wall.addColorStop(0,depth===0?'#28355c':'#1c2d51');wall.addColorStop(1,depth===2?'#0e1a37':'#152c48');}
    ctx.shadowColor=lit?color:'#000';
    ctx.shadowBlur=lit?12:7;ctx.fillStyle=wall;
    ctx.beginPath();
    if(b.style===1||b.style===4){ctx.moveTo(x,y+8);ctx.lineTo(x+w*.28,y);ctx.lineTo(x+w*.76,y);ctx.lineTo(x+w,y+8);}
    else if(b.style===3){ctx.moveTo(x,y+17);ctx.lineTo(x+w*.5,y);ctx.lineTo(x+w,y+17);}
    else{ctx.moveTo(x,y);ctx.lineTo(x+w,y);}
    ctx.lineTo(x+w,b.bottom);ctx.lineTo(x,b.bottom);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle=lit?rgba(color,.24):'#24325a90';ctx.fillRect(x+w-5,y+10,5,h-10);
    ctx.strokeStyle=lit?rgba(color,.81):'#5066a65e';ctx.lineWidth=lit?1.7:.8;
    ctx.beginPath();ctx.moveTo(x+1,y+9);ctx.lineTo(x+1,b.bottom);ctx.moveTo(x+w-1,y+8);ctx.lineTo(x+w-1,b.bottom);ctx.stroke();
    if(b.style===0||b.style===5){
      ctx.fillStyle=lit?color:'#4a6183';ctx.fillRect(x+w*.51-1.5,y-13,3,13);
      if(lit)shine(ctx,x+w*.51,y-14,color,14,.9);
    }
    for(let row=0,wy=y+16;wy<b.bottom-9;row++,wy+=12)for(let col=0,wx=x+6;wx<x+w-5;col++,wx+=9){
      const n=hash(b.sector*133+row*67+col*29);
      const turnedOn=lit&&n>.18;
      ctx.globalAlpha=turnedOn?.67+n*.33:.22;
      ctx.fillStyle=turnedOn?(n>.82?'#fff8d3':n>.63?color:PALETTE[(b.sector+row+col)%8]):'#597ba6';
      ctx.fillRect(wx,wy,4.5,6.5);
      if(turnedOn&&n>.85){ctx.fillStyle=rgba(color,.2);ctx.fillRect(wx-1,wy-1,6.5,8);}
    }ctx.globalAlpha=1;
    ctx.fillStyle=lit?color:'#637396';
    if(lit){ctx.shadowColor=color;ctx.shadowBlur=14;}
    ctx.fillRect(x+3,y+6,Math.max(0,w-6),lit?3:1.3);
    ctx.shadowBlur=0;
    if(lit&&depth>=1&&b.sector%3===0){
      ctx.fillStyle=rgba(color,.22);ctx.fillRect(x+4,y+h*.42,w-8,18);
      ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.strokeRect(x+4,y+h*.42,w-8,18);
      ctx.font='900 8px system-ui';ctx.fillStyle='#ffffff';ctx.textAlign='center';
      ctx.fillText(['NOVA','LUX','ZEN','AURA','Ø7'][b.sector%5],x+w*.5,y+h*.42+12);
    }
    ctx.restore();
  }
  function monuments(ctx,done){
    ctx.save();
    if(done>=10){
      ctx.strokeStyle='#64ffff';ctx.shadowColor='#2fffff';ctx.shadowBlur=13;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(7,269);ctx.bezierCurveTo(99,189,177,187,270,265);ctx.stroke();
      for(let x=25;x<270;x+=19){ctx.beginPath();ctx.moveTo(x,268);ctx.lineTo(x,244-40*Math.sin((x-25)/245*Math.PI));ctx.stroke();}
    }
    if(done>=20){
      ctx.strokeStyle='#ff8ad5';ctx.shadowColor='#ff7ac8';ctx.shadowBlur=20;ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(602,190,47,0,Math.PI*2);ctx.stroke();
      for(let k=0;k<9;k++){let a=k*Math.PI*2/9;ctx.beginPath();ctx.moveTo(602,190);ctx.lineTo(602+47*Math.cos(a),190+47*Math.sin(a));ctx.stroke();}
    }
    if(done>=30){
      shine(ctx,460,191,'#ff914f',81,.31);ctx.fillStyle='#ff9754';ctx.fillRect(449,122,9,101);ctx.fillRect(475,146,8,78);
    }
    if(done>=40){
      ctx.fillStyle='#fb6dc855';ctx.fillRect(326,124,73,38);ctx.strokeStyle='#ff6dcc';ctx.lineWidth=3;ctx.strokeRect(326,124,73,38);
      ctx.font='900 16px system-ui';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('GLOW',362,150);
    }
    if(done>=50){
      ctx.fillStyle='#62eaff';ctx.fillRect(665,100,15,149);shine(ctx,673,92,'#6ef8ff',70,.55);
    }
    if(done>=60){
      ctx.strokeStyle='#b7a0ff';ctx.shadowColor='#ad91ff';ctx.shadowBlur=17;ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(199,259,67,Math.PI,Math.PI*2);ctx.stroke();
    }
    if(done>=70){
      ctx.strokeStyle='#7affa3';ctx.lineWidth=4;ctx.shadowBlur=15;ctx.shadowColor='#6affa6';
      for(let k=0;k<5;k++){const x=455+k*13;ctx.beginPath();ctx.moveTo(x,247);ctx.quadraticCurveTo(x-18,215,x+4,189-k%2*19);ctx.stroke();}
    }
    if(done>=80){
      shine(ctx,360,75,'#ffffad',150,.7);
      ctx.fillStyle='#eaffff';ctx.beginPath();ctx.moveTo(360,8);ctx.lineTo(347,213);ctx.lineTo(373,213);ctx.fill();
    }
    ctx.restore();
  }
  function staticCity(done,theme){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
    aurora(ctx,done/80);
    for(const b of buildings)if(b.depth===0)tower(ctx,b,done);
    // Luminous rail, still visible at the start, progressively fed by electricity.
    ctx.fillStyle='#2a1d54';ctx.fillRect(0,246,W,8);
    ctx.fillStyle='#66a9fc';ctx.globalAlpha=.3+done/160;ctx.fillRect(0,249,W,2);ctx.globalAlpha=1;
    for(const b of buildings)if(b.depth===1)tower(ctx,b,done);
    for(const b of buildings)if(b.depth===2)tower(ctx,b,done);
    // Every newly rescued tower gets a street-to-sky power feed, even if
    // another building stands in front of it. Early victories become visible
    // in four different positions instead of disappearing behind silhouettes.
    for(const b of buildings){
      if((b.sector>done&&!(done===80&&b.sector===81))||!(done<=12||b.sector>done-5||b.sector%10===0))continue;
      ctx.save();ctx.shadowColor=b.color;ctx.shadowBlur=21;ctx.strokeStyle=rgba(b.color,done<=12?.9:.57);
      ctx.lineWidth=done<=12?2.7:1.8;ctx.beginPath();
      ctx.moveTo(b.cx,273);ctx.bezierCurveTo(b.cx+8,235,b.cx-8,b.y+22,b.cx,b.y+5);ctx.stroke();
      shine(ctx,b.cx,b.y+5,b.color,done<=12?33:23,.68);
      ctx.fillStyle='#fff9ea';ctx.beginPath();ctx.arc(b.cx,b.y+5,done<=12?3.8:2.4,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    monuments(ctx,done);
    const river=ctx.createLinearGradient(0,276,0,H);
    river.addColorStop(0,'#20376b');river.addColorStop(.35,'#0e2452');river.addColorStop(1,'#090d2a');
    ctx.fillStyle=river;ctx.fillRect(0,279,W,31);
    for(let i=0;i<51;i++){
      const x=hash(250+i)*W,y=283+hash(450+i)*25,len=4+hash(600+i)*24;
      ctx.fillStyle=rgba(PALETTE[i%8],.1+done/80*.33);ctx.fillRect(x,y,len,1.3);
    }
    ctx.fillStyle='#5cf5ff';ctx.globalAlpha=.4+done/150;ctx.fillRect(0,278,W,1.8);ctx.globalAlpha=1;
    return canvas;
  }
  function ripple(x,y,color,strong=false){
    const p={x,y,color,radius:strong?9:2,alpha:strong?.95:.58};
    ripples.push(p);if(ripples.length>12)ripples.shift();
    const tween=window.TWEEN;
    if(tween?.Tween){
      new tween.Tween(p).to({radius:strong?182:100,alpha:0},strong?1300:840)
        .easing(tween.Easing.Cubic.Out).onComplete(()=>{const i=ripples.indexOf(p);if(i>=0)ripples.splice(i,1);})
        .start(performance.now());
    }else{
      p.start=performance.now();p.duration=strong?1300:840;p.maxRadius=strong?182:100;
    }
  }
  const locate=sector=>buildings.find(b=>b.sector===sector);
  function react(color,chain=3){
    const s=clamp((color*17+Math.max(0,chain)*7)%80+1,1,80);
    const b=locate(s)||buildings[0];ripple(b.cx,clamp(b.y+30,85,270),PALETTE[color%PALETTE.length],chain>=6);
  }
  function ignite(sector){
    const b=locate(sector);if(!b)return;
    ripple(b.cx,clamp(b.y+35,55,262),b.color,true);
    ripple(b.cx,260,b.color,true);
    activeFocus={sector,start:performance.now()};
  }
  function syncColors(colors){
    for(const b of buildings){
      const saved=colors?.[String(b.sector)];
      b.color=typeof saved==='string'&&/^#[a-f0-9]{6}$/i.test(saved)?saved:PALETTE[(b.sector-1)%PALETTE.length];
    }
    colorEpoch++;
  }
  function tap(x,y,finished){
    const candidates=buildings.filter(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y-9&&y<=b.bottom);
    let b=candidates.find(b=>b.sector<=finished||(finished>=80&&b.sector===81));
    if(!b)b=candidates.sort((a,z)=>z.depth-a.depth)[0];
    if(!b)b=buildings.reduce((best,p)=>Math.abs(p.cx-x)<Math.abs(best.cx-x)?p:best,buildings[0]);
    ripple(b.cx,clamp(b.y+35,45,262),b.color,b.sector<=finished||(finished>=80&&b.sector===81));
    activeFocus={sector:b.sector,start:performance.now()};
    const sector=Math.min(80,b.sector);
    return {sector,active:sector<=finished,district:DISTRICTS[Math.min(7,Math.floor((sector-1)/10))],color:b.color};
  }
  function city(ctx,t,progress,theme,flash,reduceMotion=false){
    const done=clamp(Math.round(progress*80),0,80),key=`${done}|${theme?.color||'#5ceaff'}|${theme?.bg||''}|${colorEpoch}`;
    if(!cached||key!==cacheKey){cached=staticCity(done,theme||{});cacheKey=key;}
    ctx.clearRect(0,0,W,H);ctx.drawImage(cached,0,0);
    if(reduceMotion)return;
    window.TWEEN?.update?.(t);
    ctx.save();
    // Slow electric beams, moving maglev traffic and reflections: very cheap per frame.
    for(let i=0;i<5;i++){
      const x=((t*(i%2?-.018:.022)+hash(i+92)*900+1100)%920)-100;
      const y=43+i*27+Math.sin(t*.0006+i)*8;
      ctx.globalAlpha=.17+done/80*.35;ctx.strokeStyle=i%2?'#ff90e4':'#62f7ff';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+28,y-2);ctx.stroke();
      shine(ctx,x+25,y,'#aafaff',8,.46);
    }
    ctx.globalAlpha=.45;
    for(let k=0;k<5;k++){
      const x=(t*(.026+k*.014)+k*209)%820-50,y=285+k%3*7;
      ctx.shadowColor=PALETTE[k];ctx.shadowBlur=13;ctx.fillStyle=PALETTE[k];
      ctx.fillRect(x,y,17,3);ctx.shadowBlur=0;
    }ctx.globalAlpha=1;
    for(const b of buildings){
      if(b.sector>done||b.depth!==2||b.sector%5!==0)continue;
      const a=.28+.34*(.5+.5*Math.sin(t*.002+b.sector));
      shine(ctx,b.cx,b.y+10,b.color,18,a);
    }
    for(const p of ripples){
      if(p.start!==undefined){
        const age=clamp((t-p.start)/p.duration,0,1);
        p.radius=3+(p.maxRadius-3)*(1-(1-age)**3);p.alpha=(1-age)*.7;
      }
      if(p.alpha<=0)continue;
      shine(ctx,p.x,p.y,p.color,p.radius*.65,p.alpha*.36);
      ctx.strokeStyle=rgba(p.color,p.alpha);ctx.shadowColor=p.color;ctx.shadowBlur=18;
      ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,p.radius*.61,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
    }
    if(activeFocus&&t-activeFocus.start<1900){
      const b=locate(activeFocus.sector);if(b){
        const a=clamp(1-(t-activeFocus.start)/1900,0,1);
        ctx.lineWidth=2.6;ctx.strokeStyle=rgba(b.color,a);ctx.shadowColor=b.color;ctx.shadowBlur=17;
        ctx.strokeRect(b.x-4,b.y-8,b.w+8,b.h+11);ctx.shadowBlur=0;
      }
    }
    if(flash>0){
      const a=clamp(flash*.13,0,.32);
      shine(ctx,350,175,'#89eeff',320,a);
    }
    ctx.restore();
  }
  Object.assign(window.AfterglowArt,{city,react,ignite,tap,syncColors,buildings:()=>buildings.map(b=>({sector:b.sector,x:b.cx,y:b.y+Math.min(50,b.h*.4),color:b.color}))});
})();
