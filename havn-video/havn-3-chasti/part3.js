/* HAVN · часть 3 из 3 — «Когда одиноко». 24.5 s.
   A grey person, a phone with no new messages → «Немного компании»: pick a
   cat, throw it a toy, it comes, a heart, the person lights up → «Когда дело
   в людях»: the three guides and «Мне плохо прямо сейчас» on every page →
   help us: share this video (поделиться → копировать ссылку) → HAVN,
   two people holding hands. */
'use strict';

const DUR = 24.5;
Object.assign(PAL, { lonely: '#c4c5c1', skin: '#f1cfae', phone: '#22313f', red: '#e0473c', cat: '#e3a35b' });
const CAMK = [
  [0.00, 540, 1000, 1.35, -0.6],
  [3.50, 540, 1010, 1.42, 0.5],
  [4.40, 540, 2850, 1.00, -0.4],
  [10.60, 540, 2870, 1.03, 0.4],
  [11.50, 540, 4700, 1.00, -0.4],
  [15.90, 540, 4720, 1.03, 0.3],
  [16.80, 540, 6600, 0.97, -0.3],
  [21.40, 540, 6620, 1.00, 0.4],
  [22.30, 540, 8500, 0.97, -0.3],
  [24.50, 540, 8510, 1.02, 0.0]
];
const T = {
  tag: 0.2, odin: [0.5, 1.4], neskem: [1.5, 2.7], tear: 1.3,
  nem: 4.4, komp: 4.7, chips: 5.1, fIn: 5.3, tapCat: 5.8, cat: 6.0, throw: [6.55, 7.3], fOut: 6.8, hop: [7.3, 8.0], heart: 8.1, lit: 8.35, kaz: [8.6, 9.7],
  kogda: 11.5, vlyud: 11.8, guides: [12.3, 12.7, 13.1], crisis: 13.7, kazhd: [14.2, 15.1],
  pomog: [16.9, 17.4], otpr: 17.45, video: [17.9, 18.6], share: 17.2, fIn2: 18.45, tap1: 18.85, sheet: [18.95, 19.35], move: [19.2, 19.5], tap2: 19.6, copied: 19.7, fOut2: 19.85, strip: 20.0, fold: 20.2, fly: [20.45, 21.5],
  end: 22.3, pair: 22.5, hands: [23.0, 23.6], profile: [23.1, 23.9], note: [23.6, 24.3]
};
const PERSON = [430, 1500], PHONE = [800, 1360], CAT = [600, 3020], PAL_P = [250, 3160];

function buildAssets() {
  buildCommon();
  A.tag = partTag(3);
  A.odin = inkText('когда одиноко', 64, PAL.ink, { seed: 1 });
  A.neskem = inkText('и не с кем поговорить', 64, PAL.ink, { seed: 2 });
  A.phone = card(200, 350, { seed: 3, color: PAL.phone, shape: rrect(0, 0, 200, 350, 30), tex: .8 });
  A.screen = card(176, 318, { seed: 4, color: '#eef3f6', shape: rrect(0, 0, 176, 318, 22), tex: .5, content: (x, cx, cy) => {
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(24,41,59,.55)';
    x.font = '600 20px Inter'; x.fillText('23:47', cx, cy - 128);
    x.font = '600 23px Inter'; x.fillText('нет новых', cx, cy - 10); x.fillText('сообщений', cx, cy + 20);
  } });

  A.nem = cutWord('НЕМНОГО', 100, PAL.orange, { seed: 5 });
  A.komp = cutWord('КОМПАНИИ', 100, PAL.orange, { seed: 6 });
  A.chips = ['Кот', 'Пёс', 'Птица'].map((s, i) => pill(s, i ? PAL.ice : '#fff1d8', PAL.ink, 7 + i, 40));
  A.catBody = card(230, 150, { seed: 10, color: PAL.cat, shape: ell(230, 150, 40), tex: .7 });
  A.catHead = card(140, 128, { seed: 11, color: PAL.cat, shape: ell(140, 128, 40).concat([]), tex: .7 });
  A.ear = card(54, 60, { seed: 12, color: PAL.cat, shape: [[0, 60], [20, 0], [54, 60]], tex: .7 });
  A.ball = card(64, 64, { seed: 13, color: PAL.red, shape: ell(64, 64, 30), tex: .6 });
  A.kaz = inkText('бросьте игрушку, угостите, погладьте', 52, PAL.ink, { seed: 14 });

  A.kogda = cutWord('КОГДА ДЕЛО', 100, PAL.orange, { seed: 15 });
  A.vlyud = cutWord('В ЛЮДЯХ', 100, PAL.orange, { seed: 16 });
  A.guides = ['Как попросить о помощи', 'Как поддержать другого', 'Как найти специалиста'].map((s, i) => card(820, 120, { seed: 17 + i, color: '#fffdf7', shape: rrect(0, 0, 820, 120, 30), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = [PAL.orange, PAL.deep, '#7fb6a4'][i]; x.beginPath(); x.arc(cx - 350, cy, 16, 0, 7); x.fill();
    x.font = '600 46px Inter'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = PAL.ink; x.fillText(s, cx - 310, cy + 2);
    x.font = '600 46px Inter'; x.textAlign = 'right'; x.fillStyle = 'rgba(24,41,59,.4)'; x.fillText('→', cx + 370, cy + 2);
  } }));
  const cf = '600 46px Inter', cw = textW('Мне плохо прямо сейчас', cf) + 150;
  A.crisis = card(cw, 110, { seed: 20, color: '#ffffff', shape: rrect(0, 0, cw, 110, 55), content: (x, cx, cy) => {
    x.fillStyle = PAL.red; x.beginPath(); x.arc(cx - cw / 2 + 52, cy, 14, 0, 7); x.fill();
    x.font = cf; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = PAL.ink; x.fillText('Мне плохо прямо сейчас', cx - cw / 2 + 84, cy + 2);
  } });
  A.kazhd = inkText('эта кнопка есть на каждой странице', 52, PAL.ink, { seed: 21 });

  A.pomog = inkText('помогите нам:', 76, PAL.ink, { seed: 22 });
  A.otpr = cutWord('ОТПРАВЬТЕ', 104, PAL.orange, { seed: 23 });
  A.video = inkText('это видео тому, кому одиноко', 62, PAL.ink, { seed: 24 });
  A.share = card(150, 150, { seed: 25, color: '#fffdf7', shape: ell(150, 150, 50), tex: .6, content: (x, cx, cy) => {
    x.strokeStyle = PAL.ink; x.fillStyle = PAL.ink; x.lineWidth = 11; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx - 40, cy + 34); x.quadraticCurveTo(cx - 34, cy - 14, cx + 14, cy - 14); x.stroke();
    x.beginPath(); x.moveTo(cx + 8, cy - 42); x.lineTo(cx + 46, cy - 14); x.lineTo(cx + 8, cy + 14); x.closePath(); x.fill();
  } });
  A.shareLbl = label('поделиться', '600 36px Inter', { seed: 26, h: 70, color: PAL.cream, dy: 0 });
  A.sheet = card(920, 300, { seed: 27, color: '#fffdf7', shape: rrect(0, 0, 920, 300, 44), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = 'rgba(24,41,59,.25)'; x.beginPath(); x.roundRect(cx - 50, cy - 130, 100, 10, 5); x.fill();
    x.font = '600 34px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(24,41,59,.55)'; x.fillText('поделиться', cx, cy - 86);
    x.fillStyle = PAL.deep; x.beginPath(); x.arc(cx - 300, cy + 30, 62, 0, 7); x.fill();
    chainIcon(x, cx - 300, cy + 30, 1, '#ffffff');
    x.font = '600 50px Inter'; x.textAlign = 'left'; x.fillStyle = PAL.ink; x.fillText('копировать ссылку', cx - 210, cy + 32);
  } });
  A.copied = label('ссылка скопирована', '600 46px Inter', { seed: 28, h: 104, color: '#fff4dc', torn: false, shape: rrect(0, 0, textW('ссылка скопирована', '600 46px Inter') + 150, 104, 50), dy: 0 });
  A.fold = [
    card(520, 96, { seed: 29, color: '#ffffff', content: (x, cx, cy) => { chainIcon(x, cx - 190, cy, .55, PAL.deep); printed('ссылка на видео', '600 40px Inter', PAL.deep, 2)(x, cx + 30, cy); } }),
    card(330, 120, { seed: 30, color: '#ffffff', shape: [[0, 0], [330, 50], [330, 70], [0, 120]] }),
    card(250, 110, { seed: 31, color: '#ffffff', shape: [[0, 0], [250, 62], [24, 110], [52, 66]], content: (x, cx, cy) => { x.strokeStyle = 'rgba(24,41,59,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 73, cy + 11); x.lineTo(cx + 125, cy + 7); x.stroke(); } })
  ];

  A.tagline = label('тихое место, когда тяжело', 'italic 600 72px Corm', { seed: 32, h: 112, dy: -4 });
  A.profile = inkText('ссылка на сайт — в профиле', 64, PAL.ink, { seed: 33 });
  A.note = inkText('HAVN не заменяет помощь специалиста', 40, PAL.ink, { seed: 34 });
}

/* ---------- scenes ---------- */
function hook(t) {
  soft(A.tag, CX, 400, t, T.tag, { sp: { h: .04 } });
  inkIn(A.odin, CX, 530, t, T.odin, { rot: -.02, seed: 1 });
  inkIn(A.neskem, CX, 640, t, T.neskem, { rot: .01, seed: 2 });
  drawSp(A.phone, PHONE[0], PHONE[1], { h: .008, rot: .06, elev: 5 });
  drawSp(A.screen, PHONE[0], PHONE[1], { h: .009, rot: .06, shadow: false });
  drawPerson(PERSON[0], PERSON[1], 1.5, null, 1, t, 100, { tear: T.tear });
}

function drawCat(x, y, t, happy, al = 1) {
  const bob = Math.sin(t * 3) * 3;
  drawSp(A.catBody, x, y, { h: .03, elev: 5, alpha: al });
  const tail = []; for (let i = 0; i <= 14; i++) { const u = i / 14; tail.push([x - 110 - u * 70, y - 10 - u * 90 + Math.sin(u * 3 + t * (happy ? 7 : 2.5)) * 18 * u]); }
  inkLine(tail, { t, seed: 700, w: 14, h: .029, color: '#c98a46', gaps: false, dbl: false, amp: .8, alpha: al });
  [-1, 1].forEach((s, i) => drawSp(A.ear, x + 70 + s * 36, y - 128 + bob, { h: .031, rot: s * .25, elev: 3, shadow: false, alpha: al }));
  drawSp(A.catHead, x + 70, y - 80 + bob, { h: .032, elev: 4, alpha: al });
  const L = { t, h: .034, dbl: false, gaps: false, amp: .8, alpha: al };
  [-1, 1].forEach((s, i) => happy
    ? inkLine(arc(x + 70 + s * 26, y - 88 + bob, 11, 8, Math.PI * 1.1, Math.PI * 1.9, 8), Object.assign({ seed: 701 + i, w: 5 }, L))
    : inkLine(arc(x + 70 + s * 26, y - 88 + bob, 5, 5, 0, Math.PI * 2, 8), Object.assign({ seed: 701 + i, w: 7 }, L)));
  inkLine(smooth([[x + 52, y - 62 + bob], [x + 61, y - 54 + bob], [x + 70, y - 62 + bob], [x + 79, y - 54 + bob], [x + 88, y - 62 + bob]], 3), Object.assign({ seed: 703, w: 4 }, L));
  [-1, 1].forEach((s, i) => inkLine(seg([x + 70 + s * 46, y - 70 + bob], [x + 70 + s * 92, y - 76 + bob], 6), Object.assign({ seed: 704 + i, w: 2.5 }, L)));
}

function companion(t) {
  floatWord(A.nem, CX, 2080, t, T.nem, { seed: 5 });
  floatWord(A.komp, CX, 2215, t, T.komp, { seed: 6 });
  const CH = [[CX - 200, 2420], [CX + 10, 2420], [CX + 230, 2420]];
  A.chips.forEach((sp, i) => soft(sp, CH[i][0], CH[i][1], t, T.chips + i * .12, { sp: { h: .035 } }));
  ring(CH[0][0], CH[0][1], 80, t, T.tapCat, 710);
  drawPerson(PAL_P[0], PAL_P[1], 1.0, T.lit, 3, t, 160, {});
  // the cat comes in softly, then hops to the toy
  const cd = drop(t, T.cat, 1.0);
  const hop = eIO(prog(t, T.hop[0], T.hop[1]));
  const cx = lerp(CAT[0], CAT[0] + 160, hop), cy = CAT[1] - Math.sin(hop * Math.PI) * 70;
  if (cd) drawCat(cx, cy - cd.lift * 60, t, t > T.heart, cd.a);
  // the toy: thrown from the finger in an arc
  if (t > T.throw[0]) {
    const u = eIO(prog(t, T.throw[0], T.throw[1])), bx = lerp(CH[0][0] + 40, 900, u), by = lerp(CH[0][1] + 60, 3080, u) - Math.sin(u * Math.PI) * 260;
    const bounce = t > T.throw[1] ? Math.abs(Math.sin((t - T.throw[1]) * 8)) * 26 * Math.exp(-(t - T.throw[1]) * 3) : 0;
    drawSp(A.ball, bx, by - bounce, { h: .035, lift: Math.sin(u * Math.PI) * .5, elev: 5, rot: t * 4 });
  }
  if (t > T.heart) {
    const hx = cx + 70, hy = cy - 230 - eOut(prog(t, T.heart, T.heart + 1)) * 40, H = [];
    for (let i = 0; i <= 50; i++) { const a = i / 50 * Math.PI * 2; H.push([hx + 16 * Math.pow(Math.sin(a), 3) * 3.4, hy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 3.4]); }
    inkLine(H, { t, seed: 720, w: 7, h: .04, p: eIO(prog(t, T.heart, T.heart + .5)), color: PAL.orange, gaps: false, amp: 1 });
  }
  inkIn(A.kaz, CX, 3330, t, T.kaz, { rot: -.015, seed: 14 });
  finger(t, [[T.fIn, CH[0][0], CH[0][1]], [T.tapCat + .3, CH[0][0], CH[0][1]], [T.throw[0], CH[0][0] + 60, CH[0][1] + 90]], [T.tapCat, T.throw[0] - .05], T.fIn, T.fOut);
}

function people(t) {
  floatWord(A.kogda, CX, 3990, t, T.kogda, { seed: 15, stagger: .05 });
  floatWord(A.vlyud, CX, 4120, t, T.vlyud, { seed: 16 });
  A.guides.forEach((sp, i) => soft(sp, CX, 4360 + i * 150, t, T.guides[i], { dx: i % 2 ? -260 : 260, sp: { h: .03, rot: (i - 1) * .012 } }));
  const cd = soft(A.crisis, CX, 4890, t, T.crisis, { sp: { h: .035 } });
  if (cd) glow(CX - A.crisis.w / 2 + PAD + 52, 4890, 80, 'rgba(224,71,60,A)', .4 + .3 * Math.sin(t * 3), .034);
  inkIn(A.kazhd, CX, 5040, t, T.kazhd, { rot: -.015, seed: 21 });
}

function shareIt(t) {
  inkIn(A.pomog, CX, 5810, t, T.pomog, { rot: -.02, seed: 22 });
  floatWord(A.otpr, CX, 5950, t, T.otpr, { seed: 23, stagger: .05 });
  inkIn(A.video, CX, 6090, t, T.video, { rot: .01, seed: 24 });
  const SH = [850, 6340], ITEM = [CX - 300, 6745];
  const sd = soft(A.share, SH[0], SH[1], t, T.share, { sp: { h: .03, sc: 1 - .08 * Math.sin(Math.PI * prog(t, T.tap1 - .08, T.tap1 + .2)) } });
  if (sd) soft(A.shareLbl, SH[0], SH[1] + 125, t, T.share, { sp: { h: .03, elev: 5 } });
  ring(SH[0], SH[1], 92, t, T.tap1, 730, 1 - prog(t, T.tap1 + .5, T.tap1 + .9));
  if (t > T.sheet[0]) { const u = eIO(prog(t, T.sheet[0], T.sheet[1])); drawSp(A.sheet, CX, 6720 + (1 - u) * 260, { h: .035, lift: (1 - u) * .3, elev: 9, alpha: u }); }
  ring(ITEM[0], ITEM[1], 84, t, T.tap2, 731);
  finger(t, [[T.fIn2, SH[0], SH[1]], [T.move[0], SH[0], SH[1]], [T.move[1], ITEM[0], ITEM[1]]], [T.tap1, T.tap2], T.fIn2, T.fOut2);
  if (t > T.copied) {
    const u = eOut(prog(t, T.copied, T.copied + .45)), lx = CX - 60;
    drawSp(A.copied, lx, 6990 - (1 - u) * 30, { h: .05, rot: -.02, sc: .92 + .08 * u, alpha: u, elev: 6, lift: (1 - u) * .3 });
    check(lx + A.copied.w / 2 - PAD + 50, 6985, t, T.copied + .2, 732);
  }
  if (t > T.strip) {
    const fu = eIO(prog(t, T.fly[0], T.fly[1])), lu = eIO(prog(t, T.strip, T.strip + .45));
    const P0 = [CX - 60, 6720 - lu * 200], C1 = [CX + 500, 6500], C2 = [CX + 300, 5800], P1 = [CX + 1100, 5500];
    const bz = (u) => [0, 1].map(c => (1 - u) ** 3 * P0[c] + 3 * (1 - u) ** 2 * u * C1[c] + 3 * (1 - u) * u * u * C2[c] + u ** 3 * P1[c]);
    const [x, y] = bz(fu), [x2, y2] = bz(Math.min(1, fu + .02));
    const rot = lerp(-.02, Math.atan2(y2 - y, x2 - x), eIO(prog(t, T.fold + .2, T.fly[0] + .3)));
    const fa = .45 * (1 - prog(t, T.fly[1], T.fly[1] + .8));
    if (fu > 0 && fa > 0) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(bz(fu * i / 40)); inkLine(pts, { t, seed: 733, w: 4, h: .06, alpha: fa, gaps: false, dbl: false, amp: 1 }); }
    if (fu < 1) {
      const f = clamp((t - T.fold) / .45) * 2, i0 = Math.min(2, Math.floor(f)), w = f - i0, o = { h: .065, lift: .5 + lu * .2, rot, elev: 10 };
      drawSp(A.fold[i0], x, y, Object.assign({}, o, { alpha: (i0 < 2 ? 1 - w : 1) * lu }));
      if (i0 < 2 && w > 0) drawSp(A.fold[i0 + 1], x, y, Object.assign({}, o, { alpha: w, shadow: false }));
    }
  }
}

function ending(t) {
  soft(A.mark, CX, 7880, t, T.end, { dur: 1.0, sp: { rot: -.03, h: .04 } });
  soft(A.tagline, CX, 8070, t, T.end + .35, { dx: -260, sp: { h: .045, rot: -.015 } });
  const L = [400, 8720], R = [680, 8720];
  drawPerson(L[0], L[1], 1.15, T.pair, 1, t, 170, { noCloud: true });
  drawPerson(R[0], R[1], 1.15, T.pair + .3, 2, t, 190, { noCloud: true });
  if (t > T.hands[0]) inkLine(smooth([[L[0] + 70, L[1] - 100], [CX, L[1] - 70], [R[0] - 70, R[1] - 100]], 10), { t, seed: 740, w: 6, h: .012, p: eSine(prog(t, T.hands[0], T.hands[1])), color: PAL.orange, dbl: false, amp: 1 });
  inkIn(A.profile, CX, 8930, t, T.profile, { rot: -.015, seed: 33 });
  inkIn(A.note, CX, 9040, t, T.note, { seed: 34 });
}

function drawWorld(t) {
  CAM = camAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  sceneTable(); sceneDecor(t);
  if (t < 4.7) hook(t);
  if (t > 3.1 && t < 12.0) companion(t);
  if (t > 10.2 && t < 17.3) people(t);
  if (t > 15.4 && t < 22.8) shareIt(t);
  if (t > 21.0) ending(t);
  const dim = 1 - eIO(prog(t, 3.5, 5.3));
  if (dim > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(118,132,168,${(dim * .55).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; glow(PHONE[0], PHONE[1], 380, 'rgba(170,205,235,A)', dim * .7, .009); ctx.globalCompositeOperation = 'source-over';
  }
}

/* ---------- sound cues ---------- */
function brushes(wd, t0, stagger, g) { wd.letters.forEach((_, j) => cue('tap', t0 + j * stagger + .3, { i: j, g })); }
function buildCues() {
  cue('rain', 0, { d: 4.4 }); cue('slide', T.tag, { d: .8, g: .3 });
  cue('pen', T.odin[0], { d: .9, g: .5 }); cue('pen', T.neskem[0], { d: 1.2, g: .5 });
  cue('whoosh', 3.5, { d: .9, g: .5 });
  brushes(A.nem, T.nem, .06, .35); brushes(A.komp, T.komp, .06, .35); [0, 1, 2].forEach(i => cue('tap', T.chips + i * .12 + .3, { i, g: .4 }));
  cue('slide', T.fIn, { d: .4, g: .35 }); cue('press', T.tapCat); cue('slide', T.cat, { d: .8, g: .35 });
  cue('plane', T.throw[0], { d: .8, g: .5 }); cue('tap', T.throw[1], { i: 1, g: .8 }); cue('tap', T.throw[1] + .2, { i: 2, g: .5 });
  cue('meow', T.hop[1] - .1); cue('chime', T.heart + .2, { hi: 1 }); cue('sun', T.lit + .3, { i: 4 }); cue('pen', T.kaz[0], { d: 1.1, g: .45 });
  cue('whoosh', 10.6, { d: .9, g: .5 });
  brushes(A.kogda, T.kogda, .05, .35); brushes(A.vlyud, T.vlyud, .06, .35);
  T.guides.forEach((g, i) => cue('slide', g, { d: .8, g: .35 })); cue('slide', T.crisis, { d: .8, g: .4 }); cue('pen', T.kazhd[0], { d: .9, g: .45 });
  cue('whoosh', 15.9, { d: .9, g: .5 });
  cue('pen', T.pomog[0], { d: .5, g: .5 }); brushes(A.otpr, T.otpr, .05, .35); cue('pen', T.video[0], { d: .7, g: .45 }); cue('slide', T.share, { d: .8, g: .35 });
  cue('slide', T.fIn2, { d: .35, g: .35 }); cue('press', T.tap1); cue('slide', T.sheet[0], { d: .4, g: .45 }); cue('press', T.tap2); cue('copy', T.copied);
  cue('peel', T.strip, { d: .35 }); cue('fold', T.fold + .1); cue('fold', T.fold + .32); cue('plane', T.fly[0] - .2, { d: 1.4, g: .8 });
  cue('whoosh', 21.4, { d: .9, g: .5 });
  cue('slide', T.end, { d: .9, g: .35 }); cue('slide', T.end + .35, { d: .8, g: .3 }); cue('sun', T.pair + .3, { i: 5 }); cue('sun', T.pair + .6, { i: 7 });
  cue('chime', T.hands[1] - .1, { hi: 2 }); cue('pen', T.profile[0], { d: .8, g: .45 });
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
