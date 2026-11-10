/* AFTERGLOW audio director. Howler.js (MIT) plays Kenney UI Audio (CC0).
   The adaptive ambient score is original to LayAdam corp and synthesized offline. */
(() => {
  'use strict';
  const Howl = window.Howl, Howler = window.Howler;
  const FILES = {
    touch: 'click1', link: 'click2', collect: 'click4', burst: 'switch16',
    epic: 'switch38', win: 'switch29', fail: 'switch8', menu: 'click3',
    purchase: 'switch12', spark: 'click5'
  };
  const sounds = {};
  if (Howl) for (const [name, file] of Object.entries(FILES)) {
    sounds[name] = new Howl({src: [`audio/${file}.wav`], preload: true,
      volume: name === 'epic' ? .29 : name === 'burst' ? .22 : .16});
  }

  let enabledSfx = true, enabledMusic = true, musicGain = null;
  let timer = null, ctx = null, nextAt = 0, step = 0;
  const BPM = 97, STEP = 60 / BPM / 2;
  const chordRoots = [50, 46, 53, 48]; // Ré mineur / Si♭ / Fa / Do.
  let noiseBuffer = null;
  function midi(note) { return 440 * Math.pow(2, (note - 69) / 12); }
  function ready() {
    try {
      ctx = Howler?.ctx || (ctx || new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === 'suspended') ctx.resume();
      if (!musicGain) {
        musicGain = ctx.createGain();
        musicGain.gain.value = .0001;
        musicGain.connect(ctx.destination);
      }
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * .35, ctx.sampleRate);
        const ch = noiseBuffer.getChannelData(0);
        // Deterministic, band-limited transient source.
        let state = 314159;
        for (let i=0;i<ch.length;i++) {
          state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
          ch[i] = ((state >>> 0) / 2147483648 - 1) * (1-i/ch.length);
        }
      }
      return true;
    } catch (_) { return false; }
  }
  function voice(note, when, duration, type='sine', volume=.08, filterHz=1900) {
    if (!ctx || !musicGain) return;
    const osc = ctx.createOscillator(), env = ctx.createGain(), low = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = midi(note);
    low.type = 'lowpass'; low.frequency.value = filterHz; low.Q.value = .3;
    env.gain.setValueAtTime(.0001, when);
    env.gain.exponentialRampToValueAtTime(volume, when + Math.min(.25, duration*.18));
    env.gain.exponentialRampToValueAtTime(.0001, when + duration);
    osc.connect(low); low.connect(env); env.connect(musicGain);
    osc.start(when); osc.stop(when + duration + .03);
  }
  function pad(root, when) {
    [0, 3, 7, 10].forEach((interval,i) => {
      voice(root+12+interval, when+i*.05, 6.8, i%2?'triangle':'sine', .025, 820);
      voice(root+24+interval, when+i*.07, 5.4, 'sine', .010, 1700);
    });
  }
  function drum(when, strong) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(strong?112:82,when);
    o.frequency.exponentialRampToValueAtTime(43,when+.22);
    g.gain.setValueAtTime(strong?.20:.09,when);
    g.gain.exponentialRampToValueAtTime(.0001,when+.28);
    o.connect(g);g.connect(musicGain);o.start(when);o.stop(when+.3);
  }
  function hat(when) {
    if (!noiseBuffer) return;
    const src=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g=ctx.createGain();
    src.buffer=noiseBuffer;hp.type='highpass';hp.frequency.value=6500;
    g.gain.setValueAtTime(.024,when);g.gain.exponentialRampToValueAtTime(.0001,when+.065);
    src.connect(hp);hp.connect(g);g.connect(musicGain);src.start(when);src.stop(when+.08);
  }
  function schedule(when) {
    const index=step%64, chordIndex=Math.floor(index/16), root=chordRoots[chordIndex];
    if(index%16===0)pad(root,when);
    if(index%4===0){drum(when,index%16===0);voice(root-12,when,.55,'sine',.065,340);}
    if(index%2===1)hat(when);
    const arpeggio=[0,7,10,12,15,12,7,3];
    if(index%2===0)voice(root+24+arpeggio[(index/2)%8],when,.55,'triangle',.023,3400);
    if(index%16===14)voice(root+36+7,when,1.7,'sine',.018,4000);
    step++;
  }
  function pump() {
    if (!ctx || ctx.state !== 'running' || !enabledMusic) return;
    while(nextAt < ctx.currentTime + .28) {schedule(nextAt);nextAt+=STEP;}
  }
  function startMusic() {
    if(!enabledMusic || document.hidden || !ready())return;
    if(timer)return;
    step=0;nextAt=ctx.currentTime+.10;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(.47,ctx.currentTime,.8);
    timer=setInterval(pump,75);pump();
  }
  function stopMusic() {
    if(timer){clearInterval(timer);timer=null;}
    if(ctx && musicGain){musicGain.gain.cancelScheduledValues(ctx.currentTime);musicGain.gain.setTargetAtTime(.0001,ctx.currentTime,.35);}
  }
  function setOptions({sound=true,music=true}={}) {
    enabledSfx=!!sound;enabledMusic=!!music;
    if(!enabledMusic)stopMusic(); else if(ctx?.state==='running')startMusic();
  }
  function play(name, rate=1) {
    if(!enabledSfx)return;
    try { const s=sounds[name]||sounds.menu; if(s){const id=s.play();s.rate(rate,id);} } catch(_) { /* Some WebViews disallow audio until interaction. */ }
  }
  function unlock() {try {ready();startMusic();}catch(_) {}}
  document.addEventListener('pointerdown',unlock,{once:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else if(enabledMusic && ctx)startMusic();});
  window.AfterglowAudio={play,unlock,setOptions,startMusic,stopMusic};
})();
