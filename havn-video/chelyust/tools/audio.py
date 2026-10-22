"""Music + sound for «Ты сейчас сжимаешь челюсть», synthesised from scratch.

0–4.55 s: tension — a low uneasy drone, clicking clock, teeth grinding.
4.55 s («разожми»): a warm chord opens and a soft lo-fi pulse starts (72 BPM).
13.4–17.4 s: the beat steps aside for the exhale, only the pad breathes.
Reads out/sfx.json (exported by the scene), writes out/music_sfx.wav.
"""
import json
import os
import wave

import numpy as np

SR = 48000
DUR = 29.0
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


def kick(dur=.4):
    t = tt(int(dur * SR))
    return np.sin(2 * np.pi * np.cumsum(46 + 70 * np.exp(-t * 26)) / SR) * np.exp(-t * 8) * (1 - np.exp(-t * 2500))


def brush():
    n = int(.25 * SR)
    t = tt(n)
    return band(noise(n), lo=1800, hi=7000) * np.exp(-t * 16) * .5


def hat():
    n = int(.05 * SR)
    return band(noise(n), lo=7000, hi=13000) * np.exp(-tt(n) * 80) * .4


def epiano(m, dur=1.6, vel=1.0):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t + .8 * np.sin(2 * np.pi * f * t) * np.exp(-t * 4)) * np.exp(-t * 1.8)
    s += .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4)
    return s * (1 - np.exp(-t * 400)) * np.minimum(1, (dur - t) / .2) * vel


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
REL = 4.55
# tension: a low cluster that wavers, a dry ticking
t = tt(int(REL * SR))
drone = sum(np.sin(2 * np.pi * mtof(m) * t + .3 * np.sin(2 * np.pi * .7 * t)) for m in (33, 34, 40)) / 3
drone *= np.minimum(1, t / .3) * (.8 + .2 * np.sin(2 * np.pi * 3 * t))
fade = np.ones(len(t)); fade[-int(.25 * SR):] = np.linspace(1, 0, int(.25 * SR))
music.add(0, band(drone * fade, hi=900), .32)
for k in range(int(REL / .5)):
    n = int(.02 * SR)
    music.add(k * .5, band(noise(n), lo=3000, hi=9000) * np.exp(-tt(n) * 250), .14 if k % 2 else .2, .2)

# release: Fmaj9 opens, then a lo-fi loop F – Em7 – Dm7 – Cmaj7
CH = [[53, 57, 60, 64, 67], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
BASS = [41, 40, 38, 36]
BAR = BEAT * 4
BREATH = (13.4, 17.4)
END = 27.4
music.add(REL - .05, pad(CH[0], 3.5, att=.15, rel=1.2, bright=.8), .3)
music.add(REL, bell(mtof(84)), .05)
b = 0
while REL + b * BAR < END:
    tb = REL + b * BAR
    ci = b % 4
    music.add(tb - .05, pad(CH[ci], BAR + .8, att=.4, rel=.8), .2)
    music.add(tb, epiano(BASS[ci], 2.4, .8), .2)
    for e, (off, k) in enumerate([(0, 1), (1.5, 2), (2.5, 3)]):
        if k < len(CH[ci]):
            music.add(tb + off * BEAT, epiano(CH[ci][k] + 12, 1.4, .7), .07, .25)
    for q in range(4):
        tq = tb + q * BEAT
        if tq >= END or BREATH[0] <= tq < BREATH[1] or tq < REL + BAR:   # first bar only the chord, then the beat
            continue
        if q in (0, 2):
            music.add(tq, kick(), .4)
        if q in (1, 3):
            music.add(tq, brush(), .25)
        music.add(tq + BEAT / 2, hat(), .12, .3)
    b += 1
music.add(END, pad([48, 55, 59, 62, 64], 2.6, att=.05, rel=1.6, bright=.8), .3)
music.add(END, epiano(36, 2.5, .8), .2)
music.add(END, bell(mtof(88)), .05)

# ---------------------------------------------------------------- sound effects


def fx_grind(d):
    n = int(d * SR)
    t = tt(n)
    am = (rng.random(int(d * 60) + 2) > .4).astype(float)
    am = np.repeat(am, SR // 60)[:n]
    s = band(noise(n), lo=1500, hi=5000) * (.4 + .6 * am) * (.6 + .4 * np.sin(2 * np.pi * 37 * t))
    return s * env_bell(n, .08) * .45


def fx_slap(g=1.0):
    n = int(.18 * SR)
    t = tt(n)
    return band(noise(n), lo=900, hi=6500) * np.exp(-t * 70) * g


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


def fx_tick():
    n = int(.08 * SR)
    t = tt(n)
    return (np.sin(2 * np.pi * 1600 * t) * np.exp(-t * 60) + band(noise(n), lo=3000) * np.exp(-t * 200) * .4) * .6


def fx_release():
    n = int(.6 * SR)
    t = tt(n)
    pop = np.sin(2 * np.pi * np.cumsum(300 + 500 * np.exp(-t * 20)) / SR) * np.exp(-t * 14) * .6
    air = band(noise(n), lo=300, hi=3000) * np.exp(-t * 5) * .3
    return pop + air


def fx_thump(i):
    t = tt(int(.3 * SR))
    f = 120 - i * 12
    return np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-t * 30))) / SR) * np.exp(-t * 14) + band(noise(len(t)), lo=300, hi=2500) * np.exp(-t * 40) * .4


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


def fx_breath(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    s = band(noise(n), lo=250, hi=2200) * np.sin(np.pi * np.minimum(1, x * 1.15)) ** 1.2
    return s * .55


def fx_thud():
    n = int(.6 * SR)
    t = tt(n)
    return kick(.6) * 1.1 + band(noise(n), lo=200, hi=1800) * np.exp(-t * 18) * .8


def fx_stamp():
    n = int(.3 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(70 + 100 * np.exp(-t * 26)) / SR) * np.exp(-t * 26) * 1.2 + band(noise(n), lo=400, hi=3500) * np.exp(-t * 45) * .9


for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-.3, .3))
    if ty == 'grind':
        sfx.add(t0, fx_grind(c['d']), .5)
    elif ty == 'slap':
        sfx.add(t0, fx_slap(g), .4, pan)
    elif ty == 'slide':
        sfx.add(t0, fx_slide(c['d'], g), .48, pan)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), .5, pan * 2)
    elif ty == 'pen':
        sfx.add(t0, fx_pen(c['d'], g), .5, pan)
    elif ty == 'scratch':
        sfx.add(t0, fx_pen(c['d'], g, True), .55, pan)
    elif ty == 'tick':
        sfx.add(t0, fx_tick(), .45)
    elif ty == 'release':
        sfx.add(t0, fx_release(), .5)
    elif ty == 'thump':
        sfx.add(t0, fx_thump(c.get('i', 0)), .45)
    elif ty == 'peel':
        sfx.add(t0, fx_peel(c['d']), .55)
    elif ty == 'breath':
        sfx.add(t0, fx_breath(c['d']), .4)
    elif ty == 'thud':
        sfx.add(t0, fx_thud(), .5)
    elif ty == 'stamp':
        sfx.add(t0, fx_stamp(), .42, pan)
    elif ty == 'chime':
        sfx.add(t0, bell(mtof(91)), .1, pan)

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
