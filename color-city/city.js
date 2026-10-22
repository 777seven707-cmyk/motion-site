/* «Город красок» — a bouncing ball brings colour back to a grey city.
   Everything is driven by one clock: window.renderFrame(t) draws the frame
   for time t (seconds), so the render is deterministic and frame-exact. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1920), H = +(q.get('h') || 1080);
const DUR = 45, R = 1.8;

/* ---------- helpers ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sstep = t => t * t * (3 - 2 * t);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SFX = [];
const cue = (type, t, extra) => SFX.push(Object.assign({ type, t: +t.toFixed(4) }, extra || {}));

/* ---------- the ball's route: [time, x, surfaceY, z, kind, waveRadius, apex] ---------- */
const PATH = [
  [5.0, 0, 0, -96, 'g', 44], [6.0, 0, 0, -80, 'g', 30], [7.0, 0, 0, -64, 'g', 30],
  [8.0, 16, 12, -48, 'r', 32], [9.0, 32, 0, -32, 'g', 30], [10.0, 48, 18, -16, 'r', 34],
  [11.0, 64, 0, 0, 'g', 30], [12.0, 64, 0, 16, 'g', 28], [13.0, 80, .3, 16, 'park', 42],
  [14.0, 80, 0, 32, 'g', 30], [15.5, 48, 22, 48, 'r', 36], [16.5, 32, 0, 64, 'g', 30],
  [17.5, 16, .3, 56, 'plaza', 38], [18.5, 0, 0, 64, 'g', 30], [19.5, -16, 14, 48, 'r', 32],
  [20.5, -32, 0, 32, 'g', 30], [21.5, -48, 24, 48, 'r', 36], [22.5, -64, 0, 32, 'g', 32],
  [23.5, -64, 0, 16, 'g', 30], [24.5, -48, 30, 16, 'r', 36], [25.5, -32, 0, 0, 'g', 30],
  [26.5, -16, 40, 16, 'r', 38], [28.0, -16, 62, 80, 'r', 40],
  [30.0, -14, 97.9, 84, 'cloud', 0],
  [32.0, -16, 62, 80, 'settle', 0, 0], [32.6, -16, 62, 80, 'settle', 0, 3.2], [33.0, -16, 62, 80, 'settle', 0, 1.3], [33.26, -16, 62, 80, 'settle', 0, .45]
].map(p => ({ t: p[0], x: p[1], y: p[2], z: p[3], kind: p[4], rad: p[5], apex: p[6] }));
const BOOP = 30.0;
const LANDINGS = PATH.filter(p => p.kind !== 'cloud' && p.kind !== 'settle');
const HERO = {}; PATH.filter(p => p.kind === 'r').forEach(p => { HERO[`${p.x},${p.z}`] = p.y; });
const BALLC = ['#ff3d7f', '#ffb000', '#00c2a8', '#3d8bff', '#9b5cff', '#ff6b2c', '#22c55e', '#ff4fd8', '#00b7ff', '#ffd400'].map(c => new THREE.Color(c));

function ballAt(t) {
  if (t < 4.0) return V(0, 300, -96);
  if (t < PATH[0].t) { const u = prog(t, 4.0, PATH[0].t); return V(0, 75 - 75 * u * u + R, -96); }
  let i = 0; while (i < PATH.length - 1 && t >= PATH[i + 1].t) i++;
  const a = PATH[i];
  if (i === PATH.length - 1) return V(a.x, a.y + R, a.z);
  const b = PATH[i + 1], u = prog(t, a.t, b.t);
  let y;
  if (b.kind === 'cloud') y = a.y + (b.y - a.y) * (1 - (1 - u) * (1 - u));
  else if (a.kind === 'cloud') y = a.y - (a.y - b.y) * u * u;
  else {
    const hop = b.apex != null ? b.apex : (b.t - a.t > 1.3 ? 13 : 7.5) + Math.abs(b.y - a.y) * .35;
    y = lerp(a.y, b.y, u) + 4 * hop * u * (1 - u);
  }
  return V(lerp(a.x, b.x, u), y + R, lerp(a.z, b.z, u));
}
const ballVel = t => ballAt(t + 1 / 240).sub(ballAt(t - 1 / 240)).multiplyScalar(120);
function squashAt(t) {
  let s = 0;
  PATH.forEach(p => { if (p.kind === 'cloud') return; const k = p.kind === 'settle' ? .5 : 1; s += k * Math.exp(-Math.pow((t - p.t) / .055, 2)); });
  s += .8 * Math.exp(-Math.pow((t - BOOP) / .06, 2));
  return s;
}
function ballColorAt(t) {
  let n = 0; LANDINGS.forEach(p => { if (t >= p.t) n++; });
  const last = LANDINGS[n - 1], k = last ? clamp((t - last.t) / .15) : 1;
  return BALLC[Math.max(0, n - 1) % BALLC.length].clone().lerp(BALLC[n % BALLC.length], n ? k : 1);
}

/* ---------- colour events: every landing sends out a wave; the boop paints everything ---------- */
const EVENTS = LANDINGS.map((p, i) => ({ x: p.x, y: p.y, z: p.z, t0: p.t, rad: p.rad + 6, speed: i === 0 ? 50 : 42, col: BALLC[i % BALLC.length] }));
EVENTS.push({ x: -14, y: 500, z: 84, t0: BOOP + .05, rad: 520, speed: 95, col: new THREE.Color('#ffffff') });
function colorTime(x, z) {
  let best = Infinity;
  EVENTS.forEach(e => { const d = Math.hypot(x - e.x, z - e.z); if (d < e.rad) best = Math.min(best, e.t0 + d / e.speed); });
  return best;
}

/* ---------- renderer, scene ---------- */
const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, .3, 1600);
const FOG_GREY = new THREE.Color('#9aa1a9'), FOG_SUN = new THREE.Color('#cfe5f7');
scene.fog = new THREE.Fog(FOG_GREY.clone(), 120, 520);

const hemi = new THREE.HemisphereLight('#c9d2db', '#5b5f66', 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 1.0);
sun.position.set(90, 160, 60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 420 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .4; scene.add(sun); scene.add(sun.target);

/* the paint shader. When the colour reaches each spot of the city is known in
   advance, so it is baked once into a map (time of arrival per texel); the
   splats are baked too. The fragment shader only compares those with the clock:
   grey before the wave, colour after it, a bright rim right on the front. */
const MAPW = 360, MAPN = 1024, SPN = 2048;
const BOOPE = EVENTS[EVENTS.length - 1];
const tcTex = (() => {
  const d = new Uint16Array(MAPN * MAPN);
  for (let j = 0; j < MAPN; j++) for (let i = 0; i < MAPN; i++) {
    const x = (i + .5) / MAPN * MAPW - MAPW / 2, z = (j + .5) / MAPN * MAPW - MAPW / 2;
    d[j * MAPN + i] = THREE.DataUtils.toHalfFloat(Math.min(1000, colorTime(x, z)));
  }
  const t = new THREE.DataTexture(d, MAPN, MAPN, THREE.RedFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
})();
const [spCol, spTim] = (() => {
  const c = new Uint8Array(SPN * SPN * 4), tm = new Uint16Array(SPN * SPN * 2), px = MAPW / SPN;
  EVENTS.forEach((e, n) => {
    if (e === BOOPE) return;
    const r = mulberry32(300 + n), seed = r() * 6, drops = Array.from({ length: 7 }, () => { const a = r() * Math.PI * 2, dd = 4.3 + r() * 2.6; return [Math.cos(a) * dd, Math.sin(a) * dd, .3 + r() * .35]; });
    const col = e.col.clone().convertLinearToSRGB();
    const i0 = Math.floor((e.x - 8 + MAPW / 2) / px), i1 = Math.ceil((e.x + 8 + MAPW / 2) / px), j0 = Math.floor((e.z - 8 + MAPW / 2) / px), j1 = Math.ceil((e.z + 8 + MAPW / 2) / px);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + .5) * px - MAPW / 2 - e.x, z = (j + .5) * px - MAPW / 2 - e.z, a = Math.atan2(z, x), dd = Math.hypot(x, z);
      const rr = (2.7 + .8 * Math.sin(5 * a + seed) + .5 * Math.sin(9 * a + seed * 2) + .3 * Math.sin(17 * a + seed * 3)) * 1.3;
      let k = dd < rr ? 1 : 0;
      drops.forEach(dp => { if (Math.hypot(x - dp[0], z - dp[1]) < dp[2]) k = 1; });
      if (!k) continue;
      const o = j * SPN + i;
      c[o * 4] = col.r * 255; c[o * 4 + 1] = col.g * 255; c[o * 4 + 2] = col.b * 255; c[o * 4 + 3] = 255;
      tm[o * 2] = THREE.DataUtils.toHalfFloat(e.t0); tm[o * 2 + 1] = THREE.DataUtils.toHalfFloat(e.y);
    }
  });
  const a = new THREE.DataTexture(c, SPN, SPN, THREE.RGBAFormat); a.colorSpace = THREE.SRGBColorSpace; a.magFilter = a.minFilter = THREE.LinearFilter; a.needsUpdate = true;
  const b = new THREE.DataTexture(tm, SPN, SPN, THREE.RGFormat, THREE.HalfFloatType); b.magFilter = b.minFilter = THREE.NearestFilter; b.needsUpdate = true;
  return [a, b];
})();
const U = { uTime: { value: 0 }, uTc: { value: tcTex }, uSpC: { value: spCol }, uSpT: { value: spTim }, uBoop: { value: new THREE.Vector3(BOOPE.x, BOOPE.z, BOOPE.t0) } };
function paint(mat, splat = true) {
  if (q.has('nopaint')) return mat;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U, { uSplatOn: { value: splat ? 1 : 0 } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wpp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        wpp = instanceMatrix * wpp;
        #endif
        vWP = (modelMatrix * wpp).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWP; uniform float uTime; uniform float uSplatOn;
        uniform sampler2D uTc; uniform sampler2D uSpC; uniform sampler2D uSpT; uniform vec3 uBoop;
        float paintF;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 muv = (vWP.xz + ${MAPW / 2}.0) / ${MAPW}.0;
        float tc = (muv.x > 0.0 && muv.x < 1.0 && muv.y > 0.0 && muv.y < 1.0) ? texture2D(uTc, muv).r : uBoop.z + length(vWP.xz - uBoop.xy) / 95.0;
        float age = uTime - tc;
        paintF = clamp(age / 0.15, 0.0, 1.0);
        float rim = max(0.0, 1.0 - abs(age - 0.04) / 0.1); rim *= rim;
        float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 grey = vec3(lum) * 0.8 + vec3(0.055, 0.06, 0.07);
        diffuseColor.rgb = mix(grey, diffuseColor.rgb, paintF) + rim * 0.22;
        if (uSplatOn > 0.5) {
          vec4 sc = texture2D(uSpC, muv); vec2 st = texture2D(uSpT, muv).rg;
          if (sc.a > 0.01 && abs(vWP.y - st.y) < 0.7) diffuseColor.rgb = mix(diffuseColor.rgb, sc.rgb, sc.a * 0.95 * clamp((uTime - st.x) * 12.0, 0.0, 1.0));
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n        totalEmissiveRadiance *= paintF;');
  };
  mat.customProgramCacheKey = () => 'paint' + (splat ? 1 : 0);
  return mat;
}

/* ---------- sky ---------- */
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uS: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec3 vD; uniform float uS;
    void main(){ float h = clamp(vD.y, 0.0, 1.0);
      vec3 g = mix(vec3(0.62,0.65,0.69), vec3(0.47,0.5,0.55), pow(h, 0.6));
      vec3 b = mix(vec3(1.0,0.86,0.70), vec3(0.22,0.6,0.96), pow(h, 0.45));
      vec3 sd = normalize(vec3(0.45,0.55,-0.7)); b += vec3(1.0,0.85,0.55) * pow(max(dot(vD, sd), 0.0), 40.0) * 0.8;
      gl_FragColor = vec4(mix(g, b, uS), 1.0); }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat));

/* ---------- camera rig: shots blended, then a critically damped spring (inertia) ---------- */
function headingAt(t) { const a = ballAt(t - .35), b = ballAt(t + .35); const dx = b.x - a.x, dz = b.z - a.z; return Math.hypot(dx, dz) < .5 ? null : Math.atan2(dx, dz); }
const HEAD = []; { let last = 0, acc = 0; for (let i = 0; i <= DUR * 60; i++) { const h = headingAt(i / 60); if (h != null) { let d = h - last; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; last = h; } HEAD.push(acc); } }
// smooth the heading so the chase camera turns gently
const HEADS = HEAD.map((_, i) => { let s = 0, n = 0; for (let k = -40; k <= 40; k++) { const j = clamp(i + k, 0, HEAD.length - 1); s += HEAD[j]; n++; } return s / n; });
const headS = t => { const f = clamp(t * 60, 0, HEADS.length - 1), i = Math.floor(f); return lerp(HEADS[i], HEADS[Math.min(i + 1, HEADS.length - 1)], f - i); };
const fwd = h => V(Math.sin(h), 0, Math.cos(h)), right = h => V(Math.cos(h), 0, -Math.sin(h));
const TOWER = V(-16, 62 + R, 80);
const SHOTS = [
  { t1: 5.8, ap: .00012, f: t => { const u = eIO(prog(t, 0, 4.9)); const look = V(0, lerp(25, 3, u), lerp(-60, -92, u)); if (t > 3.6) look.lerp(V(0, 3.5, -96), sstep(prog(t, 3.6, 4.4))); return { p: V(lerp(60, 14, u) + (t > 4.9 ? (t - 4.9) * 3 : 0), lerp(100, 8.5, u), lerp(-200, -115, u) + (t > 4.9 ? (t - 4.9) * 4 : 0)), l: look }; } },
  { t1: 12.6, ap: .0007, f: t => { const b = ballAt(t), h = headS(t); return { p: b.clone().addScaledVector(fwd(h), -17).addScaledVector(right(h), 7).add(V(0, 6, 0)), l: b.clone().addScaledVector(fwd(h), 6).add(V(0, 1, 0)) }; } },
  { t1: 15.2, ap: .0005, f: t => { const u = prog(t, 12.6, 15.2), a = lerp(-1.75, -.55, u), c = V(80, 0, 16); return { p: V(c.x + Math.cos(a) * 30, 10 + 4 * u, c.z + Math.sin(a) * 30), l: ballAt(t).lerp(V(80, 7, 16), .4).add(V(0, 2, 0)) }; } },
  { t1: 22.1, ap: .0005, f: t => { const b = ballAt(t), h = headS(t); return { p: b.clone().addScaledVector(right(h), -5).addScaledVector(fwd(h), -20).add(V(0, 13, 0)), l: b.clone().addScaledVector(fwd(h), 5) }; } },
  { t1: 27.7, ap: .0009, f: t => { const b = ballAt(t), h = headS(t); return { p: b.clone().addScaledVector(fwd(h), -13).addScaledVector(right(h), 4).add(V(0, 2.4, 0)), l: b.clone().addScaledVector(fwd(h), 4).add(V(0, 2, 0)) }; } },
  { t1: 31.0, ap: .00035, f: t => { const u = eIO(prog(t, 27.7, 31.0)); return { p: V(lerp(24, 16, u), lerp(50, 62, u), lerp(44, 52, u)), l: ballAt(t).add(V(0, 1, 0)) }; } },
  { t1: 34.6, ap: .00005, f: t => { const u = eIO(prog(t, 31.0, 34.6)), w = sstep(prog(t, 31.0, 32.3)); return { p: V(lerp(16, 120, u), lerp(62, 165, u), lerp(52, 250, u)), l: V(lerp(-14, 0, w), lerp(100, 18, w), lerp(84, -10, w)) }; } },
  { t1: 99, ap: .0008, f: t => { const u = sstep(prog(t, 34.6, 45)), a = lerp(.75, -.25, u), r = lerp(30, 17, u); const b = ballAt(t); return { p: V(TOWER.x + Math.sin(a) * r, TOWER.y + lerp(11, 3.2, u), TOWER.z + Math.cos(a) * r), l: b.clone().lerp(V(0, 30, -20), .22).add(V(0, 1.2, 0)) }; } }
];
function desired(t) {
  let i = 0; while (i < SHOTS.length - 1 && t > SHOTS[i].t1) i++;
  const B = .9, cur = SHOTS[i].f(t);
  let ap = SHOTS[i].ap;
  if (i > 0 && t < SHOTS[i - 1].t1 + B / 2) { const w = sstep(prog(t, SHOTS[i - 1].t1 - B / 2, SHOTS[i - 1].t1 + B / 2)), pr = SHOTS[i - 1].f(t); cur.p = pr.p.lerp(cur.p, w); cur.l = pr.l.lerp(cur.l, w); ap = lerp(SHOTS[i - 1].ap, ap, w); }
  if (i < SHOTS.length - 1 && t > SHOTS[i].t1 - B / 2) { const w = sstep(prog(t, SHOTS[i].t1 - B / 2, SHOTS[i].t1 + B / 2)), nx = SHOTS[i + 1].f(t); cur.p.lerp(nx.p, w); cur.l.lerp(nx.l, w); ap = lerp(ap, SHOTS[i + 1].ap, w); }
  cur.ap = ap;
  // never inside a building the ball lands on: rise over its roof instead
  Object.entries(HERO).forEach(([k, hh]) => { const [hx, hz] = k.split(',').map(Number); if (Math.abs(cur.p.x - hx) < 13.5 && Math.abs(cur.p.z - hz) < 13.5) cur.p.y = Math.max(cur.p.y, hh + 11); });
  return cur;
}
const CAMS = []; {
  const dt = 1 / 240, om = 6.5; const d0 = desired(0);
  const p = d0.p.clone(), l = d0.l.clone(), vp = V(0, 0, 0), vl = V(0, 0, 0);
  for (let i = 0; i <= DUR * 240; i++) {
    const t = i * dt, d = desired(t);
    const ap = d.p.clone().sub(p).multiplyScalar(om * om).addScaledVector(vp, -2 * om); vp.addScaledVector(ap, dt); p.addScaledVector(vp, dt);
    const al = d.l.clone().sub(l).multiplyScalar(om * om * 1.6).addScaledVector(vl, -2 * om * 1.26); vl.addScaledVector(al, dt); l.addScaledVector(vl, dt);
    if (p.y < 1.4) p.y = 1.4;
    Object.entries(HERO).forEach(([k, hh]) => { const [hx, hz] = k.split(',').map(Number); if (Math.abs(p.x - hx) < 13 && Math.abs(p.z - hz) < 13 && p.y < hh + 7) { p.y = hh + 7; if (vp.y < 0) vp.y = 0; } });
    if (i % 4 === 0) CAMS.push({ p: p.clone(), l: l.clone(), ap: d.ap });
  }
}
function camAt(t) { const f = clamp(t * 60, 0, CAMS.length - 1), i = Math.floor(f), j = Math.min(i + 1, CAMS.length - 1), k = f - i; return { p: CAMS[i].p.clone().lerp(CAMS[j].p, k), l: CAMS[i].l.clone().lerp(CAMS[j].l, k), ap: lerp(CAMS[i].ap, CAMS[j].ap, k) }; }

/* ---------- city ---------- */
const rnd = mulberry32(2024);
const PASTEL = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#ffafcc', '#a0c4ff', '#cdb4db', '#90be6d', '#f9844a', '#ff8fab', '#80ed99', '#ffd6a5', '#9bf6ff'];
const unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.translate(0, .5, 0);
// two draw calls per building instead of six: walls (+ floor) in one group, the roof in the other
const tallBox = unitBox.clone(); {
  const ix = Array.from(tallBox.index.array), re = ix.slice(0, 12).concat(ix.slice(24, 36), ix.slice(18, 24), ix.slice(12, 18));
  tallBox.setIndex(re); tallBox.clearGroups(); tallBox.addGroup(0, 30, 0); tallBox.addGroup(30, 6, 1);
}

function makeWallTextures() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const e = document.createElement('canvas'); e.width = e.height = S; const y = e.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S); y.fillStyle = '#000'; y.fillRect(0, 0, S, S);
  const r = mulberry32(5);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const wx = i * 64 + 14, wy = j * 64 + 12;
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(wx - 3, wy - 3, 42, 46);
    x.fillStyle = '#2f4256'; x.fillRect(wx, wy, 36, 40);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(wx + 3, wy + 3, 10, 34);
    if (r() < .45) { y.fillStyle = r() < .5 ? '#ffd27a' : '#ffe9b0'; y.fillRect(wx, wy, 36, 40); }
  }
  const t1 = new THREE.CanvasTexture(c), t2 = new THREE.CanvasTexture(e);
  [t1, t2].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 1; }); t1.colorSpace = t2.colorSpace = THREE.SRGBColorSpace;
  return [t1, t2];
}
const [WALL, LIT] = makeWallTextures();

// ground and streets
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), paint(new THREE.MeshStandardMaterial({ color: '#4b5059', roughness: .95 })));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
{
  const n = 9 * 2 * 46, dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.35, .04, 2.6), paint(new THREE.MeshStandardMaterial({ color: '#fff4c2', roughness: .8 })), n);
  let k = 0; const m = new THREE.Matrix4();
  for (let s = -4; s <= 4; s++) for (let d = -46; d < 46; d++) {
    m.makeTranslation(32 * s, .02, d * 6 + 3); dash.setMatrixAt(k++, m);
    m.makeRotationY(Math.PI / 2).setPosition(d * 6 + 3, .02, 32 * s); dash.setMatrixAt(k++, m);
  }
  dash.receiveShadow = true; scene.add(dash);
}

const BLOCKS = [];
for (let bi = -4; bi <= 3; bi++) for (let bj = -4; bj <= 3; bj++) BLOCKS.push({ x: 32 * bi + 16, z: 32 * bj + 16 });
const isPark = b => b.x === 80 && b.z === 16, isPlaza = b => b.x === 16 && b.z === 48;

// footprints first, then cap their heights so the ball's arcs and the camera never pass through a wall
const FOOT = [];
BLOCKS.forEach(b => {
  if (isPark(b) || isPlaza(b)) return;
  const hero = HERO[`${b.x},${b.z}`];
  if (hero != null) { FOOT.push({ x0: b.x - 9.5, x1: b.x + 9.5, z0: b.z - 9.5, z1: b.z + 9.5, h: hero, hero: true, b }); return; }
  const r = rnd(), parts = r < .3 ? [[-9.5, 9.5, -9.5, 9.5]] : r < .6 ? [[-9.5, -.7, -9.5, 9.5], [.7, 9.5, -9.5, 9.5]] : r < .8 ? [[-9.5, 9.5, -9.5, -.7], [-9.5, 9.5, .7, 9.5]] : [[-9.5, -.7, -9.5, -.7], [.7, 9.5, -9.5, -.7], [-9.5, -.7, .7, 9.5], [.7, 9.5, .7, 9.5]];
  const dist = Math.hypot(b.x + 10, b.z - 20), hmax = 12 + 38 * Math.exp(-Math.pow(dist / 85, 2));
  parts.forEach(p => FOOT.push({ x0: b.x + p[0], x1: b.x + p[1], z0: b.z + p[2], z1: b.z + p[3], h: 6 + rnd() * hmax, b }));
});
const inside = (f, x, z, pad) => x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad;
for (let t = 3.5; t < DUR; t += 1 / 30) {
  const b = ballAt(t), c = camAt(t).p;
  FOOT.forEach(f => {
    if (!f.hero && inside(f, b.x, b.z, R + 1)) f.h = Math.min(f.h, b.y - R - 2.5);
    if (inside(f, c.x, c.z, 6) && c.y - 7 < f.h) { if (f.hero) { if (c.y < f.h + .5 && false) console.warn('cam in hero', f.b.x, f.b.z, 't=' + t.toFixed(2), c.x.toFixed(1), c.y.toFixed(1), c.z.toFixed(1)); } else f.h = c.y - 7; }
    if (!f.hero) for (let s = .15; s < .92; s += .12) { const qx = lerp(c.x, b.x, s), qy = lerp(c.y, b.y, s), qz = lerp(c.z, b.z, s); if (inside(f, qx, qz, .5)) f.h = Math.min(f.h, qy - 1.5); }
  });
}
FOOT.forEach(f => { if (f.hero && f.h < HERO[`${f.b.x},${f.b.z}`] - .01) console.warn('hero roof capped', f.b, f.h); });

const BUILD = [];
const roofMats = PASTEL.map(c => paint(new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(.62), roughness: .9 })));
FOOT.forEach((f, i) => {
  if (f.h < 3) return;
  const w = f.x1 - f.x0, d = f.z1 - f.z0, ci = Math.floor(rnd() * PASTEL.length);
  const wall = WALL.clone(), lit = LIT.clone(); wall.repeat.set(Math.max(1, Math.round((w + d) / 2 / 7)), Math.max(1, Math.round(f.h / 7))); lit.repeat.copy(wall.repeat);
  const side = paint(new THREE.MeshStandardMaterial({ color: PASTEL[ci], map: wall, emissive: '#ffcf70', emissiveMap: lit, emissiveIntensity: 1.1, roughness: .85 }));
  const m = new THREE.Mesh(tallBox, [side, roofMats[ci]]);
  m.scale.set(w, f.h, d); m.position.set((f.x0 + f.x1) / 2, .3, (f.z0 + f.z1) / 2); m.castShadow = m.receiveShadow = true;
  if (f.hero) m.scale.y = f.h - .3;
  scene.add(m);
  const hits = PATH.filter(p => p.kind !== 'cloud' && Math.hypot(Math.max(f.x0 - p.x, 0, p.x - f.x1), Math.max(f.z0 - p.z, 0, p.z - f.z1)) < 8).map(p => ({ t: p.t, a: inside(f, p.x, p.z, 0) ? (p.kind === 'settle' ? .02 : .07) : .03 }));
  BUILD.push({ m, w, d, h: m.scale.y, hits, hero: f.hero });
});

// block slabs: pavement, the park lawn, the plaza tiles
BLOCKS.forEach(b => {
  const col = isPark(b) ? '#6cc04a' : isPlaza(b) ? '#f0c987' : ['#d9d4c7', '#cfd6d3', '#e0d6cf'][Math.floor(rnd() * 3)];
  const s = new THREE.Mesh(unitBox, paint(new THREE.MeshStandardMaterial({ color: col, roughness: .95 })));
  s.scale.set(22, .3, 22); s.position.set(b.x, 0, b.z); s.receiveShadow = true; scene.add(s);
});
{ // pond in the park
  const p = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, .1, 40), paint(new THREE.MeshStandardMaterial({ color: '#3bb6ff', roughness: .15, metalness: .1 }), false));
  p.position.set(86, .32, 22); scene.add(p);
}

// trees: instanced trunks and crowns; crowns pop when the colour reaches them
const TREES = [];
BLOCKS.forEach(b => {
  if (HERO[`${b.x},${b.z}`] != null) return;
  if (isPark(b)) { [[-6, -6], [-7, 3], [-2, 7], [4, -7], [0, -1], [6, 4], [-4, -1], [2, 8]].forEach(o => TREES.push({ x: b.x + o[0], z: b.z + o[1], s: .9 + rnd() * .5 })); return; }
  if (isPlaza(b)) { [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(o => TREES.push({ x: b.x + o[0], z: b.z + o[1], s: 1 })); return; }
  for (let k = 0; k < 3; k++) { const side = Math.floor(rnd() * 4), along = (rnd() - .5) * 16; const o = [[along, -10.3], [along, 10.3], [-10.3, along], [10.3, along]][side]; TREES.push({ x: b.x + o[0], z: b.z + o[1], s: .8 + rnd() * .4 }); }
});
for (let t = 0; t < DUR; t += 1 / 30) { const c = camAt(t).p; if (c.y < 9) for (let i = TREES.length - 1; i >= 0; i--) if (Math.hypot(TREES[i].x - c.x, TREES[i].z - c.z) < 4.5) TREES.splice(i, 1); }
const trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, 2.6, 8).translate(0, 1.3, 0), paint(new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: .9 })), TREES.length);
const crownIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9, 1), paint(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8, flatShading: true })), TREES.length);
const TREEC = ['#4caf50', '#66bb6a', '#2e9e5b', '#8bc34a', '#ff8fb8', '#ffb3cf', '#43a047'];
TREES.forEach((tr, i) => { tr.ta = colorTime(tr.x, tr.z); crownIM.setColorAt(i, new THREE.Color(TREEC[Math.floor(rnd() * TREEC.length)])); });
trunkIM.castShadow = crownIM.castShadow = true; crownIM.receiveShadow = true; scene.add(trunkIM, crownIM);

// cars drive loops around blocks once colour reaches them
const CARC = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#9b5de5', '#00bbf9'];
const carBody = new THREE.BoxGeometry(4.2, 1.1, 2).translate(0, .85, 0), carCab = new THREE.BoxGeometry(2.3, .9, 1.8).translate(-.2, 1.85, 0), wheelG = new THREE.CylinderGeometry(.45, .45, .4, 12).rotateX(Math.PI / 2);
const wheelM = new THREE.MeshStandardMaterial({ color: '#222', roughness: .8 });
const CARS = [];
[[-48, 16], [-48, 48], [-80, 16], [-80, 48], [-16, -16], [16, -16], [48, -48], [48, 16], [16, 16], [-16, 48], [48, 80], [-48, -16], [16, -80], [-16, -80], [80, -16], [-80, -16]].forEach((b, i) => {
  const g = new THREE.Group(), col = CARC[i % CARC.length];
  const body = new THREE.Mesh(carBody, paint(new THREE.MeshStandardMaterial({ color: col, roughness: .35, metalness: .2 })));
  const cab = new THREE.Mesh(carCab, paint(new THREE.MeshStandardMaterial({ color: '#dff6ff', roughness: .2 })));
  g.add(body, cab); [[-1.4, .45, 1], [1.4, .45, 1], [-1.4, .45, -1], [1.4, .45, -1]].forEach(p => { const w = new THREE.Mesh(wheelG, wheelM); w.position.set(...p); g.add(w); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  const s0 = rnd() * 4;
  const start = rectPath(b, s0); CARS.push({ g, b, s0, ta: colorTime(start.x, start.z) + .3 });
});
function rectPath(b, s) {
  // rounded loop 13.5 m out from the block centre, counter-clockwise; s in sides (0..4)
  const L = 13.5, rc = 4, side = ((Math.floor(s) % 4) + 4) % 4, f = s - Math.floor(s);
  const corners = [[L, -L], [L, L], [-L, L], [-L, -L]], a = corners[side], c = corners[(side + 1) % 4];
  const x = lerp(a[0], c[0], f), z = lerp(a[1], c[1], f), dx = c[0] - a[0], dz = c[1] - a[1];
  let head = Math.atan2(dz, dx);
  const toEnd = (1 - f) * 2 * L, fromStart = f * 2 * L;
  if (toEnd < rc) head += (1 - toEnd / rc) * Math.PI / 4; else if (fromStart < rc) head -= (1 - fromStart / rc) * Math.PI / 4;
  return { x: b[0] + x, z: b[1] + z, head };
}

// balloons in the park
const BALLOONS = [];
for (let i = 0; i < 16; i++) {
  const g = new THREE.Group(), col = new THREE.Color(BALLC[i % BALLC.length]);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.8, 20, 16).scale(1, 1.18, 1), paint(new THREE.MeshStandardMaterial({ color: col, roughness: .3 }), false));
  const s = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 3, 4).translate(0, -1.9, 0), new THREE.MeshBasicMaterial({ color: '#555' }));
  g.add(b, s); b.castShadow = true; scene.add(g);
  BALLOONS.push({ g, x: 80 + (rnd() - .5) * 5, z: 16 + 4 + (rnd() - .5) * 4, y0: 3.4 + rnd() * 1.2, v: 5 + rnd() * 3, ph: rnd() * 6, t0: 13.04 + i * .025 });
}

// fountain on the plaza
const FOUNT = V(16, .3, 44);
{
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, .9, 40, 1, true), paint(new THREE.MeshStandardMaterial({ color: '#e8e2d6', roughness: .8, side: THREE.DoubleSide })));
  basin.position.set(FOUNT.x, .75, FOUNT.z); basin.castShadow = true; scene.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, .1, 40), paint(new THREE.MeshStandardMaterial({ color: '#4cc3ff', roughness: .1 }), false));
  water.position.set(FOUNT.x, .95, FOUNT.z); scene.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 2.2, 16), paint(new THREE.MeshStandardMaterial({ color: '#e8e2d6', roughness: .8 })));
  pillar.position.set(FOUNT.x, 1.4, FOUNT.z); pillar.castShadow = true; scene.add(pillar);
}
const jet = new THREE.Mesh(new THREE.CylinderGeometry(.25, .45, 1, 12).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color: '#bfeaff', transparent: true, opacity: .75, roughness: .1 }));
jet.position.set(FOUNT.x, 2.5, FOUNT.z); scene.add(jet);
const DROPS = 70, dropIM = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 6, 4), new THREE.MeshStandardMaterial({ color: '#d6f3ff', roughness: .1 }), DROPS); scene.add(dropIM);
const fountT = colorTime(FOUNT.x, FOUNT.z);

// paint drops thrown up by each landing
const PPER = 26, PART = [];
LANDINGS.forEach((p, i) => { const r = mulberry32(100 + i); for (let k = 0; k < PPER; k++) { const a = r() * Math.PI * 2, el = .5 + r() * .7, sp = 8 + r() * 9; PART.push({ p, t0: p.t, v: V(Math.cos(a) * Math.cos(el) * sp, Math.sin(el) * sp * 1.2, Math.sin(a) * Math.cos(el) * sp), life: .9 + r() * .6, s: .6 + r() * .8, col: BALLC[i % BALLC.length] }); } });
const partIM = new THREE.InstancedMesh(new THREE.SphereGeometry(.3, 8, 6), new THREE.MeshStandardMaterial({ roughness: .4 }), PART.length);
PART.forEach((pp, i) => partIM.setColorAt(i, pp.col)); partIM.castShadow = true; scene.add(partIM);

/* ---------- the ball, with a face ---------- */
const ballRoot = new THREE.Group(), ballYaw = new THREE.Group(), ballBody = new THREE.Group();
const ballMat = new THREE.MeshPhysicalMaterial({ color: BALLC[0], roughness: .22, clearcoat: 1, clearcoatRoughness: .15 });
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), ballMat); ballMesh.castShadow = true;
ballBody.add(ballMesh); ballYaw.add(ballBody); ballRoot.add(ballYaw); scene.add(ballRoot);
const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .3 }), black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: .2 });
const EYES = [-1, 1].map(s => {
  const g = new THREE.Group(); const dir = V(.38 * s, .3, .87).normalize(); g.position.copy(dir.clone().multiplyScalar(R * .93)); g.lookAt(dir.clone().multiplyScalar(5));
  const e = new THREE.Mesh(new THREE.SphereGeometry(.52, 24, 16), white); e.scale.z = .55;
  const pu = new THREE.Mesh(new THREE.SphereGeometry(.27, 16, 12), black); pu.position.z = .26; pu.scale.z = .5;
  const gl = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), white); gl.position.set(.09, .1, .4);
  g.add(e, pu, gl); ballBody.add(g); return { g, pu, gl };
});
const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.5, .05, 0), V(-.25, -.17, .08), V(0, -.24, .1), V(.25, -.17, .08), V(.5, .05, 0)]), 20, .07, 8), black);
smile.position.copy(V(0, -.2, .99).normalize().multiplyScalar(R * .98)); ballBody.add(smile);

/* ---------- the grumpy cloud ---------- */
const cloud = new THREE.Group(), cloudFace = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({ color: '#7d848c', roughness: 1, emissive: '#3e444b' });
[[0, 0, 0, 9], [-9, -1.5, 1, 7], [9, -1, 0, 7.5], [-4, 4.5, -1, 7], [5, 4, -1, 6.5], [-15, -3, -1, 5], [15, -2.5, -1, 5.5], [0, -3, 3, 7]].forEach(s => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(s[3], 32, 20), cloudMat); m.position.set(s[0], s[1], s[2]); m.scale.y = .78; m.castShadow = true; cloud.add(m);
});
const CEYES = [-1, 1].map(s => {
  const e = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 14), white); e.position.set(3.4 * s, .8, 8.6); e.scale.z = .5;
  const pu = new THREE.Mesh(new THREE.SphereGeometry(.85, 16, 12), black); pu.position.set(3.4 * s, .8, 9.4); pu.scale.z = .5;
  const brow = new THREE.Mesh(new THREE.BoxGeometry(3.6, .7, .6), new THREE.MeshStandardMaterial({ color: '#3a3f46' })); brow.position.set(3.4 * s, 3.2, 9);
  cloudFace.add(e, pu, brow); return { e, pu, brow, s };
});
const cmouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-2.2, 0, 0), V(-1.1, .9, .1), V(0, 1.2, .2), V(1.1, .9, .1), V(2.2, 0, 0)]), 24, .28, 8), black);
cmouth.position.set(0, -2.6, 9.2); cloudFace.add(cmouth); cloud.add(cloudFace); scene.add(cloud);
const CLOUD_TOWER = V(-14, 108.5, 84);
const CLOUDS = []; {
  const dt = 1 / 240, om = 2.2; const p = V(0, 72, -70), v = V(0, 0, 0);
  for (let i = 0; i <= DUR * 240; i++) {
    const t = i * dt; let tg;
    if (t < 5) tg = V(0, 72, -70);
    else if (t < 26.5) { const b = ballAt(t); tg = V(b.x, 66, b.z + 4); }
    else tg = CLOUD_TOWER.clone();
    const a = tg.sub(p).multiplyScalar(om * om).addScaledVector(v, -2 * om); v.addScaledVector(a, dt); p.addScaledVector(v, dt);
    if (t > 29.2) p.lerp(CLOUD_TOWER, .2);
    if (i % 4 === 0) CLOUDS.push(p.clone());
  }
}
const cloudAt = t => { const f = clamp(t * 60, 0, CLOUDS.length - 1), i = Math.floor(f); return CLOUDS[i].clone().lerp(CLOUDS[Math.min(i + 1, CLOUDS.length - 1)], f - i); };
// rain under the cloud
const RAIN = 320, rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAIN * 6), 3));
const rainMat = new THREE.LineBasicMaterial({ color: '#c3ccd6', transparent: true, opacity: .6 });
const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; scene.add(rain);
const RSEED = Array.from({ length: RAIN }, (_, i) => { const r = mulberry32(900 + i); return [r() * Math.PI * 2, Math.sqrt(r()) * 13, r()]; });

// the rainbow: seven tubes along one arc, grown with drawRange
const RAINBOW = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#00c7be', '#0a84ff', '#8e5cf7'].map((c, i) => {
  const r = 132 - i * 2.4, pts = []; for (let k = 0; k <= 80; k++) { const a = Math.PI * k / 80; pts.push(V(Math.cos(a) * r, Math.sin(a) * r - 8, 0)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 1.25, 8);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .82, fog: false, depthWrite: false }));
  m.position.set(10, 0, -150); m.rotation.y = .12; m.renderOrder = 2; scene.add(m); return m;
});

/* ---------- postprocessing: depth of field on the ball ---------- */
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 })); composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 30, aperture: .0005, maxblur: .009 }); composer.addPass(bokeh);
composer.addPass(new OutputPass());

/* ---------- one frame of the world ---------- */
const M4 = new THREE.Matrix4(), QQ = new THREE.Quaternion(), SV = V(1, 1, 1), PV = V(0, 0, 0);
function setWorld(t) {
  U.uTime.value = t;
  const after = prog(t, BOOP, BOOP + 2.2), sunny = sstep(after);
  skyMat.uniforms.uS.value = sunny;
  scene.fog.color.copy(FOG_GREY).lerp(FOG_SUN, sunny); scene.fog.near = lerp(120, 260, sunny); scene.fog.far = lerp(520, 1100, sunny);
  hemi.intensity = lerp(1.05, 1.15, sunny); hemi.color.set('#c9d2db').lerp(new THREE.Color('#dff1ff'), sunny);
  sun.intensity = lerp(.9, 2.7, sunny); sun.color.set('#e8eef5').lerp(new THREE.Color('#fff1d6'), sunny);
  renderer.toneMappingExposure = lerp(.95, 1.05, sunny);

  // camera
  const c = camAt(t); camera.position.copy(c.p); camera.lookAt(c.l);
  const b = ballAt(t);
  bokeh.uniforms.focus.value = camera.position.distanceTo(b); bokeh.uniforms.aperture.value = c.ap;

  // ball: position, squash & stretch, colour, face direction, blinks
  ballRoot.position.copy(b);
  const sq = squashAt(t), vy = ballVel(t).y, st = Math.min(.2, Math.abs(vy) / 240) * (1 - clamp(sq * 3));
  ballBody.scale.set((1 + .24 * sq) / Math.sqrt(1 + st), (1 - .4 * sq) * (1 + st), (1 + .24 * sq) / Math.sqrt(1 + st));
  ballBody.position.y = -.4 * sq * R;
  ballMat.color.copy(ballColorAt(t));
  let yaw = headS(Math.min(t, 33));
  if (t > 34.2) { const cp = camAt(t).p; const ty = Math.atan2(cp.x - b.x, cp.z - b.z); let d = ty - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; yaw += d * sstep(prog(t, 34.2, 35.6)); }
  ballYaw.rotation.y = yaw;
  const blink = [6.6, 11.3, 16.9, 23.3, 36.1].some(bt => Math.abs(t - bt) < .07);
  const wink = t > 37.6 && t < 38.05;
  EYES.forEach((e, i) => {
    e.g.scale.y = blink || (wink && i === 0) ? .12 : 1;
    const up = t > 27.6 && t < 30.4 ? .17 : 0; e.pu.position.set(0, up, .26); e.gl.position.set(.09, .1 + up, .4);
  });

  // buildings wobble like jelly when hit
  BUILD.forEach(B => {
    let s = 0; B.hits.forEach(h => { const a = t - h.t; if (a > 0 && a < 2) s += h.a * Math.exp(-5 * a) * Math.sin(17 * a); });
    if (B.hero && t > BOOP) s += .03 * Math.exp(-4 * (t - BOOP - .1)) * Math.sin(15 * (t - BOOP - .1)) * (t > BOOP + .1 ? 1 : 0);
    B.m.scale.set(B.w * (1 - s * .5), B.h * (1 + s), B.d * (1 - s * .5));
  });

  // trees
  TREES.forEach((tr, i) => {
    const a = t - tr.ta, s = a < 0 ? .45 : 1 - .55 * Math.exp(-6 * a) * Math.cos(16 * a);
    M4.compose(PV.set(tr.x, .3, tr.z), QQ.identity(), SV.set(tr.s, tr.s, tr.s)); trunkIM.setMatrixAt(i, M4);
    M4.compose(PV.set(tr.x, .3 + 3.4 * tr.s, tr.z), QQ.identity(), SV.set(tr.s * s, tr.s * s, tr.s * s)); crownIM.setMatrixAt(i, M4);
  });
  trunkIM.instanceMatrix.needsUpdate = crownIM.instanceMatrix.needsUpdate = true;

  // cars
  CARS.forEach(cr => {
    const a = Math.max(0, t - cr.ta), dist = a < 1 ? .5 * a * a : a - .5;
    const p = rectPath(cr.b, cr.s0 + dist * 9 / 27);
    cr.g.position.set(p.x, .3, p.z); cr.g.rotation.y = -p.head;
  });

  // balloons
  BALLOONS.forEach(bl => {
    const a = t - bl.t0;
    const y = a < 0 ? bl.y0 : bl.y0 + bl.v * a + 1.2 * a * a;
    bl.g.position.set(bl.x + (a > 0 ? Math.sin(a * 2 + bl.ph) * .8 * Math.min(1, a) : 0), y, bl.z + (a > 0 ? Math.cos(a * 1.6 + bl.ph) * .8 * Math.min(1, a) : 0));
    bl.g.rotation.z = a > 0 ? Math.sin(a * 2.4 + bl.ph) * .15 : 0;
    bl.g.visible = y < 260;
  });

  // fountain
  const fa = t - fountT, jh = fa < 0 ? 0 : Math.min(1, fa * 2) * (5 + .4 * Math.sin(t * 9));
  jet.scale.set(1, Math.max(.001, jh), 1); jet.visible = jh > .01;
  for (let i = 0; i < DROPS; i++) {
    const per = 1.1, ph = ((t * 1 + i / DROPS * per) % per), ang = i * 2.399, sp = 2.6 + (i % 5) * .3;
    const vis = fa > ph + .2;
    const x = Math.cos(ang) * sp * ph, z = Math.sin(ang) * sp * ph, y = 2.5 + jh - 2 + 6 * ph - 9.8 * ph * ph * 1.2;
    M4.compose(PV.set(FOUNT.x + x, Math.max(.95, y), FOUNT.z + z), QQ.identity(), SV.setScalar(vis ? 1 : 0)); dropIM.setMatrixAt(i, M4);
  }
  dropIM.instanceMatrix.needsUpdate = true;

  // paint drops
  PART.forEach((pp, i) => {
    const a = t - pp.t0; let s = 0;
    if (a > 0 && a < pp.life) {
      const y0 = pp.p.y + .5, p = V(pp.p.x + pp.v.x * a, y0 + pp.v.y * a - 15 * a * a, pp.p.z + pp.v.z * a);
      if (p.y < pp.p.y + .1) p.y = pp.p.y + .1;
      s = pp.s * (1 - Math.pow(a / pp.life, 3)); PV.copy(p);
    }
    M4.compose(PV, QQ.identity(), SV.setScalar(s)); partIM.setMatrixAt(i, M4);
  });
  partIM.instanceMatrix.needsUpdate = true;

  // cloud: follows, rains, gets booped, cheers up
  const cp = cloudAt(t), bob = Math.sin(t * 1.3) * .8;
  cloud.position.set(cp.x, cp.y + bob, cp.z);
  const ba = t - BOOP, hit = ba > 0 ? Math.exp(-4 * ba) * Math.sin(16 * ba) : 0;
  cloud.scale.set(1 + .12 * hit, 1 - .2 * hit, 1 + .12 * hit);
  const happy = sstep(prog(t, BOOP + .05, BOOP + .5));
  const wh = sstep(prog(t, BOOP, BOOP + .9)); cloudMat.color.set('#7d848c').lerp(new THREE.Color('#ffffff'), wh); cloudMat.emissive.set('#3e444b').lerp(new THREE.Color('#b9c4cf'), wh);
  cloudFace.rotation.y = Math.atan2(camera.position.x - cloud.position.x, camera.position.z - cloud.position.z);
  const toBall = b.clone().sub(cloud.position).applyAxisAngle(V(0, 1, 0), -cloudFace.rotation.y).normalize();
  CEYES.forEach(e => {
    e.brow.rotation.z = lerp(e.s * -.38, e.s * .25, happy); e.brow.position.y = lerp(2.9, 3.9, happy);
    e.pu.position.x = 3.4 * e.s + toBall.x * .55; e.pu.position.y = .8 + toBall.y * .55;
    const sq = ba > 0 && ba < .35 ? .15 : 1; e.e.scale.y = sq; e.pu.scale.y = sq;
  });
  cmouth.rotation.z = Math.PI * happy; cmouth.position.y = lerp(-2.6, -2.2, happy);
  // rain follows the cloud and stops after the boop
  const ro = .6 * (1 - prog(t, BOOP, BOOP + .5)); rainMat.opacity = ro; rain.visible = ro > .01;
  if (rain.visible) {
    const arr = rainGeo.attributes.position.array, top = cp.y - 5;
    RSEED.forEach((s, i) => { const x = cp.x + Math.cos(s[0]) * s[1], z = cp.z + Math.sin(s[0]) * s[1], y = top - ((s[2] * top + t * 48) % top); arr.set([x, y, z, x - .1, y - 1.6, z], i * 6); });
    rainGeo.attributes.position.needsUpdate = true;
  }
  // rainbow grows across the sky
  RAINBOW.forEach((m, i) => { const g = sstep(prog(t, BOOP + .4 + i * .06, BOOP + 2.6 + i * .06)); m.geometry.setDrawRange(0, Math.floor(160 * g) * 8 * 6); m.visible = g > 0; });
  sun.target.position.set(0, 0, 0);
}

/* ---------- titles drawn over the 3D frame ---------- */
const out = document.getElementById('out'); out.width = W; out.height = H;
const oc = out.getContext('2d'), k = W / 1920;
const TITLE = 'ГОРОД КРАСОК', TCOL = ['#ff3d7f', '#ffb000', '#00c2a8', '#3d8bff', '#9b5cff', '#ff6b2c', '', '#22c55e', '#ff4fd8', '#00b7ff', '#ffd400', '#ff3d7f'];
function overlay(t) {
  // intro: grey words, the only grey text in the film
  [['Серый город.', .6, 820], ['Серый день.', 1.5, 920]].forEach(([s, t0, y]) => {
    const a = prog(t, t0, t0 + .5) * (1 - prog(t, 3.5, 4.1)); if (a <= 0) return;
    oc.save(); oc.globalAlpha = a; oc.font = `900 ${84 * k}px Unb`; oc.textAlign = 'center'; oc.textBaseline = 'middle';
    oc.fillStyle = 'rgba(0,0,0,.25)'; oc.fillText(s, W / 2 + 4 * k, (y + 6) * k + (1 - a) * 20 * k);
    oc.fillStyle = '#e4e7ea'; oc.fillText(s, W / 2, y * k + (1 - a) * 20 * k); oc.restore();
  });
  // finale: each letter bounces in like the ball
  if (t > 38) {
    oc.save(); oc.font = `900 ${150 * k}px Unb`; oc.textBaseline = 'alphabetic';
    const widths = [...TITLE].map(ch => oc.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0) + 6 * k * (TITLE.length - 1);
    let x = W / 2 - total / 2;
    [...TITLE].forEach((ch, i) => {
      const a = t - (38 + i * .09), w = widths[i];
      if (ch !== ' ' && a > 0) {
        const fall = a < .35 ? 1 - Math.pow(a / .35, 2) : 0, bounce = a >= .35 ? Math.abs(Math.sin((a - .35) * 9)) * Math.exp(-(a - .35) * 4) * .35 : 0;
        const land = a > .33 && a < .45 ? 1 - Math.abs(a - .39) / .06 : 0;
        const y = 300 * k - (fall + bounce) * 380 * k;
        oc.save(); oc.translate(x + w / 2, y); oc.scale(1 + .18 * land, 1 - .25 * land);
        oc.fillStyle = 'rgba(0,0,0,.28)'; oc.fillText(ch, -w / 2 + 6 * k, 8 * k);
        oc.fillStyle = TCOL[i] || '#fff'; oc.fillText(ch, -w / 2, 0);
        oc.restore();
      }
      x += w + 6 * k;
    });
    const sa = prog(t, 40.6, 41.3);
    if (sa > 0) { oc.globalAlpha = sa; oc.font = `600 ${46 * k}px Inter`; oc.textAlign = 'center'; oc.fillStyle = 'rgba(0,0,0,.3)'; oc.fillText('один мячик — и всё ожило', W / 2 + 3 * k, 395 * k + 3 * k); oc.fillStyle = '#ffffff'; oc.fillText('один мячик — и всё ожило', W / 2, 395 * k); }
    oc.restore();
  }
  // gentle vignette and the fade in / out
  const v = oc.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)');
  oc.fillStyle = v; oc.fillRect(0, 0, W, H);
  const fade = Math.max(1 - prog(t, 0, .5), prog(t, DUR - .6, DUR));
  if (fade > 0) { oc.fillStyle = `rgba(0,0,0,${fade})`; oc.fillRect(0, 0, W, H); }
}

/* ---------- motion blur: average sub-frames when the picture moves fast ---------- */
function screenSpeed(t) {
  const d = 1 / 120, pts = [ballAt(t), camAt(t).l];
  let m = 0; const cam2 = camera.clone();
  pts.forEach(p => {
    const c0 = camAt(t - d), c1 = camAt(t + d);
    cam2.position.copy(c0.p); cam2.lookAt(c0.l); cam2.updateMatrixWorld(); const a = (p === pts[0] ? ballAt(t - d) : p).clone().project(cam2);
    cam2.position.copy(c1.p); cam2.lookAt(c1.l); cam2.updateMatrixWorld(); const b = (p === pts[0] ? ballAt(t + d) : p).clone().project(cam2);
    if (a.z < 1 && b.z < 1) m = Math.max(m, Math.hypot((b.x - a.x) * W / 2, (b.y - a.y) * H / 2));
  });
  // whole-frame rotation from the camera turning
  const l0 = camAt(t - d), l1 = camAt(t + d);
  const ang = l0.l.clone().sub(l0.p).normalize().angleTo(l1.l.clone().sub(l1.p).normalize());
  return Math.max(m, ang / (camera.fov * Math.PI / 180) * H);
}
window.__prof = t => {
  const gl = renderer.getContext(), px = new Uint8Array(4), fin = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const time = f => { fin(); const a = performance.now(); f(); fin(); return Math.round(performance.now() - a); };
  setWorld(t); composer.render(); fin();
  const r = {};
  r.setWorld = time(() => setWorld(t));
  r.full = time(() => composer.render());
  r.plain = time(() => renderer.render(scene, camera));
  renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); renderer.render(scene, camera); fin();
  r.noShadow = time(() => renderer.render(scene, camera));
  renderer.shadowMap.enabled = true; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); renderer.render(scene, camera); fin();
  r.calls = renderer.info.render.calls;
  r.png = time(() => out.toDataURL('image/png'));
  return r;
};
window.renderFrame = t => {
  const n = clamp(Math.ceil(screenSpeed(t) / 18), 1, 3);
  oc.globalAlpha = 1;
  for (let i = 0; i < n; i++) {
    const ts = n === 1 ? t : t + (i / (n - 1) - .5) * (1 / 120);
    setWorld(ts); composer.render();
    oc.globalAlpha = 1 / (i + 1); oc.drawImage(glCanvas, 0, 0);
  }
  oc.globalAlpha = 1; setWorld(t);
  overlay(t);
  return n;
};

/* ---------- sound cues from the same timeline ---------- */
function buildCues() {
  cue('rain', 0, { d: BOOP + .5 });
  [1.9, 14.2, 25.2].forEach(t => cue('grumble', t));
  cue('whistle', 4.0, { d: 1.0 });
  LANDINGS.forEach((p, i) => {
    cue('boing', p.t, { i, big: i === 0 ? 1 : 0 }); cue('splat', p.t, { big: i === 0 ? 1 : 0 }); cue('note', p.t + .02, { i });
    if (p.kind === 'r') cue('wobble', p.t + .05);
  });
  cue('balloons', 13.04, { d: 1.2 });
  cue('fountain', fountT, { d: 5 });
  CARS.map(c => c.ta).filter(t => t < 40).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > .8).slice(0, 4).forEach(t => cue('beep', t));
  cue('riser', 27.0, { d: BOOP - 27.0 }); cue('boop', BOOP); cue('crash', BOOP + .02); cue('rainbow', BOOP + .4, { d: 2.4 }); cue('swell', BOOP + .05, { d: 2.5 });
  PATH.filter(p => p.kind === 'settle').forEach((p, i) => cue('boing', p.t, { i: 20 + i, small: 1 }));
  cue('ding', 37.6);
  [...TITLE].forEach((ch, i) => { if (ch !== ' ') cue('tick', 38 + i * .09 + .35, { i }); });
}

window.ready = (async () => {
  for (const [fam, url, d] of [['Unb', 'fonts/unbounded-cyrillic-900-normal.woff2', { weight: '900', unicodeRange: 'U+0400-045F' }], ['Unb', 'fonts/unbounded-latin-900-normal.woff2', { weight: '900', unicodeRange: 'U+0000-00FF,U+2000-206F' }], ['Inter', 'fonts/inter-cyrillic.woff2', { weight: '200 600', unicodeRange: 'U+0400-045F' }], ['Inter', 'fonts/inter-latin.woff2', { weight: '200 600', unicodeRange: 'U+0000-00FF,U+2000-206F' }]]) { const f = new FontFace(fam, `url(${url})`, d); await f.load(); document.fonts.add(f); }
  buildCues(); window.SFX = SFX; window.DUR = DUR;
  renderer.compile(scene, camera);
  if (q.has('t')) { renderFrame(+q.get('t')); return true; }
  if (!q.has('render')) { const t0 = performance.now(); const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
  return true;
})();
