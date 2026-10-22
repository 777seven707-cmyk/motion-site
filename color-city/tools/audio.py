"""Music and sound for «Город красок», synthesised from scratch.

The score gets its colour back together with the city: a lonely muffled
piano under the rain, then one more instrument with each early bounce
(kick and bass → claps → marimba → hats and pad → a whistled tune →
shakers), a build-up to the boop, a full chorus while the rainbow grows,
and a soft outro. Every splat rings one note of the scale.

Reads out/sfx.json (exported by the scene), writes out/music_sfx.wav.
"""
import json
import os
import wave

import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
CUES = json.load(open(os.path.join(OUT, 'sfx.json')))
DUR = 45.0
N = int(SR * DUR)
BEAT = 0.5
BAR = 2.0
rng = np.random.default_rng(3)


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

# ---------------------------------------------------------------- instruments


def kick(dur=0.35):
    t = tt(int(dur * SR))
    f = 48 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * (1 - np.exp(-t * 3000))


def clap():
    n = int(0.25 * SR)
    t = tt(n)
    env = np.zeros(n)
    for d in (0, 0.011, 0.022):
        env += np.exp(-np.maximum(0, t - d) * 60) * (t >= d)
    env += 0.4 * np.exp(-t * 14)
    return band(noise(n), lo=900, hi=5000) * env * 0.6


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    return band(noise(n), lo=7000, hi=14000) * np.exp(-tt(n) * (18 if open_ else 90)) * 0.5


def shaker():
    n = int(0.07 * SR)
    t = tt(n)
    return band(noise(n), lo=5000, hi=11000) * np.sin(np.pi * t / t[-1]) ** 2 * 0.35


def snare():
    n = int(0.2 * SR)
    t = tt(n)
    return band(noise(n), lo=1500, hi=8000) * np.exp(-t * 22) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5


def tom(m):
    t = tt(int(0.4 * SR))
    f = mtof(m) * (1 + 0.5 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def bass(m, dur):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (2 + k * 1.5)) for k in range(1, 6))
    return s * (1 - np.exp(-t * 400)) * np.minimum(1, (dur - t) / 0.03)


def marimba(m, dur=0.5):
    t = tt(int(dur * SR))
    f = mtof(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.25 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 30)) * (1 - np.exp(-t * 2000))


def piano(m, dur=2.0, vel=1.0, dark=False):
    t = tt(int(dur * SR))
    f = mtof(m)
    parts = [(1, 1.0), (2, .3), (3, .1)] if dark else [(1, 1.0), (2, .42), (3, .18), (4, .08), (5, .04)]
    s = sum(a * np.sin(2 * np.pi * f * k * np.sqrt(1 + .0004 * k * k) * t) * np.exp(-t * (1.6 + 1.1 * k)) for k, a in parts)
    return s * (1 - np.exp(-t * 260)) * np.minimum(1, (dur - t) / .25) * vel


def pad(notes, dur, att=0.6, rel=0.8, bright=0.7):
    t = tt(int(dur * SR))
    s = np.zeros(len(t))
    for m in notes:
        for det in (-0.08, 0.0, 0.08):
            ph = 2 * np.pi * np.cumsum(mtof(m) * 2 ** (det / 12) * (1 + .002 * np.sin(2 * np.pi * .3 * t + m))) / SR
            for k in range(1, 8):
                s += np.sin(k * ph) / k * np.exp(-k / (2.2 * bright + .5)) / 3
    return s * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel)) / len(notes)


def whistle(m, dur):
    t = tt(int(dur * SR))
    f = mtof(m) * (1 + .006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .15))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .08 * band(noise(len(t)), lo=mtof(m) * .8, hi=mtof(m) * 1.3)
    return s * np.minimum(1, t / .03) * np.minimum(1, (dur - t) / .06)


def bell(f, dur=2.4, gain=1.0):
    t = tt(int(dur * SR))
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.4) + .45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    return s * (1 - np.exp(-t * 1500)) * gain


# ---------------------------------------------------------------- the score
T0 = 5.0
LAYER = {'kick': 5.0, 'clap': 8.0, 'marimba': 10.0, 'hat': 13.0, 'pad': 13.0, 'lead': 15.5, 'shaker': 21.5}
BUILD0, BOOP, OUTRO, END = 27.0, 30.0, 36.0, 44.0
CH = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]   # C Am F G
LEAD = [[76, 79, 81, 79, 76, None, 74, 72], [72, 76, 79, 76, 74, None, 72, 69], [69, 72, 77, 76, 72, None, 69, 72], [71, 74, 79, 77, 74, None, 71, 67]]

# intro: a lonely, muffled A-minor piano under the rain
for k, (tm, m) in enumerate([(0.4, 57), (1.4, 60), (2.4, 64), (3.4, 62), (4.1, 59)]):
    music.add(tm, piano(m, 2.4, .8, dark=True), .16, pan=-.2)
music.add(0.0, pad([45, 52, 57], 5.2, att=1.5, rel=.8, bright=.3), .14)

bar = 0
while T0 + bar * BAR < END:
    tb = T0 + bar * BAR
    root, tri = CH[bar % 4]
    chorus = BOOP <= tb < OUTRO
    build = BUILD0 <= tb < BOOP
    outro = tb >= OUTRO
    for q in range(4):
        tq = tb + q * BEAT
        if tq >= END:
            break
        if BOOP - 0.5 <= tq < BOOP:   # a breath of silence before the boop
            continue
        if tq >= LAYER['kick'] and not (outro and tq > 41):
            music.add(tq, kick(), .55 if not outro else .35)
        if tq >= LAYER['clap'] and q in (1, 3) and not outro:
            music.add(tq, clap(), .32)
        if tq >= LAYER['hat'] and not outro:
            music.add(tq + BEAT / 2, hat(), .18, pan=.3)
            if chorus:
                music.add(tq, hat(), .1, pan=-.3)
        if tq >= LAYER['shaker'] and not outro:
            for s16 in range(2):
                music.add(tq + s16 * BEAT / 2 + BEAT / 4, shaker(), .12, pan=-.4)
    # bass: root on 1 and the and of 2, octave on 3
    if tb >= LAYER['kick'] and not (BOOP - 0.5 <= tb < BOOP):
        for off, m, d in [(0, root, .45), (.75, root, .2), (1.0, root + 12, .4), (1.5, root + 7, .4)]:
            if tb + off < END and not (BOOP - .5 <= tb + off < BOOP):
                music.add(tb + off, bass(m, d), .32)
    # marimba arpeggio in eighths
    if tb >= LAYER['marimba']:
        arp = [tri[0] + 12, tri[1] + 12, tri[2] + 12, tri[1] + 12, tri[0] + 24, tri[2] + 12, tri[1] + 12, tri[2] + 12]
        for e, m in enumerate(arp):
            te = tb + e * .25
            if te < END and not (BOOP - .5 <= te < BOOP):
                music.add(te, marimba(m), .13 if not chorus else .16, pan=.35 if e % 2 else -.15)
    if tb >= LAYER['pad']:
        music.add(tb - .05, pad([n + (12 if chorus else 0) for n in tri], BAR + .6, att=.3, rel=.6, bright=.8 if chorus else .6), .2 if not chorus else .24, pan=-.1)
    if tb >= LAYER['lead'] and not build and not outro:
        for e, m in enumerate(LEAD[bar % 4]):
            if m is None:
                continue
            nxt = next((j for j in range(e + 1, 8) if LEAD[bar % 4][j] is not None), 8)
            music.add(tb + e * .25, whistle(m + (12 if chorus else 0), (nxt - e) * .25 * .92), .075 if not chorus else .065, pan=.15)
    if chorus:
        for e, m in enumerate([84, 88, 91, 88]):
            music.add(tb + e * .5 + .25, bell(mtof(m), 1.2), .035, pan=.5 - e * .3)
    if outro:
        music.add(tb, piano(tri[0] + 12, 2.2, .7), .1)
    if tb >= 21.5 and not build and not outro and bar % 4 == 3:   # tom fill into the next phrase
        for j, m in enumerate([50, 47, 43]):
            music.add(tb + 1.25 + j * .25, tom(m), .3, pan=-.3 + j * .3)
    bar += 1

# build-up: snare roll accelerating into the boop
t = BUILD0
step = .25
while t < BOOP - .5:
    music.add(t, snare(), .18 + .25 * (t - BUILD0) / (BOOP - BUILD0))
    t += step
    step = max(.0625, step * .93)
# final chord rings out
music.add(END, pad([48, 55, 60, 64, 67, 72], 4.0, att=.05, rel=2.4, bright=.9), .3)
music.add(END, piano(48, 3.5, .9), .2)
music.add(END, bell(mtof(84), 3.0), .07)

# ---------------------------------------------------------------- sound effects
SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]


def env_bell(n, a=.3):
    x = np.linspace(0, 1, n)
    return np.minimum(1, x / a) * np.minimum(1, (1 - x) / a)


def fx_boing(i, big=0, small=0):
    dur = .55 if big else .4
    t = tt(int(dur * SR))
    f0 = mtof(55 + SCALE[i % len(SCALE)] - (5 if big else 0))
    f = f0 * (1.35 - .35 * np.exp(-t * 6)) * (1 + .22 * np.sin(2 * np.pi * 16 * t) * np.exp(-t * 7))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5 if big else 8)) * (1 - np.exp(-t * 2000))
    return s * (.45 if small else 1)


def fx_splat(big=0):
    n = int((.45 if big else .28) * SR)
    t = tt(n)
    gurgle = (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * (35 + 20 * rng.random()) * t)))
    s = band(noise(n), lo=200, hi=2500) * np.exp(-t * (9 if big else 16)) * gurgle
    s += band(noise(n), lo=2500, hi=9000) * np.exp(-t * 40) * .4
    if big:
        s += kick(.45)[:n] * .9
    return s * .7


def fx_wobble():
    t = tt(int(.7 * SR))
    f = 110 * (1 + .12 * np.sin(2 * np.pi * 9 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * .7


def fx_whistle(d):
    t = tt(int(d * SR))
    f = 2300 * np.exp(-t / d * 1.6) + 350
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .05) * .35


def fx_grumble():
    t = tt(int(1.3 * SR))
    s = band(noise(len(t)), hi=260) * 2.5 + np.sin(2 * np.pi * 62 * t) * .6
    return s * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) * env_bell(len(t), .25) * .5


def fx_rain(d):
    n = int(d * SR)
    x = band(noise(n), lo=1500, hi=10000) * .2
    x += band((rng.random(n) > .9992) * rng.random(n), lo=2000, hi=8000) * 5
    fade = np.ones(n)
    fade[-int(.6 * SR):] = np.linspace(1, 0, int(.6 * SR))
    return x * fade * np.minimum(1, tt(n) / .3)


def fx_pop(i):
    t = tt(int(.12 * SR))
    f = 700 + 90 * i
    return np.sin(2 * np.pi * f * (1 + 2 * t) * t) * np.exp(-t * 45) * .5 + band(noise(len(t)), lo=2000) * np.exp(-t * 120) * .3


def fx_fountain(d):
    n = int(d * SR)
    x = band(noise(n), lo=400, hi=4000) * (.7 + .3 * np.sin(2 * np.pi * 3 * tt(n)))
    return x * np.minimum(1, tt(n) / .4) * np.linspace(1, .2, n) * .35


def fx_beep():
    out = np.zeros(int(.45 * SR))
    for k, d in enumerate((0, .2)):
        t = tt(int(.14 * SR))
        s = (np.sign(np.sin(2 * np.pi * 440 * t)) + np.sign(np.sin(2 * np.pi * 554 * t))) * .5
        s = band(s, hi=3000) * env_bell(len(t), .1)
        out[int(d * SR):int(d * SR) + len(t)] += s
    return out * .25


def fx_riser(d):
    n = int(d * SR)
    t = tt(n)
    x = np.linspace(0, 1, n)
    s = np.sin(2 * np.pi * np.cumsum(200 + 900 * x ** 2) / SR) * .3 + band(noise(n), lo=1500, hi=9000) * .3
    return s * x ** 2


def fx_boop():
    t = tt(int(.3 * SR))
    f = 500 + 700 * np.minimum(1, t / .08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * (1 - np.exp(-t * 900))


def fx_crash():
    n = int(2.8 * SR)
    return band(noise(n), lo=3000, hi=14000) * np.exp(-tt(n) * 1.6) * .5


def fx_swell(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    return band(noise(n), lo=200, hi=3000) * np.sin(np.pi * x) ** 2 * .45


def fx_rainbow(d):
    out = np.zeros(int((d + 2.5) * SR))
    notes = [72 + s for s in SCALE] + [96]
    for j, m in enumerate(notes):
        b = bell(mtof(m), 2.2)
        i = int(j * d / len(notes) * SR)
        out[i:i + len(b)] += b * .5
    return out


for c in CUES:
    ty, t0 = c['type'], c['t']
    pan = float(rng.uniform(-.3, .3))
    if ty == 'boing':
        sfx.add(t0, fx_boing(c.get('i', 0), c.get('big', 0), c.get('small', 0)), .32, pan)
    elif ty == 'splat':
        sfx.add(t0, fx_splat(c.get('big', 0)), .42, pan)
    elif ty == 'note':
        sfx.add(t0, bell(mtof(84 + SCALE[c['i'] % len(SCALE)] - 12 * (c['i'] // len(SCALE) % 2)), 1.6), .06, pan)
    elif ty == 'wobble':
        sfx.add(t0, fx_wobble(), .3)
    elif ty == 'whistle':
        sfx.add(t0, fx_whistle(c['d']), .35)
    elif ty == 'grumble':
        sfx.add(t0, fx_grumble(), .45)
    elif ty == 'rain':
        sfx.add(t0, fx_rain(c['d']), .3)
    elif ty == 'balloons':
        for j in range(10):
            sfx.add(t0 + j * .09, fx_pop(j), .25, float(rng.uniform(-.6, .6)))
        sfx.add(t0, fx_swell(c['d']), .3)
    elif ty == 'fountain':
        sfx.add(t0, fx_fountain(c['d']), .5, .2)
    elif ty == 'beep':
        sfx.add(t0, fx_beep(), .5, pan)
    elif ty == 'riser':
        sfx.add(t0, fx_riser(c['d']), .35)
    elif ty == 'boop':
        sfx.add(t0, fx_boop(), .55)
    elif ty == 'crash':
        sfx.add(t0, fx_crash(), .35)
    elif ty == 'swell':
        sfx.add(t0, fx_swell(c['d']), .35)
    elif ty == 'rainbow':
        sfx.add(t0, fx_rainbow(c['d']), .12)
    elif ty == 'ding':
        sfx.add(t0, bell(mtof(96), 1.8), .12, .2)
        sfx.add(t0 + .08, bell(mtof(100), 1.6), .08, .3)
    elif ty == 'tick':
        sfx.add(t0, fx_boing(c.get('i', 0) + 3, small=1), .3, -.5 + c.get('i', 0) * .09)

# ---------------------------------------------------------------- mix
mix = np.stack([music.l[:N] + sfx.l[:N], music.r[:N] + sfx.r[:N]], 1)
mix = np.tanh(mix * 1.05) / 1.05
mix[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))[:, None]
fo = int(.6 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix *= .89 / np.abs(mix).max()
with wave.open(os.path.join(OUT, 'music_sfx.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote music_sfx.wav')
