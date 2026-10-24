/* HAVN · «Помогите нам» — 21 s, 1080×1920, ink + cut paper.
   We help people (grey paper people get their own little sun) → now help
   us → copy the link → the link flies as a paper plane to people sitting
   alone, they light up and take each other's hands → HAVN. */
'use strict';

const DUR = 21.0;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae', red: '#e0473c', pink: '#f4a3a0' });

/* ---------- places on the table ---------- */
const S1 = [540, 960];         // we help people
const S2 = [540, 2850];        // now help us
const S3 = [540, 4700];        // copy the link
const S4 = [540, 6600];        // so that fewer people are alone
const S5 = [540, 8400];        // the mark
const CAMK = [
  [0.00, 540, 960, 1.06, -1.0],
  [3.40, 540, 970, 1.00, 0.8],
  [3.95, 540, 2850, 1.00, -0.6],
  [7.30, 540, 2870, 1.08, 0.6],
  [7.85, 540, 4700, 0.95, -0.8],
  [11.85, 540, 4720, 1.00, 0.6],
  [12.45, 540, 6640, 1.02, -0.6],
  [16.90, 540, 6660, 0.88, 0.7],
  [17.45, 540, 8400, 1.05, -0.4],
  [21.00, 540, 8400, 1.12, 0.0]
];
const SHAKES = [[5.1, .45], [14.55, .3]];

/* ---------- timeline ---------- */
const T = {
  my: 0.15, lyudyam: [0.75, 1.25], suns: [1.25, 1.55, 1.85, 2.15, 2.45],
  card: 4.0, teper: [4.25, 4.85], nam: 4.9, popul: 5.6, heart: [6.2, 6.85],
  kop: 7.9, ssyl: [8.35, 8.75], plate: 8.65, finger: [8.95, 9.25], ring: [9.3, 9.9], copied: 10.0, fingerOut: 10.1,
  strip: 10.35, fold: 10.6, fly: [10.8, 11.9],
  land: [12.55, 13.05, 13.35, 13.65, 13.95, 14.25], chobi: [13.0, 13.6], neost: [13.65, 14.15], odni: 14.3, hands: [14.6, 15.4],
  mark: [17.6, 18.35], havn: 18.2, tag: 18.7, link: 19.1, pinned: 19.5
};

/* ---------- assets ---------- */
const A = {};
const ell = (w, h, n = 64) => arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, n);
function rrect(x0, y0, w, h, r) {
  const pts = [], q = Math.PI / 2;
  [[x0 + w - r, y0 + r, -q], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, q], [x0 + r, y0 + r, 2 * q]].forEach(([cx, cy, a]) => { for (let i = 0; i <= 8; i++) { const b = a + q * i / 8; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); } });
  return pts;
}
const textW = (s, font) => { const m = mk(10, 10).getContext('2d'); m.font = font; return m.measureText(s).width; };
function stamp(text, color, size) {
  const font = `900 ${size}px Unb`, tw = textW(text, font), w = tw + 80, h = size * 2.2;
  const c = mk(w + PAD * 2, h + PAD * 2), x = c.getContext('2d'), r = mulberry32(text.length * 31);
  x.filter = 'url(#ink1)'; x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 8;
  x.strokeRect(PAD + 6, PAD + 6, w - 12, h - 12); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 3);
  x.filter = 'none'; x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < w * h / 150; i++) { x.globalAlpha = .3 + r() * .7; x.beginPath(); x.arc(PAD + r() * w, PAD + r() * h, .6 + r() * 2.2, 0, 7); x.fill(); }
  return sprite(c);
}
// a paper person: round head and a body with rounded shoulders; grey when alone
const BODY = [[0, 150], [6, 50], [30, 12], [70, 0], [110, 12], [134, 50], [140, 150]];
function person(color, seed) {
  return { head: card(78, 78, { seed, color, shape: ell(78, 78, 30), tex: .7 }), body: card(140, 150, { seed: seed + 1, color, shape: BODY, tex: .8 }) };
}
const COLS = [PAL.sea2, PAL.orange, PAL.deep, '#7fb6a4', '#e3a35b', '#9a8fc9'];

// row of people in the first scene; a ring of people sitting alone later
const ROW = [140, 340, 540, 740, 940].map((x, i) => [x, S1[1] + 330 + (i % 2 ? 30 : -10)]);
const RING = [[540, 6880], [200, 6720], [880, 6720], [250, 7180], [830, 7180], [540, 7400]];

function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];

  A.grey = person(PAL.lonely, 1);
  A.col = COLS.map((c, i) => person(c, 10 + i * 2));
  const CL = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, sn = Math.sin(a); CL.push([70 + 66 * Math.cos(a), 50 + 26 * sn - (sn < 0 ? 22 * Math.abs(Math.sin(a * 2.5)) : 0)]); }
  A.cloud = card(140, 90, { seed: 31, color: '#d3d7db', shape: CL, tex: .6 });
  A.sun = card(62, 62, { seed: 30, color: PAL.sunO, shape: ell(62, 62, 30) });

  A.my = cutWord('МЫ ПОМОГАЕМ', 88, PAL.orange, { seed: 40 });
  A.lyudyam = inkText('людям', 120, PAL.ink, { seed: 41 });

  A.small = card(360, 230, { seed: 50, color: '#fffdf7', shape: rrect(0, 0, 360, 230, 36), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx, cy - 18, 46, Math.PI, 0); x.fill();
    x.strokeStyle = PAL.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 80, cy - 16); x.lineTo(cx + 80, cy - 16); x.stroke();
    x.font = '900 52px Unb'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.deep; x.fillText('HAVN', cx, cy + 50);
  } });
  A.teper = inkText('теперь помогите и', 92, PAL.ink, { seed: 51 });
  A.nam = cutWord('НАМ', 270, PAL.orange, { seed: 52 });
  A.popul = label('стать популярными', 'italic 600 100px Corm', { seed: 53, h: 150, dy: -5 });

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
  A.copied = stamp('СКОПИРОВАНО', PAL.orange, 44);
  A.fold = [
    card(560, 96, { seed: 64, color: '#ffffff', content: printed('havnhelp.netlify.app', '600 40px Inter', PAL.deep, 2) }),
    card(330, 120, { seed: 65, color: '#ffffff', shape: [[0, 0], [330, 50], [330, 70], [0, 120]] }),
    card(250, 110, { seed: 66, color: '#ffffff', shape: [[0, 0], [250, 62], [24, 110], [52, 66]], content: (x, cx, cy) => { x.strokeStyle = 'rgba(24,41,59,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 73, cy + 11); x.lineTo(cx + 125, cy + 7); x.stroke(); } })
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
  [[S1, S2], [S2, S3], [S3, S4], [S4, S5]].forEach(([a, b], bi) => { for (let i = 0; i < 6; i++) { const u = .2 + DR() * .6; A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + bi * 10 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + (DR() < .5 ? -1 : 1) * (600 + DR() * 280), y: lerp(a[1], b[1], u) + (DR() - .5) * 300, rot: (DR() - .5) * .8, h: DR() * .05 }); } });
}

/* ---------- helpers ---------- */
function wordX(wd, cx, cy, t, t0, o = {}) {
  wd.letters.forEach((L, j) => {
    const d = drop(t, t0 + j * (o.stagger == null ? 1 / 24 : o.stagger)); if (!d) return;
    drawSp(L.sp, cx + L.dx, cy - d.lift * 60, { h: o.h || .05, lift: d.lift, rot: (h2(j, (o.seed || 1) * 7) - .5) * .08 + (d.lift ? (h2(j, 33 + d.k) - .5) * .5 * d.lift : 0) });
  });
}
const dist = (p) => Math.hypot((CAM.x - p[0]) * .6, CAM.y - p[1]);

/* a person at (x, y) = feet; lit flips them from grey and sad to colour, smile and their own sun */
function drawPerson(x, y, lit, ci, t, seed, hop) {
  const tq = step12(t), P = lit ? A.col[ci % COLS.length] : A.grey;
  const sinceLit = lit ? tq - lit : -1, up = sinceLit >= 0 && sinceLit < 4 / 12 ? [26, 40, 20, 6][Math.floor(sinceLit * 12)] : 0;
  const by = y - 75 - up - (hop || 0), hy = y - 190 - up - (hop || 0);
  drawSp(P.body, x, by, { h: .01, elev: 4 });
  drawSp(P.head, x, hy, { h: .012, elev: 4 });
  const L = { t, h: .014, dbl: false, gaps: false, seed };
  inkLine(arc(x - 14, hy - 4, 4, 4, 0, Math.PI * 2, 8), Object.assign({}, L, { w: 7, seed: seed + 1 }));
  inkLine(arc(x + 14, hy - 4, 4, 4, 0, Math.PI * 2, 8), Object.assign({}, L, { w: 7, seed: seed + 2 }));
  if (lit) inkLine(arc(x, hy + 4, 15, 11, Math.PI * .15, Math.PI * .85, 10), Object.assign({}, L, { w: 4.5, seed: seed + 3 }));
  else inkLine(arc(x, hy + 22, 13, 8, Math.PI * 1.2, Math.PI * 1.8, 10), Object.assign({}, L, { w: 4.5, seed: seed + 3 }));
  if (!lit) {
    // a little rain cloud of scribble
    for (let k = 0; k < 3; k++) { const ry = hy - 66 + ((step12(t) * 90 + k * 13) % 30); inkLine(seg([x - 28 + k * 28, ry], [x - 33 + k * 28, ry + 16], 5), { t, seed: seed + 6 + k, w: 3.5, h: .015, alpha: .7, gaps: false, dbl: false, color: PAL.deep }); }
    drawSp(A.cloud, x, hy - 102, { h: .016, elev: 3 });
  } else {
    const k = Math.round(sinceLit * 12), sc = k <= 0 ? .4 : k === 1 ? 1.25 : 1;
    drawSp(A.sun, x, hy - 92, { h: .018, elev: 3, sc });
    for (let r = 0; r < 8; r++) { const a = r * Math.PI / 4 + .2; inkLine(seg([x + Math.cos(a) * 42, hy - 92 + Math.sin(a) * 42], [x + Math.cos(a) * 58, hy - 92 + Math.sin(a) * 58], 5), { t, seed: seed + 10 + r, w: 4, h: .018, p: prog(t, lit + .1, lit + .3), gaps: false, dbl: false, color: PAL.sunO }); }
  }
}

/* ---------- scenes ---------- */
function weHelp(t) {
  const [cx, cy] = S1;
  wordX(A.my, cx, cy - 350, t, T.my, { h: .05, seed: 40 });
  drawInk(A.lyudyam, cx, cy - 175, { t, p: prog(t, T.lyudyam[0], T.lyudyam[1]), h: .045, rot: -.02, seed: 1 });
  ROW.forEach(([x, y], i) => drawPerson(x, y, step12(t) >= T.suns[i] ? T.suns[i] : 0, i, t, 100 + i * 20));
  inkLine(wavy(60, 1020, cy + 360, 3, .02, 2), { t, seed: 90, w: 4, h: .006, alpha: .5 });
}

function helpUs(t) {
  const tq = step12(t), [cx, cy] = S2;
  drawInk(A.teper, cx, cy - 430, { t, p: prog(t, T.teper[0], T.teper[1]), h: .045, rot: -.02, seed: 2 });
  wordX(A.nam, cx, cy - 190, t, T.nam, { h: .06, seed: 52, stagger: 1 / 12 });
  if (tq >= T.popul) { const u = slide(t, T.popul, .22); drawSp(A.popul, cx + (1 - u) * 1000, cy + 30, { h: .05, lift: (1 - u) * .45, rot: -.02, elev: 8 }); }
  const d = drop(t, T.card);
  if (d) drawSp(A.small, cx, cy + 330 - d.lift * 60, { h: .02, lift: d.lift, rot: .03, elev: 7 });
  if (t > T.heart[0]) {
    const H = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; H.push([cx + 16 * Math.pow(Math.sin(a), 3) * 17, cy + 320 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 17]); }
    inkLine(H, { t, seed: 200, w: 7, h: .03, p: eIO(prog(t, T.heart[0], T.heart[1])), color: PAL.orange, gaps: false });
  }
}

function copyLink(t) {
  const tq = step12(t), [cx, cy] = S3;
  wordX(A.kop, cx, cy - 400, t, T.kop, { h: .05, seed: 60 });
  drawInk(A.ssyl, cx, cy - 230, { t, p: prog(t, T.ssyl[0], T.ssyl[1]), h: .045, rot: -.02, seed: 3 });
  const pd = drop(t, T.plate), plY = cy - 10, icon = [cx + 338, plY + 2];
  if (pd) drawSp(A.plate, cx, plY - pd.lift * 60, { h: .03, lift: pd.lift, rot: -.012, elev: 8 });
  if (t > T.ring[0]) inkLine(arc(icon[0], icon[1], 66, 66, -Math.PI / 2, Math.PI * 1.5, 50), { t, seed: 210, w: 7, h: .045, p: prog(t, T.ring[0], T.ring[1]), color: PAL.orange, gaps: false });
  if (t > T.finger[0] && tq < T.fingerOut + .35) {
    const inn = slide(t, T.finger[0], T.finger[1] - T.finger[0]), outU = slide(t, T.fingerOut, .3, eIn), press = tq >= T.finger[1] && tq < T.fingerOut ? 1 : 0;
    const k = (1 - inn) + outU, ang = -.42;
    const tipX = icon[0] + 14 + Math.sin(-ang) * k * 700, tipY = icon[1] + 24 + Math.cos(ang) * k * 700;
    drawSp(A.finger, tipX - Math.sin(ang) * 255, tipY + Math.cos(ang) * 255, { h: .05 - press * .006, lift: .3 - press * .22, rot: ang, elev: 10 });
  }
  const k = Math.round((tq - T.copied) * 12);
  if (k >= 0) {
    drawSp(A.copied, cx - 70, cy + 170, { h: .05, rot: -.04, sc: k === 0 ? 1.3 : k === 1 ? 1.04 : 1, alpha: k === 0 ? .7 : 1, shadow: false });
    inkLine(chain([cx + 230, cy + 160], [cx + 262, cy + 194], [cx + 330, cy + 116]), { t, seed: 211, w: 10, h: .05, p: eOut(prog(t, T.copied + .1, T.copied + .3)), color: PAL.orange, dbl: false });
  }
  // the copy peels off, folds into a plane and flies down the table to the people who are alone
  if (tq >= T.strip) {
    const fu = slide(t, T.fly[0], T.fly[1] - T.fly[0], eIn), st = tq < T.fold ? 0 : tq < T.fold + 2 / 12 ? 1 : 2, lu = slide(t, T.strip, .25);
    const P0 = [cx - 20, plY - 30 - lu * 170], C1 = [cx + 650, cy - 500], C2 = [cx + 500, cy + 900], P1 = [cx + 100, cy + 1700];
    const bz = (u) => [0, 1].map(c => (1 - u) ** 3 * P0[c] + 3 * (1 - u) ** 2 * u * C1[c] + 3 * (1 - u) * u * u * C2[c] + u ** 3 * P1[c]);
    const [x, y] = bz(fu), [x2, y2] = bz(Math.min(1, fu + .02));
    const rot = fu > 0 ? Math.atan2(y2 - y, x2 - x) : -.02;
    const fa = .5 * (1 - prog(t, T.fly[1], T.fly[1] + .5));
    if (fu > 0 && fa > 0) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(bz(fu * i / 40)); inkLine(pts, { t, seed: 212, w: 4, h: .06, alpha: fa, gaps: false, dbl: false }); }
    if (fu < 1) drawSp(A.fold[st], x, y, { h: .065, lift: .5 + lu * .2, rot, elev: 10 });
  }
}

// planes land beside people sitting alone; each lights up, then they take hands
function notAlone(t) {
  const tq = step12(t), [cx] = S4;
  drawInk(A.chobi, cx, 5990, { t, p: prog(t, T.chobi[0], T.chobi[1]), h: .045, rot: -.02, seed: 4 });
  drawInk(A.neost, cx - 60, 6115, { t, p: prog(t, T.neost[0], T.neost[1]), h: .045, rot: .01, seed: 5 });
  wordX(A.odni, cx + 40, 6300, t, T.odni, { h: .06, seed: 72, stagger: 1 / 12 });
  // hands: an ink line from each person to the next one round the ring
  const order = [1, 0, 2, 4, 5, 3, 1];
  if (t > T.hands[0]) for (let i = 0; i < order.length - 1; i++) {
    const a = RING[order[i]], b = RING[order[i + 1]], p = prog(t, T.hands[0] + i * .1, T.hands[0] + i * .1 + .3);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 60 + 30 * Math.sin(i)];
    inkLine(smooth([[a[0], a[1] - 90], mid, [b[0], b[1] - 90]], 12), { t, seed: 300 + i, w: 5, h: .009, p, color: PAL.orange, dbl: false });
  }
  RING.forEach(([x, y], i) => {
    const tl = T.land[i], lit = tq >= tl + 3 / 12 ? tl + 3 / 12 : 0;
    // the plane comes down from above and lands on the table next to them
    const fu = clamp((t - (tl - .5)) / .5);
    const pa = 1 - prog(t, tl + .45, tl + .75);
    if (fu > 0 && pa > 0) {
      const ex = x + 110, ey = y - 30, sx = ex + 300 * (i % 2 ? -1 : 1), sy = ey - 1100;
      const u = eOut(fu), px = lerp(sx, ex, u), py = lerp(sy, ey, u) - Math.sin(u * Math.PI) * 80;
      drawSp(A.fold[2], px, py, { h: lerp(.06, .008, u), lift: (1 - u) * .7, rot: lerp(1.2 * (i % 2 ? -1 : 1), .15, u), sc: .7, elev: 6, alpha: pa });
    }
    drawPerson(x, y, lit, i + 1, t, 400 + i * 20);
  });
}

function mark(t) {
  const tq = step12(t), [cx, cy] = S5;
  const su = slide(t, T.mark[0], T.mark[1] - T.mark[0], eIO);
  ctx.save(); layer(.02); ctx.beginPath(); ctx.rect(cx - 220, cy - 620, 440, 302); ctx.clip();
  drawSp(A.bigSun, cx, cy - 400 + 160 * (1 - su), { h: .02, elev: 4 }); ctx.restore();
  inkLine(seg([cx - 330, cy - 322], [cx + 330, cy - 322], 9), { t, seed: 600, w: 6, p: prog(t, T.mark[0], T.mark[0] + .4), h: .022 });
  inkLine(wavy(cx - 220, cx + 220, cy - 286, 5, .05, 1), { t, seed: 601, w: 5, p: prog(t, T.mark[0] + .3, T.mark[0] + .6), h: .022, color: PAL.deep });
  inkLine(wavy(cx - 130, cx + 130, cy - 254, 5, .05, 3), { t, seed: 602, w: 5, p: prog(t, T.mark[0] + .45, T.mark[0] + .75), h: .022, color: PAL.deep });
  word(A.havn, cx, cy - 80, t, T.havn, { h: .04, seed: 81 });
  if (tq >= T.tag) { const u = slide(t, T.tag, .22); drawSp(A.tag, cx - (1 - u) * 1000, cy + 100, { h: .045, lift: (1 - u) * .4, rot: -.015, elev: 7 }); }
  const li = drop(t, T.link);
  if (li) drawSp(A.link, cx, cy + 250 - li.lift * 50, { h: .05, lift: li.lift, rot: .02, elev: 8 });
  const pi = drop(t, T.pinned);
  if (pi) drawSp(A.pinned, cx, cy + 400 - pi.lift * 50, { h: .05, lift: pi.lift, rot: -.015, elev: 8 });
}

function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500 && Math.abs(d.x - CAM.x) < 1100) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (dist(S1) < 2000) weHelp(t);
  if (dist(S2) < 2000 && t > 3) helpUs(t);
  if (dist(S3) < 2200 && t > 6.8) copyLink(t);
  if (dist(S4) < 2000 && t > 11) notAlone(t);
  if (dist(S5) < 2000 && t > 16.5) mark(t);
}

/* ---------- sound cues ---------- */
function slaps(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('slap', t0 + j * stagger + 2 / 12, { g })); }
function buildCues() {
  slaps(A.my, T.my, 1 / 24, .6); cue('pen', T.lyudyam[0], { d: .5 });
  T.suns.forEach((s, i) => cue('sun', s, { i }));
  cue('whoosh', 3.4, { d: .55 });
  cue('slap', T.card + 2 / 12, { g: .8 }); cue('pen', T.teper[0], { d: .6 }); slaps(A.nam, T.nam, 1 / 12, 1); cue('thud', T.nam + 2 / 12 + 2 / 12);
  cue('slide', T.popul, { d: .22 }); cue('pen', T.heart[0], { d: .65, g: .7 }); cue('chime', T.heart[1], { hi: 0 });
  cue('whoosh', 7.3, { d: .55 });
  slaps(A.kop, T.kop, 1 / 24, .6); cue('pen', T.ssyl[0], { d: .4 }); cue('slap', T.plate + 2 / 12, { g: 1 });
  cue('slide', T.finger[0], { d: .3, g: .6 }); cue('press', T.finger[1]); cue('pen', T.ring[0], { d: .6, g: .6 }); cue('copy', T.copied); cue('stamp', T.copied);
  cue('peel', T.strip, { d: .25 }); cue('fold', T.fold); cue('fold', T.fold + 2 / 12); cue('plane', T.fly[0], { d: 1.4 });
  T.land.forEach((l, i) => { if (i) cue('plane', l - .5, { d: .55, g: .5 }); cue('tap', l, { i }); cue('sun', l + 3 / 12, { i: i + 5 }); });
  cue('pen', T.chobi[0], { d: .55 }); cue('pen', T.neost[0], { d: .5 }); slaps(A.odni, T.odni, 1 / 12, .8);
  cue('pen', T.hands[0], { d: .9, g: .7 }); cue('chime', T.hands[1], { hi: 1 });
  cue('whoosh', 16.95, { d: .55 });
  cue('chime', T.mark[1] - .2, { hi: 2 }); slaps(A.havn, T.havn, 1 / 12, .5); cue('slide', T.tag, { d: .22 }); cue('slap', T.link + 2 / 12, { g: .5 }); cue('slap', T.pinned + 2 / 12, { g: .4 });
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
