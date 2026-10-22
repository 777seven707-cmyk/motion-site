"""Score and sound for «Маленький призрак», synthesised from scratch.

A cold, sparse D-minor ambience while the room is grey; a music-box shimmer
when the ghost arrives; near silence in the dark; one music-box note for every
small thing done; a pad that breathes in and out with them; the warm theme
(F – C – Dm – B♭) blooming as colour comes back; a rising swell into the
white light of the door; the full theme on the bridge of stones; a final
F major chord under the HAVN mark.
Reads out/sfx.json from the scene, writes out/music_sfx.wav.
"""
import json
import os
import wave

import numpy as np

SR = 48000
DUR = 95.0
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
rng = np.random.default_rng(8)
BEAT = 60 / 90


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def band(x, lo=None, hi=None, soft=1.2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / f) ** (2 * soft))
    if hi:
        g *= 1 / (1 + (f / hi) ** (2 * soft))
    return np.fft.irfft(X * g, len(x))


def noise(n):
    return rng.standard_normal(n)


class Bus:
    def __init__(self):
        self.l = np.zeros(N + SR * 8)
        self.r = np.zeros(N + SR * 8)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        n = len(sig)
        self.l[i:i + n] += sig * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        self.r[i:i + n] += sig * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


music, sfx = Bus(), Bus()


def env_bell(n, a=.3):
    x = np.linspace(0, 1, n)
    return np.minimum(1, x / a) * np.minimum(1, (1 - x) / a)


def pad(notes, dur, att=1.5, rel=1.5, bright=.6, wobble=.25):
    t = tt(int(dur * SR))
    s = np.zeros(len(t))
    for m in notes:
        for det in (-.1, 0, .1):
            ph = 2 * np.pi * np.cumsum(mtof(m) * 2 ** (det / 12) * (1 + .002 * np.sin(2 * np.pi * wobble * t + m))) / SR
            for k in range(1, 8):
                s += np.sin(k * ph) / k * np.exp(-k / (2.2 * bright + .5)) / 3
    return s * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel)) / len(notes)


def piano(m, dur=2.6, vel=1.0):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = sum(a * np.sin(2 * np.pi * f * k * np.sqrt(1 + .0004 * k * k) * t) * np.exp(-t * (1.4 + 1.0 * k)) for k, a in [(1, 1), (2, .4), (3, .16), (4, .07)])
    return s * (1 - np.exp(-t * 300)) * np.minimum(1, (dur - t) / .3) * vel


def mbox(m, dur=1.8):
    """music box / celesta"""
    t = tt(int(dur * SR))
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + .5 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 7) + .22 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t * 11)
    return s * (1 - np.exp(-t * 2500))


def pluck(m, dur=.5, bright=1.0):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .3 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 20)
    return s * np.exp(-t * 7) * (1 - np.exp(-t * 900))


def kick(dur=.4):
    t = tt(int(dur * SR))
    return np.sin(2 * np.pi * np.cumsum(46 + 80 * np.exp(-t * 28)) / SR) * np.exp(-t * 8) * (1 - np.exp(-t * 2500))


def snare():
    n = int(.25 * SR)
    t = tt(n)
    return band(noise(n), lo=1500, hi=7000) * np.exp(-t * 18) * .5 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28) * .35


def hat():
    n = int(.05 * SR)
    return band(noise(n), lo=7000, hi=13000) * np.exp(-tt(n) * 80) * .35


# ---------------------------------------------------------------- the score
Dm = [50, 57, 60, 64]          # Dm(add9) colour
music.add(0.0, pad([38, 45, 50, 57, 64], 17.5, att=3, rel=2.5, bright=.35), .34)
for tm, m in [(1.2, 62), (3.6, 65), (6.0, 69), (8.4, 67), (10.8, 64), (13.2, 62), (15.0, 60)]:
    music.add(tm, piano(m, 3.2, .7), .1, -.2)
# phone at 3 a.m.: thinner, a soft clock
music.add(16.4, pad([45, 52, 57, 60], 9.2, att=1.5, rel=1.2, bright=.3), .22)
for k in range(int((25 - 17) / .5)):
    n = int(.02 * SR)
    music.add(17 + k * .5, band(noise(n), lo=3000, hi=9000) * np.exp(-tt(n) * 250), .05, .3)
# the ghost: a music-box arpeggio rising in F major 7
music.add(24.8, pad([53, 57, 60, 64], 7.0, att=1.2, rel=2, bright=.7), .26)
for j, m in enumerate([77, 81, 84, 88, 89, 93, 96]):
    music.add(25.6 + j * .17, mbox(m), .09, -.5 + j * .15)
# darkness: a low drone, almost nothing
music.add(31.0, pad([38, 45], 8.0, att=.8, rel=2, bright=.25), .22)
# small things: a gentle pulse appears
music.add(38.0, pad([53, 60, 65], 7.5, att=1.2, rel=1.5, bright=.5), .22)
t = 38.0
while t < 45:
    music.add(t, pluck(41, .6, .4), .14)
    t += BEAT * 2
# breathing: the pad swells with the inhale, sinks with the exhale
music.add(46.8, pad([50, 57, 62, 65], 3.6, att=3.2, rel=.4, bright=.55), .3)
music.add(50.2, pad([50, 57, 62, 65], 3.6, att=.2, rel=3.2, bright=.55), .3)
# colour returns: the warm theme blooms (F C Dm Bb), arpeggio in eighths
THEME = [(41, [65, 69, 72, 76]), (48, [64, 67, 72, 76]), (50, [65, 69, 74, 77]), (46, [65, 70, 74, 77])]
MEL = [[81, None, 79, 77], [76, None, 79, None], [77, None, 74, 72], [74, None, None, None]]


def theme(t0, t1, drums=False, melody=False, gain=1.0, octave=0):
    b = 0
    while t0 + b * BEAT * 4 < t1 - .2:
        tb = t0 + b * BEAT * 4
        bass, tri = THEME[b % 4]
        music.add(tb - .05, pad([n + octave for n in tri], BEAT * 4 + 1.0, att=.6, rel=1.0, bright=.75), .2 * gain)
        music.add(tb, piano(bass, 3.0, .8), .16 * gain)
        for e in range(8):
            te = tb + e * BEAT / 2
            if te < t1:
                music.add(te, pluck(tri[[0, 1, 2, 3, 2, 1, 2, 3][e]] + 12 + octave, .45, .9), .055 * gain, .35 if e % 2 else -.25)
        if melody:
            for e, m in enumerate(MEL[b % 4]):
                if m is not None and tb + e * BEAT < t1:
                    music.add(tb + e * BEAT, piano(m + octave, 2.4, .9), .1 * gain, .15)
        if drums:
            for q in range(4):
                tq = tb + q * BEAT
                if tq >= t1:
                    break
                if q in (0, 2):
                    music.add(tq, kick(), .32 * gain)
                if q in (1, 3):
                    music.add(tq, snare(), .16 * gain)
                music.add(tq + BEAT / 2, hat(), .1 * gain, .3)
        b += 1


theme(53.5, 58.4, gain=.9)
# the door: hold and rise into the light
music.add(58.2, pad([50, 57, 62, 65, 69], 6.0, att=4.5, rel=.3, bright=.8), .3)
rn = int(5.6 * SR)
x = np.linspace(0, 1, rn)
music.add(58.4, (band(noise(rn), lo=1500, hi=9000) * .25 + np.sin(2 * np.pi * np.cumsum(200 + 700 * x ** 2) / SR) * .15) * x ** 2.5, .5)
# the light: a big F chord, then the full theme on the bridge
music.add(64.1, pad([41, 53, 60, 65, 69, 72], 4.0, att=.05, rel=3.0, bright=.9), .36)
music.add(64.1, piano(41, 4.0, 1.0), .2)
theme(64.6, 74.2, drums=True, melody=True, gain=1.0)
# the peak: wider, an octave up, the ghost leaving
theme(74.2, 86.0, drums=True, melody=True, gain=1.05, octave=12)
music.add(80.4, pad([77, 81, 84, 89], 4.4, att=1.0, rel=2.0, bright=.9), .12)
# the mark: F major add9, a bell, silence
music.add(86.4, pad([41, 53, 60, 65, 67, 69], 8.6, att=.2, rel=4.0, bright=.85), .34)
music.add(86.4, piano(41, 6.0, .9), .2)
music.add(86.6, piano(65, 5.0, .7), .12)
music.add(88.1, mbox(89, 3.5), .12)

# ---------------------------------------------------------------- sound effects


def fx_pop(big=0):
    t = tt(int((.35 if big else .16) * SR))
    f = (420 if big else 650) * (1 + 1.4 * np.minimum(1, t / .06))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (14 if big else 35)) * (1 - np.exp(-t * 2000)) * (.9 if big else .5)


def fx_blip(i):
    t = tt(int(.08 * SR))
    return np.sin(2 * np.pi * (900 + 40 * i) * t) * np.exp(-t * 50) * .35


def fx_rumble(d, g=1.0):
    n = int(d * SR)
    return band(noise(n), hi=200) * env_bell(n, .2) * 1.6 * g


def fx_whoosh(d, g=1.0):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    nz = noise(n)
    return (band(nz, lo=150, hi=900) * .8 + band(nz, lo=900, hi=4000) * .5 * x) * np.sin(np.pi * x) ** 2 * .55 * g


def fx_key():
    n = int(.04 * SR)
    return band(noise(n), lo=2000, hi=8000) * np.exp(-tt(n) * 150) * .4


def fx_swell(d, g=1.0):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    return band(noise(n), lo=300, hi=6000) * np.sin(np.pi * x) ** 2 * .3 * g


def fx_sparkle(d):
    out = np.zeros(int((d + 1.5) * SR))
    k = 0.0
    while k < d:
        b = mbox(84 + int(rng.integers(0, 4)) * 3 + 12, 1.2) * .25
        i = int(k * SR)
        out[i:i + len(b)] += b
        k += .06 + rng.random() * .1
    return out


def fx_click():
    n = int(.05 * SR)
    return (band(noise(n), lo=2000) * np.exp(-tt(n) * 300) + np.sin(2 * np.pi * 2200 * tt(n)) * np.exp(-tt(n) * 120) * .3) * .6


def fx_dark():
    n = int(1.2 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 1.2) + 40) / SR) * np.exp(-t * 2.4) * .6


SCALE = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98, 101]


def fx_ding(i, soft=0):
    return mbox(SCALE[i % len(SCALE)] - (12 if soft else 0), 2.0) * (.6 if soft else 1)


def fx_gulp():
    out = np.zeros(int(.6 * SR))
    for k in range(3):
        t = tt(int(.09 * SR))
        g = np.sin(2 * np.pi * np.cumsum(220 + 300 * t / .09) / SR) * np.exp(-t * 35)
        i = int(k * .17 * SR)
        out[i:i + len(g)] += g
    return out * .6


def fx_creak():
    t = tt(int(.6 * SR))
    f = 180 + 60 * np.sin(2 * np.pi * 3 * t)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * band(noise(len(t)), lo=500, hi=3000) * .05 * env_bell(len(t), .2) + band(noise(len(t)), lo=300, hi=1200) * .08 * env_bell(len(t), .3)


def fx_wind(d):
    n = int(d * SR)
    t = tt(n)
    return band(noise(n), lo=300, hi=2500) * (.6 + .4 * np.sin(2 * np.pi * .8 * t)) * env_bell(n, .25) * .5


def fx_send():
    t = tt(int(.25 * SR))
    return np.sin(2 * np.pi * np.cumsum(600 + 900 * t / .25) / SR) * np.exp(-t * 10) * .4


def fx_rise(d):
    t = tt(int(d * SR))
    return np.sin(2 * np.pi * np.cumsum(500 + 700 * t / d) / SR) * np.sin(np.pi * t / d) * .12


def fx_breath(d, inhale=True):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    env = np.sin(np.pi * x) ** 1.4 * (x if inhale else 1 - x * .6)
    return band(noise(n), lo=400 if inhale else 250, hi=2600 if inhale else 1800) * env * .35


def fx_rustle(d):
    n = int(d * SR)
    return band(noise(n), lo=800, hi=5000) * (rng.random(n) > .5) * env_bell(n, .2) * .25


def fx_step():
    n = int(.12 * SR)
    t = tt(n)
    return band(noise(n), lo=200, hi=1500) * np.exp(-t * 40) * .5 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * .3


def fx_chime():
    return mbox(84, 2.2) * .7 + mbox(91, 2.2) * .4


for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-.3, .3))
    if ty == 'pop':
        sfx.add(t0, fx_pop(c.get('big', 0)), .4, pan)
    elif ty == 'blip':
        sfx.add(t0, fx_blip(c.get('i', 0)), .3, pan)
    elif ty == 'rumble':
        sfx.add(t0, fx_rumble(c['d'], g), .4)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), .45, pan)
    elif ty == 'key':
        sfx.add(t0, fx_key(), .3, .1)
    elif ty == 'chime':
        sfx.add(t0, fx_chime(), .12, pan)
    elif ty == 'tap':
        sfx.add(t0, fx_click(), .45)
    elif ty == 'swell':
        sfx.add(t0, fx_swell(c['d'], g), .4)
    elif ty == 'sparkle':
        sfx.add(t0, fx_sparkle(c['d']), .12, pan)
    elif ty == 'click':
        sfx.add(t0, fx_click(), .5)
    elif ty == 'dark':
        sfx.add(t0, fx_dark(), .4)
    elif ty == 'ding':
        sfx.add(t0, fx_ding(c.get('i', 0), c.get('soft', 0)), .1, pan)
    elif ty == 'gulp':
        sfx.add(t0, fx_gulp(), .4)
    elif ty == 'creak':
        sfx.add(t0, fx_creak(), .6)
    elif ty == 'wind':
        sfx.add(t0, fx_wind(c['d']), .4, -.3)
    elif ty == 'send':
        sfx.add(t0, fx_send(), .4)
    elif ty == 'rise':
        sfx.add(t0, fx_rise(c['d']), .5, pan)
    elif ty == 'breathIn':
        sfx.add(t0, fx_breath(c['d'], True), .5)
    elif ty == 'breathOut':
        sfx.add(t0, fx_breath(c['d'], False), .5)
    elif ty == 'bloom':
        sfx.add(t0, fx_sparkle(c['d']), .1)
    elif ty == 'rustle':
        sfx.add(t0, fx_rustle(c['d']), .4)
    elif ty == 'step':
        sfx.add(t0, fx_step(), .3, pan)

mix = np.stack([music.l[:N] + sfx.l[:N], music.r[:N] + sfx.r[:N]], 1)
mix = np.tanh(mix * 1.05) / 1.05
mix[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))[:, None]
fo = int(2.0 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.3
mix *= .75 / np.abs(mix).max()
with wave.open(os.path.join(OUT, 'music_sfx.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote music_sfx.wav')
