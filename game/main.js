/* AFTERGLOW / Neon District — moteur hors-ligne, assets open source crédités.
   Copyright (c) 2026 LayAdam corp. Tous droits réservés. */
(() => {
  'use strict';
  const C = 6, R = 7, TYPES = 5, MAX_LEVEL = 80;
  const COLORS = ['#52e6ff', '#ff6abf', '#ffd36d', '#72f5a9', '#b6a0ff'];
  const NAMES = ['AZUR', 'ROSE', 'OR', 'JADE', 'ASTRAL'];
  const DISTRICTS = ['LES TOITS', 'LE CANAL', 'NÉON PARK', 'LES ATELIERS', 'LE PHARE', 'LE DÔME', 'LE JARDIN', 'LE CŒUR'];
  const THEMES = [
    { name: 'Minuit', color: '#52e6ff', price: 0, bg: '#080b20' },
    { name: 'Sakura', color: '#ff8fcf', price: 300, bg: '#200b2b' },
    { name: 'Aurore', color: '#80ffc9', price: 600, bg: '#061e25' }
  ];
  const $ = (id) => document.getElementById(id);
  const dom = { city: $('city'), board: $('board'), coins: $('coins'), goals: $('goals'), moves: $('moves-label'), timer: $('timer-label'), title: $('level-title'), mode: $('mode-label'), progress: $('score-bar'), district: $('district-label'), power: $('power-label'), banner: $('city-banner'), combo: $('combo-text'), hint: $('hint-text'), secondary: $('secondary'), gameplay: $('gameplay'), mission: $('mission'), veil: $('modal-veil'), modal: $('modal'), toast: $('toast') };
  const bctx = dom.board.getContext('2d'), cctx = dom.city.getContext('2d');
  const STORAGE = 'afterglow.neondistrict.save.v1';
  const {BOOSTS,KEYS}=window.AfterglowSkills;
  const MILESTONES=[5,10,20,30,40,50,60,70,80];
  const QUESTS=[{id:'win',label:'Réactiver 1 secteur',target:1,reward:80},
    {id:'chain',label:'Créer 3 grandes chaînes (6+)',target:3,reward:70},
    {id:'power',label:'Déployer 2 pouvoirs',target:2,reward:65}];
  const fresh = () => ({version:1, level:1, coins:0, stars:{}, finished:0, theme:0, owned:[0], sound:true, music:true, haptics:true, reduceMotion:false, daily:{}, achievements:{}, game:null,
    inventory:{bomb:1,row:1,column:1,color:0},giftDate:'',missions:{date:'',win:0,chain:0,power:0,claimed:{}},milestones:{},streak:0});
  let data = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if (saved && saved.version === 1 && Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= MAX_LEVEL+1 && Number.isInteger(saved.coins) && saved.coins >= 0) {
      data = {...fresh(),...saved};
      if (!Array.isArray(data.owned)) data.owned=[0];
      if (!data.stars || typeof data.stars !== 'object') data.stars={};
      if(!data.inventory||typeof data.inventory!=='object')data.inventory=fresh().inventory;
      for(const p of KEYS)if(!safeCount(data.inventory[p]))data.inventory[p]=0;
      if(!data.missions||typeof data.missions!=='object')data.missions=fresh().missions;
      if(!data.milestones||typeof data.milestones!=='object')data.milestones={};
    }
  } catch (_) { /* Un stockage endommagé ne doit jamais bloquer le démarrage. */ }
  let game = null, view = 'play', selection = [], pointerId = null, modalOpen = false;
  let fx = [], popups = [], shockwaves = [], beamFX=[], falls = [], cityFlash = 0, now = 0, lastDropAt = -1000, toastTimer = 0;
  let activePower=null, hintPath=[],hintUntil=0,lastActivity=0,lastHint=-30000,lastClock=0,lastClockSave=0;
  function safeCount(n){return Number.isInteger(n)&&n>=0&&n<=9999;}
  const safeInteger = n => Number.isFinite(n) && Number.isInteger(n);
  const save = () => { try { data.game = game; localStorage.setItem(STORAGE, JSON.stringify(data)); } catch (_) { notify('Sauvegarde indisponible sur cet appareil'); } };
  const rand = () => {
    let x = (game.seedState | 0) || 0x76952;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    game.seedState = x | 0;
    return (x >>> 0) / 4294967296;
  };
  const randomInt = n => Math.floor(rand() * n);
  const hash = str => { let h = 2166136261; for (const ch of String(str)) {h ^= ch.charCodeAt(0);h=Math.imul(h,16777619);} return h | 0; };
  const gridIndex = (x,y) => y*C+x;
  const coords = i => ({x:i%C,y:Math.floor(i/C)});
  const adjacent = (a,b) => {const p=coords(a),q=coords(b);return Math.abs(p.x-q.x)+Math.abs(p.y-q.y)===1;};
  const dateKey = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clockText=seconds=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
  function ensureMissions(){if(data.missions.date!==dateKey())data.missions={date:dateKey(),win:0,chain:0,power:0,claimed:{}};}
  function questProgress(id,count=1){ensureMissions();data.missions[id]=Math.min(999,(data.missions[id]||0)+count);}

  function validGame(s) {
    return !!s && (s.mode === 'level' || s.mode === 'daily') && Array.isArray(s.tiles) && s.tiles.length === C*R && s.tiles.every(n=>safeInteger(n)&&n>=0&&n<TYPES) && safeInteger(s.moves) && s.moves>=0 && s.moves<=100 && safeInteger(s.seedState) && Array.isArray(s.targets) && (s.targets.length===2||s.targets.length===3) && s.targets.every(n=>safeInteger(n)&&n>=0&&n<TYPES) && Array.isArray(s.collected) && s.collected.length===TYPES && s.collected.every(n=>safeInteger(n)&&n>=0) && safeInteger(s.required) && s.required>=1 && s.required<=99 && safeInteger(s.score) && s.score>=0;
  }
  function hasMove(board) {
    const seen=new Uint8Array(C*R);
    for(let i=0;i<board.length;i++) {
      if(seen[i])continue;
      const col=board[i], group=[i]; seen[i]=1;
      for(let j=0;j<group.length;j++) {
        const p=coords(group[j]);
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const x=p.x+dx,y=p.y+dy;if(x<0||x>=C||y<0||y>=R)continue;
          const ix=gridIndex(x,y); if(!seen[ix]&&board[ix]===col){seen[ix]=1;group.push(ix);}
        }
      }
      if(group.length>=3)return true;
    }
    return false;
  }
  function makeTiles() {
    let tiles;
    for(let attempts=0;attempts<12;attempts++) {
      tiles=Array.from({length:C*R},()=>randomInt(TYPES));
      if(hasMove(tiles))return tiles;
    }
    tiles=Array.from({length:C*R},()=>randomInt(TYPES));
    const y=randomInt(R),x=randomInt(C-2), col=randomInt(TYPES);
    for(let z=0;z<3;z++)tiles[gridIndex(x+z,y)]=col;
    return tiles;
  }
  function newGame(mode='level',num=data.level) {
    const daily = mode === 'daily';
    const missionType=daily?'daily':num%7===0?'reactor':num%5===0?'triple':num%9===0?'express':'classic';
    const seed = hash(daily ? `DAILY-${dateKey()}-2026` : `CAMPAIGN-${num}-NEON`);
    const turns=daily?24:missionType==='express'?21+Math.floor((num-1)/20):26+Math.floor((num-1)/15);
    game = {mode, level:daily?0:Math.min(num,MAX_LEVEL), seedState:seed, tiles:[], targets:[], required:daily?15:missionType==='triple'?8+Math.floor((num-1)/18):Math.min(10+Math.floor((num-1)/5)*2,23), collected:[0,0,0,0,0], moves:turns, initialMoves:turns, score:0, combo:1, lastTurn:0, chains:0, bestChain:0,
      elapsed:0,charge:0,totalCharge:0,energyGoal:missionType==='reactor'?85:0,missionType,chargeRewards:0,powerUsed:0,revives:0};
    const a=randomInt(TYPES), b=(a+1+randomInt(TYPES-1))%TYPES;
    game.targets=[a,b];
    if(missionType==='triple'){const others=[0,1,2,3,4].filter(n=>n!==a&&n!==b);game.targets.push(others[randomInt(others.length)]);}
    game.tiles=makeTiles();selection=[];falls=[];lastDropAt=-1000;activePower=null;hintPath=[];lastActivity=performance.now();
    applyTheme();updateUI();save();
    showView('play');
  }
  function loadOrStart() {
    if (validGame(data.game) && data.game.moves>0) {
      game=data.game;game.elapsed=Number.isFinite(game.elapsed)?clamp(game.elapsed,0,86400):0;
      game.charge=Number.isInteger(game.charge)?clamp(game.charge,0,100):0;
      game.totalCharge=safeCount(game.totalCharge)?game.totalCharge:0;
      game.energyGoal=safeCount(game.energyGoal)?game.energyGoal:0;
      game.missionType=typeof game.missionType==='string'?game.missionType:'classic';
      game.chargeRewards=safeCount(game.chargeRewards)?game.chargeRewards:0;
      game.revives=safeCount(game.revives)?game.revives:0;
      game.powerUsed=safeCount(game.powerUsed)?game.powerUsed:0;
    }
    else newGame('level',Math.min(data.level,MAX_LEVEL));
    lastActivity=performance.now();ensureMissions();
    applyTheme(); updateUI(); showView('play');
    if (data.finished===0 && !data.achievements.tutorial) showWelcome();
  }
  function applyTheme() {
    const t=THEMES[data.theme]||THEMES[0];
    document.documentElement.style.setProperty('--cyan',t.color);
    document.documentElement.style.setProperty('--bg',t.bg);
    window.AfterglowAudio?.setOptions({sound:data.sound,music:data.music});
  }
  function updateUI() {
    if (!game)return;
    dom.coins.textContent=data.coins.toLocaleString('fr-FR');
    const typeLabel={classic:'',triple:'TRIPLE SIGNAL',reactor:'RÉACTEUR',express:'EXPRESS',daily:'DÉFI CHRONO'};
    dom.mode.textContent=game.mode==='daily'?'DÉFI CHRONO':'CAMPAGNE · '+(typeLabel[game.missionType]||String(Math.ceil(game.level/10)).padStart(2,'0'));
    dom.title.textContent=game.mode==='daily'?'ÉPREUVE DU JOUR':`NIVEAU ${String(game.level).padStart(2,'0')}`;
    dom.moves.textContent=game.moves;
    dom.timer.textContent=clockText(game.mode==='daily'?Math.max(0,150-game.elapsed):game.elapsed);
    dom.timer.parentElement?.classList.toggle('urgent',game.mode==='daily'&&game.elapsed>=120);
    dom.goals.innerHTML=game.targets.map(c=>{
      const done=game.collected[c]>=game.required;
      return `<div class="goal ${done?'done':''}"><span class="goal-dot" style="color:${COLORS[c]};background:${COLORS[c]}"></span><span>${Math.min(game.collected[c],game.required)} / ${game.required}</span>${done?'<span class="check">✓</span>':''}</div>`;
    }).join('')+(game.energyGoal?`<div class="goal reactor-goal"><span>⚡</span><span>${Math.min(game.totalCharge||0,game.energyGoal)} / ${game.energyGoal}</span></div>`:'');
    dom.goals.classList.toggle('triple',game.targets.length===3||game.energyGoal>0);
    const sum=game.targets.reduce((s,c)=>s+Math.min(game.collected[c],game.required),0);
    const extra=game.energyGoal?Math.min(game.totalCharge||0,game.energyGoal):0;
    dom.progress.style.width=`${Math.round((sum+extra)/(game.targets.length*game.required+game.energyGoal)*100)}%`;
    dom.combo.textContent=`COMBO x${game.combo}`;
    const chargeFill=$('charge-fill');if(chargeFill)chargeFill.style.width=`${clamp(game.charge||0,0,100)}%`;
    for(const p of KEYS){const count=$('count-'+p);if(count)count.textContent=data.inventory[p];}
    document.querySelectorAll('[data-power]').forEach(b=>{
      const p=b.dataset.power;b.classList.toggle('selected',activePower===p);b.classList.toggle('empty',!data.inventory[p]);
      b.setAttribute('aria-pressed',activePower===p?'true':'false');
    });
    dom.district.textContent=`DISTRICT ${String(Math.min(8,Math.ceil(Math.max(1,data.level)/10))).padStart(2,'0')} · ${DISTRICTS[Math.min(7,Math.floor((Math.max(1,data.level)-1)/10))]}`;
    dom.power.textContent=`${Math.round(data.finished/MAX_LEVEL*100)}% ÉCLAIRÉ`;
    dom.banner.innerHTML=data.finished===0?'<span class="pulse-dot"></span> LA VILLE ATTEND TON ÉTINCELLE':`<span class="pulse-dot"></span> ${data.finished} SECTEURS RÉACTIVÉS`;
  }
  function sfx(name, rate=1) {if(data.sound)window.AfterglowAudio?.play(name,rate);}
  function vibrate(ms=15) {if(data.haptics && navigator.vibrate)navigator.vibrate(ms);}
  function notify(msg) {dom.toast.textContent=msg;dom.toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>dom.toast.classList.remove('visible'),2200);}
  function openModal(html) {modalOpen=true;dom.modal.innerHTML=html;dom.veil.classList.remove('hidden');}
  function closeModal() {modalOpen=false;dom.veil.classList.add('hidden');}
  function showWelcome(){openModal(`<div class="hero-symbol">✦</div><span class="kicker">BIENVENUE À AFTERGLOW</span><h2>RÉVEILLE LA VILLE.</h2><p>Une cité entière s'est éteinte. Fais jaillir des réactions en chaîne pour rallumer ses quartiers.</p><ul><li>Glisse sur au moins <b>3 cristaux identiques</b>.</li><li>Collecte les <b>couleurs demandées</b> avant la fin des coups. Certains niveaux ajoutent une troisième couleur ou un réacteur !</li><li>Une chaîne de <b>6+</b> déclenche une onde spéciale ; une longue série recharge tes bonus.</li><li>Le bouton <b>INDICE</b> affiche un chemin. Après quelques secondes sans jouer, l'aide apparaît toute seule.</li><li>Les <b>bombes, lasers et prismes</b> ciblent un cristal et ne coûtent aucun coup.</li><li>Les victoires offrent des <b>éclats</b> à dépenser dans la boutique. Le chronomètre compte ton temps.</li></ul><div class="actions"><button class="action" id="begin">JE RALLUME LA VILLE</button></div><p class="fineprint">Hors ligne • Aucune dépense obligatoire • Pas de limite d'énergie</p>`);$('begin').onclick=()=>{data.achievements.tutorial=true;save();closeModal();sfx('win');};}
  function drawRound(ctx,x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
  function pickAt(e){const rect=dom.board.getBoundingClientRect(), x=(e.clientX-rect.left)/rect.width*600,y=(e.clientY-rect.top)/rect.height*700;const col=Math.floor((x-10)/(580/C)),row=Math.floor((y-10)/(680/R));return col>=0&&col<C&&row>=0&&row<R?gridIndex(col,row):-1;}
  function activity(){lastActivity=performance.now();hintPath=[];hintUntil=0;dom.hint.textContent='Glisse sur 3 cristaux identiques ou plus';}
  function giveHint(auto=false){
    if(!game||modalOpen||view!=='play'||game.moves<=0||activePower)return [];
    hintPath=window.AfterglowSkills.hint(game.tiles,game.targets,game.collected,game.required,C,R);
    if(hintPath.length>=3){hintUntil=performance.now()+3900;lastHint=performance.now();dom.hint.textContent='✨ Suis les cristaux surlignés';if(!auto)sfx('spark');}
    else if(!auto)notify('Aucun chemin détecté : le plateau se renouvelle après le prochain coup');
    return [...hintPath];
  }
  function selectPower(p){
    if(!game||modalOpen)return;
    if(!safeCount(data.inventory[p])||data.inventory[p]===0){notify('Pouvoir épuisé — retrouve-le en boutique !');showView('shop');return;}
    activePower=activePower===p?null:p;activity();
    if(activePower){notify(`${BOOSTS[p].name} : touche un cristal pour cibler`);sfx('spark');}
    updateUI();
  }
  function pointerDown(e){
    if(view!=='play'||modalOpen||!game||game.moves<=0||performance.now()-lastDropAt<350)return;
    const i=pickAt(e);if(i<0)return;
    if(activePower){const selected=activePower;activePower=null;usePower(selected,i);e.preventDefault();return;}
    activity();pointerId=e.pointerId;selection=[i];dom.board.setPointerCapture?.(e.pointerId);e.preventDefault();sfx('touch',.85);
  }
  function pointerMove(e){if(pointerId!==e.pointerId||!selection.length||modalOpen)return;const i=pickAt(e);if(i<0||i===selection.at(-1))return;
    if(selection.length>1&&i===selection.at(-2)){selection.pop();return;}
    if(selection.includes(i)||!adjacent(i,selection.at(-1))||game.tiles[i]!==game.tiles[selection[0]])return;
    selection.push(i);if(selection.length%2===0){sfx('link',Math.min(1.5,.92+selection.length*.055));vibrate(8);} e.preventDefault();
  }
  function pointerUp(e){if(pointerId!==e.pointerId)return;pointerId=null;const path=selection.slice();selection=[];if(path.length>=3)playPath(path);else if(path.length)notify('Relie 3 cristaux identiques au minimum');}
  dom.board.addEventListener('pointerdown',pointerDown);
  dom.board.addEventListener('pointermove',pointerMove);
  dom.board.addEventListener('pointerup',pointerUp);
  dom.board.addEventListener('pointercancel',()=>{pointerId=null;selection=[];});
  $('ask-hint').onclick=()=>giveHint(false);
  document.querySelectorAll('[data-power]').forEach(b=>b.onclick=()=>selectPower(b.dataset.power));
  function validPath(path){return path.length>=3 && path.every((p,i)=>safeInteger(p)&&p>=0&&p<C*R&&game.tiles[p]===game.tiles[path[0]]&&(i===0||(adjacent(p,path[i-1])&&!path.slice(0,i).includes(p))));}
  function playPath(path){
    if(!game||game.moves<=0||!validPath(path))return;
    const col=game.tiles[path[0]], removed=new Set(path),bonus=path.length>=6;
    if(bonus){
      const tail=coords(path.at(-1));for(let x=0;x<C;x++)removed.add(gridIndex(x,tail.y));
      beamFX.push({direction:'row',at:tail,start:performance.now(),color:COLORS[col]});
      if(path.length>=9){for(let y=0;y<R;y++)removed.add(gridIndex(tail.x,y));beamFX.push({direction:'column',at:tail,start:performance.now()+80,color:COLORS[col]});}
    }
    const age=performance.now(); const chainGap=age-game.lastTurn;
    game.combo=chainGap<6500?Math.min(5,game.combo+1):1;game.lastTurn=age;
    game.chains++;game.bestChain=Math.max(game.bestChain,path.length);
    if(path.length>=6)questProgress('chain');
    resolveClear(removed,{origin:path.at(-1),col,chainSize:path.length,bonus,countMove:true});
  }
  function usePower(power,index){
    if(!game||!KEYS.includes(power)||!safeCount(data.inventory[power])||data.inventory[power]<1||!safeInteger(index)||index<0||index>=C*R)return false;
    const removed=new Set(window.AfterglowSkills.cells(power,index,game.tiles,C,R));
    if(!removed.size)return false;
    data.inventory[power]--;game.powerUsed++;questProgress('power');
    game.combo=Math.min(5,game.combo+1);game.lastTurn=performance.now();
    activePower=null;activity();
    if(power==='row'||power==='column')beamFX.push({direction:power,at:coords(index),start:performance.now(),color:COLORS[game.tiles[index]]});
    resolveClear(removed,{origin:index,col:game.tiles[index],chainSize:0,bonus:power==='color',countMove:false,power});
    return true;
  }
  function resolveClear(removed,{origin,col,chainSize=0,bonus=false,countMove=true,power=null}){
    const age=performance.now();
    const tally=[0,0,0,0,0];
    for(const i of removed){const kind=game.tiles[i];if(kind>=0)tally[kind]++;emitBurst(i,kind,bonus?7:4);}
    for(let c=0;c<TYPES;c++)game.collected[c]+=tally[c];
    game.score+=removed.size*15*game.combo+(bonus?300:0)+(power?125:0);
    if(countMove)game.moves--;
    game.tiles=[...game.tiles];for(const i of removed)game.tiles[i]=-1;
    // Gravity is visually animated using per-tile source positions.
    const moved=Array(C*R).fill(null);
    for(let x=0;x<C;x++) {
      const items=[];for(let y=R-1;y>=0;y--)if(game.tiles[gridIndex(x,y)]>=0)items.push({kind:game.tiles[gridIndex(x,y)],source:y});
      let newCount=0;
      for(let y=R-1;y>=0;y--){
        const obj=items[R-1-y],newGem=!obj;
        game.tiles[gridIndex(x,y)]=newGem?randomInt(TYPES):obj.kind;
        if(!obj||obj.source!==y) moved[gridIndex(x,y)]={from:newGem?-1-newCount++:obj.source,delay:newGem?newCount*19:0};
      }
    }
    if(!hasMove(game.tiles))game.tiles=makeTiles();
    falls=moved;lastDropAt=age;
    shockwaves.push({x:10+(coords(origin).x+.5)*580/C,y:10+(coords(origin).y+.5)*680/R,start:age,color:COLORS[col],power:bonus?1.7:1});
    cityFlash=bonus?1:.52;
    if(power){popup(BOOSTS[power].name,300,350,COLORS[col]);sfx(power==='color'?'epic':power==='row'?'purchase':power==='column'?'win':'burst');vibrate(60);}
    else if(chainSize>=9) {data.achievements.bigChain=true;popup(`SUPER NOVA ×${chainSize}`,300,350,COLORS[col]);sfx('epic',1.1);vibrate(65);}
    else if(chainSize>=6) {data.achievements.bigChain=true;popup(`${chainSize} EN CHAÎNE !`,300,350,COLORS[col]);sfx('burst');vibrate(45);}
    else {popup(`+${removed.size*15*game.combo}`,300,380,COLORS[col]);sfx('collect',.85+chainSize*.035);vibrate(18);}
    if(countMove){
      const gained=Math.min(50,chainSize*5)+(bonus?15:0);
      game.charge=Math.min(100,(game.charge||0)+gained);
      game.totalCharge=Math.min(999,(game.totalCharge||0)+gained);
      if(game.charge>=100&&(game.chargeRewards||0)<1){
        game.charge=0;game.chargeRewards=1;
        const reward=game.level%2===0?'row':'bomb';data.inventory[reward]++;
        notify(`CHARGE NÉON ! +1 ${BOOSTS[reward].name}`);sfx('purchase');
      }
    }
    if(game.combo>=4)data.achievements.combo=true;
    updateUI();save();
    if(game.targets.every(c=>game.collected[c]>=game.required)&&(game.totalCharge||0)>=(game.energyGoal||0))setTimeout(winGame,480);
    else if(game.moves===0)setTimeout(loseGame,470);
  }
  function emitBurst(i,type,amount){if(data.reduceMotion)return;const p=coords(i),w=580/C,h=680/R;for(let j=0;j<amount;j++){const a=Math.random()*Math.PI*2,v=1+Math.random()*5;fx.push({x:10+(p.x+.5)*w,y:10+(p.y+.5)*h,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:40+Math.random()*25,type});}}
  function popup(label,x,y,color){popups.push({label,x,y,life:68,color});}
  function winGame(){if(modalOpen||!game||game.moves<0)return;
    const stars=game.moves>=Math.round(game.initialMoves*.45)?3:game.moves>=Math.round(game.initialMoves*.15)?2:1;
    const time=game.elapsed||0,speed=time<=80?35:time<=150?20:time<=240?10:0;
    const earned=45+stars*25+speed+Math.min(35,Math.floor(game.score/850));let first=true,credited=0;
    if(game.mode==='daily'){
      const day=dateKey(),record=data.daily[day];first=!record?.completed;
      const best=Math.max(record?.best||0,game.score);data.daily[day]={best,completed:true,stars:Math.max(stars,record?.stars||0),time:Math.min(time,record?.time||99999)};
      if(first){data.streak=Math.min(99,data.streak+1);credited=earned+75+Math.min(40,data.streak*8);data.coins+=credited;data.achievements.daily=true;questProgress('win');}
    }else{
      const k=String(game.level);first=!(k in data.stars);
      if(first){data.streak=Math.min(99,data.streak+1);credited=earned+Math.min(40,data.streak*8);data.coins+=credited;data.finished=Math.max(data.finished,game.level);questProgress('win');}
      else if(stars>data.stars[k]){credited=10*(stars-data.stars[k]);data.coins+=credited;}
      data.stars[k]=Math.max(stars,data.stars[k]||0);
      if(game.level>=data.level&&data.level<=MAX_LEVEL)data.level=Math.min(MAX_LEVEL+1,game.level+1);
    }
    game=null;save();updateCityOnly();cityFlash=2;
    const finalLevel=data.level>MAX_LEVEL;
    const unclaimed=MILESTONES.find(level=>data.finished>=level&&!data.milestones[level]);
    openModal(`<div class="hero-symbol">${finalLevel?'✺':'✦'}</div><span class="kicker">${finalLevel?'CAMPAGNE TERMINÉE':'SECTEUR RÉACTIVÉ'}</span><h2>${first?'LA VILLE REPREND VIE !':credited>0?'NOUVEAU RECORD !':'BRAVO, ENCORE !'}</h2><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="score">+${credited.toLocaleString('fr-FR')} <small style="font-size:17px;color:var(--gold)">✦</small></div><p>${first?'Un nouveau bâtiment s’illumine dans ta ville.':credited>0?'Tu as amélioré la maîtrise de ce secteur.':'Un secteur maîtrisé, tu peux retenter un meilleur score.'}</p><div class="rowstats"><div><b>${clockText(time)}</b><small>CHRONO</small></div><div><b>×${data.streak}</b><small>SÉRIE</small></div><div><b>${stars}/3</b><small>ÉTOILES</small></div></div>${unclaimed?'<p class="reward-notice">🎁 Coffre de quartier disponible dans VILLE !</p>':''}<div class="actions"><button class="action" id="next">${finalLevel?'REJOUER':'NIVEAU SUIVANT'}</button><button class="action alt" id="viewcity">RÉCOMPENSES / VILLE</button></div>`);
    $('next').onclick=()=>{closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));};
    $('viewcity').onclick=()=>{closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));showView('city');};
    sfx('win');
    if(!data.reduceMotion && window.confetti){
      const palette=['#52e6ff','#ff6abf','#ffd36d','#72f5a9','#b6a0ff'];
      window.confetti({particleCount:105,spread:87,startVelocity:42,gravity:.85,scalar:.84,colors:palette,origin:{y:.46},disableForReducedMotion:true});
    }
  }
  function updateCityOnly(){dom.coins.textContent=data.coins.toLocaleString('fr-FR');dom.power.textContent=`${Math.round(data.finished/MAX_LEVEL*100)}% ÉCLAIRÉ`;dom.banner.innerHTML=`<span class="pulse-dot"></span> ${data.finished} SECTEURS RÉACTIVÉS`;}
  function loseGame(){if(modalOpen||!game)return;const kind=game.mode,level=game.level;
    const timeOut=kind==='daily'&&game.elapsed>=150;
    openModal(`<div class="hero-symbol">◉</div><span class="kicker">${timeOut?'TEMPS ÉCOULÉ':'PLUS DE COUPS'}</span><h2>PRESQUE !</h2><p>${timeOut?'Les 2 min 30 du défi sont écoulées.':'Tes objectifs étaient tout proches.'} Tu peux retenter gratuitement ou utiliser tes éclats pour continuer.</p><div class="rowstats"><div><b>${game.score.toLocaleString('fr-FR')}</b><small>POINTS</small></div><div><b>${game.bestChain}</b><small>MAX CHAÎNE</small></div></div><div class="actions">${kind!=='daily'&&game.revives<1?`<button class="action gold" id="revive" ${data.coins<190?'disabled':''}>+3 COUPS · 190 ✦</button>`:''}<button class="action" id="retry">RÉESSAYER GRATUITEMENT</button><button class="action alt" id="exit">RETOUR À LA VILLE</button></div>`);
    if($('revive'))$('revive').onclick=()=>{if(data.coins<190||game.revives>=1)return;data.coins-=190;game.moves+=3;game.initialMoves+=3;game.revives++;save();closeModal();updateUI();sfx('purchase');notify('SECONDE CHANCE · +3 COUPS');};
    $('retry').onclick=()=>{data.streak=0;save();closeModal();newGame(kind,level);};
    $('exit').onclick=()=>{data.streak=0;save();closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));showView('city');};
    sfx('fail');
  }
  function showView(next){view=next;dom.secondary.classList.toggle('hidden',next==='play');dom.mission.classList.toggle('hidden',next!=='play');dom.gameplay.classList.toggle('hidden',next!=='play');
    document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-current',b.dataset.view===next?'page':'false');});
    if(next==='city')renderCityView();if(next==='daily')renderDailyView();if(next==='shop')renderShopView();if(next==='settings')renderSettingsView();
  }
  function renderCityView(){const completed=data.finished,distUnlocked=Math.max(1,Math.ceil(Math.max(1,completed)/10));
    dom.secondary.innerHTML=`<span class="eyebrow">TA MÉGALOPOLE VIVANTE</span><h2>LA CITÉ RENAÎT ✦</h2><p class="lead">Chaque niveau accompli rallume un secteur de ta ville. Explore les huit quartiers, collectionne les étoiles et transforme la nuit en spectacle.</p><div class="section-card"><span class="meta">PROGRESSION GLOBALE</span><h3>${completed} / ${MAX_LEVEL} secteurs éclairés</h3><div class="progress-track"><div style="width:${completed/MAX_LEVEL*100}%"></div></div><p>Étoiles obtenues : ${Object.values(data.stars).reduce((s,n)=>s+(Number(n)||0),0)} / ${MAX_LEVEL*3}</p></div><div class="district-grid">${DISTRICTS.map((d,i)=>`<div class="district ${i+1>distUnlocked?'locked':''}"><span class="number">QUARTIER ${String(i+1).padStart(2,'0')}</span><span class="symbol">${i+1>distUnlocked?'◇':i<distUnlocked-1?'✦':'✧'}</span><b>${d}</b><small>${clamp(completed-i*10,0,10)} / 10 secteurs</small></div>`).join('')}</div><div class="actions"><button class="action" id="continue">REPRENDRE LA PARTIE</button></div>`;
    const claimable=MILESTONES.filter(lv=>completed>=lv&&!data.milestones[lv]);
    const upcoming=MILESTONES.find(lv=>lv>completed);
    dom.secondary.innerHTML+=`<div class="section-card"><span class="meta">COFFRES DE QUARTIERS</span><h3>🎁 Récompenses de prestige</h3><p>Des éclats et des pouvoirs garantis à chaque palier. Aucun hasard ni achat obligatoire.</p>${claimable.map(lv=>`<div class="gift-card"><div><b>PALIER ${lv}</b><small>${120+lv*4} ✦ + 1 pouvoir spécial</small></div><button class="action small" data-claim-milestone="${lv}">RÉCUPÉRER</button></div>`).join('')}${upcoming?`<div class="gift-card dormant"><div><b>PROCHAIN COFFRE · ${upcoming}</b><small>${completed} / ${upcoming} secteurs éclairés</small></div><span>🔒</span></div>`:''}${!claimable.length&&!upcoming?'<p>Tous les coffres ont été récupérés !</p>':''}</div>`;
    $('continue').onclick=()=>showView('play');
    dom.secondary.querySelectorAll('[data-claim-milestone]').forEach(b=>b.onclick=()=>claimMilestone(Number(b.dataset.claimMilestone)));
  }
  function renderDailyView(){const key=dateKey(),record=data.daily[key],done=!!record?.completed;
    dom.secondary.innerHTML=`<span class="eyebrow">UN DÉFI PARTAGÉ POUR TOUS</span><h2>LE SIGNAL DU JOUR</h2><p class="lead">Même combinaison de départ pour tout le monde. Aucun abonnement, aucune connexion requise. Chaque jour, un nouveau puzzle, avec une seule règle : faire mieux qu'hier.</p><div class="section-card" style="text-align:center"><div style="font-size:42px;color:var(--gold);text-shadow:0 0 24px #ffd56e">◎</div><span class="meta">${escapeHTML(key)}</span><h3>${done?'MISSION ACCOMPLIE':'LA VILLE A BESOIN DE TOI'}</h3><p>Deux couleurs à collecter • 24 coups • Même grille pour tous</p>${done?`<div class="score" style="font-weight:900;font-size:28px;color:var(--cyan)">${record.best.toLocaleString('fr-FR')} pts</div><p>Meilleur score actuel</p>`:''}<div class="actions"><button class="action" id="startDaily">${done?'AMÉLIORER MON SCORE':'LANCER LE DÉFI'}</button></div></div><div class="section-card"><h3>✓ Pourquoi revenir ?</h3><p>Une nouvelle combinaison chaque jour, un score à dépasser et des récompenses en éclats pour ta première réussite quotidienne. Tes progrès ne dépendent jamais d'une connexion.</p>${done?'<button class="action alt" id="share">PARTAGER MON SCORE</button>':''}</div>`;
    ensureMissions();
    dom.secondary.innerHTML+=`<div class="section-card"><span class="meta">MISSIONS DU JOUR</span><h3>Contrats de la cité</h3><p>Trois objectifs renouvelés chaque jour pour gagner des éclats et équiper tes pouvoirs.</p>${QUESTS.map(q=>{const n=Math.min(q.target,data.missions[q.id]||0),claimed=!!data.missions.claimed[q.id];return `<div class="quest-row"><div><b>${q.label}</b><small>${n}/${q.target} · Récompense ${q.reward} ✦</small><div class="quest-progress"><span style="width:${n/q.target*100}%"></span></div></div><button data-claim-quest="${q.id}" class="action small" ${n<q.target||claimed?'disabled':''}>${claimed?'OBTENU':'RÉCUPÉRER'}</button></div>`;}).join('')}</div>`;
    $('startDaily').onclick=()=>newGame('daily');
    if(done)$('share').onclick=()=>shareDaily(record.best,key);
    dom.secondary.querySelectorAll('[data-claim-quest]').forEach(b=>b.onclick=()=>claimMission(b.dataset.claimQuest));
  }
  function claimMilestone(lv){
    if(!MILESTONES.includes(lv)||data.finished<lv||data.milestones[lv])return false;
    data.milestones[lv]=true;
    const reward=120+lv*4,power=lv>=10?'color':'bomb';
    data.coins+=reward;data.inventory[power]++;
    save();updateCityOnly();sfx('win');notify(`COFFRE ${lv} · +${reward} ✦ et +1 ${BOOSTS[power].name}`);
    if(view==='city')renderCityView();return true;
  }
  function claimMission(id){
    ensureMissions();const quest=QUESTS.find(q=>q.id===id);
    if(!quest||data.missions.claimed[id]||(data.missions[id]||0)<quest.target)return false;
    data.missions.claimed[id]=true;data.coins+=quest.reward;
    save();updateCityOnly();sfx('purchase');notify(`MISSION ACCOMPLIE · +${quest.reward} ✦`);
    if(view==='daily')renderDailyView();return true;
  }
  function claimDailyGift(){
    if(data.giftDate===dateKey())return false;
    data.giftDate=dateKey();data.coins+=75;data.inventory.bomb++;
    save();updateCityOnly();sfx('win');notify('CADEAU DU JOUR · +75 ✦ et +1 BOMBE NOVA');
    if(view==='shop')renderShopView();return true;
  }
  function purchase(p){
    const b=BOOSTS[p];if(!b)return false;
    if(data.coins<b.price){notify(`Il te manque ${b.price-data.coins} éclats`);sfx('fail');return false;}
    data.coins-=b.price;data.inventory[p]++;
    save();updateCityOnly();sfx('purchase');notify(`${b.name} ajouté à ton inventaire`);
    if(game)updateUI();if(view==='shop')renderShopView();return true;
  }
  function purchasePack(){
    const price=295;if(data.coins<price){notify(`Il te manque ${price-data.coins} éclats`);return false;}
    data.coins-=price;for(const p of ['bomb','row','column'])data.inventory[p]++;
    save();updateCityOnly();sfx('purchase');notify('PACK TACTIQUE : 3 pouvoirs ajoutés');
    if(game)updateUI();if(view==='shop')renderShopView();return true;
  }
  function renderShopView(){
    const giftReady=data.giftDate!==dateKey();
    dom.secondary.innerHTML=`<span class="eyebrow">TON ARSENAL / TES RÉCOMPENSES</span><h2>LE COMPTOIR NÉON</h2><p class="lead">Transforme tes victoires en pouvoirs. Les éclats sont gagnés uniquement en jouant : aucune carte bancaire, aucune publicité.</p><div class="wallet-card"><span>TON SOLDE</span><b>✦ ${data.coins.toLocaleString('fr-FR')}</b></div><div class="section-card gift-section"><span class="meta">RENDEZ-VOUS QUOTIDIEN</span><h3>🎁 Le colis lumineux</h3><p>75 éclats + 1 bombe garantis chaque jour, gratuitement.</p><button class="action" id="claimGift" ${giftReady?'':'disabled'}>${giftReady?'OUVRIR MON CADEAU':'CADEAU DÉJÀ RÉCUPÉRÉ'}</button></div><div class="shop-grid">${KEYS.map(p=>{const b=BOOSTS[p];return `<div class="shop-card"><div class="shop-symbol ${p}">${b.symbol}</div><span class="meta">EN STOCK : ${data.inventory[p]}</span><h3>${b.name}</h3><p>${b.description}</p><button class="action small" data-buy="${p}" ${data.coins<b.price?'disabled':''}>ACHETER · ${b.price} ✦</button></div>`;}).join('')}</div><div class="section-card bundle-card"><span class="meta">ÉCONOMISE 55 ✦</span><h3>✦ Pack tactique</h3><p>1 Bombe Nova + 1 Laser H + 1 Laser V. Prix unitaire total 350 éclats.</p><button class="action gold" id="buyPack" ${data.coins<295?'disabled':''}>PACK 3 POUVOIRS · 295 ✦</button></div><div class="section-card"><h3>Récompenses de la cité</h3><p>Réactive des secteurs, réalise des missions, augmente ta série de victoires et ouvre les coffres de quartier pour obtenir de nouveaux pouvoirs.</p><button class="action alt" id="returnPlay">RETOURNER AU JEU</button></div>`;
    $('claimGift').onclick=claimDailyGift;
    dom.secondary.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>purchase(b.dataset.buy));
    $('buyPack').onclick=purchasePack;
    $('returnPlay').onclick=()=>showView('play');
  }
  function shareDaily(score,key){const msg=`✦ AFTERGLOW — ${key}\nDéfi néon : ${score} points !\nArriveras-tu à rallumer la ville ? #AfterglowGame`;
    if(navigator.share)navigator.share({text:msg}).catch(()=>{});
    else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).then(()=>notify('Score copié')).catch(()=>notify(msg));
    else notify(msg);
  }
  function settingButton(name,desc,prop){return `<div class="setting-row"><div><b>${name}</b><small>${desc}</small></div><button class="toggle ${data[prop]?'on':''}" data-setting="${prop}" aria-pressed="${data[prop]}">${data[prop]?'ACTIF':'OFF'}</button></div>`;}
  function renderSettingsView(){dom.secondary.innerHTML=`<span class="eyebrow">TON EXPÉRIENCE</span><h2>PERSONNALISER</h2><div class="section-card"><h3>Ambiance cinématique</h3>${settingButton('Musique originale','Electro-ambient adaptative en boucle','music')}${settingButton('Effets sonores HD','Échantillons Kenney CC0, mixés avec Howler.js','sound')}${settingButton('Vibrations','Retour tactile Android','haptics')}${settingButton('Animations réduites','Confort visuel et économie d’énergie','reduceMotion')}</div><div class="section-card"><h3>Apparence du jeu</h3><p>Débloque des ambiances en jouant, sans achat réel.</p><div class="theme-grid">${THEMES.map((t,i)=>`<button class="theme-choice ${data.theme===i?'active':''}" data-theme="${i}"><span class="swatch" style="background:${t.color};color:${t.color}"></span>${t.name}<small>${data.owned.includes(i)?data.theme===i?'ÉQUIPÉ':'ACQUIS':`${t.price} ✦`}</small></button>`).join('')}</div></div><div class="section-card"><h3>À propos</h3><p>AFTERGLOW — Neon District · v1.2.0</p><p>© 2026 LayAdam corp. Jeu hors ligne sans publicité ni compte utilisateur. Sauvegarde locale à chaque coup. Ressources ouvertes et licences dans THIRD_PARTY.md.</p><button class="action alt" id="rules">REVOIR LES RÈGLES</button></div><div class="section-card"><h3>Progression</h3><p>Les données sont conservées exclusivement sur cet appareil. Attention : effacer le stockage de l'application peut supprimer ta progression.</p><button class="action alt" id="reset">EFFACER MA PARTIE</button></div>`;
    dom.secondary.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>{data[b.dataset.setting]=!data[b.dataset.setting];window.AfterglowAudio?.setOptions({sound:data.sound,music:data.music});save();renderSettingsView();sfx('menu');});
    dom.secondary.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>selectTheme(Number(b.dataset.theme)));
    $('rules').onclick=showWelcome;
    $('reset').onclick=()=>openModal(`<div class="hero-symbol">⚠</div><h2>REPARTIR DE ZÉRO ?</h2><p>Cette opération supprimera définitivement tes niveaux, étoiles, défis et éclats sur cet appareil.</p><div class="actions"><button class="action alt" id="cancelReset">ANNULER</button><button class="action gold" id="confirmReset">TOUT EFFACER</button></div>`);
    // Les actions du dialogue sont branchées après sa création.
    const oldOpen=$('reset').onclick;
    $('reset').onclick=()=>{oldOpen();$('cancelReset').onclick=closeModal;$('confirmReset').onclick=()=>{data=fresh();game=null;save();closeModal();newGame();renderSettingsView();notify('Progression réinitialisée');};};
  }
  function selectTheme(i){const t=THEMES[i];if(!t)return;
    if(!data.owned.includes(i)){if(data.coins<t.price){notify(`Il manque ${t.price-data.coins} éclats`);return;}data.coins-=t.price;data.owned.push(i);}
    data.theme=i;applyTheme();save();updateCityOnly();renderSettingsView();sfx('purchase');
  }
  for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{if(!modalOpen){sfx('menu');showView(b.dataset.view);}};
  window.afterglowBack=()=>{if(modalOpen)closeModal();else if(activePower){activePower=null;updateUI();}else if(view!=='play')showView('play');else openModal(`<div class="hero-symbol">◈</div><h2>UNE PAUSE ?</h2><p>Ta partie est sauvegardée automatiquement. Tu peux reprendre plus tard, exactement au même endroit.</p><div class="actions"><button class="action" id="resume">REPRENDRE</button><button class="action alt" id="goCity">VOIR MA VILLE</button></div>`),$('resume').onclick=closeModal,$('goCity').onclick=()=>{closeModal();showView('city');};};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();window.afterglowBack();}});

  function drawGem(i,x,y,w,h,t){
    if(game.tiles[i]===undefined)return;
    const falling=falls[i],age=t-lastDropAt;
    if(falling && age<380){
      const p=clamp((age-falling.delay)/280,0,1);
      y+=(falling.from-Math.floor(i/C))*h*(1-window.AfterglowArt.ease(p));
    }
    window.AfterglowArt.crystal(bctx,game.tiles[i],x,y,w,h,t,selection.includes(i));
  }
  function drawBoard(t){if(!game||view!=='play')return;const W=600,H=700,w=580/C,h=680/R;
    bctx.clearRect(0,0,W,H);
    const grad=bctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#243663');grad.addColorStop(.43,'#131d3c');grad.addColorStop(1,'#080f2a');drawRound(bctx,0,0,W,H,18,grad);
    bctx.save();bctx.globalAlpha=.17;bctx.strokeStyle='#639bd7';bctx.lineWidth=1;
    for(let z=0;z<28;z++){const xx=(z*103)%W,yy=(z*199)%H;bctx.beginPath();bctx.arc(xx,yy,9+(z%5)*18,0,Math.PI*2);bctx.stroke();}bctx.restore();
    for(let y=0;y<R;y++)for(let x=0;x<C;x++){
      const px=10+x*w,py=10+y*h;drawRound(bctx,px+1,py+1,w-2,h-2,18,'#09102b9a');
      bctx.strokeStyle='#8db6ee12';bctx.lineWidth=1;bctx.beginPath();bctx.roundRect(px+2,py+2,w-4,h-4,18);bctx.stroke();
    }
    if(selection.length>1){bctx.beginPath();const a=coords(selection[0]);bctx.moveTo(10+(a.x+.5)*w,10+(a.y+.5)*h);for(let i=1;i<selection.length;i++){const p=coords(selection[i]);bctx.lineTo(10+(p.x+.5)*w,10+(p.y+.5)*h);}
      bctx.lineJoin='round';bctx.lineCap='round';bctx.shadowColor=COLORS[game.tiles[selection[0]]];bctx.shadowBlur=32;bctx.strokeStyle=COLORS[game.tiles[selection[0]]];bctx.lineWidth=23;bctx.globalAlpha=.52;bctx.stroke();bctx.globalAlpha=1;bctx.shadowBlur=0;bctx.strokeStyle='#fff';bctx.lineWidth=6;bctx.stroke();
    }
    for(let y=0;y<R;y++)for(let x=0;x<C;x++)drawGem(gridIndex(x,y),10+x*w,10+y*h,w,h,t);
    if(hintPath.length>=3&&hintUntil>t&&!selection.length){
      bctx.save();bctx.strokeStyle='#fff5ab';bctx.shadowColor='#ffe982';bctx.shadowBlur=25;
      bctx.setLineDash([9,10]);bctx.lineDashOffset=-t*.026;bctx.lineWidth=7;bctx.lineCap='round';bctx.lineJoin='round';bctx.beginPath();
      hintPath.forEach((i,z)=>{const p=coords(i),cx=10+(p.x+.5)*w,cy=10+(p.y+.5)*h;if(z===0)bctx.moveTo(cx,cy);else bctx.lineTo(cx,cy);});bctx.stroke();bctx.setLineDash([]);
      for(const i of hintPath){const p=coords(i);bctx.beginPath();bctx.arc(10+(p.x+.5)*w,10+(p.y+.5)*h,31+Math.sin(t*.01)*3,0,Math.PI*2);bctx.strokeStyle='#fff2ac';bctx.lineWidth=3;bctx.stroke();}
      bctx.restore();
    }
    beamFX=beamFX.filter(s=>t-s.start<580);
    for(const b of beamFX){const a=Math.max(0,1-(t-b.start)/580);bctx.save();bctx.globalAlpha=a;bctx.shadowColor=b.color;bctx.shadowBlur=36;bctx.fillStyle=b.color;
      if(b.direction==='row')bctx.fillRect(0,10+(b.at.y+.5)*h-14,600,28);
      else bctx.fillRect(10+(b.at.x+.5)*w-14,0,28,700);
      bctx.fillStyle='#fff';if(b.direction==='row')bctx.fillRect(0,10+(b.at.y+.5)*h-3,600,6);else bctx.fillRect(10+(b.at.x+.5)*w-3,0,6,700);
      bctx.restore();
    }
    shockwaves=shockwaves.filter(s=>t-s.start<640);
    for(const s of shockwaves){const p=clamp((t-s.start)/640,0,1);bctx.globalAlpha=(1-p)*.7;bctx.strokeStyle=s.color;bctx.shadowColor=s.color;bctx.shadowBlur=22;bctx.lineWidth=5*(1-p)+1;bctx.beginPath();bctx.arc(s.x,s.y,(16+p*210)*s.power,0,Math.PI*2);bctx.stroke();}bctx.globalAlpha=1;bctx.shadowBlur=0;
    fx=fx.filter(p=>p.life>0);for(const p of fx){p.x+=p.vx;p.y+=p.vy;p.vy+=.14;p.life-=1;bctx.globalAlpha=clamp(p.life/45,0,1);bctx.fillStyle=COLORS[p.type];bctx.shadowColor=COLORS[p.type];bctx.shadowBlur=13;bctx.beginPath();bctx.arc(p.x,p.y,clamp(p.life/12,1,4.5),0,Math.PI*2);bctx.fill();}bctx.globalAlpha=1;bctx.shadowBlur=0;
    popups=popups.filter(p=>p.life>0);for(const p of popups){p.life-=1;p.y-=1.4;bctx.globalAlpha=clamp(p.life/28,0,1);bctx.fillStyle=p.color;bctx.font='900 31px system-ui';bctx.textAlign='center';bctx.shadowColor=p.color;bctx.shadowBlur=15;bctx.fillText(p.label,p.x,p.y);}bctx.globalAlpha=1;bctx.shadowBlur=0;
  }
  function seededHash(n){let x=(n*2654435761)|0;x=Math.imul(x^(x>>>16),2246822507);return((x^(x>>>13))>>>0)/4294967296;}
  function drawCityLegacy(t){const ctx=cctx,W=720,H=310,progress=data.finished/MAX_LEVEL;ctx.clearRect(0,0,W,H);
    let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,THEMES[data.theme]?.bg||'#09152f');sky.addColorStop(.62,'#20214f');sky.addColorStop(1,'#132846');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.save();for(let i=0;i<46;i++){const x=seededHash(i+4)*W,y=seededHash(i+225)*190;ctx.globalAlpha=.3+seededHash(i+54)*.55;ctx.fillStyle=i%4?'#9dc9ff':'#ffffff';ctx.fillRect(x,y,1.5+seededHash(i+100)*2,1.5+seededHash(i+100)*2);}ctx.restore();
    ctx.shadowColor=THEMES[data.theme]?.color||'#54e6ff';ctx.shadowBlur=32;ctx.fillStyle='#8fafff';ctx.beginPath();ctx.arc(570,69,31,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    for(let layer=0;layer<2;layer++){
      for(let i=0;i<23;i++){
        const bx=i*35-22+layer*14,bw=26+seededHash(i+220+layer)*25;
        const bh=(layer===0?75:132)+seededHash(i+20+layer)*74,by=H-44-bh+layer*10;
        ctx.fillStyle=layer===0?'#141b38':'#0c1430';ctx.fillRect(bx,by,bw,bh);
        ctx.fillStyle='#27385c';ctx.fillRect(bx+3,by+4,bw-6,3);
        const lit=progress>0 && i/23+(layer*.026)<progress*.98+0.14;
        for(let wy=by+13;wy<by+bh-8;wy+=16)for(let wx=bx+7;wx<bx+bw-5;wx+=12){
          const seed=Math.floor((wx+101)*13+(wy+133)*7);
          const on=lit&&seededHash(seed)>.34;
          ctx.fillStyle=on?(seed%3?'#50e5ef':'#ff99c8'):'#253252';ctx.globalAlpha=on?.75+Math.sin(t*.001+seed)*.1:.62;
          ctx.fillRect(wx,wy,6,8);
        }ctx.globalAlpha=1;
        if(lit&&layer===1&&i%4===0){ctx.shadowColor='#58ecff';ctx.shadowBlur=18;ctx.fillStyle='#54cce9';ctx.fillRect(bx+5,by+4,bw-10,2);ctx.shadowBlur=0;}
      }
    }
    ctx.fillStyle='#10182d';ctx.fillRect(0,H-45,W,45);
    ctx.fillStyle='#546789';ctx.fillRect(0,H-44,W,2);
    ctx.fillStyle='#b7c3dc66';for(let x=0;x<W;x+=70)ctx.fillRect((x+t*.024)%W,H-25,32,2);
    if(progress>.03){for(let k=0;k<3;k++){const x=(t*.035*(k+1)+k*210)%850-40;ctx.shadowBlur=18;ctx.shadowColor=COLORS[k];ctx.fillStyle=COLORS[k];drawRound(ctx,x,H-30+k*4,27,10,3,COLORS[k]);ctx.shadowBlur=0;}}
    if(cityFlash>0){ctx.fillStyle=`rgba(91,238,255,${Math.min(.3,cityFlash*.12)})`;ctx.fillRect(0,0,W,H);cityFlash=Math.max(0,cityFlash-.017);}
  }
  function drawCity(t){window.AfterglowArt.city(cctx,t,data.finished/MAX_LEVEL,THEMES[data.theme]||THEMES[0],cityFlash,data.reduceMotion);cityFlash=Math.max(0,cityFlash-.017);}
  let frame=0,lastTimeSaved=0;
  function tick(t){
    now=t;
    const delta=lastClock?clamp((t-lastClock)/1000,0,.25):0;lastClock=t;
    if(!document.hidden){
      if(game&&view==='play'&&!modalOpen){
        game.elapsed+=delta;
        if(t-lastClockSave>=450){dom.timer.textContent=clockText(game.mode==='daily'?Math.max(0,150-game.elapsed):game.elapsed);lastClockSave=t;}
        if(game.mode==='daily'&&game.elapsed>=150){game.elapsed=150;save();loseGame();}
        if(!activePower&&t-lastActivity>11000&&t-lastHint>22000)giveHint(true);
        if(t-lastTimeSaved>9000){save();lastTimeSaved=t;}
      }
      drawCity(data.reduceMotion?0:t);
      if(!data.reduceMotion||frame++%6===0)drawBoard(t);
    }
    requestAnimationFrame(tick);
  }
  // État de test disponible uniquement avec ?test=1 : aucun accès réseau ni privilège.
  if(new URLSearchParams(location.search).has('test'))window.__afterglowTest={
    state:()=>JSON.parse(JSON.stringify({data,game,view,modalOpen,activePower,hintPath})),
    start:newGame,playPath,usePower,giveHint,purchase,purchasePack,claimDailyGift,claimMission,claimMilestone,hasMove,
    render:()=>{drawCity(1000);drawBoard(1000);},win:winGame,lose:loseGame,show:showView
  };
  loadOrStart();requestAnimationFrame(tick);
})();
