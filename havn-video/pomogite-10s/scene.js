/* HAVN · «Помогите нам» — 10 s, 1080×1920, soft ink + cut paper.
   One continuous glide down the table: «пожалуйста, помогите нам» →
   copy the link → the copy glides as a paper plane to a person sitting
   alone, who lights up → «спасибо». */
'use strict';

const DUR = 10.0;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae' });

const CX = 540, PERSON = [560, 3210];
const CAMK = [
  [0.00, 540, 900, 1.06, -0.6],
  [2.40, 540, 960, 1.00, 0.4],
  [3.25, 540, 1880, 1.00, -0.4],
  [5.30, 540, 1900, 1.02, 0.3],
  [6.15, 540, 2850, 1.00, -0.3],
  [7.90, 540, 2870, 0.98, 0.3],
  [8.60, 540, 3780, 1.02, -0.2],
  [10.0, 540, 3790, 1.07, 0.0]
];
const SHAKES = [];

const T = {
  pozh: [0.2, 0.85], pomog: 0.65, nam: 1.25, card: 1.6,
  skop: [3.0, 3.6], plate: 3.1, finger: [3.65, 4.05], ring: [4.1, 4.65], copied: 4.7, fingerOut: 4.8,
  strip: 5.0, fold: 5.2, fly: [5.55, 6.75], lit: 6.7,
  otpr: [5.9, 6.6], komu: [6.6, 7.25],
  spas: [8.45, 9.05], heart: [8.85, 9.5], link: 8.7, pinned: 9.0
};

const A = {};
const ell = (w, h, n = 64) => arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, n);
function rrect(x0, y0, w, h, r) {
  const pts = [], q = Math.PI / 2;
  [[x0 + w - r, y0 + r, -q], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, q], [x0 + r, y0 + r, 2 * q]].forEach(([cx, cy, a]) => { for (let i = 0; i <= 8; i++) { const b = a + q * i / 8; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); } });
  return pts;
}
const BODY = [[0, 150], [6, 50], [30, 12], [70, 0], [110, 12], [134, 50], [140, 150]];
// sprites are built at twice the size so the big close-up of the first person stays crisp
function person(color, seed) {
  return { head: card(156, 156, { seed, color, shape: ell(156, 156, 40), tex: .7 }), body: card(280, 300, { seed: seed + 1, color, shape: BODY.map(p => [p[0] * 2, p[1] * 2]), tex: .8 }) };
}
const COLS = [PAL.sea2, PAL.orange, PAL.deep, '#7fb6a4', '#e3a35b', '#9a8fc9'];

function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];

  A.grey = person(PAL.lonely, 1);
  A.col = COLS.map((c, i) => person(c, 10 + i * 2));
  A.sun = card(124, 124, { seed: 30, color: PAL.sunO, shape: ell(124, 124, 40) });
  const CL = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, s = Math.sin(a); CL.push([140 + 132 * Math.cos(a), 100 + 52 * s - (s < 0 ? 44 * Math.abs(Math.sin(a * 2.5)) : 0)]); }
  A.cloud = card(280, 180, { seed: 31, color: '#d3d7db', shape: CL, tex: .6 });
  A.tear = card(30, 44, { seed: 32, color: '#bfe3f7', shape: [[15, 0], [29, 24], [24, 41], [6, 41], [1, 24]] });

  A.pozh = inkText('пожалуйста,', 100, PAL.ink, { seed: 40 });
  A.pomog = cutWord('ПОМОГИТЕ', 116, PAL.orange, { seed: 41 });
  A.nam = cutWord('НАМ', 230, PAL.orange, { seed: 42 });
  A.small = card(300, 190, { seed: 43, color: '#fffdf7', shape: rrect(0, 0, 300, 190, 32), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx, cy - 14, 38, Math.PI, 0); x.fill();
    x.strokeStyle = PAL.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 66, cy - 12); x.lineTo(cx + 66, cy - 12); x.stroke();
    x.font = '900 44px Unb'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.deep; x.fillText('HAVN', cx, cy + 42);
  } });

  A.skop = inkText('скопируйте ссылку', 100, PAL.ink, { seed: 50 });
  A.plate = card(860, 150, { seed: 51, color: PAL.deep, content: (x, cx, cy) => {
    x.font = '600 54px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText('havnhelp.netlify.app', cx - 380, cy + 2);
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.lineJoin = 'round';
    x.beginPath(); x.roundRect(cx + 300, cy - 30, 44, 50, 8); x.stroke();
    x.fillStyle = PAL.deep; x.beginPath(); x.roundRect(cx + 316, cy - 14, 44, 50, 8); x.fill(); x.stroke();
  } });
  A.finger = card(130, 560, { seed: 52, color: PAL.skin, shape: rrect(0, 0, 130, 560, 62), tex: .5, content: (x, cx, cy) => {
    x.fillStyle = '#f8ddc6'; x.beginPath(); x.roundRect(cx - 38, cy - 268, 76, 84, 30); x.fill();
    x.strokeStyle = 'rgba(160,110,80,.5)'; x.lineWidth = 4; x.lineCap = 'round';
    [-60, -40].forEach(d => { x.beginPath(); x.moveTo(cx - 34, cy + d); x.lineTo(cx + 34, cy + d + 2); x.stroke(); });
  } });
  A.copied = label('ссылка скопирована', '600 46px Inter', { seed: 53, h: 104, color: '#fff4dc', torn: false, shape: rrect(0, 0, textW('ссылка скопирована', '600 46px Inter') + 150, 104, 50), dy: 0 });
  A.fold = [
    card(560, 96, { seed: 54, color: '#ffffff', content: printed('havnhelp.netlify.app', '600 40px Inter', PAL.deep, 2) }),
    card(330, 120, { seed: 55, color: '#ffffff', shape: [[0, 0], [330, 50], [330, 70], [0, 120]] }),
    card(250, 110, { seed: 56, color: '#ffffff', shape: [[0, 0], [250, 62], [24, 110], [52, 66]], content: (x, cx, cy) => { x.strokeStyle = 'rgba(24,41,59,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 73, cy + 11); x.lineTo(cx + 125, cy + 7); x.stroke(); } })
  ];

  A.otpr = inkText('и отправьте тому,', 92, PAL.ink, { seed: 60 });
  A.komu = inkText('кому одиноко', 120, PAL.orange, { seed: 61 });

  A.spas = inkText('спасибо', 170, PAL.ink, { seed: 70 });
  A.link = card(600, 92, { seed: 71, color: PAL.deep, content: printed('havnhelp.netlify.app', '600 46px Inter', '#ffffff', 2) });
  A.pinned = label('ссылка — в закреплённом комментарии ↓', '600 38px Inter', { seed: 72, h: 92, color: PAL.cream, dy: 0 });

  const DR = mulberry32(7); A.decor = [];
  for (let i = 0; i < 16; i++) A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: CX + (i % 2 ? -1 : 1) * (600 + DR() * 220), y: 300 + i * 230 + (DR() - .5) * 120, rot: (DR() - .5) * .8, h: DR() * .05 });
}
function textW(s, font) { const m = mk(10, 10).getContext('2d'); m.font = font; return m.measureText(s).width; }

/* ---------- helpers ---------- */
const dist = (p) => Math.hypot((CAM.x - p[0]) * .6, CAM.y - p[1]);
// cut letters that float in one after another
function floatWord(wd, cx, cy, t, t0, o = {}) {
  wd.letters.forEach((L, j) => {
    const d = drop(t, t0 + j * (o.stagger == null ? .06 : o.stagger), 1.0); if (!d) return;
    drawSp(L.sp, cx + L.dx, cy - d.lift * 70 + Math.sin(t * 1.2 + j) * 3, { h: o.h || .05, lift: d.lift, rot: (h2(j, (o.seed || 1) * 7) - .5) * .06 + (h2(j, 33) - .5) * .3 * d.lift, alpha: d.a * (o.alpha == null ? 1 : o.alpha) });
  });
}
// ink that is written on, and later rises and fades away
function inkIn(it, x, y, t, w, o = {}) {
  const out = o.out ? eIO(prog(t, o.out, o.out + .7)) : 0;
  if (out >= 1) return;
  drawInk(it, x, y - out * 50, { t, p: eSine(prog(t, w[0], w[1])), h: o.h || .045, rot: o.rot || 0, seed: o.seed || 0, alpha: 1 - out, align: o.align });
}
function glow(x, y, r, col, a, h) {
  if (a <= 0) return;
  layer(h || .008); const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A', (.55 * a).toFixed(3))); g.addColorStop(1, col.replace('A', '0'));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/* a paper person standing at (x, y); lit fades them from grey and sad to colour, a smile and their own sun */
function drawPerson(x, y, s, litT, ci, t, seed, o = {}) {
  const k = litT == null ? 0 : eIO(prog(t, litT, litT + 1.0)), P = A.col[ci % COLS.length], G = A.grey;
  const br = Math.sin(t * 1.4 + seed) * 2.5 * s;            // breathing
  const by = y - 75 * s, hy = y - 190 * s + br - k * 6 * s;
  glow(x, hy, 230 * s, 'rgba(255,196,120,A)', k, .008);
  const sc = s / 2;
  if (k < 1) { drawSp(G.body, x, by, { h: .01, sc, elev: 4 }); drawSp(G.head, x, hy, { h: .012, sc, elev: 4 }); }
  if (k > 0) { drawSp(P.body, x, by, { h: .01, sc, elev: 4, alpha: k, shadow: k >= 1 }); drawSp(P.head, x, hy, { h: .012, sc, elev: 4, alpha: k, shadow: k >= 1 }); }
  const L = { t, h: .014, dbl: false, gaps: false, amp: 1.2 };
  const look = (1 - k) * 5 * s;
  [-1, 1].forEach((d, i) => inkLine(arc(x + d * 14 * s, hy - 4 * s + look, 4 * s, 4 * s, 0, Math.PI * 2, 8), Object.assign({}, L, { w: 7 * s, seed: seed + 1 + i })));
  if (k < 1) inkLine(arc(x, hy + 24 * s, 13 * s, 8 * s, Math.PI * 1.2, Math.PI * 1.8, 10), Object.assign({}, L, { w: 4.5 * s, seed: seed + 3, alpha: 1 - k }));
  if (k > 0) inkLine(arc(x, hy + 4 * s, 15 * s, 11 * s, Math.PI * .15, Math.PI * .85, 10), Object.assign({}, L, { w: 4.5 * s, seed: seed + 4, alpha: k }));
  if (o.tear != null && t > o.tear) {
    const u = eSine(prog(t, o.tear, o.tear + 2.6)), a = (1 - k) * (1 - prog(t, o.tear + 3.2, o.tear + 3.8));
    if (a > 0) drawSp(A.tear, x - 16 * s, hy + 6 * s + u * 34 * s, { h: .016, sc: s * .5, elev: 2, alpha: a });
  }
  // the rain cloud drifts up and away as the light comes
  const kc = eOut(clamp(k * 1.8));
  if (kc < 1) {
    const cx = x + kc * 150 * s, cy = hy - 110 * s - kc * 90 * s + Math.sin(t * .9 + seed) * 4 * s;
    for (let r = 0; r < 4; r++) {
      const ph = (t * .9 + r * .27 + h2(seed, r)) % 1, rx = cx - 39 * s + r * 26 * s, ry = cy + 28 * s + ph * 70 * s;
      inkLine(seg([rx, ry], [rx - 4 * s, ry + 16 * s], 5), { t, seed: seed + 6 + r, w: 3.5 * s, h: .015, alpha: (1 - kc) * Math.sin(ph * Math.PI) * .8, gaps: false, dbl: false, color: PAL.deep, amp: .6 });
    }
    drawSp(A.cloud, cx, cy, { h: .016, sc: s / 2, elev: 3, alpha: 1 - kc });
  }
  if (k > 0) {
    const sy = hy - 100 * s, ss = s * (.25 + .25 * eOut(k));
    drawSp(A.sun, x, sy, { h: .018, elev: 3, sc: ss, alpha: k });
    for (let r = 0; r < 8; r++) { const a = r * Math.PI / 4 + t * .25; inkLine(seg([x + Math.cos(a) * 42 * s, sy + Math.sin(a) * 42 * s], [x + Math.cos(a) * 58 * s, sy + Math.sin(a) * 58 * s], 5), { t, seed: seed + 10 + r, w: 4 * s, h: .018, alpha: k, gaps: false, dbl: false, color: PAL.sunO, amp: .8 }); }
  }
}

/* ---------- the one long scene ---------- */
function plea(t) {
  inkIn(A.pozh, CX - 120, 560, t, T.pozh, { rot: -.03, seed: 1 });
  floatWord(A.pomog, CX, 740, t, T.pomog, { seed: 41, stagger: .05 });
  floatWord(A.nam, CX, 960, t, T.nam, { h: .06, seed: 42, stagger: .12 });
  const d = drop(t, T.card, 1.1);
  if (d) drawSp(A.small, CX + 250, 1230 - d.lift * 60, { h: .02, lift: d.lift, rot: .06, elev: 7, alpha: d.a });
}

function copyLink(t) {
  inkIn(A.skop, CX, 1640, t, T.skop, { rot: -.02, seed: 2 });
  const pd = drop(t, T.plate, 1.0), plY = 1840, icon = [CX + 338, plY + 2];
  if (pd) drawSp(A.plate, CX, plY - pd.lift * 70, { h: .03, lift: pd.lift, rot: -.012, elev: 8, alpha: pd.a });
  if (t > T.ring[0]) inkLine(arc(icon[0], icon[1], 66, 66, -Math.PI / 2, Math.PI * 1.5, 50), { t, seed: 220, w: 7, h: .045, p: eSine(prog(t, T.ring[0], T.ring[1])), color: PAL.orange, gaps: false, amp: 1 });
  if (t > T.finger[0] && t < T.fingerOut + .7) {
    const inn = eIO(prog(t, T.finger[0], T.finger[1])), outU = eIO(prog(t, T.fingerOut, T.fingerOut + .6));
    const press = eSine(prog(t, T.finger[1] - .1, T.finger[1] + .15)) * (1 - prog(t, T.fingerOut - .1, T.fingerOut + .1));
    const k = (1 - inn) + outU, ang = -.42;
    const tipX = icon[0] + 14 + Math.sin(-ang) * k * 700, tipY = icon[1] + 24 + Math.cos(ang) * k * 700;
    drawSp(A.finger, tipX - Math.sin(ang) * 255, tipY + Math.cos(ang) * 255, { h: .05 - press * .006, lift: .3 - press * .22, rot: ang, elev: 10 });
  }
  if (t > T.copied) {
    const u = eOut(prog(t, T.copied, T.copied + .45)), lx = CX - 80;
    drawSp(A.copied, lx, 2020 - (1 - u) * 30, { h: .05, rot: -.02, sc: .92 + .08 * u, alpha: u, elev: 6, lift: (1 - u) * .3 });
    const rx = lx + A.copied.w / 2 - PAD;
    inkLine(chain([rx + 24, 2015], [rx + 48, 2041], [rx + 92, 1985]), { t, seed: 221, w: 9, h: .052, p: eOut(prog(t, T.copied + .2, T.copied + .5)), color: PAL.orange, dbl: false, gaps: false, amp: .8 });
  }
  // the copy lifts off, folds into a plane and glides down to the person sitting alone
  if (t > T.strip) {
    const fu = eIO(prog(t, T.fly[0], T.fly[1])), lu = eIO(prog(t, T.strip, T.strip + .45));
    const P0 = [CX - 20, plY - 30 - lu * 160], C1 = [CX + 600, plY - 300], C2 = [CX + 650, PERSON[1] - 700], P1 = [PERSON[0] + 150, PERSON[1] - 40];
    const bz = (u) => [0, 1].map(c => (1 - u) ** 3 * P0[c] + 3 * (1 - u) ** 2 * u * C1[c] + 3 * (1 - u) * u * u * C2[c] + u ** 3 * P1[c]);
    const [x, y] = bz(fu), [x2, y2] = bz(Math.min(1, fu + .02));
    const rot = fu >= 1 ? .15 : lerp(-.02, Math.atan2(y2 - y, x2 - x), eIO(prog(t, T.fold + .2, T.fly[0] + .3)));
    const fa = .45 * (1 - prog(t, T.fly[1], T.fly[1] + .8));
    if (fu > 0 && fa > 0) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(bz(fu * i / 40)); inkLine(pts, { t, seed: 222, w: 4, h: .06, alpha: fa, gaps: false, dbl: false, amp: 1 }); }
    const pa = 1 - prog(t, T.fly[1] + .3, T.fly[1] + .8);
    if (pa > 0) {
      const f = clamp((t - T.fold) / .45) * 2, i0 = Math.min(2, Math.floor(f)), w = f - i0;
      const o = { h: lerp(.065, .01, fu), lift: (.5 + lu * .2) * (1 - fu), rot, elev: 10 };
      drawSp(A.fold[i0], x, y, Object.assign({}, o, { alpha: (i0 < 2 ? 1 - w : 1) * pa, sc: lerp(1, .8, fu) }));
      if (i0 < 2 && w > 0) drawSp(A.fold[i0 + 1], x, y, Object.assign({}, o, { alpha: w * pa, shadow: false }));
    }
  }
}

function lonely(t) {
  inkIn(A.otpr, CX, 2480, t, T.otpr, { rot: -.02, seed: 3 });
  inkIn(A.komu, CX + 20, 2620, t, T.komu, { rot: .02, seed: 4 });
  drawPerson(PERSON[0], PERSON[1], 1.3, T.lit, 1, t, 100, { tear: 4.6 });
}

function thanks(t) {
  inkIn(A.spas, CX, 3580, t, T.spas, { rot: -.03, seed: 5 });
  if (t > T.heart[0]) {
    const hx = CX + 330, hy = 3550, H = [];
    for (let i = 0; i <= 50; i++) { const a = i / 50 * Math.PI * 2; H.push([hx + 16 * Math.pow(Math.sin(a), 3) * 4.2, hy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 4.2]); }
    inkLine(H, { t, seed: 230, w: 7, h: .05, p: eIO(prog(t, T.heart[0], T.heart[1])), color: PAL.orange, gaps: false, amp: 1 });
  }
  const li = drop(t, T.link, .9);
  if (li) drawSp(A.link, CX, 3800 - li.lift * 60, { h: .05, lift: li.lift, rot: .015, elev: 8, alpha: li.a });
  const pi = drop(t, T.pinned, .9);
  if (pi) drawSp(A.pinned, CX, 3940 - pi.lift * 60, { h: .05, lift: pi.lift, rot: -.015, elev: 8, alpha: pi.a });
}

function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  plea(t); lonely(t); copyLink(t); thanks(t);
}

/* ---------- sound cues ---------- */
function brushes(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('tap', t0 + j * stagger + .3, { i: j, g })); }
function buildCues() {
  cue('pen', T.pozh[0], { d: .65, g: .55 }); brushes(A.pomog, T.pomog, .05, .4); brushes(A.nam, T.nam, .12, .6); cue('slide', T.card, { d: .9, g: .35 });
  cue('whoosh', 2.4, { d: .9, g: .5 });
  cue('pen', T.skop[0], { d: .6, g: .5 }); cue('slide', T.plate, { d: .8, g: .4 });
  cue('slide', T.finger[0], { d: .4, g: .4 }); cue('press', T.finger[1]); cue('pen', T.ring[0], { d: .55, g: .45 }); cue('copy', T.copied);
  cue('peel', T.strip, { d: .35 }); cue('fold', T.fold + .1); cue('fold', T.fold + .32); cue('plane', T.fly[0] - .2, { d: 1.5, g: .8 });
  cue('pen', T.otpr[0], { d: .7, g: .5 }); cue('pen', T.komu[0], { d: .65, g: .5 }); cue('sun', T.lit + .3, { i: 4 });
  cue('whoosh', 7.9, { d: .8, g: .5 });
  cue('pen', T.spas[0], { d: .6, g: .55 }); cue('pen', T.heart[0], { d: .6, g: .45 }); cue('chime', T.heart[1] - .1, { hi: 2 });
}

window.ready = (async () => {
  await loadFonts();
  buildAssets();
  buildCues();
  window.SFX = SFX;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { renderFrame(+q.get('t')); return true; }
  if (!q.has('render')) { const t0 = performance.now(); const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
  return true;
})();
