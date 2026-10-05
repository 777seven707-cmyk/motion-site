/* Переходы между страницами. Каждый жанр использует свой эффект (поле fx в data.js).
   Эффект состоит из двух фаз: cover() закрывает экран, reveal() открывает уже новую страницу. */
window.Transition = (function () {
  const fx = document.getElementById('fx');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const EASE = 'cubic-bezier(.77,0,.18,1)';
  const OUT = 'cubic-bezier(.16,1,.3,1)';

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function box(css) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;' + css;
    fx.appendChild(d);
    return d;
  }
  function go(el, kf, o) {
    return el.animate(kf, Object.assign({ fill: 'forwards', easing: EASE }, o)).finished;
  }
  const all = Promise.all.bind(Promise);

  /* Два слоя — тёмный и цветной, цветной чуть отстаёт: получается «след» за волной. */
  function layers(c, css) {
    return [box(css + `background:${c.dark};`), box(css + `background:${c.color};`)];
  }

  const EFFECTS = {
    /* круг расходится из точки клика */
    circle(c) {
      const at = `${c.x}px ${c.y}px`;
      const init = `inset:0;clip-path:circle(0px at ${at});`;
      const [d, p] = layers(c, init);
      return {
        cover: () => all([
          go(d, [{ clipPath: `circle(0px at ${at})` }, { clipPath: `circle(160vmax at ${at})` }], { duration: 760 }),
          go(p, [{ clipPath: `circle(0px at ${at})` }, { clipPath: `circle(160vmax at ${at})` }], { duration: 760, delay: 110 })
        ]),
        reveal: () => all([
          go(p, [{ clipPath: 'circle(160vmax at 50% 50%)' }, { clipPath: 'circle(0px at 50% 50%)' }], { duration: 700 }),
          go(d, [{ clipPath: 'circle(160vmax at 50% 50%)' }, { clipPath: 'circle(0px at 50% 50%)' }], { duration: 700, delay: 110 })
        ])
      };
    },

    /* занавес раздвигается к центру, потом уезжает вверх/вниз */
    curtains(c) {
      const base = 'top:0;height:100%;width:50.5%;box-shadow:0 0 50px rgba(0,0,0,.55);';
      const L = box(base + `left:0;transform:translateX(-101%);background:linear-gradient(90deg,${c.dark},${c.color});`);
      const R = box(base + `right:0;transform:translateX(101%);background:linear-gradient(270deg,${c.dark},${c.color});`);
      return {
        cover: () => all([
          go(L, [{ transform: 'translateX(-101%)' }, { transform: 'translateX(0)' }], { duration: 750 }),
          go(R, [{ transform: 'translateX(101%)' }, { transform: 'translateX(0)' }], { duration: 750 })
        ]),
        reveal: () => all([
          go(L, [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 750 }),
          go(R, [{ transform: 'translateY(0)' }, { transform: 'translateY(101%)' }], { duration: 750 })
        ])
      };
    },

    /* жалюзи */
    blinds(c) {
      const n = 8;
      const strips = Array.from({ length: n }, (_, i) =>
        box(`left:0;width:100%;top:${(i * 100) / n}%;height:calc(${100 / n}% + 1px);transform:scaleX(0);transform-origin:left;background:${i % 2 ? c.color : c.dark};`));
      return {
        cover: () => all(strips.map((s, i) =>
          go(s, [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], { duration: 560, delay: i * 55 }))),
        reveal: () => all(strips.map((s, i) =>
          go(s, [{ transform: 'scaleX(1)', transformOrigin: 'right' }, { transform: 'scaleX(0)', transformOrigin: 'right' }], { duration: 560, delay: (n - 1 - i) * 55 })))
      };
    },

    /* наклонная волна */
    diagonal(c) {
      const css = 'top:0;left:-45%;width:190%;height:100%;transform:translateX(-105%) skewX(-20deg);';
      const [d, p] = layers(c, css);
      return {
        cover: () => all([
          go(d, [{ transform: 'translateX(-105%) skewX(-20deg)' }, { transform: 'translateX(0) skewX(-20deg)' }], { duration: 700 }),
          go(p, [{ transform: 'translateX(-105%) skewX(-20deg)' }, { transform: 'translateX(0) skewX(-20deg)' }], { duration: 700, delay: 130 })
        ]),
        reveal: () => all([
          go(p, [{ transform: 'translateX(0) skewX(-20deg)' }, { transform: 'translateX(105%) skewX(-20deg)' }], { duration: 700 }),
          go(d, [{ transform: 'translateX(0) skewX(-20deg)' }, { transform: 'translateX(105%) skewX(-20deg)' }], { duration: 700, delay: 130 })
        ])
      };
    },

    /* пиксельная мозаика */
    pixels(c) {
      const cols = 14, rows = 8;
      const cells = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const el = box(`left:calc(${(x * 100) / cols}% - .5px);top:calc(${(y * 100) / rows}% - .5px);width:calc(${100 / cols}% + 1px);height:calc(${100 / rows}% + 1px);opacity:0;background:${Math.random() > 0.45 ? c.color : c.dark};`);
          cells.push({ el, k: x + y });
        }
      }
      const max = cols + rows;
      return {
        cover: () => all(cells.map(({ el, k }) =>
          go(el, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, delay: k * 28 + rand(0, 120), easing: 'ease-out' }))),
        reveal: () => all(cells.map(({ el, k }) =>
          go(el, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.2)' }], { duration: 260, delay: (max - k) * 28 + rand(0, 120), easing: 'ease-in' })))
      };
    },

    /* шторка снизу вверх */
    slide(c) {
      const [d, p] = layers(c, 'inset:0;transform:translateY(101%);');
      return {
        cover: () => all([
          go(d, [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }], { duration: 700 }),
          go(p, [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }], { duration: 700, delay: 120 })
        ]),
        reveal: () => all([
          go(p, [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 700 }),
          go(d, [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }], { duration: 700, delay: 120 })
        ])
      };
    },

    /* цифровой сбой */
    glitch(c) {
      const strips = [];
      let y = 0;
      while (y < 100) {
        const h = Math.min(100 - y, rand(5, 16));
        strips.push(box(`left:-10%;width:120%;top:${y}%;height:calc(${h}% + 1px);opacity:0;background:${strips.length % 2 ? c.dark : c.color};`));
        y += h;
      }
      const bgOf = (s) => s.style.backgroundColor;
      return {
        cover: () => all(strips.map((s) => go(s, [
          { opacity: 0, transform: 'translateX(-8%)' },
          { opacity: 1, transform: 'translateX(6%)', backgroundColor: '#ffffff', offset: 0.25 },
          { opacity: 0.4, transform: 'translateX(-4%)', backgroundColor: '#00f0ff', offset: 0.4 },
          { opacity: 1, transform: 'translateX(3%)', backgroundColor: '#ff2bd6', offset: 0.65 },
          { opacity: 1, transform: 'translateX(0)', backgroundColor: bgOf(s) }
        ], { duration: 560, delay: rand(0, 260), easing: 'steps(7,end)' }))),
        reveal: () => all(strips.map((s) => go(s, [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0.3, transform: 'translateX(5%)', backgroundColor: '#ffffff', offset: 0.3 },
          { opacity: 1, transform: 'translateX(-6%)', backgroundColor: '#00f0ff', offset: 0.5 },
          { opacity: 0, transform: 'translateX(8%)' }
        ], { duration: 520, delay: rand(0, 260), easing: 'steps(7,end)' })))
      };
    },

    /* огромная пластинка раскручивается на весь экран */
    spin(c) {
      const disc = box(`left:50%;top:50%;width:170vmax;height:170vmax;margin:-85vmax 0 0 -85vmax;border-radius:50%;transform:scale(0) rotate(0deg);` +
        `background:radial-gradient(circle,#111 0 1.4%,${c.color2} 1.6% 13%,${c.dark} 13.2% 14%,transparent 14.2%),repeating-radial-gradient(circle,${c.dark} 0 4px,${c.color} 4px 8px);`);
      return {
        cover: () => go(disc, [{ transform: 'scale(0) rotate(0deg)' }, { transform: 'scale(1) rotate(320deg)' }], { duration: 850 }),
        reveal: () => go(disc, [{ transform: 'scale(1) rotate(320deg)' }, { transform: 'scale(0) rotate(700deg)' }], { duration: 800 })
      };
    },

    /* зубчатый край */
    teeth(c) {
      const N = 10;
      const right = (x) => {
        const p = [`0% 0%`];
        for (let i = 0; i <= N; i++) p.push(`${x + (i % 2 ? 12 : 0)}% ${(i * 100) / N}%`);
        p.push('0% 100%');
        return `polygon(${p.join(',')})`;
      };
      const left = (x) => {
        const p = ['100% 0%', '100% 100%'];
        for (let i = N; i >= 0; i--) p.push(`${x + (i % 2 ? 12 : 0)}% ${(i * 100) / N}%`);
        return `polygon(${p.join(',')})`;
      };
      const [d, p] = layers(c, `inset:0;clip-path:${right(-15)};`);
      return {
        cover: () => all([
          go(d, [{ clipPath: right(-15) }, { clipPath: right(105) }], { duration: 700 }),
          go(p, [{ clipPath: right(-15) }, { clipPath: right(105) }], { duration: 700, delay: 100 })
        ]),
        reveal: () => {
          d.style.clipPath = p.style.clipPath = left(-15);
          return all([
            go(p, [{ clipPath: left(-15) }, { clipPath: left(105) }], { duration: 700 }),
            go(d, [{ clipPath: left(-15) }, { clipPath: left(105) }], { duration: 700, delay: 100 })
          ]);
        }
      };
    },

    /* 3D-переворот вертикальных панелей */
    flip(c) {
      fx.style.perspective = '1400px';
      const n = 6;
      const cols = Array.from({ length: n }, (_, i) =>
        box(`top:0;height:100%;left:${(i * 100) / n}%;width:calc(${100 / n}% + .5px);transform:rotateY(90deg);backface-visibility:hidden;background:${i % 2 ? c.color : c.dark};`));
      return {
        cover: () => all(cols.map((s, i) => go(s, [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0deg)' }], { duration: 560, delay: i * 70 }))),
        reveal: () => all(cols.map((s, i) => go(s, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-90deg)' }], { duration: 560, delay: i * 70 })))
      };
    },

    /* диафрагма: линия раскрывается по вертикали, закрывается по горизонтали */
    iris(c) {
      const [d, p] = layers(c, 'inset:0;clip-path:inset(50% 0 50% 0);');
      return {
        cover: () => all([
          go(d, [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 750 }),
          go(p, [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 750, delay: 120 })
        ]),
        reveal: () => all([
          go(p, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 50% 0 50%)' }], { duration: 750 }),
          go(d, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 50% 0 50%)' }], { duration: 750, delay: 120 })
        ])
      };
    }
  };

  /**
   * c: { effect, color, color2, label, x, y }
   * hooks: { swap() — меняем страницу, пока экран закрыт; reveal() — экран начинает открываться }
   */
  async function run(c, hooks = {}) {
    fx.replaceChildren();
    fx.style.perspective = '';
    fx.style.pointerEvents = 'auto';
    c.dark = shade(c.color, 0.4);
    const e = (EFFECTS[c.effect] || EFFECTS.circle)(c);

    const label = document.createElement('div');
    label.className = 'fx-label';
    label.textContent = c.label;
    fx.appendChild(label);

    SFX.swoosh();
    await e.cover();
    if (hooks.swap) hooks.swap();
    go(label, [
      { opacity: 0, transform: 'translateY(34px) scale(.92)', letterSpacing: '.25em' },
      { opacity: 1, transform: 'none', letterSpacing: '.01em' }
    ], { duration: 380, easing: OUT });
    await wait(420);
    if (hooks.reveal) hooks.reveal();
    SFX.swoosh(true);
    go(label, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-24px) scale(1.06)' }], { duration: 320 });
    await e.reveal();

    fx.replaceChildren();
    fx.style.perspective = '';
    fx.style.pointerEvents = 'none';
  }

  return { run, effects: Object.keys(EFFECTS) };
})();
