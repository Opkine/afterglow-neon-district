#!/usr/bin/env python3
"""Original, multi-layer acoustic textures for each detective action.

No external sound-effect recordings or restricted samples are used.
"""
from pathlib import Path
import subprocess,tempfile,wave
import numpy as np
from scipy.signal import butter,sosfilt

RATE=32000
OUT=Path(__file__).resolve().parent.parent/'game'/'audio'/'fx'
rng=np.random.default_rng(3071927)

class Foley:
 def __init__(self,length):
  self.n=int(RATE*length);self.l=np.zeros(self.n,np.float32);self.r=np.zeros(self.n,np.float32)
 def add(self,s,at=0,pan=0):
  i=int(at*RATE);n=min(len(s),self.n-i)
  if n<=0:return
  self.l[i:i+n]+=s[:n]*np.sqrt((1-pan)/2)
  self.r[i:i+n]+=s[:n]*np.sqrt((1+pan)/2)
 def rustle(self,at,duration,volume=.11,band=1900,pan=0):
  n=int(duration*RATE);t=np.arange(n)/RATE
  noise=rng.normal(size=n)
  sos=butter(2,[max(80,band*.42),min(14000,band*2)],btype='bandpass',fs=RATE,output='sos')
  s=sosfilt(sos,noise)*np.sin(np.pi*t/duration)**2
  wobble=np.maximum(.08,.68+.32*np.sin(2*np.pi*(4*t+1.6*t*t)))
  self.add((s*wobble*volume).astype(np.float32),at,pan)
 def ping(self,f,at,duration=.8,volume=.15,partials=(1,2.01,3.92),pan=0):
  n=int(duration*RATE);t=np.arange(n)/RATE
  s=np.zeros(n)
  for idx,h in enumerate(partials):s+=np.sin(2*np.pi*f*h*t)*np.exp(-t*(3.2+idx*2.2)/duration)/(idx+1)**1.25
  s*=np.minimum(1,t/.002)*volume
  self.add(s.astype(np.float32),at,pan)
 def knock(self,at,volume=.23,pitch=120):
  n=int(.24*RATE);t=np.arange(n)/RATE
  s=(np.sin(2*np.pi*(pitch*t-18*t*t))*.78+rng.normal(size=n)*.27)*np.exp(-t*27)*volume
  self.add(s.astype(np.float32),at)
 def save(self,name):
  self.l[1:]+=.17*self.l[:-1];self.r[1:]+=.17*self.r[:-1]
  for left,right in [(self.l,self.r),(self.r,self.l)]:
   shift=int(.11*RATE);left[shift:]+=.08*right[:-shift]
  for ch in (self.l,self.r):
   fade=min(int(.055*RATE),len(ch)//4);ch[-fade:]*=np.linspace(1,0,fade)
  peak=max(float(np.max(np.abs(self.l))),float(np.max(np.abs(self.r))),1e-5)
  norm=.77/peak
  stereo=np.column_stack((np.tanh(self.l*norm),np.tanh(self.r*norm)))
  OUT.mkdir(parents=True,exist_ok=True)
  with tempfile.TemporaryDirectory() as tmp:
   src=Path(tmp)/'sound.wav'
   with wave.open(str(src),'wb') as fd:
    fd.setnchannels(2);fd.setsampwidth(2);fd.setframerate(RATE)
    fd.writeframes((stereo*32767).astype('<i2').tobytes())
   dest=OUT/(name+'.ogg')
   subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(src),'-c:a','libvorbis','-qscale:a','3',str(dest)],check=True)
  print(f'{name:12s}: {self.n/RATE:.2f}s · {dest.stat().st_size:,} bytes')

def create():
 f=Foley(2.6)
 for k in range(6):
  f.knock(.17+k*.39,.22,235 if k%2 else 180);f.ping(1120,.18+k*.39,.16,.014)
 f.save('clock')
 f=Foley(2.4)
 f.rustle(.07,1.62,.17,750);f.knock(.18,.22,90);f.knock(1.55,.32,120);f.ping(860,1.68,.7,.025)
 f.save('luggage')
 f=Foley(2.7)
 for at,band in [(0,2100),(.52,3000),(1.24,1300),(1.8,2600)]:
  f.rustle(at,.73,.12,band,pan=.5 if at>1 else -.4)
 f.save('paper')
 f=Foley(3.2)
 for at in np.arange(0,2.2,.36):f.rustle(float(at),1,.10,380,pan=.35)
 f.ping(110,.3,2.3,.028);f.save('wind')
 f=Foley(2.6)
 f.knock(.15,.29,72);f.rustle(.36,.85,.13,1200);f.rustle(1.35,.9,.14,1800);f.knock(1.9,.16,89)
 f.save('book')
 f=Foley(3.0)
 for note,amp in [(440,.16),(554,.1),(784,.07),(1061,.05)]:
  f.ping(note,.13,2.7,amp,partials=(1,2.004,2.79,4.97))
 f.save('bell')
 f=Foley(3.1)
 for k in range(16):f.rustle(.06+k*.15,.35,.05,3600,pan=np.sin(k)*.5)
 f.knock(1.6,.15,135);f.save('rain')
 f=Foley(2.7)
 for at,d in [(0,.15),(.29,.15),(.58,.42),(1.21,.15),(1.51,.43),(2.13,.14)]:
  f.ping(680,at,d,.13,partials=(1,1.96,3.01))
  f.knock(at,.075,260)
 f.save('telegram')
 f=Foley(2.3)
 f.knock(.11,.42,190);f.rustle(.2,.52,.18,4100)
 f.ping(950,.45,.45,.10);f.knock(1.4,.25,230);f.rustle(1.55,.47,.1,1800)
 f.save('camera')
 f=Foley(2.7)
 for k in range(12):
  at=.1+k*.17
  f.ping(760+(((k*127)%6)*117),at,.64,.068,pan=(k%3-1)*.4)
 f.rustle(.2,1.9,.04,3000);f.save('keys')
 f=Foley(3.0)
 for k in range(9):f.ping(135+2*k,.15+k*.11,1.4,.016,partials=(1,1.8,2.6))
 f.rustle(.2,1.8,.16,430);f.knock(2.0,.35,90);f.save('door')
 f=Foley(2.7)
 for i,note in enumerate([349.23,440,523.25,659.25,880,1046.5]):
  f.ping(note,.08+i*.27,1.65,.105,partials=(1,2,3.98),pan=(i%2-.5)*.5)
 f.rustle(.25,1.8,.04,4000);f.save('discovery')
 f=Foley(.9)
 for at in (0,.16,.31,.55):f.knock(at,.11,260)
 f.rustle(0,.62,.026,1700);f.save('scrub')
 f=Foley(1.5)
 for i,note in enumerate([523.25,659.25,784]):f.ping(note,.13+i*.18,.85,.085)
 f.save('notify')
 f=Foley(1.8)
 f.rustle(.13,.89,.095,1400);f.ping(280,.45,1.15,.045)
 f.save('voice')
 f=Foley(3.4)
 for i,note in enumerate([261.63,329.63,392,523.25,659.25,783.99]):
  f.ping(note,.16+i*.31,2,.13,partials=(1,2,3.01),pan=(-1)**i*.32)
 f.save('resolution')
 f=Foley(1.75)
 for i,note in enumerate([310,280,233]):f.ping(note,.16+i*.27,.8,.13,partials=(1,1.78,2.5))
 f.knock(.7,.15,97);f.save('wrong')

if __name__=='__main__':create()
