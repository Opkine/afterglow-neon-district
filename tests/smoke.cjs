const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const nodePath = require('node:path');

function findPath(tiles) {
  const C=6,R=7;
  const adj=i=>[i%C>0?i-1:-1,i%C<C-1?i+1:-1,i>=C?i-C:-1,i<C*(R-1)?i+C:-1].filter(x=>x>=0);
  function dfs(path){if(path.length>=3)return path;for(const n of adj(path.at(-1)))if(tiles[n]===tiles[path[0]]&&!path.includes(n)){const found=dfs([...path,n]);if(found)return found;}return null;}
  for(let i=0;i<tiles.length;i++){const result=dfs([i]);if(result)return result;}
  return null;
}

(async()=>{
  const browser=await chromium.launch({headless:true, executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({...devices['Pixel 7'],viewport:{width:393,height:851},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8765/?test=1',{waitUntil:'networkidle'});
  assert.equal(await page.title(),'AFTERGLOW • Neon District');
  assert(await page.locator('#modal-veil').isVisible(),'Onboarding should open on first launch');
  await page.getByRole('button',{name:'JE RALLUME LA VILLE'}).click();
  const before=await page.evaluate(()=>window.__afterglowTest.state().game);
  const path=findPath(before.tiles);assert(path,'Board must have a playable path');
  const box=await page.locator('#board').boundingBox();
  const point=i=>({x:box.x+(10+((i%6)+.5)*(580/6))/600*box.width,y:box.y+(10+(Math.floor(i/6)+.5)*(680/7))/700*box.height});
  await page.mouse.move(point(path[0]).x,point(path[0]).y);
  await page.mouse.down();
  for(const i of path.slice(1)){await page.mouse.move(point(i).x,point(i).y,{steps:8});}
  await page.mouse.up();
  const after=await page.evaluate(()=>window.__afterglowTest.state().game);
  assert.equal(after.moves,before.moves-1,'A valid swipe should consume exactly one move');
  assert(after.score>0,'A valid swipe should score points');
  await page.reload({waitUntil:'networkidle'});
  assert.equal((await page.evaluate(()=>window.__afterglowTest.state().game)).moves,after.moves,'Moves should survive a reload');
  await page.locator('[data-view="city"]').click();
  assert(await page.getByText('LA CITÉ RENAÎT').isVisible());
  await page.locator('[data-view="daily"]').click();
  assert(await page.getByText('LE SIGNAL DU JOUR').isVisible());
  await page.getByRole('button',{name:'LANCER LE DÉFI'}).click();
  assert.equal((await page.evaluate(()=>window.__afterglowTest.state().game)).mode,'daily');
  await page.locator('[data-view="settings"]').click();
  assert(await page.getByText('PERSONNALISER').isVisible());
  const sound=await page.locator('[data-setting="sound"]').innerText();
  await page.locator('[data-setting="sound"]').click();
  assert.notEqual(await page.locator('[data-setting="sound"]').innerText(),sound);
  await page.locator('[data-view="play"]').click();
  await page.screenshot({path:nodePath.join(__dirname,'smoke-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[],'No uncaught JavaScript errors');
  console.log('PASS: onboarding, valid gesture, scoring, persistence, city, daily, settings, responsive screenshot, no JS errors');
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
