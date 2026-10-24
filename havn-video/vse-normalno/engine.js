/* HAVN video engine: hand-drawn ink (boiling 10×/s) and cut-paper collage
   (12 fps stop-motion steps) on one long paper table, filmed by a camera
   that glides at 60 fps. The scene file defines DUR, CAMK, SHAKES, T,
   buildAssets(), buildCues() and drawWorld(t). */
'use strict';

const W = 1080, H = 1920;
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


/* ---------- camera: keys [t, x, y, zoom, rotDeg] from the scene; SHAKES = [[t, strength]] ---------- */
let CAMM = null;
function camTangents() {
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
}
function camAt(t) {
  if (!CAMM) CAMM = camTangents();
  t = clamp(t, 0, DUR);
  let i = 0; while (i < CAMK.length - 2 && t > CAMK[i + 1][0]) i++;
  const a = CAMK[i], b = CAMK[i + 1], dt = b[0] - a[0], u = clamp((t - a[0]) / dt);
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = [1, 2, 3, 4].map(c => h00 * a[c] + h10 * dt * CAMM[i][c - 1] + h01 * b[c] + h11 * dt * CAMM[i + 1][c - 1]);
  // breathing handheld drift + knocks when something heavy lands
  let sk = 0; for (const [ts, k] of SHAKES) if (t > ts) sk += k * Math.exp(-(t - ts) * 8) * Math.sin((t - ts) * 2 * Math.PI * 15);
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

/* ---------- paper pieces with print on them ---------- */
function printed(text, font, color, dy = 0) { return (x, cx, cy) => { x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(text, cx, cy + dy); }; }
function label(text, font, o = {}) {
  const m = mk(10, 10).getContext('2d'); m.font = font; const w = m.measureText(text).width + 90;
  return card(w, o.h || 130, Object.assign({ torn: true, color: PAL.cream, content: printed(text, font, o.ink || PAL.ink, o.dy == null ? -4 : o.dy) }, o));
}
function scrapFor(text, seed, color, size = 44) {
  const m = mk(10, 10).getContext('2d'); m.font = `600 ${size}px Inter`; const w = m.measureText(text).width + 70;
  return card(w, size * 1.9, { seed, color, torn: h2(seed, 1) < .45, content: printed(text, `600 ${size}px Inter`, PAL.ink, 2) });
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


/* ---------- the table, the light, the grain ---------- */
function sceneTable() {
  layer(0);
  const r = 2600; ctx.fillStyle = PAL.table; ctx.fillRect(CAM.x - r, CAM.y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .9; ctx.fillStyle = A.tablePat; ctx.fillRect(CAM.x - r, CAM.y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
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

