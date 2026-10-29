/* HAVN · часть 1 из 3 — «Когда накрывает». 21.5 s.
   A grey person with a storm of ink scribbles round their head → square
   breathing («Подышим вместе») → grounding 5-4-3-2-1 («Вернуться в комнату»)
   → a worry written on paper rises and melts («Отдайте тревогу небу») →
   calm, and «продолжение: часть 2». */
'use strict';

const DUR = 21.5;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae', calm: '#d6ebf7' });
const CAMK = [
  [0.00, 540, 1000, 1.35, -0.6],
  [3.30, 540, 1010, 1.42, 0.5],
  [4.20, 540, 2800, 1.00, -0.4],
  [9.80, 540, 2820, 1.03, 0.4],
  [10.70, 540, 4650, 1.00, -0.4],
  [14.40, 540, 4670, 1.03, 0.3],
  [15.30, 540, 6550, 1.00, -0.3],
  [18.30, 540, 6570, 1.03, 0.3],
  [19.20, 540, 8600, 0.95, -0.3],
  [21.50, 540, 8610, 1.00, 0.0]
];
const T = {
  tag: 0.2, nakr: [0.5, 1.6], navs: [1.7, 2.8], tear: 1.2,
  pod: 4.1, vm: 4.45, sq: [4.5, 5.1], cyc: 5.1, side: 1.1, cap: [5.5, 6.6],
  ver: 10.6, vk: 10.95, rows: [11.3, 11.8, 12.3, 12.8, 13.3], zdes: [13.75, 14.3],
  otd: 15.2, trev: 15.5, nebu: [15.85, 16.3], note: 15.7, noteW: [16.0, 16.6], rise: [16.8, 18.3], nichego: [17.3, 18.2],
  end: 19.1, lit: 19.4
};
const SQ = { x: 540, y: 2880, r: 260 };
const PERSON = [540, 1500], END = [540, 8400];

function buildAssets() {
  buildCommon();
  A.tag = partTag(1);
  A.nakr = inkText('когда тревога накрывает,', 56, PAL.ink, { seed: 1 });
  A.navs = inkText('кажется, что это навсегда', 56, PAL.ink, { seed: 2 });

  A.pod = cutWord('ПОДЫШИМ', 110, PAL.orange, { seed: 3 });
  A.vm = cutWord('ВМЕСТЕ', 110, PAL.orange, { seed: 4 });
  A.lbl = ['вдох', 'задержка', 'выдох', 'задержка'].map((s, i) => inkText(s, 60, PAL.ink, { seed: 5 + i }));
  A.digits = ['1', '2', '3', '4'].map((d, i) => cutWord(d, 150, PAL.deep, { seed: 10 + i }).letters[0].sp);
  A.bubble = card(280, 280, { seed: 14, color: PAL.calm, shape: ell(220, 220, 50), tex: .5 });
  A.cap = inkText('по четыре счёта', 66, PAL.ink, { seed: 15 });

  A.ver = cutWord('ВЕРНУТЬСЯ', 116, PAL.orange, { seed: 16 });
  A.vk = cutWord('В КОМНАТУ', 116, PAL.orange, { seed: 17 });
  A.rowN = ['5', '4', '3', '2', '1'].map((d, i) => cutWord(d, 110, PAL.deep, { seed: 18 + i }).letters[0].sp);
  A.rowT = ['вещей, которые видите', 'можно потрогать', 'звука, которые слышите', 'запаха', 'вкус'].map((s, i) => inkText(s, 62, PAL.ink, { seed: 23 + i }));
  A.zdes = inkText('вы здесь, прямо сейчас', 74, PAL.orange, { seed: 28 });

  A.otd = cutWord('ОТДАЙТЕ', 132, PAL.orange, { seed: 29 });
  A.trev = cutWord('ТРЕВОГУ', 132, PAL.orange, { seed: 30 });
  A.nebu = inkText('небу', 130, PAL.deep, { seed: 31 });
  A.note = card(560, 150, { seed: 32, color: '#fffdf7', torn: true });
  A.noteT = inkText('не могу успокоиться', 64, PAL.ink, { seed: 33 });
  A.nichego = inkText('ничего не сохраняется и никуда не уходит', 46, PAL.ink, { seed: 34 });

  A.prod = inkText('продолжение —', 70, PAL.ink, { seed: 35 });
  A.next = label('часть 2: когда сил нет →', 'italic 600 72px Corm', { seed: 36, h: 112, dy: -4 });
}

/* ---------- scenes ---------- */
function hook(t) {
  soft(A.tag, CX, 400, t, T.tag, { sp: { h: .04 } });
  inkIn(A.nakr, CX, 530, t, T.nakr, { rot: -.02, seed: 1 });
  inkIn(A.navs, CX, 640, t, T.navs, { rot: .01, seed: 2 });
  const { hy } = drawPerson(PERSON[0], PERSON[1], 1.5, null, 1, t, 100, { tear: T.tear, noCloud: true });
  // a storm of scribbles circling the head
  for (let k = 0; k < 3; k++) {
    const R = 150 + k * 40, a0 = t * (.6 + k * .25) * (k % 2 ? -1 : 1);
    const pts = smooth(scribble(0, 0, R, R * .55, 18, 60 + k), 4).map(([px, py]) => [PERSON[0] + px * Math.cos(a0) - py * Math.sin(a0), hy - 20 + px * Math.sin(a0) * .5 + py * Math.cos(a0) * .6]);
    inkLine(pts, { t, seed: 70 + k, w: 3, h: .02, alpha: .42 - k * .08, color: k === 1 ? PAL.deep : PAL.ink, gaps: false, dbl: false, amp: 2 });
  }
}

// square breathing: a dot walks the square, the blue circle fills on the inhale and empties on the exhale
function breathe(t) {
  floatWord(A.pod, CX, 2200, t, T.pod, { seed: 3 });
  floatWord(A.vm, CX, 2350, t, T.vm, { seed: 4 });
  const { x, y, r } = SQ, C = [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]];
  if (t > T.sq[0]) inkLine(closedSq(C), { t, seed: 80, w: 6, h: .03, p: eSine(prog(t, T.sq[0], T.sq[1])), gaps: false, amp: 1.2 });
  const lp = [[x, y - r - 55, 0], [x + r + 55, y, Math.PI / 2], [x, y + r + 58, 0], [x - r - 55, y, -Math.PI / 2]];
  const c = t - T.cyc, side = c >= 0 ? Math.floor(c / T.side) % 4 : -1, u = c >= 0 ? (c % T.side) / T.side : 0;
  A.lbl.forEach((it, i) => {
    const on = c >= 0 && side === i ? 1 : .35, ap = eOut(prog(t, T.sq[0] + i * .12, T.sq[0] + .4 + i * .12));
    drawInk(it, lp[i][0], lp[i][1], { t, h: .035, rot: lp[i][2], seed: 6 + i, alpha: ap * on });
  });
  let fill = .45;
  if (c >= 0) { const s0 = side, u0 = eSine(u); fill = s0 === 0 ? lerp(.45, 1, u0) : s0 === 1 ? 1 : s0 === 2 ? lerp(1, .45, u0) : .45; }
  const ba = eOut(prog(t, T.sq[1] - .2, T.sq[1] + .4));
  if (ba > 0) drawSp(A.bubble, x, y, { h: .032, sc: fill * 1.4, alpha: ba * .9, elev: 3 });
  if (c >= 0) {
    const a = C[side], b = C[(side + 1) % 4], ue = eSine(u);
    const px = lerp(a[0], b[0], ue), py = lerp(a[1], b[1], ue);
    drawSp(A.sun, px, py, { h: .04, sc: .32, elev: 4 });
    glow(px, py, 90, 'rgba(255,190,120,A)', .6, .039);
    const dg = Math.min(3, Math.floor(u * 4)), da = Math.sin(Math.PI * clamp((u * 4) % 1 * 1.15));
    drawSp(A.digits[dg], x, y, { h: .036, alpha: .25 + .75 * da, sc: .9 + .1 * da, shadow: false });
  }
  inkIn(A.cap, CX, 3330, t, T.cap, { rot: -.02, seed: 15 });
}
function closedSq(C) { return chain(C[0], C[1], C[2], C[3], C[0]); }

// grounding 5-4-3-2-1: digits count down, each with what to notice
function ground(t) {
  floatWord(A.ver, CX, 4080, t, T.ver, { seed: 16 });
  floatWord(A.vk, CX, 4225, t, T.vk, { seed: 17 });
  T.rows.forEach((r, i) => {
    const y = 4440 + i * 132, d = drop(t, r, .8);
    if (d) drawSp(A.rowN[i], 230, y - d.lift * 50, { h: .04, lift: d.lift, alpha: d.a, rot: (i % 2 ? .04 : -.04) });
    inkIn(A.rowT[i], 320, y + 4, t, [r + .15, r + .6], { align: 'left', seed: 23 + i });
  });
  inkIn(A.zdes, CX, 5150, t, T.zdes, { rot: -.02, seed: 28 });
  if (t > T.zdes[1]) inkLine(smooth([[CX - 330, 5215], [CX, 5232], [CX + 340, 5210]], 8), { t, seed: 90, w: 6, h: .045, p: eSine(prog(t, T.zdes[1], T.zdes[1] + .4)), color: PAL.orange, amp: 1 });
}

// a worry on paper rises, shrinks and melts into the air
function worry(t) {
  floatWord(A.otd, CX, 6000, t, T.otd, { seed: 29 });
  floatWord(A.trev, CX, 6150, t, T.trev, { seed: 30 });
  inkIn(A.nebu, CX, 6300, t, T.nebu, { rot: -.03, seed: 31 });
  const u = eIO(prog(t, T.rise[0], T.rise[1])), a = 1 - eSine(prog(t, T.rise[0] + .4, T.rise[1] - .2));
  if (t > T.note && a > 0) {
    const d = drop(t, T.note, .8), x = CX + Math.sin(u * 5) * 40 * u, y = 6720 - u * 300 - (d ? d.lift * 50 : 0), sc = 1 - .45 * u, rot = -.03 + u * .2;
    drawSp(A.note, x, y, { h: .04 + u * .03, lift: (d ? d.lift : 0) + u * .4, alpha: (d ? d.a : 0) * a, sc, rot, elev: 8 });
    drawInk(A.noteT, x, y - 4, { t, p: eSine(prog(t, T.noteW[0], T.noteW[1])), h: .042 + u * .03, sc, rot, seed: 33, alpha: a });
    for (let k = 0; k < 10; k++) {                 // little specks lifting off as it melts
      const ph = prog(t, T.rise[0] + .3 + k * .08, T.rise[0] + 1.3 + k * .08);
      if (ph > 0 && ph < 1) { layer(.06); ctx.fillStyle = `rgba(24,41,59,${(.5 * Math.sin(ph * Math.PI)).toFixed(3)})`; ctx.beginPath(); ctx.arc(x + (h2(k, 3) - .5) * 360, y - ph * 260 - h2(k, 5) * 60, 4 + h2(k, 7) * 4, 0, 7); ctx.fill(); }
    }
  }
  inkIn(A.nichego, CX, 6980, t, T.nichego, { seed: 34 });
}

function ending(t) {
  endCard(t, END[1], T.end, true, 35);
  drawPerson(CX, 9080, 1.3, T.lit, 1, t, 140, { noCloud: true });
}

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (t < 4.6) hook(t);
  if (t > 3.0 && t < 11.0) breathe(t);
  if (t > 9.4 && t < 15.6) ground(t);
  if (t > 14.0 && t < 19.6) worry(t);
  if (t > 18.2) ending(t);
  // a dusky tint while it is hard, lifting at the first breath
  const dim = 1 - eIO(prog(t, 3.4, 5.2));
  if (dim > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(150,160,190,${(dim * .5).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
}

/* ---------- sound cues ---------- */
function brushes(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('tap', t0 + j * stagger + .3, { i: j, g })); }
function buildCues() {
  cue('storm', 0, { d: 4.0 }); cue('slide', T.tag, { d: .8, g: .3 });
  cue('pen', T.nakr[0], { d: 1.1, g: .5 }); cue('pen', T.navs[0], { d: 1.1, g: .5 });
  cue('whoosh', 3.3, { d: .9, g: .5 });
  brushes(A.pod, T.pod, .06, .35); brushes(A.vm, T.vm, .06, .35); cue('pen', T.sq[0], { d: .6, g: .4 });
  for (let k = 0; k < 5; k++) { const s0 = T.cyc + k * T.side; if (k % 4 === 0) cue('inhale', s0, { d: T.side }); if (k % 4 === 2) cue('exhale', s0, { d: T.side }); cue('chime', s0, { hi: k % 4 }); }
  cue('pen', T.cap[0], { d: 1.0, g: .45 });
  cue('whoosh', 9.8, { d: .9, g: .5 });
  brushes(A.ver, T.ver, .05, .35); brushes(A.vk, T.vk, .05, .35);
  T.rows.forEach((r, i) => { cue('sun', r + .2, { i: 4 - i }); cue('pen', r + .15, { d: .45, g: .4 }); });
  cue('pen', T.zdes[0], { d: .55, g: .5 });
  cue('whoosh', 14.4, { d: .9, g: .5 });
  brushes(A.otd, T.otd, .06, .35); brushes(A.trev, T.trev, .06, .35); cue('pen', T.nebu[0], { d: .45, g: .5 });
  cue('slide', T.note, { d: .7, g: .35 }); cue('pen', T.noteW[0], { d: .6, g: .5 }); cue('rise', T.rise[0], { d: 1.6 }); cue('pen', T.nichego[0], { d: .9, g: .4 });
  cue('whoosh', 18.3, { d: .9, g: .5 });
  cue('slide', T.end, { d: .9, g: .35 }); cue('sun', T.lit + .3, { i: 7 }); cue('pen', T.end + .4, { d: .5, g: .45 }); cue('slide', T.end + .8, { d: .9, g: .35 });
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
