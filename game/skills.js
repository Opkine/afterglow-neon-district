/* AFTERGLOW — original, deterministic puzzle helpers and power mechanics. */
(() => {
  'use strict';
  const KEYS=['bomb','row','column','color'];
  const BOOSTS={
    bomb:{name:'BOMBE NOVA',symbol:'✹',price:130,description:'Détruit 9 cristaux autour de la cible.'},
    row:{name:'LASER H',symbol:'⇆',price:110,description:'Élimine toute une rangée.'},
    column:{name:'LASER V',symbol:'↕',price:110,description:'Élimine toute une colonne.'},
    color:{name:'PRISME',symbol:'✧',price:260,description:'Dissout tous les cristaux de la couleur choisie.'}
  };
  function cells(power,origin,board,C=6,R=7){
    if(!KEYS.includes(power)||!Number.isInteger(origin)||origin<0||origin>=C*R)return [];
    const x=origin%C,y=Math.floor(origin/C),indices=new Set();
    if(power==='bomb'){
      for(let yy=Math.max(0,y-1);yy<=Math.min(R-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(C-1,x+1);xx++)indices.add(yy*C+xx);
    }else if(power==='row'){for(let xx=0;xx<C;xx++)indices.add(y*C+xx);}
    else if(power==='column'){for(let yy=0;yy<R;yy++)indices.add(yy*C+x);}
    else if(power==='color'){const target=board[origin];for(let i=0;i<board.length;i++)if(board[i]===target)indices.add(i);}
    return [...indices].sort((a,b)=>a-b);
  }
  function hint(board,targets=[],collected=[],required=10,C=6,R=7){
    if(!Array.isArray(board)||board.length!==C*R)return [];
    let winner=[],best=-1,visits=0;
    const seen=new Uint8Array(board.length),maxVisits=14500;
    function examine(path,color){
      if(path.length<3)return;
      const needed=targets.includes(color)&&collected[color]<required;
      const score=path.length*2+(needed?9:0);
      if(score>best){best=score;winner=[...path];}
    }
    function dfs(i,color,path){
      if(++visits>maxVisits)return;
      examine(path,color);
      if(path.length>=8)return;
      const x=i%C,y=Math.floor(i/C);
      const next=[x>0?i-1:-1,x<C-1?i+1:-1,y>0?i-C:-1,y<R-1?i+C:-1];
      for(const n of next){if(n<0||seen[n]||board[n]!==color)continue;seen[n]=1;path.push(n);dfs(n,color,path);path.pop();seen[n]=0;}
    }
    for(let i=0;i<board.length&&visits<maxVisits;i++){
      const col=board[i];seen.fill(0);seen[i]=1;dfs(i,col,[i]);
      if(winner.length===8&&targets.includes(col)&&collected[col]<required)break;
    }
    return winner;
  }
  const api={BOOSTS,KEYS,cells,hint};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.AfterglowSkills=api;
})();
