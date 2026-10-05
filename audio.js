/* Весь звук синтезируется на лету через Web Audio — никаких файлов.
   Браузеры разрешают звук только после клика, поэтому он включается кнопкой. */
window.SFX = (function () {
  let ctx = null, master = null, noise = null;
  let enabled = false, ambienceWanted = false, ambienceOn = false;
  let crackleTimer = null, padTimer = null, humNode = null;
  const listeners = [];

  const rnd = (a, b) => a + Math.random() * (b - a);

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function noiseBurst(t, dur, { type = 'bandpass', f = 2000, f2 = null, q = 1, gain = 0.3 } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(master);
    src.start(t, rnd(0, 1.5), dur + 0.05);
  }

  function tone(t, { type = 'sine', f = 440, f2 = null, dur = 0.3, gain = 0.2, attack = 0.005 } = {}) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /* --- атмосфера проигрывателя: потрескивание, гул и мягкие аккорды --- */
  const CHORDS = [[110, 164.8, 261.6, 392], [87.3, 130.8, 220, 329.6], [98, 146.8, 246.9, 369.9], [82.4, 123.5, 196, 311.1]];
  let chordIdx = 0;

  function playChord() {
    if (!ambienceOn) return;
    const t = ctx.currentTime;
    CHORDS[chordIdx++ % CHORDS.length].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = rnd(-8, 8);
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(flt).connect(g).connect(master);
      o.start(t);
      o.stop(t + 2.7);
    });
    padTimer = setTimeout(playChord, 2300);
  }

  function startAmbience() {
    if (ambienceOn || !enabled || !ctx) return;
    ambienceOn = true;
    humNode = ctx.createOscillator();
    humNode.frequency.value = 50;
    const hg = ctx.createGain();
    hg.gain.value = 0.015;
    humNode.connect(hg).connect(master);
    humNode.start();
    crackleTimer = setInterval(() => {
      if (Math.random() < 0.55) {
        noiseBurst(ctx.currentTime, rnd(0.004, 0.03), { type: 'highpass', f: rnd(2500, 6000), gain: rnd(0.04, 0.16) });
      }
    }, 55);
    playChord();
  }

  function stopAmbience() {
    ambienceOn = false;
    clearInterval(crackleTimer);
    clearTimeout(padTimer);
    if (humNode) {
      try { humNode.stop(); } catch (e) { /* уже остановлен */ }
      humNode = null;
    }
  }

  function emit() { listeners.forEach((fn) => fn(enabled)); }

  return {
    get enabled() { return enabled; },
    onChange(fn) { listeners.push(fn); },

    async enable() {
      const c = ensure();
      if (!c) return false;
      try { await c.resume(); } catch (e) { return false; }
      enabled = true;
      if (ambienceWanted) startAmbience();
      this.tick();
      emit();
      return true;
    },
    disable() {
      enabled = false;
      stopAmbience();
      emit();
    },
    toggle() { return enabled ? this.disable() : this.enable(); },

    /** Фоновая атмосфера нужна только пока играет заставка. */
    ambience(on) {
      ambienceWanted = on;
      if (on) startAmbience(); else stopAmbience();
    },

    tick() {
      if (!enabled) return;
      tone(ctx.currentTime, { f: 1400, f2: 900, dur: 0.05, gain: 0.05 });
    },
    needle() {
      if (!enabled) return;
      const t = ctx.currentTime;
      tone(t, { f: 90, f2: 40, dur: 0.25, gain: 0.3 });
      noiseBurst(t, 0.08, { type: 'highpass', f: 3000, gain: 0.2 });
    },
    scratch() {
      if (!enabled) return;
      const t = ctx.currentTime;
      noiseBurst(t, 0.45, { type: 'bandpass', f: 4200, f2: 300, q: 3, gain: 0.35 });
      tone(t, { type: 'sawtooth', f: 900, f2: 70, dur: 0.45, gain: 0.12 });
    },
    crack() {
      if (!enabled) return;
      const t = ctx.currentTime;
      noiseBurst(t, 0.12, { type: 'bandpass', f: 3500, q: 0.8, gain: 0.5 });
      tone(t, { f: 120, f2: 35, dur: 0.3, gain: 0.5 });
    },
    shatter() {
      if (!enabled) return;
      const t = ctx.currentTime;
      noiseBurst(t, 1.1, { type: 'highpass', f: 1800, f2: 6000, gain: 0.45 });
      tone(t, { f: 70, f2: 28, dur: 0.7, gain: 0.7 });
      for (let i = 0; i < 16; i++) {
        tone(t + rnd(0, 0.7), { f: rnd(1600, 7500), dur: rnd(0.15, 0.5), gain: rnd(0.02, 0.07) });
      }
    },
    swoosh(out = false) {
      if (!enabled) return;
      const t = ctx.currentTime;
      noiseBurst(t, 0.6, { type: 'bandpass', f: out ? 3200 : 260, f2: out ? 260 : 3200, q: 1.2, gain: 0.22 });
    }
  };
})();
