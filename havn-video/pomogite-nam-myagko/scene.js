/* HAVN · «Помогите нам», soft version — 32 s, 1080×1920, ink + cut paper.
   Everything floats and eases; nothing slams. It opens on one grey paper
   person alone at night under a rain cloud, phone beside them: no new
   messages. A small sun comes, the cloud drifts away — we help people.
   Then: help us too, copy the link, and the link glides as a paper plane
   to others sitting alone. */
'use strict';

const DUR = 32.0;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae', phone: '#22313f' });

/* ---------- places on the table ---------- */
const S1 = [540, 1000];        // the lonely person, then the people we help
const S2 = [540, 3100];        // help us
const S3 = [540, 5000];        // copy the link
const S4 = [540, 6900];        // so that fewer people are alone
const S5 = [540, 8700];        // the mark
const MAIN = [470, 1270], PHONE = [810, 1170];
const CAMK = [
  [0.00, 575, 1100, 1.52, -0.8],
  [6.80, 570, 1090, 1.62, 0.5],
  [7.90, 565, 1070, 1.56, 0.4],
  [10.20, 540, 1000, 0.86, -0.6],
  [11.40, 540, 995, 0.87, -0.5],
  [12.60, 540, 3100, 0.98, 0.5],
  [17.20, 540, 3110, 1.04, -0.3],
  [18.40, 540, 5000, 0.95, -0.6],
  [22.70, 540, 5020, 1.00, 0.4],
  [23.90, 540, 6900, 0.98, -0.4],
  [27.40, 540, 6920, 0.88, 0.5],
  [28.60, 540, 8700, 1.05, -0.3],
  [32.00, 540, 8700, 1.12, 0.0]
];
const SHAKES = [];

/* ---------- timeline ---------- */
const T = {
  komu: [0.8, 2.7], ryadom: [3.4, 5.4], tear: 2.2, textOut: 6.3,
  sun: 6.9, my: 9.3, lyudyam: [9.9, 10.5], others: [9.5, 9.85, 10.2, 10.55, 10.9],
  znayut: [12.7, 14.1], pomog: [14.2, 14.8], nam: 14.8, popul: 15.5, card: 15.2, heart: [15.9, 16.9],
  kop: 18.4, ssyl: [18.95, 19.45], plate: 19.2, finger: [19.7, 20.2], ring: [20.3, 21.0], copied: 21.05, fingerOut: 21.15,
  strip: 21.6, fold: 21.85, fly: [22.3, 23.8],
  land: [23.9, 24.3, 24.65, 25.0, 25.35, 25.7], chobi: [24.4, 25.2], neost: [25.3, 25.9], odni: 26.0, hands: [26.5, 27.5],
  mark: [28.7, 29.6], havn: 29.3, tag: 29.8, link: 30.25, pinned: 30.7
};

/* ---------- assets ---------- */
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
const OTHERS = [[150, 1580], [950, 1640], [270, 1990], [820, 2030], [560, 2110]];
const RING = [[540, 7180], [200, 7020], [880, 7020], [250, 7480], [830, 7480], [540, 7700]];

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
  A.phone = card(200, 350, { seed: 33, color: PAL.phone, shape: rrect(0, 0, 200, 350, 30), tex: .8 });
  A.screen = card(176, 318, { seed: 34, color: '#eef3f6', shape: rrect(0, 0, 176, 318, 22), tex: .5, content: (x, cx, cy) => {
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(24,41,59,.55)';
    x.font = '600 20px Inter'; x.fillText('23:47', cx, cy - 128);
    x.font = '600 23px Inter'; x.fillText('нет новых', cx, cy - 10); x.fillText('сообщений', cx, cy + 20);
  } });

  A.komu = inkText('кому-то сейчас очень тяжело', 52, PAL.ink, { seed: 40 });
  A.ryadom = inkText('и кажется, что рядом — никого', 52, PAL.ink, { seed: 41 });
  A.my = cutWord('МЫ ПОМОГАЕМ', 96, PAL.orange, { seed: 42 });
  A.lyudyam = inkText('людям', 130, PAL.ink, { seed: 43 });

  A.znayut = inkText('но о нас пока знают немногие', 80, PAL.ink, { seed: 50 });
  A.pomog = inkText('помогите и', 100, PAL.ink, { seed: 51 });
  A.nam = cutWord('НАМ', 240, PAL.orange, { seed: 52 });
  A.popul = label('стать популярными', 'italic 600 100px Corm', { seed: 53, h: 150, dy: -5 });
  A.small = card(360, 230, { seed: 54, color: '#fffdf7', shape: rrect(0, 0, 360, 230, 36), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx, cy - 18, 46, Math.PI, 0); x.fill();
    x.strokeStyle = PAL.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 80, cy - 16); x.lineTo(cx + 80, cy - 16); x.stroke();
    x.font = '900 52px Unb'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.deep; x.fillText('HAVN', cx, cy + 50);
  } });

  A.kop = cutWord('СКОПИРУЙТЕ', 104, PAL.orange, { seed: 60 });
  A.ssyl = inkText('ссылку', 116, PAL.ink, { seed: 61 });
  A.plate = card(860, 150, { seed: 62, color: PAL.deep, content: (x, cx, cy) => {
    x.font = '600 54px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText('havnhelp.netlify.app', cx - 380, cy + 2);
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.lineJoin = 'round';
    x.beginPath(); x.roundRect(cx + 300, cy - 30, 44, 50, 8); x.stroke();
    x.fillStyle = PAL.deep; x.beginPath(); x.roundRect(cx + 316, cy - 14, 44, 50, 8); x.fill(); x.stroke();
  } });
  A.finger = card(130, 560, { seed: 63, color: PAL.skin, shape: rrect(0, 0, 130, 560, 62), tex: .5, content: (x, cx, cy) => {
    x.fillStyle = '#f8ddc6'; x.beginPath(); x.roundRect(cx - 38, cy - 268, 76, 84, 30); x.fill();
    x.strokeStyle = 'rgba(160,110,80,.5)'; x.lineWidth = 4; x.lineCap = 'round';
    [-60, -40].forEach(d => { x.beginPath(); x.moveTo(cx - 34, cy + d); x.lineTo(cx + 34, cy + d + 2); x.stroke(); });
  } });
  A.copied = label('ссылка скопирована', '600 46px Inter', { seed: 64, h: 104, color: '#fff4dc', torn: false, shape: rrect(0, 0, textW('ссылка скопирована', '600 46px Inter') + 150, 104, 50), dy: 0 });
  A.fold = [
    card(560, 96, { seed: 65, color: '#ffffff', content: printed('havnhelp.netlify.app', '600 40px Inter', PAL.deep, 2) }),
    card(330, 120, { seed: 66, color: '#ffffff', shape: [[0, 0], [330, 50], [330, 70], [0, 120]] }),
    card(250, 110, { seed: 67, color: '#ffffff', shape: [[0, 0], [250, 62], [24, 110], [52, 66]], content: (x, cx, cy) => { x.strokeStyle = 'rgba(24,41,59,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 73, cy + 11); x.lineTo(cx + 125, cy + 7); x.stroke(); } })
  ];

  A.chobi = inkText('чтобы больше людей', 92, PAL.ink, { seed: 70 });
  A.neost = inkText('не оставались', 92, PAL.ink, { seed: 71 });
  A.odni = cutWord('ОДНИ', 200, PAL.orange, { seed: 72 });

  A.bigSun = card(300, 150, { seed: 80, color: PAL.sunO, shape: arc(150, 150, 150, 150, Math.PI, Math.PI * 2, 50).concat([[300, 150], [0, 150]]) });
  A.havn = cutWord('HAVN', 170, PAL.deep, { seed: 81, track: 10 });
  A.tag = label('тихое место, когда тяжело', 'italic 600 72px Corm', { seed: 82, h: 112, dy: -4 });
  A.link = card(600, 92, { seed: 83, color: PAL.deep, content: printed('havnhelp.netlify.app', '600 46px Inter', '#ffffff', 2) });
  A.pinned = label('ссылка — в закреплённом комментарии ↓', '600 38px Inter', { seed: 84, h: 92, color: PAL.cream, dy: 0 });

  const DR = mulberry32(7); A.decor = [];
  [[S1, S2], [S2, S3], [S3, S4], [S4, S5]].forEach(([a, b], bi) => { for (let i = 0; i < 6; i++) { const u = .25 + DR() * .5; A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + bi * 10 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + (DR() < .5 ? -1 : 1) * (620 + DR() * 260), y: lerp(a[1], b[1], u) + (DR() - .5) * 300, rot: (DR() - .5) * .8, h: DR() * .05 }); } });
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

/* ---------- scenes ---------- */
function lonely(t) {
  const [px, py] = PHONE;
  // the phone: its pale light is the only light in the room at first
  drawSp(A.phone, px, py, { h: .008, rot: .06, elev: 5 });
  drawSp(A.screen, px, py, { h: .009, rot: .06, shadow: false });
  drawPerson(MAIN[0], MAIN[1], 1.5, T.sun, 1, t, 100, { tear: T.tear });
  inkIn(A.komu, 565, 1430, t, T.komu, { out: T.textOut, rot: -.02, seed: 1 });
  inkIn(A.ryadom, 565, 1540, t, T.ryadom, { out: T.textOut, rot: .01, seed: 2 });
  floatWord(A.my, 540, 300, t, T.my, { seed: 42 });
  inkIn(A.lyudyam, 540, 470, t, T.lyudyam, { rot: -.02, seed: 3 });
  OTHERS.forEach(([x, y], i) => { if (t > T.others[0] - 1.5) drawPerson(x, y, 1, T.others[i], i + 2, t, 200 + i * 20); });
}

function helpUs(t) {
  const [cx] = S2;
  inkIn(A.znayut, cx, 2580, t, T.znayut, { rot: -.015, seed: 4 });
  inkIn(A.pomog, cx, 2740, t, T.pomog, { rot: .01, seed: 5 });
  floatWord(A.nam, cx, 2950, t, T.nam, { h: .06, seed: 52, stagger: .12 });
  if (t > T.popul) { const u = slide(t, T.popul, .9, eIO); drawSp(A.popul, cx + (1 - u) * 300, 3170, { h: .05, lift: (1 - u) * .35, rot: -.02, elev: 8, alpha: u }); }
  const d = drop(t, T.card, 1.1);
  if (d) drawSp(A.small, cx, 3490 - d.lift * 70, { h: .02, lift: d.lift, rot: .03, elev: 7, alpha: d.a });
  if (t > T.heart[0]) {
    const H = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; H.push([cx + 16 * Math.pow(Math.sin(a), 3) * 17, 3480 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 17]); }
    inkLine(H, { t, seed: 210, w: 7, h: .03, p: eIO(prog(t, T.heart[0], T.heart[1])), color: PAL.orange, gaps: false, amp: 1.2 });
  }
}

function copyLink(t) {
  const [cx, cy] = S3;
  floatWord(A.kop, cx, cy - 400, t, T.kop, { seed: 60, stagger: .05 });
  inkIn(A.ssyl, cx, cy - 230, t, T.ssyl, { rot: -.02, seed: 6 });
  const pd = drop(t, T.plate, 1.0), plY = cy - 10, icon = [cx + 338, plY + 2];
  if (pd) drawSp(A.plate, cx, plY - pd.lift * 70, { h: .03, lift: pd.lift, rot: -.012, elev: 8, alpha: pd.a });
  if (t > T.ring[0]) inkLine(arc(icon[0], icon[1], 66, 66, -Math.PI / 2, Math.PI * 1.5, 50), { t, seed: 220, w: 7, h: .045, p: eSine(prog(t, T.ring[0], T.ring[1])), color: PAL.orange, gaps: false, amp: 1 });
  if (t > T.finger[0] && t < T.fingerOut + .7) {
    const inn = eIO(prog(t, T.finger[0], T.finger[1])), outU = eIO(prog(t, T.fingerOut, T.fingerOut + .6));
    const press = eSine(prog(t, T.finger[1] - .1, T.finger[1] + .15)) * (1 - prog(t, T.fingerOut - .1, T.fingerOut + .1));
    const k = (1 - inn) + outU, ang = -.42;
    const tipX = icon[0] + 14 + Math.sin(-ang) * k * 700, tipY = icon[1] + 24 + Math.cos(ang) * k * 700;
    drawSp(A.finger, tipX - Math.sin(ang) * 255, tipY + Math.cos(ang) * 255, { h: .05 - press * .006, lift: .3 - press * .22, rot: ang, elev: 10 });
  }
  if (t > T.copied) {
    const u = eOut(prog(t, T.copied, T.copied + .5));
    drawSp(A.copied, cx - 80, cy + 175 - (1 - u) * 30, { h: .05, rot: -.02, sc: .92 + .08 * u, alpha: u, elev: 6, lift: (1 - u) * .3 });
    const rx = cx - 80 + A.copied.w / 2 - PAD;
    inkLine(chain([rx + 24, cy + 170], [rx + 48, cy + 196], [rx + 92, cy + 140]), { t, seed: 221, w: 9, h: .052, p: eOut(prog(t, T.copied + .25, T.copied + .6)), color: PAL.orange, dbl: false, gaps: false, amp: .8 });
  }
  // the copy lifts off, folds into a plane and glides down the table
  if (t > T.strip) {
    const fu = eIO(prog(t, T.fly[0], T.fly[1])), lu = eIO(prog(t, T.strip, T.strip + .5));
    const P0 = [cx - 20, plY - 30 - lu * 170], C1 = [cx + 650, cy - 500], C2 = [cx + 500, cy + 900], P1 = [cx + 100, cy + 1800];
    const bz = (u) => [0, 1].map(c => (1 - u) ** 3 * P0[c] + 3 * (1 - u) ** 2 * u * C1[c] + 3 * (1 - u) * u * u * C2[c] + u ** 3 * P1[c]);
    const [x, y] = bz(fu), [x2, y2] = bz(Math.min(1, fu + .02));
    const rot = lerp(-.02, Math.atan2(y2 - y, x2 - x), eIO(prog(t, T.fold + .2, T.fly[0] + .3)));
    const fa = .45 * (1 - prog(t, T.fly[1], T.fly[1] + .8));
    if (fu > 0 && fa > 0) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(bz(fu * i / 40)); inkLine(pts, { t, seed: 222, w: 4, h: .06, alpha: fa, gaps: false, dbl: false, amp: 1 }); }
    if (fu < 1) {
      const f = clamp((t - T.fold) / .45) * 2;            // crossfade strip → fold → plane
      const i0 = Math.min(2, Math.floor(f)), w = f - i0;
      drawSp(A.fold[i0], x, y, { h: .065, lift: .5 + lu * .2, rot, elev: 10, alpha: i0 < 2 ? 1 - w : 1 });
      if (i0 < 2 && w > 0) drawSp(A.fold[i0 + 1], x, y, { h: .065, lift: .5 + lu * .2, rot, elev: 10, alpha: w, shadow: false });
    }
  }
}

// planes glide down beside people sitting alone; each one is lit, then they take hands
function notAlone(t) {
  const [cx] = S4;
  inkIn(A.chobi, cx, 6290, t, T.chobi, { rot: -.02, seed: 7 });
  inkIn(A.neost, cx - 60, 6415, t, T.neost, { rot: .01, seed: 8 });
  floatWord(A.odni, cx + 40, 6600, t, T.odni, { h: .06, seed: 72, stagger: .1 });
  const order = [1, 0, 2, 4, 5, 3, 1];
  if (t > T.hands[0]) for (let i = 0; i < order.length - 1; i++) {
    const a = RING[order[i]], b = RING[order[i + 1]], p = eSine(prog(t, T.hands[0] + i * .12, T.hands[0] + i * .12 + .5));
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 60 + 30 * Math.sin(i)];
    inkLine(smooth([[a[0], a[1] - 90], mid, [b[0], b[1] - 90]], 12), { t, seed: 300 + i, w: 5, h: .009, p, color: PAL.orange, dbl: false, amp: 1 });
  }
  RING.forEach(([x, y], i) => {
    const tl = T.land[i], fu = eIO(clamp((t - (tl - .9)) / .9)), pa = 1 - prog(t, tl + .4, tl + .9);
    if (fu > 0 && pa > 0) {
      const ex = x + 110, ey = y - 30, sx = ex + 320 * (i % 2 ? -1 : 1), sy = ey - 1100;
      const px = lerp(sx, ex, fu), py = lerp(sy, ey, fu) - Math.sin(fu * Math.PI) * 90;
      drawSp(A.fold[2], px, py, { h: lerp(.06, .008, fu), lift: (1 - fu) * .7, rot: lerp(1.2 * (i % 2 ? -1 : 1), .15, fu), sc: .7, elev: 6, alpha: pa });
    }
    drawPerson(x, y, 1, tl + .1, i + 1, t, 400 + i * 20);
  });
}

function mark(t) {
  const [cx, cy] = S5;
  const su = eIO(prog(t, T.mark[0], T.mark[1]));
  glow(cx, cy - 330, 520, 'rgba(255,190,120,A)', su * .8, .015);
  ctx.save(); layer(.02); ctx.beginPath(); ctx.rect(cx - 220, cy - 620, 440, 302); ctx.clip();
  drawSp(A.bigSun, cx, cy - 400 + 160 * (1 - su), { h: .02, elev: 4 }); ctx.restore();
  inkLine(seg([cx - 330, cy - 322], [cx + 330, cy - 322], 9), { t, seed: 600, w: 6, p: eSine(prog(t, T.mark[0], T.mark[0] + .6)), h: .022 });
  inkLine(wavy(cx - 220, cx + 220, cy - 286, 5, .05, 1), { t, seed: 601, w: 5, p: eSine(prog(t, T.mark[0] + .4, T.mark[0] + .9)), h: .022, color: PAL.deep });
  inkLine(wavy(cx - 130, cx + 130, cy - 254, 5, .05, 3), { t, seed: 602, w: 5, p: eSine(prog(t, T.mark[0] + .6, T.mark[0] + 1.1)), h: .022, color: PAL.deep });
  floatWord(A.havn, cx, cy - 80, t, T.havn, { h: .04, seed: 81, stagger: .1 });
  if (t > T.tag) { const u = eIO(prog(t, T.tag, T.tag + .9)); drawSp(A.tag, cx - (1 - u) * 260, cy + 100, { h: .045, lift: (1 - u) * .3, rot: -.015, elev: 7, alpha: u }); }
  const li = drop(t, T.link, 1.0);
  if (li) drawSp(A.link, cx, cy + 250 - li.lift * 60, { h: .05, lift: li.lift, rot: .02, elev: 8, alpha: li.a });
  const pi = drop(t, T.pinned, 1.0);
  if (pi) drawSp(A.pinned, cx, cy + 400 - pi.lift * 60, { h: .05, lift: pi.lift, rot: -.015, elev: 8, alpha: pi.a });
}

function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500 && Math.abs(d.x - CAM.x) < 1100) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (dist(S1) < 2200) lonely(t);
  if (dist(S2) < 2000 && t > 11) helpUs(t);
  if (dist(S3) < 2200 && t > 16.5) copyLink(t);
  if (dist(S4) < 2000 && t > 22) notAlone(t);
  if (dist(S5) < 2000 && t > 27) mark(t);
  // night at the start: a cool dim with only the phone's light, lifting as the sun comes
  const dim = 1 - eIO(prog(t, T.sun - .2, T.sun + 1.6));
  if (dim > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(118,132,168,${(dim * .62).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    glow(PHONE[0], PHONE[1], 420, 'rgba(170,205,235,A)', dim * .75, .009);
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ---------- sound cues ---------- */
function brushes(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('tap', t0 + j * stagger + .3, { i: j, g })); }
function buildCues() {
  cue('rain', 0, { d: T.sun + 1.4 });
  cue('pen', T.komu[0], { d: 1.9, g: .55 }); cue('pen', T.ryadom[0], { d: 2.0, g: .55 }); cue('drip', T.tear + .8);
  cue('swell', T.sun - 1.2, { d: 1.4 }); cue('sun', T.sun + .3, { i: 0 });
  brushes(A.my, T.my, .06, .4); cue('pen', T.lyudyam[0], { d: .7, g: .5 });
  T.others.forEach((s, i) => cue('sun', s + .3, { i: i + 1 }));
  cue('whoosh', 11.4, { d: 1.2, g: .6 });
  cue('pen', T.znayut[0], { d: 1.4, g: .5 }); cue('pen', T.pomog[0], { d: .6, g: .5 }); brushes(A.nam, T.nam, .12, .7);
  cue('slide', T.popul, { d: .9, g: .5 }); cue('slide', T.card, { d: .9, g: .4 }); cue('pen', T.heart[0], { d: 1.0, g: .5 }); cue('chime', T.heart[1], { hi: 0 });
  cue('whoosh', 17.2, { d: 1.2, g: .6 });
  brushes(A.kop, T.kop, .05, .35); cue('pen', T.ssyl[0], { d: .5, g: .5 }); cue('slide', T.plate, { d: .8, g: .4 });
  cue('slide', T.finger[0], { d: .5, g: .4 }); cue('press', T.finger[1]); cue('pen', T.ring[0], { d: .7, g: .45 }); cue('copy', T.copied);
  cue('peel', T.strip, { d: .4 }); cue('fold', T.fold + .1); cue('fold', T.fold + .35); cue('plane', T.fly[0] - .2, { d: 1.8, g: .8 });
  T.land.forEach((l, i) => { if (i) cue('plane', l - .9, { d: 1.0, g: .35 }); cue('sun', l + .4, { i: i + 6 }); });
  cue('pen', T.chobi[0], { d: .8, g: .5 }); cue('pen', T.neost[0], { d: .6, g: .5 }); brushes(A.odni, T.odni, .1, .6);
  cue('pen', T.hands[0], { d: 1.2, g: .5 }); cue('chime', T.hands[1], { hi: 1 });
  cue('whoosh', 27.4, { d: 1.2, g: .6 });
  cue('chime', T.mark[1] - .2, { hi: 2 }); brushes(A.havn, T.havn, .1, .35); cue('slide', T.tag, { d: .9, g: .4 }); cue('slide', T.link, { d: .8, g: .35 });
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
