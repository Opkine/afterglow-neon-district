// Optional local visual QA (not part of Android CI): node tests/render-city.cjs
// Uses @napi-rs/canvas from the Codex development runtime.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'../game');
const browser={
  window:{},document:{createElement:tag=>{if(tag!=='canvas')throw Error('canvas only');return createCanvas(720,310);}},
  performance:{now:()=>1200},Math,Number,Array,Object,String,console,Uint8Array
};
vm.createContext(browser);
for(const f of ['vendor/tween.umd.js','visuals.js','cityscape.js']){
  vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),browser,{filename:f});
  if(f==='vendor/tween.umd.js')browser.window.TWEEN=browser.TWEEN;
}
const skyline=browser.window.AfterglowArt;
const final=createCanvas(1440,930),out=final.getContext('2d');
const colorCounts=[];
for(const [i,done] of [0,4,20,40,80].entries()){
  const canvas=createCanvas(720,310);
  skyline.city(canvas.getContext('2d'),1200,done/80,{name:'Minuit',bg:'#141d43',color:'#64efff'},0,true);
  const data=canvas.getContext('2d').getImageData(0,80,720,180).data;
  let colorful=0;
  for(let j=0;j<data.length;j+=4){
    const r=data[j],g=data[j+1],b=data[j+2];
    if(Math.max(r,g,b)>130&&Math.max(r,g,b)-Math.min(r,g,b)>45)colorful++;
  }
  colorCounts.push(colorful);
  const scale=.5,row=Math.floor(i/2),col=i%2;
  out.drawImage(canvas,col*720,row*310,720,310);
  out.font='bold 20px sans-serif';out.fillStyle='#ffffff';
  out.fillText(done+' / 80 SECTEURS',col*720+15,row*310+28);
}
fs.mkdirSync(path.join(__dirname,'../docs'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'../docs/city-progression-v13.png'),final.toBuffer('image/png'));
assert(colorCounts.every((count,i)=>i===0||count>colorCounts[i-1]),'New sectors must measurably increase colorful pixels');
console.log('Created docs/city-progression-v13.png; saturated skyline pixels:',colorCounts.join(' → '));
