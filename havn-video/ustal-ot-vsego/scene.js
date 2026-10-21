/* HAVN · «Устал от всего?» — 24 s vertical motion piece.
   Ink drawn by hand (boiling 10×/s) + cut-paper collage (12 fps stop-motion
   steps) on one long paper table; the camera glides over it at 60 fps.
   window.renderFrame(t) draws one frame; window.SFX lists the sound cues. */
'use strict';

const W = 1080, H = 1920, DUR = 25.5, NST = 7;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

const PAL = {
  table: '#eee6d6', ink: '#18293b', orange: '#ec6a37', deep: '#0b5a85',
  grey: '#d3d5d2', ice: '#dbeaf3', sand: '#e7d5ae', kraft: '#c9a679', white: '#fbf8f1',
  cream: '#fff1d8', sky: '#cfe6f6', sea1: '#86c0e4', sea2: '#5ea6d6', sea3: '#3f86bb',
  sunO: '#f39150', sunI: '#ffe2b0', water: '#9fd2f0', rule: '#9cc7e3', margin: '#e9a3a0'
};

/* ---------- small helpers ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
function h2(a, b) { return hash((Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)) >>> 0); }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = t => 1 - Math.pow(1 - t, 3);
const eIn = t => t * t * t;
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eSine = t => .5 - .5 * Math.cos(Math.PI * t);
const step12 = t => Math.floor(t * 12 + 1e-6) / 12;
const boilF = t => Math.floor(t * 10 + 1e-6);
const D2R = Math.PI / 180;
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

/* ---------- sound cues (collected while the timeline is declared) ---------- */
const SFX = [];
function cue(type, t, extra) { SFX.push(Object.assign({ type, t: +t.toFixed(4) }, extra || {})); return t; }

/* ---------- fonts ---------- */
const FONT_FILES = [
  ['Unb', 'fonts/unbounded-cyrillic-900-normal.woff2', { weight: '900', unicodeRange: 'U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' }],
  ['Unb', 'fonts/unbounded-latin-900-normal.woff2', { weight: '900', unicodeRange: 'U+0000-00FF,U+2000-206F,U+2190-21FF' }],
  ['Cav', 'fonts/caveat-cyrillic-700-normal.woff2', { weight: '700', unicodeRange: 'U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' }],
  ['Cav', 'fonts/caveat-latin-700-normal.woff2', { weight: '700', unicodeRange: 'U+0000-00FF,U+2000-206F' }],
  ['Corm', 'fonts/cormorantgaramond-cyrillic.woff2', { style: 'italic', weight: '400 600', unicodeRange: 'U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' }],
  ['Corm', 'fonts/cormorantgaramond-latin.woff2', { style: 'italic', weight: '400 600', unicodeRange: 'U+0000-00FF,U+2000-206F' }],
  ['Inter', 'fonts/inter-cyrillic.woff2', { weight: '200 600', unicodeRange: 'U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' }],
  ['Inter', 'fonts/inter-latin.woff2', { weight: '200 600', unicodeRange: 'U+0000-00FF,U+2000-206F,U+2190-21FF' }]
];
async function loadFonts() {
  for (const [fam, url, d] of FONT_FILES) { const f = new FontFace(fam, `url(${url})`, d); await f.load(); document.fonts.add(f); }
  await document.fonts.ready;
}

/* ---------- paper texture (tileable) ---------- */
let TEX, GRAIN = [];
function makeTex(size, seed) {
  const c = mk(size, size), x = c.getContext('2d'), r = mulberry32(seed);
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  const wrap = (fn) => { for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
  for (let i = 0; i < 260; i++) {
    const gx = r() * size, gy = r() * size, rad = 30 + r() * 170, l = r() < .5;
    wrap(() => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, rad); g.addColorStop(0, l ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(128,128,128,0)'); x.fillStyle = g; x.fillRect(gx - rad, gy - rad, rad * 2, rad * 2); });
  }
  x.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const light = r() < .55, al = light ? .07 + r() * .1 : .05 + r() * .07, lw = .5 + r() * 1.3;
    const sx = r() * size, sy = r() * size, a = r() * Math.PI * 2, L = 5 + r() * 30, bend = (r() - .5) * 1.2;
    wrap(() => { x.strokeStyle = light ? `rgba(255,255,255,${al})` : `rgba(0,0,0,${al})`; x.lineWidth = lw; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a + bend) * L * .5, sy + Math.sin(a + bend) * L * .5, sx + Math.cos(a) * L, sy + Math.sin(a) * L); x.stroke(); });
  }
  const id = x.getImageData(0, 0, size, size), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 30; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(id, 0, 0);
  return c;
}
function makeGrain(seed) {
  const c = mk(540, 960), x = c.getContext('2d'), r = mulberry32(seed);
  const id = x.createImageData(540, 960), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - .5) * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  x.putImageData(id, 0, 0); return c;
}

/* ---------- sprites: paper pieces with texture and baked shadows ---------- */
const PAD = 56;
function shadowOf(c, b) {
  const s = mk(c.width, c.height), x = s.getContext('2d');
  x.filter = `blur(${b}px)`; x.drawImage(c, 0, 0); x.filter = 'none';
  x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgb(52,40,28)'; x.fillRect(0, 0, s.width, s.height);
  return s;
}
function texturize(c, k = 1, seed = 1) {
  const x = c.getContext('2d'), m = mk(c.width, c.height); m.getContext('2d').drawImage(c, 0, 0);
  const r = mulberry32(seed);
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = .7 * k;
  x.translate(-r() * 1024, -r() * 1024); x.fillStyle = x.createPattern(TEX, 'repeat'); x.fillRect(0, 0, c.width + 1024, c.height + 1024); x.restore();
  x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-over';
}
function sprite(c) { return { c, s1: shadowOf(c, 4), s2: shadowOf(c, 20), w: c.width, h: c.height }; }
function blurred(sp, b) { const c = mk(sp.w, sp.h), x = c.getContext('2d'); x.filter = `blur(${b}px)`; x.drawImage(sp.c, 0, 0); return { c, s1: shadowOf(c, 8), s2: shadowOf(c, 26), w: sp.w, h: sp.h }; }
function polyPath(x, pts) { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
function roughRect(w, h, seed, j = .035) {
  const r = mulberry32(seed), jj = Math.min(w, h) * j;
  const C = [[0, 0], [w, 0], [w, h], [0, h]].map(p => [p[0] + (r() - .5) * 2 * jj, p[1] + (r() - .5) * 2 * jj]);
  const pts = [];
  for (let e = 0; e < 4; e++) {
    const a = C[e], b = C[(e + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len / 70));
    const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    for (let i = 0; i < n; i++) { const u = i / n, o = i ? (r() - .5) * 3.2 : 0; pts.push([lerp(a[0], b[0], u) + nx * o, lerp(a[1], b[1], u) + ny * o]); }
  }
  return pts;
}
/* a paper card; content(x, cx, cy) prints on it before the texture goes on */
function card(w, h, o = {}) {
  const c = mk(w + PAD * 2, h + PAD * 2), x = c.getContext('2d'), seed = o.seed || 1;
  const pts = (o.shape || roughRect(w, h, seed, o.jit)).map(p => [p[0] + PAD, p[1] + PAD]);
  if (o.torn) {
    const cx = PAD + w / 2, cy = PAD + h / 2, gx = 1 + 9 / w, gy = 1 + 9 / h;
    x.filter = 'url(#torn)'; x.fillStyle = o.rim || PAL.white; polyPath(x, pts.map(p => [cx + (p[0] - cx) * gx, cy + (p[1] - cy) * gy])); x.fill();
  }
  x.filter = o.torn ? 'url(#torn)' : 'url(#cut)'; x.fillStyle = o.color || PAL.white; polyPath(x, pts); x.fill(); x.filter = 'none';
  if (o.content) { x.save(); polyPath(x, pts); x.clip(); o.content(x, PAD + w / 2, PAD + h / 2); x.restore(); }
  texturize(c, o.tex == null ? 1 : o.tex, seed * 7 + 3);
  return sprite(c);
}
/* cut-paper letters, one sprite each so they can land one by one */
function cutWord(str, size, color, o = {}) {
  const font = o.font || `900 ${size}px Unb`;
  const m = mk(10, 10).getContext('2d'); m.font = font;
  const total = m.measureText(str).width + (str.length - 1) * (o.track || 0);
  const letters = []; let acc = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], cw = m.measureText(ch).width;
    if (ch !== ' ') {
      const c = mk(cw + PAD * 2, size * 1.45 + PAD * 2), x = c.getContext('2d');
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.filter = 'url(#cut)'; x.fillStyle = color; x.fillText(ch, c.width / 2, c.height / 2 + size * .04); x.filter = 'none';
      texturize(c, .9, (o.seed || 5) * 31 + i);
      letters.push({ sp: sprite(c), dx: acc + cw / 2 - total / 2, i });
    }
    acc += cw + (o.track || 0);
  }
  return { letters, width: total };
}
/* handwritten ink text: three boil variants with ghost double line and small gaps */
function inkText(str, size, color, o = {}) {
  const font = `700 ${size}px Cav`;
  const m = mk(10, 10).getContext('2d'); m.font = font; const tw = m.measureText(str).width;
  const vars = [0, 1, 2].map(k => {
    const c = mk(tw + PAD * 2, size * 1.7 + PAD * 2), x = c.getContext('2d'), r = mulberry32((o.seed || 3) * 13 + k);
    x.font = font; x.textBaseline = 'middle'; x.fillStyle = color;
    x.filter = `url(#ink${k})`;
    x.globalAlpha = .28; x.fillText(str, PAD + 2.4, c.height / 2 + 1.8);
    x.globalAlpha = 1; x.fillText(str, PAD, c.height / 2);
    x.filter = 'none';
    x.globalCompositeOperation = 'destination-out'; x.lineCap = 'round';
    const n = Math.round(tw / 70);
    for (let g = 0; g < n; g++) { const gx = PAD + r() * tw, gy = c.height / 2 + (r() - .5) * size * .6, a = r() * Math.PI; x.lineWidth = 1.6 + r() * 1.6; x.beginPath(); x.moveTo(gx - Math.cos(a) * 6, gy - Math.sin(a) * 6); x.lineTo(gx + Math.cos(a) * 6, gy + Math.sin(a) * 6); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    return c;
  });
  return { vars, tw, w: vars[0].width, h: vars[0].height };
}

/* ---------- camera ---------- */
const S1 = [540, 960], S2 = [800, 3010], S3 = [360, 5110], S5 = [780, 7260], S6 = [780, 7400], S7 = [580, 9660];
const CAMK = [
  [0.00, 540, 920, 1.10, -2.4],
  [2.20, 546, 975, 1.02, 1.2],
  [2.72, 792, 2962, 1.04, -0.8],
  [4.70, 812, 3046, 1.10, 1.0],
  [5.18, 364, 5004, 1.00, -1.2],
  [8.70, 360, 4975, 1.07, 0.8],
  [9.40, 358, 4985, 1.10, 0.5],
  [10.05, 774, 7212, 1.00, -1.0],
  [14.70, 790, 7250, 1.05, 0.9],
  [15.40, 780, 7398, 1.12, -0.3],
  [18.40, 780, 7384, 1.13, -1.0],
  [19.05, 580, 9600, 1.00, 1.0],
  [25.50, 580, 9645, 1.08, -0.2]
];
/* monotone Hermite: velocity is continuous, a fast move never overshoots the slow drift around it */
const CAMM = (() => {
  const M = CAMK.map(() => [0, 0, 0, 0]);
  for (let c = 1; c <= 4; c++) {
    for (let i = 0; i < CAMK.length; i++) {
      const s = (a, b) => (CAMK[b][c] - CAMK[a][c]) / (CAMK[b][0] - CAMK[a][0]);
      if (i === 0) M[i][c - 1] = s(0, 1);
      else if (i === CAMK.length - 1) M[i][c - 1] = s(i - 1, i);
      else { const d0 = s(i - 1, i), d1 = s(i, i + 1); M[i][c - 1] = d0 * d1 <= 0 ? 0 : (Math.abs(d0) < Math.abs(d1) ? d0 : d1); }
    }
  }
  return M;
})();
function camAt(t) {
  t = clamp(t, 0, DUR);
  let i = 0; while (i < CAMK.length - 2 && t > CAMK[i + 1][0]) i++;
  const a = CAMK[i], b = CAMK[i + 1], dt = b[0] - a[0], u = clamp((t - a[0]) / dt);
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = [1, 2, 3, 4].map(c => h00 * a[c] + h10 * dt * CAMM[i][c - 1] + h01 * b[c] + h11 * dt * CAMM[i + 1][c - 1]);
  // breathing handheld drift + the knock when СТОП lands
  const sk = t > T.stop ? Math.exp(-(t - T.stop) * 8) * Math.sin((t - T.stop) * 2 * Math.PI * 15) : 0;
  return {
    x: v[0] + 5 * Math.sin(t * .83) + 2.5 * Math.sin(t * 2.1 + 1) + sk * 16,
    y: v[1] + 4 * Math.sin(t * .67 + 2) + 2 * Math.sin(t * 1.9) + sk * 10,
    z: v[2] * (1 + .006 * Math.sin(t * .9)) * (1 + sk * .012),
    r: (v[3] + .25 * Math.sin(t * .6) + sk * .6) * D2R
  };
}

/* ---------- drawing in world space ---------- */
let CAM;
function layer(h) { const s = CAM.z / (1 - h); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, H / 2); ctx.rotate(CAM.r); ctx.scale(s, s); ctx.translate(-CAM.x, -CAM.y); return s; }
/* sprite with its soft shadow: lift raises it off the table (bigger, softer, further shadow) */
function drawSp(sp, x, y, o = {}) {
  const h = o.h || 0, lift = o.lift || 0, rot = o.rot || 0, sc = (o.sc == null ? 1 : o.sc) * (1 + lift * .2), al = o.alpha == null ? 1 : o.alpha;
  if (al <= 0) return;
  const ls = layer(h);
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  if (o.shadow !== false) {
    const elev = (o.elev == null ? 5 : o.elev) + lift * 46;
    const tot = ls * sc, ang = CAM.r + rot;
    const sx = elev * .55, sy = elev * 1.0;
    const lx = (Math.cos(-ang) * sx - Math.sin(-ang) * sy) / tot, ly = (Math.sin(-ang) * sx + Math.cos(-ang) * sy) / tot;
    const mix = clamp(lift * 1.6 + (o.soft || 0));
    ctx.globalAlpha = al * (.42 - lift * .14) * (1 - mix); ctx.drawImage(sp.s1, -sp.w / 2 + lx, -sp.h / 2 + ly);
    ctx.globalAlpha = al * (.42 - lift * .14) * mix; ctx.drawImage(sp.s2, -sp.w / 2 + lx * 1.3, -sp.h / 2 + ly * 1.3);
  }
  ctx.globalAlpha = al; ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2); ctx.globalAlpha = 1;
}
/* ink text written on by the pen: p is how much of the line is already there */
function drawInk(it, x, y, o = {}) {
  const p = o.p == null ? 1 : o.p; if (p <= 0) return;
  const t = o.t, bf = boilF(t), k = (bf + (o.seed || 0)) % 3, img = it.vars[k];
  layer(o.h || 0);
  const jx = (h2(bf, 7 + (o.seed || 0)) - .5) * 1.6, jy = (h2(bf, 9 + (o.seed || 0)) - .5) * 1.6, jr = (h2(bf, 11) - .5) * .004;
  ctx.translate(x, y); ctx.rotate((o.rot || 0) + jr); ctx.scale(o.sc || 1, o.sc || 1);
  const left = o.align === 'left' ? 0 : -it.tw / 2;
  ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.save(); ctx.beginPath(); const rx = left - 24 + (it.tw + 48) * p; ctx.rect(left - PAD, -it.h / 2, rx - left + PAD, it.h); ctx.clip();
  ctx.drawImage(img, left - PAD + jx, -it.h / 2 + jy); ctx.restore();
  if (p < 1) { ctx.fillStyle = o.color || PAL.ink; ctx.beginPath(); ctx.arc(rx - 18, (h2(Math.floor(t * 60), 3) - .5) * it.h * .25, 5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
/* hand-drawn ink line: boiling points, a pen that draws it on, small gaps and a ghost second line */
function inkLine(pts, o) {
  const t = o.t, bf = boilF(t), seed = o.seed || 1, amp = o.amp == null ? 1.8 : o.amp, p = o.p == null ? 1 : o.p;
  if (p <= 0) return;
  layer(o.h || 0);
  if (o.tf) o.tf();
  const J = pts.map((q, i) => [q[0] + (h2(seed * 97 + i, bf) - .5) * 2 * amp, q[1] + (h2(seed * 131 + i, bf + 500) - .5) * 2 * amp]);
  const L = [0]; for (let i = 1; i < J.length; i++) L.push(L[i - 1] + Math.hypot(J[i][0] - J[i - 1][0], J[i][1] - J[i - 1][1]));
  const total = L[L.length - 1], end = total * p;
  const gaps = o.gaps === false ? [] : [.18 + h2(seed, 1) * .2, .55 + h2(seed, 2) * .25].map(g => [g * total, g * total + 5 + h2(seed, 3) * 6]);
  ctx.strokeStyle = o.color || PAL.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pass = (w, ox, oy, a0, a1, alpha) => {
    ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.beginPath(); let pen = false;
    for (let i = 0; i < J.length; i++) {
      const l = L[i]; if (l > end || l > a1) break;
      const inGap = l < a0 || gaps.some(g => l > g[0] && l < g[1]);
      if (inGap) { pen = false; continue; }
      const px = J[i][0] + ox, py = J[i][1] + oy;
      if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };
  const w = o.w || 5;
  pass(w, 0, 0, 0, total, o.alpha == null ? 1 : o.alpha);
  if (o.dbl !== false) pass(w * .45, 2.6, 2.2, total * (.15 + h2(seed, 4) * .2), total * (.55 + h2(seed, 5) * .3), .55 * (o.alpha == null ? 1 : o.alpha));
  if (p < 1 && end > 0) { let i = 0; while (i < L.length - 1 && L[i + 1] < end) i++; ctx.globalAlpha = 1; ctx.fillStyle = o.color || PAL.ink; ctx.beginPath(); ctx.arc(J[i][0], J[i][1], w * .9, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
/* shape builders (dense points so the boil can wobble them) */
function seg(a, b, step = 9) { const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); const r = []; for (let i = 0; i <= n; i++) r.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); return r; }
function chain(...ps) { let r = []; for (let i = 0; i < ps.length - 1; i++) r = r.concat(seg(ps[i], ps[i + 1]).slice(i ? 1 : 0)); return r; }
function arc(cx, cy, rx, ry, a0, a1, n) { const r = []; n = n || Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 8); for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); r.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return r; }
function wavy(x0, x1, y, amp, freq, seed) { const r = []; for (let x = x0; x <= x1; x += 8) r.push([x, y + Math.sin(x * freq + seed) * amp + (h2(seed, x) - .5) * 3]); return r; }
/* Catmull-Rom through the points: turns a jagged scribble into a pen loop */
function smooth(P, sub) { const r = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]; for (let k = 0; k < sub; k++) { const u = k / sub, u2 = u * u, u3 = u2 * u; r.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3))); } } r.push(P[P.length - 1]); return r; }
function scribble(cx, cy, w, h, n, seed) { const r = []; const R = mulberry32(seed); let a = 0; for (let i = 0; i < n; i++) { a += .45 + R() * .5; const rr = .55 + R() * .45; r.push([cx + Math.cos(a) * w * rr, cy + Math.sin(a * 1.13) * h * rr]); } return r; }

/* ---------- timeline ---------- */
const T = {
  ustal: 0.12, otVsego: [0.75, 1.45],
  etoNe: [2.62, 3.0], len: 2.75, lenStrike: [3.18, 3.42], iNe: [3.58, 3.86], slab: 3.7, slabStrike: [4.12, 4.42],
  fig: [5.0, 5.45], stack0: 5.15, stackStep: 0.3125, slishkom: [5.35, 5.8], vse: 5.92, derzh: 6.5,
  stop: 8.78, stopOut: 9.45,
  sheet: 9.95, items: 10.2, segodnya: [10.32, 10.8], menshe: 11.25, mensheShrink: [11.75, 12.1], strikes: 12.2, strikeStep: 0.3, vinit: 13.3, underline: [14.2, 14.55], s5out: 14.9,
  glass: [15.0, 15.75], odno: 15.3, malenkoe: [15.6, 16.1], water: 15.9, uzhe: [16.55, 16.78], dost: 16.8, check: [17.5, 17.75],
  horizon: [19.1, 19.6], sun: [19.0, 20.6], rays: [20.45, 20.95], refl: [20.65, 21.05], havn: 20.7, tihoe: 21.3, sohrani: 21.9, sohraniW: [22.05, 22.65], link: 22.7
};

/* ---------- assets ---------- */
const A = {};
function printed(text, font, color, dy = 0) { return (x, cx, cy) => { x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(text, cx, cy + dy); }; }
function label(text, font, o = {}) {
  const m = mk(10, 10).getContext('2d'); m.font = font; const w = m.measureText(text).width + 90;
  return card(w, o.h || 130, Object.assign({ torn: true, color: PAL.cream, content: printed(text, font, o.ink || PAL.ink, o.dy == null ? -4 : o.dy) }, o));
}
function scrapFor(text, seed, color, size = 44) {
  const m = mk(10, 10).getContext('2d'); m.font = `600 ${size}px Inter`; const w = m.measureText(text).width + 70;
  return card(w, size * 1.9, { seed, color, torn: h2(seed, 1) < .45, content: printed(text, `600 ${size}px Inter`, PAL.ink, 2) });
}
function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');

  // S1 noise
  const noise = ['надо', 'срочно', 'ответь', 'дедлайн', 'ещё чуть-чуть', '37 непрочитанных', 'почему ты не', 'успей', 'должен', 'перезвони', 'ок?', 'завтра в 8', 'не забудь', '!!!', 'опять', 'когда?', 'ты обещал', '+5 задач'];
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];
  const R = mulberry32(42);
  const spots = [[-360, -620], [-60, -700], [300, -640], [-420, -420], [420, -430], [-150, -500], [180, -470], [-430, 260], [380, 250], [-200, 330], [140, 380], [-380, 470], [330, 500], [-60, 520], [440, -240], [-450, -230], [60, 650], [-300, 640]];
  A.noise = noise.map((txt, i) => ({ sp: scrapFor(txt, 100 + i, cols[i % cols.length], 40 + R() * 10), x: S1[0] + spots[i][0] + (R() - .5) * 40, y: S1[1] + spots[i][1] + (R() - .5) * 40, rot: (R() - .5) * 0.5, h: R() * .05, ph: R() * 10 }));
  A.noiseFg = [blurred(scrapFor('срочно!!', 201, PAL.white, 60), 9), blurred(scrapFor('надо', 202, PAL.sand, 64), 9)];
  A.ustal = cutWord('УСТАЛ', 158, PAL.orange, { seed: 1 });
  A.otVsego = inkText('от всего?', 140, PAL.ink, { seed: 2 });

  // S2
  A.etoNe1 = inkText('это', 124, PAL.ink, { seed: 4 });
  A.etoNe2 = inkText('НЕ', 124, PAL.orange, { seed: 5 });
  A.lenCard = card(600, 230, { seed: 21, color: PAL.grey, content: printed('ЛЕНЬ', '900 150px Unb', PAL.ink, 8) });
  A.iNe = inkText('и не', 110, PAL.ink, { seed: 6 });
  A.slabCard = card(880, 190, { seed: 22, color: PAL.white, torn: true, rim: '#f6f1e6', content: printed('СЛАБОСТЬ', '900 108px Unb', PAL.ink, 6) });

  // S3
  const stackW = ['работа', 'учёба', 'сообщения', 'чужие ожидания', 'дедлайн', '«всё сам»', 'ещё чуть-чуть'];
  A.stack = stackW.map((w, i) => ({ sp: scrapFor(w, 300 + i, cols[(i + 2) % cols.length], 40), ox: (h2(i, 77) - .5) * 60, rot: (h2(i, 78) - .5) * .14 }));
  A.slishkom = inkText('слишком долго', 108, PAL.ink, { seed: 8 });
  A.vse = cutWord('ВСЁ', 250, PAL.orange, { seed: 9 });
  A.derzh = label('держалось на тебе', 'italic 600 100px Corm', { seed: 31 });
  A.fgBlur3 = blurred(scrapFor('ещё одно', 330, PAL.ice, 66), 10);

  // S4
  A.stopStrip = card(860, 300, { seed: 41, color: PAL.white, torn: true, rim: '#fffdf8' });
  A.stop = cutWord('СТОП', 176, PAL.orange, { seed: 11 });

  // S5
  A.sheet = card(760, 880, {
    seed: 51, color: '#fdfcf7', torn: true, tex: .8, content: (x, cx, cy) => {
      x.strokeStyle = PAL.rule; x.lineWidth = 2.2; for (let y = -380; y < 440; y += 62) { x.beginPath(); x.moveTo(cx - 380, cy + y); x.lineTo(cx + 380, cy + y); x.stroke(); }
      x.strokeStyle = PAL.margin; x.lineWidth = 2.6; x.beginPath(); x.moveTo(cx - 300, cy - 440); x.lineTo(cx - 300, cy + 440); x.stroke();
    }
  });
  A.items = ['разобрать почту', 'ответить всем', 'доделать отчёт', 'убраться', 'выпить воды'].map((s, i) => inkText(s, 74, PAL.ink, { seed: 60 + i }));
  A.segodnya = inkText('сегодня можно', 112, PAL.ink, { seed: 12 });
  A.menshe = cutWord('МЕНЬШЕ', 160, PAL.orange, { seed: 13 });
  A.vinit = label('и не винить себя', 'italic 600 108px Corm', { seed: 52, h: 140 });
  A.fgBlur5 = blurred(card(260, 70, { seed: 53, color: PAL.kraft }), 12);

  // S6
  A.odno = cutWord('ОДНО', 176, PAL.deep, { seed: 14 });
  A.malenkoe = inkText('маленькое дело', 98, PAL.ink, { seed: 15 });
  A.uzhe = inkText('— уже', 84, PAL.ink, { seed: 16 });
  A.dost = cutWord('ДОСТАТОЧНО', 78, PAL.orange, { seed: 17 });
  A.water = [0, 1, 2, 3].map(i => {
    const yb = 130 - i * 82, yt = yb - 92, wAt = y => lerp(250, 330, (130 - y) / 450) - 22;
    const shape = [[-wAt(yt) / 2, 0], [wAt(yt) / 2, 0], [wAt(yb) / 2, yb - yt], [-wAt(yb) / 2, yb - yt]].map(p => [p[0] + wAt(yt) / 2, p[1]]);
    return { sp: card(wAt(yt), yb - yt, { seed: 70 + i, color: ['#a9d8f3', '#94cdef', '#7fc0e8', '#b9e0f6'][i], torn: i === 3, shape }), y: (yb + yt) / 2 };
  });

  // S7
  A.sky = card(1600, 1520, { seed: 81, color: PAL.sky, torn: true, rim: '#eef7fd', tex: .7 });
  A.sunO = card(440, 440, { seed: 82, color: PAL.sunO, shape: arc(220, 220, 220, 220, 0, Math.PI * 2, 90) });
  A.sunI = card(300, 300, { seed: 83, color: PAL.sunI, shape: arc(150, 150, 150, 150, 0, Math.PI * 2, 70) });
  A.sea = [PAL.sea1, PAL.sea2, PAL.sea3].map((c, i) => card(1700, 900, { seed: 90 + i, color: c, torn: true, rim: '#e9f5fc', tex: .8 }));
  const cloud = (seed, w) => { const pts = []; const n = 5; for (let i = 0; i <= 60; i++) { const a = Math.PI + Math.PI * i / 60; const bump = 1 + .22 * Math.abs(Math.sin(a * n / 2 + seed)); pts.push([w / 2 + Math.cos(a) * w / 2 * bump * .9, w * .32 + Math.sin(a) * w * .3 * bump]); } return card(w, w * .4, { seed, color: '#fbfdff', torn: true, shape: pts, rim: '#ffffff', tex: .6 }); };
  A.cloud1 = cloud(101, 420); A.cloud2 = cloud(102, 320); A.cloudFg = blurred(cloud(103, 520), 12);
  A.havn = cutWord('HAVN', 190, PAL.deep, { seed: 18, track: 10 });
  A.tihoe = label('тихое место, когда тяжело', 'italic 600 72px Corm', { seed: 84, h: 110, dy: -3 });
  A.sohrani = card(780, 108, { seed: 85, color: PAL.white, torn: true });
  A.sohraniT = inkText('сохрани на день, когда нет сил', 64, PAL.ink, { seed: 19 });
  A.link = card(520, 86, { seed: 86, color: PAL.deep, content: printed('ссылка в профиле ↓', '600 44px Inter', '#ffffff', 2) });

  // filler on the table between scenes, seen during the fast moves
  const DR = mulberry32(7);
  A.decor = [];
  const between = [[S1, S2], [S2, S3], [S3, S5], [S6, S7]];
  between.forEach(([a, b], bi) => {
    for (let i = 0; i < 9; i++) {
      const u = .25 + DR() * .5, side = DR() < .5 ? -1 : 1;
      A.decor.push({ sp: card(120 + DR() * 200, 50 + DR() * 90, { seed: 500 + bi * 20 + i, color: cols[Math.floor(DR() * cols.length)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + side * (100 + DR() * 380), y: lerp(a[1], b[1], u) + (DR() - .5) * 300, rot: (DR() - .5) * .8, h: DR() * .06 });
    }
  });
  A.doodles = between.map(([a, b], bi) => ({ pts: smooth(scribble(lerp(a[0], b[0], .5) + (bi % 2 ? 220 : -220), lerp(a[1], b[1], .5), 120, 70, 26, 900 + bi), 6), seed: 900 + bi }));
}

/* ---------- animation pieces ---------- */
// stop-motion drop: appears high and big, lands in a couple of 12 fps steps, then rests
function drop(t, t0) { const tq = step12(t); if (tq < t0 - 1e-6) return null; const k = Math.round((tq - t0) * 12); const seq = [1, .42, .1, 0]; return { lift: k < seq.length ? seq[k] : 0, k }; }
// stop-motion slide between two points
function slide(t, t0, dur, ease) { const tq = step12(t); return (ease || eOut)(prog(tq, t0, t0 + dur)); }
function jit(id, t, amt) { const f = Math.floor(t * 12); return [(h2(id, f) - .5) * 2 * amt, (h2(id + 55, f) - .5) * 2 * amt, (h2(id + 99, f) - .5) * amt * .02]; }
function word(wd, cx, cy, t, t0, o = {}) {
  wd.letters.forEach((L, j) => {
    const d = drop(t, t0 + j * (o.stagger == null ? 1 / 12 : o.stagger)); if (!d) return;
    const r0 = (h2(j, (o.seed || 1) * 7) - .5) * (o.tilt == null ? .08 : o.tilt);
    const rx = d.lift ? (h2(j, 33 + d.k) - .5) * .5 * d.lift : 0;
    drawSp(L.sp, cx + L.dx * (o.sc || 1) + (o.dx || 0), cy - d.lift * 60 + (o.dy || 0), { h: o.h || .03, lift: d.lift, rot: r0 + rx + (o.rot || 0), sc: o.sc || 1, alpha: o.alpha });
  });
}

/* ---------- scenes ---------- */
function sceneTable() {
  layer(0);
  const r = 2600; ctx.fillStyle = PAL.table; ctx.fillRect(CAM.x - r, CAM.y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .9; ctx.fillStyle = A.tablePat; ctx.fillRect(CAM.x - r, CAM.y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
function sceneDecor(t) {
  A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); });
  A.doodles.forEach(d => { if (Math.abs(d.pts[0][1] - CAM.y) < 1500) inkLine(d.pts, { t, seed: d.seed, w: 3, alpha: .5 }); });
}
function scene1(t) {
  const [cx, cy] = S1;
  // the tangle behind the word: a mind that does not switch off
  inkLine(smooth(scribble(cx - 20, cy - 40, 420, 170, 40, 4), 7), { t, seed: 4, w: 3.2, p: eOut(prog(t, 0, 1.1)), alpha: .55 });
  A.noise.forEach((n, i) => {
    const j = jit(i + 10, t, 3.5);
    const settle = t > 2.0 ? .5 : 1;
    drawSp(n.sp, n.x + j[0] * settle, n.y + j[1] * settle, { h: n.h, rot: n.rot + j[2] * 4 * settle });
  });
  word(A.ustal, cx, cy - 70, t, T.ustal, { h: .05, seed: 1 });
  drawInk(A.otVsego, cx + 20, cy + 120, { t, p: prog(t, T.otVsego[0], T.otVsego[1]), h: .02, rot: -.03, seed: 1 });
  // out-of-focus scraps right in front of the lens
  drawSp(A.noiseFg[0], cx - 430 + t * 18, cy + 780, { h: .38, rot: .3, soft: 1, elev: 30 });
  drawSp(A.noiseFg[1], cx + 470 - t * 14, cy - 820, { h: .42, rot: -.4, soft: 1, elev: 30 });
}
function scene2(t) {
  const [cx, cy] = S2;
  drawInk(A.etoNe1, cx - 95, cy - 330, { t, p: prog(t, T.etoNe[0], T.etoNe[0] + .22), h: .02, rot: -.04, seed: 2 });
  drawInk(A.etoNe2, cx + 110, cy - 336, { t, p: prog(t, T.etoNe[0] + .22, T.etoNe[1]), h: .02, rot: -.04, seed: 3 });
  const a = slide(t, T.len, .25);
  if (step12(t) >= T.len) drawSp(A.lenCard, cx + (1 - a) * 760, cy - 110, { h: .03, lift: (1 - a) * .6, rot: -.05 + (1 - a) * .2 });
  inkLine(chain([cx - 250, cy - 70], [cx + 40, cy - 150], [cx + 260, cy - 125]), { t, seed: 21, w: 11, p: eOut(prog(t, T.lenStrike[0], T.lenStrike[0] + .14)), h: .035 });
  inkLine(chain([cx - 240, cy - 160], [cx + 250, cy - 60]), { t, seed: 22, w: 9, p: eOut(prog(t, T.lenStrike[0] + .1, T.lenStrike[1])), h: .035 });
  drawInk(A.iNe, cx - 10, cy + 120, { t, p: prog(t, T.iNe[0], T.iNe[1]), h: .02, rot: .03, seed: 4 });
  const b = slide(t, T.slab, .25);
  if (step12(t) >= T.slab) drawSp(A.slabCard, cx - (1 - b) * 900, cy + 320, { h: .04, lift: (1 - b) * .6, rot: .04 - (1 - b) * .2 });
  inkLine(chain([cx - 420, cy + 340], [cx - 60, cy + 280], [cx + 420, cy + 300]), { t, seed: 23, w: 11, p: eOut(prog(t, T.slabStrike[0], T.slabStrike[0] + .16)), h: .045 });
  inkLine(chain([cx - 400, cy + 270], [cx + 410, cy + 360]), { t, seed: 24, w: 8, p: eOut(prog(t, T.slabStrike[0] + .12, T.slabStrike[1])), h: .045 });
}
function stackState(t) {
  const tf = Math.min(t, T.stop);
  let count = 0; for (let i = 0; i < NST; i++) if (step12(tf) >= T.stack0 + i * T.stackStep) count++;
  return { tf, count, bend: count / NST };
}
function scene3(t) {
  const [cx, cy] = S3;
  const st = stackState(t), tf = st.tf;
  const out = slide(t, T.stopOut, .5, eIn);
  const ox = -1350 * out;
  // the figure, drawn in ink, knees giving in as the pile grows
  const feetY = cy + 600, b = eOut(st.bend), sag = 26 * b;
  const fp = prog(t, T.fig[0], T.fig[1]);
  const FS = 1.08, F = (x, y) => [cx + ox + x * FS, feetY + y * FS];
  const hipY = -150 + sag, shY = -270 + sag, handY = -385 + sag;
  const fig = [
    arc(cx + ox, feetY + (-325 + sag) * FS, 40, 45, -Math.PI / 2, Math.PI * 1.5, 30),
    chain(F(0, -290 + sag), F(4 * b, shY + 30), F(6 * b, hipY)),
    chain(F(6 * b, hipY), F(-36 - 30 * b, -75 + sag * .5), F(-44, 0)),
    chain(F(6 * b, hipY), F(40 + 30 * b, -75 + sag * .5), F(46, 0)),
    chain(F(0, shY + 18), F(-84, shY - 40), F(-72, handY)),
    chain(F(0, shY + 18), F(86, shY - 40), F(74, handY)),
    chain(F(-70, 0), F(-26, 0)), chain(F(28, 0), F(72, 0))
  ];
  fig.forEach((pts, i) => inkLine(pts, { t: tf, seed: 40 + i, w: 7, p: clamp(fp * 1.6 - i * .08), h: .02 }));
  if (st.count >= 5) [[-70, -330], [64, -350], [-60, -290]].forEach((q, i) => inkLine(chain(F(q[0] * 1.45, q[1] + sag), F(q[0] * 1.75, q[1] - 14 + sag)), { t: tf, seed: 60 + i, w: 3.5, h: .02, dbl: false }));
  // the pile: cards land on the hands, the whole thing sways more with every one
  const baseY = feetY + handY * FS - 8;
  const sway = Math.sin(step12(tf) * 2 * Math.PI * 1.25) * .011 * st.count / NST * (t < T.stop ? 1 : 0) + .004 * st.count / NST;
  for (let i = 0; i < NST; i++) {
    const t0 = T.stack0 + i * T.stackStep, d = drop(tf, t0); if (!d) continue;
    const s = A.stack[i], ly = -46 - i * 70;
    const px = cx + ox + s.ox * 1.2 + Math.sin(sway) * -ly, py = baseY + ly * Math.cos(sway) - d.lift * 260;
    drawSp(s.sp, px, py, { h: .03 + i * .004, sc: 1.2, lift: d.lift * .7, rot: s.rot + sway * (1 + i * .3) + (d.lift ? (h2(i, d.k) - .5) * .4 : 0), elev: 6 });
  }
  // words
  const tox = -1500 * out;
  drawInk(A.slishkom, cx + tox - 10, cy - 800, { t: tf, p: prog(t, T.slishkom[0], T.slishkom[1]), h: .03, rot: -.03, seed: 5 });
  word(A.vse, cx + tox, cy - 590, tf, T.vse, { h: .05, seed: 9, stagger: 1 / 12 });
  const dz = slide(t, T.derzh, .25);
  if (step12(t) >= T.derzh) drawSp(A.derzh, cx + tox + (1 - dz) * 900, cy - 425, { h: .045, lift: (1 - dz) * .5, rot: .025 });
  drawSp(A.fgBlur3, cx + 440 - t * 12 + ox * .4, cy + 700, { h: .4, rot: -.35, soft: 1, elev: 30 });
}
function scene4(t) {
  const [cx, cy] = S3;
  const out = slide(t, T.stopOut + .08, .45, eIn), ox = 1500 * out;
  const d = drop(t, T.stop); if (!d) return;
  drawSp(A.stopStrip, cx + ox, cy - 120 - d.lift * 80, { h: .09, lift: d.lift, rot: -.07 + d.lift * .2, elev: 10 });
  word(A.stop, cx + ox - 6, cy - 128, t, T.stop + 1 / 12, { h: .1, seed: 11, stagger: 1 / 24, rot: -.07, tilt: .05 });
}
function scene5(t) {
  const [cx, cy] = S5;
  const out = slide(t, T.s5out, .4, eIn);
  const sIn = slide(t, T.sheet, .22);
  if (step12(t) < T.sheet) return;
  const shx = cx - 1300 * out, shy = cy + 230 + (1 - sIn) * 1200 + 300 * out, shr = -.045 - .2 * out;
  drawSp(A.sheet, shx, shy, { h: .02, lift: (1 - sIn) * .5, rot: shr, elev: 7 });
  // the list lives on the sheet: draw in the sheet's own frame
  const onSheet = (lx, ly) => [shx + lx * Math.cos(shr) - ly * Math.sin(shr), shy + lx * Math.sin(shr) + ly * Math.cos(shr)];
  A.items.forEach((it, i) => {
    const ly = -285 + i * 124, t0 = T.items + i * .16;
    const [bx, by] = onSheet(-262, ly);
    inkLine(chain([bx - 22, by - 22], [bx + 22, by - 22], [bx + 22, by + 22], [bx - 22, by + 22], [bx - 22, by - 22]).map(q => q), { t, seed: 120 + i, w: 3.6, p: prog(t, t0 - .08, t0 + .04), h: .025, gaps: false });
    const [tx, ty] = onSheet(-215, ly - 4);
    drawInk(it, tx, ty, { t, p: prog(t, t0, t0 + .3), h: .025, rot: shr, align: 'left', seed: i });
    if (i < 4) {
      const s0 = T.strikes + i * T.strikeStep, wv = wavy(-230, -215 + it.tw + 20, ly - 2, 5, .09, i * 3).map(q => onSheet(q[0], q[1]));
      inkLine(wv, { t, seed: 130 + i, w: 7, p: eOut(prog(t, s0, s0 + .2)), h: .026 });
    } else {
      const ul = wavy(-225, -215 + it.tw + 10, ly + 42, 3, .05, 9).map(q => onSheet(q[0], q[1]));
      inkLine(ul, { t, seed: 140, w: 9, p: eOut(prog(t, T.underline[0], T.underline[1])), h: .026, color: PAL.orange });
    }
  });
  const hy = -1100 * out;
  drawInk(A.segodnya, cx - 10, cy - 720 + hy, { t, p: prog(t, T.segodnya[0], T.segodnya[1]), h: .03, rot: -.03, seed: 6 });
  const shrink = 1 - .42 * eIO(slide(t, T.mensheShrink[0], T.mensheShrink[1] - T.mensheShrink[0], x => x));
  word(A.menshe, cx, cy - 545 + hy + (1 - shrink) * 30, t, T.menshe, { h: .045, seed: 13, sc: shrink, stagger: 1 / 24 });
  const v = slide(t, T.vinit, .25);
  if (step12(t) >= T.vinit) drawSp(A.vinit, cx + (1 - v) * 900 + 1300 * out, cy - 385 + hy * .3, { h: .05, lift: (1 - v) * .5, rot: .03 });
  drawSp(A.fgBlur5, cx - 470 + t * 10, cy - 860, { h: .4, rot: .5, soft: 1, elev: 30 });
}
function scene6(t) {
  const [cx, cy] = S6;
  // ink glass
  const g = prog(t, T.glass[0], T.glass[1]);
  const gl = chain([cx - 170, cy - 320], [cx - 128, cy + 132], [cx + 128, cy + 132], [cx + 170, cy - 320]);
  inkLine(gl, { t, seed: 150, w: 7, p: eIO(g), h: .03 });
  inkLine(arc(cx, cy - 320, 170, 22, Math.PI, Math.PI * 3, 60), { t, seed: 151, w: 5, p: eOut(prog(t, T.glass[1] - .25, T.glass[1] + .1)), h: .03 });
  inkLine(chain([cx - 118, cy + 150], [cx + 118, cy + 150]), { t, seed: 152, w: 4, p: eOut(prog(t, T.glass[1] - .1, T.glass[1] + .15)), h: .03 });
  // paper water, one torn layer at a time
  A.water.forEach((wl, i) => {
    const d = drop(t, T.water + i * .15); if (!d) return;
    drawSp(wl.sp, cx, cy + wl.y + d.lift * 40, { h: .025, lift: d.lift * .4, rot: (h2(i, 5) - .5) * .02, elev: 3 });
  });
  // glints drawn back over the water
  inkLine(chain([cx - 112, cy - 230], [cx - 92, cy + 80]), { t, seed: 153, w: 4, p: prog(t, T.water + .7, T.water + .9), h: .032, color: '#ffffff', dbl: false });
  word(A.odno, cx, cy - 620, t, T.odno, { h: .045, seed: 14 });
  drawInk(A.malenkoe, cx, cy - 465, { t, p: prog(t, T.malenkoe[0], T.malenkoe[1]), h: .03, rot: -.025, seed: 7 });
  drawInk(A.uzhe, cx - 10, cy + 235, { t, p: prog(t, T.uzhe[0], T.uzhe[1]), h: .03, rot: .02, seed: 8 });
  word(A.dost, cx, cy + 352, t, T.dost, { h: .045, seed: 17, stagger: 1 / 24, tilt: .1 });
  inkLine(chain([cx + 196, cy - 250], [cx + 226, cy - 214], [cx + 300, cy - 318]), { t, seed: 160, w: 12, p: eOut(prog(t, T.check[0], T.check[1])), h: .04, color: PAL.orange });
}
function scene7(t) {
  const [cx, cy] = S7;
  const drift = step12(t) - 19;
  drawSp(A.sky, cx, cy - 560, { h: 0, elev: 4 });
  drawSp(A.cloud1, cx - 300 + drift * 14, cy - 360, { h: .05, elev: 8 });
  drawSp(A.cloud2, cx + 320 - drift * 10, cy - 200, { h: .07, elev: 8 });
  // the sun climbs from behind the sea in stop-motion steps
  const su = slide(t, T.sun[0], T.sun[1] - T.sun[0], eIO);
  const sy = lerp(cy + 380, cy + 40, su);
  drawSp(A.sunO, cx, sy, { h: .015, elev: 6 });
  drawSp(A.sunI, cx - 26, sy - 22, { h: .02, elev: 5 });
  // rays boil once it is up
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + Math.PI * (i + .5) / 7, r0 = 262, r1 = 330 + (i % 2) * 40;
    inkLine(seg([cx + Math.cos(a) * r0, cy + 60 + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + 60 + Math.sin(a) * r1], 6), { t, seed: 170 + i, w: 6, p: eOut(prog(t, T.rays[0] + i * .04, T.rays[0] + .2 + i * .04)), h: .025, color: PAL.ink, dbl: false });
  }
  inkLine(arc(cx, cy + 66, 226, 226, Math.PI, Math.PI * 2, 70), { t, seed: 180, w: 5, p: eOut(prog(t, T.rays[0] - .1, T.rays[1])), h: .022 });
  drawSp(A.sea[0], cx, cy + 80 + 450, { h: .03, elev: 8 });
  drawSp(A.sea[1], cx + 30, cy + 215 + 450, { h: .045, elev: 9 });
  drawSp(A.sea[2], cx - 20, cy + 360 + 450, { h: .06, elev: 10 });
  inkLine(seg([cx - 520, cy + 84], [cx + 520, cy + 76], 9), { t, seed: 181, w: 5, p: eIO(prog(t, T.horizon[0], T.horizon[1])), h: .032 });
  inkLine(seg([cx - 160, cy + 150], [cx + 160, cy + 150], 8), { t, seed: 182, w: 5, p: eOut(prog(t, T.refl[0], T.refl[0] + .25)), h: .035, color: '#0b3f5e' });
  inkLine(seg([cx - 80, cy + 196], [cx + 80, cy + 196], 8), { t, seed: 183, w: 5, p: eOut(prog(t, T.refl[0] + .15, T.refl[1])), h: .036, color: '#0b3f5e' });
  word(A.havn, cx, cy - 700, t, T.havn, { h: .05, seed: 18 });
  const ti = slide(t, T.tihoe, .25);
  if (step12(t) >= T.tihoe) drawSp(A.tihoe, cx + (1 - ti) * 900, cy - 535, { h: .05, lift: (1 - ti) * .5, rot: -.02 });
  const so = slide(t, T.sohrani, .2);
  if (step12(t) >= T.sohrani) {
    drawSp(A.sohrani, cx - (1 - so) * 950, cy + 330, { h: .07, lift: (1 - so) * .5, rot: .025, elev: 8 });
    drawInk(A.sohraniT, cx - (1 - so) * 950, cy + 326, { t, p: prog(t, T.sohraniW[0], T.sohraniW[1]), h: .072, rot: .025, seed: 9 });
  }
  const li = drop(t, T.link);
  if (li) drawSp(A.link, cx, cy + 460 - li.lift * 50, { h: .075, lift: li.lift, rot: -.03, elev: 8 });
  drawSp(A.cloudFg, cx - 420 + (t - 19) * 22, cy + 720, { h: .42, soft: 1, elev: 34 });
}

/* ---------- finishing: light, vignette, grain ---------- */
function finish(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W * .3, H * .18, 50, W * .3, H * .18, H * .9);
  g.addColorStop(0, 'rgba(255,248,232,.22)'); g.addColorStop(1, 'rgba(255,248,232,0)');
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  const v = ctx.createRadialGradient(W / 2, H * .48, H * .32, W / 2, H * .5, H * .78);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, 'rgba(176,160,140,1)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07;
  ctx.drawImage(GRAIN[Math.floor(t * 12) % 4], 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // fade in from paper and a short settle at the very end
  const fi = 1 - prog(t, 0, .12);
  if (fi > 0) { ctx.fillStyle = `rgba(238,230,214,${fi})`; ctx.fillRect(0, 0, W, H); }
}

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (t < 2.95) scene1(t);
  if (t > 2.1 && t < 5.4) scene2(t);
  if (t > 4.6 && t < 10.3) { scene3(t); scene4(t); }
  if (t > 9.4 && t < 15.7) scene5(t);
  if (t > 14.6 && t < 19.3) scene6(t);
  if (t > 18.3) scene7(t);
}
/* camera motion blur: on fast moves several sub-frames inside a 180° shutter are averaged */
const ACC = mk(W, H), ACX = ACC.getContext('2d');
function camSpeed(t) { const a = camAt(t - 1 / 120), b = camAt(t + 1 / 120); return Math.hypot((b.x - a.x) * b.z, (b.y - a.y) * b.z) + Math.abs(b.r - a.r) * 900 + Math.abs(b.z - a.z) * 900; }
window.renderFrame = function (t) {
  const sp = camSpeed(t), n = clamp(Math.ceil(sp / 7), 1, 10);
  if (n <= 1) { drawWorld(t); finish(t); return; }
  ACX.clearRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const ts = t + (i / (n - 1) - .5) * (1 / 120);
    drawWorld(ts);
    ACX.globalAlpha = 1 / (i + 1); ACX.drawImage(cv, 0, 0);
  }
  ACX.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ACC, 0, 0);
  finish(t);
};

/* ---------- sound cue list, from the same timeline ---------- */
function buildCues() {
  'УСТАЛ'.split('').forEach((_, j) => cue('slap', T.ustal + j / 12 + 2 / 12, { g: .8 }));
  cue('pen', T.otVsego[0], { d: T.otVsego[1] - T.otVsego[0] });
  cue('whoosh', 2.2, { d: .52 });
  cue('pen', T.etoNe[0], { d: T.etoNe[1] - T.etoNe[0] });
  cue('slide', T.len, { d: .25 }); cue('slap', T.len + .25, { g: .6 });
  cue('scratch', T.lenStrike[0], { d: T.lenStrike[1] - T.lenStrike[0] });
  cue('pen', T.iNe[0], { d: T.iNe[1] - T.iNe[0] });
  cue('slide', T.slab, { d: .25 }); cue('slap', T.slab + .25, { g: .6 });
  cue('scratch', T.slabStrike[0], { d: T.slabStrike[1] - T.slabStrike[0] });
  cue('whoosh', 4.7, { d: .48 });
  cue('pen', T.fig[0], { d: .45, g: .5 });
  for (let i = 0; i < NST; i++) cue('slap', T.stack0 + i * T.stackStep + 2 / 12, { g: .5 + i * .05, low: 1 });
  cue('pen', T.slishkom[0], { d: T.slishkom[1] - T.slishkom[0] });
  cue('slap', T.vse + 2 / 12, { g: .9, low: 1 }); cue('slap', T.vse + 3 / 12, { g: .7 }); cue('slap', T.vse + 4 / 12, { g: .7 });
  cue('slide', T.derzh, { d: .25 });
  cue('thud', T.stop + 2 / 12, { g: 1 });
  'СТОП'.split('').forEach((_, j) => cue('slap', T.stop + 1 / 12 + j / 24 + 2 / 12, { g: .9 }));
  cue('slide', T.stopOut, { d: .5, g: 1 }); cue('whoosh', 9.45, { d: .6, g: .6 });
  cue('slide', T.sheet, { d: .22 });
  for (let i = 0; i < 5; i++) cue('pen', T.items + i * .16, { d: .3, g: .45 });
  cue('pen', T.segodnya[0], { d: T.segodnya[1] - T.segodnya[0] });
  'МЕНЬШЕ'.split('').forEach((_, j) => cue('slap', T.menshe + j / 24 + 2 / 12, { g: .6 }));
  cue('shrink', T.mensheShrink[0], { d: .35 });
  for (let i = 0; i < 4; i++) cue('scratch', T.strikes + i * T.strikeStep, { d: .2 });
  cue('slide', T.vinit, { d: .25 });
  cue('pen', T.underline[0], { d: .35, g: .6 });
  cue('slide', T.s5out, { d: .4 });
  cue('pen', T.glass[0], { d: .75, g: .55 });
  'ОДНО'.split('').forEach((_, j) => cue('slap', T.odno + j / 12 + 2 / 12, { g: .7 }));
  cue('pen', T.malenkoe[0], { d: T.malenkoe[1] - T.malenkoe[0] });
  for (let i = 0; i < 4; i++) cue('water', T.water + i * .15 + 1 / 12, { i });
  cue('pen', T.uzhe[0], { d: .23 });
  'ДОСТАТОЧНО'.split('').forEach((_, j) => cue('slap', T.dost + j / 24 + 2 / 12, { g: .45 }));
  cue('scratch', T.check[0], { d: .25, g: .7 });
  cue('whoosh', 18.4, { d: .65 });
  cue('chime', 19.6); cue('chime', T.rays[0], { hi: 1 });
  'HAVN'.split('').forEach((_, j) => cue('slap', T.havn + j / 12 + 2 / 12, { g: .7 }));
  cue('slide', T.tihoe, { d: .25 }); cue('slide', T.sohrani, { d: .2 });
  cue('pen', T.sohraniW[0], { d: T.sohraniW[1] - T.sohraniW[0] });
  cue('slap', T.link + 2 / 12, { g: .5 });
}

window.ready = (async () => {
  await loadFonts();
  buildAssets();
  buildCues();
  window.SFX = SFX;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { renderFrame(+q.get('t')); return true; }
  if (!q.has('render')) {
    const t0 = performance.now();
    const loop = () => { const t = ((performance.now() - t0) / 1000) % DUR; renderFrame(t); requestAnimationFrame(loop); };
    loop();
  }
  return true;
})();
