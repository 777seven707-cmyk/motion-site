/* «Маленький призрак» — a 95-second story for HAVN, flat vector style after
   Kurzgesagt: one room floating alone in space, colour drained by apathy, and
   a tiny ghost with a flashlight that lights one small thing at a time.
   window.renderFrame(t) draws the frame for time t; window.SFX lists sound cues. */
'use strict';

const W = 1920, H = 1080, DUR = 95;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

/* ---------- helpers ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
const h2 = (a, b) => hash((Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)) >>> 0);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const sstep = x => x * x * (3 - 2 * x);
const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eOut = x => 1 - Math.pow(1 - x, 3);
const eBack = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const ramp = (t, a, b) => sstep(prog(t, a, b));
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`; };
const rgba = (s, a) => { const c = hex(s); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const SFX = [];
const cue = (type, t, extra) => SFX.push(Object.assign({ type, t: +t.toFixed(4) }, extra || {}));

/* ---------- palette ---------- */
const C = {
  space0: '#070b1d', space1: '#10173a', nebA: '#4b2d86', nebB: '#1b6e8f',
  wallN: '#222c58', wallD: '#4a63b8', wallShadeN: '#1a2349', wallShadeD: '#3a4f99',
  floor: '#3c2f6a', floorTop: '#5a4a96', rock: '#2b2557', rockL: '#3d3578', rockD: '#1d1940',
  frame: '#151c40', bed: '#4b3a7a', mattress: '#dcd8f6', blanket: '#6c5ad6', blanketD: '#5546b4', pillow: '#f2f0ff',
  table: '#a0714a', tableD: '#7d5536', glass: '#cfe9ff', water: '#59b8ff',
  guitar: '#e08a3c', guitarD: '#b8692a', neck: '#5a3a22', pot: '#d2603f', potD: '#a8472c', leaf: '#3fbf72', leafD: '#2c9558',
  note: '#ffd166', note2: '#ff8fab', door: '#7b5cd6', doorD: '#5f45b0', poster: '#ffb86b',
  skin: '#f6c49c', skinD: '#e0a77e', hair: '#2a1d3f', hoodie: '#8e7cf0', hoodieD: '#6f5ed0', pants: '#2c2756', shoe: '#f4f1ff',
  ghost: '#eef8ff', ghostD: '#bcd6ef', light: '#fff1b8', warm: '#ffcf7a', sunO: '#ffa45c', sunI: '#ffe2b0', sky: '#cfe9fb',
  ui: '#121a3a', uiCard: '#1d2752', uiText: '#e9edff', uiDim: '#8a94c4', red: '#ff5470', green: '#43d17a', island: '#2f6f5e', grass: '#46c27a'
};

/* ---------- camera: keys [t, x, y, zoom, rotDeg]; zoom eased in log space ---------- */
const CAMK = [
  [0.0, 60, -260, 0.30, -1.5], [4.6, -30, -230, 0.62, 0.6],
  [5.6, -170, -210, 1.35, -0.8], [12.6, -60, -230, 1.25, 0.8], [13.4, 30, -260, 0.92, 0], [16.2, 20, -250, 0.95, -0.4],
  [17.4, -150, -150, 9.0, 12], [19.0, -150, -150, 19.0, 14.3], [24.6, -150, -150, 20.0, 14.3],
  [26.4, -140, -190, 2.4, -0.6], [30.6, -90, -210, 1.9, 0.6],
  [32.0, -20, -220, 1.35, -0.4], [37.6, 30, -200, 1.45, 0.4],
  [39.6, 20, -210, 1.3, -0.5], [44.6, -40, -220, 1.3, 0.5],
  [46.0, -130, -190, 1.9, -0.4], [53.0, -120, -195, 2.05, 0.4],
  [56.6, 100, -150, 0.62, 0], [58.4, 60, -200, 1.15, -0.6],
  [62.0, 280, -170, 1.7, 0.6], [63.2, 385, -140, 3.4, 0], [64.1, 385, -140, 9.0, 0],
  [64.3, 700, -120, 0.85, -0.5], [73.4, 1850, -40, 0.95, 0.6],
  [76.0, 1000, -170, 0.56, 0], [84.0, 1150, -420, 0.50, 0.4],
  [87.2, 1400, -1210, 0.78, 0], [95.0, 1400, -1215, 0.82, -0.2]
];
function track(keys, cols) {
  // monotone Hermite per channel: velocity stays continuous, fast moves never overshoot slow ones
  const M = keys.map(() => []);
  for (let c = 1; c <= cols; c++) for (let i = 0; i < keys.length; i++) {
    const s = (a, b) => (keys[b][c] - keys[a][c]) / (keys[b][0] - keys[a][0]);
    if (i === 0) M[i][c] = s(0, 1); else if (i === keys.length - 1) M[i][c] = s(i - 1, i);
    else { const d0 = s(i - 1, i), d1 = s(i, i + 1); M[i][c] = d0 * d1 <= 0 ? 0 : (Math.abs(d0) < Math.abs(d1) ? d0 : d1); }
  }
  return t => {
    t = clamp(t, keys[0][0], keys[keys.length - 1][0]);
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], dt = b[0] - a[0], u = clamp((t - a[0]) / dt), u2 = u * u, u3 = u2 * u;
    const out = []; for (let c = 1; c <= cols; c++) out.push((2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * dt * M[i][c] + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * dt * M[i + 1][c]);
    return out;
  };
}
const camT = track(CAMK.map(k => [k[0], k[1], k[2], Math.log(k[3]), k[4]]), 4);
let CAM;
function camAt(t) { const v = camT(t); return { x: v[0] + 6 * Math.sin(t * .5), y: v[1] + 4 * Math.sin(t * .37 + 1), z: Math.exp(v[2]) * (1 + .004 * Math.sin(t * .6)), r: (v[3] + .2 * Math.sin(t * .3)) * Math.PI / 180 }; }
function view(f = 1, c = ctx) { const s = Math.pow(CAM.z, f); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(W / 2, H / 2); c.rotate(CAM.r * f); c.scale(s, s); c.translate(-CAM.x * f, -CAM.y * f); return s; }

/* ---------- drawing helpers ---------- */
let X = ctx;   // current target (the room is drawn into its own layer)
function shaded(path, base, dark, d = 6) { X.save(); path(); X.clip(); path(); X.fillStyle = dark; X.fill(); X.translate(-d, -d); path(); X.fillStyle = base; X.fill(); X.restore(); }
const rr = (x, y, w, h, r) => () => { X.beginPath(); X.roundRect(x, y, w, h, r); };
const circ = (x, y, r) => () => { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); };
const elli = (x, y, rx, ry, rot = 0) => () => { X.beginPath(); X.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
const poly = pts => () => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); };
function glow(x, y, r, col, a, c = X) {
  if (a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(.35, rgba(col, a * .45)); g.addColorStop(1, rgba(col, 0));
  const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = op;
}
function limb(pts, w, col) { X.strokeStyle = col; X.lineWidth = w; X.lineCap = 'round'; X.lineJoin = 'round'; X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.stroke(); }
function ik(s, h, l1, l2, bend) {
  const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - .01), a = Math.atan2(dy, dx);
  const k = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * bend;
  return [s[0] + Math.cos(a - k) * l1, s[1] + Math.sin(a - k) * l1];
}
function text(s, x, y, size, col, o = {}) { X.font = `${o.weight || 600} ${size}px ${o.font || 'Inter'}`; X.textAlign = o.align || 'center'; X.textBaseline = 'middle'; X.fillStyle = col; X.globalAlpha = o.alpha == null ? 1 : o.alpha; X.fillText(s, x, y); X.globalAlpha = 1; }
function heart(x, y, s, col) { X.fillStyle = col; X.beginPath(); X.moveTo(x, y + s * .35); X.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .45, y - s * 1.05, x, y - s * .45); X.bezierCurveTo(x + s * .45, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); X.fill(); }

/* ---------- timeline ---------- */
const T = {
  battery: 6.8, guitarNotes: 10.6, msgs: [11.9, 13.4], mountain: [13.9, 14.9, 16.0, 16.6],
  phoneTime: 16.8, typing: [19.0, 21.0], results: 21.2, havnCard: 22.4, tap: 24.0, site: 24.4,
  swirl: 25.5, ghostPop: 26.6, blink: [28.1, 33.2, 47.0, 61.4], wave: [28.7, 30.0], flash: 29.9,
  dark: [31.1, 31.8], search: [32.0, 34.9], onGlass: 35.0,
  fetch: [38.0, 38.6, 39.1], drink: [39.1, 39.8], orbs: [39.85, 41.65, 43.65], window: [40.2, 40.9], msg: [42.2, 42.7, 43.3],
  breath: [47.4, 50.2, 50.4, 53.2], color: [53.6, 57.2], stand: [58.4, 59.2], walkIn: [59.2, 61.0], onDoor: 59.8, hesitate: [61.0, 62.3], open: [62.6, 63.3], flashW: [63.6, 64.25],
  walk: [64.6, 72.6], friend: 68.6, branch: 69.2, listen: 71.9, sit: 72.6,
  ownLight: 77.6, ghostBye: [80.0, 80.8], ghostUp: [80.8, 84.0], star: 84.0,
  logo: [86.6, 88.0], name: 88.1, tag: 89.0, note: 90.6
};

/* ---------- the world: room island at the origin, two more islands to the right ---------- */
const I1 = [1380, -300], I2 = [2060, 120];
const STONES = (() => {
  const s = []; const main = [[560, 14], [660, 0], [760, -20], [865, -48], [970, -82], [1080, -122], [1180, -170], [1270, -226]];
  main.forEach(p => s.push({ x: p[0], y: p[1], kind: 'main' }));
  [[1090, -60], [1220, -10], [1360, 30], [1500, 66], [1640, 92], [1780, 112], [1910, 120]].forEach(p => s.push({ x: p[0], y: p[1], kind: 'branch' }));
  return s;
})();
// Mira's walk: along the first five stones, then down the branch to the second island
const WALKP = [[500, 0], [560, 14], [660, 0], [760, -20], [865, -48], [970, -82], [1090, -60], [1220, -10], [1360, 30], [1500, 66], [1640, 92], [1780, 112], [1910, 120], [2000, 120]];
const WALKL = (() => { const L = [0]; for (let i = 1; i < WALKP.length; i++) L.push(L[i - 1] + Math.hypot(WALKP[i][0] - WALKP[i - 1][0], WALKP[i][1] - WALKP[i - 1][1])); return L; })();
function walkAt(u) { const d = u * WALKL[WALKL.length - 1]; let i = 0; while (i < WALKL.length - 2 && WALKL[i + 1] < d) i++; const k = (d - WALKL[i]) / (WALKL[i + 1] - WALKL[i]); return [lerp(WALKP[i][0], WALKP[i + 1][0], k), lerp(WALKP[i][1], WALKP[i + 1][1], k)]; }
const stoneLit = (s, i, t) => {
  if (s.kind === 'main' && i < 3) return ramp(t, T.orbs[i] + .9, T.orbs[i] + 1.4);
  const k = s.kind === 'main' ? i : i - 8 + 5;
  return ramp(t, 64.4 + k * .45, 64.8 + k * .45);
};

/* ---------- state over time ---------- */
function state(t) {
  let sat = .2; [.26, .4, .52].forEach((v, i) => { sat = lerp(sat, v, ramp(t, T.orbs[i] - .1, T.orbs[i] + .6)); });
  sat = lerp(sat, .62, ramp(t, 45, 53)); sat = lerp(sat, 1, ramp(t, T.color[0], T.color[1]));
  let dark = .86 * ramp(t, T.dark[0], T.dark[1]);
  [.72, .58, .44].forEach((v, i) => { if (t > T.orbs[i]) dark = lerp(dark, v, ramp(t, T.orbs[i], T.orbs[i] + .6)); });
  dark = lerp(dark, .3, ramp(t, 45, 50)); dark = lerp(dark, 0, ramp(t, T.color[0], T.color[0] + 2));
  const day = Math.max(.35 * ramp(t, T.window[1], T.window[1] + 1.5), ramp(t, T.color[0] + .5, T.color[1]));
  return { sat, dark, day };
}

/* ---------- Mira ---------- */
function person(o) {
  // side view, facing right (o.face = 1) or left (-1); o.hip = hip point
  const f = o.face || 1, [hx, hy] = o.hip, lean = (o.lean || 0) * f;
  const P = (x, y) => [hx + x * f, hy + y];
  const sh = [hx + Math.sin(lean) * 76, hy - Math.cos(lean) * 76];
  const hd = [sh[0] + Math.sin(lean * 1.25 + (o.headTilt || 0) * f) * 40, sh[1] - Math.cos(lean * 1.25) * 40];
  const col = o.col || C;
  // legs
  let k1, f1, k2, f2;
  if (o.pose === 'sit') { k1 = P(46, 0); f1 = [k1[0] + 6 * f, hy + o.shin]; k2 = P(42, 4); f2 = [k2[0] + 2 * f, hy + o.shin]; }
  else {
    const ph = o.walk || 0, a1 = Math.sin(ph) * .45, a2 = -a1;
    k1 = [hx + Math.sin(a1) * 36 * f, hy + Math.cos(a1) * 36]; f1 = [k1[0] + Math.sin(a1 - .15 * Math.max(0, -Math.cos(ph))) * 34 * f, k1[1] + 34];
    k2 = [hx + Math.sin(a2) * 36 * f, hy + Math.cos(a2) * 36]; f2 = [k2[0] + Math.sin(a2 - .15 * Math.max(0, Math.cos(ph))) * 34 * f, k2[1] + 34];
  }
  limb([[hx, hy], k2, f2], 22, col.pants);
  X.fillStyle = C.shoe; X.beginPath(); X.ellipse(f2[0] + 7 * f, f2[1] - 2, 14, 7, 0, 0, Math.PI * 2); X.fill();
  // back arm
  const hb = o.handB || [sh[0] + 14 * f, sh[1] + 62];
  const eb = ik(sh, hb, 34, 34, -f);
  limb([sh, eb, hb], 17, C.hoodieD);
  // torso
  limb([[hx, hy - 6], sh], 52, C.hoodie);
  X.save(); X.beginPath(); X.arc(hx, hy - 6, 26, 0, Math.PI * 2); X.fillStyle = C.hoodie; X.fill(); X.restore();
  limb([[hx, hy], k1, f1], 22, C.pants);
  X.fillStyle = C.shoe; X.beginPath(); X.ellipse(f1[0] + 7 * f, f1[1] - 2, 14, 7, 0, 0, Math.PI * 2); X.fill();
  // head
  shaded(circ(hd[0], hd[1], 31), C.skin, C.skinD, 5);
  X.fillStyle = C.hair;
  X.beginPath(); X.arc(hd[0] - 6 * f, hd[1] - 6, 30, 0, Math.PI * 2); X.fill();
  X.beginPath(); X.ellipse(hd[0] - 14 * f, hd[1] + 10, 18, 26, 0, 0, Math.PI * 2); X.fill();
  X.save(); X.beginPath(); X.arc(hd[0], hd[1], 31, 0, Math.PI * 2); X.clip();
  X.beginPath(); X.ellipse(hd[0] + 4 * f, hd[1] - 24, 34, 14, .3 * f, 0, Math.PI * 2); X.fill(); X.restore();
  // face
  const ex = hd[0] + 16 * f, ey = hd[1] + 2;
  if (o.eyes === 'closed') { X.strokeStyle = '#2a1d3f'; X.lineWidth = 3; X.lineCap = 'round'; X.beginPath(); X.arc(ex, ey - 2, 5, .2, Math.PI - .2); X.stroke(); }
  else if (o.eyes === 'tired') { X.fillStyle = '#20163a'; X.beginPath(); X.ellipse(ex, ey + 1, 3.6, 2.4, 0, 0, Math.PI * 2); X.fill(); X.strokeStyle = '#20163a'; X.lineWidth = 2.5; X.beginPath(); X.moveTo(ex - 5, ey - 3); X.lineTo(ex + 5, ey - 2); X.stroke(); }
  else { X.fillStyle = '#20163a'; X.beginPath(); X.ellipse(ex, ey, 3.8, 4.8, 0, 0, Math.PI * 2); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(ex + 1.2 * f, ey - 1.6, 1.3, 0, 7); X.fill(); }
  X.fillStyle = rgba('#ff8fa3', .55); X.beginPath(); X.ellipse(hd[0] + 10 * f, hd[1] + 14, 7, 4, 0, 0, Math.PI * 2); X.fill();
  if (o.smile) { X.strokeStyle = '#7a3b4a'; X.lineWidth = 2.6; X.beginPath(); X.arc(hd[0] + 22 * f, hd[1] + 14, 5, .2, Math.PI * .8 * o.smile + .2); X.stroke(); }
  // front arm
  const hf = o.handF || [sh[0] + 20 * f, sh[1] + 60];
  const ef = ik(sh, hf, 34, 34, -f);
  limb([sh, ef, hf], 18, C.hoodie);
  shaded(circ(hf[0], hf[1], 9), C.skin, C.skinD, 2);
  return { sh, hd, hf, hb };
}

/* ---------- the ghost ---------- */
const ghostT = track([
  [26.6, -150, -150], [27.6, -95, -235], [30.8, -80, -245], [34.8, -40, -262], [37.8, -30, -255],
  [38.6, 230, -175], [39.2, -110, -185], [39.9, -100, -215], [40.4, -10, -330], [41.8, 0, -320], [42.3, -95, -230], [44.4, -90, -230],
  [45.6, -60, -235], [53.0, -60, -235], [55.0, 60, -260], [57.0, 140, -250], [59.6, 250, -260], [62.4, 300, -260], [63.4, 360, -200],
  [64.4, 600, -110], [72.6, 1950, 10], [76.0, 1990, 0], [80.4, 2010, -30], [84.0, 1400, -1350]
], 2);
function drawGhost(t, x, y, s, o = {}) {
  const wob = t * 5;
  X.save(); X.translate(x, y); X.scale(s * (o.sx || 1), s * (o.sy || 1));
  glow(0, 0, 120, '#cfe8ff', .35 * (o.aura == null ? 1 : o.aura));
  const body = () => {
    X.beginPath(); X.moveTo(-30, 0); X.arc(0, 0, 30, Math.PI, 0); X.lineTo(30, 34);
    for (let i = 0; i <= 4; i++) { const xx = 30 - i * 15, yy = 34 + (i % 2 ? -6 : 3) + Math.sin(wob + i) * 3; X.quadraticCurveTo(xx + 7.5, yy + 8, xx, yy); }
    X.lineTo(-30, 0); X.closePath();
  };
  shaded(body, C.ghost, C.ghostD, 6);
  // eyes and blush
  const blink = T.blink.some(b => Math.abs(t - b) < .07);
  [-11, 11].forEach(ex => {
    if (blink) { X.strokeStyle = '#1b2040'; X.lineWidth = 2.5; X.beginPath(); X.moveTo(ex - 5, -2); X.lineTo(ex + 5, -2); X.stroke(); }
    else { X.fillStyle = '#1b2040'; X.beginPath(); X.ellipse(ex + (o.look || 0) * 2, -2, 5, 7, 0, 0, Math.PI * 2); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(ex + 1.5 + (o.look || 0) * 2, -5, 1.8, 0, 7); X.fill(); }
  });
  X.fillStyle = rgba('#ff8fab', .6); [-19, 19].forEach(bx => { X.beginPath(); X.ellipse(bx, 8, 5, 3, 0, 0, Math.PI * 2); X.fill(); });
  // little arms; the right one holds the flashlight
  const wave = o.wave ? Math.sin(t * 14) * .6 : 0;
  X.fillStyle = C.ghost; X.beginPath(); X.ellipse(-31, 18, 6, 10, -.6 + wave, 0, Math.PI * 2); X.fill();
  if (o.flash) {
    X.save(); X.translate(30, 16); X.rotate(o.aim || 0);
    X.fillStyle = '#ffd166'; X.beginPath(); X.roundRect(-4, -5, 18, 10, 3); X.fill(); X.fillStyle = '#ffb703'; X.beginPath(); X.roundRect(12, -7, 6, 14, 2); X.fill();
    X.restore();
  }
  X.fillStyle = C.ghost; X.beginPath(); X.ellipse(30, 18, 6, 9, .5, 0, Math.PI * 2); X.fill();
  X.restore();
}
function beam(x, y, tx, ty, a, width = 90) {
  if (a <= 0) return;
  const ang = Math.atan2(ty - y, tx - x), d = Math.hypot(tx - x, ty - y), nx = -Math.sin(ang), ny = Math.cos(ang);
  const g = X.createLinearGradient(x, y, tx, ty); g.addColorStop(0, rgba(C.light, .55 * a)); g.addColorStop(1, rgba(C.light, .14 * a));
  const op = X.globalCompositeOperation; X.globalCompositeOperation = 'lighter';
  X.fillStyle = g; X.beginPath(); X.moveTo(x + nx * 5, y + ny * 5); X.lineTo(tx + nx * width / 2, ty + ny * width / 2); X.lineTo(tx - nx * width / 2, ty - ny * width / 2); X.lineTo(x - nx * 5, y - ny * 5); X.closePath(); X.fill();
  X.globalCompositeOperation = op;
  glow(tx, ty, width * .9, C.light, .5 * a);
  void d;
}

/* ---------- background: stars and nebulae in parallax layers ---------- */
const STARS = [0, 1, 2].map(l => { const r = mulberry32(10 + l); return Array.from({ length: 140 - l * 30 }, () => [r() * 3000, r() * 3000, .6 + r() * (1.2 + l), r() * 6]); });
function space(t, st) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.space0); g.addColorStop(1, C.space1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // nebulae
  view(.08);
  [[-900, -700, 900, C.nebA, .22], [1600, -300, 1000, C.nebB, .18], [600, 700, 800, C.nebA, .12], [2600, -1300, 900, C.nebB, .15]].forEach(n => glow(n[0], n[1], n[2], n[3], n[4] * (.6 + .4 * st.day + .3 * prog(t, 74, 84)), ctx));
  [.06, .16, .3].forEach((f, l) => {
    const s = view(f), cx = CAM.x * f, cy = CAM.y * f, hw = W / 2 / s + 50, hh = H / 2 / s + 50, TS = 3000;
    ctx.fillStyle = '#fff';
    for (let ox = Math.floor((cx - hw) / TS); ox <= Math.floor((cx + hw) / TS); ox++) for (let oy = Math.floor((cy - hh) / TS); oy <= Math.floor((cy + hh) / TS); oy++) {
      STARS[l].forEach(p => {
        const x = p[0] + ox * TS, y = p[1] + oy * TS; if (Math.abs(x - cx) > hw || Math.abs(y - cy) > hh) return;
        ctx.globalAlpha = .45 + .45 * Math.sin(t * (1 + l) + p[3]); ctx.beginPath(); ctx.arc(x, y, p[2] / s * 1.2, 0, 7); ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
  });
}

/* ---------- islands ---------- */
function rockUnder(x0, x1, y, depth, seed) {
  const r = mulberry32(seed), pts = [[x0, y]], n = 9;
  for (let i = 1; i < n; i++) { const u = i / n; pts.push([lerp(x0, x1, u) + (r() - .5) * 40, y + depth * Math.sin(Math.PI * u) * (.7 + r() * .5)]); }
  pts.push([x1, y]);
  return pts;
}
const ROCK0 = rockUnder(-510, 510, 30, 360, 3), ROCK1 = rockUnder(-260, 260, 0, 210, 4), ROCK2 = rockUnder(-300, 300, 0, 230, 5);
function island(rock, ox, oy, top) {
  X.save(); X.translate(ox, oy);
  shaded(poly(rock), C.rock, C.rockD, 14);
  X.fillStyle = C.rockL; X.beginPath(); X.moveTo(rock[0][0], rock[0][1]); for (let i = 1; i < 4; i++) X.lineTo(rock[i][0] * .9, rock[i][1] * .45 + 4); X.lineTo(rock[0][0] + 40, rock[0][1] + 6); X.fill();
  if (top) { X.fillStyle = top; X.beginPath(); X.roundRect(rock[0][0] - 6, -10, rock[rock.length - 1][0] - rock[0][0] + 12, 18, 9); X.fill(); }
  X.restore();
}
function floaters(t, cx, cy, n, seed, spread) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - .5) * spread, y = cy + 120 + r() * 300 + Math.sin(t * .6 + i) * 8, s = 8 + r() * 22;
    shaded(poly([[x - s, y], [x - s * .4, y - s * .6], [x + s * .7, y - s * .4], [x + s, y + s * .3], [x, y + s * .8]]), C.rock, C.rockD, 4);
  }
}

/* ---------- the room (drawn into its own layer so apathy can drain its colour) ---------- */
const ROOM = mk(W, H), RX = ROOM.getContext('2d'), DARK = mk(W, H), DX = DARK.getContext('2d');
function room(t, st) {
  const day = st.day, wall = mixc(C.wallN, C.wallD, day), wallS = mixc(C.wallShadeN, C.wallShadeD, day);
  X.fillStyle = wall; X.fillRect(-470, -520, 940, 520);
  X.fillStyle = wallS; X.fillRect(-470, -60, 940, 60);
  X.fillStyle = C.frame; X.fillRect(-500, -540, 30, 540); X.fillRect(470, -540, 30, 540);
  // window: night sky → day; opens in the wind
  const wx = -120, wy = -410, ww = 190, wh = 170, open = ramp(t, T.window[0], T.window[1]);
  X.fillStyle = C.frame; X.beginPath(); X.roundRect(wx - 10, wy - 10, ww + 20, wh + 20, 8); X.fill();
  const sky = X.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, mixc('#0c1433', '#7cc4f4', day)); sky.addColorStop(1, mixc('#22306b', '#cfe9fb', day));
  X.fillStyle = sky; X.fillRect(wx, wy, ww, wh);
  if (day < .9) { X.fillStyle = rgba('#f4f1d6', 1 - day); X.beginPath(); X.arc(wx + 140, wy + 48, 20, 0, 7); X.fill(); X.fillStyle = mixc('#0c1433', '#7cc4f4', day); X.beginPath(); X.arc(wx + 150, wy + 42, 17, 0, 7); X.fill(); }
  if (day > .1) { X.globalAlpha = day; X.fillStyle = C.sunO; X.beginPath(); X.arc(wx + 50, wy + wh + 6, 34, Math.PI, 0); X.fill(); X.globalAlpha = 1; }
  X.fillStyle = C.frame; X.fillRect(wx + ww / 2 - 4, wy, 8, wh);
  X.fillStyle = rgba('#a8c8ff', .18); X.fillRect(wx + ww / 2 + 4, wy, (ww / 2 - 4) * (1 - open * .85), wh);
  if (open > 0) { X.fillStyle = rgba('#ffffff', .25); X.beginPath(); X.moveTo(wx + ww, wy); X.lineTo(wx + ww + 60 * open, wy + 14); X.lineTo(wx + ww + 60 * open, wy + wh - 14); X.lineTo(wx + ww, wy + wh); X.fill(); }
  // curtain
  const sway = open * (Math.sin(t * 3) * 14 + 20);
  X.fillStyle = mixc('#5b4ab0', '#ff9a8b', day); X.beginPath(); X.moveTo(wx - 22, wy - 18); X.lineTo(wx + 26, wy - 18); X.quadraticCurveTo(wx + 22 + sway, wy + wh / 2, wx + 30 + sway * 1.5, wy + wh + 20); X.lineTo(wx - 22, wy + wh + 20); X.fill();
  // clock
  X.fillStyle = '#e9e6ff'; X.beginPath(); X.arc(60, -460, 26, 0, 7); X.fill(); X.strokeStyle = C.frame; X.lineWidth = 4; X.beginPath(); X.moveTo(60, -460); X.lineTo(60, -478); X.moveTo(60, -460); X.lineTo(72, -460 + (t < 40 ? 0 : -6)); X.stroke();
  // poster
  X.fillStyle = C.frame; X.fillRect(-412, -392, 164, 134); X.fillStyle = mixc('#2d3a6e', '#ffd8a8', day); X.fillRect(-404, -384, 148, 118);
  X.fillStyle = C.poster; X.beginPath(); X.arc(-330, -300, 26, Math.PI, 0); X.fill(); X.fillStyle = '#5d8bd6'; X.fillRect(-404, -300, 148, 34);
  // sticky notes leave as colour comes back
  const notesLeft = Math.round(lerp(14, 2, ramp(t, T.color[0] + .6, T.color[1])));
  for (let i = 0; i < 14; i++) {
    const nx = 150 + (i % 5) * 34, ny = -360 + Math.floor(i / 5) * 36, gone = i >= notesLeft;
    const fall = gone ? clamp((t - (T.color[0] + .6 + (13 - i) * .1)) * 2.2) : 0;
    if (fall >= 1) continue;
    X.save(); X.translate(nx + 15, ny + 15 + fall * fall * 380); X.rotate((h2(i, 1) - .5) * .3 + fall * 2);
    X.fillStyle = [C.note, C.note2, '#9be7ff'][i % 3]; X.fillRect(-15, -15, 30, 30); X.restore();
  }
  // door
  const dx0 = 330, dw = 110, dh = 270, dOpen = ramp(t, T.open[0], T.open[1]);
  X.fillStyle = C.frame; X.fillRect(dx0 - 10, -dh - 10, dw + 20, dh + 10);
  if (dOpen > 0) { X.fillStyle = '#fff6dc'; X.fillRect(dx0, -dh, dw, dh); }
  X.save(); X.translate(dx0, 0); X.scale(1 - dOpen * .88, 1); shaded(rr(0, -dh, dw, dh, 4), C.door, C.doorD, 6); X.fillStyle = '#ffd166'; X.beginPath(); X.arc(dw - 16, -dh / 2, 6, 0, 7); X.fill(); X.restore();
  // floor
  X.fillStyle = C.floor; X.fillRect(-500, 0, 1000, 36); X.fillStyle = C.floorTop; X.fillRect(-500, 0, 1000, 6);
  // guitar
  X.save(); X.translate(30, -2); X.rotate(-.22);
  X.fillStyle = C.neck; X.fillRect(-6, -230, 12, 150);
  shaded(circ(0, -60, 34), C.guitar, C.guitarD, 5); shaded(circ(0, -108, 26), C.guitar, C.guitarD, 4);
  X.fillStyle = '#2a1a10'; X.beginPath(); X.arc(0, -82, 9, 0, 7); X.fill(); X.restore();
  // table with the glass — it grows into a mountain while getting up feels like a climb
  const mt = ramp(t, T.mountain[0], T.mountain[1]) * (1 - ramp(t, T.mountain[2], T.mountain[3])), lift = mt * 420;
  if (mt > 0) {
    shaded(poly([[-120, 0], [235, -lift - 108], [480, 0]]), mixc('#3e3a73', '#56509a', .5), '#2b2860', 18);
    X.fillStyle = '#f2f4ff'; X.beginPath(); X.moveTo(235, -lift - 108); X.lineTo(235 - lift * .19, -lift * .8 - 100); X.lineTo(235 + lift * .13, -lift * .82 - 100); X.fill();
  }
  X.save(); X.translate(0, -lift);
  X.fillStyle = C.tableD; X.fillRect(165, -108, 12, 108 + (lift ? -lift + lift : 0)); X.fillRect(295, -108, 12, 108);
  shaded(rr(150, -122, 175, 16, 4), C.table, C.tableD, 3);
  X.restore();
  return { lift };
}
function glassAt(t, lift) {
  // on the table, carried by the ghost, at Mira's mouth, then back on the bed
  const onTable = [240, -122 - lift];
  if (t < T.fetch[0]) return onTable;
  const g = ghostT(t); return t < T.drink[1] + .4 ? [g[0] + 34, g[1] + 28] : [-120, -108];
}
function drawGlass(x, y, full) {
  X.fillStyle = rgba(C.glass, .55); X.beginPath(); X.moveTo(x - 14, y - 42); X.lineTo(x + 14, y - 42); X.lineTo(x + 11, y); X.lineTo(x - 11, y); X.fill();
  if (full > 0) { const hh = 34 * full; X.fillStyle = C.water; X.beginPath(); X.moveTo(x - 11 - 3 * hh / 42, y - hh); X.lineTo(x + 11 + 3 * hh / 42, y - hh); X.lineTo(x + 10, y - 2); X.lineTo(x - 10, y - 2); X.fill(); }
  X.fillStyle = rgba('#ffffff', .6); X.fillRect(x - 9, y - 38, 3, 30);
}
function plant(t) {
  const perk = ramp(t, T.color[0], T.color[0] + 1.4), x = 125;
  shaded(poly([[x - 30, -56], [x + 30, -56], [x + 22, 0], [x - 22, 0]]), C.pot, C.potD, 4);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * .42, droop = (1 - perk) * (i < 3 ? -.9 : .9) * (Math.abs(i - 2.5) > 1 ? 1 : .6), len = 52 + (i % 2) * 14;
    X.save(); X.translate(x, -56); X.rotate(a + Math.PI / 2 + droop + Math.sin(t * 1.2 + i) * .04);
    shaded(elli(0, -len / 2, 13, len / 2), C.leaf, C.leafD, 3); X.restore();
  }
}
function bed() {
  X.fillStyle = C.bed; X.fillRect(-450, -64, 340, 64); X.fillRect(-460, -150, 22, 150);
  shaded(rr(-440, -94, 330, 34, 10), C.mattress, '#b9b3e6', 5);
  shaded(rr(-430, -118, 84, 30, 14), C.pillow, '#cdc8f0', 4);
}
function blanket() { shaded(rr(-350, -102, 200, 34, 14), C.blanket, C.blanketD, 6); }

/* ---------- the phone ---------- */
function phoneUI(t) {
  // drawn in phone-local units: the screen is 22 × 40, centred
  X.fillStyle = C.ui; X.fillRect(-11, -20, 22, 40);
  if (t < T.typing[0]) {
    text('03:00', 0, -10, 5.2, C.uiText, { weight: 300 }); text('четверг', 0, -5, 1.6, C.uiDim, { weight: 500 });
    return;
  }
  if (t < T.site) {
    X.fillStyle = C.uiCard; X.beginPath(); X.roundRect(-9.5, -17, 19, 3.6, 1.8); X.fill();
    const q = 'почему мне всё равно', n = Math.floor(q.length * prog(t, T.typing[0], T.typing[1]));
    X.font = '500 1.45px Inter'; X.textAlign = 'left'; X.textBaseline = 'middle'; X.fillStyle = C.uiText; X.fillText(q.slice(0, n), -8.3, -15.2);
    if (Math.floor(t * 2) % 2 && t < T.results) { const w = X.measureText(q.slice(0, n)).width; X.fillRect(-8.2 + w, -16.2, .15, 2); }
    if (t > T.results) {
      ['как перестать лениться', '10 способов взять себя в руки', 'апатия: что делать'].forEach((s, i) => {
        const a = ramp(t, T.results + i * .15, T.results + .3 + i * .15) * (t > T.havnCard ? .35 : 1);
        X.globalAlpha = a; X.fillStyle = C.uiCard; X.beginPath(); X.roundRect(-9.5, -11.5 + i * 4.6 + (i > 0 ? 7 : 0), 19, 3.8, 1); X.fill();
        X.font = '500 1.2px Inter'; X.fillStyle = C.uiDim; X.fillText(s, -8.3, -9.6 + i * 4.6 + (i > 0 ? 7 : 0)); X.globalAlpha = 1;
      });
    }
    if (t > T.havnCard) {
      const a = ramp(t, T.havnCard, T.havnCard + .4), sc = eBack(prog(t, T.havnCard, T.havnCard + .45));
      X.save(); X.translate(0, -4); X.scale(sc, sc); X.globalAlpha = a;
      glow(0, 0, 16, C.warm, .35 * a);
      X.fillStyle = '#f7fbff'; X.beginPath(); X.roundRect(-10, -3.4, 20, 6.8, 1.4); X.fill();
      X.fillStyle = C.sunO; X.beginPath(); X.arc(-7, .9, 1.9, Math.PI, 0); X.fill(); X.fillStyle = '#0b5a85'; X.fillRect(-9.2, .9, 4.4, .25);
      X.font = '900 1.7px Unb'; X.fillStyle = '#0b5a85'; X.fillText('HAVN', -4.2, -.9);
      X.font = '500 1.15px Inter'; X.fillStyle = '#41506f'; X.fillText('тихое место, когда тяжело', -4.2, 1.4);
      X.restore(); X.globalAlpha = 1;
      if (t > T.tap) { const k = prog(t, T.tap, T.tap + .4); X.strokeStyle = rgba('#ffffff', 1 - k); X.lineWidth = .3; X.beginPath(); X.arc(3, -4, 1 + k * 5, 0, 7); X.stroke(); }
    }
    return;
  }
  // the site: a calm sky with the sun on the horizon
  const g = X.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, '#9fd3f5'); g.addColorStop(1, C.sky); X.fillStyle = g; X.fillRect(-11, -20, 22, 40);
  X.fillStyle = C.sunO; X.beginPath(); X.arc(0, 4, 6, Math.PI, 0); X.fill(); X.fillStyle = C.sunI; X.beginPath(); X.arc(-.6, 3.4, 4, Math.PI, 0); X.fill();
  X.fillStyle = '#5ea6d6'; X.fillRect(-11, 4, 22, 16); X.fillStyle = '#0b5a85'; X.fillRect(-9, 4, 18, .3);
  X.font = '900 2.6px Unb'; X.textAlign = 'center'; X.fillStyle = '#0b5a85'; X.fillText('HAVN', 0, -11);
}
function phone(x, y, rot, t, glowA) {
  X.save(); X.translate(x, y); X.rotate(rot);
  X.fillStyle = '#0a0e22'; X.beginPath(); X.roundRect(-12.5, -22, 25, 44, 3.4); X.fill();
  X.save(); X.beginPath(); X.roundRect(-11, -20, 22, 40, 2); X.clip(); phoneUI(t); X.restore();
  X.restore();
  glow(x, y, 120, t > T.site ? C.warm : '#8fb4ff', glowA);
}

/* ---------- other islands ---------- */
function friendIsland(t) {
  const [x, y] = I1;
  island(ROCK1, x, y, C.grass);
  X.save(); X.translate(x + 120, y);
  X.fillStyle = '#6b4a2e'; X.fillRect(-8, -110, 16, 110); shaded(circ(0, -140, 58), '#43c27a', '#2f9a5e', 8); shaded(circ(-40, -110, 36), '#4fd28a', '#2f9a5e', 6);
  X.restore();
  const wave = t > T.friend && t < T.friend + 3 ? Math.sin(t * 12) * 18 : 0;
  person({ hip: [x - 40, y - 72], pose: 'stand', face: -1, col: { pants: '#3d2a5c' }, handF: [x - 70, y - 190 + wave], eyes: 'open', smile: 1 });
  if (t > T.friend + .3) { const a = ramp(t, T.friend + .3, T.friend + .7), s = eBack(prog(t, T.friend + .3, T.friend + .8)); X.save(); X.translate(x - 40, y - 250); X.scale(s, s); X.globalAlpha = a * (1 - ramp(t, 84, 85.5)); X.fillStyle = '#ffffff'; X.beginPath(); X.roundRect(-70, -34, 140, 60, 20); X.fill(); X.beginPath(); X.moveTo(-6, 24); X.lineTo(8, 24); X.lineTo(0, 40); X.fill(); text('я рядом', -10, -4, 22, '#2a2350', { weight: 600 }); heart(46, -2, 13, C.red); X.restore(); X.globalAlpha = 1; }
}
function specialistIsland(t) {
  const [x, y] = I2;
  island(ROCK2, x, y, '#5a4a96');
  X.save(); X.translate(x, y);
  shaded(rr(150, -96, 120, 96, 18), '#ff9a6b', '#e07a4d', 8); shaded(rr(150, -150, 30, 150, 12), '#ff9a6b', '#e07a4d', 5);
  X.fillStyle = '#d2603f'; X.beginPath(); X.moveTo(-230, -50); X.lineTo(-190, -50); X.lineTo(-196, 0); X.lineTo(-224, 0); X.fill();
  [0, 1, 2, 3].forEach(i => { X.save(); X.translate(-210, -50); X.rotate(-1.2 + i * .8); shaded(elli(0, -30, 10, 30), C.leaf, C.leafD, 3); X.restore(); });
  X.restore();
  person({ hip: [x + 200, y - 96], pose: 'sit', shin: 96, face: -1, col: { pants: '#2b3a5c' }, handF: [x + 160, y - 120], handB: [x + 150, y - 110], eyes: 'open', smile: .6, lean: .08 });
  X.fillStyle = '#fefefe'; X.save(); X.translate(x + 150, y - 118); X.rotate(-.3); X.fillRect(-14, -18, 26, 34); X.restore();
  if (t > T.listen) { const a = ramp(t, T.listen, T.listen + .4), s = eBack(prog(t, T.listen, T.listen + .5)); X.save(); X.translate(x + 150, y - 300); X.scale(s, s); X.globalAlpha = a; X.fillStyle = '#ffffff'; X.beginPath(); X.roundRect(-110, -36, 220, 66, 22); X.fill(); X.beginPath(); X.moveTo(20, 30); X.lineTo(40, 30); X.lineTo(34, 48); X.fill(); text('я тебя слушаю', 0, -3, 24, '#2a2350'); X.restore(); X.globalAlpha = 1; }
}

/* ---------- per-scene drawing ---------- */
function miraPose(t, lift) {
  const tired = { eyes: 'tired' };
  // sitting on the bed edge with the phone (until she stands)
  if (t < T.stand[0]) {
    const breathe = t > T.breath[0] && t < T.breath[3] ? (t < T.breath[1] ? ramp(t, T.breath[0], T.breath[1]) : 1 - ramp(t, T.breath[2], T.breath[3])) : 0;
    const upright = ramp(t, 44.6, 46);
    const hip = [-190, -92];
    const phonePos = [-150 + upright * 10, -150 + upright * 40];
    let handF = [phonePos[0] + 4, phonePos[1] + 14], handB = [phonePos[0] - 6, phonePos[1] + 16];
    if (t > T.fetch[2] - .1 && t < T.drink[1] + .3) { const g = glassAt(t, lift); handF = [g[0] - 4, g[1] - 12]; }
    if (t > 44.8) { handF = [hip[0] + 52, hip[1] + 6]; handB = [hip[0] + 40, hip[1] + 8]; }
    const eyes = t > 45.4 && t < 53.4 ? 'closed' : t > 43.3 ? 'open' : 'tired';
    return { hip, pose: 'sit', shin: 92, lean: lerp(.42, .06, upright) - breathe * .05, headTilt: lerp(.25, 0, upright), handF, handB, eyes, smile: t > 43.4 ? ramp(t, 43.4, 43.8) * .6 + (t > T.color[0] ? .4 : 0) : 0, phonePos, holdPhone: t < 44.8, tired };
  }
  if (t < T.walk[0] - .3) {
    // gets up, walks to the door, hesitates
    const up = ramp(t, T.stand[0], T.stand[1]), wk = ramp(t, T.walkIn[0], T.walkIn[1]), back = Math.sin(Math.PI * prog(t, T.hesitate[0], T.hesitate[1])) * 26;
    const x = lerp(-190, 250, wk) - back;
    return { hip: [x, lerp(-92, -70, up)], pose: 'stand', walk: (t - T.walkIn[0]) * 9 * (wk > 0 && wk < 1 ? 1 : 0), lean: .05, eyes: 'open', smile: .4 * (1 - ramp(t, T.hesitate[0], T.hesitate[0] + .3)) + .5 * ramp(t, T.open[0], T.open[1]) };
  }
  // outside: walking the bridge of stones
  const u = clamp((t - T.walk[0]) / (T.walk[1] - T.walk[0])), p = walkAt(eIO(u) * .55 + u * .45);
  const walking = t < T.walk[1];
  return { hip: [p[0], p[1] - 70], pose: 'stand', walk: walking ? t * 9 : 0, lean: walking ? .08 : 0, eyes: 'open', smile: 1, handF: t > T.ownLight ? [p[0] + 26, p[1] - 92] : null, handB: t > T.ownLight ? [p[0] + 16, p[1] - 90] : null };
}

function drawWorld(t) {
  CAM = camAt(t);
  const st = state(t);
  space(t, st);
  // --- room island: drawn into a layer, then composited with its saturation ---
  RX.setTransform(1, 0, 0, 1, 0, 0); RX.clearRect(0, 0, W, H);
  X = RX; view(1, RX);
  floaters(t, 0, 0, 7, 9, 1300);
  island(ROCK0, 0, 0, null);
  const r = room(t, st); bed();
  const m = miraPose(t, r.lift);
  plant(t);
  if (t < T.walk[0] - .3) {
    person(Object.assign({}, m));
    blanket();
  }
  const gl = glassAt(t, r.lift), full = 1 - ramp(t, T.drink[0], T.drink[1]);
  drawGlass(gl[0], gl[1], full);
  // battery and message counter hovering over Mira
  if (t > T.battery && t < 16.6) {
    const s = eBack(prog(t, T.battery, T.battery + .5)) * (1 - ramp(t, 16.0, 16.5));
    X.save(); X.translate(-210, -300); X.scale(s, s);
    X.strokeStyle = '#e9edff'; X.lineWidth = 5; X.beginPath(); X.roundRect(-46, -22, 92, 44, 8); X.stroke(); X.fillStyle = '#e9edff'; X.fillRect(46, -8, 8, 16);
    X.fillStyle = C.red; X.fillRect(-40, -16, 6 + Math.sin(t * 6) * 1.5, 32); text('2%', 0, 44, 26, '#e9edff'); X.restore();
  }
  if (t > T.msgs[0] && t < 16.6) {
    const s = eBack(prog(t, T.msgs[0], T.msgs[0] + .5)) * (1 - ramp(t, 16.0, 16.5)), n = Math.round(lerp(3, 47, eOut(prog(t, T.msgs[0], T.msgs[1]))));
    X.save(); X.translate(-60, -330); X.scale(s, s); X.fillStyle = '#e9edff'; X.beginPath(); X.roundRect(-40, -28, 80, 50, 14); X.fill(); X.beginPath(); X.moveTo(-14, 20); X.lineTo(-30, 36); X.lineTo(4, 20); X.fill();
    X.fillStyle = C.red; X.beginPath(); X.arc(38, -26, 20, 0, 7); X.fill(); text(String(n), 38, -26, 20, '#fff', { weight: 700 }); X.restore();
  }
  // grey notes from the silent guitar (colourful again later)
  if (t > T.guitarNotes && t < 13) for (let i = 0; i < 3; i++) { const a = t - T.guitarNotes - i * .6; if (a < 0 || a > 2.4) continue; X.globalAlpha = .5 * (1 - a / 2.4); text('♪', 30 + i * 18, -170 - a * 50, 34, '#c9c9d6'); X.globalAlpha = 1; }
  if (t > T.color[0] + .8 && t < T.color[1] + 2) for (let i = 0; i < 4; i++) { const a = t - T.color[0] - .8 - i * .5; if (a < 0 || a > 2.2) continue; X.globalAlpha = 1 - a / 2.2; text('♪', 30 + i * 20 + Math.sin(a * 4) * 8, -170 - a * 60, 40, [C.note, C.note2, '#9be7ff', '#b8f2a0'][i]); X.globalAlpha = 1; }
  // phone in her hands
  if (m.holdPhone) phone(m.phonePos[0], m.phonePos[1], -.25, t, t < 16.6 ? .25 : t < 31 ? .45 : .2);
  // composite the room with apathy's saturation
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `saturate(${st.sat}) brightness(${lerp(.82, 1, st.sat)})`; ctx.drawImage(ROOM, 0, 0); ctx.filter = 'none';
  X = ctx; view(1);
  // --- darkness with the flashlight cutting through it ---
  const g = t >= T.ghostPop ? ghostT(t) : null;
  let aimT = null;
  if (g && t > T.flash) {
    if (t < T.search[0]) aimT = [g[0] + 120, g[1] + 120];
    else if (t < T.onGlass) { const u = prog(t, T.search[0], T.search[1]); aimT = [lerp(-380, 240, u) + Math.sin(u * 9) * 60, -250 + Math.sin(u * 6) * 90]; aimT = [lerp(aimT[0], 240, ramp(t, T.search[1] - .4, T.onGlass)), lerp(aimT[1], -150 - r.lift, ramp(t, T.search[1] - .4, T.onGlass))]; }
    else if (t < T.fetch[0]) aimT = [240, -150];
    else if (t < T.window[0]) aimT = [-120, -150];
    else if (t < T.window[1] + .8) aimT = [-25, -330];
    else if (t < T.msg[2] + .6) aimT = [m.phonePos ? m.phonePos[0] : -150, m.phonePos ? m.phonePos[1] : -150];
    else if (t < T.breath[0]) aimT = [-180, -150];
    else if (t > T.onDoor - .3 && t < T.open[1]) aimT = [385, -140];
  }
  if (st.dark > 0) {
    DX.setTransform(1, 0, 0, 1, 0, 0); DX.clearRect(0, 0, W, H); DX.fillStyle = `rgba(4,6,20,${st.dark})`; DX.fillRect(0, 0, W, H);
    view(1, DX); DX.globalCompositeOperation = 'destination-out';
    const hole = (x, y, rad, a) => { const gg = DX.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, `rgba(0,0,0,${a})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); DX.fillStyle = gg; DX.beginPath(); DX.arc(x, y, rad, 0, 7); DX.fill(); };
    if (g) hole(g[0], g[1], 160, .9);
    if (aimT) { hole(aimT[0], aimT[1], 120, 1); const ang = Math.atan2(aimT[1] - g[1], aimT[0] - g[0]), nx = -Math.sin(ang), ny = Math.cos(ang); DX.fillStyle = 'rgba(0,0,0,.75)'; DX.beginPath(); DX.moveTo(g[0] + 30, g[1] + 16); DX.lineTo(aimT[0] + nx * 50, aimT[1] + ny * 50); DX.lineTo(aimT[0] - nx * 50, aimT[1] - ny * 50); DX.closePath(); DX.fill(); }
    if (m.holdPhone) hole(m.phonePos[0], m.phonePos[1], 90, .6);
    DX.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(DARK, 0, 0); view(1);
  }
  // little lights that leave the room after each small thing and become stones outside
  T.orbs.forEach((t0, i) => {
    const a = t - t0; if (a < 0 || a > 1.6) return;
    const src = [[-120, -170], [-25, -330], [-150, -170]][i], dst = [STONES[i].x, STONES[i].y - 12], u = eIO(clamp(a / 1.4));
    const x = lerp(src[0], dst[0], u), y = lerp(src[1], dst[1], u) - Math.sin(u * Math.PI) * 160;
    glow(x, y, 60, C.warm, .8 * (1 - prog(a, 1.3, 1.6))); X.fillStyle = '#fff6d6'; X.beginPath(); X.arc(x, y, 8, 0, 7); X.fill();
  });
  // the bridge of stones
  STONES.forEach((s, i) => {
    const lit = stoneLit(s, i, t);
    const dim = .25;
    X.globalAlpha = Math.max(dim * ramp(t, 54, 57), lit);
    if (X.globalAlpha > 0) { const bob = Math.sin(t * 1.2 + i) * 3; shaded(elli(s.x, s.y + bob + 8, 44, 14), mixc('#3d3578', '#ffd98a', lit), mixc('#1d1940', '#e0a84f', lit), 4); glow(s.x, s.y + bob, 70, C.warm, .45 * lit); }
    X.globalAlpha = 1;
  });
  // the other islands
  if (t > 63.6) { friendIsland(t); specialistIsland(t); }
  // Mira outside
  if (t >= T.walk[0] - .3) {
    person(m);
    if (t > T.ownLight) { const a = ramp(t, T.ownLight, T.ownLight + 1.2), p = m.hip; glow(p[0] + 26, p[1] - 28, 160, C.warm, .7 * a); X.fillStyle = rgba('#fff6d6', a); X.beginPath(); X.arc(p[0] + 26, p[1] - 28, 11, 0, 7); X.fill(); }
  }
  // the ghost
  if (g && t < T.star + .2) {
    const pop = eBack(prog(t, T.ghostPop, T.ghostPop + .5));
    let sc = pop * (t < T.breath[0] ? 1 : 1);
    if (t > T.breath[0] && t < T.breath[3]) sc *= 1 + .35 * (t < T.breath[1] ? ramp(t, T.breath[0], T.breath[1]) : 1 - ramp(t, T.breath[2], T.breath[3]));
    if (t > T.ghostUp[0]) sc *= lerp(1, .15, ramp(t, T.ghostUp[0], T.ghostUp[1]));
    const bob = Math.sin(t * 2.2) * 6, waving = (t > T.wave[0] && t < T.wave[1]) || (t > T.ghostBye[0] && t < T.ghostBye[1]);
    if (aimT) { const lens = [g[0] + 46 * sc, g[1] + bob + 16 * sc]; beam(lens[0], lens[1], aimT[0], aimT[1], ramp(t, T.flash, T.flash + .3), 100); }
    drawGhost(t, g[0], g[1] + bob, sc, { flash: t > T.flash && t < 64.3, wave: waving, aim: aimT ? Math.atan2(aimT[1] - g[1], aimT[0] - g[0]) : 0, look: t > T.search[0] && t < T.onGlass ? Math.sin(t * 2) : 0 });
    // breathing count
    if (t > T.breath[0] - .2 && t < T.breath[3] + .3) {
      const inh = t < T.breath[2], t0 = inh ? T.breath[0] : T.breath[2], n = Math.min(4, Math.floor((t - t0) / ((T.breath[1] - T.breath[0]) / 4)) + 1);
      for (let i = 0; i < 4; i++) { X.fillStyle = i < n ? C.warm : rgba('#ffffff', .25); X.beginPath(); X.arc(g[0] - 45 + i * 30, g[1] - 90, 8, 0, 7); X.fill(); }
      text(inh ? 'вдох' : 'выдох', g[0], g[1] - 125, 26, '#ffffff', { alpha: .9 });
    }
  }
  // swirling light leaving the phone screen
  if (t > T.swirl && t < T.ghostPop + .6) for (let i = 0; i < 18; i++) { const a = (t - T.swirl) * 3 + i * .35, r0 = 20 + (t - T.swirl) * 40 * (i % 3 + 1); const x = -150 + Math.cos(a) * r0, y = -150 + Math.sin(a) * r0 * .6 - (t - T.swirl) * 30; glow(x, y, 26, i % 2 ? C.warm : '#bfe0ff', .6 * (1 - prog(t, T.ghostPop, T.ghostPop + .6))); }
  // message to mom
  if (t > T.msg[0] && t < T.msg[2] + 1.6) {
    const u = eIO(prog(t, T.msg[1], T.msg[1] + 1)), a = 1 - ramp(t, T.msg[2] + 1, T.msg[2] + 1.6);
    X.save(); X.translate(lerp(-150, 60, u), lerp(-200, -380, u)); X.globalAlpha = a * ramp(t, T.msg[0], T.msg[0] + .2);
    X.fillStyle = '#8fb4ff'; X.beginPath(); X.roundRect(-38, -24, 76, 44, 16); X.fill(); text('ок', 0, -2, 26, '#0b1030', { weight: 700 }); X.restore();
    if (t > T.msg[2]) { const s = eBack(prog(t, T.msg[2], T.msg[2] + .4)); X.save(); X.translate(100, -430); X.scale(s, s); X.globalAlpha = a; X.fillStyle = '#fff'; X.beginPath(); X.roundRect(-60, -26, 120, 48, 16); X.fill(); text('мама', -12, -1, 20, '#5a5f86'); heart(36, 0, 12, C.red); X.restore(); }
    X.globalAlpha = 1;
  }
  // the white door light swallowing the frame
  const wf = Math.sin(Math.PI * prog(t, T.flashW[0], T.flashW[1] + .35));
  if (t > T.open[0]) glow(385, -140, 500, '#fff3d0', .7 * ramp(t, T.open[0], T.open[1]) * (t < 64.3 ? 1 : 0));
  // the star and the HAVN mark
  if (t > T.star - .2) {
    const sx = 1400, sy = -1350, k = ramp(t, T.star - .2, T.star + .4), lg = ramp(t, T.logo[0], T.logo[1]);
    glow(sx, sy, lerp(80, 420, lg), C.warm, .9 * k);
    if (lg > 0) {
      X.save(); X.translate(sx, sy); X.globalAlpha = lg;
      X.fillStyle = C.sunO; X.beginPath(); X.arc(0, 40, 150 * eBack(lg), Math.PI, 0); X.fill(); X.fillStyle = C.sunI; X.beginPath(); X.arc(-14, 26, 104 * eBack(lg), Math.PI, 0); X.fill();
      X.fillStyle = '#e9f4ff'; X.fillRect(-300 * lg, 40, 600 * lg, 8); X.globalAlpha = lg * .7; X.fillRect(-170 * lg, 76, 340 * lg, 7); X.globalAlpha = lg * .45; X.fillRect(-90 * lg, 108, 180 * lg, 6);
      X.restore(); X.globalAlpha = 1;
      const na = ramp(t, T.name, T.name + .6), ta = ramp(t, T.tag, T.tag + .6), da = ramp(t, T.note, T.note + .8);
      X.save(); X.translate(sx, sy + 230 + (1 - na) * 30); text('HAVN', 0, 0, 120, '#ffffff', { font: 'Unb', weight: 900, alpha: na }); X.restore();
      text('тихое место, когда тяжело', sx, sy + 340 + (1 - ta) * 20, 46, '#cfe0ff', { weight: 500, alpha: ta });
      text('Если тебе очень плохо прямо сейчас — обратись к специалисту или на линию помощи.', sx, sy + 440, 32, '#8a94c4', { weight: 500, alpha: da });
    }
  }
  if (t > T.ghostUp[1] - .3 && t < T.star + .5) glow(1400, -1350, 60, '#ffffff', 1 - ramp(t, T.star, T.star + .5));
  // flash overlay and fades
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (wf > 0) { ctx.fillStyle = `rgba(255,246,222,${wf})`; ctx.fillRect(0, 0, W, H); }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,10,.35)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const fade = Math.max(1 - prog(t, 0, .8), prog(t, DUR - .8, DUR));
  if (fade > 0) { ctx.fillStyle = `rgba(4,6,16,${fade})`; ctx.fillRect(0, 0, W, H); }
  // dust in front of the lens, out of focus
  ctx.save(); ctx.filter = 'blur(6px)'; view(1.35);
  for (let i = 0; i < 14; i++) { const x = CAM.x * 1.35 + ((h2(i, 1) * 3000 + t * 12) % 3000) - 1500, y = CAM.y * 1.35 + ((h2(i, 2) * 2000 - t * 8) % 2000 + 2000) % 2000 - 1000; ctx.fillStyle = rgba('#cfe0ff', .12); ctx.beginPath(); ctx.arc(x, y, 6 + h2(i, 3) * 10, 0, 7); ctx.fill(); }
  ctx.restore(); ctx.filter = 'none';
}

/* ---------- motion blur on fast camera moves ---------- */
const ACC = mk(W, H), AX = ACC.getContext('2d');
function camSpeed(t) { const a = camAt(t - 1 / 120), b = camAt(t + 1 / 120); return Math.hypot(b.x - a.x, b.y - a.y) * b.z + Math.abs(Math.log(b.z / a.z)) * 1400 + Math.abs(b.r - a.r) * 900; }
window.renderFrame = t => {
  const n = clamp(Math.ceil(camSpeed(t) / 10), 1, 6);
  if (n === 1) { drawWorld(t); return; }
  AX.clearRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { drawWorld(t + (i / (n - 1) - .5) / 120); AX.globalAlpha = 1 / (i + 1); AX.drawImage(cv, 0, 0); }
  AX.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ACC, 0, 0);
};

/* ---------- sound cues ---------- */
function buildCues() {
  cue('pop', T.battery); cue('pop', T.msgs[0]); for (let k = 0; k < 10; k++) cue('blip', T.msgs[0] + k * .18, { i: k });
  cue('rumble', T.mountain[0], { d: 1.2 }); cue('rumble', T.mountain[2], { d: 1.0, g: .6 });
  cue('whoosh', 16.6, { d: 1.2 }); for (let k = 0; k < 20; k++) cue('key', T.typing[0] + k * (T.typing[1] - T.typing[0]) / 20);
  cue('blip', T.results, { i: 2 }); cue('chime', T.havnCard); cue('tap', T.tap); cue('swell', T.site, { d: 2.6 });
  cue('sparkle', T.swirl, { d: 1.2 }); cue('pop', T.ghostPop, { big: 1 }); cue('click', T.flash);
  cue('dark', T.dark[0]); cue('ding', T.onGlass, { i: 0 });
  cue('whoosh', T.fetch[0], { d: .5, g: .5 }); cue('gulp', T.drink[0] + .1); cue('creak', T.window[0]); cue('wind', T.window[1] - .2, { d: 2.4 }); cue('tap', T.msg[0]); cue('send', T.msg[1]); cue('pop', T.msg[2]);
  T.orbs.forEach((t0, i) => { cue('rise', t0, { d: 1.2 }); cue('ding', t0 + 1.1, { i: i + 1 }); });
  cue('breathIn', T.breath[0], { d: T.breath[1] - T.breath[0] }); cue('breathOut', T.breath[2], { d: T.breath[3] - T.breath[2] });
  cue('bloom', T.color[0], { d: 3.6 }); cue('whoosh', 56.0, { d: .9, g: .6 });
  cue('rustle', T.stand[0], { d: .8 }); for (let k = 0; k < 4; k++) cue('step', T.walkIn[0] + k * .45);
  cue('click', T.onDoor); cue('creak', T.open[0]); cue('swell', T.open[0], { d: 1.6, g: 1.3 }); cue('whoosh', 63.4, { d: .9 });
  for (let k = 0; k < 13; k++) cue('ding', 64.6 + k * .45, { i: 4 + k, soft: 1 });
  for (let k = 0; k < 14; k++) cue('step', T.walk[0] + .2 + k * (T.walk[1] - T.walk[0]) / 15);
  cue('pop', T.friend + .3); cue('pop', T.listen);
  cue('sparkle', T.ownLight, { d: 1.6 }); cue('sparkle', T.ghostUp[0], { d: 3.6 }); cue('ding', T.star, { i: 20 });
  cue('swell', T.logo[0], { d: 2.0, g: 1.2 }); cue('chime', T.name);
}

window.ready = (async () => {
  for (const [fam, url, d] of [['Inter', 'fonts/inter-cyrillic.woff2', { weight: '200 600', unicodeRange: 'U+0400-045F' }], ['Inter', 'fonts/inter-latin.woff2', { weight: '200 600', unicodeRange: 'U+0000-00FF,U+2000-206F,U+2190-266F' }],
    ['Unb', 'fonts/unbounded-cyrillic-900-normal.woff2', { weight: '900', unicodeRange: 'U+0400-045F' }], ['Unb', 'fonts/unbounded-latin-900-normal.woff2', { weight: '900', unicodeRange: 'U+0000-00FF' }]]) { const f = new FontFace(fam, `url(${url})`, d); await f.load(); document.fonts.add(f); }
  buildCues(); window.SFX = SFX;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { renderFrame(+q.get('t')); return true; }
  if (!q.has('render')) { const t0 = performance.now(); const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
  return true;
})();
