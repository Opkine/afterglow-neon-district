/* ASTRA TIDE — complete offline mobile user flow and progression. */
(()=>{
  'use strict';
  const {GravityGame,COLORS}=window.AstraEngine,$=id=>document.getElementById(id);
  const STAGES=['Le premier souffle','Le ciel répond','Duo d’aurores','Le passage secret','Gravité sauvage','Les rubans du temps','La porte corail','L’écho des astres','Le puits de nuit','Jardins en mouvement','La danse des comètes','Les trois couronnes','Sillage interdit','Soleils inversés','Pluie de météores','La nuit bleue','Les anneaux brisés','Aurores rebelles','Les jardins flottants','L’océan du vide','Fleurs de lumière','Le dernier horizon','La marée céleste','Le cœur des étoiles'];
  const KEY='astratide-save-v1',D0={version:1,level:1,coins:120,completed:{},best:0,daily:{},radius:0,shield:0,skins:[0],skin:0,tutorial:false,settings:{music:true,sound:true,haptics:true,reduced:false},session:null};
  function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(!s||s.version!==1)return structuredClone(D0);return {...structuredClone(D0),...s,settings:{...D0.settings,...s.settings},skins:Array.isArray(s.skins)?s.skins:[0]};}catch(_){return structuredClone(D0);}}
  let save=read(),game=null,screen='home',paused=false,currentMode='campaign',pointer={active:false,x:360,y:620};
  let toastTimer=0,last=0,accSave=0,loopHandle=0,completedCount=0;
  const painter=new window.AstraPainter($('gameCanvas')),audio=new window.AstralAudio();
  const rewards={radius:[300,720,1400],shield:[380,880,1720]};
  const prefersReduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function storage(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){console.warn('Local save unavailable:',e.message);}}
  function message(text){const old=document.querySelector('.toast');if(old)old.remove();const box=document.createElement('div');box.className='toast';box.textContent=text;$('app').append(box);clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.remove(),2500);}
  function haptic(ms=16){if(save.settings.haptics&&navigator.vibrate)navigator.vibrate(ms);}
  function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Paris'});}
  function label(s){return STAGES[Math.max(0,Math.min(23,s-1))]||'Épreuve céleste';}
  function countStars(){return Object.values(save.completed).reduce((a,b)=>a+Number(b||0),0);}
  function tally(){completedCount=Object.keys(save.completed).filter(k=>Number(save.completed[k])>0).length;
    $('wallet').textContent=save.coins;$('levelBadge').textContent=String(save.level).padStart(2,'0');
    $('levelTitle').textContent=label(save.level).toUpperCase();$('levelSubtitle').textContent='Chapitre '+String(save.level).padStart(2,'0')+' · Les Jardins du Vide';
    $('homeStars').textContent=countStars();$('homeHigh').textContent=save.best.toLocaleString('fr-FR');$('homeCompleted').textContent=completedCount+'/24';$('atlasTeaser').textContent=completedCount+' constellations réveillées';$('atlasCount').textContent=completedCount+' / 24';
    $('dailyBtn').querySelector('.tiny-action').textContent=save.daily[today()]?'DÉFI ACCOMPLI ✓':'DÉCOUVRIR ↗';
    $('playBtn').querySelector('span:first-child').textContent=completedCount===24?'REJOUER LES JARDINS':'PARTIR EN EXPÉDITION';
  }
  function go(name){
    if(screen==='play'&&game&&game.stats.status==='running'&&!paused){paused=true;save.session=game.snapshot();storage();}
    screen=name;document.querySelectorAll('.screen').forEach(e=>e.classList.toggle('active',e.id===name));
    document.querySelectorAll('[data-go]').forEach(e=>e.classList.toggle('selected',e.dataset.go===name));
    $('app').classList.toggle('playing',name==='play');
    if(name!=='play'){$('coach').classList.add('hidden');$('gameOverlay').classList.add('hidden');}
    if(name==='home')tally();if(name==='atlas')drawAtlas();if(name==='shop')drawShop();if(name==='options')setOptions();
    if(name!=='play'){last=0;}
    audio.event('click');
  }
  function openSession(mode='campaign',retry=false){audio.unlock();currentMode=mode;
    const stage=mode==='daily'?12:save.level;
    const stored=save.session,restore=!retry&&stored&&stored.stats&&stored.stats.status==='running'&&stored.mode===mode&&stored.stage===stage;
    game=restore?GravityGame.fromSnapshot(stored):null;
    if(!game)game=new GravityGame({stage,mode,date:today(),radius:save.radius,shield:save.shield});
    painter.skin=save.skin;painter.reduced=save.settings.reduced||prefersReduced;
    pointer.active=false;paused=false;accSave=0;go('play');
    $('gameOverlay').classList.add('hidden');$('coach').classList.add('hidden');
    $('gameMode').textContent=mode==='daily'?'CHALLENGE QUOTIDIEN':'CHAPITRE '+String(stage).padStart(2,'0');
    $('gameName').textContent=mode==='daily'?'LE CIEL DU JOUR':label(stage).toUpperCase();
    if(!save.tutorial){paused=true;$('coach').classList.remove('hidden');}
    updateHud();save.session=game.snapshot();storage();
  }
  function updateHud(){if(!game)return;const c=game.config,s=game.stats;
    $('goalText').textContent='✧ '+s.captured+' / '+c.target+' LUEURS GUIDÉES';$('livesText').textContent='♥ '.repeat(Math.max(0,s.lives)).trim()||'♡';
    $('goalBar').style.width=Math.min(100,s.captured/c.target*100)+'%';const sec=Math.ceil(Math.max(0,c.time-s.elapsed));$('timer').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
    $('timer').style.color=sec<15?'#ff96a8':'#ffe1a9';$('combo').textContent='COMBO × '+s.combo;$('score').textContent='SCORE '+String(s.score).padStart(4,'0');
    $('pulseCharge').textContent='CHARGE '+Math.floor(s.charge)+'%';$('pulseBar').style.width=s.charge+'%';$('pulseBtn').disabled=s.charge<100||paused;
  }
  function earnWin(){if(!game)return;const c=game.config,s=game.stats,stars=game.stars;
    let prize=0,headline='JARDIN RÉVEILLÉ';
    if(currentMode==='campaign'){
      const prev=Number(save.completed[c.rank]||0),fresh=prev===0;
      if(fresh){prize=75+stars*30+Math.floor(c.rank*2.5);save.level=Math.min(24,Math.max(save.level,c.rank+1));}
      else if(stars>prev)prize=(stars-prev)*35;
      save.completed[c.rank]=Math.max(prev,stars);
      if(!fresh&&prize===0)headline='JARDIN RETROUVÉ';
    }else{
      const key=today(),prev=save.daily[key]||{score:0,claimed:false};
      if(!prev.claimed)prize=250+stars*40;
      save.daily[key]={score:Math.max(prev.score,s.score),claimed:true};headline='CYCLE CÉLESTE ACCOMPLI';
    }
    save.coins+=prize;save.best=Math.max(save.best,s.score);save.session=null;storage();tally();haptic([35,40,55]);
    const starsText='✦ '.repeat(stars).trim(),reward=prize?('+'+prize+' éclats'): 'Déjà récompensé';
    showOverlay('win','✧',headline,'Une nouvelle lumière rejoint ton ciel. '+(currentMode==='campaign'?'Découvre-la dans ton jardin d’étoiles.':'Reviens demain pour un ciel inédit.'),starsText+' · '+reward,'CONTINUER',()=>{go('home');if(currentMode==='campaign'&&c.rank<24)openSession('campaign',true);},'VOIR MA GALAXIE',()=>go('atlas'));
  }
  function failure(){save.session=null;storage();haptic([40,30,40]);showOverlay('lose','☾','LES ÉTOILES PATIENTENT','Le cosmos ne se conquiert pas en un essai. Apprivoise le champ de gravité, puis réessaie !',game.stats.captured+' lueurs sauvées','RÉESSAYER',()=>openSession(currentMode,true),'RETOUR AU PORT',()=>go('home'));}
  function showOverlay(type,symbol,title,desc,stats,mainLabel,onMain,subLabel,onSub){
    paused=true;pointer.active=false;const wrap=$('gameOverlay');wrap.innerHTML='';wrap.classList.remove('hidden');
    const el=(tag,cl,txt)=>{const n=document.createElement(tag);n.className=cl;n.textContent=txt;wrap.append(n);return n;};
    el('div','medallion',symbol);el('h2','',title);el('div','overlay-stats',stats);el('p','',desc);
    const main=el('button','overlay-button',mainLabel);main.addEventListener('click',onMain);
    const sub=el('button','overlay-button sub-button',subLabel);sub.addEventListener('click',onSub);
  }
  function pauseMenu(){if(!game)return;paused=true;pointer.active=false;save.session=game.snapshot();storage();
    showOverlay('pause','◌','PAUSE ASTRAL','Le temps se fige dans les Jardins du Vide. Ton parcours est enregistré.',String(game.stats.captured)+' / '+game.config.target+' lueurs','REPRENDRE',()=>{paused=false;$('gameOverlay').classList.add('hidden');last=0;},'QUITTER VERS L’ACCUEIL',()=>go('home'));
  }
  function frame(now){loopHandle=requestAnimationFrame(frame);const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
    if(screen==='play'&&game){
      if(!paused&&game.stats.status==='running'){
        const events=game.step(pointer,dt);for(const e of events){audio.event(e.kind,e);painter.event(e);
          if(e.kind==='capture'&&e.combo%4===0)haptic(12);
        }
        accSave+=dt;if(accSave>=7){save.session=game.snapshot();storage();accSave=0;}
        updateHud();if(game.stats.status==='win')earnWin();else if(game.stats.status==='lose')failure();
      }
      painter.render(game,pointer,save.settings.reduced?0:dt);
    }
  }
  function canvasPos(event){const box=$('gameCanvas').getBoundingClientRect();return {x:(event.clientX-box.left)/box.width*720,y:(event.clientY-box.top)/box.height*1120};}
  function drawAtlas(){tally();painter.garden($('atlasCanvas'),completedCount);
    const list=$('atlasList');list.innerHTML='';for(let n=1;n<=24;n++){
      const stars=Number(save.completed[n]||0),item=document.createElement('div');item.className='atlas-node '+(stars?'complete':'locked');
      const a=document.createElement('span');a.className='node-number';a.textContent=stars?'✧ '+String(n).padStart(2,'0'):'◇ '+String(n).padStart(2,'0');
      const b=document.createElement('strong');b.textContent=stars?label(n):'Constellation secrète';
      const d=document.createElement('small');d.textContent=stars?'✦ '.repeat(stars).trim():'En attente de lumière';item.append(a,b,d);list.append(item);
    }
  }
  function buy(type,index,cost){if(save.coins<cost){message('Pas assez d’éclats. Gagne des expéditions !');return;}
    save.coins-=cost;if(type==='radius'||type==='shield')save[type]=index+1;else if(type==='skin')save.skins.push(index);
    save.skin=type==='skin'?index:save.skin;storage();tally();drawShop();audio.event('capture',{type:index%3,combo:2});haptic(26);message('Nouveau pouvoir cosmique !');
  }
  function drawShop(){const ul=$('upgradeList'),sl=$('skinList');ul.innerHTML='';sl.innerHTML='';
    function makeItem(container,symbol,name,description,price,text,disabled,fn){const item=document.createElement('div');item.className='item-card';
      const ico=document.createElement('div');ico.className='item-icon';ico.textContent=symbol;const info=document.createElement('div');info.className='item-info';
      const strong=document.createElement('strong');strong.textContent=name;const small=document.createElement('small');small.textContent=description;info.append(strong,small);
      const b=document.createElement('button');b.className='buy-button';b.textContent=text;b.disabled=disabled;b.onclick=fn;item.append(ico,info,b);container.append(item);
    }
    const r=save.radius,s=save.shield;
    makeItem(ul,'◉','Halo magnétique','Élargit le rayon du champ gravitationnel. Palier '+r+'/3.',rewards.radius[r],r>=3?'MAX':'✧ '+rewards.radius[r],r>=3||save.coins<rewards.radius[r],()=>buy('radius',r,rewards.radius[r]));
    makeItem(ul,'♢','Bouclier stellaire','Absorbe '+s+' collision(s) supplémentaires par expédition. Palier '+s+'/3.',rewards.shield[s],s>=3?'MAX':'✧ '+rewards.shield[s],s>=3||save.coins<rewards.shield[s],()=>buy('shield',s,rewards.shield[s]));
    [['✧','Harmonie originelle','Teinte turquoise, rose et or.',0],['✿','Nébuleuse sakura','Étoiles rosées et dorées.',450],['❈','Aurore boréale','Lueurs menthe et glacier.',700]].forEach(([icon,name,desc,cost],i)=>{
      const owned=save.skins.includes(i),equipped=save.skin===i;
      makeItem(sl,icon,name,desc,cost,equipped?'ÉQUIPÉ':owned?'ÉQUIPER':'✧ '+cost,equipped||(!owned&&save.coins<cost),()=>{
        if(owned){save.skin=i;storage();drawShop();message('Palette équipée !');}
        else buy('skin',i,cost);
      });
    });
  }
  function setOptions(){[['settingMusic','music'],['settingSound','sound'],['settingHaptics','haptics'],['settingReduced','reduced']].forEach(([id,key])=>$(id).checked=!!save.settings[key]);}
  function back(){if(screen==='play'){if(!$('coach').classList.contains('hidden'))return;$('gameOverlay').classList.contains('hidden')?pauseMenu():go('home');}else go('home');}
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $('playBtn').addEventListener('click',()=>openSession('campaign'));
  $('dailyBtn').addEventListener('click',()=>openSession('daily'));
  $('pauseBtn').addEventListener('click',pauseMenu);
  $('coachDismiss').addEventListener('click',()=>{save.tutorial=true;storage();paused=false;$('coach').classList.add('hidden');last=0;});
  $('pulseBtn').addEventListener('click',()=>{if(!paused&&game&&game.pulse()){audio.event('pulse');painter.event({kind:'pulse',x:360,y:570});updateHud();haptic(40);}});
  const canvas=$('gameCanvas');
  canvas.addEventListener('pointerdown',e=>{if(paused)return;audio.unlock();pointer={active:true,...canvasPos(e)};canvas.setPointerCapture(e.pointerId);e.preventDefault();},{passive:false});
  canvas.addEventListener('pointermove',e=>{if(!pointer.active||paused)return;Object.assign(pointer,canvasPos(e));e.preventDefault();},{passive:false});
  for(const k of ['pointercancel','pointerup','lostpointercapture'])canvas.addEventListener(k,()=>{pointer.active=false;});
  [['settingMusic','music'],['settingSound','sound'],['settingHaptics','haptics'],['settingReduced','reduced']].forEach(([id,key])=>$(id).addEventListener('change',e=>{save.settings[key]=e.target.checked;storage();audio.setPreferences(save.settings);}));
  $('resetBtn').addEventListener('click',()=>{if(confirm('Effacer définitivement les jardins, les éclats et tes achats en jeu ?')){save=structuredClone(D0);storage();go('home');message('Nouvelle aventure prête.');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(screen==='play'&&!paused)pauseMenu();audio.suspend();}else audio.resume();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back();}});
  window.astraBack=back;
  // Readonly testing interface: game logic remains in engine.js and is unit-tested separately.
  if(new URLSearchParams(location.search).has('test'))window.__astraTest={getSave:()=>structuredClone(save),getGame:()=>game,openSession,go};
  audio.setPreferences(save.settings);tally();setOptions();requestAnimationFrame(frame);
})();
