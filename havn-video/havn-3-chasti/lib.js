/* HAVN series «три части»: shared pieces for part1.js–part3.js —
   paper people with a cloud or a sun, soft floating letters, ink that
   writes itself on, glows, the finger and the HAVN card. */
'use strict';

const CX = 540;
const SHAKES = [];
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

function chainIcon(x, cx, cy, s, color) {
  x.save(); x.translate(cx, cy); x.rotate(-Math.PI / 4); x.scale(s, s);
  x.strokeStyle = color; x.lineWidth = 10; x.beginPath(); x.roundRect(-46, -17, 50, 34, 17); x.stroke();
  x.beginPath(); x.roundRect(-4, -17, 50, 34, 17); x.stroke(); x.restore();
}
function textW(s, font) { const m = mk(10, 10).getContext('2d'); m.font = font; return m.measureText(s).width; }

/* ---------- helpers ---------- */
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
  if (kc < 1 && !o.noCloud) {
    const cx = x + kc * 150 * s, cy = hy - 110 * s - kc * 90 * s + Math.sin(t * .9 + seed) * 4 * s;
    for (let r = 0; r < 4; r++) {
      const ph = (t * .9 + r * .27 + h2(seed, r)) % 1, rx = cx - 39 * s + r * 26 * s, ry = cy + 28 * s + ph * 70 * s;
      inkLine(seg([rx, ry], [rx - 4 * s, ry + 16 * s], 5), { t, seed: seed + 6 + r, w: 3.5 * s, h: .015, alpha: (1 - kc) * Math.sin(ph * Math.PI) * .8, gaps: false, dbl: false, color: PAL.deep, amp: .6 });
    }
    drawSp(A.cloud, cx, cy, { h: .016, sc: s / 2, elev: 3, alpha: 1 - kc });
  }
  if (k > 0 && !o.noSun) {
    const sy = hy - 100 * s, ss = s * (.25 + .25 * eOut(k));
    drawSp(A.sun, x, sy, { h: .018, elev: 3, sc: ss, alpha: k });
    for (let r = 0; r < 8; r++) { const a = r * Math.PI / 4 + t * .25; inkLine(seg([x + Math.cos(a) * 42 * s, sy + Math.sin(a) * 42 * s], [x + Math.cos(a) * 58 * s, sy + Math.sin(a) * 58 * s], 5), { t, seed: seed + 10 + r, w: 4 * s, h: .018, alpha: k, gaps: false, dbl: false, color: PAL.sunO, amp: .8 }); }
  }
  return { hy, k };
}


/* assets every part uses */
function buildCommon() {
  TEX = makeTex(1024, 11);
  GRAIN = [1, 2, 3, 4].map(makeGrain);
  A.tablePat = ctx.createPattern(TEX, 'repeat');
  A.grey = person(PAL.lonely, 1);
  A.col = COLS.map((c, i) => person(c, 10 + i * 2));
  A.sun = card(124, 124, { seed: 30, color: PAL.sunO, shape: ell(124, 124, 40) });
  const CL = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, s = Math.sin(a); CL.push([140 + 132 * Math.cos(a), 100 + 52 * s - (s < 0 ? 44 * Math.abs(Math.sin(a * 2.5)) : 0)]); }
  A.cloud = card(280, 180, { seed: 31, color: '#d3d7db', shape: CL, tex: .6 });
  A.whiteCloud = card(280, 180, { seed: 35, color: '#fbfdff', shape: CL, tex: .4 });
  A.tear = card(30, 44, { seed: 32, color: '#bfe3f7', shape: [[15, 0], [29, 24], [24, 41], [6, 41], [1, 24]] });
  A.finger = card(130, 560, { seed: 33, color: PAL.skin, shape: rrect(0, 0, 130, 560, 62), tex: .5, content: (x, cx, cy) => {
    x.fillStyle = '#f8ddc6'; x.beginPath(); x.roundRect(cx - 38, cy - 268, 76, 84, 30); x.fill();
    x.strokeStyle = 'rgba(160,110,80,.5)'; x.lineWidth = 4; x.lineCap = 'round';
    [-60, -40].forEach(d => { x.beginPath(); x.moveTo(cx - 34, cy + d); x.lineTo(cx + 34, cy + d + 2); x.stroke(); });
  } });
  A.mark = card(300, 190, { seed: 34, color: '#fffdf7', shape: rrect(0, 0, 300, 190, 32), tex: .6, content: (x, cx, cy) => {
    x.fillStyle = PAL.sunO; x.beginPath(); x.arc(cx, cy - 14, 38, Math.PI, 0); x.fill();
    x.strokeStyle = PAL.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 66, cy - 12); x.lineTo(cx + 66, cy - 12); x.stroke();
    x.font = '900 44px Unb'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = PAL.deep; x.fillText('HAVN', cx, cy + 42);
  } });
  const cols = [PAL.grey, PAL.ice, PAL.sand, PAL.white, PAL.kraft], DR = mulberry32(7); A.decor = [];
  for (let i = 0; i < 40; i++) A.decor.push({ sp: card(110 + DR() * 180, 46 + DR() * 80, { seed: 500 + i, color: cols[Math.floor(DR() * 5)], torn: DR() < .5 }), x: CX + (i % 2 ? -1 : 1) * (620 + DR() * 220), y: 200 + i * 260 + (DR() - .5) * 120, rot: (DR() - .5) * .8, h: DR() * .05 });
}
function sceneDecor(t) { A.decor.forEach(d => { if (Math.abs(d.y - CAM.y) < 1500) drawSp(d.sp, d.x, d.y, { h: d.h, rot: d.rot }); }); }

// «HAVN · часть N из 3» tag at the top of the first frame
function partTag(n, title) {
  const font = '600 40px Inter', s = `HAVN · часть ${n} из 3`, w = textW(s, font) + 80;
  return card(w, 84, { seed: 90 + n, color: PAL.deep, shape: rrect(0, 0, w, 84, 42), content: printed(s, font, '#ffffff', 2) });
}
// a finger whose tip moves through a list of [time, x, y] stops; taps are short presses
function finger(t, path, taps, tIn, tOut) {
  if (t < tIn || t > tOut + .7) return;
  let tx = path[0][1], ty = path[0][2];
  for (let i = 1; i < path.length; i++) { const u = eIO(prog(t, path[i - 1][0], path[i][0])); if (t >= path[i - 1][0]) { tx = lerp(path[i - 1][1], path[i][1], u); ty = lerp(path[i - 1][2], path[i][2], u); } }
  const inn = eIO(prog(t, tIn, tIn + .45)), outU = eIO(prog(t, tOut, tOut + .6));
  let press = 0; taps.forEach(tp => { press += Math.sin(Math.PI * prog(t, tp - .12, tp + .2)); });
  const k = (1 - inn) + outU, ang = -.45;
  const tipX = tx + 14 + Math.sin(-ang) * k * 800, tipY = ty + 24 + Math.cos(ang) * k * 800;
  drawSp(A.finger, tipX - Math.sin(ang) * 255, tipY + Math.cos(ang) * 255, { h: .06 - press * .006, lift: .3 - press * .22, rot: ang, elev: 10 });
}
// a paper pill button with printed words
function pill(text, color, ink, seed, size = 42) {
  const font = `600 ${size}px Inter`, w = textW(text, font) + 90, h = size * 2.3;
  return card(w, h, { seed, color, shape: rrect(0, 0, w, h, h / 2), content: printed(text, font, ink, 2) });
}
function ring(x, y, r, t, t0, seed, alpha = 1) { if (t > t0) inkLine(arc(x, y, r, r, -Math.PI / 2, Math.PI * 1.5, 40), { t, seed, w: 6, h: .05, p: eOut(prog(t, t0, t0 + .35)), color: PAL.orange, gaps: false, amp: 1, alpha }); }
function soft(sp, x, y, t, t0, o = {}) { const d = drop(t, t0, o.dur || .9); if (d) drawSp(sp, x + (o.dx || 0) * (1 - d.a), y - d.lift * 60, Object.assign({ h: .03, lift: d.lift, elev: 7, alpha: d.a }, o.sp || {})); return d; }
function check(x, y, t, t0, seed, s = 1) { if (t > t0) inkLine(chain([x - 22 * s, y], [x, y + 24 * s], [x + 44 * s, y - 32 * s]), { t, seed, w: 9 * s, h: .05, p: eOut(prog(t, t0, t0 + .3)), color: PAL.orange, dbl: false, gaps: false, amp: .8 }); }
function endCard(t, y, t0, nextText, seed) {
  soft(A.mark, CX, y - 230, t, t0, { dur: 1.0, sp: { rot: -.03, h: .04 } });
  if (nextText) {
    inkIn(A.prod, CX, y - 20, t, [t0 + .4, t0 + .9], { rot: -.02, seed });
    soft(A.next, CX, y + 110, t, t0 + .8, { dx: 260, sp: { rot: .015, h: .05 } });
  }
}
