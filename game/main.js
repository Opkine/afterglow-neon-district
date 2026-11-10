/* PALIMPSESTE — interactive case, temporal memories, evidence and branching. */
(()=>{
 'use strict';
 const {HOURS,LOCATIONS,OBJECTS,PEOPLE,CRITICAL,REQUIRED,CaseFile}=window.PalimpsesteStory;
 const $=id=>document.getElementById(id),SAVE_KEY='palimpseste-dossier-01-v1';
 function read(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY));return v?.case??null;}catch(_){return null;}}
 let file=new CaseFile(read()),activeObject=null,frameIndex=0,activePerson='nina',panel=null;
 let helpPanel,memoryHintText,memoryHintButton,leadBox,leadText,leadButton,verdictHintText,verdictHintButton;
 let audioPanel,confirmPanel,audioButtons=[],personalTrackButton,musicButton,effectsButton,audioStatus;
 const sound=new window.PalimpsesteAudio();
 function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,case:file.snapshot()}));}catch(e){console.warn('Sauvegarde indisponible:',e.message);}}
 function haptic(n=13){if(navigator.vibrate)navigator.vibrate(n);}
 function addClass(id,cl,on){$(id).classList.toggle(cl,on);}
 function sceneInfo(){return LOCATIONS.find(l=>l.id===file.scene)||LOCATIONS[0];}
 function uiCount(){const n=file.count;$('sceneProgress').textContent=String(n).padStart(2,'0')+' / 12 INDICES';$('notesMeter').style.width=file.completion+'%';$('notesSubtitle').textContent=n+' / 12 souvenirs · '+file.essentialCount+' / '+CRITICAL.length+' preuves essentielles · '+(file.canDeduce?'TU PEUX DÉDUIRE !':'Il faut '+REQUIRED+' souvenirs dont les '+CRITICAL.length+' essentiels.');$('solveBtn').disabled=!file.canDeduce;}
 function toast(message,kind='note'){
  const old=document.querySelector('.toast');if(old)old.remove();const d=makeElement('div','toast in-game-notice');
  d.setAttribute('role','status');const icon=makeElement('span','notice-icon',kind==='clue'?'✦':'◈');
  const copy=makeElement('span','notice-content',message),dismiss=makeElement('button','notice-close','×');dismiss.type='button';dismiss.setAttribute('aria-label','Fermer la notification');dismiss.addEventListener('click',()=>d.remove());
  d.append(icon,copy,dismiss);$('app').append(d);setTimeout(()=>d.remove(),4100);
 }
 function showIntro(){closePanel();addClass('intro','active-view',true);addClass('world','active-view',false);addClass('ending','hidden',true);$('begin').firstChild.textContent=file.count?'REPRENDRE L’ENQUÊTE ':'OUVRIR LE DOSSIER ';}
 function start(){if(file.ending){showEnding(file.ending);return;}sound.ensure();addClass('intro','active-view',false);addClass('world','active-view',true);addClass('ending','hidden',true);renderScene();if(!localStorage.getItem('palimpseste-guide-seen')&&file.count===0){localStorage.setItem('palimpseste-guide-seen','1');openHelp();}}
 function renderScene(){const loc=sceneInfo(),idx=LOCATIONS.indexOf(loc);const img=$('sceneImage');img.src='assets/'+loc.asset;img.alt='Décor peint : '+loc.name.toLowerCase();
  $('world').setAttribute('data-scene',loc.id);img.style.animation='none';void img.offsetWidth;img.style.animation='sceneEnter 1s ease-out both';
  $('placeNum').textContent=String(idx+1).padStart(2,'0');$('placeName').textContent=loc.name;$('placeHint').textContent=loc.lead;
  const hotspots=$('hotspots');hotspots.innerHTML='';for(const o of OBJECTS.filter(x=>x.scene===file.scene)){
   const b=document.createElement('button');b.type='button';b.className='hotspot'+(file.clues.includes(o.id)?' found':'');b.style.left=o.x+'%';b.style.top=o.y+'%';b.textContent=file.clues.includes(o.id)?'✓':o.icon;
   b.setAttribute('aria-label','Examiner '+o.name);b.addEventListener('click',()=>openMemory(o.id));hotspots.append(b);
  }uiCount();persist();
 }
 function showPanel(id){closePanel();panel=id;$('shade').classList.remove('hidden');$(id).classList.remove('hidden');document.body.style.overflow='hidden';}
 function closePanel(){for(const id of ['memory','map','notebook','dialogue','verdict'])$(id).classList.add('hidden');
  if(helpPanel)helpPanel.classList.add('hidden');if(audioPanel)audioPanel.classList.add('hidden');if(confirmPanel)confirmPanel.classList.add('hidden');
  $('shade').classList.add('hidden');document.body.style.overflow='';panel=null;}
 function makeElement(tag,cls,txt){const d=document.createElement(tag);d.className=cls;if(txt)d.textContent=txt;return d;}
 function setupAssistance(){
  const helpButton=makeElement('button','help-float','?  COMMENT JOUER');helpButton.type='button';helpButton.addEventListener('click',openHelp);$('world').append(helpButton);
  helpPanel=makeElement('section','paper-panel guide-panel hidden');helpPanel.setAttribute('role','dialog');helpPanel.setAttribute('aria-label','Guide de l’enquête');
  helpPanel.append(makeElement('h2','guide-title','LES OBJETS MENTENT — MODE D’EMPLOI'));
  ['1 · Explore chaque lieu. Touche les repères dessinés sur les objets.',
   '2 · Dans le souvenir, déplace le curseur du temps : certains instants cachent une preuve.',
   '3 · Quand la preuve apparaît, touche « CONSIGNER ». Si tu bloques, utilise les indices progressifs.',
   '4 · Consulte le CARNET : il indique quelles pistes manquent. Parle à Nina et Louis puis formule ta déduction.']
   .forEach(t=>helpPanel.append(makeElement('p','guide-step',t)));
  const close=makeElement('button','ink-button','COMPRIS, JE MÈNE L’ENQUÊTE');close.type='button';close.addEventListener('click',closePanel);helpPanel.append(close);$('app').append(helpPanel);
  const memoryHelp=makeElement('div','hint-box'),memoryLabel=makeElement('strong','hint-title','BESOIN D’UN COUP DE MAIN ?');
  memoryHintButton=makeElement('button','hint-button','UN INDICE SUR CET OBJET');memoryHintText=makeElement('p','hint-copy','');
  memoryHintButton.addEventListener('click',()=>{if(!activeObject)return;const h=file.hint(activeObject.id);if(!h)return;memoryHintText.textContent='INDICE '+h.tier+'/3 — '+h.text;memoryHintText.classList.remove('hidden');persist();sound.effect('tick');});
  memoryHelp.append(memoryLabel,memoryHintButton,memoryHintText);$('memory').append(memoryHelp);
  leadBox=makeElement('div','lead-box');leadText=makeElement('p','lead-copy','');leadButton=makeElement('button','lead-button','VOIR CETTE PISTE SUR LE DÉCOR');leadButton.addEventListener('click',()=>{const lead=file.nextLead;if(!lead)return;file.move(lead.place.id);closePanel();renderScene();const spots=[...$('hotspots').children],index=OBJECTS.filter(o=>o.scene===lead.place.id).findIndex(o=>o.id===lead.id);if(spots[index])spots[index].classList.add('hint-target');toast('Piste à examiner : '+lead.object+'.');});
  leadBox.append(makeElement('strong','hint-title','PROCHAINE PISTE'),leadText,leadButton);$('notebook').append(leadBox);
  const verdictHelp=makeElement('div','hint-box');verdictHintButton=makeElement('button','hint-button','JE BLOQUE SUR LA DÉDUCTION');verdictHintText=makeElement('p','hint-copy hidden','');
  verdictHintButton.addEventListener('click',()=>{const h=file.verdictHint({who:$('who').value,why:$('why').value,proof:$('proof').value});verdictHintText.textContent='INDICE '+h.tier+'/3 — '+h.text;verdictHintText.classList.remove('hidden');persist();});
  verdictHelp.append(verdictHintButton,verdictHintText);$('verdict').append(verdictHelp);
 }
 function openHelp(){closePanel();panel='help';$('shade').classList.remove('hidden');helpPanel.classList.remove('hidden');document.body.style.overflow='hidden';}
 function setupAudioUI(){
  audioPanel=makeElement('section','paper-panel audio-panel hidden');audioPanel.setAttribute('role','dialog');audioPanel.setAttribute('aria-label','Ambiance sonore');
  const header=makeElement('div','panel-head'),caption=makeElement('span','overline','BANDES-SONS DU DOSSIER'),close=makeElement('button','close-sheet','×');
  close.type='button';close.setAttribute('aria-label','Fermer les réglages audio');close.addEventListener('click',closePanel);header.append(caption,close);audioPanel.append(header);
  audioPanel.append(makeElement('h2','audio-heading','Écouter l’enquête.'));
  audioPanel.append(makeElement('p','panel-copy','Trois compositions originales. Sélectionne une ambiance ou apporte ton propre morceau depuis ton téléphone.'));
  const trackList=makeElement('div','audio-track-list');Object.entries(window.PalimpsesteAudio.tracks).forEach(([id,track])=>{
   const b=makeElement('button','audio-track'),title=makeElement('strong','',track.title),desc=makeElement('small','',track.mood),marker=makeElement('span','audio-marker','♪');
   b.type='button';b.append(marker,title,desc);b.addEventListener('click',()=>{sound.ensure();sound.choose(id);updateAudioUI();sound.effect('page');});trackList.append(b);audioButtons.push({id,button:b});
  });audioPanel.append(trackList);
  const own=makeElement('div','import-block');personalTrackButton=makeElement('button','audio-track audio-personal','＋ IMPORTER MA MUSIQUE');
  personalTrackButton.type='button';const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='audio/*,.mp3,.m4a,.wav,.ogg';fileInput.className='audio-file-input';
  personalTrackButton.addEventListener('click',()=>{if(sound.imported){sound.ensure();sound.choose('personal');updateAudioUI();}else fileInput.click();});
  const importOther=makeElement('button','import-another','CHOISIR UN AUTRE FICHIER');importOther.type='button';importOther.addEventListener('click',()=>fileInput.click());
  audioStatus=makeElement('p','audio-status','Le fichier reste dans le stockage local du jeu. Maximum 25 Mo.');
  fileInput.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;
   try{const result=await sound.importPersonal(f);audioStatus.textContent=result.saved?'Musique enregistrée sur cet appareil : '+result.name:'Musique prête pour cette session : '+result.name+' (stockage permanent indisponible).';toast('Musique personnelle sélectionnée : '+result.name);sound.effect('notify');}
   catch(err){audioStatus.textContent=err.message||'Format audio non pris en charge.';toast(audioStatus.textContent);}
   fileInput.value='';updateAudioUI();
  });own.append(personalTrackButton,importOther,fileInput,audioStatus);audioPanel.append(own);
  const toggles=makeElement('div','audio-switches');musicButton=makeElement('button','audio-switch'),effectsButton=makeElement('button','audio-switch');
  musicButton.addEventListener('click',()=>{sound.setMusic(!sound.musicEnabled);updateAudioUI();});
  effectsButton.addEventListener('click',()=>{sound.setEffects(!sound.effectsEnabled);updateAudioUI();sound.effect('notify');});
  toggles.append(musicButton,effectsButton);audioPanel.append(toggles);
  function volume(label,value,handler){const row=makeElement('label','audio-volume'),name=makeElement('span','',label),input=document.createElement('input');
   input.type='range';input.min='0';input.max='100';input.value=String(Math.round(value*100));input.addEventListener('input',()=>handler(Number(input.value)/100));
   row.append(name,input);audioPanel.append(row);
  }
  volume('VOLUME MUSIQUE',sound.musicVolume,v=>sound.setMusicVolume(v));volume('VOLUME EFFETS',sound.effectsVolume,v=>sound.setEffectsVolume(v));
  audioPanel.append(makeElement('p','audio-copyright','Aucun morceau importé n’est transmis sur Internet. Les bandes-son intégrées sont des compositions originales.'));
  $('app').append(audioPanel);
  if(typeof sound.restorePersonal==='function')sound.restorePersonal().then(name=>{
   if(name)audioStatus.textContent='Fichier retrouvé : '+name;
   else if(sound.track==='personal'){sound.choose('nocturne');audioStatus.textContent='Musique importée introuvable : la bande-son originale reprend.';}
   updateAudioUI();
  }).catch(()=>{});
  $('settingsToggle').setAttribute('aria-label','Ouvrir les réglages de la musique et des bruitages');
  updateAudioUI();
 }
 function updateAudioUI(){if(!audioPanel)return;
  audioButtons.forEach(({id,button})=>button.classList.toggle('selected',sound.track===id));
  personalTrackButton.classList.toggle('selected',sound.track==='personal');
  personalTrackButton.textContent=sound.imported?'♫  '+sound.importedName:'＋ IMPORTER MA MUSIQUE';
  musicButton.textContent='MUSIQUE : '+(sound.musicEnabled?'ACTIVÉE':'COUPÉE');
  effectsButton.textContent='BRUITAGES : '+(sound.effectsEnabled?'ACTIVÉS':'COUPÉS');
  $('settingsToggle').textContent=sound.musicEnabled?'♫':'♩̸';
 }
 function openAudio(){sound.ensure();closePanel();panel='audio';$('shade').classList.remove('hidden');audioPanel.classList.remove('hidden');document.body.style.overflow='hidden';updateAudioUI();}
 function setupConfirmation(){
  confirmPanel=makeElement('div','internal-confirm hidden');confirmPanel.setAttribute('role','alertdialog');confirmPanel.setAttribute('aria-modal','true');confirmPanel.setAttribute('aria-label','Recommencer le dossier');
  const paper=makeElement('div','confirm-paper');paper.append(makeElement('span','overline','DOSSIER 001 · DÉCISION'));
  paper.append(makeElement('h2','', 'Recommencer l’enquête ?'));
  paper.append(makeElement('p','', 'Tes indices et tes interrogatoires seront effacés dans cette version. Les musiques et réglages audio resteront enregistrés.'));
  const actions=makeElement('div','confirm-actions'),no=makeElement('button','confirm-cancel','GARDER MA PARTIE'),yes=makeElement('button','confirm-accept','RECOMMENCER');
  no.addEventListener('click',closePanel);yes.addEventListener('click',()=>{file=new CaseFile();persist();closePanel();showIntro();sound.effect('page');});
  actions.append(no,yes);paper.append(actions);confirmPanel.append(paper);$('app').append(confirmPanel);
 }
 function askReplay(){closePanel();panel='confirmation';confirmPanel.classList.remove('hidden');sound.effect('page');}
 function setupAtmosphere(){
  const layer=makeElement('div','ambient-particles');layer.setAttribute('aria-hidden','true');
  for(let i=0;i<16;i++){const mote=makeElement('span','ambient-mote');mote.style.left=(8+(i*37)%87)+'%';mote.style.top=(11+(i*29)%77)+'%';
   mote.style.animationDelay=-(i*.7)+'s';mote.style.animationDuration=(4.2+i%5*1.25)+'s';layer.append(mote);}
  $('world').append(layer);
 }
 function clueBurst(obj){const burst=makeElement('span','clue-burst','✦');burst.style.left=obj.x+'%';burst.style.top=obj.y+'%';$('world').append(burst);setTimeout(()=>burst.remove(),1550);}
 function openMemory(id){activeObject=OBJECTS.find(o=>o.id===id);if(!activeObject)return;frameIndex=0;
  $('objectTitle').textContent=activeObject.name;$('objectMaterial').textContent=activeObject.stamp;
  $('objectCrop').style.backgroundImage='url("assets/'+sceneInfo().asset+'")';$('objectCrop').style.backgroundPosition=activeObject.x+'% '+activeObject.y+'%';
  $('timeSlider').value='0';$('memorySaved').classList.add('hidden');memoryHintText.textContent='';memoryHintText.classList.add('hidden');showPanel('memory');renderMemory();sound.effect('object:'+id);haptic();
 }
 function renderMemory(){if(!activeObject)return;const item=file.study(activeObject.id,frameIndex);if(!item)return;
  $('timeStamp').textContent=item.hour;$('memoryText').textContent=item.text;$('objectCrop').style.filter='sepia('+(frameIndex===2?.1:.55)+') saturate('+(frameIndex===3?1.2:.65)+') contrast('+(.82+frameIndex*.05)+')';
  $('memorySaved').classList.toggle('hidden',!item.already);$('memory').classList.toggle('memory-found',item.canCollect);memoryHintButton.classList.toggle('hidden',item.already);const b=$('recordBtn');
  if(item.already){b.disabled=true;b.textContent='CETTE PREUVE EST DÉJÀ DANS TON CARNET';b.classList.add('muted');}
  else if(item.canCollect){b.disabled=false;b.textContent='✦ PREUVE TROUVÉE — LA CONSIGNER ↗';b.classList.remove('muted');}
  else{b.disabled=true;b.textContent='DÉPLACE LE CURSEUR POUR TROUVER LA PREUVE…';b.classList.add('muted');}
  persist();
 }
 function collect(){if(!activeObject||!file.collect(activeObject.id,frameIndex))return;renderMemory();uiCount();renderScene();sound.effect('collect:'+activeObject.id);clueBurst(activeObject);haptic([20,40,35]);toast('✦ NOUVELLE PREUVE : '+activeObject.clue,'clue');
 }
 function openMap(){showPanel('map');const el=$('mapLocations');el.innerHTML='';LOCATIONS.forEach((loc,i)=>{
  const b=document.createElement('button');b.className='location'+(loc.id===file.scene?' active':'');
  const img=document.createElement('img');img.src='assets/'+loc.asset;img.alt='';
  const info=document.createElement('div'),num=document.createElement('span');num.textContent='LIEU 0'+(i+1);const t=document.createElement('strong');t.textContent=loc.name;const sub=document.createElement('small');sub.textContent=loc.short+' · '+file.clues.filter(id=>OBJECTS.find(o=>o.id===id)?.scene===loc.id).length+'/4 preuves';
  info.append(num,t,sub);b.append(img,info);b.addEventListener('click',()=>{file.move(loc.id);closePanel();renderScene();sound.effect('location');});el.append(b);
 });
 }
 function openNotebook(){uiCount();const el=$('notesList');el.innerHTML='';if(!file.count){const e=document.createElement('div');e.className='empty-note';e.textContent='Cette page est encore vierge. Les objets attendent que tu les écoutes.';el.append(e);}
  for(const id of file.clues){const o=OBJECTS.find(x=>x.id===id);const d=document.createElement('div');d.className='note';
   const tag=document.createElement('span');tag.className='note-tag';tag.textContent=o.tag+' · '+HOURS[o.truth];
   const title=document.createElement('strong');title.textContent=o.clue;const body=document.createElement('p');body.textContent=o.evidence;d.append(tag,title,body);el.append(d);
  }const lead=file.nextLead;leadBox.classList.toggle('hidden',file.canDeduce||!lead);if(lead){leadText.textContent='Tu as '+file.count+' preuves. Il t’en faut au moins '+REQUIRED+', dont '+CRITICAL.length+' essentielles. Explore « '+lead.place.name+' » : '+lead.object+'.';}showPanel('notebook');sound.effect('page');
 }
 function openDialog(person='nina'){activePerson=person;showPanel('dialogue');renderDialog();sound.effect('page');}
 function renderDialog(){const person=PEOPLE[activePerson];$('ninaTab').classList.toggle('selected',activePerson==='nina');$('louisTab').classList.toggle('selected',activePerson==='louis');
  $('personName').textContent=person.name;$('personRole').textContent=person.role.toUpperCase();$('personPortrait').src='assets/'+activePerson+'.webp';$('personPortrait').alt='Portrait peint de '+person.name;
  $('personLine').textContent=person.line;
  const box=$('questions');box.innerHTML='';$('answer').classList.add('hidden');person.questions.forEach((q,i)=>{
   const b=document.createElement('button');b.textContent='« '+q.q+' »';b.className=file.asked[activePerson+'-'+i]?'asked':'';
   b.addEventListener('click',()=>{const a=file.ask(activePerson,i);$('answer').textContent=a;$('answer').classList.remove('hidden');renderAskedButtons();sound.effect('voice');persist();});box.append(b);
  });
 }
 function renderAskedButtons(){[...$('questions').children].forEach((b,i)=>b.classList.toggle('asked',!!file.asked[activePerson+'-'+i]));}
 function openVerdict(){if(!file.canDeduce){toast('Ouvre le carnet : il t’indique la prochaine piste.');return;}$('deductionError').textContent='';verdictHintText.classList.add('hidden');showPanel('verdict');}
 function submitVerdict(){const answers={who:$('who').value,why:$('why').value,proof:$('proof').value},choice=document.querySelector('input[name="choice"]:checked')?.value;
  const result=file.deduce(answers,choice);persist();if(result.success){sound.effect('solve');haptic([30,50,60,70,90]);closePanel();showEnding(choice);}
  else{sound.effect('fail');haptic(50);const fields={who:'QUI a organisé la disparition ?',why:'POURQUOI a-t-elle eu lieu ?',proof:'QUELLE preuve est décisive ?'};$('deductionError').textContent=result.reason+(result.wrongFields?.length?' Vérifie : '+fields[result.wrongFields[0]]:'');}
 }
 function showEnding(ending){closePanel();addClass('intro','active-view',false);addClass('world','active-view',false);addClass('ending','hidden',false);
  $('ending').scrollTop=0;
  const protectedPath=ending==='protect';$('endingTitle').textContent=protectedPath?'LA PROMESSE TENUE':'LE PRIX DE LA VÉRITÉ';
  $('endingLead').textContent='Mara n’a jamais quitté l’hôtel. Elle a fabriqué sa disparition avec l’aide de Nina et de Louis pour gagner quelques heures.';
  $('endingText').textContent=protectedPath?
   'Tu retrouves Mara sous la verrière et lui rends la lettre sans alerter les autorités. À minuit, les trois complices présentent l’ancien acte de propriété. La vente est suspendue. L’hôtel respire enfin — mais garder un secret laisse toujours une ombre derrière soi.':
   'Tu remets ton rapport au commissaire. La machination est révélée, les signatures examinées et la vente provisoirement bloquée. Mara accepte les conséquences de son mensonge. Tu as sauvé les preuves, mais Nina ne te pardonne pas si facilement. Certaines vérités réparent ; d’autres blessent.';
  $('endingStats').textContent=file.count+' / 12 souvenirs retrouvés · '+Object.keys(file.asked).length+' questions posées · '+file.mistakes+' hypothèses écartées';persist();
 }
 function back(){if(panel)closePanel();else if(!$('ending').classList.contains('hidden'))showIntro();else if($('world').classList.contains('active-view'))showIntro();}
 $('begin').addEventListener('click',start);$('homeMenu').addEventListener('click',showIntro);$('settingsToggle').addEventListener('click',openAudio);
 document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{sound.ensure();switch(b.dataset.open){case 'map':openMap();break;case 'notebook':openNotebook();break;case 'dialogue':openDialog();}}));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closePanel));$('shade').addEventListener('click',closePanel);
 $('timeSlider').addEventListener('input',e=>{frameIndex=Number(e.target.value);renderMemory();sound.effect('tick');});
 $('recordBtn').addEventListener('click',collect);$('solveBtn').addEventListener('click',openVerdict);$('submitVerdict').addEventListener('click',submitVerdict);
 document.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>{activePerson=b.dataset.person;renderDialog();sound.effect('open');}));
 $('replay').addEventListener('click',askReplay);
 window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back();}});
 window.palimpsesteBack=back;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.pause();else sound.resume();});
 if(new URLSearchParams(location.search).has('test'))window.__palimpsesteTest={file:()=>file,renderScene,start,openMemory,openNotebook,openDialog,submitVerdict,openHelp,openAudio,askReplay,
  audio:()=>sound,hintMemory:()=>memoryHintButton.click(),hintVerdict:()=>verdictHintButton.click(),getAssistance:()=>({memory:memoryHintText.textContent,verdict:verdictHintText.textContent,lead:leadText.textContent})};
 setupAssistance();setupAudioUI();setupConfirmation();setupAtmosphere();
 uiCount();showIntro();
})();
