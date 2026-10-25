"""Music + sound for «Помогите нам» (soft version), synthesised from scratch.

0–7 s: night — soft rain, a slow solo piano in A minor (Am – F – C – E).
7 s: the sun comes — the harmony opens to C major with a warm pad.
From 12.6 s a gentle piano pulse without drums (only a soft brush), and a
final Cmaj9 under the HAVN mark. Nothing hits hard: every effect is a
brush, a pen, a bell or a breath of paper.
Reads out/sfx.json (exported by the scene), writes out/music_sfx.wav.
"""
import json
import os
import wave

import numpy as np

SR = 48000
DUR = 32.0
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
rng = np.random.default_rng(21)
BEAT = 60 / 72


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
        self.l = np.zeros(N + SR * 6)
        self.r = np.zeros(N + SR * 6)

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




def brush():
    n = int(.25 * SR)
    t = tt(n)
    return band(noise(n), lo=1800, hi=7000) * np.exp(-t * 16) * .5






def pad(notes, dur, att=.8, rel=1.0, bright=.6):
    t = tt(int(dur * SR))
    s = np.zeros(len(t))
    for m in notes:
        for det in (-.08, 0, .08):
            ph = 2 * np.pi * np.cumsum(mtof(m) * 2 ** (det / 12) * (1 + .002 * np.sin(2 * np.pi * .25 * t + m))) / SR
            for k in range(1, 8):
                s += np.sin(k * ph) / k * np.exp(-k / (2.2 * bright + .5)) / 3
    return s * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel)) / len(notes)


def bell(f, dur=2.2):
    t = tt(int(dur * SR))
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.4) + .45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    return s * (1 - np.exp(-t * 1500))


# ---------------------------------------------------------------- the score
def piano(m, dur=2.6, vel=1.0):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * k * t * (1 + .0004 * k * k)) * np.exp(-t * (1.1 + k * .9)) / k ** 1.3 for k in range(1, 7))
    s = s * (1 - np.exp(-t * 900)) * np.minimum(1, (dur - t) / .3)
    return band(s, hi=4200) * vel


# night: slow solo piano, a note at a time
NIGHT = [(0.0, [45, 57, 60, 64], [76, 72, 71]), (1.75, [41, 53, 57, 60], [72, 69]), (3.5, [48, 55, 60, 64], [67, 72, 71]), (5.25, [40, 52, 56, 59], [71, 68])]
for t0, ch, mel in NIGHT:
    music.add(t0, pad(ch[1:], 2.6, att=1.0, rel=1.0, bright=.3), .1)
    music.add(t0 + .05, piano(ch[0], 3.0, .7), .17)
    for k, m in enumerate(ch[1:]):
        music.add(t0 + .25 + k * .4, piano(m + 12, 2.2, .45), .06, (-.3, 0, .3)[k])
    for k, m in enumerate(mel):
        music.add(t0 + .6 + k * .55, piano(m, 2.6, .6), .08, .15)
music.add(7.05, pad([48, 55, 60, 64, 67, 71], 5.0, att=.6, rel=2.0, bright=.7), .26)
music.add(7.05, piano(36, 3.5, .9), .22)
for k, m in enumerate([72, 76, 79, 83, 84]):
    music.add(7.3 + k * .22, piano(m, 2.4, .5), .06, (-.3, .3)[k % 2])

# day: C – G – Am – F, arpeggiated piano, a soft brush from 12.6 s
LOOP = [([48, 55, 60, 64], 36), ([43, 50, 55, 59], 31), ([45, 52, 57, 60], 33), ([41, 48, 57, 60], 29)]
BAR = BEAT * 4
START, END = 10.4, 28.7
b = 0
while START + b * BAR < END:
    tb = START + b * BAR
    ch, bass = LOOP[b % 4]
    music.add(tb - .05, pad(ch, BAR + 1.0, att=.6, rel=1.0, bright=.55), .17)
    music.add(tb, piano(bass, 3.0, .75), .18)
    for k in range(8):
        tk = tb + k * BEAT / 2
        if tk < END - .1:
            music.add(tk, piano(ch[(k * 3) % 4] + 12 + (12 if k % 4 == 3 else 0), 1.8, .45), .055, (-.25, .25)[k % 2])
    for q in (1, 3):
        tq = tb + q * BEAT
        if 12.6 <= tq < END - .2:
            music.add(tq, brush(), .1)
    b += 1
music.add(END, pad([48, 55, 59, 62, 64, 67], 3.8, att=.3, rel=2.2, bright=.8), .3)
music.add(END, piano(36, 3.6, .9), .22)
for k, m in enumerate([72, 76, 79, 83]):
    music.add(END + .2 + k * .25, piano(m, 2.6, .5), .06, (-.3, .3)[k % 2])

# ---------------------------------------------------------------- sound effects


def fx_slide(d, g=1.0):
    n = int((d + .1) * SR)
    t = tt(n)
    e = sum(np.exp(-np.maximum(0, t - k / 12) * 40) * (t >= k / 12) for k in range(int(np.ceil(d * 12))))
    return band(noise(n), lo=500, hi=3800) * e * env_bell(n, .2) * .45 * g


def fx_whoosh(d, g=1.0):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    nz = noise(n)
    return (band(nz, lo=150, hi=900) * .8 + band(nz, lo=900, hi=4000) * .5 * x) * np.sin(np.pi * x) ** 2 * .6 * g


def fx_pen(d, g=1.0, scratch=False):
    n = int(d * SR)
    t = tt(n)
    rate = (16 if scratch else 11) + 4 * np.sin(2 * np.pi * 1.7 * t + rng.random() * 6)
    am = (.5 + .5 * np.sin(2 * np.pi * np.cumsum(rate) / SR)) ** 2 * (.6 + .4 * rng.random(n) ** .3)
    return band(noise(n), lo=1600 if scratch else 2200, hi=5500 if scratch else 8000) * am * env_bell(n, .12) * (.5 if scratch else .28) * g








def fx_peel(d):
    n = int(d * SR)
    t = tt(n)
    clicks = (rng.random(n) > .996) * rng.random(n)
    s = band(clicks, lo=800, hi=6000) * 6 + band(noise(n), lo=600, hi=2400) * .15
    pop = np.zeros(n)
    k = int(.35 * SR)
    tp = tt(n - k)
    pop[k:] = np.sin(2 * np.pi * np.cumsum(700 - 400 * np.minimum(1, tp / .05)) / SR) * np.exp(-tp * 30) * .5
    return (s * env_bell(n, .1) + pop) * .6








def fx_bubble(up=True, soft=False):
    n = int(.25 * SR)
    t = tt(n)
    f = (500 + 600 * (1 - np.exp(-t * 30))) if up else (1100 - 400 * (1 - np.exp(-t * 30)))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    return (s + band(noise(n), lo=800, hi=4000) * np.exp(-t * 60) * .3) * (.4 if soft else .6)








def fx_tap(i):
    n = int(.12 * SR)
    t = tt(n)
    return band(noise(n), lo=700 + 80 * (i % 5), hi=4500) * np.exp(-t * 55) * .5




def fx_press():
    n = int(.15 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * 180 * t) * np.exp(-t * 40) * .6 + band(noise(n), lo=1500, hi=5000) * np.exp(-t * 90) * .3


def fx_copy():
    s = np.zeros(int(1.6 * SR))
    for k, m in enumerate((84, 91)):
        b = bell(mtof(m), 1.4) * .5
        i = int(k * .09 * SR)
        s[i:i + len(b)] += b
    return s


def fx_fold():
    n = int(.15 * SR)
    t = tt(n)
    return band(noise(n), lo=1000, hi=5000) * np.exp(-t * 35) * .6


def fx_plane(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    nz = noise(n)
    flutter = .6 + .4 * np.sin(2 * np.pi * np.cumsum(14 + 10 * x) / SR)
    return band(nz, lo=600, hi=4000) * flutter * np.sin(np.pi * x) ** 1.5 * .6


def fx_rain(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    bed = band(noise(n), lo=900, hi=7000) * .25
    drops = band((rng.random(n) > .9993) * rng.random(n), lo=1500, hi=6000) * 18
    fade = np.minimum(1, x * d / 1.0) * np.minimum(1, (1 - x) * d / 1.8)
    return (bed + drops) * fade * .5


def fx_drip():
    n = int(.35 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(900 + 900 * np.exp(-t * 40)) / SR) * np.exp(-t * 18) * .4


def fx_swell(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    return band(noise(n), lo=300, hi=3000) * x ** 2.2 * (1 - np.clip((x - .9) / .1, 0, 1)) * .35


CHIMES = [88, 84, 91, 96]
for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-.3, .3))
    if ty == 'slide':
        sfx.add(t0, fx_slide(c['d'], g), .45, pan)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), .5, pan * 2)
    elif ty == 'pen':
        sfx.add(t0, fx_pen(c['d'], g), .55, pan)
    elif ty == 'tap':
        sfx.add(t0, band(fx_tap(c.get('i', 0)), hi=3000) * g, .35, pan * 2)
    elif ty == 'peel':
        sfx.add(t0, fx_peel(c['d'] + .3), .45, pan)
    elif ty == 'press':
        sfx.add(t0, fx_press(), .5)
    elif ty == 'copy':
        sfx.add(t0, fx_copy(), .14)
    elif ty == 'fold':
        sfx.add(t0, fx_fold(), .4, pan)
    elif ty == 'plane':
        sfx.add(t0, fx_plane(c['d']) * g, .45, pan * 2)
    elif ty == 'sun':
        sfx.add(t0, bell(mtof([72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96][c.get('i', 0) % 11]), 1.6), .07, pan)
        sfx.add(t0, fx_bubble(True, True), .3, pan)
    elif ty == 'rain':
        sfx.add(t0, fx_rain(c['d']), .5)
    elif ty == 'drip':
        sfx.add(t0, fx_drip(), .25, -.2)
    elif ty == 'swell':
        sfx.add(t0, fx_swell(c['d']), .4)
    elif ty == 'chime':
        sfx.add(t0, bell(mtof(CHIMES[c.get('hi', 0)])), .09, pan)

mix = np.stack([music.l[:N] + sfx.l[:N], music.r[:N] + sfx.r[:N]], 1)
mix = np.tanh(mix * 1.1) / 1.1
mix[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))[:, None]
fo = int(1.2 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix *= .85 / np.abs(mix).max()
with wave.open(os.path.join(OUT, 'music_sfx.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote music_sfx.wav')
