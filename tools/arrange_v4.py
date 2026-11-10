#!/usr/bin/env python3
"""PALIMPSESTE v0.4: three original, layered 80–100 second instrumental scores.

All pitches, rhythms and instruments are synthesized from our own algorithms:
no third-party samples, soundtrack copies, soundfonts or copyrighted recordings.
"""
from generate_music import Score

ROOM=[
 [45,52,57,60,64],[41,48,53,57,64],[50,57,60,65,69],[40,47,52,56,62],
 [48,55,59,64,67],[43,50,55,59,64],[41,48,53,57,64],[40,47,52,56,62],
]
LOBBY=[
 [48,55,58,63,67],[53,60,63,68,72],[46,53,56,62,65],[51,58,62,67,70],
 [44,51,56,60,63],[53,60,63,68,72],[43,50,53,59,62],[48,55,58,63,67]
]
GARDEN=[
 [50,57,62,66,69],[55,62,67,71,74],[47,54,59,62,66],[45,52,57,61,64],
 [52,59,64,67,71],[55,62,67,71,74],[50,57,62,66,69],[45,52,57,61,64]
]

def room():
 s=Score(109,40)
 motif=[(0,.7,2),(.75,.35,3),(1.25,.55,4),(2,.36,3),(2.45,.45,2),(3.12,.72,4)]
 for bar in range(40):
  ch=ROOM[(bar+(2 if 16<=bar<24 else 0))%8];at=bar*4
  section=bar//8;intensity=1.15 if 16<=bar<32 else .86
  # Heavy waltz-cinema piano with a clear rhythm and cinematic cello pulses.
  s.note(at,ch[0]-12,1.6,.14*intensity,'bass',-.12)
  s.note(at+2,ch[0]-12,1.65,.10*intensity,'bass',-.12)
  for beat,idx in [(0,1),(.75,2),(1.5,3),(2.05,2),(2.7,3),(3.46,1)]:
   s.note(at+beat,ch[idx],.66,.09*intensity,'felt',-.17+(idx%2)*.23)
  if bar%2==0:
   for j in range(1,4):s.note(at+.1,ch[j],3.5,.027,'strings',(-1)**j*.35)
  for j,(beat,dur,idx) in enumerate(motif):
   step=(idx+bar//4)%3
   n=ch[2+step]+(12 if j in (2,5) else 0)
   if section>=2 and j==4:n+=2
   s.note(at+beat,n,dur,.068*intensity,'pluck',.34 if j%2 else -.15)
  if section>=2 and bar%2==0:
   s.note(at+1.6,ch[4]+12,1.4,.037,'brass',.35)
  for beat in (0,2):s.percussion(at+beat,'kick',.048)
  for beat in (1,3):s.percussion(at+beat,'snare',.029)
  for beat in (0,.5,1,1.5,2,2.5,3,3.5):s.percussion(at+beat,'hat',.019)
  if bar%4==3:s.percussion(at+3.75,'snare',.033)
 s.room('nocturne');s.save('nocturne')

def jazz():
 s=Score(126,48)
 # Staccato hook, two choruses, a darker bridge, finale.
 hook=[(0,.42,4),(.68,.34,3),(1.49,.36,2),(2.19,.49,4),(3.08,.65,3)]
 for bar in range(48):
  section=bar//8;ch=LOBBY[(bar+1 if 24<=bar<32 else bar)%8];at=bar*4
  power=1.16 if section in (2,4,5) else .83
  for beat,idx in [(0,0),(1,1),(2,2),(3,1)]:
   s.note(at+beat,ch[idx]-12,.91,.18*power,'bass',-.22)
  # Honky-tonk chord stabs off the beat, like a real rhythm section.
  for b in (.48,1.47,2.48,3.48):
   for idx in (1,2,3,4):
    s.note(at+b,ch[idx]+(12 if idx==4 else 0),.42,.03*power,'rhodes',.19)
  for j,(beat,length,idx) in enumerate(hook):
   n=ch[idx]+(12 if (j+bar)%4==0 else 0)
   if 24<=bar<32:n-=2
   s.note(at+beat,n,length,.066*power,'brass',.32)
  if section>=2 and bar%2:
   s.note(at+1.8,ch[4]+12,.85,.053,'organ',-.30)
  for beat in (0,2):s.percussion(at+beat,'kick',.058)
  for beat in (1,3):s.percussion(at+beat,'snare',.065)
  for beat in (0,.66,1,1.66,2,2.66,3,3.66):s.percussion(at+beat,'hat',.037)
  if bar%4==3:
   for j in range(4):s.percussion(at+3+j*.23,'snare',.032+j*.009)
 s.room('jazz');s.save('jazz')

def garden():
 s=Score(113,44)
 melody=[(0,.68,4),(.8,.45,3),(1.47,.72,2),(2.32,.48,3),(3.03,.78,4)]
 for bar in range(44):
  at=bar*4;section=bar//8;ch=GARDEN[(bar+(1 if 16<=bar<24 else 0))%8]
  power=1.17 if 24<=bar<40 else .94
  s.note(at,ch[0]-12,1.7,.105*power,'bass',-.15)
  s.note(at+2,ch[0]-12,1.3,.081*power,'bass',-.12)
  for k,b in enumerate((0,.56,1.05,1.65,2.1,2.61,3.13,3.57)):
   idx=(1+k*2)%4+1
   s.note(at+b,ch[idx]+(12 if k%2 else 0),.60,.055*power,'pluck',-.28 if k%2 else .28)
  if bar%2==0:
   for idx in (1,2,3):
    s.note(at+.15,ch[idx],3.38,.031,'strings',(-1)**idx*.2)
  for j,(beat,length,idx) in enumerate(melody):
   n=ch[idx]+(12 if j in (1,4) else 0)
   if section in (2,4):n+=2 if j==2 else 0
   s.note(at+beat,n,length,.058*power,'glass',.29)
   if bar%2==1 and j%2==0:s.note(at+beat+.13,n-12,length*.75,.036,'pluck',-.22)
  for beat in (0,2):s.percussion(at+beat,'kick',.036)
  for beat in (1,3):s.percussion(at+beat,'tambourine',.057)
  for beat in (0,.5,1,1.5,2,2.5,3,3.5):s.percussion(at+beat,'hat',.015)
  if bar>=32 and bar%4==0:
   s.note(at+.32,ch[4]+12,2.6,.046,'brass',-.15)
 s.room('verriere');s.save('verriere')

if __name__=='__main__':
 room();jazz();garden()
