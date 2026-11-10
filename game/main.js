/* PALIMPSESTE — interactive case, temporal memories, evidence and branching. */
(()=>{
 'use strict';
 const {HOURS,LOCATIONS,OBJECTS,PEOPLE,CRITICAL,CaseFile}=window.PalimpsesteStory;
 const $=id=>document.getElementById(id),SAVE_KEY='palimpseste-dossier-01-v1';
 function read(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY));return v?.case??null;}catch(_){return null;}}
 let file=new CaseFile(read()),mute=false,activeObject=null,frameIndex=0,activePerson='nina',panel=null;
 const sound=new window.PalimpsesteAudio();
 function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,case:file.snapshot()}));}catch(e){console.warn('Sauvegarde indisponible:',e.message);}}
 function haptic(n=13){if(navigator.vibrate)navigator.vibrate(n);}
 function addClass(id,cl,on){$(id).classList.toggle(cl,on);}
 function sceneInfo(){return LOCATIONS.find(l=>l.id===file.scene)||LOCATIONS[0];}
 function uiCount(){const n=file.count;$('sceneProgress').textContent=String(n).padStart(2,'0')+' / 12 INDICES';$('notesMeter').style.width=file.completion+'%';$('notesSubtitle').textContent=n+' preuves consignées sur 12. '+(file.canDeduce?'Tu peux maintenant reconstituer les faits.':'Examine les objets et remonte leur passé.');$('solveBtn').disabled=!file.canDeduce;}
 function toast(text){const old=document.querySelector('.toast');if(old)old.remove();const d=document.createElement('div');d.className='toast';d.textContent=text;$('app').append(d);setTimeout(()=>d.remove(),2450);}
 function showIntro(){closePanel();addClass('intro','active-view',true);addClass('world','active-view',false);addClass('ending','hidden',true);$('begin').firstChild.textContent=file.count?'REPRENDRE L’ENQUÊTE ':'OUVRIR LE DOSSIER ';}
 function start(){if(file.ending){showEnding(file.ending);return;}sound.ensure();addClass('intro','active-view',false);addClass('world','active-view',true);addClass('ending','hidden',true);renderScene();}
 function renderScene(){const loc=sceneInfo(),idx=LOCATIONS.indexOf(loc);const img=$('sceneImage');img.src='assets/'+loc.asset;img.alt='Décor peint : '+loc.name.toLowerCase();
  $('placeNum').textContent=String(idx+1).padStart(2,'0');$('placeName').textContent=loc.name;$('placeHint').textContent=loc.lead;
  const hotspots=$('hotspots');hotspots.innerHTML='';for(const o of OBJECTS.filter(x=>x.scene===file.scene)){
   const b=document.createElement('button');b.type='button';b.className='hotspot'+(file.clues.includes(o.id)?' found':'');b.style.left=o.x+'%';b.style.top=o.y+'%';b.textContent=file.clues.includes(o.id)?'✓':o.icon;
   b.setAttribute('aria-label','Examiner '+o.name);b.addEventListener('click',()=>openMemory(o.id));hotspots.append(b);
  }uiCount();persist();
 }
 function showPanel(id){closePanel();panel=id;$('shade').classList.remove('hidden');$(id).classList.remove('hidden');document.body.style.overflow='hidden';}
 function closePanel(){for(const id of ['memory','map','notebook','dialogue','verdict'])$(id).classList.add('hidden');$('shade').classList.add('hidden');panel=null;}
 function openMemory(id){activeObject=OBJECTS.find(o=>o.id===id);if(!activeObject)return;frameIndex=0;
  $('objectTitle').textContent=activeObject.name;$('objectMaterial').textContent=activeObject.stamp;
  $('objectCrop').style.backgroundImage='url("assets/'+sceneInfo().asset+'")';$('objectCrop').style.backgroundPosition=activeObject.x+'% '+activeObject.y+'%';
  $('timeSlider').value='0';$('memorySaved').classList.add('hidden');showPanel('memory');renderMemory();sound.effect('open');haptic();
 }
 function renderMemory(){if(!activeObject)return;const item=file.study(activeObject.id,frameIndex);if(!item)return;
  $('timeStamp').textContent=item.hour;$('memoryText').textContent=item.text;$('objectCrop').style.filter='sepia('+(frameIndex===2?.1:.55)+') saturate('+(frameIndex===3?1.2:.65)+') contrast('+(.82+frameIndex*.05)+')';
  $('memorySaved').classList.toggle('hidden',!item.already);const b=$('recordBtn');
  if(item.already){b.disabled=true;b.textContent='CETTE PREUVE EST DÉJÀ DANS TON CARNET';b.classList.add('muted');}
  else if(item.canCollect){b.disabled=false;b.textContent='CONSIGNER CETTE RÉMANENCE ↗';b.classList.remove('muted');}
  else{b.disabled=true;b.textContent='CHERCHER UN AUTRE INSTANT…';b.classList.add('muted');}
  persist();
 }
 function collect(){if(!activeObject||!file.collect(activeObject.id,frameIndex))return;renderMemory();uiCount();renderScene();sound.effect('clue');haptic([20,40,35]);toast('Preuve ajoutée : '+activeObject.clue);
 }
 function openMap(){showPanel('map');const el=$('mapLocations');el.innerHTML='';LOCATIONS.forEach((loc,i)=>{
  const b=document.createElement('button');b.className='location'+(loc.id===file.scene?' active':'');
  const img=document.createElement('img');img.src='assets/'+loc.asset;img.alt='';
  const info=document.createElement('div'),num=document.createElement('span');num.textContent='LIEU 0'+(i+1);const t=document.createElement('strong');t.textContent=loc.name;const sub=document.createElement('small');sub.textContent=loc.short;
  info.append(num,t,sub);b.append(img,info);b.addEventListener('click',()=>{file.move(loc.id);closePanel();renderScene();sound.effect('open');});el.append(b);
 });
 }
 function openNotebook(){uiCount();const el=$('notesList');el.innerHTML='';if(!file.count){const e=document.createElement('div');e.className='empty-note';e.textContent='Cette page est encore vierge. Les objets attendent que tu les écoutes.';el.append(e);}
  for(const id of file.clues){const o=OBJECTS.find(x=>x.id===id);const d=document.createElement('div');d.className='note';
   const tag=document.createElement('span');tag.className='note-tag';tag.textContent=o.tag+' · '+HOURS[o.truth];
   const title=document.createElement('strong');title.textContent=o.clue;const body=document.createElement('p');body.textContent=o.evidence;d.append(tag,title,body);el.append(d);
  }showPanel('notebook');
 }
 function openDialog(person='nina'){activePerson=person;showPanel('dialogue');renderDialog();}
 function renderDialog(){const person=PEOPLE[activePerson];$('ninaTab').classList.toggle('selected',activePerson==='nina');$('louisTab').classList.toggle('selected',activePerson==='louis');
  $('personName').textContent=person.name;$('personRole').textContent=person.role.toUpperCase();$('personPortrait').src='assets/'+activePerson+'.webp';$('personPortrait').alt='Portrait peint de '+person.name;
  $('personLine').textContent=person.line;
  const box=$('questions');box.innerHTML='';$('answer').classList.add('hidden');person.questions.forEach((q,i)=>{
   const b=document.createElement('button');b.textContent='« '+q.q+' »';b.className=file.asked[activePerson+'-'+i]?'asked':'';
   b.addEventListener('click',()=>{const a=file.ask(activePerson,i);$('answer').textContent=a;$('answer').classList.remove('hidden');renderAskedButtons();sound.effect('voice');persist();});box.append(b);
  });
 }
 function renderAskedButtons(){[...$('questions').children].forEach((b,i)=>b.classList.toggle('asked',!!file.asked[activePerson+'-'+i]));}
 function openVerdict(){if(!file.canDeduce){toast('Il manque des preuves importantes.');return;}$('deductionError').textContent='';showPanel('verdict');}
 function submitVerdict(){const answers={who:$('who').value,why:$('why').value,proof:$('proof').value},choice=document.querySelector('input[name="choice"]:checked')?.value;
  const result=file.deduce(answers,choice);persist();if(result.success){sound.effect('solve');haptic([30,50,60,70,90]);closePanel();showEnding(choice);}
  else{sound.effect('fail');haptic(50);$('deductionError').textContent=result.reason+(file.mistakes>=2?' Indice : la disparition peut avoir été organisée par la personne disparue.':'');}
 }
 function showEnding(ending){closePanel();addClass('intro','active-view',false);addClass('world','active-view',false);addClass('ending','hidden',false);
  const protectedPath=ending==='protect';$('endingTitle').textContent=protectedPath?'LA PROMESSE TENUE':'LE PRIX DE LA VÉRITÉ';
  $('endingLead').textContent='Mara n’a jamais quitté l’hôtel. Elle a fabriqué sa disparition avec l’aide de Nina et de Louis pour gagner quelques heures.';
  $('endingText').textContent=protectedPath?
   'Tu retrouves Mara sous la verrière et lui rends la lettre sans alerter les autorités. À minuit, les trois complices présentent l’ancien acte de propriété. La vente est suspendue. L’hôtel respire enfin — mais garder un secret laisse toujours une ombre derrière soi.':
   'Tu remets ton rapport au commissaire. La machination est révélée, les signatures examinées et la vente provisoirement bloquée. Mara accepte les conséquences de son mensonge. Tu as sauvé les preuves, mais Nina ne te pardonne pas si facilement. Certaines vérités réparent ; d’autres blessent.';
  $('endingStats').textContent=file.count+' / 12 souvenirs retrouvés · '+Object.keys(file.asked).length+' questions posées · '+file.mistakes+' hypothèses écartées';persist();
 }
 function back(){if(panel)closePanel();else if(!$('ending').classList.contains('hidden'))showIntro();else if($('world').classList.contains('active-view'))showIntro();}
 $('begin').addEventListener('click',start);$('homeMenu').addEventListener('click',showIntro);$('settingsToggle').addEventListener('click',()=>{mute=!mute;sound.mute(mute);$('settingsToggle').textContent=mute?'♩̸':'♫';toast(mute?'Ambiance en sourdine':'Ambiance restaurée');});
 document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{sound.ensure();switch(b.dataset.open){case 'map':openMap();break;case 'notebook':openNotebook();break;case 'dialogue':openDialog();}}));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closePanel));$('shade').addEventListener('click',closePanel);
 $('timeSlider').addEventListener('input',e=>{frameIndex=Number(e.target.value);renderMemory();sound.effect('tick');});
 $('recordBtn').addEventListener('click',collect);$('solveBtn').addEventListener('click',openVerdict);$('submitVerdict').addEventListener('click',submitVerdict);
 document.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>{activePerson=b.dataset.person;renderDialog();sound.effect('open');}));
 $('replay').addEventListener('click',()=>{if(!confirm('Recommencer ce dossier et effacer sa progression actuelle ?'))return;file=new CaseFile();persist();showIntro();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back();}});
 window.palimpsesteBack=back;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&sound.ctx)sound.ctx.suspend().catch(()=>{});else if(!mute)sound.ensure();});
 if(new URLSearchParams(location.search).has('test'))window.__palimpsesteTest={file:()=>file,renderScene,start,openMemory,openNotebook,openDialog,submitVerdict};
 uiCount();showIntro();
})();
