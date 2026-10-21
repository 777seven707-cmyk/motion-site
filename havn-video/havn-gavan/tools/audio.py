"""Music + sound design for «Гавань», synthesised from scratch.

Reads the cue list the scene exports (out/sfx.json) so every stamp, paper
slap and pen line lands on its frame; writes out/music_sfx.wav (48 kHz
stereo), a bed that leaves room for the voice.

96 BPM. Storm in A minor (0–4.9 s) → the harbour opens up (4.9–11.6) →
an easy F–C–Am–G walk past the piers (11.6–48.4) → drums drop out for the
help scene (48.4–54.6) → C major sunrise and chimes (54.6–63.5).
"""
import json
import os
import wave

import numpy as np

SR = 48000
DUR = 63.5
N = int(SR * DUR)
BEAT = 60 / 96
BAR = BEAT * 4
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
rng = np.random.default_rng(11)


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
        self.l = np.zeros(N + SR * 6)
        self.r = np.zeros(N + SR * 6)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        n = len(sig)
        self.l[i:i + n] += sig * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
        self.r[i:i + n] += sig * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


music, sfx = Bus(), Bus()

# ---------------------------------------------------------------- instruments


def pluck(m, dur=0.32, bright=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 30) \
        + 0.12 * bright * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 45)
    return s * np.exp(-t * 14) * (1 - np.exp(-t * 900))


def tick(acc=1.0):
    n = int(0.03 * SR)
    return band(noise(n), lo=5500, hi=12000) * np.exp(-tt(n) * 220) * acc


def kick(gain=1.0, f0=110, f1=45, dec=6.0, dur=0.45):
    n = int(dur * SR)
    t = tt(n)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec) * (1 - np.exp(-t * 2000)) * gain


def shaker():
    n = int(0.06 * SR)
    return band(noise(n), lo=6000, hi=11000) * np.exp(-tt(n) * 60)


def piano(m, dur=2.2, vel=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = np.zeros(n)
    for k, a in [(1, 1.0), (2, 0.42), (3, 0.18), (4, 0.08), (5, 0.04)]:
        s += a * np.sin(2 * np.pi * f * k * np.sqrt(1 + 0.0004 * k * k) * t) * np.exp(-t * (1.6 + 1.1 * k))
    return s * (1 - np.exp(-t * 260)) * np.minimum(1, (dur - t) / 0.25) * vel


def pad(notes, dur, att=0.7, rel=0.9, bright=0.6):
    n = int(dur * SR)
    t = tt(n)
    s = np.zeros(n)
    for m in notes:
        for det in (-0.07, 0.0, 0.07):
            fd = mtof(m) * 2 ** (det / 12)
            ph = 2 * np.pi * np.cumsum(fd * (1 + 0.0018 * np.sin(2 * np.pi * (0.23 + det) * t + m))) / SR
            for k in range(1, 9):
                s += np.sin(k * ph) * (1 / k) * np.exp(-k / (2.2 * bright + 0.5)) / 3
    return s * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t) / rel)) / max(1, len(notes))


def bell(f, dur=2.6, gain=1.0):
    n = int(dur * SR)
    t = tt(n)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4.5) \
        + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)
    return s * (1 - np.exp(-t * 1500)) * gain


# ---------------------------------------------------------------- the score
# storm
STORM = 4.9
chords_a = [[69, 72, 76, 72, 71, 72, 76, 79], [65, 69, 72, 69, 67, 69, 72, 76]]
i = 0
while i * BEAT / 4 < STORM - 1e-6:
    t = i * BEAT / 4
    bar = int(t // BAR) % 2
    music.add(t, pluck(chords_a[bar][i % 8], bright=1.0), 0.09 * (1.25 if i % 4 == 0 else 1), pan=-0.35 if i % 2 else 0.35)
    if i % 2 == 0:
        music.add(t, tick(1.0 if i % 4 == 0 else 0.55), 0.16, pan=0.25)
    if i % 4 == 0:
        music.add(t, kick(0.9, dec=7), 0.3)
        music.add(t, pluck(chords_a[bar][0] - 24, dur=0.5, bright=0.3), 0.14)
    i += 1
ci = int(STORM * SR)
fade = int(0.35 * SR)
for ch in (music.l, music.r):
    ch[ci - fade:ci] *= np.linspace(1, 0, fade) ** 2
    ch[ci:] = 0

# harbour opens: Am9 → Fmaj7 swell, bell on the name
music.add(4.4, pad([57, 60, 64, 67, 71], 3.4, att=1.2, rel=1.0, bright=0.7), 0.26)
music.add(7.3, pad([53, 57, 60, 64], 4.6, att=0.9, rel=1.2, bright=0.7), 0.26)
music.add(5.35, piano(45, dur=3.0, vel=0.7), 0.15)
music.add(7.5, piano(41, dur=3.5, vel=0.7), 0.15)
for tm, m in [(5.6, 76), (6.25, 79), (7.5, 77), (8.75, 76), (10.0, 72), (10.6, 74)]:
    music.add(tm, piano(m, vel=0.85), 0.11, pan=0.2)

# the walk past the piers: F – C – Am – G, one chord a bar
WALK0, WALK1 = 11.6, 48.4
prog = [([53, 57, 60, 64], 41), ([52, 55, 60, 67], 48), ([45, 52, 55, 60], 45), ([43, 50, 55, 59], 43)]
scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]
mel_rng = np.random.default_rng(5)
b = 0
while WALK0 + b * BAR < WALK1 - 0.1:
    tb = WALK0 + b * BAR
    notes, bass = prog[b % 4]
    d = min(BAR + 0.9, WALK1 + 0.6 - tb)
    music.add(tb - 0.1, pad(notes, d + 0.1, att=0.35, rel=0.8), 0.22, pan=-0.1)
    music.add(tb, piano(bass, dur=2.6, vel=0.7), 0.15)
    # a light melody: two or three notes a bar, chord tones mostly
    for k, off in enumerate([0, 1.5, 2.5] if b % 2 == 0 else [0.5, 2.0]):
        m = int(mel_rng.choice([n + 12 for n in notes] + scale[4:8]))
        music.add(tb + off * BEAT, piano(m, vel=0.8), 0.085, pan=0.25)
    for q in range(4):
        tq = tb + q * BEAT
        if tq >= WALK1 - 0.05:
            break
        if q in (0, 2):
            music.add(tq, kick(0.7, f0=90, f1=48, dec=9, dur=0.3), 0.15)
        music.add(tq + BEAT / 2, shaker(), 0.045, pan=-0.3)
        if q == 3:
            music.add(tq + BEAT * 0.75, shaker(), 0.03, pan=0.3)
    b += 1

# help: no drums, Dm7 → Am7 → Fmaj7, sparse piano
for k, (notes, bass) in enumerate([([50, 57, 60, 65], 38), ([45, 52, 55, 60], 45), ([53, 57, 60, 64], 41)]):
    tb = WALK1 + k * BAR
    music.add(tb - 0.1, pad(notes, BAR + 0.9, att=0.5, rel=0.9, bright=0.45), 0.24)
    music.add(tb, piano(bass, dur=2.8, vel=0.6), 0.14)
for tm, m in [(48.6, 69), (49.9, 72), (51.2, 69), (52.4, 67), (53.6, 69)]:
    music.add(tm, piano(m, vel=0.75), 0.09, pan=0.15)

# sunrise: Cmaj9 bloom, chimes climbing with the sun
music.add(54.4, pad([48, 55, 59, 62, 64], 9.3, att=1.4, rel=2.6, bright=0.9), 0.32)
music.add(54.6, piano(36, dur=4.5, vel=0.8), 0.16)
music.add(58.4, piano(43, dur=4.0, vel=0.6), 0.13)
for j, m in enumerate([84, 88, 91, 95, 98]):
    music.add(55.25 + j * 0.33, bell(mtof(m), gain=0.6), 0.065, pan=-0.4 + j * 0.2)
for tm, m in [(57.5, 79), (58.15, 76), (58.8, 72), (59.45, 67), (61.0, 72)]:
    music.add(tm, piano(m, dur=2.2, vel=0.8), 0.11, pan=0.15)

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
    t = tt(n)
    e = np.zeros(n)
    for k in range(int(np.ceil(d * 12))):
        e += np.exp(-np.maximum(0, t - k / 12) * 40) * (t >= k / 12)
    return e * env_bell(n, 0.2)


def fx_slide(d, g=1.0):
    n = int((d + 0.1) * SR)
    return band(noise(n), lo=500, hi=3800) * stepped_env(d, n) * 0.45 * g


def fx_whoosh(d, g=1.0):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    x = noise(n)
    return (band(x, lo=150, hi=900) * 0.8 + band(x, lo=900, hi=4000) * 0.5 * t) * np.sin(np.pi * t) ** 2 * 0.6 * g


def fx_pen(d, g=1.0, scratch=False):
    n = int(d * SR)
    t = tt(n)
    rate = (16 if scratch else 11) + 4 * np.sin(2 * np.pi * 1.7 * t + rng.random() * 6)
    am = (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR)) ** 2 * (0.6 + 0.4 * rng.random(n) ** 0.3)
    s = band(noise(n), lo=1600 if scratch else 2200, hi=5500 if scratch else 8000) * am * env_bell(n, 0.12)
    return s * (0.5 if scratch else 0.28) * g


def fx_rain(d):
    n = int(d * SR)
    x = band(noise(n), lo=1200, hi=9000) * 0.25
    drops = (rng.random(n) > 0.9993) * rng.random(n)
    x += band(drops, lo=2000, hi=8000) * 6
    return x * env_bell(n, 0.1)


def fx_wave(d, g=1.0):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    return band(noise(n), lo=120, hi=1400) * (np.sin(np.pi * t) ** 1.5) * 0.7 * g


def fx_thunder():
    n = int(2.2 * SR)
    t = tt(n)
    crack = band(noise(n), lo=800, hi=6000) * np.exp(-t * 18) * 0.8
    rumble = band(noise(n), lo=30, hi=220) * np.exp(-t * 1.6) * (1 - np.exp(-t * 20)) * 2.4
    return crack + rumble


def fx_stamp():
    n = int(0.3 * SR)
    t = tt(n)
    return kick(1.0, f0=170, f1=70, dec=26, dur=0.3) * 1.2 + band(noise(n), lo=400, hi=3500) * np.exp(-t * 45) * 0.9


def fx_tap():
    n = int(0.12 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 40) * 0.25 + band(noise(n), lo=3000, hi=9000) * np.exp(-t * 120) * 0.15


def fx_tear():
    n = int(0.45 * SR)
    t = tt(n)
    crackle = band(noise(n), lo=1500, hi=9000) * (rng.random(n) > 0.6) * np.exp(-t * 6)
    return crackle * 0.9 * env_bell(n, 0.05)


def fx_flutter(d):
    n = int(d * SR)
    t = tt(n)
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 18 * t)) ** 3
    return band(noise(n), lo=700, hi=4000) * am * np.linspace(1, 0, n) ** 1.5 * 0.4


def fx_pop(hi=0, i=0):
    n = int(0.16 * SR)
    t = tt(n)
    f0 = 500 + 140 * hi + 90 * i
    f = f0 * (1 + 1.5 * np.minimum(1, t / 0.05))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * (1 - np.exp(-t * 3000)) * 0.5


def fx_type(d):
    out = np.zeros(int(d * SR))
    k = 0.0
    while k < d - 0.05:
        n = int(0.025 * SR)
        j = int(k * SR)
        out[j:j + n] += band(noise(n), lo=2500, hi=8000) * np.exp(-tt(n) * 200) * 0.5
        k += 0.09 + rng.random() * 0.06
    return out


def fx_box():
    n = int(0.5 * SR)
    t = tt(n)
    return band(noise(n), lo=200, hi=1800) * np.exp(-t * 9) * 0.8 + kick(1.0, f0=120, f1=70, dec=14, dur=0.5) * 0.5


def fx_click(big=0):
    n = int(0.08 * SR)
    t = tt(n)
    s = band(noise(n), lo=2000, hi=9000) * np.exp(-t * 300) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) * 0.3
    if big:
        s = np.pad(s, (0, int(0.25 * SR))) + kick(1.0, f0=140, f1=80, dec=30, dur=0.33)[:len(s) + int(0.25 * SR)] * 0.8
    return s * 0.6


for c in json.load(open(os.path.join(OUT, 'sfx.json'))):
    ty, t0, g = c['type'], c['t'], c.get('g', 1.0)
    pan = float(rng.uniform(-0.3, 0.3))
    if ty == 'slap':
        sfx.add(t0, fx_slap(g, c.get('low', 0)), 0.4, pan)
    elif ty == 'slide':
        sfx.add(t0, fx_slide(c['d'], g), 0.48, pan)
    elif ty == 'whoosh':
        sfx.add(t0, fx_whoosh(c['d'], g), 0.5, pan * 2)
    elif ty == 'pen':
        sfx.add(t0, fx_pen(c['d'], g), 0.5, pan)
    elif ty == 'rain':
        sfx.add(t0, fx_rain(c['d']), 0.35)
    elif ty == 'wave':
        sfx.add(t0, fx_wave(c['d'], g), 0.35, pan)
    elif ty == 'thunder':
        sfx.add(t0, fx_thunder(), 0.32)
    elif ty == 'stamp':
        sfx.add(t0, fx_stamp(), 0.42, pan)
    elif ty == 'tap':
        sfx.add(t0, fx_tap(), 0.5, pan)
    elif ty == 'tear':
        sfx.add(t0, fx_tear(), 0.5)
    elif ty == 'flutter':
        sfx.add(t0, fx_flutter(c['d']), 0.45)
    elif ty == 'pop':
        sfx.add(t0, fx_pop(c.get('hi', 0), c.get('i', 0)), 0.42, pan)
    elif ty == 'type':
        sfx.add(t0, fx_type(c['d']), 0.4, -0.2)
    elif ty == 'box':
        sfx.add(t0, fx_box(), 0.45)
    elif ty == 'click':
        sfx.add(t0, fx_click(c.get('big', 0)), 0.5)
    elif ty == 'chime':
        sfx.add(t0, bell(mtof(96 if c.get('hi') else 91), dur=2.2), 0.11, pan)

# ---------------------------------------------------------------- mix
mix = np.stack([music.l[:N] + sfx.l[:N], music.r[:N] + sfx.r[:N]], 1)
mix = np.tanh(mix * 1.1) / 1.1
mix[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
fo = int(1.6 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
peak = np.abs(mix).max()
mix *= 0.85 / peak
with wave.open(os.path.join(OUT, 'music_sfx.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote music_sfx.wav, peak was', round(float(peak), 3))
