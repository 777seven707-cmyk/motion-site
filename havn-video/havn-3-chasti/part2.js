/* HAVN · часть 2 из 3 — «Когда сил нет». 20 s.
   A grey person with a battery at one red bar → «Маленькие шаги»: how much
   strength now? «Почти нет» → one small task at a time, «Сделано», «Это
   считается.», the battery fills → «Маленькие хорошие вещи» written into a
   notebook → «продолжение: часть 3». */
'use strict';

const DUR = 20.0;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae', red: '#e0473c', green: '#7fb6a4' });
const CAMK = [
  [0.00, 540, 1000, 1.35, -0.6],
  [3.40, 540, 1010, 1.42, 0.5],
  [4.30, 540, 2850, 1.00, -0.4],
  [11.00, 540, 2870, 1.03, 0.4],
  [11.90, 540, 4700, 1.00, -0.4],
  [15.80, 540, 4720, 1.03, 0.3],
  [16.70, 540, 6600, 0.95, -0.3],
  [20.00, 540, 6610, 1.00, 0.0]
];
const T = {
  tag: 0.2, silNet: [0.5, 1.5], vstat: [1.6, 2.8],
  mal: 4.3, shagi: 4.6, q: 4.9, fIn: 5.2, tap0: 5.75, task: 6.15, done: [7.15, 8.95, 10.45], swap: [8.0, 9.6], label: 7.35, fOut: 10.75,
  mal2: 11.95, hor: 12.25, veschi: [12.6, 13.0], book: 12.7, notes: [13.2, 13.9, 14.6], local: [15.1, 15.9],
  end: 16.7, lit: 17.0
};
const TASKS = ['Выпить стакан воды.', 'Открыть окно на минуту.', 'Умыться прохладной водой.'];
const PERSON = [540, 1500], BAT = [540, 2410], QY = 2640, TY = 3010, END = [540, 6400];

function buildAssets() {
  buildCommon();
  A.tag = partTag(2);
  A.silNet = inkText('когда сил нет совсем,', 60, PAL.ink, { seed: 1 });
  A.vstat = inkText('даже встать — уже много', 60, PAL.ink, { seed: 2 });
  A.batBody = card(210, 104, { seed: 3, color: '#fffdf7', shape: rrect(0, 0, 210, 104, 18), tex: .5 });
  A.bars = [PAL.red, PAL.orange, PAL.orange, PAL.green].map((c, i) => card(36, 66, { seed: 4 + i, color: c, shape: rrect(0, 0, 36, 66, 8), tex: .5 }));
  A.barsGreen = [0, 1, 2, 3].map(i => card(36, 66, { seed: 8 + i, color: PAL.green, shape: rrect(0, 0, 36, 66, 8), tex: .5 }));

  A.mal = cutWord('МАЛЕНЬКИЕ', 100, PAL.orange, { seed: 12 });
  A.shagi = cutWord('ШАГИ', 112, PAL.orange, { seed: 13 });
  A.qCard = card(880, 300, { seed: 14, color: '#fffdf7', shape: rrect(0, 0, 880, 300, 40), tex: .6, content: printed('Сколько сейчас сил?', '600 50px Inter', PAL.ink, -60) });
  A.levels = ['Почти нет', 'Немного', 'Есть'].map((s, i) => pill(s, i === 0 ? '#fff1d8' : PAL.ice, PAL.ink, 15 + i, 38));
  A.tCard = card(880, 290, { seed: 18, color: '#fffdf7', shape: rrect(0, 0, 880, 290, 40), tex: .6 });
  A.tasks = TASKS.map((s, i) => inkText(s, 64, PAL.ink, { seed: 19 + i }));
  A.sdel = pill('Сделано', PAL.deep, '#ffffff', 22, 40);
  A.drug = pill('Другое', PAL.grey, PAL.ink, 23, 40);
  A.schit = label('Это считается.', 'italic 600 96px Corm', { seed: 24, h: 140, dy: -5 });

  A.mal2 = cutWord('МАЛЕНЬКИЕ', 100, PAL.orange, { seed: 25 });
  A.hor = cutWord('ХОРОШИЕ', 112, PAL.orange, { seed: 26 });
  A.veschi = inkText('вещи', 120, PAL.deep, { seed: 27 });
  A.book = card(760, 520, { seed: 28, color: '#fffdf7', tex: .7, content: (x, cx, cy) => {
    x.strokeStyle = 'rgba(156,199,227,.8)'; x.lineWidth = 3;
    for (let k = -2; k <= 3; k++) { x.beginPath(); x.moveTo(cx - 380, cy + k * 96 - 20); x.lineTo(cx + 380, cy + k * 96 - 20); x.stroke(); }
    x.strokeStyle = 'rgba(233,163,160,.9)'; x.beginPath(); x.moveTo(cx - 300, cy - 260); x.lineTo(cx - 300, cy + 260); x.stroke();
  } });
  A.notes = ['тёплый чай', 'сообщение от друга', 'солнце в окне'].map((s, i) => inkText(s, 70, PAL.ink, { seed: 29 + i }));
  A.local = inkText('это остаётся только на вашем устройстве', 46, PAL.ink, { seed: 32 });

  A.prod = inkText('продолжение —', 70, PAL.ink, { seed: 33 });
  A.next = label('часть 3: когда одиноко →', 'italic 600 72px Corm', { seed: 34, h: 112, dy: -4 });
}

/* a paper battery; n bars are lit, the newest one fading in */
function battery(x, y, t, level, o = {}) {
  drawSp(A.batBody, x, y, { h: o.h || .03, elev: 4, sc: o.sc || 1 });
  const s = o.sc || 1, L = { t, h: (o.h || .03) + .002, gaps: false, dbl: false, amp: .8 };
  inkLine(closed2(rrect(x - 105 * s, y - 52 * s, 210 * s, 104 * s, 18 * s)), Object.assign({ seed: 600, w: 5 * s }, L));
  inkLine(seg([x + 116 * s, y - 20 * s], [x + 116 * s, y + 20 * s], 4), Object.assign({ seed: 601, w: 10 * s }, L));
  const full = level >= 4;
  for (let i = 0; i < 4; i++) {
    const a = clamp(level - i); if (a <= 0) continue;
    const blink = o.blink && i === 0 ? .55 + .45 * Math.sin(t * 5) : 1;
    drawSp((full ? A.barsGreen : A.bars)[i], x - 69 * s + i * 46 * s, y, { h: (o.h || .03) + .003, sc: s, alpha: a * blink, shadow: false });
  }
}
function closed2(pts) { let r = []; const c = pts.concat([pts[0]]); for (let i = 0; i < c.length - 1; i++) r = r.concat(seg(c[i], c[i + 1], 8).slice(i ? 1 : 0)); return r; }

/* ---------- scenes ---------- */
function hook(t) {
  soft(A.tag, CX, 400, t, T.tag, { sp: { h: .04 } });
  inkIn(A.silNet, CX, 530, t, T.silNet, { rot: -.02, seed: 1 });
  inkIn(A.vstat, CX, 640, t, T.vstat, { rot: .01, seed: 2 });
  const { hy } = drawPerson(PERSON[0], PERSON[1], 1.5, null, 1, t, 100, { noCloud: true });
  battery(PERSON[0], hy - 190 + Math.sin(t * 1.1) * 4, t, 1, { blink: true, h: .02 });
}

function steps(t) {
  floatWord(A.mal, CX, 2080, t, T.mal, { seed: 12, stagger: .05 });
  floatWord(A.shagi, CX, 2215, t, T.shagi, { seed: 13 });
  const level = 1 + T.done.reduce((n, d) => n + eOut(prog(t, d + .1, d + .5)), 0);
  if (t > T.q - .5) battery(BAT[0], BAT[1] - 10, t, level, { h: .045, sc: .8 });
  const qd = soft(A.qCard, CX, QY, t, T.q, { sp: { h: .03 } });
  const LX = [CX - 270, CX + 20, CX + 280];
  if (qd) A.levels.forEach((sp, i) => drawSp(sp, LX[i], QY + 50 - qd.lift * 60, { h: .033, alpha: qd.a, elev: 3 }));
  if (t > T.tap0) inkLine(arc(LX[0], QY + 50, 150, 62, -Math.PI / 2, Math.PI * 1.5, 50), { t, seed: 610, w: 6, h: .036, p: eOut(prog(t, T.tap0, T.tap0 + .35)), color: PAL.orange, gaps: false, amp: 1 });
  const td = soft(A.tCard, CX, TY, t, T.task, { dx: 300, sp: { h: .03 } });
  if (td) {
    const ty = TY - 40 - td.lift * 60;
    TASKS.forEach((_, i) => {
      const a = i === 0 ? 1 - eIO(prog(t, T.swap[0], T.swap[0] + .45)) : eIO(prog(t, T.swap[i - 1] + .1, T.swap[i - 1] + .55)) * (i === 2 ? 1 : 1 - eIO(prog(t, T.swap[1], T.swap[1] + .45)));
      if (a > 0) drawInk(A.tasks[i], CX - 330, ty, { t, h: .034, align: 'left', seed: 19 + i, alpha: a * td.a });
      if (a > .5 && t > T.done[i]) check(CX - 380, ty + 4, t, T.done[i] + .05, 620 + i, .9);
    });
    drawSp(A.drug, CX + 70, TY + 80 - td.lift * 60, { h: .033, alpha: td.a, elev: 3 });
    const pr = T.done.reduce((m, d) => m + Math.sin(Math.PI * prog(t, d - .1, d + .2)), 0);
    drawSp(A.sdel, CX + 300, TY + 80 - td.lift * 60, { h: .033, alpha: td.a, elev: 3, sc: 1 - .06 * pr });
  }
  if (t > T.label) { const u = eIO(prog(t, T.label, T.label + .8)); drawSp(A.schit, CX - 40 - (1 - u) * 260, TY + 290, { h: .045, lift: (1 - u) * .3, rot: -.02, elev: 7, alpha: u }); }
  finger(t, [[T.fIn, LX[0], QY + 50], [T.tap0 + .25, LX[0], QY + 50], [T.done[0] - .35, CX + 300, TY + 80]], [T.tap0, ...T.done], T.fIn, T.fOut);
}

function goodThings(t) {
  floatWord(A.mal2, CX, 3990, t, T.mal2, { seed: 25, stagger: .05 });
  floatWord(A.hor, CX, 4125, t, T.hor, { seed: 26 });
  inkIn(A.veschi, CX, 4270, t, T.veschi, { rot: -.03, seed: 27 });
  const bd = soft(A.book, CX, 4700, t, T.book, { sp: { h: .03, rot: .015 } });
  if (bd) T.notes.forEach((n, i) => {
    const y = 4700 - 162 + i * 96 - bd.lift * 60;
    inkIn(A.notes[i], CX - 250, y, t, [n, n + .55], { align: 'left', seed: 29 + i, h: .033 });
    if (t > n + .55) { const u = eOut(prog(t, n + .55, n + .85)); drawSp(A.sun, CX - 300 + 0, y + 2, { h: .034, sc: .17 * u, alpha: u, shadow: false }); }
  });
  inkIn(A.local, CX, 5110, t, T.local, { seed: 32 });
}

function ending(t) {
  endCard(t, END[1], T.end, true, 33);
  const { hy, k } = drawPerson(CX, 7080, 1.3, T.lit, 1, t, 140, { noCloud: true, noSun: true });
  battery(CX, hy - 150, t, 4, { h: .02, sc: .8 });
}

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (t < 4.6) hook(t);
  if (t > 3.0 && t < 12.2) steps(t);
  if (t > 10.6 && t < 17.0) goodThings(t);
  if (t > 15.4) ending(t);
  const dim = 1 - eIO(prog(t, 3.4, 5.2));
  if (dim > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(150,160,190,${(dim * .5).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
}

/* ---------- sound cues ---------- */
function brushes(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('tap', t0 + j * stagger + .3, { i: j, g })); }
function buildCues() {
  cue('lowbat', 0.3, { n: 3 }); cue('slide', T.tag, { d: .8, g: .3 });
  cue('pen', T.silNet[0], { d: 1.0, g: .5 }); cue('pen', T.vstat[0], { d: 1.2, g: .5 });
  cue('whoosh', 3.4, { d: .9, g: .5 });
  brushes(A.mal, T.mal, .05, .35); brushes(A.shagi, T.shagi, .06, .35); cue('slide', T.q, { d: .9, g: .35 });
  cue('slide', T.fIn, { d: .4, g: .35 }); cue('press', T.tap0); cue('slide', T.task, { d: .9, g: .35 });
  T.done.forEach((d, i) => { cue('press', d); cue('sun', d + .15, { i: 2 + i * 2 }); });
  T.swap.forEach(s => cue('slide', s, { d: .5, g: .3 })); cue('slide', T.label, { d: .8, g: .35 });
  cue('whoosh', 11.0, { d: .9, g: .5 });
  brushes(A.mal2, T.mal2, .05, .35); brushes(A.hor, T.hor, .06, .35); cue('pen', T.veschi[0], { d: .4, g: .5 }); cue('slide', T.book, { d: .9, g: .35 });
  T.notes.forEach((n, i) => { cue('pen', n, { d: .55, g: .5 }); cue('sun', n + .6, { i: 6 + i }); });
  cue('pen', T.local[0], { d: .8, g: .4 });
  cue('whoosh', 15.8, { d: .9, g: .5 });
  cue('slide', T.end, { d: .9, g: .35 }); cue('chime', T.lit + .3, { hi: 2 }); cue('pen', T.end + .4, { d: .5, g: .45 }); cue('slide', T.end + .8, { d: .9, g: .35 });
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
