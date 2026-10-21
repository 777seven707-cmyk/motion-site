/* HAVN · «Гавань» — a one-minute tour of the site, 1080×1920.
   Havn is Danish for harbour: a paper boat in a storm of words finds the
   harbour, and every pier on the way is one thing the site really has. */
'use strict';

const DUR = 63.5;
Object.assign(PAL, {
  storm0: '#5a83a1', storm1: '#4a7192', storm2: '#3d6384', storm3: '#315575', stormSky: '#b9c3ca',
  calmSky: '#d6ebf8', grass: '#a9c98f', pink: '#ef9a8f', cat: '#e9a462', dog: '#d8b48a', dogEar: '#a9825d',
  bird: '#f5cf5a', wing: '#e3b13a', skin: '#ecc9a4', rock: '#8f938c', lid: '#a98257'
});

/* ---------- where each scene sits on the table, and when the camera is there ---------- */
// [arrive, leave, x, y, zoomIn, zoomOut, rotIn, rotOut, centreOffsetY]
const SC = [
  [0.00, 4.40, 540, 960, 1.12, 1.00, -2.0, 1.2, -40],
  [4.95, 11.20, 900, 3400, 1.00, 1.05, -1.2, 0.8, -110],
  [11.75, 15.10, 320, 5050, 1.02, 1.08, 1.0, -0.8, -20],
  [15.62, 20.15, 860, 7100, 1.00, 1.06, -0.8, 0.9, -20],
  [20.68, 25.65, 300, 9150, 1.02, 1.07, 1.1, -0.7, -20],
  [26.18, 30.10, 860, 11200, 1.00, 1.05, -1.0, 0.8, -20],
  [30.62, 35.20, 300, 13250, 1.02, 1.07, 0.9, -1.0, -20],
  [35.72, 40.15, 860, 15300, 1.00, 1.05, -1.1, 0.7, -20],
  [40.68, 48.20, 300, 17350, 1.10, 0.95, 0.8, -0.6, 40],
  [48.72, 54.25, 860, 19400, 1.00, 1.05, -0.9, 0.8, 40],
  [54.85, 63.50, 540, 21550, 1.00, 1.07, 1.0, -0.2, -40]
];
const P = SC.map(s => [s[2], s[3]]);
const CAMK = [];
SC.forEach((s, i) => {
  if (i === 8) {
    // close on the box first; the pull-back reveals the phone drawn around it
    CAMK.push([s[0], s[2], s[3] - 160, 1.10, .8], [44.6, s[2], s[3] - 140, 1.10, .2], [46.0, s[2], s[3] + 40, .95, -.3], [s[1], s[2], s[3] + 70, .97, -.6]);
  } else CAMK.push([s[0], s[2], s[3] + s[8] - 35, s[4], s[6]], [s[1], s[2], s[3] + s[8] + 35, s[5], s[7]]);
});
const SHAKES = [[1.55, .8], [11.95, .45], [13.05, .45], [14.05, .55], [50.0, .3]];

/* ---------- timeline ---------- */
const T = {
  // 1 storm
  kogda: [0.25, 0.9], shtorm: 0.95, flash: 1.55, perezhdat: 2.55,
  // 2 harbour
  beam: 5.0, havn: 5.3, gavan: 6.3, tihoeLbl: 7.5, tihoe: [7.65, 8.6], kuda: [8.9, 9.6], kogda2: [9.75, 10.1], tyazhelo: 10.2,
  // 3 free
  ticket: 11.8, vhod: 11.95, svob: [12.3, 12.9], stamps: [11.95, 13.05, 14.05],
  // 4 breathe
  prosto: [15.65, 16.2], square: [15.7, 16.1], podyshat: 16.4, lap: 16.1, dyshi: 15.85, ritm: 17.6,
  // 5 let go
  napishi: [20.75, 21.4], note: 20.8, line1: [21.4, 22.1], line2: [22.1, 22.9], otpusti: 23.0, tear: 23.5, nichego: 24.4,
  // 6 talk
  vygovoris: 26.3, moon: [26.25, 26.8], b1: 26.6, typing: [27.15, 27.95], b2: 27.95, ai: 28.9, noch: [29.05, 29.7],
  // 7 pet
  tvoy: [30.7, 31.1], pitomec: 30.95, pets: [31.35, 31.75, 32.15], raduetsya: 32.6, hearts: [33.3, 33.6, 33.9],
  // 8 letters
  n25: 35.8, pisem: [36.3, 37.0], env: [37.3, 37.6, 38.4, 38.7, 39.3, 39.6],
  // 9 my corner
  ugolok: [40.8, 41.4], lid: 41.1, items: [41.5, 42.1, 42.9, 43.6], phone: [45.0, 45.9], tolko: [46.0, 46.5], uTebya: 46.6,
  // 10 help
  esli: [48.8, 49.6], finger: [49.4, 49.95], press: 50.0, fingerOut: 50.6, cards: [50.6, 51.0, 51.4], pomosh: 52.2, ryadom: [52.6, 53.1],
  // 11 harbour at sunrise
  boat: [55.0, 57.4], sun: [55.2, 56.9], havn2: 55.35, gavan2: 56.1, rays: [56.75, 57.25], refl: [56.95, 57.35], sohrani: 58.0, sohraniW: [58.15, 59.0], link: 60.4
};

/* ---------- builders for this film's shapes ---------- */
const A = {};
const ell = (w, h, n = 64) => arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, n);
function waveShape(w, h, amp, waves, seed) {
  const pts = []; for (let x = 0; x <= w; x += 12) pts.push([x, amp + Math.sin(x / w * Math.PI * 2 * waves + seed) * amp * .8 + (h2(seed, x) - .5) * 4]);
  pts.push([w, h]); pts.push([0, h]); return pts;
}
function rrect(x0, y0, w, h, r) {
  const pts = [], q = Math.PI / 2;
  [[x0 + w - r, y0 + r, -q], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, q], [x0 + r, y0 + r, 2 * q]].forEach(([cx, cy, a]) => {
    for (let i = 0; i <= 8; i++) { const b = a + q * i / 8; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); }
  });
  return pts;
}
function closed(pts) { return smoothSeg(pts.concat([pts[0]])); }
function smoothSeg(pts) { let r = []; for (let i = 0; i < pts.length - 1; i++) r = r.concat(seg(pts[i], pts[i + 1], 8).slice(i ? 1 : 0)); return r; }
function stamp(text, color, size = 50) {
  const m = mk(10, 10).getContext('2d'), font = `900 ${size}px Unb`; m.font = font;
  const tw = m.measureText(text).width, w = tw + 90, h = size * 2.3;
  const c = mk(w + PAD * 2, h + PAD * 2), x = c.getContext('2d'), r = mulberry32(text.length * 77);
  x.filter = 'url(#ink1)'; x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 9;
  x.strokeRect(PAD + 6, PAD + 6, w - 12, h - 12); x.lineWidth = 3; x.strokeRect(PAD + 20, PAD + 20, w - 40, h - 40);
  x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + 3);
  x.filter = 'none'; x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < w * h / 160; i++) { x.globalAlpha = .3 + r() * .7; x.beginPath(); x.arc(PAD + r() * w, PAD + r() * h, .6 + r() * 2.4, 0, 7); x.fill(); }
  return sprite(c);
}
function bubble(text, color, ink, seed) {
  const m = mk(10, 10).getContext('2d'), font = '500 42px Inter'; m.font = font;
  const w = m.measureText(text).width + 80, h = 110;
  return card(w, h, { seed, color, tex: .6, shape: rrect(0, 0, w, h, 46), content: printed(text, font, ink, 2) });
}
function heartShape(s) { const p = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; p.push([s / 2 + s * .03 * 16 * Math.pow(Math.sin(a), 3), s * .45 - s * .03 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]); } return p; }

/* the paper boat: hull, sail, ink mast — everything turns around the waterline point */
function drawBoat(x, y, rot, sc, h, t, seed) {
  const R = (lx, ly) => [x + (lx * Math.cos(rot) - ly * Math.sin(rot)) * sc, y + (lx * Math.sin(rot) + ly * Math.cos(rot)) * sc];
  const [sx, sy] = R(10, -128), [hx, hy] = R(0, -24);
  drawSp(A.sail, sx, sy, { h, rot, sc, elev: 5 });
  drawSp(A.hull, hx, hy, { h: h + .002, rot, sc, elev: 6 });
  inkLine([R(-130, -48), R(130, -48), R(100, 0), R(-100, 0), R(-130, -48)].reduce((a, p, i, arr) => i ? a.concat(seg(arr[i - 1], p, 8).slice(1)) : [p], []), { t, seed, w: 4.5, h: h + .003 });
  inkLine(seg(R(2, -48), R(2, -232), 8), { t, seed: seed + 1, w: 4.5, h: h + .003 });
}

/* an animal: paper parts under ink, feet at (x, y) */
function drawPet(kind, x, y, sc, h, t, lift, seed) {
  const W2 = (lx, ly) => [x + lx * sc, y - lift * 50 + ly * sc];
  const sp = (s, lx, ly, o = {}) => { const [px, py] = W2(lx, ly); drawSp(s, px, py, Object.assign({ h, sc, lift, elev: 5 }, o)); };
  const ink = (pts, o = {}) => inkLine(pts.map(p => W2(p[0], p[1])), Object.assign({ t, seed: seed + (o.k || 0), w: 4.5, h: h + .004 }, o));
  const eyes = (ex, ey) => { ink(arc(-ex, ey, 13, 9, Math.PI * 1.1, Math.PI * 1.9, 10), { k: 21, dbl: false, gaps: false }); ink(arc(ex, ey, 13, 9, Math.PI * 1.1, Math.PI * 1.9, 10), { k: 22, dbl: false, gaps: false }); };
  if (kind === 0) { // cat
    ink(smooth([[70, -40], [130, -70], [138, -130], [112, -168]], 6), { k: 1, w: 9 });
    sp(A.catBody, 0, -75); sp(A.catEar, -46, -212, { rot: -.15 }); sp(A.catEar, 46, -212, { rot: .15 }); sp(A.catHead, 0, -168);
    ink(arc(0, -168, 74, 60, Math.PI * .05, Math.PI * 1.95, 50), { k: 2 }); ink(arc(0, -75, 86, 70, Math.PI * .1, Math.PI * .9, 40), { k: 3 });
    eyes(26, -168); ink(chain([-8, -150], [8, -150], [0, -140], [-8, -150]), { k: 4, gaps: false, dbl: false });
    [[-1, 0], [1, 0]].forEach(([s]) => { ink(seg([s * 30, -142], [s * 98, -150], 6), { k: 5 + s, w: 2.6, dbl: false, gaps: false }); ink(seg([s * 30, -134], [s * 96, -126], 6), { k: 7 + s, w: 2.6, dbl: false, gaps: false }); });
    sp(A.blush, -46, -146, { shadow: false }); sp(A.blush, 46, -146, { shadow: false });
  } else if (kind === 1) { // dog
    const wag = Math.sin(step12(t) * 2 * Math.PI * 2.4) * .5;
    ink(seg([80, -90], [80 + Math.cos(-.9 + wag) * 70, -90 + Math.sin(-.9 + wag) * 70], 6), { k: 1, w: 10 });
    sp(A.dogBody, 0, -72); sp(A.dogHead, 0, -168);
    sp(A.dogEar, -72, -158, { rot: .25 }); sp(A.dogEar, 72, -158, { rot: -.25 });
    ink(arc(0, -168, 76, 62, 0, Math.PI * 2, 50), { k: 2 }); ink(arc(0, -72, 88, 66, Math.PI * .12, Math.PI * .88, 40), { k: 3 });
    eyes(26, -175); sp(A.tongue, 0, -122, { shadow: false });
    ink(arc(0, -146, 13, 10, 0, Math.PI * 2, 14), { k: 4, w: 7, gaps: false, dbl: false });
  } else { // bird
    sp(A.birdBody, 0, -95); sp(A.wing, 22, -82, { rot: -.2 }); sp(A.beak, -96, -112, { rot: 0 });
    ink(arc(0, -95, 90, 90, 0, Math.PI * 2, 60), { k: 2 });
    ink(arc(-34, -128, 7, 7, 0, Math.PI * 2, 10), { k: 3, w: 7, gaps: false, dbl: false });
    [-14, 0, 14].forEach((dx, i) => ink(seg([dx, -182], [dx * 1.8 + 4, -222], 6), { k: 5 + i, w: 4, dbl: false, gaps: false }));
    ink(chain([-22, -6], [-22, 6], [-36, 10]), { k: 9, w: 4, dbl: false }); ink(chain([18, -6], [18, 6], [4, 10]), { k: 10, w: 4, dbl: false });
  }
}

function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];

  // boat
  A.hull = card(260, 48, { seed: 3, color: PAL.white, shape: [[0, 0], [260, 0], [230, 48], [30, 48]] });
  A.sail = card(150, 184, { seed: 4, color: '#fffaf0', shape: [[0, 184], [120, 0], [150, 184]] });

  // 1 storm
  A.stormSky = card(1700, 1500, { seed: 10, color: PAL.stormSky, torn: true, rim: '#dfe4e7', tex: .9 });
  A.stormSea = [PAL.storm0, PAL.storm1, PAL.storm2, PAL.storm3].map((c, i) => card(1800, 1200, { seed: 11 + i, color: c, torn: true, rim: '#dce8f0', shape: waveShape(1800, 1200, 46, 2.6 + i * .4, i * 2), tex: .9 }));
  A.foam = ['надо', 'срочно', 'ответь', 'дедлайн', 'опять', 'должен', 'успей', '!!!'].map((w, i) => scrapFor(w, 30 + i, cols[i % 5], 36));
  A.kogda = inkText('когда в голове', 112, PAL.ink, { seed: 2 });
  A.shtorm = cutWord('ШТОРМ', 168, PAL.orange, { seed: 3 });
  A.perezhdat = label('нужно место, где можно переждать', 'italic 600 70px Corm', { seed: 15, h: 112 });

  // 2 harbour
  A.calmSky = card(1800, 1250, { seed: 20, color: PAL.calmSky, torn: true, rim: '#eef7fd', tex: .7 });
  A.calmSea = [PAL.sea1, PAL.sea2, PAL.sea3].map((c, i) => card(1800, 1300, { seed: 21 + i, color: c, torn: true, rim: '#e9f5fc', shape: waveShape(1800, 1300, 12, 3 + i, i), tex: .8 }));
  A.rock = card(330, 120, { seed: 24, color: PAL.rock, torn: true, rim: '#c9ccc6', shape: arc(165, 120, 165, 110, Math.PI, Math.PI * 2, 40).concat([[330, 120], [0, 120]]) });
  A.tower = card(150, 420, {
    seed: 25, color: PAL.white, shape: [[28, 0], [122, 0], [150, 420], [0, 420]], content: (x, cx, cy) => {
      x.fillStyle = PAL.orange; [[-150, -90], [-10, 50], [130, 190]].forEach(([a, b]) => x.fillRect(cx - 120, cy + a, 240, b - a));
    }
  });
  A.cap = card(150, 64, { seed: 26, color: PAL.deep, shape: [[75, 0], [150, 64], [0, 64]] });
  A.lamp = card(96, 70, { seed: 27, color: PAL.cream });
  A.havn = cutWord('HAVN', 158, PAL.deep, { seed: 18, track: 8 });
  A.gavan = label('по-датски — «гавань»', 'italic 600 68px Corm', { seed: 28, h: 106 });
  A.textPlate = card(860, 290, { seed: 29, color: PAL.white, torn: true, tex: .7 });
  A.tihoe = inkText('тихое место в интернете,', 84, PAL.ink, { seed: 4 });
  A.kuda = inkText('куда можно прийти,', 84, PAL.ink, { seed: 5 });
  A.kogda2 = inkText('когда', 92, PAL.white, { seed: 6 });
  A.tyazhelo = cutWord('ТЯЖЕЛО', 150, PAL.orange, { seed: 7 });

  // 3 free
  A.ticket = card(840, 420, {
    seed: 30, color: PAL.sand, content: (x, cx, cy) => {
      x.setLineDash([16, 13]); x.strokeStyle = PAL.ink; x.lineWidth = 4; x.beginPath(); x.moveTo(cx + 250, cy - 230); x.lineTo(cx + 250, cy + 230); x.stroke(); x.setLineDash([]);
      x.save(); x.translate(cx + 335, cy); x.rotate(-Math.PI / 2); x.font = '600 40px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.ink; x.fillText('HAVN · 24/7', 0, 0); x.restore();
    }
  });
  A.vhod = cutWord('ВХОД', 150, PAL.deep, { seed: 31 });
  A.svob = inkText('свободный', 92, PAL.ink, { seed: 7 });
  A.stamps = [stamp('БЕЗ РЕГИСТРАЦИИ', PAL.deep, 46), stamp('БЕЗ РЕКЛАМЫ', PAL.deep, 54), stamp('БЕСПЛАТНО', PAL.orange, 66)];

  // 4 breathe
  A.prosto = inkText('можно просто', 100, PAL.ink, { seed: 8 });
  A.podyshat = cutWord('ПОДЫШАТЬ', 102, PAL.orange, { seed: 40 });
  A.dyshi = cutWord('ДЫШИ', 100, PAL.deep, { seed: 41 });
  A.dot = card(58, 58, { seed: 42, color: PAL.orange, shape: ell(58, 58, 30) });
  A.sides = ['вдох 4', 'задержка 4', 'выдох 4', 'задержка 4'].map((s, i) => inkText(s, 66, PAL.ink, { seed: 43 + i }));
  A.ritm = label('квадрат подскажет ритм', 'italic 600 70px Corm', { seed: 47, h: 106 });

  // 5 let go
  A.napishi = inkText('напиши, что давит,', 100, PAL.ink, { seed: 9 });
  A.note = card(700, 430, {
    seed: 50, color: '#fdfcf7', torn: true, tex: .8, content: (x, cx, cy) => {
      x.strokeStyle = PAL.rule; x.lineWidth = 2.2; for (let y = -170; y < 220; y += 60) { x.beginPath(); x.moveTo(cx - 360, cy + y); x.lineTo(cx + 360, cy + y); x.stroke(); }
    }
  });
  A.line1 = inkText('всё навалилось', 80, PAL.ink, { seed: 51 });
  A.line2 = inkText('и я не справляюсь', 80, PAL.ink, { seed: 52 });
  A.otpusti = cutWord('ОТПУСТИ', 140, PAL.orange, { seed: 53 });
  A.shreds = Array.from({ length: 16 }, (_, i) => ({ sp: card(70 + h2(i, 1) * 90, 50 + h2(i, 2) * 70, { seed: 60 + i, color: '#fdfcf7', torn: true, tex: .8 }), x: (h2(i, 3) - .5) * 600, y: (h2(i, 4) - .5) * 360, v: 380 + h2(i, 5) * 420, r: (h2(i, 6) - .5) * 3 }));
  A.nichego = label('ничего не сохранится', 'italic 600 74px Corm', { seed: 55, h: 110 });

  // 6 talk
  A.vygovoris = cutWord('ВЫГОВОРИСЬ', 82, PAL.deep, { seed: 70 });
  A.clock = inkText('03:00', 96, PAL.ink, { seed: 71 });
  A.b1 = bubble('не спится. всё крутится в голове', PAL.cream, PAL.ink, 72);
  A.dotsBubble = card(190, 100, { seed: 73, color: PAL.sky, shape: rrect(0, 0, 190, 100, 44) });
  A.b2 = bubble('я здесь. расскажи, что случилось?', PAL.sky, PAL.ink, 74);
  A.ai = card(470, 92, { seed: 75, color: PAL.deep, content: printed('ИИ-собеседник', '600 46px Inter', '#ffffff', 2) });
  A.noch = inkText('даже в 3 часа ночи', 88, PAL.ink, { seed: 76 });

  // 7 pet
  A.tvoy = inkText('свой', 96, PAL.ink, { seed: 80 });
  A.pitomec = cutWord('ПИТОМЕЦ', 140, PAL.orange, { seed: 81 });
  A.grass = card(1500, 520, { seed: 82, color: PAL.grass, torn: true, rim: '#e7f0dc', shape: waveShape(1500, 520, 14, 9, 3), tex: .9 });
  A.catBody = card(172, 140, { seed: 83, color: PAL.cat, shape: ell(172, 140) });
  A.catHead = card(148, 120, { seed: 84, color: PAL.cat, shape: ell(148, 120) });
  A.catEar = card(60, 64, { seed: 85, color: PAL.cat, shape: [[0, 64], [30, 0], [60, 64]] });
  A.blush = card(26, 18, { seed: 86, color: PAL.pink, shape: ell(26, 18, 16), tex: .4 });
  A.dogBody = card(176, 132, { seed: 87, color: PAL.dog, shape: ell(176, 132) });
  A.dogHead = card(152, 124, { seed: 88, color: PAL.dog, shape: ell(152, 124) });
  A.dogEar = card(50, 104, { seed: 89, color: PAL.dogEar, shape: ell(50, 104, 30) });
  A.tongue = card(28, 34, { seed: 90, color: PAL.pink, shape: arc(14, 0, 14, 34, 0, Math.PI, 16) });
  A.birdBody = card(180, 180, { seed: 91, color: PAL.bird, shape: ell(180, 180) });
  A.wing = card(104, 66, { seed: 92, color: PAL.wing, shape: ell(104, 66, 30) });
  A.beak = card(48, 36, { seed: 93, color: PAL.orange, shape: [[48, 0], [0, 18], [48, 36]] });
  A.names = ['Мурзик', 'Бублик', 'Чижик'].map((s, i) => inkText(s, 72, PAL.ink, { seed: 94 + i }));
  A.heart = card(70, 64, { seed: 97, color: PAL.pink, shape: heartShape(70) });
  A.raduetsya = label('радуется, когда ты заходишь', 'italic 600 66px Corm', { seed: 98, h: 104 });

  // 8 letters
  A.n25 = cutWord('25', 330, PAL.orange, { seed: 100 });
  A.pisem = inkText('писем о трудном', 96, PAL.ink, { seed: 101 });
  A.envs = ['тревога', 'сон', 'выгорание', 'стыд', 'одиночество', 'злость'].map((s, i) => card(340, 214, {
    seed: 102 + i, color: [PAL.white, PAL.cream, PAL.ice][i % 3], content: (x, cx, cy) => {
      x.strokeStyle = 'rgba(24,41,59,.75)'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(cx - 170, cy - 107); x.lineTo(cx, cy + 5); x.lineTo(cx + 170, cy - 107); x.stroke();
      printed(s, '600 38px Inter', PAL.ink, 0)(x, cx, cy + 60);
    }
  }));

  // 9 my corner
  A.ugolok = inkText('мой уголок', 100, PAL.ink, { seed: 110 });
  A.boxFront = card(460, 240, { seed: 111, color: PAL.kraft, content: printed('коробка надежды', 'italic 600 54px Corm', PAL.ink, 0) });
  A.lidC = card(500, 78, { seed: 112, color: PAL.lid });
  A.photo = card(220, 250, {
    seed: 113, color: PAL.white, content: (x, cx, cy) => {
      x.fillStyle = PAL.calmSky; x.fillRect(cx - 90, cy - 105, 180, 150); x.fillStyle = PAL.sea2; x.fillRect(cx - 90, cy + 5, 180, 40);
      x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx, cy + 5, 40, Math.PI, 0); x.fill();
    }
  });
  A.diary = card(230, 290, { seed: 114, color: PAL.deep, content: (x, cx, cy) => { x.fillStyle = PAL.cream; x.fillRect(cx - 80, cy - 70, 160, 64); printed('дневник', '700 46px Cav', PAL.ink, 0)(x, cx, cy - 38); } });
  A.letter = card(250, 160, {
    seed: 115, color: PAL.white, content: (x, cx, cy) => {
      x.strokeStyle = 'rgba(24,41,59,.75)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 125, cy - 80); x.lineTo(cx, cy); x.lineTo(cx + 125, cy - 80); x.stroke();
      printed('письмо себе', '700 40px Cav', PAL.ink, 0)(x, cx, cy + 46);
    }
  });
  A.bigHeart = card(130, 118, { seed: 116, color: PAL.pink, shape: heartShape(130) });
  A.tolko = inkText('только', 100, PAL.ink, { seed: 117 });
  A.uTebya = cutWord('У ТЕБЯ', 150, PAL.orange, { seed: 118 });

  // 10 help
  A.esli = inkText('если совсем тяжело', 96, PAL.ink, { seed: 120 });
  A.button = card(800, 170, { seed: 121, color: PAL.orange, shape: rrect(0, 0, 800, 170, 85), content: printed('Мне плохо прямо сейчас', '600 52px Inter', '#ffffff', 2) });
  A.finger = card(118, 470, { seed: 122, color: PAL.skin, shape: rrect(0, 0, 118, 470, 59) });
  A.helpCards = ['проверенные линии помощи', 'звонок одним касанием', 'твой план безопасности'].map((s, i) => card(700, 124, {
    seed: 123 + i, color: PAL.white, content: (x, cx, cy) => {
      x.strokeStyle = PAL.deep; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath();
      x.moveTo(cx - 300, cy - 22); x.quadraticCurveTo(cx - 318, cy + 6, cx - 290, cy + 28); x.lineTo(cx - 270, cy + 18); x.lineTo(cx - 278, cy + 2); x.moveTo(cx - 300, cy - 22); x.lineTo(cx - 282, cy - 30); x.lineTo(cx - 274, cy - 14); x.stroke();
      x.font = '600 40px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = PAL.ink; x.fillText(s, cx - 240, cy + 2);
    }
  }));
  A.pomosh = cutWord('ПОМОЩЬ', 150, PAL.deep, { seed: 126 });
  A.ryadom = inkText('рядом', 100, PAL.ink, { seed: 127 });

  // 11 sunrise
  A.sky = card(1700, 1520, { seed: 130, color: PAL.sky, torn: true, rim: '#eef7fd', tex: .7 });
  A.sunO = card(440, 440, { seed: 131, color: PAL.sunO, shape: ell(440, 440, 90) });
  A.sunI = card(300, 300, { seed: 132, color: PAL.sunI, shape: ell(300, 300, 70) });
  A.sea = [PAL.sea1, PAL.sea2, PAL.sea3].map((c, i) => card(1800, 900, { seed: 133 + i, color: c, torn: true, rim: '#e9f5fc', tex: .8 }));
  const cloud = (seed, w) => { const pts = []; for (let i = 0; i <= 60; i++) { const a = Math.PI + Math.PI * i / 60; const bump = 1 + .22 * Math.abs(Math.sin(a * 2.5 + seed)); pts.push([w / 2 + Math.cos(a) * w / 2 * bump * .9, w * .32 + Math.sin(a) * w * .3 * bump]); } return card(w, w * .4, { seed, color: '#fbfdff', torn: true, shape: pts, rim: '#ffffff', tex: .6 }); };
  A.cloud1 = cloud(141, 420); A.cloud2 = cloud(142, 320); A.cloudFg = blurred(cloud(143, 520), 12);
  A.havn2 = cutWord('HAVN', 190, PAL.deep, { seed: 144, track: 10 });
  A.gavan2 = label('гавань, когда в голове шторм', 'italic 600 70px Corm', { seed: 145, h: 108, dy: -3 });
  A.sohraniT = inkText('сохрани, чтобы найти, когда понадобится', 58, PAL.ink, { seed: 146 });
  A.sohrani = card(A.sohraniT.tw + 70, 100, { seed: 147, color: PAL.white, torn: true });
  A.link = card(520, 86, { seed: 148, color: PAL.deep, content: printed('ссылка в профиле ↓', '600 44px Inter', '#ffffff', 2) });

  // filler on the table between scenes, seen during the fast moves
  const DR = mulberry32(7); A.decor = [];
  for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 6; k++) {
    const u = .3 + DR() * .4, side = DR() < .5 ? -1 : 1, a = P[i], b = P[i + 1];
    A.decor.push({ sp: card(110 + DR() * 190, 46 + DR() * 80, { seed: 500 + i * 10 + k, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + side * (260 + DR() * 320), y: lerp(a[1], b[1], u) + (DR() - .5) * 260, rot: (DR() - .5) * .8, h: DR() * .05 });
  }
}

/* ---------- scenes ---------- */
let FLASH = 0;
function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }
// a scene is drawn whenever the camera is near it, so nothing on the table pops in
const on = i => Math.abs(CAM.y - P[i][1]) < 2300;

function s1(t) {
  const [cx, cy] = P[0], tq = step12(t);
  drawSp(A.stormSky, cx, cy - 640, { h: 0, elev: 4 });
  // ink rain, falling continuously, boiling
  for (let i = 0; i < 46; i++) {
    const x0 = cx - 620 + h2(i, 1) * 1240, y0 = cy - 1000 + ((h2(i, 2) * 1300 + t * 1500) % 1300);
    inkLine(seg([x0, y0], [x0 - 22, y0 + 64], 8), { t, seed: 300 + i, w: 3, alpha: .55, dbl: false, gaps: false, amp: 1.2 });
  }
  // lightning + flash
  if (t > T.flash - .02 && t < T.flash + .6) inkLine(chain([cx + 300, cy - 1000], [cx + 230, cy - 820], [cx + 300, cy - 800], [cx + 200, cy - 560]), { t, seed: 310, w: 9, p: eOut(prog(t, T.flash, T.flash + .08)), color: '#fffbe8', h: .005 });
  const fk = Math.round((tq - T.flash) * 12); FLASH = fk >= 0 && fk < 3 ? [.5, .25, .08][fk] : 0;
  // the sea heaves in stop-motion steps
  const tops = [-40, 110, 270, 440];
  A.stormSea.forEach((sp, i) => {
    const heave = Math.sin(tq * 2 * Math.PI * .7 + i * 1.3) * 34, tilt = Math.sin(tq * 2 * Math.PI * .55 + i) * .035;
    const top = cy + tops[i] + heave;
    if (i === 1) {
      // the boat rides between the first two waves
      const bx = cx - 170 + Math.sin(tq * 1.7) * 30, by = cy + tops[0] + Math.sin(tq * 2 * Math.PI * .7) * 34 + 60;
      drawBoat(bx, by, Math.sin(tq * 2 * Math.PI * .7 + .8) * .32, .9, .02, t, 320);
    }
    drawSp(sp, cx + (i % 2 ? 40 : -40), top + 600, { h: .01 + i * .012, rot: tilt, elev: 8 + i * 2 });
    A.foam.forEach((f, k) => { if (k % 4 !== i) return; const fx = cx - 420 + (k * 270) % 840 + Math.sin(tq * 3 + k) * 20; drawSp(f.sp || f, fx, top + 30 + Math.sin(fx * .01 + i) * 30, { h: .015 + i * .012, rot: tilt * 3 + (h2(k, 9) - .5) * .5, elev: 6 }); });
  });
  drawInk(A.kogda, cx, cy - 730, { t, p: prog(t, T.kogda[0], T.kogda[1]), h: .03, rot: -.03, seed: 1 });
  A.shtorm.letters.forEach((L, j) => {
    const d = drop(t, T.shtorm + j / 12); if (!d) return;
    const jj = jit(j + 400, t, 7);
    drawSp(L.sp, cx + L.dx + jj[0], cy - 545 - d.lift * 60 + jj[1], { h: .05, lift: d.lift, rot: (h2(j, 21) - .5) * .12 + jj[2] * 6 });
  });
  const pz = slide(t, T.perezhdat, .25);
  if (step12(t) >= T.perezhdat) drawSp(A.perezhdat, cx + (1 - pz) * 900, cy - 360, { h: .05, lift: (1 - pz) * .5, rot: -.02 });
}

function s2(t) {
  const [cx, cy] = P[1], tq = step12(t);
  drawSp(A.calmSky, cx, cy - 760, { h: 0, elev: 4 });
  // lighthouse on its rock, beam sweeping in ink
  const lx = cx + 330, ly = cy - 150;
  drawSp(A.rock, lx, ly + 10, { h: .012, elev: 5 });
  drawSp(A.tower, lx, ly - 230, { h: .014, elev: 6 });
  drawSp(A.lamp, lx, ly - 470, { h: .015, elev: 4 });
  drawSp(A.cap, lx, ly - 530, { h: .016, elev: 5 });
  const a = Math.PI + .3 + .42 * Math.sin(2 * Math.PI * .3 * (t - T.beam));
  [-.11, .11].forEach((da, i) => inkLine(seg([lx - 20, ly - 470], [lx - 20 + Math.cos(a + da) * 620, ly - 470 + Math.sin(a + da) * 620], 10), { t, seed: 330 + i, w: 4.5, p: eOut(prog(t, T.beam, T.beam + .4)), h: .016, alpha: .8, dbl: false }));
  A.calmSea.forEach((sp, i) => drawSp(sp, cx + (i % 2 ? 30 : -30), cy - 150 + i * 150 + Math.sin(tq * 2 * Math.PI * .4 + i) * 6 + 650, { h: .02 + i * .012, elev: 7 }));
  drawBoat(cx - 380, cy - 128 + Math.sin(tq * 2 * Math.PI * .4) * 6, Math.sin(tq * 2.2) * .06, .55, .022, t, 340);
  word(A.havn, cx - 40, cy - 800, t, T.havn, { h: .05, seed: 18 });
  const g = slide(t, T.gavan, .25);
  if (step12(t) >= T.gavan) drawSp(A.gavan, cx - 60 - (1 - g) * 900, cy - 650, { h: .05, lift: (1 - g) * .5, rot: .02 });
  const tp = slide(t, T.tihoeLbl, .22);
  if (step12(t) >= T.tihoeLbl) {
    drawSp(A.textPlate, cx + (1 - tp) * 1000, cy + 100, { h: .05, lift: (1 - tp) * .5, rot: -.015, elev: 7 });
    drawInk(A.tihoe, cx + (1 - tp) * 1000, cy + 40, { t, p: prog(t, T.tihoe[0], T.tihoe[1]), h: .055, rot: -.015, seed: 2 });
    drawInk(A.kuda, cx + (1 - tp) * 1000, cy + 155, { t, p: prog(t, T.kuda[0], T.kuda[1]), h: .055, rot: -.015, seed: 3 });
  }
  drawInk(A.kogda2, cx, cy + 290, { t, p: prog(t, T.kogda2[0], T.kogda2[1]), h: .05, rot: -.04, seed: 4 });
  word(A.tyazhelo, cx, cy + 420, t, T.tyazhelo, { h: .06, seed: 7, stagger: 1 / 24, sc: .82 });
}

function s3(t) {
  const [cx, cy] = P[2];
  const tk = slide(t, T.ticket, .22);
  if (step12(t) < T.ticket) return;
  const tx = cx, ty = cy - 60 + (1 - tk) * 1100, tr = -.05;
  drawSp(A.ticket, tx, ty, { h: .02, lift: (1 - tk) * .5, rot: tr, elev: 8 });
  word(A.vhod, tx - 120, ty - 60, t, T.vhod, { h: .035, seed: 31, rot: tr });
  drawInk(A.svob, tx - 120, ty + 95, { t, p: prog(t, T.svob[0], T.svob[1]), h: .035, rot: tr, seed: 5 });
  const pos = [[cx - 10, cy - 470, -.07], [cx + 40, cy + 260, .05], [cx - 20, cy + 470, -.03]];
  A.stamps.forEach((sp, i) => {
    const k = Math.round((step12(t) - T.stamps[i]) * 12); if (k < 0) return;
    const sc = k === 0 ? 1.3 : k === 1 ? 1.04 : 1;
    drawSp(sp, pos[i][0], pos[i][1], { h: .04 + i * .005, rot: pos[i][2], sc, shadow: false, alpha: k === 0 ? .7 : 1 });
  });
}

function s4(t) {
  const [cx, cy] = P[3], tq = step12(t);
  drawInk(A.prosto, cx, cy - 700, { t, p: prog(t, T.prosto[0], T.prosto[1]), h: .03, rot: -.03, seed: 6 });
  word(A.podyshat, cx, cy - 545, t, T.podyshat, { h: .045, seed: 40, stagger: 1 / 24 });
  // the square and the dot that walks it: one side a second
  const S = 250, oy = cy + 60, C = [[cx - S, oy - S], [cx + S, oy - S], [cx + S, oy + S], [cx - S, oy + S]];
  inkLine(closed(C), { t, seed: 350, w: 7, p: eIO(prog(t, T.square[0], T.square[1] + .3)), h: .02 });
  const sidesPos = [[cx, oy - S - 62, 0], [cx + S + 78, oy, Math.PI / 2], [cx, oy + S + 62, 0], [cx - S - 78, oy, -Math.PI / 2]];
  A.sides.forEach((it, i) => drawInk(it, sidesPos[i][0], sidesPos[i][1], { t, p: prog(t, T.lap + i, T.lap + i + .35), h: .025, rot: sidesPos[i][2], seed: 7 + i }));
  let breath = .9;
  if (tq >= T.lap) {
    const u = ((tq - T.lap) % 4), side = Math.floor(u), f = u - side, a = C[side], b = C[(side + 1) % 4];
    drawSp(A.dot, lerp(a[0], b[0], f), lerp(a[1], b[1], f), { h: .03, elev: 6 });
    breath = side === 0 ? lerp(.82, 1.12, f) : side === 1 ? 1.12 : side === 2 ? lerp(1.12, .82, f) : .82;
  }
  word(A.dyshi, cx, oy, t, T.dyshi, { h: .03, seed: 41, sc: breath, stagger: 1 / 24 });
  const r = slide(t, T.ritm, .25);
  if (tq >= T.ritm) drawSp(A.ritm, cx - (1 - r) * 900, cy + 520, { h: .045, lift: (1 - r) * .5, rot: .02 });
}

function s5(t) {
  const [cx, cy] = P[4], tq = step12(t);
  drawInk(A.napishi, cx, cy - 690, { t, p: prog(t, T.napishi[0], T.napishi[1]), h: .03, rot: -.03, seed: 8 });
  const nIn = slide(t, T.note, .22), nr = -.03;
  const gone = tq >= T.tear ? clamp(1 - (tq - T.tear) * 12 / 2) : 1;
  if (tq >= T.note && gone > 0) {
    const nx = cx, ny = cy + 40 + (1 - nIn) * 1100;
    drawSp(A.note, nx, ny, { h: .02, lift: (1 - nIn) * .5, rot: nr, elev: 7, alpha: gone });
    drawInk(A.line1, nx - 270, ny - 55, { t, p: prog(t, T.line1[0], T.line1[1]), h: .025, rot: nr, align: 'left', seed: 9, alpha: gone });
    drawInk(A.line2, nx - 270, ny + 62, { t, p: prog(t, T.line2[0], T.line2[1]), h: .025, rot: nr, align: 'left', seed: 10, alpha: gone });
  }
  // torn into scraps that rise and melt away
  if (tq >= T.tear) A.shreds.forEach((s, i) => {
    const dt = tq - T.tear, fade = 1 - prog(tq, T.tear + .8 + h2(i, 7) * .5, T.tear + 1.7 + h2(i, 7) * .5);
    if (fade <= 0) return;
    drawSp(s.sp, cx + s.x + Math.sin(dt * 3 + i) * 30 * dt, cy + 40 + s.y - s.v * dt * (1 + dt * .4), { h: .03 + h2(i, 8) * .05, rot: s.r * dt, alpha: fade, lift: clamp(dt * .6), elev: 8 });
  });
  word(A.otpusti, cx, cy - 525, t, T.otpusti, { h: .05, seed: 53, stagger: 1 / 24 });
  const nc = slide(t, T.nichego, .25);
  if (tq >= T.nichego) drawSp(A.nichego, cx + (1 - nc) * 900, cy + 460, { h: .05, lift: (1 - nc) * .5, rot: -.02 });
}

function s6(t) {
  const [cx, cy] = P[5], tq = step12(t);
  inkLine(arc(cx + 330, cy - 690, 74, 74, -Math.PI * .55, Math.PI * .55, 30).concat(arc(cx + 300, cy - 690, 52, 66, Math.PI * .5, -Math.PI * .5, 30)), { t, seed: 360, w: 6, p: eOut(prog(t, T.moon[0], T.moon[1])), h: .02 });
  drawInk(A.clock, cx + 70, cy - 690, { t, p: prog(t, T.moon[0] + .1, T.moon[1] + .2), h: .02, rot: -.03, seed: 11 });
  word(A.vygovoris, cx - 10, cy - 500, t, T.vygovoris, { h: .045, seed: 70, stagger: 1 / 24, tilt: .1 });
  const d1 = drop(t, T.b1);
  if (d1) drawSp(A.b1, cx + 100, cy - 230 - d1.lift * 40, { h: .03, lift: d1.lift * .6, rot: .02, elev: 6 });
  if (tq >= T.typing[0] && tq < T.typing[1]) {
    drawSp(A.dotsBubble, cx - 340, cy - 40, { h: .03, rot: -.02, elev: 6 });
    for (let i = 0; i < 3; i++) { const bounce = Math.max(0, Math.sin((tq * 3 - i * .33) * Math.PI * 2)) * 14; inkLine(arc(cx - 390 + i * 50, cy - 40 - bounce, 9, 9, 0, Math.PI * 2, 12), { t, seed: 370 + i, w: 8, h: .032, gaps: false, dbl: false }); }
  }
  const d2 = drop(t, T.b2);
  if (d2) drawSp(A.b2, cx - 90, cy - 30 - d2.lift * 40, { h: .03, lift: d2.lift * .6, rot: -.02, elev: 6 });
  const da = drop(t, T.ai);
  if (da) drawSp(A.ai, cx, cy + 230 - da.lift * 50, { h: .04, lift: da.lift, rot: -.03, elev: 7 });
  drawInk(A.noch, cx, cy + 380, { t, p: prog(t, T.noch[0], T.noch[1]), h: .035, rot: .02, seed: 12 });
}

function s7(t) {
  const [cx, cy] = P[6], tq = step12(t);
  drawInk(A.tvoy, cx, cy - 700, { t, p: prog(t, T.tvoy[0], T.tvoy[1]), h: .03, rot: -.03, seed: 13 });
  word(A.pitomec, cx, cy - 555, t, T.pitomec, { h: .045, seed: 81, stagger: 1 / 24 });
  const rd = slide(t, T.raduetsya, .25);
  if (tq >= T.raduetsya) drawSp(A.raduetsya, cx + (1 - rd) * 900, cy - 400, { h: .045, lift: (1 - rd) * .5, rot: -.02 });
  drawSp(A.grass, cx, cy + 560, { h: .012, elev: 6 });
  [-330, 0, 330].forEach((dx, i) => {
    const d = drop(t, T.pets[i]); if (!d) return;
    const hk = Math.round((tq - T.hearts[i]) * 12), hop = hk >= 0 && hk < 4 ? [.25, .4, .2, 0][hk] : 0;
    drawPet(i, cx + dx, cy + 330, 1.12, .025, t, d.lift + hop, 380 + i * 30);
    drawInk(A.names[i], cx + dx, cy + 430, { t, p: prog(t, T.pets[i] + .25, T.pets[i] + .6), h: .03, rot: (i - 1) * .03, seed: 14 + i });
    if (hk >= 0) {
      const ht = tq - T.hearts[i], fade = 1 - prog(ht, .9, 1.5);
      if (fade > 0) drawSp(A.heart, cx + dx + Math.sin(ht * 5) * 14, cy - 40 - ht * 140, { h: .04, alpha: fade, sc: .8 + clamp(ht * 3) * .3, elev: 6 });
    }
  });
}

function s8(t) {
  const [cx, cy] = P[7], tq = step12(t);
  word(A.n25, cx, cy - 560, t, T.n25, { h: .05, seed: 100, tilt: .12 });
  drawInk(A.pisem, cx, cy - 340, { t, p: prog(t, T.pisem[0], T.pisem[1]), h: .035, rot: -.03, seed: 15 });
  const tg = [[-190, -70, -.07], [190, -40, .06], [-190, 180, .05], [190, 205, -.06], [-175, 430, -.04], [195, 445, .05]];
  A.envs.forEach((sp, i) => {
    const t0 = T.env[i]; if (tq < t0) return;
    const u = slide(t, t0, .25);
    drawSp(sp, cx + tg[i][0] * u, cy + 520 + (tg[i][1] - 520) * u, { h: .025 + i * .004, lift: (1 - u) * .6, rot: tg[i][2] * u + (1 - u) * .5, elev: 6 });
  });
}

function s9(t) {
  const [cx, cy] = P[8], tq = step12(t);
  drawInk(A.ugolok, cx, cy - 650, { t, p: prog(t, T.ugolok[0], T.ugolok[1]), h: .03, rot: -.03, seed: 16 });
  // what comes out of the box
  const it = [[A.photo, -200, -330, -.12], [A.diary, 70, -400, .06], [A.letter, 225, -170, .14], [A.bigHeart, -40, -150, -.05]];
  it.forEach(([sp, tx, ty, r], i) => {
    const t0 = T.items[i]; if (tq < t0) return;
    const u = slide(t, t0, .33);
    drawSp(sp, cx + tx * u, cy + 120 + (ty - 120) * u, { h: .025 + i * .004, lift: Math.sin(u * Math.PI) * .6, rot: r * u, elev: 6 });
  });
  drawSp(A.boxFront, cx, cy + 165, { h: .03, elev: 7 });
  const lo = slide(t, T.lid, .42, eIn);
  drawSp(A.lidC, cx + 950 * lo, cy + 40 - 160 * lo, { h: .034, lift: Math.sin(lo * Math.PI) * .5, rot: .5 * lo, elev: 6 });
  // the phone draws itself around all of it
  inkLine(closed(rrect(cx - 350, cy - 790, 700, 1130, 80)), { t, seed: 390, w: 8, p: eIO(prog(t, T.phone[0], T.phone[1])), h: .02 });
  inkLine(seg([cx - 60, cy - 755], [cx + 60, cy - 755], 8), { t, seed: 391, w: 7, p: prog(t, T.phone[1] - .2, T.phone[1]), h: .02 });
  // lock
  const lp = prog(t, T.tolko[0], T.tolko[1] + .2);
  inkLine(closed(rrect(cx - 275, cy + 465, 80, 66, 10)), { t, seed: 392, w: 6, p: lp, h: .03, gaps: false });
  inkLine(arc(cx - 235, cy + 465, 26, 34, Math.PI, Math.PI * 2, 20), { t, seed: 393, w: 6, p: lp, h: .03 });
  drawInk(A.tolko, cx + 10, cy + 495, { t, p: prog(t, T.tolko[0], T.tolko[1]), h: .035, rot: -.03, seed: 17 });
  word(A.uTebya, cx, cy + 630, t, T.uTebya, { h: .05, seed: 118, stagger: 1 / 24 });
}

function s10(t) {
  const [cx, cy] = P[9], tq = step12(t);
  drawInk(A.esli, cx, cy - 650, { t, p: prog(t, T.esli[0], T.esli[1]), h: .03, rot: -.03, seed: 18 });
  const pressed = tq >= T.press;
  const pk = Math.round((tq - T.press) * 12);
  drawSp(A.button, cx, cy - 420, { h: .025, lift: pressed ? 0 : .2, sc: pk >= 0 && pk < 2 ? .96 : 1, elev: pressed ? 3 : 8 });
  // help cards slide out from under the button
  A.helpCards.forEach((sp, i) => {
    const t0 = T.cards[i]; if (tq < t0) return;
    const u = slide(t, t0, .25), ty = cy - 180 + i * 150;
    drawSp(sp, cx + (i - 1) * 14, cy - 420 + (ty - cy + 420) * u, { h: .02 - i * .002, lift: (1 - u) * .4, rot: (i - 1) * .025, elev: 6 });
  });
  // the finger comes in, presses, leaves
  if (tq >= T.finger[0] && tq < T.fingerOut + .5) {
    const inU = slide(t, T.finger[0], T.finger[1] - T.finger[0], eOut), outU = slide(t, T.fingerOut, .4, eIn);
    const ang = -.5, tipX = cx + 70, tipY = cy - 420 + (pressed && tq < T.fingerOut ? 8 : -10);
    const k = 1 - inU + outU, fx = tipX + 700 * k, fy = tipY + 900 * k;
    const ccx = fx - Math.sin(ang) * 215, ccy = fy + Math.cos(ang) * 215;
    drawSp(A.finger, ccx, ccy, { h: .06, rot: ang, lift: pressed ? 0 : .3, elev: 14 });
    const R = (lx, ly) => [ccx + lx * Math.cos(ang) - ly * Math.sin(ang), ccy + lx * Math.sin(ang) + ly * Math.cos(ang)];
    inkLine(closed(rrect(-59, -235, 118, 470, 59)).map(p => R(p[0], p[1])), { t, seed: 400, w: 4.5, h: .062 });
    inkLine(closed(rrect(-30, -222, 60, 66, 24)).map(p => R(p[0], p[1])), { t, seed: 401, w: 3.5, h: .062, dbl: false });
    inkLine(arc(0, -60, 34, 10, 0, Math.PI, 12).map(p => R(p[0], p[1])), { t, seed: 402, w: 3, h: .062, dbl: false });
  }
  word(A.pomosh, cx, cy + 400, t, T.pomosh, { h: .05, seed: 126, stagger: 1 / 24 });
  drawInk(A.ryadom, cx, cy + 540, { t, p: prog(t, T.ryadom[0], T.ryadom[1]), h: .035, rot: .02, seed: 19 });
}

function s11(t) {
  const [cx, cy] = P[10], tq = step12(t), drift = tq - 55;
  drawSp(A.sky, cx, cy - 560, { h: 0, elev: 4 });
  drawSp(A.cloud1, cx - 300 + drift * 12, cy - 360, { h: .05, elev: 8 });
  drawSp(A.cloud2, cx + 320 - drift * 9, cy - 200, { h: .07, elev: 8 });
  const su = slide(t, T.sun[0], T.sun[1] - T.sun[0], eIO), sy = lerp(cy + 380, cy + 40, su);
  drawSp(A.sunO, cx, sy, { h: .015, elev: 6 });
  drawSp(A.sunI, cx - 26, sy - 22, { h: .02, elev: 5 });
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + Math.PI * (i + .5) / 7, r0 = 262, r1 = 330 + (i % 2) * 40;
    inkLine(seg([cx + Math.cos(a) * r0, cy + 60 + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + 60 + Math.sin(a) * r1], 6), { t, seed: 410 + i, w: 6, p: eOut(prog(t, T.rays[0] + i * .04, T.rays[0] + .2 + i * .04)), h: .025, dbl: false });
  }
  inkLine(arc(cx, cy + 66, 226, 226, Math.PI, Math.PI * 2, 70), { t, seed: 420, w: 5, p: eOut(prog(t, T.rays[0] - .1, T.rays[1])), h: .022 });
  drawSp(A.sea[0], cx, cy + 530, { h: .03, elev: 8 });
  const bu = slide(t, T.boat[0], T.boat[1] - T.boat[0], x => 1 - Math.pow(1 - x, 2));
  drawBoat(cx - 760 + 480 * bu, cy + 120 + Math.sin(tq * 2 * Math.PI * .5) * 5, Math.sin(tq * 2.4) * .05, .62, .035, t, 430);
  drawSp(A.sea[1], cx + 30, cy + 665, { h: .045, elev: 9 });
  drawSp(A.sea[2], cx - 20, cy + 810, { h: .06, elev: 10 });
  inkLine(seg([cx - 520, cy + 84], [cx + 520, cy + 76], 9), { t, seed: 421, w: 5, p: eIO(prog(t, 55.0, 55.5)), h: .032 });
  inkLine(seg([cx - 160, cy + 150], [cx + 160, cy + 150], 8), { t, seed: 422, w: 5, p: eOut(prog(t, T.refl[0], T.refl[0] + .25)), h: .035, color: '#0b3f5e' });
  inkLine(seg([cx - 80, cy + 196], [cx + 80, cy + 196], 8), { t, seed: 423, w: 5, p: eOut(prog(t, T.refl[0] + .15, T.refl[1])), h: .036, color: '#0b3f5e' });
  word(A.havn2, cx, cy - 700, t, T.havn2, { h: .05, seed: 144 });
  const g = slide(t, T.gavan2, .25);
  if (tq >= T.gavan2) drawSp(A.gavan2, cx + (1 - g) * 900, cy - 535, { h: .05, lift: (1 - g) * .5, rot: -.02 });
  const so = slide(t, T.sohrani, .2);
  if (tq >= T.sohrani) {
    drawSp(A.sohrani, cx - (1 - so) * 950, cy + 330, { h: .07, lift: (1 - so) * .5, rot: .02, elev: 8 });
    drawInk(A.sohraniT, cx - (1 - so) * 950, cy + 326, { t, p: prog(t, T.sohraniW[0], T.sohraniW[1]), h: .072, rot: .02, seed: 20 });
  }
  const li = drop(t, T.link);
  if (li) drawSp(A.link, cx, cy + 460 - li.lift * 50, { h: .075, lift: li.lift, rot: -.03, elev: 8 });
  drawSp(A.cloudFg, cx - 420 + drift * 20, cy + 720, { h: .42, soft: 1, elev: 34 });
}

const SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];
function drawWorld(t) {
  CAM = camAt(t); FLASH = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  SCENES.forEach((s, i) => { if (on(i)) s(t); });
  if (FLASH > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,252,240,${FLASH})`; ctx.fillRect(0, 0, W, H); }
}

/* ---------- sound cues, from the same timeline ---------- */
function slaps(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('slap', t0 + j * stagger + 2 / 12, { g })); }
function buildCues() {
  for (let i = 0; i < SC.length - 1; i++) cue('whoosh', SC[i][1] - .02, { d: SC[i + 1][0] - SC[i][1] + .1 });
  cue('rain', 0, { d: 4.7 }); [0.2, 1.6, 3.0].forEach(t => cue('wave', t, { d: 1.4 }));
  cue('pen', T.kogda[0], { d: T.kogda[1] - T.kogda[0] }); slaps(A.shtorm, T.shtorm, 1 / 12, .8); cue('thunder', T.flash); cue('slide', T.perezhdat, { d: .25 });
  cue('wave', 5.0, { d: 2.0, g: .5 }); slaps(A.havn, T.havn, 1 / 12, .7); cue('chime', T.havn + .3); cue('slide', T.gavan, { d: .25 });
  cue('slide', T.tihoeLbl, { d: .22 }); cue('pen', T.tihoe[0], { d: T.tihoe[1] - T.tihoe[0] }); cue('pen', T.kuda[0], { d: T.kuda[1] - T.kuda[0] }); cue('pen', T.kogda2[0], { d: .35 });
  slaps(A.tyazhelo, T.tyazhelo, 1 / 24, .7);
  cue('slide', T.ticket, { d: .22 }); slaps(A.vhod, T.vhod, 1 / 12, .6); cue('pen', T.svob[0], { d: .6 }); T.stamps.forEach(t => cue('stamp', t));
  cue('pen', T.prosto[0], { d: .55 }); cue('pen', T.square[0], { d: .7, g: .6 }); slaps(A.dyshi, T.dyshi, 1 / 24, .5); slaps(A.podyshat, T.podyshat, 1 / 24, .55);
  for (let i = 0; i < 5; i++) cue('tap', T.lap + i); for (let i = 0; i < 4; i++) cue('pen', T.lap + i, { d: .35, g: .45 }); cue('slide', T.ritm, { d: .25 });
  cue('pen', T.napishi[0], { d: .65 }); cue('slide', T.note, { d: .22 }); cue('pen', T.line1[0], { d: .7 }); cue('pen', T.line2[0], { d: .8 });
  slaps(A.otpusti, T.otpusti, 1 / 24, .65); cue('tear', T.tear); cue('flutter', T.tear + .05, { d: 1.6 }); cue('slide', T.nichego, { d: .25 });
  cue('pen', T.moon[0], { d: .7, g: .5 }); slaps(A.vygovoris, T.vygovoris, 1 / 24, .5); cue('pop', T.b1 + 2 / 12); cue('type', T.typing[0], { d: .8 }); cue('pop', T.b2 + 2 / 12, { hi: 1 });
  cue('slap', T.ai + 2 / 12, { g: .6 }); cue('pen', T.noch[0], { d: .65 });
  cue('pen', T.tvoy[0], { d: .4 }); slaps(A.pitomec, T.pitomec, 1 / 24, .6); T.pets.forEach(t => cue('slap', t + 2 / 12, { g: .8, low: 1 }));
  T.pets.forEach(t => cue('pen', t + .25, { d: .35, g: .4 })); cue('slide', T.raduetsya, { d: .25 }); T.hearts.forEach((t, i) => cue('pop', t, { hi: 1 + i }));
  slaps(A.n25, T.n25, 1 / 12, 1); cue('pen', T.pisem[0], { d: .7 }); T.env.forEach(t => { cue('slide', t, { d: .25, g: .7 }); cue('slap', t + .25, { g: .4 }); });
  cue('pen', T.ugolok[0], { d: .6 }); cue('box', T.lid); T.items.forEach((t, i) => cue('pop', t + .1, { i }));
  cue('pen', T.phone[0], { d: .9, g: .7 }); cue('pen', T.tolko[0], { d: .5 }); cue('click', T.tolko[0] + .3); slaps(A.uTebya, T.uTebya, 1 / 24, .7);
  cue('pen', T.esli[0], { d: .8 }); cue('slide', T.finger[0], { d: .55 }); cue('click', T.press, { big: 1 }); T.cards.forEach(t => cue('slide', t, { d: .25 }));
  slaps(A.pomosh, T.pomosh, 1 / 24, .7); cue('pen', T.ryadom[0], { d: .5 });
  cue('wave', 54.9, { d: 2.5, g: .45 }); slaps(A.havn2, T.havn2, 1 / 12, .7); cue('chime', 56.0); cue('chime', T.rays[0], { hi: 1 });
  cue('slide', T.gavan2, { d: .25 }); cue('slide', T.sohrani, { d: .2 }); cue('pen', T.sohraniW[0], { d: .85 }); cue('slap', T.link + 2 / 12, { g: .5 });
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
    const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
    loop();
  }
  return true;
})();
