/* Виниловая пластинка: DOM-сборка и геометрия трещин/осколков.
   Один набор «лучей-трещин» используется и для линий трещин (SVG),
   и для осколков (clip-path), поэтому осколки ломаются ровно по трещинам. */
window.Record = (function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const RADII = [0, 0.2, 0.4, 0.6, 0.8, 1.15];
  const RING = 2; // индекс радиуса, по которому проходит кольцевая трещина

  const pt = (a, r, off = 0) => ({
    x: Math.cos(a) * r - Math.sin(a) * off,
    y: Math.sin(a) * r + Math.cos(a) * off
  });
  const pc = (p) => `${(50 + p.x * 50).toFixed(2)}% ${(50 + p.y * 50).toFixed(2)}%`;
  const sv = (p) => `${(50 + p.x * 50).toFixed(2)} ${(50 + p.y * 50).toFixed(2)}`;
  const clampDisc = (p) => {
    const r = Math.hypot(p.x, p.y);
    return r > 1 ? { x: p.x / r, y: p.y / r } : p;
  };

  function geometry(n = 9) {
    const base = rand(0, TAU);
    const rays = [];
    for (let i = 0; i < n; i++) {
      const a = base + (i / n) * TAU + rand(-0.18, 0.18);
      const pts = RADII.map((r, k) => pt(a, r, k > 0 && k < RADII.length - 1 ? rand(-0.045, 0.045) : 0));
      rays.push({ a, pts });
    }

    const pieces = [];
    const rings = [];
    for (let i = 0; i < n; i++) {
      const A = rays[i];
      const B = rays[(i + 1) % n];
      const bAngle = i + 1 < n ? B.a : B.a + TAU;
      const mid = (A.a + bAngle) / 2;
      const ringMid = pt(mid, RADII[RING] + rand(-0.05, 0.05));
      rings.push({ from: A.pts[RING], mid: ringMid, to: B.pts[RING] });

      const inner = [...A.pts.slice(0, RING + 1), ringMid, ...B.pts.slice(0, RING + 1).reverse()];
      const outer = [
        ...A.pts.slice(RING),
        pt(mid, 1.5),
        ...B.pts.slice(RING).reverse(),
        ringMid
      ];
      [['inner', inner], ['outer', outer]].forEach(([tier, pts]) => {
        const c = pts.map(clampDisc).reduce((s, p) => ({ x: s.x + p.x, y: s.y + p.y }), { x: 0, y: 0 });
        const cx = c.x / pts.length;
        const cy = c.y / pts.length;
        pieces.push({
          tier,
          cx,
          cy,
          ang: Math.atan2(cy, cx),
          clip: `polygon(${pts.map(pc).join(',')})`,
          origin: `${(50 + cx * 50).toFixed(1)}% ${(50 + cy * 50).toFixed(1)}%`
        });
      });
    }
    return { rays, rings, pieces };
  }

  /** Линии трещин в координатах SVG viewBox 0..100. */
  function crackPaths(geo) {
    const d = geo.rays.map((r) => 'M' + sv(r.pts[0]) + ' ' + r.pts.slice(1, 5).map((p) => 'L' + sv(p)).join(' '));
    geo.rings.forEach((g) => {
      if (Math.random() > 0.25) d.push(`M${sv(g.from)} L${sv(g.mid)} L${sv(g.to)}`);
    });
    return d;
  }

  function element(label = 'BROKEN<br>VINYL') {
    const rec = document.createElement('div');
    rec.className = 'rec';
    rec.innerHTML =
      '<div class="disc"><div class="label"><span>' + label + '</span></div><div class="hole"></div></div>' +
      '<div class="sheen"></div>';
    return rec;
  }

  /** «Взорванная» пластинка для hero: те же осколки, но висят с зазорами и дрейфуют. */
  function exploded(container) {
    const geo = geometry(9);
    geo.pieces.forEach((p, i) => {
      const s = element();
      s.classList.add('piece');
      s.style.clipPath = p.clip;
      s.style.transformOrigin = p.origin;
      const d = (p.tier === 'inner' ? 7 : 13) * rand(0.7, 1.3);
      s.style.setProperty('--dx', (Math.cos(p.ang) * d).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(p.ang) * d).toFixed(1) + 'px');
      s.style.setProperty('--r', rand(-2.5, 2.5).toFixed(2) + 'deg');
      s.style.setProperty('--i', i);
      container.appendChild(s);
    });
    return geo;
  }

  return { geometry, crackPaths, element, exploded };
})();
