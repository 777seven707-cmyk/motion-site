// Renders the 3D film frame by frame in headless Chromium (SwiftShader WebGL) and encodes with ffmpeg.
//   node tools/render.mjs stills <w> <h> t1 t2 ...         -> out/stills/t_<t>.png
//   node tools/render.mjs video <w> <h> <fps> <workers>    -> out/video_<w>.mp4 + out/sfx.json
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));

const [mode, w, h] = [process.argv[2], +process.argv[3] || 1920, +process.argv[4] || 1080];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render&w=${w}&h=${h}`);
  await page.evaluate(() => window.ready);
  return page;
}
const grab = (page, t) => page.evaluate(t => { const n = renderFrame(t); window.lastN = n; return document.getElementById('out').toDataURL('image/png'); }, t)
  .then(u => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'));

if (mode === 'stills') {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await page.evaluate(() => window.SFX), null, 1));
  for (const s of process.argv.slice(5)) { const t0 = Date.now(); fs.writeFileSync(path.join(dir, `t_${(+s).toFixed(2)}.png`), await grab(page, +s)); console.log('still', s, Date.now() - t0, 'ms', 'sub', await page.evaluate(() => window.lastN)); }
} else if (mode === 'chunks') {
  // resumable: each 4-second chunk is its own finished file; rerun to continue after an interruption
  const fps = +process.argv[5] || 60, workers = +process.argv[6] || 1, CH = fps * 4;
  const dir = path.join(OUT, `chunks_${w}`); fs.mkdirSync(dir, { recursive: true });
  const first = await openPage();
  const DUR = await first.evaluate(() => window.DUR);
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await first.evaluate(() => window.SFX), null, 1));
  const N = Math.round(DUR * fps), count = Math.ceil(N / CH), name = c => path.join(dir, `c_${String(c).padStart(3, '0')}.mp4`);
  const todo = []; for (let c = 0; c < count; c++) if (!fs.existsSync(name(c))) todo.push(c);
  console.log(`${count - todo.length}/${count} chunks already done`);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, k) => {
    const page = k === 0 ? first : await openPage();
    while (todo.length) {
      const c = todo.shift(), tmp = name(c) + '.part.mp4', ct = Date.now();
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = c * CH; f < Math.min(N, (c + 1) * CH); f++) {
        const buf = await grab(page, f / fps);
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); await new Promise(r => ff.on('close', r));
      fs.renameSync(tmp, name(c));
      console.log(`chunk ${c} done in ${((Date.now() - ct) / 1000).toFixed(0)}s, total ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  const done = []; for (let c = 0; c < count; c++) if (fs.existsSync(name(c))) done.push(name(c));
  if (done.length === count) {
    const list = path.join(OUT, 'chunks.txt'); fs.writeFileSync(list, done.map(p => `file '${p}'`).join('\n'));
    await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, `video_${w}.mp4`)], { stdio: 'inherit' }).on('close', r));
    console.log('video done');
  }
} else {
  const fps = +process.argv[5] || 60, workers = +process.argv[6] || 3;
  const first = await openPage();
  const DUR = await first.evaluate(() => window.DUR);
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await first.evaluate(() => window.SFX), null, 1));
  const N = Math.round(DUR * fps), per = Math.ceil(N / workers), parts = [], t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, k) => {
    const page = k === 0 ? first : await openPage();
    const a = k * per, b = Math.min(N, a + per), file = path.join(OUT, `part${k}.mp4`); parts[k] = file;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const buf = await grab(page, f / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (k === 0 && (f - a) % 60 === 0) console.log(`w0 ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  const list = path.join(OUT, 'parts.txt'); fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, `video_${w}.mp4`)], { stdio: 'inherit' }).on('close', r));
  parts.forEach(p => fs.unlinkSync(p)); fs.unlinkSync(list);
  console.log('video done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close(); server.close();
