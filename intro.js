/* Заставка: пластинка крутится, игла опускается, пластинка трескается и разлетается на осколки,
   а через «дыру» проявляется сайт. */
window.runIntro = function () {
  return new Promise((resolve) => {
    const body = document.body;
    const intro = document.getElementById('intro');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!intro || reduce) {
      if (intro) intro.remove();
      body.classList.remove('is-intro');
      body.classList.add('ready');
      resolve();
      return;
    }

    const tt = intro.querySelector('.turntable');
    const bg = intro.querySelector('.intro-bg');
    const arm = intro.querySelector('.tonearm');
    const crackSvg = intro.querySelector('.crack');
    const caption = intro.querySelector('.intro-caption');
    const flash = intro.querySelector('.intro-flash');
    const shock = intro.querySelector('.shock');

    const rec = Record.element();
    tt.insertBefore(rec, tt.firstChild);
    const disc = rec.querySelector('.disc');
    const geo = Record.geometry(9);

    Record.crackPaths(geo).forEach((d, i) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.style.setProperty('--i', i);
      crackSvg.appendChild(p);
    });

    let angle = 0, last = performance.now(), t0 = last;
    let cracking = false, broken = false, finished = false;
    let crackAt = 0, raf;
    const rand = (a, b) => a + Math.random() * (b - a);
    const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

    function say(text) {
      caption.classList.remove('swap');
      void caption.offsetWidth;
      caption.textContent = text;
      caption.classList.add('swap');
    }

    function startCrack() {
      if (cracking) return;
      cracking = true;
      crackAt = performance.now();
      intro.classList.add('cracking');
      SFX.scratch();
      setTimeout(SFX.crack, 220);
      arm.classList.add('kick');
      say('Но иногда рамки нужно сломать');
      setTimeout(doBreak, 750);
    }

    function doBreak() {
      if (broken) return;
      broken = true;
      SFX.ambience(false);
      SFX.shatter();

      const r = tt.getBoundingClientRect();
      const S = r.width;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      geo.pieces.forEach((p) => {
        const s = Record.element();
        s.classList.add('shard');
        s.style.clipPath = p.clip;
        s.style.transformOrigin = p.origin;
        s.querySelector('.disc').style.transform = `rotate(${angle}deg)`;
        tt.appendChild(s);
        const dir = p.ang + rand(-0.25, 0.25);
        const dist = rand(0.5, 1.2) * S * (p.tier === 'outer' ? 1.15 : 0.8);
        const dx = Math.cos(dir) * dist, dy = Math.sin(dir) * dist;
        const rot = rand(-260, 260) * (p.tier === 'inner' ? 1.4 : 1);
        s.animate([
          { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1, easing: 'cubic-bezier(.1,.8,.3,1)' },
          { transform: `translate(${dx}px,${dy - S * 0.12}px) rotate(${rot * 0.7}deg) scale(1.04)`, opacity: 1, offset: 0.45, easing: 'cubic-bezier(.5,0,.9,.6)' },
          { transform: `translate(${dx * 1.15}px,${dy + S * 1.6}px) rotate(${rot}deg) scale(.9)`, opacity: 0 }
        ], { duration: rand(1500, 2100), delay: rand(0, 120), fill: 'forwards' });
      });

      rec.style.visibility = 'hidden';
      crackSvg.style.display = 'none';
      tt.classList.add('gone-shadow');
      arm.animate([
        { transform: 'rotate(43deg)', opacity: 1 },
        { transform: 'translate(40px,-60px) rotate(75deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(160px,900px) rotate(200deg)', opacity: 0 }
      ], { duration: 1500, fill: 'forwards', easing: 'ease-in' });

      intro.classList.add('broken');
      intro.style.pointerEvents = 'none';
      flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
      shock.style.left = cx + 'px';
      shock.style.top = cy + 'px';
      shock.animate([
        { transform: 'translate(-50%,-50%) scale(.1)', opacity: 1 },
        { transform: 'translate(-50%,-50%) scale(14)', opacity: 0 }
      ], { duration: 1000, easing: 'cubic-bezier(.1,.7,.2,1)', fill: 'forwards' });
      intro.animate([
        { transform: 'translate(0,0)' }, { transform: 'translate(-14px,9px)' }, { transform: 'translate(12px,-10px)' },
        { transform: 'translate(-8px,-6px)' }, { transform: 'translate(6px,5px)' }, { transform: 'translate(0,0)' }
      ], { duration: 420 });

      // сайт проявляется через расширяющуюся дыру
      bg.style.setProperty('--hx', cx + 'px');
      bg.style.setProperty('--hy', cy + 'px');
      bg.classList.add('breaking');
      const W = innerWidth, H = innerHeight;
      const max = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 120;
      const D = 1300, hs = performance.now();
      (function grow(now) {
        const k = Math.min(1, (now - hs) / D);
        bg.style.setProperty('--hole', (ease(k) * max).toFixed(1));
        if (k < 1) requestAnimationFrame(grow);
      })(hs);

      setTimeout(() => body.classList.add('ready'), 300);
      setTimeout(finish, 2000);
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      SFX.ambience(false);
      intro.remove();
      body.classList.remove('is-intro');
      body.classList.add('ready');
      resolve();
    }

    function skip() {
      if (finished) return;
      cancelAnimationFrame(raf);
      SFX.ambience(false);
      body.classList.add('ready');
      intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished.then(finish);
    }

    /* --- вращение пластинки и дрожание --- */
    function frame(now) {
      const dt = (now - last) / 1000;
      last = now;
      const t = now - t0;
      let speed = 0;
      if (t > 100) speed = 200 * ease((t - 100) / 1200);
      if (t > 3700) speed += 760 * ease((t - 3700) / 1300);
      angle = (angle + speed * dt) % 360;
      disc.style.transform = `rotate(${angle}deg)`;

      let amp = 0;
      if (t > 3700) amp = 1.5 + 4 * ease((t - 3700) / 1200);
      if (cracking) amp = 9;
      if (amp && !broken) {
        const sc = cracking ? 1 + Math.sin((now - crackAt) / 28) * 0.012 : 1;
        rec.style.transform = `translate(${rand(-amp, amp).toFixed(1)}px,${rand(-amp, amp).toFixed(1)}px) scale(${sc})`;
      }
      if (!broken) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* --- сценарий по времени --- */
    const cue = (ms, fn) => setTimeout(() => { if (!finished && !broken) fn(); }, ms);
    cue(150, () => tt.classList.add('show'));
    cue(900, () => { say('Опускаем иглу…'); arm.classList.add('drop'); SFX.needle(); SFX.ambience(true); });
    cue(2100, () => say('Каждый жанр — свой мир'));
    cue(3700, () => say('Музыка не любит рамки'));
    cue(4900, startCrack);

    tt.addEventListener('click', () => { if (performance.now() - t0 > 1500) startCrack(); });
    intro.querySelector('.intro-skip').addEventListener('click', skip);
    intro.querySelector('.intro-sound').addEventListener('click', (e) => {
      SFX.toggle();
      e.currentTarget.blur();
    });
    SFX.onChange((on) => {
      const b = intro.querySelector('.intro-sound');
      if (b) { b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? 'Звук включён' : 'Включить звук'; }
    });
  });
};
