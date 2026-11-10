/* Optional headless visual-check render; uses canvas available in Codex runtime. */
const fs=require('node:fs');const path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const engine=require('../game/engine.js');global.Image=class {set src(_) {}};global.window={AstraEngine:engine};
const gameDir=path.resolve(__dirname,'../game');process.chdir(gameDir);
require('../game/painter.js');
const c=createCanvas(engine.W,engine.H);const p=new window.AstraPainter(c);
const g=new engine.GravityGame({stage:16,seed:550});
g.motes=[{x:325,y:475,type:0,trail:[[360,360],[352,387],[346,416],[337,448]]},{x:416,y:663,type:1,trail:[[470,540],[460,571],[445,598],[426,638]]},{x:542,y:489,type:2,trail:[[600,350],[583,397],[568,437],[552,473]]},{x:170,y:700,type:0,trail:[[91,650],[115,667],[139,680],[164,696]]}];
(async()=>{
  p.bg=await loadImage(path.resolve(gameDir,'assets/cosmos.webp'));p.ready=true;
  for(let i=0;i<10;i++)p.render(g,{active:true,x:355,y:567},1/60);
  fs.mkdirSync(path.resolve(__dirname,'../dist'),{recursive:true});
  fs.writeFileSync(path.resolve(__dirname,'../dist/scene-preview.png'),c.toBuffer('image/png'));
  const a=createCanvas(720,650);p.garden(a,10);fs.writeFileSync(path.resolve(__dirname,'../dist/atlas-preview.png'),a.toBuffer('image/png'));
  process.stdout.write('Scene and garden previews rendered.\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
