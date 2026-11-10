const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const file=(name)=>fs.readFileSync(path.join(root,name));
const html=file('game/index.html').toString('utf8');
const scripts=[
  'vendor/howler.core.min.js','vendor/confetti.browser.min.js',
  'vendor/tween.umd.js','soundtrack.js','visuals.js','cityscape.js','skills.js','main.js'
];
let position=0;
for(const name of scripts){
  const index=html.indexOf(`src="${name}"`);
  assert(index>position,`Missing or unordered local script: ${name}`);
  position=index;
  assert(file('game/'+name).length>200,`Empty script: ${name}`);
}
assert(html.includes('style.css')&&!/src="https?:/.test(html),'HTML must use only bundled assets');
const samples=['click1','click2','click3','click4','click5','switch8','switch12','switch16','switch29','switch38'];
for(const sample of samples){
  const wav=file(`game/audio/${sample}.wav`);
  assert(wav.length>1000,`Tiny audio asset ${sample}`);
  assert.equal(wav.toString('ascii',0,4),'RIFF');
  assert.equal(wav.toString('ascii',8,12),'WAVE');
}
assert.equal(file('game/fonts/InterVariable.woff2').toString('ascii',0,4),'wOF2');
assert(file('game/vendor/LICENSE-howler.md').length>200);
assert(file('game/vendor/LICENSE-confetti.txt').length>200);
assert(file('game/vendor/TWEEN_LICENSE.txt').toString('utf8').includes('The MIT License'));
assert(file('game/cityscape.js').toString('utf8').includes('const buildings=[]'));
assert(file('game/audio/LICENSE-kenney.txt').length>80);
assert(file('game/fonts/LICENSE-Inter.txt').length>200);
const gradle=file('android/app/build.gradle').toString('utf8');
assert(gradle.includes("versionName '1.3.0'"));
assert(gradle.includes('versionCode 4'));
assert(gradle.includes("applicationIdSuffix '.preview13'"));
console.log(`PASS: ${scripts.length} local scripts, ${samples.length} CC0 WAV files, OFL font, MIT licenses, offline load order, v1.3.0.`);
