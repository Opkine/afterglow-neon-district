const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Story=require('../game/story.js');
class Element{
 constructor(id=''){this.id=id;this._classes=new Set(['hidden']);this.children=[];this.style={};this.dataset={};this.listeners={};this.value='';this.textContent='';this.firstChild={textContent:'OUVRIR LE DOSSIER '};this.disabled=false;this._inner='';}
 get classList(){return{add:k=>this._classes.add(k),remove:k=>this._classes.delete(k),contains:k=>this._classes.has(k),toggle:(k,on)=>{const v=on===undefined?!this._classes.has(k):on;if(v)this._classes.add(k);else this._classes.delete(k);return v;}};}
 get innerHTML(){return this._inner;}set innerHTML(s){this._inner=s;this.children=[];}
 addEventListener(k,fn){this.listeners[k]=fn;}
 setAttribute(k,v){this[k]=v;}
 append(...v){this.children.push(...v);}remove(){}
 click(){this.listeners.click?.({target:this});}
}
test('entire UI state machine: intro, scene, memory, clues, notebook, deduction, ending',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../game/index.html'),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),map=new Map(ids.map(id=>[id,new Element(id)]));
 assert.ok(ids.length>35);
 const doc={body:{style:{}},getElementById:id=>map.get(id),createElement:tag=>new Element(tag),querySelectorAll:()=>[],querySelector:q=>q.includes('choice')?{value:'protect'}:null,addEventListener:()=>{}};
 let saved='';const win={PalimpsesteStory:Story,PalimpsesteAudio:class{ensure(){}effect(){}mute(){}},addEventListener:()=>{}};
 const globals={window:win,document:doc,URLSearchParams,location:{search:'?test=1'},localStorage:{getItem:()=>saved||null,setItem:(k,v)=>{saved=v;}},navigator:{vibrate:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},console,confirm:()=>true};
 const js=fs.readFileSync(path.resolve(__dirname,'../game/main.js'),'utf8');vm.runInNewContext(js,globals);
 const app=win.__palimpsesteTest;assert.ok(app);assert.equal(map.get('intro').classList.contains('active-view'),true);
 app.start();assert.equal(map.get('world').classList.contains('active-view'),true);assert.equal(map.get('hotspots').children.length,4);
 app.openMemory('clock');assert.equal(map.get('memory').classList.contains('hidden'),false);
 const slider=map.get('timeSlider');slider.listeners.input({target:{value:'2'}});
 assert.equal(map.get('recordBtn').disabled,false);map.get('recordBtn').click();assert.equal(app.file().count,1);
 app.file().move('garden');app.renderScene();assert.equal(map.get('hotspots').children.length,4);
 for(const o of Story.OBJECTS)app.file().collect(o.id,o.truth);
 assert.equal(app.file().canDeduce,true);app.openNotebook();assert.equal(map.get('notesList').children.length,12);
 app.openDialog('nina');assert.equal(map.get('questions').children.length,3);
 assert.ok(saved.includes('clues'));
 map.get('who').value='mara';map.get('why').value='garden';map.get('proof').value='letter';app.submitVerdict();
 assert.equal(app.file().ending,'protect');assert.equal(map.get('ending').classList.contains('hidden'),false);
});
