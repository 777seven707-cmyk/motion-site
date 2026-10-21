"""Music + sound design for «Устал от всего?», synthesised from scratch.

Reads the cue list the scene exports (out/sfx.json) so every paper slap,
pen scratch and chime lands on the frame it belongs to, and writes
out/music_sfx.wav (48 kHz stereo): a bed that leaves room for the voice.

96 BPM, A minor tension (0–8.75 s) → hard silence on «Стоп» → warm F–C–Am–G
(10–18.75 s) → C major sunrise with chimes (18.75–24 s).
"""
import json
import os
import sys
import wave

import numpy as np

SR = 48000
DUR = 25.5
N = int(SR * DUR)
BEAT = 60 / 96
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def band(x, lo=None, hi=None, soft=1.15):
    """Static FFT band-pass with gentle slopes."""
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
        self.l = np.zeros(N + SR * 4)
        self.r = np.zeros(N + SR * 4)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        n = len(sig)
        gl = gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        gr = gain * np.sin((pan + 1) * np.pi / 4) * 1.414
        self.l[i:i + n] += sig * gl
        self.r[i:i + n] += sig * gr


music, sfx = Bus(), Bus()

# ---------------------------------------------------------------- instruments


def pluck(m, dur=0.32, bright=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 30) \
        + 0.12 * bright * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 45)
    env = np.exp(-t * 14) * (1 - np.exp(-t * 900))
    return s * env


def tick(acc=1.0):
    n = int(0.03 * SR)
    s = band(noise(n), lo=5500, hi=12000) * np.exp(-tt(n) * 220)
    return s * acc


def kick(gain=1.0, f0=110, f1=45, dec=6.0, dur=0.45):
    n = int(dur * SR)
    t = tt(n)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * dec) * (1 - np.exp(-t * 2000)) * gain


def piano(m, dur=2.2, vel=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = np.zeros(n)
    for k, a in [(1, 1.0), (2, 0.42), (3, 0.18), (4, 0.08), (5, 0.04)]:
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        s += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.6 + 1.1 * k))
    env = (1 - np.exp(-t * 260)) * np.minimum(1, (dur - t) / 0.25)
    return s * env * vel


def pad(notes, dur, att=0.7, rel=0.9, bright=0.6):
    n = int(dur * SR)
    t = tt(n)
    s = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for det in (-0.07, 0.0, 0.07):
            fd = f * 2 ** (det / 12)
            vib = 1 + 0.0018 * np.sin(2 * np.pi * (0.23 + det) * t + m)
            ph = 2 * np.pi * np.cumsum(fd * vib) / SR
            for k in range(1, 9):
                s += np.sin(k * ph) * (1 / k) * np.exp(-k / (2.2 * bright + 0.5)) / 3
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel))
    return s * env / max(1, len(notes))


def bell(f, dur=2.6, gain=1.0):
    n = int(dur * SR)
    t = tt(n)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4.5) \
        + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)
    return s * (1 - np.exp(-t * 1500)) * gain


# ---------------------------------------------------------------- the score
# A: tension, 0 – 8.75
CUT = 8.75
chords_a = [[69, 72, 76, 72, 71, 72, 76, 79], [65, 69, 72, 69, 67, 69, 72, 76],
            [62, 65, 69, 65, 64, 65, 69, 72], [64, 68, 71, 68, 66, 68, 71, 74]]
step = BEAT / 4
i = 0
t = 0.0
while t < CUT - 1e-6:
    bar = int(t // (BEAT * 4)) % 4
    m = chords_a[bar][i % 8]
    build = 0.55 + 0.45 * min(1, t / CUT)
    music.add(t, pluck(m, bright=0.6 + 0.6 * build), 0.085 * build * (1.25 if i % 4 == 0 else 1),
              pan=-0.35 if i % 2 else 0.35)
    if i % 2 == 0:
        music.add(t, tick(1.0 if i % 4 == 0 else 0.55), 0.18 * build, pan=0.25)
    if i % 4 == 0:
        music.add(t, kick(0.9, dec=7), 0.32 * (0.6 + 0.4 * build))
        music.add(t, pluck(chords_a[bar][0] - 24, dur=0.5, bright=0.3), 0.14 * build)
    i += 1
    t = i * step
# riser into the stop
rs, re = 6.9, CUT
n = int((re - rs) * SR)
x = noise(n)
chunks = []
k = 0
for j in range(0, n, 2400):
    seg = x[j:j + 2400]
    cut = 800 + 5200 * (j / n) ** 1.5
    chunks.append(band(np.pad(seg, (0, 2400 - len(seg))), lo=cut * 0.5, hi=cut * 1.6)[:len(seg)])
riser = np.concatenate(chunks) * np.linspace(0, 1, n) ** 2.2
music.add(rs, riser, 0.11)
# hard cut: everything after 8.75 in bus A is silenced
ci = int(CUT * SR)
fade = int(0.006 * SR)
for ch in (music.l, music.r):
    ch[ci:ci + fade] *= np.linspace(1, 0, fade)
    ch[ci + fade:] = 0

# B: warm, 10 – 18.75
B0 = 10.0
BAR = BEAT * 4
prog_b = [([53, 57, 60, 64], 41), ([52, 55, 60, 67], 48), ([45, 52, 55, 60], 45), ([43, 50, 55, 59], 43)]
for b, (notes, bass) in enumerate(prog_b):
    tb = B0 + b * BAR
    d = BAR + 0.9 if b < 3 else 18.95 - tb
    music.add(tb - 0.15, pad(notes, d + 0.15, att=0.9 if b == 0 else 0.4), 0.24, pan=-0.1)
    music.add(tb, piano(bass, dur=2.6, vel=0.7), 0.16)
mel = [(10.0, 76), (10.94, 72), (11.56, 67), (12.5, 76), (13.13, 74), (13.75, 72), (14.38, 69),
       (15.0, 76), (15.63, 79), (16.25, 81), (17.19, 79), (17.5, 76), (18.13, 74)]
for tm, m in mel:
    music.add(tm, piano(m, vel=0.9), 0.12, pan=0.2)
t = 15.0
while t < 18.7:
    music.add(t, kick(0.7, f0=90, f1=48, dec=9, dur=0.3), 0.16)
    t += BEAT * 2
t = 15.0
while t < 18.7:
    sh = band(noise(int(0.06 * SR)), lo=6000, hi=11000) * np.exp(-tt(int(0.06 * SR)) * 60)
    music.add(t + BEAT / 2, sh, 0.05, pan=-0.3)
    t += BEAT

# C: sunrise, 18.75 – 24
music.add(18.6, pad([48, 55, 59, 62, 64], 6.9, att=1.4, rel=2.2, bright=0.9), 0.34)
music.add(18.75, piano(36, dur=4.5, vel=0.8), 0.17)
music.add(22.5, piano(43, dur=3.0, vel=0.6), 0.14)
for j, m in enumerate([84, 88, 91, 95, 98]):
    music.add(19.05 + j * 0.31, bell(mtof(m), gain=0.6), 0.07, pan=-0.4 + j * 0.2)
for tm, m in [(21.25, 79), (21.88, 76), (22.5, 72), (23.13, 67), (24.38, 72)]:
    music.add(tm, piano(m, dur=2.0, vel=0.8), 0.12, pan=0.15)
# room tone under the silence
music.add(8.75, band(noise(int(1.3 * SR)), hi=500) * 0.004, 1.0)

# ---------------------------------------------------------------- sound effects


def env_bell(n, a=0.3):
    t = np.linspace(0, 1, n)
    return np.minimum(1, t / a) * np.minimum(1, (1 - t) / a)


def fx_slap(g=1.0, low=0):
    n = int(0.18 * SR)
    t = tt(n)
    s = band(noise(n), lo=900, hi=6500) * np.exp(-t * 70)
    s += 0.25 * band(noise(n), lo=2500, hi=9000) * np.exp(-t * 25) * (rng.random(n) > 0.85)
    if low:
        s += 1.4 * kick(1.0, f0=150, f1=60, dec=22, dur=0.18)
    return s * g


def stepped_env(d, n):
    """paper moved in 12 fps steps: a little shove per step"""
    t = tt(n)
    e = np.zeros(n)
    for k in range(int(np.ceil(d * 12))):
        t0 = k / 12
        e += np.exp(-np.maximum(0, t - t0) * 40) * (t >= t0)
    return e * env_bell(n, 0.2)


def fx_slide(d, g=1.0):
    n = int((d + 0.1) * SR)
    return band(noise(n), lo=500, hi=3800) * stepped_env(d, n) * 0.45 * g


def fx_whoosh(d, g=1.0):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    x = noise(n)
    lo = band(x, lo=150, hi=900)
    hi = band(x, lo=900, hi=4000)
    e = np.sin(np.pi * t) ** 2
    return (lo * 0.8 + hi * 0.5 * t) * e * 0.6 * g


def fx_pen(d, g=1.0, scratch=False):
    n = int(d * SR)
    t = tt(n)
    rate = (16 if scratch else 11) + 4 * np.sin(2 * np.pi * 1.7 * t + rng.random() * 6)
    ph = 2 * np.pi * np.cumsum(rate) / SR
    am = (0.5 + 0.5 * np.sin(ph)) ** 2 * (0.6 + 0.4 * rng.random(n) ** 0.3)
    s = band(noise(n), lo=1600 if scratch else 2200, hi=5500 if scratch else 8000) * am * env_bell(n, 0.12)
    return s * (0.5 if scratch else 0.28) * g


def fx_thud():
    n = int(0.9 * SR)
    t = tt(n)
    s = kick(1.0, f0=95, f1=36, dec=4.2, dur=0.9) * 1.2
    s += band(noise(n), hi=380) * np.exp(-t * 14) * 1.2
    sl = fx_slap(0.9, 0)
    s[:len(sl)] += sl
    return s


def fx_shrink(d):
    n = int(d * SR)
    t = tt(n)
    f = 820 * np.exp(-t * 4.0) + 260
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * (1 - np.exp(-t * 400)) * 0.25


def fx_water(i):
    out = np.zeros(int(0.35 * SR))
    for b in range(2):
        n = int(0.07 * SR)
        t = tt(n)
        f0 = 380 + 90 * i + 160 * b
        f = f0 * (1 + 1.4 * t / 0.07)
        bub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 55) * (1 - np.exp(-t * 3000))
        j = int(b * 0.06 * SR)
        out[j:j + n] += bub
    sp = band(noise(len(out)), lo=1500, hi=7000) * np.exp(-tt(len(out)) * 30) * 0.15
    return (out + sp) * 0.45


for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-0.3, 0.3))
    if ty == 'slap':
        sfx.add(t0, fx_slap(g, c.get('low', 0)), 0.42, pan)
    elif ty == 'slide':
        sfx.add(t0, fx_slide(c['d'], g), 0.5, pan)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), 0.55, pan * 2)
    elif ty == 'pen':
        sfx.add(t0, fx_pen(c['d'], g), 0.5, pan)
    elif ty == 'scratch':
        sfx.add(t0, fx_pen(c['d'], g, scratch=True), 0.55, pan)
    elif ty == 'thud':
        sfx.add(t0, fx_thud(), 0.38)
    elif ty == 'shrink':
        sfx.add(t0, fx_shrink(c['d']), 0.5)
    elif ty == 'water':
        sfx.add(t0, fx_water(c.get('i', 0)), 0.55, pan)
    elif ty == 'chime':
        sfx.add(t0, bell(mtof(96 if c.get('hi') else 91), dur=2.2), 0.12, pan)

# ---------------------------------------------------------------- mix
L = music.l[:N] * 1.0 + sfx.l[:N]
R = music.r[:N] * 1.0 + sfx.r[:N]
# gentle glue: soft clip, then fades at both ends
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / 1.1
mix[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
fo = int(1.3 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
peak = np.abs(mix).max()
mix *= 0.85 / peak
pcm = (mix * 32767).astype('<i2')
path = os.path.join(OUT, 'music_sfx.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', path, 'peak was', round(float(peak), 3))
