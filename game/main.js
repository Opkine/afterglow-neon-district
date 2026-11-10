/* AFTERGLOW / Neon District — 100% offline, sans bibliothèque externe.
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
  const dom = { city: $('city'), board: $('board'), coins: $('coins'), goals: $('goals'), moves: $('moves-label'), title: $('level-title'), mode: $('mode-label'), progress: $('score-bar'), district: $('district-label'), power: $('power-label'), banner: $('city-banner'), combo: $('combo-text'), hint: $('hint-text'), secondary: $('secondary'), gameplay: $('gameplay'), mission: $('mission'), veil: $('modal-veil'), modal: $('modal'), toast: $('toast') };
  const bctx = dom.board.getContext('2d'), cctx = dom.city.getContext('2d');
  const STORAGE = 'afterglow.neondistrict.save.v1';
  const fresh = () => ({version:1, level:1, coins:0, stars:{}, finished:0, theme:0, owned:[0], sound:true, haptics:true, reduceMotion:false, daily:{}, achievements:{}, game:null});
  let data = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if (saved && saved.version === 1 && Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= MAX_LEVEL+1 && Number.isInteger(saved.coins) && saved.coins >= 0) {
      data = {...fresh(),...saved};
      if (!Array.isArray(data.owned)) data.owned=[0];
      if (!data.stars || typeof data.stars !== 'object') data.stars={};
    }
  } catch (_) { /* Un stockage endommagé ne doit jamais bloquer le démarrage. */ }
  let game = null, view = 'play', selection = [], pointerId = null, modalOpen = false;
  let fx = [], popups = [], cityFlash = 0, now = 0, audio = null, toastTimer = 0;
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

  function validGame(s) {
    return !!s && (s.mode === 'level' || s.mode === 'daily') && Array.isArray(s.tiles) && s.tiles.length === C*R && s.tiles.every(n=>safeInteger(n)&&n>=0&&n<TYPES) && safeInteger(s.moves) && s.moves>=0 && s.moves<=100 && safeInteger(s.seedState) && Array.isArray(s.targets) && s.targets.length===2 && s.targets.every(n=>safeInteger(n)&&n>=0&&n<TYPES) && Array.isArray(s.collected) && s.collected.length===TYPES && s.collected.every(n=>safeInteger(n)&&n>=0) && safeInteger(s.required) && s.required>=1 && s.required<=99 && safeInteger(s.score) && s.score>=0;
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
    const seed = hash(daily ? `DAILY-${dateKey()}-2026` : `CAMPAIGN-${num}-NEON`);
    game = {mode, level:daily?0:Math.min(num,MAX_LEVEL), seedState:seed, tiles:[], targets:[], required:daily?15:Math.min(10+Math.floor((num-1)/5)*2,23), collected:[0,0,0,0,0], moves:daily?24:26+Math.floor((num-1)/15), initialMoves:daily?24:26+Math.floor((num-1)/15), score:0, combo:1, lastTurn:0, chains:0, bestChain:0};
    const a=randomInt(TYPES), b=(a+1+randomInt(TYPES-1))%TYPES;
    game.targets=[a,b];game.tiles=makeTiles();selection=[];
    applyTheme();updateUI();save();
    showView('play');
  }
  function loadOrStart() {
    if (validGame(data.game) && data.game.moves>0) game=data.game;
    else newGame('level',Math.min(data.level,MAX_LEVEL));
    applyTheme(); updateUI(); showView('play');
    if (data.finished===0 && !data.achievements.tutorial) showWelcome();
  }
  function applyTheme() {
    const t=THEMES[data.theme]||THEMES[0];
    document.documentElement.style.setProperty('--cyan',t.color);
    document.documentElement.style.setProperty('--bg',t.bg);
  }
  function updateUI() {
    if (!game)return;
    dom.coins.textContent=data.coins.toLocaleString('fr-FR');
    dom.mode.textContent=game.mode==='daily'?'DÉFI QUOTIDIEN':'CAMPAGNE · '+String(Math.ceil(game.level/10)).padStart(2,'0');
    dom.title.textContent=game.mode==='daily'?'ÉPREUVE DU JOUR':`NIVEAU ${String(game.level).padStart(2,'0')}`;
    dom.moves.textContent=game.moves;
    dom.goals.innerHTML=game.targets.map(c=>{
      const done=game.collected[c]>=game.required;
      return `<div class="goal ${done?'done':''}"><span class="goal-dot" style="color:${COLORS[c]};background:${COLORS[c]}"></span><span>${Math.min(game.collected[c],game.required)} / ${game.required}</span>${done?'<span class="check">✓</span>':''}</div>`;
    }).join('');
    const sum=game.targets.reduce((s,c)=>s+Math.min(game.collected[c],game.required),0);
    dom.progress.style.width=`${Math.round(sum/(2*game.required)*100)}%`;
    dom.combo.textContent=`COMBO x${game.combo}`;
    dom.district.textContent=`DISTRICT ${String(Math.min(8,Math.ceil(Math.max(1,data.level)/10))).padStart(2,'0')} · ${DISTRICTS[Math.min(7,Math.floor((Math.max(1,data.level)-1)/10))]}`;
    dom.power.textContent=`${Math.round(data.finished/MAX_LEVEL*100)}% ÉCLAIRÉ`;
    dom.banner.innerHTML=data.finished===0?'<span class="pulse-dot"></span> LA VILLE ATTEND TON ÉTINCELLE':`<span class="pulse-dot"></span> ${data.finished} SECTEURS RÉACTIVÉS`;
  }
  function sound(freq=470,duration=.08,type='sine',volume=.045) {
    if(!data.sound)return;
    try {
      audio ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume();
      const o=audio.createOscillator(),g=audio.createGain();o.type=type;
      o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(70,freq*.75),audio.currentTime+duration);
      g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);
      o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.01);
    }catch(_){ /* Audio optionnel */ }
  }
  function vibrate(ms=15) {if(data.haptics && navigator.vibrate)navigator.vibrate(ms);}
  function notify(msg) {dom.toast.textContent=msg;dom.toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>dom.toast.classList.remove('visible'),2200);}
  function openModal(html) {modalOpen=true;dom.modal.innerHTML=html;dom.veil.classList.remove('hidden');}
  function closeModal() {modalOpen=false;dom.veil.classList.add('hidden');}
  function showWelcome(){openModal(`<div class="hero-symbol">✦</div><span class="kicker">BIENVENUE À AFTERGLOW</span><h2>RÉVEILLE LA VILLE.</h2><p>Une cité entière s'est éteinte. Fais jaillir des réactions en chaîne pour rallumer ses quartiers.</p><ul><li>Glisse d'un cristal à un voisin <b>de la même couleur</b>.</li><li>Relie au moins <b>3 cristaux</b> pour les collecter.</li><li>Remplis les <b>deux objectifs colorés</b> avant la fin des coups.</li><li>Une chaîne de <b>6+</b> déclenche une onde explosive !</li></ul><div class="actions"><button class="action" id="begin">JE RALLUME LA VILLE</button></div><p class="fineprint">Hors ligne • Pas de compte • Pas de limite d'énergie</p>`);$('begin').onclick=()=>{data.achievements.tutorial=true;save();closeModal();sound(640);};}
  function drawRound(ctx,x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();}
  function pickAt(e){const rect=dom.board.getBoundingClientRect(), x=(e.clientX-rect.left)/rect.width*600,y=(e.clientY-rect.top)/rect.height*700;const col=Math.floor((x-10)/(580/C)),row=Math.floor((y-10)/(680/R));return col>=0&&col<C&&row>=0&&row<R?gridIndex(col,row):-1;}
  function pointerDown(e){if(view!=='play'||modalOpen||game.moves<=0)return;const i=pickAt(e);if(i<0)return;pointerId=e.pointerId;selection=[i];dom.board.setPointerCapture?.(e.pointerId);e.preventDefault();sound(330,.035,'sine',.012);}
  function pointerMove(e){if(pointerId!==e.pointerId||!selection.length||modalOpen)return;const i=pickAt(e);if(i<0||i===selection.at(-1))return;
    if(selection.length>1&&i===selection.at(-2)){selection.pop();return;}
    if(selection.includes(i)||!adjacent(i,selection.at(-1))||game.tiles[i]!==game.tiles[selection[0]])return;
    selection.push(i);if(selection.length%3===0){sound(380+selection.length*55,.04,'sine',.016);vibrate(8);} e.preventDefault();
  }
  function pointerUp(e){if(pointerId!==e.pointerId)return;pointerId=null;const path=selection.slice();selection=[];if(path.length>=3)playPath(path);else if(path.length)notify('Relie 3 cristaux identiques au minimum');}
  dom.board.addEventListener('pointerdown',pointerDown);
  dom.board.addEventListener('pointermove',pointerMove);
  dom.board.addEventListener('pointerup',pointerUp);
  dom.board.addEventListener('pointercancel',()=>{pointerId=null;selection=[];});
  function validPath(path){return path.length>=3 && path.every((p,i)=>safeInteger(p)&&p>=0&&p<C*R&&game.tiles[p]===game.tiles[path[0]]&&(i===0||(adjacent(p,path[i-1])&&!path.slice(0,i).includes(p))));}
  function playPath(path){
    if(!game||game.moves<=0||!validPath(path))return;
    const col=game.tiles[path[0]], removed=new Set(path),bonus=path.length>=6;
    if(bonus){const tail=coords(path.at(-1));for(let x=0;x<C;x++)removed.add(gridIndex(x,tail.y));if(path.length>=9)for(let y=0;y<R;y++)removed.add(gridIndex(tail.x,y));}
    const age=performance.now(); const chainGap=age-game.lastTurn;
    game.combo=chainGap<6500?Math.min(5,game.combo+1):1;game.lastTurn=age;
    const tally=[0,0,0,0,0];
    for(const i of removed){const kind=game.tiles[i];if(kind>=0)tally[kind]++;emitBurst(i,kind,bonus?7:4);}
    for(let c=0;c<TYPES;c++)game.collected[c]+=tally[c];
    game.score+=removed.size*15*game.combo+(bonus?300:0);
    game.chains++;game.bestChain=Math.max(game.bestChain,path.length);game.moves--;
    game.tiles=[...game.tiles];for(const i of removed)game.tiles[i]=-1;
    // Chute de chaque colonne, puis création déterministe de nouveaux cristaux.
    for(let x=0;x<C;x++) {
      const items=[];for(let y=R-1;y>=0;y--)if(game.tiles[gridIndex(x,y)]>=0)items.push(game.tiles[gridIndex(x,y)]);
      for(let y=R-1;y>=0;y--)game.tiles[gridIndex(x,y)]=R-1-y<items.length?items[R-1-y]:randomInt(TYPES);
    }
    if(!hasMove(game.tiles))game.tiles=makeTiles();
    cityFlash=bonus?1:.52;
    if(path.length>=6) {data.achievements.bigChain=true;popup(`${path.length} EN CHAÎNE !`,300,350,COLORS[col]);sound(880,.18,'triangle',.08);vibrate(45);}
    else {popup(`+${removed.size*15*game.combo}`,300,380,COLORS[col]);sound(480+path.length*70,.1,'sine',.045);vibrate(18);}
    if(game.combo>=4)data.achievements.combo=true;
    updateUI();save();
    if(game.targets.every(c=>game.collected[c]>=game.required))setTimeout(winGame,480);
    else if(game.moves===0)setTimeout(loseGame,470);
  }
  function emitBurst(i,type,amount){if(data.reduceMotion)return;const p=coords(i),w=580/C,h=680/R;for(let j=0;j<amount;j++){const a=Math.random()*Math.PI*2,v=1+Math.random()*5;fx.push({x:10+(p.x+.5)*w,y:10+(p.y+.5)*h,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:40+Math.random()*25,type});}}
  function popup(label,x,y,color){popups.push({label,x,y,life:68,color});}
  function winGame(){if(modalOpen||!game||game.moves<0)return;
    const stars=game.moves>=Math.round(game.initialMoves*.45)?3:game.moves>=Math.round(game.initialMoves*.15)?2:1;
    const earned=35+stars*20+Math.min(30,Math.floor(game.score/800));let first=true,credited=0;
    if(game.mode==='daily'){
      const day=dateKey(),record=data.daily[day];first=!record?.completed;
      const best=Math.max(record?.best||0,game.score);data.daily[day]={best,completed:true,stars:Math.max(stars,record?.stars||0)};
      if(first){credited=earned+75;data.coins+=credited;data.achievements.daily=true;}
    }else{
      const k=String(game.level);first=!(k in data.stars);
      if(first){credited=earned;data.coins+=credited;data.finished=Math.max(data.finished,game.level);}
      else if(stars>data.stars[k]){credited=10*(stars-data.stars[k]);data.coins+=credited;}
      data.stars[k]=Math.max(stars,data.stars[k]||0);
      if(game.level>=data.level&&data.level<=MAX_LEVEL)data.level=Math.min(MAX_LEVEL+1,game.level+1);
    }
    game=null;save();updateCityOnly();cityFlash=2;
    const finalLevel=data.level>MAX_LEVEL;
    openModal(`<div class="hero-symbol">${finalLevel?'✺':'✦'}</div><span class="kicker">${finalLevel?'CAMPAGNE TERMINÉE':'SECTEUR RÉACTIVÉ'}</span><h2>${first?'LA VILLE REPREND VIE !':credited>0?'NOUVEAU RECORD !':'BRAVO, ENCORE !'}</h2><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="score">${credited.toLocaleString('fr-FR')} <small style="font-size:17px;color:var(--gold)">✦</small></div><p>${first?'Un nouveau bâtiment s’illumine dans ta ville.':credited>0?'Tu as amélioré la maîtrise de ce secteur.':'Un secteur maîtrisé, tu peux retenter un meilleur score.'}</p><div class="rowstats"><div><b>${stars}/3</b><small>ÉTOILES</small></div><div><b>${data.finished}</b><small>SECTEURS</small></div></div><div class="actions"><button class="action" id="next">${finalLevel?'REJOUER':'NIVEAU SUIVANT'}</button><button class="action alt" id="viewcity">ADMIRER LA VILLE</button></div>`);
    $('next').onclick=()=>{closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));};
    $('viewcity').onclick=()=>{closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));showView('city');};
    for(let i=0;i<4;i++)setTimeout(()=>sound(650+i*140,.14,'triangle',.055),i*130);
  }
  function updateCityOnly(){dom.coins.textContent=data.coins.toLocaleString('fr-FR');dom.power.textContent=`${Math.round(data.finished/MAX_LEVEL*100)}% ÉCLAIRÉ`;dom.banner.innerHTML=`<span class="pulse-dot"></span> ${data.finished} SECTEURS RÉACTIVÉS`;}
  function loseGame(){if(modalOpen||!game)return;const kind=game.mode,level=game.level;
    openModal(`<div class="hero-symbol">◉</div><span class="kicker">PLUS D'ÉNERGIE</span><h2>PRESQUE !</h2><p>La ville est encore plongée dans la nuit. Tes objectifs étaient tout proches. Tu peux réessayer sans pénalité.</p><div class="rowstats"><div><b>${game.score.toLocaleString('fr-FR')}</b><small>POINTS</small></div><div><b>${game.bestChain}</b><small>MAX CHAÎNE</small></div></div><div class="actions"><button class="action" id="retry">RÉESSAYER</button><button class="action alt" id="exit">RETOUR À LA VILLE</button></div>`);
    $('retry').onclick=()=>{closeModal();newGame(kind,level);};
    $('exit').onclick=()=>{closeModal();newGame('level',Math.min(data.level,MAX_LEVEL));showView('city');};
    sound(200,.28,'triangle',.045);
  }
  function showView(next){view=next;dom.secondary.classList.toggle('hidden',next==='play');dom.mission.classList.toggle('hidden',next!=='play');dom.gameplay.classList.toggle('hidden',next!=='play');
    document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-current',b.dataset.view===next?'page':'false');});
    if(next==='city')renderCityView();if(next==='daily')renderDailyView();if(next==='settings')renderSettingsView();
  }
  function renderCityView(){const completed=data.finished,distUnlocked=Math.max(1,Math.ceil(Math.max(1,completed)/10));
    dom.secondary.innerHTML=`<span class="eyebrow">TA MÉGALOPOLE VIVANTE</span><h2>LA CITÉ RENAÎT ✦</h2><p class="lead">Chaque niveau accompli rallume un secteur de ta ville. Explore les huit quartiers, collectionne les étoiles et transforme la nuit en spectacle.</p><div class="section-card"><span class="meta">PROGRESSION GLOBALE</span><h3>${completed} / ${MAX_LEVEL} secteurs éclairés</h3><div class="progress-track"><div style="width:${completed/MAX_LEVEL*100}%"></div></div><p>Étoiles obtenues : ${Object.values(data.stars).reduce((s,n)=>s+(Number(n)||0),0)} / ${MAX_LEVEL*3}</p></div><div class="district-grid">${DISTRICTS.map((d,i)=>`<div class="district ${i+1>distUnlocked?'locked':''}"><span class="number">QUARTIER ${String(i+1).padStart(2,'0')}</span><span class="symbol">${i+1>distUnlocked?'◇':i<distUnlocked-1?'✦':'✧'}</span><b>${d}</b><small>${clamp(completed-i*10,0,10)} / 10 secteurs</small></div>`).join('')}</div><div class="actions"><button class="action" id="continue">REPRENDRE LA PARTIE</button></div>`;
    $('continue').onclick=()=>showView('play');
  }
  function renderDailyView(){const key=dateKey(),record=data.daily[key],done=!!record?.completed;
    dom.secondary.innerHTML=`<span class="eyebrow">UN DÉFI PARTAGÉ POUR TOUS</span><h2>LE SIGNAL DU JOUR</h2><p class="lead">Même combinaison de départ pour tout le monde. Aucun abonnement, aucune connexion requise. Chaque jour, un nouveau puzzle, avec une seule règle : faire mieux qu'hier.</p><div class="section-card" style="text-align:center"><div style="font-size:42px;color:var(--gold);text-shadow:0 0 24px #ffd56e">◎</div><span class="meta">${escapeHTML(key)}</span><h3>${done?'MISSION ACCOMPLIE':'LA VILLE A BESOIN DE TOI'}</h3><p>Deux couleurs à collecter • 24 coups • Même grille pour tous</p>${done?`<div class="score" style="font-weight:900;font-size:28px;color:var(--cyan)">${record.best.toLocaleString('fr-FR')} pts</div><p>Meilleur score actuel</p>`:''}<div class="actions"><button class="action" id="startDaily">${done?'AMÉLIORER MON SCORE':'LANCER LE DÉFI'}</button></div></div><div class="section-card"><h3>✓ Pourquoi revenir ?</h3><p>Une nouvelle combinaison chaque jour, un score à dépasser et des récompenses en éclats pour ta première réussite quotidienne. Tes progrès ne dépendent jamais d'une connexion.</p>${done?'<button class="action alt" id="share">PARTAGER MON SCORE</button>':''}</div>`;
    $('startDaily').onclick=()=>newGame('daily');
    if(done)$('share').onclick=()=>shareDaily(record.best,key);
  }
  function shareDaily(score,key){const msg=`✦ AFTERGLOW — ${key}\nDéfi néon : ${score} points !\nArriveras-tu à rallumer la ville ? #AfterglowGame`;
    if(navigator.share)navigator.share({text:msg}).catch(()=>{});
    else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).then(()=>notify('Score copié')).catch(()=>notify(msg));
    else notify(msg);
  }
  function settingButton(name,desc,prop){return `<div class="setting-row"><div><b>${name}</b><small>${desc}</small></div><button class="toggle ${data[prop]?'on':''}" data-setting="${prop}" aria-pressed="${data[prop]}">${data[prop]?'ACTIF':'OFF'}</button></div>`;}
  function renderSettingsView(){dom.secondary.innerHTML=`<span class="eyebrow">TON EXPÉRIENCE</span><h2>PERSONNALISER</h2><div class="section-card"><h3>Ambiance</h3>${settingButton('Effets sonores','Sons synthétiques intégrés','sound')}${settingButton('Vibrations','Retour tactile Android','haptics')}${settingButton('Animations réduites','Confort visuel','reduceMotion')}</div><div class="section-card"><h3>Apparence du jeu</h3><p>Débloque des ambiances en jouant, sans achat réel.</p><div class="theme-grid">${THEMES.map((t,i)=>`<button class="theme-choice ${data.theme===i?'active':''}" data-theme="${i}"><span class="swatch" style="background:${t.color};color:${t.color}"></span>${t.name}<small>${data.owned.includes(i)?data.theme===i?'ÉQUIPÉ':'ACQUIS':`${t.price} ✦`}</small></button>`).join('')}</div></div><div class="section-card"><h3>À propos</h3><p>AFTERGLOW — Neon District · v1.0.0</p><p>© 2026 LayAdam corp. Jeu autonome sans suivi publicitaire ni compte utilisateur. Sauvegarde locale automatique à chaque coup.</p><button class="action alt" id="rules">REVOIR LES RÈGLES</button></div><div class="section-card"><h3>Progression</h3><p>Les données sont conservées exclusivement sur cet appareil. Attention : effacer le stockage de l'application peut supprimer ta progression.</p><button class="action alt" id="reset">EFFACER MA PARTIE</button></div>`;
    dom.secondary.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>{data[b.dataset.setting]=!data[b.dataset.setting];save();renderSettingsView();});
    dom.secondary.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>selectTheme(Number(b.dataset.theme)));
    $('rules').onclick=showWelcome;
    $('reset').onclick=()=>openModal(`<div class="hero-symbol">⚠</div><h2>REPARTIR DE ZÉRO ?</h2><p>Cette opération supprimera définitivement tes niveaux, étoiles, défis et éclats sur cet appareil.</p><div class="actions"><button class="action alt" id="cancelReset">ANNULER</button><button class="action gold" id="confirmReset">TOUT EFFACER</button></div>`);
    // Les actions du dialogue sont branchées après sa création.
    const oldOpen=$('reset').onclick;
    $('reset').onclick=()=>{oldOpen();$('cancelReset').onclick=closeModal;$('confirmReset').onclick=()=>{data=fresh();game=null;save();closeModal();newGame();renderSettingsView();notify('Progression réinitialisée');};};
  }
  function selectTheme(i){const t=THEMES[i];if(!t)return;
    if(!data.owned.includes(i)){if(data.coins<t.price){notify(`Il manque ${t.price-data.coins} éclats`);return;}data.coins-=t.price;data.owned.push(i);}
    data.theme=i;applyTheme();save();updateCityOnly();renderSettingsView();sound(740,.13,'sine',.06);
  }
  for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{if(!modalOpen){sound(410,.05);showView(b.dataset.view);}};
  window.afterglowBack=()=>{if(modalOpen)closeModal();else if(view!=='play')showView('play');else openModal(`<div class="hero-symbol">◈</div><h2>UNE PAUSE ?</h2><p>Ta partie est sauvegardée automatiquement. Tu peux reprendre plus tard, exactement au même endroit.</p><div class="actions"><button class="action" id="resume">REPRENDRE</button><button class="action alt" id="goCity">VOIR MA VILLE</button></div>`),$('resume').onclick=closeModal,$('goCity').onclick=()=>{closeModal();showView('city');};};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();window.afterglowBack();}});

  function drawGem(i,x,y,w,h,t){const color=COLORS[game.tiles[i]];if(game.tiles[i]===undefined)return;
    const selected=selection.includes(i),puls=selected?(Math.sin(t*.012)*.035):0;
    const pad=selected?2:7,px=x+pad,py=y+pad,pw=w-pad*2,ph=h-pad*2;
    bctx.save();bctx.shadowColor=color;bctx.shadowBlur=selected?34:10;bctx.shadowOffsetY=selected?0:4;
    const grad=bctx.createLinearGradient(px,py,px+pw,py+ph);grad.addColorStop(0,color);grad.addColorStop(.55,color);grad.addColorStop(1,'#353456');
    drawRound(bctx,px,py,pw,ph,Math.min(20,w*.2),grad);bctx.shadowBlur=0;
    drawRound(bctx,px+5,py+4,pw-10,ph*.32,9,'#ffffff32');
    bctx.strokeStyle=selected?'#ffffffdd':'#ffffff55';bctx.lineWidth=selected?4:1.6;bctx.beginPath();bctx.roundRect(px+1,py+1,pw-2,ph-2,Math.min(20,w*.2));bctx.stroke();
    // Une petite rune donne à chaque couleur une silhouette distincte.
    bctx.translate(px+pw/2,py+ph/2);bctx.rotate((game.tiles[i]-2)*.14+puls);bctx.strokeStyle='#ffffffba';bctx.lineWidth=3;bctx.beginPath();
    const r=Math.min(pw,ph)*.18;
    if(game.tiles[i]===0){bctx.arc(0,0,r,0,Math.PI*2);}else if(game.tiles[i]===1){bctx.moveTo(0,-r);bctx.lineTo(r,r);bctx.lineTo(-r,r);bctx.closePath();}else if(game.tiles[i]===2){bctx.rect(-r,-r,r*2,r*2);}else if(game.tiles[i]===3){bctx.moveTo(-r,0);bctx.lineTo(0,-r);bctx.lineTo(r,0);bctx.lineTo(0,r);bctx.closePath();}else{for(let s=0;s<10;s++){const a=s*Math.PI/5-Math.PI/2,rad=s%2?r*.5:r;bctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}bctx.closePath();}
    bctx.stroke();bctx.restore();
  }
  function drawBoard(t){if(!game||view!=='play')return;const W=600,H=700,w=580/C,h=680/R;
    bctx.clearRect(0,0,W,H);
    const grad=bctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#1b2450');grad.addColorStop(1,'#10162f');drawRound(bctx,0,0,W,H,18,grad);
    bctx.strokeStyle='#7c8ca012';bctx.lineWidth=1;
    for(let y=0;y<R;y++)for(let x=0;x<C;x++){
      const px=10+x*w,py=10+y*h;drawRound(bctx,px+3,py+3,w-6,h-6,20,'#0a1130');
      drawGem(gridIndex(x,y),px,py,w,h,t);
    }
    if(selection.length>1){bctx.beginPath();const a=coords(selection[0]);bctx.moveTo(10+(a.x+.5)*w,10+(a.y+.5)*h);for(let i=1;i<selection.length;i++){const p=coords(selection[i]);bctx.lineTo(10+(p.x+.5)*w,10+(p.y+.5)*h);}
      bctx.lineJoin='round';bctx.lineCap='round';bctx.strokeStyle='#fff6';bctx.lineWidth=16;bctx.stroke();bctx.strokeStyle='#ffffff';bctx.lineWidth=5;bctx.stroke();
    }
    fx=fx.filter(p=>p.life>0);for(const p of fx){p.x+=p.vx;p.y+=p.vy;p.vy+=.14;p.life-=1;bctx.globalAlpha=clamp(p.life/45,0,1);bctx.fillStyle=COLORS[p.type];bctx.shadowColor=COLORS[p.type];bctx.shadowBlur=13;bctx.beginPath();bctx.arc(p.x,p.y,clamp(p.life/12,1,4.5),0,Math.PI*2);bctx.fill();}bctx.globalAlpha=1;bctx.shadowBlur=0;
    popups=popups.filter(p=>p.life>0);for(const p of popups){p.life-=1;p.y-=1.4;bctx.globalAlpha=clamp(p.life/28,0,1);bctx.fillStyle=p.color;bctx.font='900 31px system-ui';bctx.textAlign='center';bctx.shadowColor=p.color;bctx.shadowBlur=15;bctx.fillText(p.label,p.x,p.y);}bctx.globalAlpha=1;bctx.shadowBlur=0;
  }
  function seededHash(n){let x=(n*2654435761)|0;x=Math.imul(x^(x>>>16),2246822507);return((x^(x>>>13))>>>0)/4294967296;}
  function drawCity(t){const ctx=cctx,W=720,H=310,progress=data.finished/MAX_LEVEL;ctx.clearRect(0,0,W,H);
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
  let frame=0;
  function tick(t){now=t;if(!document.hidden){drawCity(data.reduceMotion?0:t);if(!data.reduceMotion||frame++%6===0)drawBoard(t);}requestAnimationFrame(tick);}
  // État de test disponible uniquement avec ?test=1 : aucun accès réseau ni privilège.
  if(new URLSearchParams(location.search).has('test'))window.__afterglowTest={state:()=>JSON.parse(JSON.stringify({data,game,view,modalOpen})),start:newGame,playPath,hasMove,render:()=>{drawCity(1000);drawBoard(1000);},win:winGame};
  loadOrStart();requestAnimationFrame(tick);
})();
