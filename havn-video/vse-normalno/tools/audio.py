"""Music + sound for «Всё нормально», synthesised from scratch.

0–11.4 s: night chat — a lonely piano in A minor over a thin pad.
11.4 s: the pull-back swells; «заметь меня» lands on a low hit and a bell.
16 s: the harmony turns to C major; at 26.4 s (copy the link) a soft pulse
starts (76 BPM) and carries to a final Cmaj9 under the HAVN mark.
Reads out/sfx.json (exported by the scene), writes out/music_sfx.wav.
"""
import json
import os
import wave

import numpy as np

SR = 48000
DUR = 36.5
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
rng = np.random.default_rng(21)
BEAT = 60 / 76


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
def piano(m, dur=2.6, vel=1.0):
    t = tt(int(dur * SR))
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * k * t * (1 + .0004 * k * k)) * np.exp(-t * (1.1 + k * .9)) / k ** 1.3 for k in range(1, 7))
    s = s * (1 - np.exp(-t * 900)) * np.minimum(1, (dur - t) / .3)
    return band(s, hi=4200) * vel


# night: Am – F – C – G, one chord per round of the chat
NIGHT = [(0.0, [57, 60, 64], 45, [76, 72]), (2.85, [53, 57, 60], 41, [72, 69]), (5.7, [52, 55, 60], 48, [71, 67]), (8.55, [50, 55, 59], 43, [74, 71])]
for t0, ch, bass, mel in NIGHT:
    music.add(t0, pad(ch, 3.4, att=.9, rel=1.2, bright=.35), .16)
    music.add(t0 + .02, piano(bass - 12, 3.4, .8), .2)
    for k, m in enumerate(ch + [ch[1] + 12]):
        music.add(t0 + .35 + k * .55, piano(m + 12, 2.4, .55), .08, (-.3, .1, .3, -.1)[k])
    for k, m in enumerate(mel):
        music.add(t0 + .9 + k * 1.1, piano(m, 2.8, .7), .1, .15)

# pull-back: a swell on F, the sheet lands on Am, «заметь меня» on Dm/F
music.add(11.3, pad([53, 57, 60, 64], 2.0, att=1.4, rel=.4, bright=.8), .3)
music.add(12.85, pad([45, 57, 60, 64, 69], 3.3, att=.05, rel=.9, bright=.5), .22)
music.add(12.85, piano(33, 3.0, 1.0), .25)
music.add(14.8, pad([50, 57, 62, 65, 69], 2.4, att=.1, rel=1.0, bright=.6), .22)
music.add(14.8, piano(38, 2.4, .9), .2)
for k, m in enumerate([69, 72, 76, 81]):
    music.add(15.0 + k * .18, piano(m, 2.0, .6), .07, (-.2, .2, -.1, .1)[k])

# turning warm: C – G/B – Am7 – F (ask again, the mask comes off)
WARM = [(16.4, [48, 55, 60, 64, 67], 36), (18.0, [47, 55, 59, 62], 35), (19.75, [45, 55, 60, 64], 33), (20.75, [41, 57, 60, 64, 67], 29), (23.1, [43, 55, 59, 62, 65], 31)]
for i, (t0, ch, bass) in enumerate(WARM):
    dur = (WARM[i + 1][0] if i + 1 < len(WARM) else 26.4) - t0 + .8
    music.add(t0, pad(ch, dur, att=.4, rel=.8, bright=.6), .2)
    music.add(t0, piano(bass + 12, min(dur, 3.0), .8), .2)
    for k in range(int((dur - .8) / .45)):
        music.add(t0 + k * .45, piano(ch[(k * 2 + 1) % len(ch)] + 12, 1.6, .45), .06, (-.25, .25)[k % 2])

# copy the link: C – Am – F – G with a soft pulse, then the mark
LOOP = [([48, 55, 60, 64], 36), ([45, 52, 57, 60], 33), ([41, 48, 57, 60], 29), ([43, 50, 55, 59], 31)]
BAR = BEAT * 4
END = 33.4
b = 0
while 26.4 + b * BAR < END:
    tb = 26.4 + b * BAR
    ch, bass = LOOP[b % 4]
    music.add(tb - .05, pad(ch, BAR + .8, att=.3, rel=.8, bright=.65), .18)
    music.add(tb, epiano(bass, 2.4, .8), .2)
    for off, k in [(0, 1), (1.5, 2), (2.5, 3)]:
        music.add(tb + off * BEAT, epiano(ch[k] + 12, 1.4, .7), .07, .25)
    for q in range(4):
        tq = tb + q * BEAT
        if tq >= END - .1:
            continue
        if q in (0, 2):
            music.add(tq, kick(), .32)
        if q in (1, 3):
            music.add(tq, brush(), .2)
        music.add(tq + BEAT / 2, hat(), .1, .3)
    b += 1
music.add(END, pad([48, 55, 59, 62, 64, 67], 3.4, att=.05, rel=2.0, bright=.8), .3)
music.add(END, epiano(36, 3.2, .8), .22)
music.add(END + .3, bell(mtof(84)), .05)

# ---------------------------------------------------------------- sound effects
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




def fx_thud():
    n = int(.6 * SR)
    t = tt(n)
    return kick(.6) * 1.1 + band(noise(n), lo=200, hi=1800) * np.exp(-t * 18) * .8


def fx_stamp():
    n = int(.3 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(70 + 100 * np.exp(-t * 26)) / SR) * np.exp(-t * 26) * 1.2 + band(noise(n), lo=400, hi=3500) * np.exp(-t * 45) * .9


def fx_key(soft=False):
    n = int(.06 * SR)
    t = tt(n)
    return (band(noise(n), lo=2500, hi=9000) * np.exp(-t * 160) + np.sin(2 * np.pi * (900 + rng.random() * 200) * t) * np.exp(-t * 120) * .3) * (.35 if soft else .5)


def fx_bubble(up=True, soft=False):
    n = int(.25 * SR)
    t = tt(n)
    f = (500 + 600 * (1 - np.exp(-t * 30))) if up else (1100 - 400 * (1 - np.exp(-t * 30)))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    return (s + band(noise(n), lo=800, hi=4000) * np.exp(-t * 60) * .3) * (.4 if soft else .6)


def fx_tear(i):
    n = int(.4 * SR)
    t = tt(n)
    cr = (rng.random(n) > .985 - .01 * i) * rng.random(n)
    return (band(cr, lo=1200, hi=7000) * 5 + band(noise(n), lo=1500, hi=6000) * .25) * np.sin(np.pi * np.linspace(0, 1, n)) ** .5 * .8


def fx_drift(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    return band(noise(n), lo=400, hi=2500) * np.sin(np.pi * x) ** 2 * .3


def fx_swell(d):
    n = int(d * SR)
    x = np.linspace(0, 1, n)
    nz = noise(n)
    return (band(nz, lo=200, hi=1200) * x ** 2 + band(nz, lo=2000, hi=8000) * x ** 3 * .4) * .6 * (1 - np.clip((x - .93) / .07, 0, 1))


def fx_tap(i):
    n = int(.12 * SR)
    t = tt(n)
    return band(noise(n), lo=700 + 80 * (i % 5), hi=4500) * np.exp(-t * 55) * .5


def fx_rustle(d):
    n = int(d * SR)
    am = np.repeat((rng.random(int(d * 12) + 2) > .3).astype(float), SR // 12)[:n]
    return band(noise(n), lo=1500, hi=6000) * am * env_bell(n, .1) * .25


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


CHIMES = [88, 84, 91, 96]
for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-.3, .3))
    if ty == 'slap':
        sfx.add(t0, fx_slap(g), .4, pan)
    elif ty == 'slide':
        sfx.add(t0, fx_slide(c['d'], g), .45, pan)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), .5, pan * 2)
    elif ty == 'pen':
        sfx.add(t0, fx_pen(c['d'], g), .55, pan)
    elif ty == 'scratch':
        sfx.add(t0, fx_pen(c['d'], g, True), .6, pan)
    elif ty == 'key':
        sfx.add(t0, fx_key(), .5, pan)
    elif ty == 'sent':
        sfx.add(t0, fx_bubble(True), .45, .2)
    elif ty == 'incoming':
        sfx.add(t0, fx_bubble(False, c.get('soft')), .45, -.2)
    elif ty == 'dots':
        for k in range(int(c['d'] / .15)):
            sfx.add(t0 + k * .15, fx_tap(k), .08, -.2)
    elif ty == 'tear':
        sfx.add(t0, fx_tear(c.get('i', 0)), .5, pan)
    elif ty == 'drift':
        sfx.add(t0, fx_drift(c['d']), .4, pan * 2)
    elif ty == 'swell':
        sfx.add(t0, fx_swell(c['d']), .45)
    elif ty == 'tap':
        sfx.add(t0, fx_tap(c.get('i', 0)), .35, pan * 2)
    elif ty == 'thud':
        sfx.add(t0, fx_thud(), .5)
    elif ty == 'rustle':
        sfx.add(t0, fx_rustle(c['d']), .5)
    elif ty == 'peel':
        sfx.add(t0, fx_peel(c['d'] + .3), .45, pan)
    elif ty == 'stamp':
        sfx.add(t0, fx_stamp(), .42, pan)
    elif ty == 'press':
        sfx.add(t0, fx_press(), .5)
    elif ty == 'copy':
        sfx.add(t0, fx_copy(), .14)
    elif ty == 'fold':
        sfx.add(t0, fx_fold(), .4, pan)
    elif ty == 'plane':
        sfx.add(t0, fx_plane(c['d']), .45, .4)
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
