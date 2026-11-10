/* PALIMPSESTE — La Disparue de l'Hôtel des Écumes. Fiction originale. */
((root,fn)=>{const api=fn();if(typeof module==='object'&&module.exports)module.exports=api;root.PalimpsesteStory=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const HOURS=['20 h 15','20 h 45','21 h 13','22 h 10'];
  const LOCATIONS=[
    {id:'room',name:'CHAMBRE 307',short:'Là où tout a commencé',asset:'room.webp',lead:'Une chambre trop bien rangée pour un départ précipité.',tone:'#af613c'},
    {id:'lobby',name:'LE GRAND HALL',short:'La dernière présence',asset:'lobby.webp',lead:'Le registre garde une autre version de la soirée.',tone:'#738e77'},
    {id:'garden',name:'LA VERRIÈRE',short:'Le jardin interdit',asset:'garden.webp',lead:'Sous les feuilles, personne ne ment tout à fait.',tone:'#76946a'}
  ];
  const OBJECTS=[
    {id:'clock',scene:'room',x:14,y:24,name:'L’horloge arrêtée',stamp:'Horlogerie',truth:2,icon:'Ⅻ',clue:'Le temps fabriqué',tag:'TEMPS',evidence:'Quelqu’un a immobilisé les aiguilles à 21 h 13. Ce n’est pas l’heure réelle d’un départ.',frames:[
      'Les aiguilles poursuivent leur course. L’hôtel respire encore.',
      'Un pas léger. Une femme s’approche du cadran, une épingle à cheveux entre les doigts.',
      'La main de Mara bloque les aiguilles sur 21 h 13. Un geste volontaire, soigneusement préparé.',
      'Le couloir s’agite. L’horloge reste muette, incapable de témoigner.'
    ]},
    {id:'suitcase',scene:'room',x:19,y:76,name:'La valise ouverte',stamp:'Cuir patiné',truth:0,icon:'▣',clue:'Un faux départ',tag:'INTENTION',evidence:'La valise a été préparée pour être vue. Les vêtements de Mara sont restés dans l’armoire.',frames:[
      'Mara remplit sa valise de vieux journaux et recouvre le tout d’une écharpe. Rien d’indispensable.',
      'Elle laisse la valise grande ouverte, visible dès l’entrée.',
      'La serrure est intacte. Personne ne semble avoir vraiment emporté ce bagage.',
      'La valise n’a pas bougé. Un départ qui ressemble à une mise en scène.'
    ]},
    {id:'postcard',scene:'room',x:77,y:61,name:'La carte postale rouge',stamp:'Papier et encre',truth:1,icon:'✉',clue:'Un rendez-vous secret',tag:'RENDEZ-VOUS',evidence:'Nina a fixé à Mara un rendez-vous sous la verrière, avant la disparition.',frames:[
      'Une carte vierge attend sur le bureau. Les couleurs du port sèchent sous le soleil.',
      'Nina écrit : « Sous la verrière, avant la cloche. Je serai là. » Puis elle retourne la carte.',
      'Mara laisse la carte à découvert. Elle semble vouloir qu’on la trouve.',
      'La brise déplace le papier. Ce qui ressemble à un message banal devient une convocation.'
    ]},
    {id:'balcony',scene:'room',x:83,y:31,name:'La porte du balcon',stamp:'Bois et sel marin',truth:3,icon:'☼',clue:'Aucune fuite par la mer',tag:'TRAJET',evidence:'Le balcon n’a servi à aucune fuite. La poussière sur le seuil est restée intacte.',frames:[
      'La mer est calme, des mouettes passent derrière les volets.',
      'Le vent pousse la porte contre son montant. Aucun pas ne traverse le seuil.',
      'Une ombre s’approche, puis recule sans sortir.',
      'Le sable fin du seuil forme toujours la même ligne. Personne n’a franchi le balcon.'
    ]},
    {id:'register',scene:'lobby',x:48,y:75,name:'Le registre des arrivées',stamp:'Encre violette',truth:2,icon:'≋',clue:'Le registre falsifié',tag:'TÉMOIGNAGE',evidence:'Louis a corrigé une heure dans le registre pour laisser croire que Mara avait quitté l’hôtel.',frames:[
      'Les noms défilent. Louis signe chaque arrivée avec une précision presque maniaque.',
      'Une page a été laissée vierge au milieu des arrivées du soir.',
      'Louis rature 20 h 58 et inscrit 21 h 13 à côté du nom de Mara. Ses mains tremblent.',
      'De nouvelles lignes masquent la correction. Seule l’encre encore humide trahit le changement.'
    ]},
    {id:'bell',scene:'lobby',x:86,y:74,name:'La clochette de bronze',stamp:'Bronze',truth:2,icon:'♧',clue:'Trois coups convenus',tag:'SIGNAL',evidence:'Trois coups de clochette ont été frappés à 21 h 13 : un signal, pas une demande de service.',frames:[
      'La clochette ne sonne qu’une fois à l’arrivée d’un client.',
      'Louis essuie le comptoir, l’œil rivé à l’escalier.',
      'Trois notes précipitées résonnent. Louis tourne aussitôt son regard vers la verrière.',
      'Le bronze refroidit. Aucun client n’a demandé de chambre.'
    ]},
    {id:'umbrella',scene:'lobby',x:18,y:49,name:'Le parapluie vert',stamp:'Tissu humide',truth:1,icon:'◈',clue:'La terre rouge',tag:'PASSAGE',evidence:'Nina est passée par la verrière avant la disparition. Une argile rouge reste sur l’embout de son parapluie.',frames:[
      'Le parapluie est sec. Il appartient à Nina, reconnaissable à son manche gravé.',
      'Nina revient du jardin, le bout du parapluie couvert d’argile rouge. Aucun nuage ne menaçait pourtant.',
      'Elle tente d’essuyer la boue sur le tapis. La trace demeure.',
      'Un parfum de terre mouillée subsiste. Pourquoi dissimuler une simple promenade ?'
    ]},
    {id:'telegram',scene:'lobby',x:87,y:36,name:'Le télégramme scellé',stamp:'Sceau administratif',truth:3,icon:'▤',clue:'La vente à minuit',tag:'MOBILE',evidence:'Une vente forcée de la verrière doit être signée à minuit. L’hôtel est endetté, le jardin menacé.',frames:[
      'Un coursier remet une enveloppe au directeur. Celui-ci pâlit en voyant le cachet.',
      'Le télégramme est caché derrière une annonce mondaine.',
      'Une main pousse le papier vers le bas du panneau. La date de vente apparaît.',
      'Le texte se révèle : « Acte de cession irrévocable, minuit. La verrière sera détruite. »'
    ]},
    {id:'photo',scene:'garden',x:17,y:29,name:'La photographie de famille',stamp:'Argentique',truth:0,icon:'▥',clue:'Le jardin des deux sœurs',tag:'LIEN',evidence:'Mara et Nina ont grandi ensemble dans cette verrière. Elles y ont fait une promesse à leur grand-mère.',frames:[
      'Deux enfants, Mara et Nina, promettent à leur grand-mère de ne jamais laisser vendre la verrière.',
      'La photo s’estompe au soleil. Un doigt a récemment essuyé les visages.',
      'Nina regarde la photographie, puis détourne les yeux en entendant la cloche.',
      'La promesse est toujours là, derrière la vitre fendue.'
    ]},
    {id:'key',scene:'garden',x:13,y:72,name:'La petite clé d’argent',stamp:'Métal poli',truth:2,icon:'⚿',clue:'La porte verrouillée de l’intérieur',tag:'ISSUE',evidence:'La clé a été utilisée de l’intérieur après la disparition présumée : Mara pouvait être cachée ici.',frames:[
      'La clé pend à un crochet près des outils de jardin.',
      'Une main l’enlève du crochet. Des pas rapides traversent les carreaux.',
      'La serrure tourne depuis l’intérieur, et la clé tombe derrière le battant. Aucune effraction.',
      'La clé est ramassée et glissée dans une boîte en bois.'
    ]},
    {id:'letter',scene:'garden',x:51,y:54,name:'La lettre cachetée',stamp:'Cire rouge',truth:3,icon:'✉',clue:'Le billet de Mara',tag:'PREUVE',evidence:'Mara a écrit : « Je vais bien. Laissez-moi une nuit pour empêcher la vente. »',frames:[
      'Une enveloppe neuve attend sur la table de rempotage.',
      'Le papier porte une esquisse de la verrière, pas encore de mots.',
      'Une écriture pressée remplit la page. La signature de Mara apparaît.',
      '« Je vais bien. Laissez-moi une nuit pour empêcher la vente. » La cire est encore tendre.'
    ]},
    {id:'notebook',scene:'garden',x:75,y:73,name:'Le carnet de Mara',stamp:'Journal personnel',truth:1,icon:'▤',clue:'Le plan du jardin',tag:'RÉSOLUTION',evidence:'Mara a préparé une fausse disparition avec Nina et Louis pour retarder la signature et sauver la verrière.',frames:[
      'Des dessins de fleurs et de verrières occupent les premières pages.',
      '« Nina préviendra Louis. La chambre restera ouverte. À minuit, je présenterai l’ancien acte. »',
      'Une page est arrachée. Les mots « ne leur dis pas où je suis » restent au bord.',
      'Le carnet est remis sous un pot. Un plan trop précis pour être né de la panique.'
    ]}
  ];
  const PEOPLE={
    nina:{name:'Nina Varela',role:'Sœur de Mara',portrait:'N',line:'« Je ne vous demande pas de me croire. Je vous demande de regarder. »',questions:[
      {q:'Pourquoi teniez-vous ce parapluie ?',a:'« Parce que j’avais peur qu’il pleuve, évidemment… Mais oui, je suis allée voir la verrière. »',trust:1},
      {q:'Avez-vous vu Mara après vingt heures ?',a:'« Son visage, oui. Elle souriait. Pour la première fois depuis des semaines. »',trust:1},
      {q:'Pourquoi parler d’enlèvement ?',a:'« Si je dis la vérité trop tôt, nous perdons tout. Je regrette ce mensonge. »',trust:1}
    ]},
    louis:{name:'Louis Mercier',role:'Concierge de l’hôtel',portrait:'L',line:'« Les murs ont des oreilles ; mon registre aussi. »',questions:[
      {q:'Pourquoi modifier l’heure ?',a:'« Pour qu’ils cherchent au mauvais endroit. Je n’ai fait de mal à personne. »',trust:1},
      {q:'À qui s’adressaient les trois coups ?',a:'« À qui attendait derrière la verrière. C’était le signal convenu. »',trust:1},
      {q:'Que savez-vous de la vente ?',a:'« Assez pour savoir qu’elle aurait dû être annulée depuis longtemps. »',trust:1}
    ]}
  };
  const CRITICAL=['postcard','telegram','notebook','letter','register'];
  const VALID={who:'mara',why:'garden',proof:'letter'};
  const REQUIRED=6;
  const HINTS={
    clock:['Les aiguilles peuvent mentir : une heure fixe n’est pas forcément une heure vraie.','Cherche le geste qui immobilise l’horloge autour de 21 h 13.','À 21 h 13, Mara arrête elle-même les aiguilles.'],
    suitcase:['Une valise ouverte prouve-t-elle vraiment qu’on est parti ?','Regarde la valise avant que le drame ne commence.','À 20 h 15, Mara garnit la valise de journaux, pas de vêtements.'],
    postcard:['Une carte postale peut contenir un rendez-vous.','Cherche qui écrit sur la carte avant 21 h.','À 20 h 45, Nina donne rendez-vous à Mara sous la verrière.'],
    balcony:['La porte du balcon raconte aussi les passages qui n’ont pas eu lieu.','Examine le seuil lorsque la chambre est déjà abandonnée.','À 22 h 10, le sable du seuil est intact : personne ne s’est enfui par là.'],
    register:['Une heure a été corrigée dans un document officiel.','Concentre-toi sur la soirée autour de 21 h 13.','À 21 h 13, Louis falsifie l’heure de sortie de Mara.'],
    bell:['Une clochette sert parfois à transmettre un code.','Écoute les coups de sonnette à l’heure supposée du départ.','À 21 h 13, Louis fait sonner la clochette trois fois : un signal.'],
    umbrella:['Un objet humide peut indiquer le chemin d’une personne.','Qui portait le parapluie avant la disparition ?','À 20 h 45, Nina revient de la verrière avec de la terre rouge.'],
    telegram:['Le mobile se trouve peut-être dans les affaires de l’hôtel.','Lis ce qui arrive après que le directeur cache le télégramme.','À 22 h 10, le télégramme annonce la vente et la destruction de la verrière.'],
    photo:['Une vieille photo peut révéler ce que les personnages veulent protéger.','Retourne aux souvenirs de jeunesse, avant la soirée.','À 20 h 15, la photo rappelle la promesse faite à leur grand-mère.'],
    key:['Cette clé sert surtout à savoir de quel côté la porte a été fermée.','Observe la serrure au moment où tout bascule.','À 21 h 13, la verrière est verrouillée de l’intérieur.'],
    letter:['La preuve décisive est parfois un message écrit après la disparition.','Reviens à la lettre à l’instant le plus tardif.','À 22 h 10, Mara écrit qu’elle va bien et demande une nuit de répit.'],
    notebook:['Le carnet donne la raison de toute la mise en scène.','Lis les pages avant que l’heure de disparition soit fabriquée.','À 20 h 45, Mara consigne son plan pour empêcher la vente.']
  };
  const FIELD_HINTS={
    who:['Une disparition préparée n’est pas forcément un enlèvement.','Compare l’horloge arrêtée, la valise et le carnet de Mara.','Mara a organisé sa propre disparition.'],
    why:['Cherche un événement imminent qui toucherait toute la famille.','Le télégramme et le carnet parlent tous deux de la verrière.','Le but était d’empêcher la vente et la destruction du jardin.'],
    proof:['Quelle trace permet de savoir que Mara est encore là après 21 h 13 ?','Un message retrouvé dans la verrière est daté après la disparition.','La lettre de Mara est la preuve décisive.']
  };
  class CaseFile{
    constructor(saved){this.version=1;this.scene='room';this.clues=[];this.seen={};this.asked={};this.hints={};this.deductionHints=0;this.trust=0;this.mistakes=0;this.ending=null;this.started=true;
      if(saved&&saved.version===1){if(LOCATIONS.some(x=>x.id===saved.scene))this.scene=saved.scene;
        this.clues=Array.isArray(saved.clues)?saved.clues.filter(id=>OBJECTS.some(o=>o.id===id)).slice(0,OBJECTS.length):[];
        this.seen=saved.seen&&typeof saved.seen==='object'?saved.seen:{};
        this.asked=saved.asked&&typeof saved.asked==='object'?saved.asked:{};
        if(saved.hints&&typeof saved.hints==='object')this.hints=Object.fromEntries(Object.entries(saved.hints).filter(([id])=>OBJECTS.some(o=>o.id===id)).map(([id,n])=>[id,Math.max(0,Math.min(3,Number(n)||0))]));
        this.deductionHints=Math.max(0,Math.min(3,Number(saved.deductionHints)||0));
        this.trust=Math.max(0,Math.min(6,Number(saved.trust)||0));this.mistakes=Math.max(0,Math.min(100,Number(saved.mistakes)||0));
        if(['reveal','protect'].includes(saved.ending))this.ending=saved.ending;
      }
    }
    get count(){return this.clues.length;}
    get canDeduce(){return this.count>=REQUIRED&&CRITICAL.every(k=>this.clues.includes(k));}
    get essentialCount(){return CRITICAL.filter(id=>this.clues.includes(id)).length;}
    get remaining(){return Math.max(0,REQUIRED-this.count);}
    get nextLead(){const first=CRITICAL.find(id=>!this.clues.includes(id))||OBJECTS.find(o=>!this.clues.includes(o.id))?.id;
      const o=OBJECTS.find(x=>x.id===first);return o?{id:o.id,object:o.name,place:LOCATIONS.find(l=>l.id===o.scene),hour:HOURS[o.truth],isEssential:CRITICAL.includes(o.id)}:null;
    }
    get completion(){return Math.round(this.count/OBJECTS.length*100);}
    move(place){if(!LOCATIONS.some(l=>l.id===place))return false;this.scene=place;return true;}
    study(id,index){const obj=OBJECTS.find(x=>x.id===id);if(!obj||!Number.isInteger(index)||index<0||index>=HOURS.length)return null;
      this.seen[id]=Math.max(this.seen[id]||0,index+1);return{...obj,hour:HOURS[index],text:obj.frames[index],canCollect:index===obj.truth&&!this.clues.includes(id),already:this.clues.includes(id)};
    }
    collect(id,index){const o=OBJECTS.find(x=>x.id===id);if(!o||o.truth!==index||this.clues.includes(id))return false;this.clues.push(id);return true;}
    hint(id){if(!HINTS[id]||this.clues.includes(id))return null;const tier=Math.min(3,(this.hints[id]||0)+1);this.hints[id]=tier;return{text:HINTS[id][tier-1],tier,hour:tier>=2?HOURS[OBJECTS.find(x=>x.id===id).truth]:null};}
    verdictHint(answers){const wrong=Object.keys(VALID).find(k=>answers?.[k]!==VALID[k])||'proof';this.deductionHints=Math.min(3,this.deductionHints+1);
      return{field:wrong,tier:this.deductionHints,text:FIELD_HINTS[wrong][this.deductionHints-1]};}
    ask(person,index){const p=PEOPLE[person];if(!p||!p.questions[index])return null;const key=person+'-'+index;
      if(!this.asked[key]){this.asked[key]=true;this.trust=Math.min(6,this.trust+p.questions[index].trust);}
      return p.questions[index].a;
    }
    deduce(answers,choice){if(!this.canDeduce)return{success:false,reason:'Il manque des preuves essentielles.'};
      if(!answers||!Object.keys(VALID).every(k=>answers[k]===VALID[k])){this.mistakes++;return{success:false,reason:'Une de ces déductions est contredite par les preuves.',wrongFields:Object.keys(VALID).filter(k=>answers?.[k]!==VALID[k])};}
      if(!['protect','reveal'].includes(choice))return{success:false,reason:'Choisis ce que tu feras de la vérité.'};
      this.ending=choice;return{success:true,ending:choice,trust:this.trust};
    }
    snapshot(){return{version:1,scene:this.scene,clues:[...this.clues],seen:{...this.seen},asked:{...this.asked},hints:{...this.hints},deductionHints:this.deductionHints,trust:this.trust,mistakes:this.mistakes,ending:this.ending};}
  }
  return{HOURS,LOCATIONS,OBJECTS,PEOPLE,CRITICAL,REQUIRED,VALID,CaseFile};
});
