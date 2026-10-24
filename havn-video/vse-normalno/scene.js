/* HAVN · «Всё нормально» — 36.5 s, 1080×1920, ink + cut paper.
   Someone writes the truth to mum by hand three times, scribbles it out and
   sends a neat printed lie instead. Each torn-off truth stays on the table;
   the pull-back shows how many there are. Then: ask again, you don't have to
   pretend here, HAVN, copy the link and send it to the one who keeps saying
   «всё нормально». */
'use strict';

const DUR = 36.5;
const sstep = x => x * x * (3 - 2 * x);
Object.assign(PAL, { skin: '#f1cfae', skin2: '#e6b994', hair: '#4f3a32', sweater: '#8fa9c4', phone: '#22313f', red: '#e0473c', pink: '#f4a3a0', drop: '#bfe3f7', bubIn: '#fbf8f1', bubOut: '#d3e7f4', note: '#fff6c9' });

/* ---------- places on the table ---------- */
const PH = [540, 1000];        // the phone
const P2 = [540, 3220];        // «спроси ещё раз»
const P3 = [1750, 3220];       // the face behind a smiling mask
const P4 = [1750, 4900];       // the HAVN card
const P5 = [540, 4900];        // copy the link
const P6 = [540, 6750];        // the mark
const CAMK = [
  [0.00, 540, 1030, 1.32, -1.4],
  [3.30, 540, 1040, 1.36, 0.6],
  [7.90, 540, 1060, 1.42, -0.8],
  [11.15, 540, 1075, 1.47, 0.7],
  [12.60, 540, 1000, 0.56, -1.0],
  [15.90, 540, 990, 0.70, 0.8],
  [16.45, 540, 3220, 0.94, -0.6],
  [19.20, 540, 3230, 1.00, 0.6],
  [19.75, 1750, 3280, 0.90, 1.0],
  [22.60, 1750, 3290, 0.97, -0.6],
  [23.15, 1750, 4900, 1.05, 0.8],
  [25.90, 1750, 4900, 1.12, -0.5],
  [26.45, 540, 4950, 0.90, -1.0],
  [32.80, 540, 4950, 0.97, 0.6],
  [33.35, 540, 6750, 1.05, -0.4],
  [36.50, 540, 6750, 1.12, 0.0]
];
const SHAKES = [[12.8, .5], [14.75, .25], [24.95, .2], [28.6, .2]];

/* ---------- timeline ---------- */
const ROUNDS = [
  { truth: 'мне очень плохо', type: [0.6, 1.75], erase: [2.1, 2.6], lie: 'всё нормально', lieT: [2.75, 3.15], send: 3.3 },
  { truth: 'я плачу каждый вечер', type: [4.5, 5.95], erase: [6.3, 6.85], lie: 'просто устаю', lieT: [7.0, 7.7], send: 7.95 },
  { truth: 'я не справляюсь', type: [9.0, 9.95], erase: [10.2, 10.6], lie: 'всё ок)', lieT: [10.7, 10.9], send: 11.05 }
];
ROUNDS.forEach(r => { r.peel = r.erase[1] + .05; });
const MSG = [
  { from: 'in', text: 'ты как?', t: 0.25 },
  { from: 'out', text: 'всё нормально', t: 3.3 },
  { from: 'in', text: 'точно?', t: 4.0, dots: 3.55 },
  { from: 'out', text: 'просто устаю', t: 7.95 },
  { from: 'in', text: 'если что — я рядом', heart: true, t: 8.5, dots: 8.1 },
  { from: 'out', text: 'всё ок)', t: 11.05 }
];
const T = {
  extras: 11.5, sheet: 12.75, inogda: [13.0, 13.4], vseNorm: [13.45, 14.2], znachit: [14.25, 14.6], zamet: 14.7, menya: 15.05,
  esli: [16.55, 17.3], sprosi: 17.3, eshe: 17.6, ask: 18.15, dots: 18.75,
  aEsli: [19.85, 20.6], maskOff: 20.75, zdes: [21.15, 21.55], nePr: 21.6, tear: 21.3,
  card: 23.15, sun: [23.35, 23.95], logo: 23.65, rows: [24.0, 24.3, 24.6], stamp: 25.05, stamp2: 25.35,
  kop: 26.5, ssyl: [26.9, 27.3], plate: 27.25, finger: [27.55, 27.85], ring: [27.9, 28.5], copied: 28.6, fingerOut: 28.7,
  strip: 29.0, fold: 29.25, fly: [29.45, 30.45], send: [29.3, 29.75], send2: [29.8, 30.3], send3: [30.35, 30.9], pinned: 31.2,
  mark: [33.45, 34.2], havn: 34.05, tag: 34.55, link: 35.0
};

/* ---------- assets ---------- */
const A = {};
const ell = (w, h, n = 64) => arc(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2, n);
function rrect(x0, y0, w, h, r) {
  const pts = [], q = Math.PI / 2;
  [[x0 + w - r, y0 + r, -q], [x0 + w - r, y0 + h - r, 0], [x0 + r, y0 + h - r, q], [x0 + r, y0 + r, 2 * q]].forEach(([cx, cy, a]) => { for (let i = 0; i <= 8; i++) { const b = a + q * i / 8; pts.push([cx + Math.cos(b) * r, cy + Math.sin(b) * r]); } });
  return pts;
}
const closed = pts => { let r = []; const c = pts.concat([pts[0]]); for (let i = 0; i < c.length - 1; i++) r = r.concat(seg(c[i], c[i + 1], 8).slice(i ? 1 : 0)); return r; };
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
// a chat bubble: printed words on a rounded paper slip
const BF = '600 44px Inter';
function bubble(text, from, seed, heart) {
  const w = textW(text, BF) + 76 + (heart ? 58 : 0), h = 96;
  return { w, h, sp: card(w, h, { seed, color: from === 'in' ? PAL.bubIn : PAL.bubOut, shape: rrect(0, 0, w, h, 40), jit: .01, content: (x, cx, cy) => {
    x.font = BF; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = PAL.ink; x.fillText(text, cx - w / 2 + 38, cy + 2);
    if (heart) { const hx = cx + w / 2 - 62, hy = cy + 2; x.fillStyle = PAL.red; x.beginPath(); x.moveTo(hx, hy + 15); x.bezierCurveTo(hx - 26, hy - 2, hx - 14, hy - 24, hx, hy - 10); x.bezierCurveTo(hx + 14, hy - 24, hx + 26, hy - 2, hx, hy + 15); x.fill(); }
  } }) };
}
// a torn-off piece of the truth: handwriting with a strike-through
function truthScrap(text, size, seed, scribbled) {
  const font = `700 ${size}px Cav`, tw = textW(text, font), w = tw + 70, h = size * 1.75;
  const cols = [PAL.white, PAL.cream, PAL.note, PAL.white, PAL.ice];
  return { tw, sp: card(w, h, { seed, torn: true, color: cols[seed % cols.length], content: (x, cx, cy) => {
    x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.ink;
    x.filter = `url(#ink${seed % 3})`; x.globalAlpha = .28; x.fillText(text, cx + 2.4, cy + 1.8); x.globalAlpha = 1; x.fillText(text, cx, cy);
    x.strokeStyle = PAL.ink; x.lineCap = 'round'; x.lineJoin = 'round'; const r = mulberry32(seed * 7);
    if (scribbled) {
      x.lineWidth = 4.5; x.beginPath();
      x.moveTo(cx - tw / 2 - 8, cy + 4); x.quadraticCurveTo(cx, cy - 4, cx + tw / 2 + 8, cy + 2);
      x.moveTo(cx + tw / 2 + 4, cy - 8); x.quadraticCurveTo(cx, cy + 6, cx - tw / 2 - 4, cy - 4); x.stroke();
    } else {
      x.lineWidth = 4.5; x.beginPath(); x.moveTo(cx - tw / 2 - 6, cy + 4 + (r() - .5) * 8); x.quadraticCurveTo(cx, cy - 6 + (r() - .5) * 10, cx + tw / 2 + 6, cy + (r() - .5) * 8); x.stroke();
    }
    x.filter = 'none';
  } }) };
}

const INPUT = [PH[0] - 30, PH[1] + 505];      // input strip centre
const TXT0 = PH[0] - 270;                      // left edge of text in the strip
const slotY = i => PH[1] - 360 + i * 126;
const EXTRA = [
  ['почему мне всё равно', 430, -250, -.05], ['мне одиноко', 90, -20, -.08], ['обними меня', 900, 0, .07], ['мне страшно', 560, 250, .05],
  ['я не сплю', 40, 320, -.09], ['сил нет', 1080, 300, .1], ['мне тяжело', 130, 2060, .06], ['мне так пусто', 640, 2075, -.05],
  ['помоги', 1130, 2050, .09], ['я не знаю, что со мной', 380, 2250, -.04], ['побудь со мной', 1060, 2260, .06],
  ['мне просто плохо', 1280, 1150, .12], ['я стараюсь', -170, 900, -.1]
];
const SCRAP_AT = [[330, 1700, -.05], [700, 1890, .04], [850, 1690, .07]];

function buildAssets() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft];

  // the phone: dark paper body, cream screen with a printed header
  A.phone = card(730, 1340, { seed: 1, color: PAL.phone, shape: rrect(0, 0, 730, 1340, 96), tex: .8 });
  A.screen = card(656, 1262, { seed: 2, color: PAL.white, shape: rrect(0, 0, 656, 1262, 66), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = PAL.ink; x.textBaseline = 'middle';
    x.font = '600 30px Inter'; x.textAlign = 'left'; x.fillText('23:47', cx - 270, cy - 585);
    x.fillRect(cx + 220, cy - 597, 46, 22); x.fillRect(cx + 266, cy - 591, 5, 10);
    x.fillStyle = PAL.white; x.fillRect(cx + 224, cy - 593, 10, 14);
    x.fillStyle = PAL.ink; x.font = '600 58px Inter'; x.fillText('‹', cx - 290, cy - 512);
    x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx - 195, cy - 508, 40, 0, 7); x.fill();
    x.fillStyle = '#ffffff'; x.font = '700 46px Cav'; x.textAlign = 'center'; x.fillText('м', cx - 195, cy - 512);
    x.fillStyle = PAL.ink; x.font = '700 62px Cav'; x.textAlign = 'left'; x.fillText('мама', cx - 135, cy - 514);
    x.font = '500 26px Inter'; x.fillStyle = 'rgba(24,41,59,.55)'; x.fillText('была в сети недавно', cx - 133, cy - 470);
  } });
  A.input = card(560, 104, { seed: 3, color: '#ffffff', shape: rrect(0, 0, 560, 104, 50), jit: .01 });
  A.sendBtn = card(96, 96, { seed: 4, color: PAL.orange, shape: ell(96, 96, 40), content: (x, cx, cy) => {
    x.strokeStyle = '#fff'; x.lineWidth = 8; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx, cy + 22); x.lineTo(cx, cy - 20); x.moveTo(cx - 17, cy - 4); x.lineTo(cx, cy - 22); x.lineTo(cx + 17, cy - 4); x.stroke();
  } });
  A.msg = MSG.map((m, i) => bubble(m.text, m.from, 10 + i, m.heart));
  A.dotsBub = card(130, 80, { seed: 17, color: PAL.bubIn, shape: rrect(0, 0, 130, 80, 38), jit: .01 });
  A.truth = ROUNDS.map((r, i) => inkText(r.truth, 60, PAL.ink, { seed: 20 + i }));
  A.truthScrap = ROUNDS.map((r, i) => truthScrap(r.truth, 60, 23 + i, true));
  A.extra = EXTRA.map((e, i) => truthScrap(e[0], 72, 30 + i, i % 3 !== 1));

  // the sheet
  A.sheet = card(960, 1130, { seed: 50, color: PAL.cream, torn: true, rim: PAL.white });
  A.inogda = inkText('иногда', 92, PAL.ink, { seed: 51 });
  A.vseNorm = inkText('«всё нормально»', 128, PAL.ink, { seed: 52 });
  A.znachit = inkText('значит', 92, PAL.ink, { seed: 53 });
  A.zamet = cutWord('ЗАМЕТЬ', 150, PAL.orange, { seed: 54 });
  A.menya = cutWord('МЕНЯ', 150, PAL.orange, { seed: 55 });

  // ask again
  A.esli = inkText('если тебе так отвечают —', 78, PAL.ink, { seed: 60 });
  A.sprosi = cutWord('СПРОСИ', 150, PAL.orange, { seed: 61 });
  A.eshe = cutWord('ЕЩЁ РАЗ', 150, PAL.orange, { seed: 62 });
  A.ask = bubble('а если честно — как ты?', 'out', 63);

  // the face and the mask
  A.head = card(500, 620, { seed: 70, color: PAL.skin, shape: ell(500, 620, 90), tex: .5 });
  const hair = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + Math.PI * i / 40; hair.push([280 + Math.cos(a) * 280, 230 + Math.sin(a) * 236]); }
  for (let i = 0; i <= 12; i++) hair.push([560 - i * 560 / 12, 214 + (i % 2 ? 30 : 0)]);
  A.hair = card(560, 250, { seed: 71, color: PAL.hair, shape: hair, tex: .9 });
  A.ear = card(70, 110, { seed: 72, color: PAL.skin2, shape: ell(70, 110, 30) });
  A.neck = card(160, 260, { seed: 73, color: PAL.skin2 });
  A.torso = card(880, 760, { seed: 74, color: PAL.sweater, shape: [[355, 0], [130, 70], [40, 160], [0, 760], [880, 760], [840, 160], [750, 70], [525, 0]], tex: .9 });
  A.tear = card(30, 44, { seed: 75, color: PAL.drop, shape: [[15, 0], [29, 24], [24, 41], [6, 41], [1, 24]] });
  A.mask = card(540, 600, { seed: 76, color: '#fffdf7', shape: ell(540, 600, 80), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = 'rgba(244,163,160,.75)'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * 150, cy + 70, 52, 30, 0, 0, 7); x.fill(); });
  } });
  A.aEsli = inkText('а если так отвечаешь ты —', 76, PAL.ink, { seed: 77 });
  A.zdes = inkText('здесь можно', 96, PAL.ink, { seed: 78 });
  A.nePr = label('не притворяться', 'italic 600 118px Corm', { seed: 79, h: 170, dy: -6 });

  // the card
  A.card = card(840, 900, { seed: 80, color: '#fffdf7', shape: rrect(0, 0, 840, 900, 56), tex: .6 });
  A.logo = cutWord('HAVN', 112, PAL.deep, { seed: 81, track: 6 });
  A.sunO = card(120, 60, { seed: 82, color: PAL.sunO, shape: arc(60, 60, 60, 60, Math.PI, Math.PI * 2, 30).concat([[120, 60], [0, 60]]) });
  A.rows = ['Мне плохо прямо сейчас', 'Как попросить о помощи', 'Как поддержать другого'].map((s, i) => inkText(s, 60, PAL.ink, { seed: 83 + i }));
  A.dots = [PAL.red, PAL.orange, PAL.deep].map((c, i) => card(40, 40, { seed: 86 + i, color: c, shape: ell(40, 40, 24) }));
  A.stamp = stamp('БЕЗ РЕГИСТРАЦИИ', PAL.deep, 36);
  A.stamp2 = stamp('БЕСПЛАТНО', PAL.orange, 36);

  // copy the link
  A.kop = cutWord('СКОПИРУЙ', 132, PAL.orange, { seed: 90 });
  A.ssyl = inkText('ссылку', 112, PAL.ink, { seed: 91 });
  A.plate = card(860, 150, { seed: 92, color: PAL.deep, content: (x, cx, cy) => {
    x.font = '600 54px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText('havnhelp.netlify.app', cx - 380, cy + 2);
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.lineJoin = 'round';
    x.beginPath(); x.roundRect(cx + 300, cy - 30, 44, 50, 8); x.stroke();
    x.fillStyle = PAL.deep; x.beginPath(); x.roundRect(cx + 316, cy - 14, 44, 50, 8); x.fill(); x.stroke();
  } });
  A.finger = card(130, 560, { seed: 93, color: PAL.skin, shape: rrect(0, 0, 130, 560, 62), tex: .5, content: (x, cx, cy) => {
    x.fillStyle = '#f8ddc6'; x.beginPath(); x.roundRect(cx - 38, cy - 268, 76, 84, 30); x.fill();
    x.strokeStyle = 'rgba(160,110,80,.5)'; x.lineWidth = 4; x.lineCap = 'round';
    [-60, -40].forEach(d => { x.beginPath(); x.moveTo(cx - 34, cy + d); x.lineTo(cx + 34, cy + d + 2); x.stroke(); });
  } });
  A.copied = stamp('СКОПИРОВАНО', PAL.orange, 44);
  const strip = (w) => (x, cx, cy) => { x.font = '600 40px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.deep; x.fillText('havnhelp.netlify.app', cx, cy + 2); };
  A.fold = [
    card(560, 96, { seed: 94, color: '#ffffff', content: strip() }),
    card(330, 120, { seed: 95, color: '#ffffff', shape: [[0, 0], [330, 50], [330, 70], [0, 120]] }),
    card(250, 110, { seed: 96, color: '#ffffff', shape: [[0, 0], [250, 62], [24, 110], [52, 66]], content: (x, cx, cy) => { x.strokeStyle = 'rgba(24,41,59,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 73, cy + 11); x.lineTo(cx + 125, cy + 7); x.stroke(); } })
  ];
  A.send = inkText('и отправь тому,', 84, PAL.ink, { seed: 97 });
  A.send2 = inkText('кто давно говорит', 84, PAL.ink, { seed: 98 });
  A.send3 = inkText('«всё нормально»', 104, PAL.orange, { seed: 99 });
  A.pinned = label('ссылка — в закреплённом комментарии ↓', '600 38px Inter', { seed: 100, h: 92, color: PAL.cream, dy: 0 });

  // the mark
  A.bigSun = card(300, 150, { seed: 110, color: PAL.sunO, shape: arc(150, 150, 150, 150, Math.PI, Math.PI * 2, 50).concat([[300, 150], [0, 150]]) });
  A.havn = cutWord('HAVN', 170, PAL.deep, { seed: 111, track: 10 });
  A.tag = label('тихое место, когда тяжело', 'italic 600 72px Corm', { seed: 112, h: 112, dy: -4 });
  A.link = card(560, 84, { seed: 113, color: PAL.deep, content: printed('havnhelp.netlify.app', '600 42px Inter', '#ffffff', 2) });

  // blank paper bits along the way
  const DR = mulberry32(7); A.decor = [];
  [[P2, P3], [P3, P4], [P4, P5], [P5, P6]].forEach(([a, b], bi) => { for (let i = 0; i < 6; i++) { const u = .2 + DR() * .6; A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + bi * 10 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: lerp(a[0], b[0], u) + (DR() < .5 ? -1 : 1) * (560 + DR() * 300) * (a[0] === b[0] ? 1 : 0) + (DR() - .5) * 300, y: lerp(a[1], b[1], u) + (a[1] === b[1] ? (DR() < .5 ? -1 : 1) * (950 + DR() * 300) : 0), rot: (DR() - .5) * .8, h: DR() * .05 }); } });
}

/* ---------- helpers ---------- */
function wordX(wd, cx, cy, t, t0, o = {}) {
  wd.letters.forEach((L, j) => {
    const d = drop(t, t0 + j * (o.stagger == null ? 1 / 24 : o.stagger)); if (!d) return;
    const sc = o.sc || 1, jj = o.shake ? jit(j + (o.seed || 0) * 13, t, o.shake) : [0, 0, 0];
    drawSp(L.sp, cx + L.dx * sc + jj[0], cy - d.lift * 60 + jj[1], { h: o.h || .05, lift: d.lift, rot: (h2(j, (o.seed || 1) * 7) - .5) * .08 + jj[2] * 5 + (d.lift ? (h2(j, 33 + d.k) - .5) * .5 * d.lift : 0), sc });
  });
}
const dist = (p) => Math.hypot((CAM.x - p[0]) * .6, CAM.y - p[1]);

/* ---------- the chat ---------- */
function bubbleX(m, b) { return m.from === 'in' ? PH[0] - 290 + b.w / 2 : PH[0] + 290 - b.w / 2; }
function inkOutline(pts, ox, oy, o) { inkLine(closed(pts.map(p => [p[0] + ox, p[1] + oy])).slice(0, -1), Object.assign({ w: 3.5, gaps: true, dbl: false, alpha: .8 }, o)); }

function phone(t) {
  const [px, py] = PH, tq = step12(t);
  drawSp(A.phone, px, py, { h: .004, elev: 10 });
  drawSp(A.screen, px, py, { h: .006, elev: 2, shadow: false });
  inkLine(seg([px - 300, py - 440], [px + 300, py - 440], 9), { t, seed: 200, w: 3.5, h: .008, alpha: .7 });
  // messages
  MSG.forEach((m, i) => {
    if (m.dots && t > m.dots && tq < m.t) {
      const bx = px - 290 + 65, by = slotY(i);
      drawSp(A.dotsBub, bx, by, { h: .008, elev: 2 });
      for (let k = 0; k < 3; k++) { const b = Math.max(0, Math.sin(tq * 9 - k * 1.1)); layer(.009); ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(bx - 30 + k * 30, by - b * 9, 8, 0, 7); ctx.fill(); }
    }
    if (tq < m.t) return;
    const b = A.msg[i], tx = bubbleX(m, b), ty = slotY(i);
    let x = tx, y = ty, lift = 0;
    if (m.from === 'in') { const u = slide(t, m.t, .2); x = tx - (1 - u) * 160; lift = (1 - u) * .35; }
    else { const u = slide(t, m.t, .25); x = lerp(INPUT[0], tx, u); y = lerp(INPUT[1], ty, u); lift = Math.sin(u * Math.PI) * .3; }
    drawSp(b.sp, x, y, { h: .008, lift, elev: 3 });
    if (lift < .05) inkOutline(rrect(0, 0, b.w, b.h, 40), x - b.w / 2, y - b.h / 2, { t, seed: 210 + i, h: .009 });
    if (m.from === 'out' && t > m.t + .35) { layer(.009); ctx.font = '600 24px Inter'; ctx.fillStyle = 'rgba(24,41,59,.5)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('прочитано', tx + b.w / 2 - 10, ty + 66); }
  });
  // input strip
  drawSp(A.input, INPUT[0], INPUT[1], { h: .007, elev: 2 });
  inkOutline(rrect(0, 0, 560, 104, 50), INPUT[0] - 280, INPUT[1] - 52, { t, seed: 230, h: .009, alpha: .85 });
  drawSp(A.sendBtn, px + 275, INPUT[1], { h: .008, elev: 3, sc: ROUNDS.some(r => t > r.send && t < r.send + .1) ? .88 : 1 });
  let busy = false;
  ROUNDS.forEach((r, i) => {
    const it = A.truth[i];
    if (t >= r.type[0] && tq < r.peel) {
      busy = true;
      drawInk(it, TXT0, INPUT[1], { t, p: prog(t, r.type[0], r.type[1]), h: .01, align: 'left', seed: i });
      if (t > r.erase[0]) {
        const a = TXT0 - 8, b = TXT0 + it.tw + 8, y0 = INPUT[1], mid = (r.erase[0] + r.erase[1]) / 2;
        inkLine(smooth([[a, y0 + 4], [(a + b) / 2, y0 - 4], [b, y0 + 2]], 24), { t, seed: 240 + i, w: 4.5, p: eOut(prog(t, r.erase[0], mid)), h: .011, gaps: false, dbl: false });
        inkLine(smooth([[b - 4, y0 - 8], [(a + b) / 2, y0 + 6], [a + 4, y0 - 4]], 24), { t, seed: 250 + i, w: 4.5, p: eOut(prog(t, mid, r.erase[1])), h: .011, gaps: false, dbl: false });
      }
    }
    if (t >= r.lieT[0] && tq < r.send) {
      busy = true;
      const n = Math.ceil(prog(t, r.lieT[0], r.lieT[1]) * r.lie.length - 1e-6);
      layer(.01); ctx.font = BF; ctx.fillStyle = PAL.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const s = r.lie.slice(0, n); ctx.fillText(s, TXT0, INPUT[1] + 2);
      ctx.fillRect(TXT0 + ctx.measureText(s).width + 4, INPUT[1] - 26, 3.5, 52);
    }
  });
  if (!busy && t < 12) {
    layer(.01); ctx.font = BF; ctx.fillStyle = 'rgba(24,41,59,.35)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('сообщение', TXT0, INPUT[1] + 2);
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = PAL.ink; ctx.fillRect(TXT0 - 6, INPUT[1] - 26, 3.5, 52); }
  }
}

// torn-off truths: three fly out of the phone, the rest are already lying around
function scraps(t) {
  const tq = step12(t), wob = t > T.zamet && t < 16.2 ? 4 : 0;
  ROUNDS.forEach((r, i) => {
    if (tq < r.peel) return;
    const s = A.truthScrap[i], [ex, ey, er] = SCRAP_AT[i];
    const x0 = TXT0 + s.tw / 2, u = slide(t, r.peel, 1.1, eIO);
    const x = lerp(x0, ex, u), y = lerp(INPUT[1], ey, u) - Math.sin(u * Math.PI) * 260, lift = u < 1 ? .25 + Math.sin(u * Math.PI) * .7 : 0;
    const j = wob ? jit(300 + i, t, wob) : [0, 0, 0];
    drawSp(s.sp, x + j[0], y + j[1], { h: lerp(.012, .01, u), lift, rot: er * u + Math.sin(u * 9) * .15 * (1 - u) + j[2] * 4 });
  });
  EXTRA.forEach((e, i) => {
    const d = drop(t, T.extras + i * .09); if (!d) return;
    const j = wob ? jit(320 + i, t, wob) : [0, 0, 0];
    drawSp(A.extra[i].sp, e[1] + j[0], e[2] - d.lift * 80 + j[1], { h: .01, lift: d.lift, rot: e[3] + j[2] * 4 });
  });
}

function sheet(t) {
  const d = drop(t, T.sheet); if (!d) return;
  const [cx, cy] = PH;
  drawSp(A.sheet, cx, cy - d.lift * 120, { h: .03, lift: d.lift, rot: -.025, elev: 8 });
  if (d.lift) return;
  drawInk(A.inogda, cx - 200, cy - 410, { t, p: prog(t, T.inogda[0], T.inogda[1]), h: .04, rot: -.04, seed: 1 });
  drawInk(A.vseNorm, cx, cy - 235, { t, p: prog(t, T.vseNorm[0], T.vseNorm[1]), h: .045, rot: -.02, seed: 2 });
  drawInk(A.znachit, cx + 170, cy - 70, { t, p: prog(t, T.znachit[0], T.znachit[1]), h: .04, rot: .03, seed: 3 });
  if (t > T.znachit[1]) inkLine(smooth([[cx - 300, cy - 160], [cx, cy - 140], [cx + 330, cy - 165]], 6), { t, seed: 260, w: 5, h: .042, p: prog(t, T.znachit[1], T.znachit[1] + .2), color: PAL.ink, alpha: .55 });
  wordX(A.zamet, cx, cy + 135, t, T.zamet, { h: .06, seed: 54 });
  wordX(A.menya, cx, cy + 335, t, T.menya, { h: .06, seed: 55 });
  if (t > T.menya + .4) inkLine(smooth([[cx - 260, cy + 450], [cx - 40, cy + 470], [cx + 250, cy + 445]], 6), { t, seed: 261, w: 7, h: .055, p: eOut(prog(t, T.menya + .4, T.menya + .7)), color: PAL.orange });
}

function askAgain(t) {
  const tq = step12(t), [cx, cy] = P2;
  drawInk(A.esli, cx, cy - 440, { t, p: prog(t, T.esli[0], T.esli[1]), h: .04, rot: -.025, seed: 4 });
  wordX(A.sprosi, cx, cy - 250, t, T.sprosi, { h: .06, seed: 61 });
  wordX(A.eshe, cx, cy - 75, t, T.eshe, { h: .06, seed: 62 });
  if (tq >= T.ask) {
    const b = A.ask, u = slide(t, T.ask, .25), x = cx + 40 + (1 - u) * 900, y = cy + 170;
    drawSp(b.sp, x, y, { h: .03, lift: (1 - u) * .45, rot: -.02, elev: 6 });
    if (u >= 1) inkOutline(rrect(0, 0, b.w, b.h, 40), x - b.w / 2, y - b.h / 2, { t, seed: 270, h: .031 });
  }
  if (tq >= T.dots) {
    const u = slide(t, T.dots, .2), bx = cx - 200 - (1 - u) * 600, by = cy + 330;
    drawSp(A.dotsBub, bx, by, { h: .03, lift: (1 - u) * .4, elev: 4 });
    for (let k = 0; k < 3; k++) { const b = Math.max(0, Math.sin(tq * 9 - k * 1.1)); layer(.032); ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(bx - 30 + k * 30, by - b * 9, 8, 0, 7); ctx.fill(); }
  }
}

function face(t) {
  const tq = step12(t), [fx, fy] = P3;
  drawSp(A.torso, fx, fy + 640, { h: .006, elev: 6 });
  drawSp(A.neck, fx, fy + 300, { h: .007, elev: 3 });
  [-1, 1].forEach(s => drawSp(A.ear, fx + s * 252, fy + 10, { h: .008, elev: 3 }));
  drawSp(A.head, fx, fy, { h: .01, elev: 6 });
  drawSp(A.hair, fx, fy - 215, { h: .014, elev: 5 });
  const L = { t, h: .016 };
  inkLine(arc(fx, fy, 250, 310, -Math.PI * .1, Math.PI * 1.1, 70), Object.assign({ seed: 400, w: 5 }, L));
  // tired: inner brows up, heavy lids, eyes down, a small frown
  [-1, 1].forEach((s, i) => {
    inkLine(smooth([[fx + s * 40, fy - 92], [fx + s * 95, fy - 84], [fx + s * 148, fy - 62]], 6), Object.assign({ seed: 401 + i, w: 7 }, L));
    const ex = fx + s * 92, ey = fy + 2;
    inkLine(arc(ex, ey, 36, 18, Math.PI * .02, Math.PI * .98, 20), Object.assign({ seed: 403 + i, w: 4.5, gaps: false }, L));
    inkLine(seg([ex - 38, ey - 2], [ex + 38, ey - 2], 6), Object.assign({ seed: 405 + i, w: 5.5, dbl: false }, L));
    inkLine(arc(ex + s * 2, ey + 8, 8, 7, 0, Math.PI * 2, 12), Object.assign({ seed: 407 + i, w: 8, gaps: false, dbl: false }, L));
    inkLine(arc(ex, ey + 20, 32, 14, Math.PI * .15, Math.PI * .85, 14), Object.assign({ seed: 409 + i, w: 3, dbl: false, alpha: .5 }, L));
  });
  inkLine(smooth([[fx + 4, fy + 40], [fx - 16, fy + 110], [fx + 12, fy + 120]], 6), Object.assign({ seed: 411, w: 4.5 }, L));
  inkLine(smooth([[fx - 70, fy + 200], [fx, fy + 186], [fx + 70, fy + 202]], 6), Object.assign({ seed: 412, w: 5.5 }, L));
  if (tq >= T.tear) { const u = slide(t, T.tear, 1.4, eIO); drawSp(A.tear, fx - 104, fy + 40 + u * 150, { h: .018, elev: 3, alpha: 1 - prog(t, T.tear + 1.8, T.tear + 2.1) }); }
  // the mask: a drawn smile, lifted off and thrown away
  const off = slide(t, T.maskOff, .5, eIn), pre = tq >= T.maskOff - .2 && tq < T.maskOff ? .12 : 0;
  if (off >= 1) return;
  const mx = fx + off * 1000, my = fy - 20 - off * 520, mr = -.03 + off * .9 + pre * .3;
  drawSp(A.mask, mx, my, { h: .02, lift: .08 + pre + off * .6, rot: mr, elev: 6 });
  const tf = () => { ctx.translate(mx, my); ctx.rotate(mr); ctx.translate(-mx, -my); };
  const ML = { t, h: .022, tf };
  [-1, 1].forEach((s, i) => inkLine(arc(mx + s * 105, my - 40, 42, 34, Math.PI * 1.1, Math.PI * 1.9, 16), Object.assign({ seed: 420 + i, w: 8 }, ML)));
  inkLine(arc(mx, my + 40, 170, 120, Math.PI * .12, Math.PI * .88, 30), Object.assign({ seed: 422, w: 9 }, ML));
  inkLine(arc(mx, my, 270, 300, 0, Math.PI * 2, 70), Object.assign({ seed: 423, w: 4, alpha: .7 }, ML));
}
function faceTexts(t) {
  const tq = step12(t), [fx, fy] = P3;
  drawInk(A.aEsli, fx, fy - 470, { t, p: prog(t, T.aEsli[0], T.aEsli[1]), h: .045, rot: -.02, seed: 5 });
  drawInk(A.zdes, fx - 120, fy + 400, { t, p: prog(t, T.zdes[0], T.zdes[1]), h: .05, rot: -.03, seed: 6 });
  if (tq >= T.nePr) { const u = slide(t, T.nePr, .22); drawSp(A.nePr, fx + 60 + (1 - u) * 1000, fy + 560, { h: .055, lift: (1 - u) * .45, rot: .02, elev: 8 }); }
  if (t > T.nePr + .35) inkLine(smooth([[fx - 280, fy + 650], [fx + 60, fy + 668], [fx + 400, fy + 640]], 6), { t, seed: 430, w: 7, h: .06, p: eOut(prog(t, T.nePr + .35, T.nePr + .65)), color: PAL.orange });
}

function havnCard(t) {
  const tq = step12(t), [cx, cy] = P4;
  if (tq < T.card) return;
  const u = slide(t, T.card, .25), ky = cy + (1 - u) * 1200;
  drawSp(A.card, cx, ky, { h: .02, lift: (1 - u) * .5, rot: -.015, elev: 9 });
  const su = slide(t, T.sun[0], T.sun[1] - T.sun[0], eIO);
  ctx.save(); layer(.024); ctx.beginPath(); ctx.rect(cx - 320, ky - 400, 160, 112); ctx.clip();
  drawSp(A.sunO, cx - 240, ky - 310 + 60 * (1 - su), { h: .024, elev: 3 }); ctx.restore();
  inkLine(seg([cx - 320, ky - 280], [cx - 160, ky - 280], 8), { t, seed: 500, w: 4.5, p: prog(t, T.sun[0], T.sun[0] + .3), h: .026 });
  inkLine(seg([cx - 280, ky - 256], [cx - 200, ky - 256], 8), { t, seed: 501, w: 4, p: prog(t, T.sun[1] - .2, T.sun[1]), h: .026, color: PAL.deep });
  word(A.logo, cx + 80, ky - 322, t, T.logo, { h: .03, seed: 81 });
  A.rows.forEach((it, i) => {
    const ry = ky - 130 + i * 120;
    const d = drop(t, T.rows[i] - .1); if (d) drawSp(A.dots[i], cx - 330, ry - d.lift * 40, { h: .026, lift: d.lift, elev: 3 });
    drawInk(it, cx - 285, ry - 2, { t, p: prog(t, T.rows[i], T.rows[i] + .4), h: .026, align: 'left', seed: 7 + i });
  });
  [[A.stamp, T.stamp, cx - 130, ky + 250, -.04], [A.stamp2, T.stamp2, cx + 190, ky + 360, .05]].forEach(([sp, ts, x, y, r]) => {
    const k = Math.round((tq - ts) * 12);
    if (k >= 0) drawSp(sp, x, y, { h: .03, rot: r, sc: k === 0 ? 1.3 : k === 1 ? 1.04 : 1, alpha: k === 0 ? .7 : 1, shadow: false });
  });
}

function copyLink(t) {
  const tq = step12(t), [cx, cy] = P5;
  wordX(A.kop, cx, cy - 560, t, T.kop, { h: .05, seed: 90 });
  drawInk(A.ssyl, cx, cy - 400, { t, p: prog(t, T.ssyl[0], T.ssyl[1]), h: .045, rot: -.02, seed: 8 });
  const pd = drop(t, T.plate), plY = cy - 190, icon = [cx + 338, plY + 2];
  if (pd) drawSp(A.plate, cx, plY - pd.lift * 60, { h: .03, lift: pd.lift, rot: -.012, elev: 8 });
  // long press: the finger comes in, a ring is drawn round the copy icon
  if (t > T.ring[0]) inkLine(arc(icon[0], icon[1], 66, 66, -Math.PI / 2, Math.PI * 1.5, 50), { t, seed: 510, w: 7, h: .045, p: prog(t, T.ring[0], T.ring[1]), color: PAL.orange, gaps: false });
  if (t > T.finger[0] && tq < T.fingerOut + .35) {
    const inn = slide(t, T.finger[0], T.finger[1] - T.finger[0]), outU = slide(t, T.fingerOut, .3, eIn), press = tq >= T.finger[1] && tq < T.fingerOut ? 1 : 0;
    const k = (1 - inn) + outU, ang = -.42;
    const tipX = icon[0] + 14 + Math.sin(-ang) * k * 700, tipY = icon[1] + 24 + Math.cos(ang) * k * 700;
    drawSp(A.finger, tipX - Math.sin(ang) * 255, tipY + Math.cos(ang) * 255, { h: .05 - press * .006, lift: .3 - press * .22, rot: ang, elev: 10 });
  }
  const k = Math.round((tq - T.copied) * 12);
  if (k >= 0) {
    drawSp(A.copied, cx - 70, cy - 30, { h: .05, rot: -.04, sc: k === 0 ? 1.3 : k === 1 ? 1.04 : 1, alpha: k === 0 ? .7 : 1, shadow: false });
    inkLine(chain([cx + 230, cy - 40], [cx + 262, cy - 6], [cx + 330, cy - 84]), { t, seed: 511, w: 10, h: .05, p: eOut(prog(t, T.copied + .1, T.copied + .3)), color: PAL.orange, dbl: false });
  }
  // the copy peels off the plate, folds into a plane and flies away
  if (tq >= T.strip) {
    const fu = slide(t, T.fly[0], T.fly[1] - T.fly[0], eIn);
    const st = tq < T.fold ? 0 : tq < T.fold + 2 / 12 ? 1 : 2;
    const lu = slide(t, T.strip, .25);
    const P0 = [cx - 20, plY - 20 - lu * 150], C1 = [cx + 500, cy - 420], C2 = [cx + 200, cy - 900], P1 = [cx + 1150, cy - 1150];
    const bz = (u) => [0, 1].map(c => (1 - u) ** 3 * P0[c] + 3 * (1 - u) ** 2 * u * C1[c] + 3 * (1 - u) * u * u * C2[c] + u ** 3 * P1[c]);
    const [x, y] = bz(fu), [x2, y2] = bz(Math.min(1, fu + .02));
    const rot = fu > 0 ? Math.atan2(y2 - y, x2 - x) * .8 : -.02;
    if (fu > 0) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(bz(fu * i / 40)); const fa = .55 * (1 - prog(t, T.fly[1], T.fly[1] + .6)); if (fa > 0) inkLine(pts, { t, seed: 512, w: 4, h: .06, alpha: fa, gaps: false, dbl: false }); }
    if (fu < 1) drawSp(A.fold[st], x, y, { h: .065, lift: .5 + lu * .2, rot, elev: 10 });
  }
  drawInk(A.send, cx - 90, cy + 130, { t, p: prog(t, T.send[0], T.send[1]), h: .045, rot: -.02, seed: 9 });
  drawInk(A.send2, cx + 30, cy + 250, { t, p: prog(t, T.send2[0], T.send2[1]), h: .045, rot: -.01, seed: 10 });
  drawInk(A.send3, cx, cy + 390, { t, p: prog(t, T.send3[0], T.send3[1]), h: .05, rot: -.02, seed: 11 });
  const pi = drop(t, T.pinned);
  if (pi) drawSp(A.pinned, cx, cy + 600 - pi.lift * 50, { h: .05, lift: pi.lift, rot: .015, elev: 8 });
}

function mark(t) {
  const tq = step12(t), [cx, cy] = P6;
  const su = slide(t, T.mark[0], T.mark[1] - T.mark[0], eIO);
  ctx.save(); layer(.02); ctx.beginPath(); ctx.rect(cx - 220, cy - 520, 440, 302); ctx.clip();
  drawSp(A.bigSun, cx, cy - 300 + 160 * (1 - su), { h: .02, elev: 4 }); ctx.restore();
  inkLine(seg([cx - 330, cy - 222], [cx + 330, cy - 222], 9), { t, seed: 600, w: 6, p: prog(t, T.mark[0], T.mark[0] + .4), h: .022 });
  inkLine(wavy(cx - 220, cx + 220, cy - 186, 5, .05, 1), { t, seed: 601, w: 5, p: prog(t, T.mark[0] + .3, T.mark[0] + .6), h: .022, color: PAL.deep });
  inkLine(wavy(cx - 130, cx + 130, cy - 154, 5, .05, 3), { t, seed: 602, w: 5, p: prog(t, T.mark[0] + .45, T.mark[0] + .75), h: .022, color: PAL.deep });
  word(A.havn, cx, cy + 20, t, T.havn, { h: .04, seed: 111 });
  if (tq >= T.tag) { const u = slide(t, T.tag, .22); drawSp(A.tag, cx - (1 - u) * 1000, cy + 200, { h: .045, lift: (1 - u) * .4, rot: -.015, elev: 7 }); }
  const li = drop(t, T.link);
  if (li) drawSp(A.link, cx, cy + 340 - li.lift * 50, { h: .05, lift: li.lift, rot: .02, elev: 8 });
}

function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500 && Math.abs(d.x - CAM.x) < 1100) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (dist(PH) < 2400) { phone(t); scraps(t); sheet(t); }
  if (dist(P2) < 2000 && t > 15) askAgain(t);
  if (dist(P3) < 2000 && t > 18) { face(t); faceTexts(t); }
  if (dist(P4) < 2000 && t > 21.5) havnCard(t);
  if (dist(P5) < 2000 && t > 24.5) copyLink(t);
  if (dist(P6) < 2000 && t > 31.5) mark(t);
  // night at the start: a cool dim that lifts once the truth is said out loud
  const dim = .2 * (1 - sstep(prog(t, 12.6, 16.4)));
  if (dim > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(120,140,175,${dim * 2.2})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
}

/* ---------- sound cues ---------- */
function slaps(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('slap', t0 + j * stagger + 2 / 12, { g })); }
function buildCues() {
  MSG.forEach(m => { cue(m.from === 'in' ? 'incoming' : 'sent', m.t); if (m.dots) cue('dots', m.dots, { d: m.t - m.dots }); });
  ROUNDS.forEach((r, i) => {
    cue('pen', r.type[0], { d: r.type[1] - r.type[0] });
    cue('scratch', r.erase[0], { d: r.erase[1] - r.erase[0] });
    cue('tear', r.peel, { i });
    cue('drift', r.peel + .1, { d: 1.0 });
    for (let k = 0; k < r.lie.length; k++) cue('key', r.lieT[0] + (r.lieT[1] - r.lieT[0]) * k / r.lie.length, { k });
  });
  cue('swell', 11.3, { d: 1.6 });
  EXTRA.forEach((_, i) => cue('tap', T.extras + i * .09 + 2 / 12, { i }));
  cue('thud', T.sheet + 2 / 12);
  cue('pen', T.inogda[0], { d: .4, g: .7 }); cue('pen', T.vseNorm[0], { d: .75 }); cue('pen', T.znachit[0], { d: .35, g: .7 });
  slaps(A.zamet, T.zamet, 1 / 24, .7); slaps(A.menya, T.menya, 1 / 24, .7); cue('chime', T.menya + .2, { hi: 0 }); cue('rustle', T.zamet + .1, { d: 1.3 });
  cue('whoosh', 15.95, { d: .55 });
  cue('pen', T.esli[0], { d: .75 }); slaps(A.sprosi, T.sprosi, 1 / 24, .6); slaps(A.eshe, T.eshe, 1 / 24, .6); cue('slide', T.ask, { d: .25 }); cue('incoming', T.dots, { soft: 1 });
  cue('whoosh', 19.2, { d: .55 });
  cue('pen', T.aEsli[0], { d: .75 }); cue('peel', T.maskOff - .2, { d: .3 }); cue('whoosh', T.maskOff, { d: .5, g: .7 }); cue('chime', T.maskOff + .05, { hi: 1 });
  cue('pen', T.zdes[0], { d: .4 }); cue('slide', T.nePr, { d: .22 });
  cue('whoosh', 22.6, { d: .55 });
  cue('slide', T.card, { d: .25 }); cue('chime', T.sun[1] - .2, { hi: 2 }); slaps(A.logo, T.logo, 1 / 12, .5);
  T.rows.forEach(t => { cue('tap', t - .1 + 2 / 12, { i: 3 }); cue('pen', t, { d: .4, g: .5 }); });
  cue('stamp', T.stamp); cue('stamp', T.stamp2);
  cue('whoosh', 25.9, { d: .55 });
  slaps(A.kop, T.kop, 1 / 24, .65); cue('pen', T.ssyl[0], { d: .4 }); cue('slap', T.plate + 2 / 12, { g: 1 });
  cue('slide', T.finger[0], { d: .3, g: .6 }); cue('press', T.finger[1]); cue('pen', T.ring[0], { d: .6, g: .6 }); cue('copy', T.copied);
  cue('peel', T.strip, { d: .25 }); cue('fold', T.fold); cue('fold', T.fold + 2 / 12); cue('plane', T.fly[0], { d: 1.0 });
  cue('pen', T.send[0], { d: .45 }); cue('pen', T.send2[0], { d: .5 }); cue('pen', T.send3[0], { d: .55 }); cue('slap', T.pinned + 2 / 12, { g: .6 });
  cue('whoosh', 32.8, { d: .55 });
  cue('chime', T.mark[1] - .2, { hi: 3 }); slaps(A.havn, T.havn, 1 / 12, .5); cue('slide', T.tag, { d: .22 }); cue('slap', T.link + 2 / 12, { g: .5 });
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
