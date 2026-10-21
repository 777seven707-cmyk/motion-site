// Renders the scene frame by frame in headless Chromium and encodes it with ffmpeg.
//   node tools/render.mjs stills 0.5 1.2 ...   -> out/stills/t_0.50.png ...
//   node tools/render.mjs video [workers]      -> out/video.mp4 (no audio) + out/sfx.json
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
const FPS = 60, DUR = 63.5, W = 1080, H = 1920;
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html?render`;

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-device-scale-factor=1'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(BASE);
  await page.evaluate(() => window.ready);
  return page;
}
const grab = (page, t) => page.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t)
  .then(u => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'));

const mode = process.argv[2] || 'video';
if (mode === 'stills') {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await page.evaluate(() => window.SFX), null, 1));
  for (const s of process.argv.slice(3)) {
    const t = +s, t0 = Date.now();
    fs.writeFileSync(path.join(dir, `t_${t.toFixed(2)}.png`), await grab(page, t));
    console.log('still', t, Date.now() - t0, 'ms');
  }
} else {
  const workers = +(process.argv[3] || 3), N = FPS * DUR;
  const first = await openPage();
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(await first.evaluate(() => window.SFX), null, 1));
  const per = Math.ceil(N / workers), parts = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = w === 0 ? first : await openPage();
    const a = w * per, b = Math.min(N, a + per), file = path.join(OUT, `part${w}.mp4`); parts[w] = file;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const buf = await grab(page, f / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (w === 0 && (f - a) % 60 === 0) console.log(`w0 ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  fs.writeFileSync(path.join(OUT, 'parts.txt'), parts.map(p => `file '${p}'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'parts.txt'), '-c', 'copy', path.join(OUT, 'video.mp4')], { stdio: 'inherit' }).on('close', r));
  parts.forEach(p => fs.unlinkSync(p)); fs.unlinkSync(path.join(OUT, 'parts.txt'));
  console.log('video done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close(); server.close();
