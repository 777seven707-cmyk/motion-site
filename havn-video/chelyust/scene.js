/* HAVN · «Ты сейчас сжимаешь челюсть» — 29 s, 1080×1920.
   The hook is a claim about the viewer's body right now; then the film walks
   them through releasing it (jaw, shoulders, tongue, breath) and only at the
   end says this was 20 seconds of what HAVN has. */
'use strict';

const DUR = 29.0;
const sstep = x => x * x * (3 - 2 * x);
Object.assign(PAL, { skin: '#f1cfae', skin2: '#e6b994', hair: '#6a4a3a', sweater: '#7fb6a4', sweater2: '#5f9a88', mouthIn: '#a8455a', tongue: '#f28b9b', shield: '#a9bccf', pink: '#f4a3a0', drop: '#bfe3f7' });

/* ---------- places on the table ---------- */
const F = [540, 900];          // the face, front view
const N = [540, 1330];         // base of the neck
const PR = [1900, 980];        // the same head in profile
const P3 = [540, 3600];        // the HAVN card
const CAMK = [
  [0.00, 540, 958, 1.95, -2.0],
  [2.30, 540, 975, 1.70, 1.0],
  [4.50, 540, 990, 1.45, -0.6],
  [7.20, 540, 1000, 1.28, 0.8],
  [7.95, 540, 1260, 0.80, -0.5],
  [10.40, 540, 1280, 0.78, 0.6],
  [10.95, 1900, 985, 1.25, -1.0],
  [13.40, 1915, 990, 1.15, 0.5],
  [17.30, 1960, 990, 1.00, -0.4],
  [17.90, 540, 1330, 0.74, 0.8],
  [21.25, 540, 1350, 0.78, -0.6],
  [21.80, 540, 3560, 1.00, 1.0],
  [29.00, 540, 3600, 1.05, -0.2]
];
const SHAKES = [[20.38, .5], [24.87, .3]];

/* ---------- timeline ---------- */
const T = {
  ty: 0.1, szh: 0.4, chel: [1.05, 1.6], hookOut: 2.2,
  prov: [2.4, 2.85], dots: [3.0, 3.5, 4.0], provOut: 4.38,
  razo: 4.55, spread: [4.8, 5.7], zuby: 5.6, unclench: 5.0, relax: [5.0, 6.0], eyesClose: 5.4, teethGone: 5.8, razoOut: 7.55,
  ushi: 7.95, arrows: [8.1, 8.5], opusti: 9.0, drop: [9.0, 9.25, 9.5, 9.75], plOut: 10.35,
  otlepi: [11.0, 11.6], otneba: 11.55, lblNebo: 11.15, lblYazyk: 11.35, peel: [11.85, 12.05, 12.25], tongueOut: 13.35,
  medl: [13.6, 14.2], vydoh: 14.15, vSpread: [14.3, 17.0], air: [14.0, 17.2], puffs: [14.3, 14.9, 15.5, 16.1], vydOut: 17.2,
  shieldIn: 17.9, telo: [18.0, 18.6], derzh: 18.6, fall: 19.95, land: 20.35, oborOut: 20.25, mozhno: 20.4, otpust: [20.65, 21.05], smile: 20.4,
  n20: 21.95, izHavn: [22.4, 22.85], card: 22.2, logo: 22.7, sun: [22.55, 23.25], items: [22.95, 23.25, 23.55], checks: [23.7, 24.05, 24.4], stamp: 24.85,
  sohrani: 25.95, sohraniW: [26.1, 26.85], link: 27.15
};

/* ---------- assets (face parts are built at double resolution and drawn at half scale,
   so they stay crisp in the close-ups) ---------- */
const A = {};
const ell = (w, h, n = 64) => arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, n);
const D = 2;
const scaleShape = (pts, k) => pts.map(p => [p[0] * k, p[1] * k]);
function rrect(x0, y0, w, h, r) {
  const pts = [], q = Math.PI / 2;
  [[x0 + w - r, y0 + r, -q], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, q], [x0 + r, y0 + r, 2 * q]].forEach(([cx, cy, a]) => { for (let i = 0; i <= 8; i++) { const b = a + q * i / 8; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); } });
  return pts;
}
const closed = pts => { let r = []; const c = pts.concat([pts[0]]); for (let i = 0; i < c.length - 1; i++) r = r.concat(seg(c[i], c[i + 1], 8).slice(i ? 1 : 0)); return r; };
function stamp(text, color, size) {
  const m = mk(10, 10).getContext('2d'), font = `900 ${size}px Unb`; m.font = font;
  const tw = m.measureText(text).width, w = tw + 80, h = size * 2.2;
  const c = mk(w + PAD * 2, h + PAD * 2), x = c.getContext('2d'), r = mulberry32(text.length * 31);
  x.filter = 'url(#ink1)'; x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 8;
  x.strokeRect(PAD + 6, PAD + 6, w - 12, h - 12); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 3);
  x.filter = 'none'; x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < w * h / 150; i++) { x.globalAlpha = .3 + r() * .7; x.beginPath(); x.arc(PAD + r() * w, PAD + r() * h, .6 + r() * 2.2, 0, 7); x.fill(); }
  return sprite(c);
}
// the profile: one closed outline, looking right
const PROF = smooth([[-120, 330], [-230, 120], [-250, -80], [-200, -250], [-60, -320], [110, -260], [170, -120], [185, -60], [175, -20], [245, 60], [190, 95], [200, 140], [186, 165], [198, 190], [175, 262], [90, 300], [60, 330], [60, 430], [-120, 430]], 4);
function torsoShape(sh) {
  return [[-85, 0], [-300, -sh + 10], [-390, -sh + 80], [-440, 720], [440, 720], [390, -sh + 80], [300, -sh + 10], [85, 0]].map(p => [p[0] + 440, p[1] + 230]);
}
const SH = [220, 165, 110, 55, 0];

function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];

  // front face
  A.head = card(520 * D, 640 * D, { seed: 1, color: PAL.skin, shape: ell(520 * D, 640 * D, 90), tex: .5 });
  const hair = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + Math.PI * i / 40; hair.push([290 + Math.cos(a) * 290, 230 + Math.sin(a) * 240]); }
  for (let i = 0; i <= 12; i++) hair.push([580 - i * 580 / 12, 220 + (i % 2 ? 26 : 0)]);
  A.hair = card(580 * D, 260 * D, { seed: 2, color: PAL.hair, shape: scaleShape(hair, D), tex: .9 });
  A.ear = card(70 * D, 112 * D, { seed: 3, color: PAL.skin2, shape: ell(70 * D, 112 * D, 30) });
  A.neck = card(170 * D, 270 * D, { seed: 4, color: PAL.skin2 });
  A.torso = SH.map((sh, i) => card(880, 950, { seed: 5, color: PAL.sweater, shape: torsoShape(sh), tex: .9 }));
  const teeth = (seed) => card(210 * D, 40 * D, { seed, color: '#fffdf7', shape: rrect(0, 0, 210 * D, 40 * D, 12 * D), content: (x, cx, cy) => { x.strokeStyle = 'rgba(40,40,40,.55)'; x.lineWidth = 3 * D; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(cx + k * 28 * D, cy - 18 * D); x.lineTo(cx + k * 28 * D, cy + 18 * D); x.stroke(); } } });
  A.teethU = teeth(6); A.teethL = teeth(7);
  A.sweat = card(34 * D, 48 * D, { seed: 8, color: PAL.drop, shape: scaleShape([[17, 0], [32, 26], [26, 44], [8, 44], [2, 26]], D) });
  A.blush = card(80 * D, 46 * D, { seed: 9, color: PAL.pink, shape: ell(80 * D, 46 * D, 30), tex: .4 });

  // profile
  const pr = PROF.map(p => [p[0] + 260, p[1] + 330]);
  A.prof = card(520 * D, 770 * D, { seed: 20, color: PAL.skin, shape: scaleShape(pr, D), tex: .5 });
  A.profHair = card(400 * D, 470 * D, { seed: 21, color: PAL.hair, shape: scaleShape(smooth([[-250, -80], [-200, -250], [-60, -335], [115, -275], [135, -205], [40, -215], [-60, -150], [-120, -40], [-150, 60], [-232, 125]], 4).map(p => [p[0] + 260, p[1] + 340]), D), tex: .9 });
  A.profEar = card(70 * D, 104 * D, { seed: 22, color: PAL.skin2, shape: ell(70 * D, 104 * D, 30) });
  A.mouthIn = card(180 * D, 112 * D, { seed: 23, color: PAL.mouthIn, shape: ell(180 * D, 112 * D, 50), tex: .5 });
  A.tongue = card(140 * D, 52 * D, { seed: 24, color: PAL.tongue, shape: scaleShape(arc(70, 52, 70, 50, Math.PI, Math.PI * 2, 30).concat([[140, 52], [0, 52]]), D), tex: .4 });
  A.puffs = [0, 1, 2, 3].map(i => card((90 + i * 20) * D, (54 + i * 10) * D, { seed: 25 + i, color: '#fbfdff', torn: true, shape: scaleShape(ell(90 + i * 20, 54 + i * 10, 30), D), tex: .5 }));

  // shield
  A.shield = card(520, 620, { seed: 30, color: PAL.shield, shape: [[0, 0], [520, 0], [520, 330], [260, 620], [0, 330]], content: (x, cx, cy) => {
    x.strokeStyle = 'rgba(24,41,59,.55)'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - 230, cy - 280); x.lineTo(cx + 230, cy - 280); x.lineTo(cx + 230, cy + 20); x.lineTo(cx, cy + 270); x.lineTo(cx - 230, cy + 20); x.closePath(); x.stroke();
    printed('ОБОРОНА', '900 78px Unb', PAL.orange, 0)(x, cx, cy - 120);
  } });

  // texts — sizes are world units; close-up texts are built twice as big and drawn at half scale
  const big = (s, size, col, seed) => cutWord(s, size * D, col, { seed });
  A.ty = label('ты сейчас', `700 ${40 * D}px Cav`, { seed: 40, h: 64 * D, dy: -2 });
  A.szh = big('СЖИМАЕШЬ', 62, PAL.orange, 41);
  A.chel = inkText('челюсть.', 46 * D, PAL.ink, { seed: 42 });
  A.chelPlate = card(260 * D, 70 * D, { seed: 43, color: PAL.cream, torn: true });
  A.prov = inkText('проверь.', 68 * D, PAL.ink, { seed: 44 });
  A.provPlate = card(360 * D, 96 * D, { seed: 45, color: PAL.cream, torn: true });
  A.razo = big('РАЗОЖМИ', 78, PAL.orange, 46);
  A.zuby = label('пусть зубы не касаются', `italic 600 ${42 * D}px Corm`, { seed: 47, h: 66 * D, dy: -3 });
  A.ushi = label('плечи сейчас у ушей', 'italic 600 84px Corm', { seed: 48, h: 128 });
  A.opusti = cutWord('ОПУСТИ', 210, PAL.orange, { seed: 49 });
  A.otlepi = inkText('отлепи язык', 66 * D, PAL.ink, { seed: 50 });
  A.otneba = big('ОТ НЁБА', 112, PAL.orange, 51);
  A.lblNebo = inkText('нёбо', 46 * D, PAL.ink, { seed: 52 });
  A.lblYazyk = inkText('язык', 46 * D, PAL.ink, { seed: 53 });
  A.medl = inkText('и медленно', 70 * D, PAL.ink, { seed: 54 });
  A.vydoh = big('ВЫДОХ', 120, PAL.deep, 55);
  A.telo = inkText('тело весь день', 120, PAL.ink, { seed: 56 });
  A.derzh = label('держало оборону', 'italic 600 112px Corm', { seed: 57, h: 160 });
  A.mozhno = cutWord('МОЖНО', 220, PAL.orange, { seed: 58 });
  A.otpust = inkText('отпустить', 140, PAL.ink, { seed: 59 });

  // the card
  A.n20 = cutWord('20 СЕКУНД', 118, PAL.orange, { seed: 60 });
  A.izHavn = inkText('из HAVN', 96, PAL.ink, { seed: 61 });
  A.card = card(780, 760, { seed: 62, color: '#fffdf7', shape: rrect(0, 0, 780, 760, 56), tex: .6 });
  A.logo = cutWord('HAVN', 112, PAL.deep, { seed: 63, track: 6 });
  A.sunO = card(120, 60, { seed: 64, color: PAL.sunO, shape: arc(60, 60, 60, 60, Math.PI, Math.PI * 2, 30).concat([[120, 60], [0, 60]]) });
  A.items = ['дыхание', 'мышечное расслабление', 'сканирование тела'].map((s, i) => inkText(s, 62, PAL.ink, { seed: 65 + i }));
  A.stamp = stamp('БЕЗ РЕГИСТРАЦИИ', PAL.deep, 40);
  A.sohraniT = inkText('сохрани — и повтори перед сном', 60, PAL.ink, { seed: 70 });
  A.sohrani = card(A.sohraniT.tw + 70, 100, { seed: 71, color: PAL.white, torn: true });
  A.link = card(520, 86, { seed: 72, color: PAL.deep, content: printed('ссылка в профиле ↓', '600 44px Inter', '#ffffff', 2) });

  // filler on the table
  const DR = mulberry32(7); A.decor = [];
  [[F, PR], [PR, F], [F, P3]].forEach(([a, b], bi) => { for (let i = 0; i < 7; i++) { const u = .25 + DR() * .5; A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + bi * 10 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + (DR() - .5) * 500, y: lerp(a[1], b[1], u) + (DR() < .5 ? -1 : 1) * (700 + DR() * 400), rot: (DR() - .5) * .8, h: DR() * .05 }); } });
}

/* ---------- helpers ---------- */
const half = { sc: .5 };
const out = (t, t0) => -1500 * slide(t, t0, .3, eIn);
// letters of a cut word with their own spacing and per-letter offsets
function wordX(wd, cx, cy, t, t0, o = {}) {
  wd.letters.forEach((L, j) => {
    const d = drop(t, t0 + j * (o.stagger == null ? 1 / 24 : o.stagger)); if (!d) return;
    const sc = o.sc || 1, spread = o.spread || 1, jj = o.shake ? jit(j + (o.seed || 0) * 13, t, o.shake) : [0, 0, 0];
    const ex = o.each ? o.each(j, L) : [0, 0, 0];
    drawSp(L.sp, cx + L.dx * sc * spread + jj[0] + ex[0], cy - d.lift * 60 + jj[1] + ex[1], { h: o.h || .05, lift: d.lift, rot: (h2(j, (o.seed || 1) * 7) - .5) * .08 + jj[2] * 5 + ex[2] + (d.lift ? (h2(j, 33 + d.k) - .5) * .5 * d.lift : 0), sc: sc * (o.sx || 1) });
  });
}

/* ---------- scenes ---------- */
function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500 && Math.abs(d.x - CAM.x) < 1100) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

function figure(t) {
  const tq = step12(t), [fx, fy] = F;
  const tense = 1 - sstep(prog(t, T.relax[0], T.relax[1]));
  // shoulders drop one replacement piece at a time
  let si = 0; T.drop.forEach((d, i) => { if (tq >= d) si = i + 1; });
  const sh = SH[si];
  drawSp(A.neck, fx, fy + 330, { h: .005, sc: .5, elev: 3 });
  drawSp(A.torso[si], N[0], N[1] + 245, { h: .008, elev: 6 });
  inkLine(closed(torsoShape(sh).map(p => [p[0] - 440 + N[0], p[1] - 230 + N[1]])).slice(0, -1), { t, seed: 10, w: 5, h: .009 });
  inkLine(arc(N[0], N[1] - 6, 92, 34, 0, Math.PI, 20), { t, seed: 11, w: 4.5, h: .009 });
  if (t > T.arrows[0] && tq < T.drop[0]) [-1, 1].forEach((s, i) => {
    const ax = N[0] + s * 330, ay = N[1] - sh + 20, p = eOut(prog(t, T.arrows[0] + i * .12, T.arrows[1] + i * .12));
    inkLine(seg([ax, ay - 40], [ax, ay - 200], 8), { t, seed: 12 + i, w: 7, p, h: .02, color: PAL.orange });
    inkLine(chain([ax - 34, ay - 160], [ax, ay - 205], [ax + 34, ay - 160]), { t, seed: 14 + i, w: 7, p: prog(t, T.arrows[1] + i * .12, T.arrows[1] + .15 + i * .12), h: .02, color: PAL.orange, dbl: false });
  });
  [-1, 1].forEach(s => drawSp(A.ear, fx + s * 262, fy + 10, { h: .01, sc: .5, elev: 3 }));
  drawSp(A.head, fx, fy, { h: .012, sc: .5, elev: 6 });
  drawSp(A.hair, fx, fy - 220, { h: .016, sc: .5, elev: 5 });
  const L = { t, h: .02 };
  inkLine(arc(fx, fy, 260, 320, -Math.PI * .1, Math.PI * 1.1, 70), Object.assign({ seed: 20, w: 5 }, L));
  // brows: knotted → soft
  [-1, 1].forEach((s, i) => {
    const inner = [fx + s * 38, fy + lerp(-74, -40, tense)], outer = [fx + s * 150, fy + lerp(-70, -78, tense)], mid = [fx + s * 95, fy + lerp(-86, -62, tense)];
    inkLine(smooth([inner, mid, outer], 6), Object.assign({ seed: 21 + i, w: 8 }, L));
  });
  // eyes: wide and tense → closed
  [-1, 1].forEach((s, i) => {
    const ex = fx + s * 92, ey = fy - 6;
    if (tq < T.eyesClose) {
      inkLine(arc(ex, ey, 36, 20, 0, Math.PI * 2, 30), Object.assign({ seed: 23 + i, w: 4.5, gaps: false }, L));
      inkLine(arc(ex + s * 4, ey + 2, 8, 8, 0, Math.PI * 2, 12), Object.assign({ seed: 25 + i, w: 9, gaps: false, dbl: false }, L));
      inkLine(seg([ex - 34, ey + 26], [ex + 34, ey + 22], 6), Object.assign({ seed: 27 + i, w: 3, dbl: false }, L));
    } else inkLine(arc(ex, ey - 4, 40, 15, Math.PI * .05, Math.PI * .95, 20), Object.assign({ seed: 29 + i, w: 5.5 }, L));
  });
  inkLine(smooth([[fx + 4, fy + 40], [fx - 16, fy + 110], [fx + 12, fy + 120]], 6), Object.assign({ seed: 31, w: 4.5 }, L));
  // mouth: clenched teeth → apart → soft lips → a smile
  const my = fy + 180, gap = slide(t, T.unclench, .5);
  const tA = tq < T.teethGone ? 1 : tq < T.teethGone + 2 / 12 ? .5 : 0;
  if (tA > 0) {
    drawSp(A.teethU, fx, my - 21 - 10 * gap, { h: .014, sc: .5, elev: 2, alpha: tA });
    drawSp(A.teethL, fx, my + 21 + 24 * gap, { h: .014, sc: .5, elev: 2, alpha: tA });
    inkLine(smooth([[fx - 128, my - 6], [fx - 60, my - 46 - 10 * gap], [fx + 60, my - 46 - 10 * gap], [fx + 128, my - 6]], 6), Object.assign({ seed: 32, w: 5, alpha: tA }, L));
    inkLine(smooth([[fx - 120, my + 6], [fx - 55, my + 46 + 24 * gap], [fx + 55, my + 46 + 24 * gap], [fx + 120, my + 6]], 6), Object.assign({ seed: 33, w: 5, alpha: tA }, L));
  } else {
    const sm = sstep(prog(t, T.smile, T.smile + .4)), w = lerp(78, 108, sm), sag = lerp(10, 30, sm);
    inkLine(smooth([[fx - w, my - 4 - sm * 10], [fx, my + sag], [fx + w, my - 4 - sm * 10]], 8), Object.assign({ seed: 34, w: 6 }, L));
  }
  // strain: shaking marks at the jaw and temples, a drop of sweat
  if (tq < T.unclench) {
    [-1, 1].forEach((s, i) => {
      const j = jit(40 + i, t, 4);
      for (let k = 0; k < 3; k++) inkLine(seg([fx + s * (214 + k * 14) + j[0], fy + 160 + k * 26 + j[1]], [fx + s * (250 + k * 14) + j[0], fy + 150 + k * 26 + j[1]], 6), Object.assign({ seed: 50 + i * 3 + k, w: 4, dbl: false }, L));
      for (let k = 0; k < 2; k++) inkLine(seg([fx + s * (238 + k * 12) + j[0], fy - 90 - k * 22], [fx + s * (268 + k * 12) + j[0], fy - 100 - k * 22], 6), Object.assign({ seed: 60 + i * 3 + k, w: 3.5, dbl: false }, L));
    });
    const sj = jit(70, t, 3); drawSp(A.sweat, fx + 232 + sj[0], fy - 128 + sj[1], { h: .022, sc: .5, elev: 3 });
  }
  if (t > T.smile) { const b = sstep(prog(t, T.smile, T.smile + .5)); [-1, 1].forEach(s => drawSp(A.blush, fx + s * 150, fy + 108, { h: .015, sc: .5, alpha: b, shadow: false })); }
}

function hookTexts(t) {
  const tq = step12(t), [fx, fy] = F;
  // 1. ты сейчас СЖИМАЕШЬ челюсть.
  const o1 = out(t, T.hookOut);
  if (tq >= T.ty) { const u = slide(t, T.ty, .2); drawSp(A.ty, fx - 150 - (1 - u) * 700, 618 + o1, { h: .06, sc: .5, lift: (1 - u) * .4, rot: -.03 }); }
  wordX(A.szh, fx, 690 + o1, t, T.szh, { h: .07, sc: .5, spread: .9, shake: 3.2, seed: 41 });
  if (tq >= T.chel[0] - .1) { drawSp(A.chelPlate, fx + 110, 772 + o1, { h: .06, sc: .5, rot: .03 }); drawInk(A.chel, fx + 110, 768 + o1, { t, p: prog(t, T.chel[0], T.chel[1]), h: .065, sc: .5, rot: .03, seed: 1 }); }
  // 2. проверь. + three ticking dots
  const o2 = out(t, T.provOut);
  if (tq >= T.prov[0] - .05 && tq < T.provOut + .4) {
    drawSp(A.provPlate, fx, 700 + o2, { h: .06, sc: .5, rot: -.02 });
    drawInk(A.prov, fx, 695 + o2, { t, p: prog(t, T.prov[0], T.prov[1]), h: .065, sc: .5, rot: -.02, seed: 2 });
    T.dots.forEach((d, i) => { if (t > d) inkLine(arc(fx - 40 + i * 40, 772 + o2, 7, 7, 0, Math.PI * 2, 12), { t, seed: 80 + i, w: 8, h: .065, p: prog(t, d, d + .08), gaps: false, dbl: false, color: i === 2 ? PAL.orange : PAL.ink }); });
  }
  // 3. РАЗОЖМИ — the letters let go of each other
  const o3 = out(t, T.razoOut), sp = 1 + .3 * eOut(prog(t, T.spread[0], T.spread[1]));
  if (t < T.razoOut + .4) wordX(A.razo, fx, 652 + o3, t, T.razo, { h: .07, sc: .5, spread: sp, seed: 46 });
  if (tq >= T.zuby && t < T.razoOut + .4) { const u = slide(t, T.zuby, .22); drawSp(A.zuby, fx + (1 - u) * 800, 752 + o3, { h: .065, sc: .5, lift: (1 - u) * .4, rot: .02 }); }
  // 4. плечи сейчас у ушей → ОПУСТИ (the letters fall with the shoulders)
  const o4 = out(t, T.plOut);
  if (tq >= T.ushi && t < T.plOut + .4) { const u = slide(t, T.ushi, .22); drawSp(A.ushi, fx - (1 - u) * 900, 395 + o4, { h: .06, lift: (1 - u) * .4, rot: -.02 }); }
  if (t < T.plOut + .4) wordX(A.opusti, fx, 545 + o4, t, T.opusti, { h: .07, stagger: 1 / 12, seed: 49 });
}

function profile(t) {
  const tq = step12(t), [px, py] = PR;
  drawSp(A.profEar, px - 40, py + 20, { h: .01, sc: .5, elev: 3 });
  drawSp(A.prof, px, py + 50, { h: .012, sc: .5, elev: 6 });
  drawSp(A.profHair, px - 60, py - 105, { h: .016, sc: .5, elev: 5 });
  inkLine(PROF.map(p => [px + p[0], py + p[1]]).slice(1, -3), { t, seed: 100, w: 5, h: .02 });
  inkLine(arc(px + 120, py - 46, 26, 9, Math.PI * .05, Math.PI * .95, 12), { t, seed: 101, w: 5, h: .02 });
  inkLine(smooth([[px + 70, py - 92], [px + 120, py - 104], [px + 160, py - 96]], 5), { t, seed: 102, w: 6, h: .02 });
  // the cutaway: mouth, palate, the tongue peeling off it
  drawSp(A.mouthIn, px + 95, py + 135, { h: .014, sc: .5, elev: 2, shadow: false });
  let ty = 104; T.peel.forEach((p, i) => { if (tq >= p) ty = [118, 134, 148][i]; });
  drawSp(A.tongue, px + 88, py + ty, { h: .016, sc: .5, elev: 2 });
  inkLine(arc(px + 95, py + 150, 82, 62, Math.PI * 1.06, Math.PI * 1.94, 30), { t, seed: 103, w: 4.5, h: .018 });
  inkLine(arc(px + 95, py + 135, 90, 56, 0, Math.PI * 2, 40), { t, seed: 104, w: 3.5, h: .017, alpha: .7 });
  if (tq >= T.peel[0] && tq < T.peel[0] + .5) inkLine(seg([px + 60, py + 96], [px + 120, py + 96], 6), { t, seed: 105, w: 3, h: .02, dbl: false, alpha: .6 });
  // labels with arrows
  const lo = out(t, T.tongueOut);
  drawInk(A.lblNebo, px + 380, py + 40 + lo, { t, p: prog(t, T.lblNebo, T.lblNebo + .3), h: .03, sc: .5, seed: 3 });
  inkLine(smooth([[px + 330, py + 50], [px + 230, py + 70], [px + 140, py + 92]], 6).map(p => [p[0], p[1] + lo]), { t, seed: 106, w: 4, p: prog(t, T.lblNebo + .2, T.lblNebo + .45), h: .03 });
  drawInk(A.lblYazyk, px + 380, py + 250 + lo, { t, p: prog(t, T.lblYazyk, T.lblYazyk + .3), h: .03, sc: .5, seed: 4 });
  inkLine(smooth([[px + 330, py + 240], [px + 230, py + 200], [px + 140, py + ty + 10]], 6).map(p => [p[0], p[1] + lo]), { t, seed: 107, w: 4, p: prog(t, T.lblYazyk + .2, T.lblYazyk + .45), h: .03 });
  // the exhale: long ink breaths and paper puffs drifting away
  if (t > T.air[0]) for (let k = 0; k < 3; k++) {
    const t0 = T.air[0] + k * .5, p = eOut(prog(t, t0, t0 + 2.2)), fade = 1 - prog(t, T.air[1] - .2, T.air[1] + .6), drift = (t - t0) * 30;
    if (p <= 0 || fade <= 0) continue;
    const pts = []; for (let x = 0; x <= 420; x += 10) pts.push([px + 215 + x + drift, py + 160 - k * 26 + Math.sin(x * .03 + k + t * 2) * (8 + x * .04) - x * .12]);
    inkLine(pts, { t, seed: 110 + k, w: 4, p, h: .03, alpha: fade, color: PAL.deep });
  }
  A.puffs.forEach((pf, i) => {
    const t0 = T.puffs[i]; if (tq < t0) return;
    const a = tq - t0, fade = 1 - prog(a, 1.4, 2.2);
    if (fade > 0) drawSp(pf, px + 260 + a * 150 + i * 30, py + 150 - a * 70 - i * 20, { h: .035 + i * .005, sc: .5 * (1 + a * .25), alpha: fade, elev: 8 });
  });
}

function profileTexts(t) {
  const tq = step12(t), [px] = PR;
  const o5 = out(t, T.tongueOut);
  if (t < T.tongueOut + .4) {
    drawInk(A.otlepi, px, 478 + o5, { t, p: prog(t, T.otlepi[0], T.otlepi[1]), h: .05, sc: .5, rot: -.03, seed: 5 });
    wordX(A.otneba, px, 585 + o5, t, T.otneba, { h: .06, sc: .5, seed: 51 });
  }
  const o6 = out(t, T.vydOut), sp = 1 + .55 * sstep(prog(t, T.vSpread[0], T.vSpread[1]));
  if (t < T.vydOut + .4) {
    drawInk(A.medl, px + 30, 478 + o6, { t, p: prog(t, T.medl[0], T.medl[1]), h: .05, sc: .5, rot: -.02, seed: 6 });
    wordX(A.vydoh, px + 30, 590 + o6, t, T.vydoh, { h: .06, sc: .5, spread: sp, seed: 55, each: j => [0, Math.sin(t * 1.6 + j) * 6 * prog(t, T.vSpread[0], T.vSpread[0] + 1), 0] });
  }
}

function shieldScene(t) {
  const tq = step12(t);
  if (tq < T.shieldIn) return;
  const u = slide(t, T.shieldIn, .3), f = slide(t, T.fall, T.land - T.fall, eIn);
  const x = N[0] + 30 * f, y = N[1] + 330 + (1 - u) * 1100 + 420 * f, rot = -.04 + .55 * f;
  drawSp(A.shield, x, y, { h: .03, lift: .45 * (1 - f) + (1 - u) * .3, rot, elev: 10 });
}

function shieldTexts(t) {
  const tq = step12(t), [fx] = F;
  const o7 = out(t, T.oborOut);
  if (t < T.oborOut + .4) {
    drawInk(A.telo, fx, 395 + o7, { t, p: prog(t, T.telo[0], T.telo[1]), h: .05, rot: -.03, seed: 7 });
    if (tq >= T.derzh) { const u = slide(t, T.derzh, .22); drawSp(A.derzh, fx + (1 - u) * 1000, 520 + o7, { h: .055, lift: (1 - u) * .4, rot: .02 }); }
  }
  wordX(A.mozhno, fx, 400, t, T.mozhno, { h: .06, stagger: 1 / 24, seed: 58 });
  drawInk(A.otpust, fx, 525, { t, p: prog(t, T.otpust[0], T.otpust[1]), h: .05, rot: .02, seed: 8 });
}

function cardScene(t) {
  const tq = step12(t), [cx, cy] = P3;
  word(A.n20, cx, 2950, t, T.n20, { h: .05, seed: 60, stagger: 1 / 24 });
  drawInk(A.izHavn, cx, 3075, { t, p: prog(t, T.izHavn[0], T.izHavn[1]), h: .04, rot: -.02, seed: 9 });
  if (tq < T.card) return;
  const u = slide(t, T.card, .25), ky = cy + (1 - u) * 1100;
  drawSp(A.card, cx, ky, { h: .02, lift: (1 - u) * .5, rot: -.015, elev: 9 });
  // logo row: the sun rises over its line, then the name lands
  const su = slide(t, T.sun[0], T.sun[1] - T.sun[0], eIO);
  ctx.save(); layer(.024); ctx.beginPath(); ctx.rect(cx - 330, ky - 340, 160, 112); ctx.clip();
  drawSp(A.sunO, cx - 250, ky - 250 + 60 * (1 - su), { h: .024, elev: 3 }); ctx.restore();
  inkLine(seg([cx - 330, ky - 220], [cx - 170, ky - 220], 8), { t, seed: 120, w: 4.5, p: prog(t, T.sun[0], T.sun[0] + .3), h: .026 });
  inkLine(seg([cx - 290, ky - 196], [cx - 210, ky - 196], 8), { t, seed: 121, w: 4, p: prog(t, T.sun[1] - .2, T.sun[1]), h: .026, color: PAL.deep });
  word(A.logo, cx + 70, ky - 262, t, T.logo, { h: .03, seed: 63 });
  A.items.forEach((it, i) => {
    const ry = ky - 90 + i * 112;
    inkLine(closed([[cx - 330, ry - 26], [cx - 278, ry - 26], [cx - 278, ry + 26], [cx - 330, ry + 26]]).slice(0, -1), { t, seed: 130 + i, w: 4, p: prog(t, T.items[i] - .1, T.items[i]), h: .026, gaps: false });
    drawInk(it, cx - 245, ry - 2, { t, p: prog(t, T.items[i], T.items[i] + .35), h: .026, align: 'left', seed: 10 + i });
    inkLine(chain([cx - 326, ry - 4], [cx - 306, ry + 18], [cx - 266, ry - 40]), { t, seed: 140 + i, w: 8, p: eOut(prog(t, T.checks[i], T.checks[i] + .2)), h: .028, color: PAL.orange, dbl: false });
  });
  const k = Math.round((tq - T.stamp) * 12);
  if (k >= 0) drawSp(A.stamp, cx + 10, ky + 270, { h: .03, rot: -.05, sc: k === 0 ? 1.3 : k === 1 ? 1.04 : 1, alpha: k === 0 ? .7 : 1, shadow: false });
  const so = slide(t, T.sohrani, .2);
  if (tq >= T.sohrani) {
    drawSp(A.sohrani, cx - (1 - so) * 950, 4030, { h: .05, lift: (1 - so) * .5, rot: .02, elev: 8 });
    drawInk(A.sohraniT, cx - (1 - so) * 950, 4026, { t, p: prog(t, T.sohraniW[0], T.sohraniW[1]), h: .052, rot: .02, seed: 12 });
  }
  const li = drop(t, T.link);
  if (li) drawSp(A.link, cx, 4140 - li.lift * 50, { h: .055, lift: li.lift, rot: -.03, elev: 8 });
}

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  const near = (p, r) => Math.abs(CAM.x - p[0]) < r && Math.abs(CAM.y - p[1]) < r * 1.8;
  if (near(F, 1500)) { figure(t); shieldScene(t); }
  if (near(PR, 1300)) profile(t);
  if (near(P3, 1500)) cardScene(t);
  // words ride on top of everything around them
  if (t < 10.9) hookTexts(t);
  if (t > 10.3 && t < 17.9) profileTexts(t);
  if (t > 17.5 && t < 21.9) shieldTexts(t);
}

/* ---------- sound cues ---------- */
function slaps(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('slap', t0 + j * stagger + 2 / 12, { g })); }
function buildCues() {
  cue('grind', 0.0, { d: 2.3 }); cue('slide', T.ty, { d: .2 }); slaps(A.szh, T.szh, 1 / 24, .7); cue('pen', T.chel[0], { d: .55 });
  cue('whoosh', T.hookOut, { d: .3, g: .5 }); cue('pen', T.prov[0], { d: .45 }); T.dots.forEach(d => cue('tick', d));
  cue('whoosh', T.provOut, { d: .3, g: .5 }); slaps(A.razo, T.razo, 1 / 24, .65); cue('release', T.unclench); cue('slide', T.zuby, { d: .22 });
  cue('whoosh', 7.25, { d: .7 }); cue('slide', T.ushi, { d: .22 }); cue('pen', T.arrows[0], { d: .5, g: .5 });
  slaps(A.opusti, T.opusti, 1 / 12, .7); T.drop.forEach((d, i) => cue('thump', d + 1 / 24, { i }));
  cue('whoosh', 10.4, { d: .55 }); cue('pen', T.otlepi[0], { d: .6 }); slaps(A.otneba, T.otneba, 1 / 24, .6);
  cue('pen', T.lblNebo, { d: .45, g: .5 }); cue('pen', T.lblYazyk, { d: .45, g: .5 }); cue('peel', T.peel[0], { d: .5 });
  cue('pen', T.medl[0], { d: .6 }); slaps(A.vydoh, T.vydoh, 1 / 24, .55); cue('breath', T.air[0], { d: 3.4 });
  cue('whoosh', 17.3, { d: .6 }); cue('slide', T.shieldIn, { d: .3, g: 1 }); cue('pen', T.telo[0], { d: .6 }); cue('slide', T.derzh, { d: .22 });
  cue('slide', T.fall, { d: .4, g: .7 }); cue('thud', T.land); slaps(A.mozhno, T.mozhno, 1 / 24, .7); cue('pen', T.otpust[0], { d: .5 });
  cue('whoosh', 21.25, { d: .55 }); slaps(A.n20, T.n20, 1 / 24, .7); cue('pen', T.izHavn[0], { d: .45 }); cue('slide', T.card, { d: .25 });
  cue('chime', T.sun[1] - .2); slaps(A.logo, T.logo, 1 / 12, .5);
  T.items.forEach(t => cue('pen', t, { d: .35, g: .5 })); T.checks.forEach(t => cue('scratch', t, { d: .2 }));
  cue('stamp', T.stamp); cue('slide', T.sohrani, { d: .2 }); cue('pen', T.sohraniW[0], { d: .75 }); cue('slap', T.link + 2 / 12, { g: .5 });
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
