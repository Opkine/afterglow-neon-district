#!/usr/bin/env python3
"""Render three original, redistributable Ogg Vorbis game soundtracks.

No music samples, soundfonts, online assets or third-party compositions are used.
The score, harmonics, room ambience and arrangement are authored for PALIMPSESTE.
"""
from __future__ import annotations
import math
import pathlib
import subprocess
import tempfile
import wave
import numpy as np

RATE = 32000
HERE = pathlib.Path(__file__).resolve().parent.parent
OUT = HERE / "game" / "audio"
RNG = np.random.default_rng(1927)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


class Score:
    def __init__(self, bpm: int, bars: int):
        self.beat = 60 / bpm
        self.length = bars * 4 * self.beat
        self.left = np.zeros(int(RATE * self.length), dtype=np.float32)
        self.right = np.zeros_like(self.left)
        self.events = 0

    def note(self, beat: float, midi: int, length: float, velocity: float,
             instrument="felt", pan=0.0):
        begin = int(beat * self.beat * RATE)
        samples = min(int(length * self.beat * RATE), len(self.left) - begin)
        if samples <= 2 or begin < 0:
            return
        t = np.arange(samples, dtype=np.float32) / RATE
        f = hz(midi)
        if instrument == "felt":
            envelope = np.minimum(1, t / 0.018) * np.exp(-t * 3.0 / max(.6, length * self.beat))
            signal = (np.sin(2*np.pi*f*t)*.79
                      + np.sin(2*np.pi*f*2.001*t)*.16
                      + np.sin(2*np.pi*f*3.014*t)*.045)
            signal *= envelope
        elif instrument == "rhodes":
            envelope = np.minimum(1, t / 0.025) * np.exp(-t * 2.4 / max(.7, length * self.beat))
            signal = (np.sin(2*np.pi*f*t)*.67 +
                      np.sin(2*np.pi*f*2.002*t)*.19 +
                      np.sin(2*np.pi*f*4.03*t)*.08 +
                      np.sin(2*np.pi*f*7.1*t)*.018) * envelope
        elif instrument == "bass":
            envelope = np.minimum(1, t/.009)*np.exp(-t*3.1/max(.3,length*self.beat))
            signal = (np.sin(2*np.pi*f*t)*.75+
                      np.sin(2*np.pi*2*f*t)*.17+
                      np.sin(2*np.pi*3*f*t)*.055)*envelope
        elif instrument == "glass":
            envelope = np.minimum(1, t/.005)*np.exp(-t*2.7/max(.75,length*self.beat))
            signal = (np.sin(2*np.pi*f*t)*.67+
                      np.sin(2*np.pi*f*2.68*t)*.19+
                      np.sin(2*np.pi*f*4.16*t)*.10)*envelope
        elif instrument == "strings":
            vibrato = 1+.0018*np.sin(2*np.pi*4.5*t)
            envelope = np.minimum(1,t/.58)*np.minimum(1,(samples/RATE-t)/.65)
            signal = sum(np.sin(2*np.pi*f*n*t*vibrato)/(n*n) for n in range(1,6))
            signal *= envelope * .55
        else:
            raise ValueError(instrument)
        signal = np.asarray(signal * velocity, dtype=np.float32)
        l = math.sqrt((1-pan)/2)
        r = math.sqrt((1+pan)/2)
        self.left[begin:begin+samples] += signal*l
        self.right[begin:begin+samples] += signal*r
        self.events += 1

    def brush(self, beat: float, strength=.014):
        begin=int(beat*self.beat*RATE)
        samples=min(int(.20*RATE),len(self.left)-begin)
        if samples <= 0:return
        t=np.arange(samples,dtype=np.float32)/RATE
        noise=RNG.standard_normal(samples).astype(np.float32)
        shaped=noise*np.exp(-t*22)*strength
        self.left[begin:begin+samples]+=shaped*.9
        self.right[begin:begin+samples]+=shaped*.95

    def room(self, kind: str):
        n=len(self.left)
        # Slow, aperiodic air and surf motion, mixed far below the melody.
        nslow=int(math.ceil(n/350))+2
        slow=RNG.standard_normal(nslow).astype(np.float32)
        soft=np.interp(np.arange(n),np.arange(nslow)*350,slow).astype(np.float32)
        phase=np.arange(n,dtype=np.float32)/RATE
        if kind=="nocturne":
            ambience=soft*.0058*(.7+.3*np.sin(2*np.pi*.095*phase))
        elif kind=="jazz":
            ambience=soft*.0023
        else:
            ambience=soft*.0045+np.sin(2*np.pi*107*phase)*.00035
        self.left+=ambience
        self.right+=ambience*.76
        # Stereo short-room reflections and a soft analog saturation.
        reflections=[(.12,.12,.07),(.23,.1,.12),(.37,.065,.065)]
        l=self.left.copy()
        r=self.right.copy()
        for delay,amount_l,amount_r in reflections:
            shift=int(delay*RATE)
            self.left[shift:]+=r[:-shift]*amount_l
            self.right[shift:]+=l[:-shift]*amount_r
        peak=max(float(np.max(np.abs(self.left))),float(np.max(np.abs(self.right))),.0001)
        # Master each score to the same perceived range. The early piano render
        # was almost 20 dB too quiet on a mobile speaker.
        gain=.90/peak
        self.left=np.tanh(self.left*gain)
        self.right=np.tanh(self.right*gain)
        # Short, smooth splice between repeats; avoid clicks at loop boundaries.
        fade=min(int(.17*RATE),n//100)
        ramp=np.linspace(0,1,fade,dtype=np.float32)
        for channel in (self.left,self.right):
            channel[:fade]*=ramp
            channel[-fade:]*=ramp[::-1]

    def save(self, name: str):
        stereo=np.column_stack((self.left,self.right))
        pcm=(np.clip(stereo,-1,1)*32767).astype('<i2')
        OUT.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="palimpseste-score-") as tmp:
            wav=pathlib.Path(tmp)/"source.wav"
            with wave.open(str(wav),"wb") as stream:
                stream.setnchannels(2);stream.setsampwidth(2);stream.setframerate(RATE);stream.writeframes(pcm.tobytes())
            dest=OUT/(name+".ogg")
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(wav),
                            "-c:a","libvorbis","-qscale:a","3",str(dest)],check=True)
        print(f"{name}: {self.length:.1f}s, {self.events} notes, {dest.stat().st_size:,} bytes")


def nocturne():
    score=Score(77,12)
    chords=[
        [45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59],
        [50,57,62,65],[40,47,52,56],[45,52,57,60],[41,48,53,57],
        [50,57,62,65],[43,50,55,59],[48,55,60,64],[40,47,52,56],
    ]
    lead=[72,69,67,64,69,67,64,62,65,64,62,64]
    for bar,chord in enumerate(chords):
        at=bar*4
        score.note(at,chord[0]-12,3.6,.065,"strings",-.18)
        for beat,index in [(0,1),(.48,2),(1.5,3),(2.35,2),(3.25,1)]:
            score.note(at+beat,chord[index],1.25,.092,"felt",-.23 if index%2 else .18)
        score.note(at+.95,lead[bar],1.5,.056,"felt",.24)
        if bar%2==0:score.note(at+2.8,lead[bar]-2,.84,.039,"felt",.3)
    score.room("nocturne");score.save("nocturne")


def jazz():
    score=Score(97,16)
    chords=[
        [48,55,58,63],[53,57,60,63],[46,53,57,62],[43,50,53,59],
        [48,55,58,63],[53,57,60,63],[46,53,57,62],[43,50,53,59],
        [51,58,62,65],[56,60,63,67],[46,53,57,62],[43,50,53,59],
        [48,55,58,63],[53,57,60,63],[46,53,57,62],[43,50,53,59],
    ]
    lead=[67,69,70,74,72,70,67,65,74,72,70,69,67,63,65,67]
    for bar,chord in enumerate(chords):
        at=bar*4
        for beat,index in [(0,0),(1,1),(2,2),(3,1)]:
            score.note(at+beat,chord[index]-12,.75,.145,"bass",-.15)
            score.brush(at+beat+.02,.012)
            score.brush(at+beat+.51,.006)
        for beat in (.55,2.56):
            for index in (1,2,3):score.note(at+beat,chord[index]+12,.66,.046,"rhodes",.17)
        score.note(at+.25,lead[bar],.55,.075,"rhodes",.32)
        score.note(at+2.75,lead[bar]-2,.63,.061,"rhodes",.24)
    score.room("jazz");score.save("jazz")


def verriere():
    score=Score(67,12)
    chords=[
        [53,60,64,69],[55,62,67,71],[57,60,64,69],[48,55,60,64],
        [53,60,64,69],[50,57,60,65],[55,62,67,71],[48,55,60,64],
        [53,60,64,69],[55,62,67,71],[57,60,64,69],[48,55,60,64],
    ]
    lead=[81,79,76,72,79,76,74,72,81,83,79,76]
    for bar,chord in enumerate(chords):
        at=bar*4
        score.note(at,chord[0]-12,3.85,.050,"strings",-.24)
        for beat,index in [(0,1),(.65,2),(1.5,3),(2.5,2),(3.32,1)]:
            score.note(at+beat,chord[index]+12,1.8,.052,"glass",.38)
        score.note(at+1.0,lead[bar],2.2,.061,"glass",-.28)
    score.room("verriere");score.save("verriere")


if __name__=="__main__":
    nocturne()
    jazz()
    verriere()
