(function () {
  const G = window.GENRES;
  const byId = Object.fromEntries(G.map((g) => [g.id, g]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgb(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f)).join(',') + ')';
  };
  const initials = (name) => {
    const w = name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : name.slice(0, 2)).toUpperCase();
  };
  const colorVars = (g) => `--c1:${g.color};--c2:${g.color2};--c1d:${shade(g.color, 0.5)}`;

  const main = $('#home');
  const view = $('#genre-view');
  const REVEALS = ['up', 'left', 'right', 'zoom', 'rotate'];

  /* ---------- главная: карточки жанров ---------- */
  function renderGrid() {
    $('#grid').innerHTML = G.map((g, i) => `
      <a class="card reveal" href="#/genre/${g.id}" data-id="${g.id}" data-anim="${REVEALS[i % REVEALS.length]}" style="${colorVars(g)};--d:${(i % 3) * 90}ms">
        <div class="card-in">
          <div class="peek"><span class="vinyl"><i></i></span></div>
          <div class="sleeve">
            <span class="idx">${pad(i + 1)}</span>
            <h3>${esc(g.name)}</h3>
            <p class="tag">${esc(g.tag)}</p>
            <ul>${g.artists.slice(0, 3).map((a) => `<li>${esc(a.name)}</li>`).join('')}</ul>
            <span class="go">Открыть <b>→</b></span>
            <div class="match"></div>
          </div>
        </div>
      </a>`).join('');

    const row = G.map((g) => `<span>${esc(g.name)}</span><i></i>`).join('');
    $('#marqueeA').innerHTML = row + row;
    $('#marqueeB').innerHTML = row + row;
  }

  function setupHero() {
    Record.exploded($('#heroRec'));
    const total = G.reduce((s, g) => s + g.artists.length, 0);
    const targets = { genres: G.length, artists: total };
    $$('[data-count]').forEach((el) => {
      const to = targets[el.dataset.count];
      let started = false;
      const run = () => {
        if (started) return;
        started = true;
        const t0 = performance.now();
        (function step(now) {
          const k = Math.min(1, (now - t0) / 1400);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      };
      new MutationObserver((_, o) => { if (document.body.classList.contains('ready')) { setTimeout(run, 500); o.disconnect(); } })
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
      if (document.body.classList.contains('ready')) run();
    });
  }

  /* ---------- появление при прокрутке ---------- */
  function setupReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* ---------- 3D-наклон карточек ---------- */
  function setupTilt() {
    if (!matchMedia('(hover:hover)').matches) return;
    $('#grid').addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      card.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg');
      card.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
    });
    $('#grid').addEventListener('pointerout', (e) => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    });
    $('#grid').addEventListener('pointerover', (e) => { if (e.target.closest('.card')) SFX.tick(); });
  }

  /* ---------- поиск ---------- */
  function setupSearch() {
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
    const input = $('#q');
    input.addEventListener('input', () => {
      const q = norm(input.value.trim());
      let shown = 0;
      $$('.card').forEach((card) => {
        const g = byId[card.dataset.id];
        const nameHit = !q || norm(g.name + ' ' + g.tag).includes(q);
        const hits = q ? g.artists.filter((a) => norm(a.name).includes(q)) : [];
        const show = nameHit || hits.length > 0;
        card.classList.toggle('dim', !show);
        $('.match', card).textContent = hits.length && !nameHit ? 'Найдено: ' + hits.map((h) => h.name).join(', ') : '';
        if (show) shown++;
      });
      $('#empty').hidden = shown > 0;
    });
  }

  /* ---------- страница жанра ---------- */
  function renderView(g) {
    const i = G.indexOf(g);
    const prev = G[(i - 1 + G.length) % G.length];
    const next = G[(i + 1) % G.length];
    view.style.cssText = colorVars(g);
    view.dataset.anim = g.anim;
    const letters = [...g.name].map((ch, k) => (ch === ' ' ? '<span class="sp"> </span>' : `<span class="ch" style="--i:${k}">${esc(ch)}</span>`)).join('');

    view.innerHTML = `
      <div class="v-bg" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="v-bar">
        <a class="v-back" href="./" data-back><b>←</b> Все жанры</a>
        <div class="v-pager">
          <a href="#/genre/${prev.id}" data-id="${prev.id}" aria-label="Предыдущий: ${esc(prev.name)}"><b>←</b><span>${esc(prev.name)}</span></a>
          <em>${pad(i + 1)} / ${pad(G.length)}</em>
          <a href="#/genre/${next.id}" data-id="${next.id}" aria-label="Следующий: ${esc(next.name)}"><span>${esc(next.name)}</span><b>→</b></a>
        </div>
      </div>
      <div class="v-hero">
        <p class="v-kicker">${pad(i + 1)} — ${esc(g.tag)}</p>
        <h2 class="v-title" style="--len:${[...g.name].length}" aria-label="${esc(g.name)}">${letters}</h2>
        <p class="v-desc">${esc(g.desc)}</p>
        <div class="v-vinyl" aria-hidden="true"><span class="vinyl big"><i></i></span></div>
      </div>
      <ol class="artists">
        ${g.artists.map((a, k) => `
          <li class="artist" style="--i:${k};--a:${(k * 47) % 360}deg">
            <span class="rank">${pad(k + 1)}</span>
            <span class="avatar">${esc(initials(a.name))}</span>
            <div class="who">
              <h3>${esc(a.name)}</h3>
              <p>${esc(a.country)}</p>
            </div>
            <ul class="hits">${a.hits.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
            <a class="listen" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(a.name + ' ' + a.hits[0])}">Слушать <b>↗</b></a>
          </li>`).join('')}
      </ol>
      <a class="v-next" href="#/genre/${next.id}" data-id="${next.id}" style="--n1:${next.color};--n2:${shade(next.color, 0.55)}">
        <span>Следующий жанр</span>
        <strong>${esc(next.name)} <b>→</b></strong>
      </a>`;
  }

  let current = null;
  let busy = false;
  let pending = undefined;

  function setView(id) {
    current = id;
    if (!id) {
      view.hidden = true;
      view.classList.remove('play');
      document.body.classList.remove('view-open');
      main.inert = false;
      document.title = 'Broken Vinyl — атлас музыкальных жанров';
      return;
    }
    const g = byId[id];
    renderView(g);
    view.classList.remove('play');
    view.hidden = false;
    view.scrollTop = 0;
    document.body.classList.add('view-open');
    main.inert = true;
    document.title = g.name + ' — Broken Vinyl';
  }

  const parseHash = () => {
    const m = location.hash.match(/^#\/genre\/([\w-]+)/);
    return m && byId[m[1]] ? m[1] : null;
  };
  const urlFor = (id) => (id ? '#/genre/' + id : location.pathname + location.search);

  async function navigate(id, o = {}) {
    if (id === current) return;
    if (busy) { pending = id; return; }
    busy = true;
    const eff = byId[id || current];
    let x = o.x, y = o.y;
    if (x == null) { x = innerWidth / 2; y = innerHeight / 2; }
    await Transition.run({
      effect: eff.fx,
      color: eff.color,
      color2: eff.color2,
      label: id ? byId[id].name : 'Все жанры',
      x, y
    }, {
      swap() {
        setView(id);
        if (o.push !== false) history.pushState({ id }, '', urlFor(id));
      },
      reveal() { view.classList.add('play'); }
    });
    busy = false;
    if (pending !== undefined) {
      const p = pending;
      pending = undefined;
      if (p !== current) navigate(p, { push: false });
    }
  }

  function setupNav() {
    $('#grid').addEventListener('click', (e) => {
      const a = e.target.closest('.card');
      if (!a) return;
      e.preventDefault();
      const r = a.getBoundingClientRect();
      navigate(a.dataset.id, e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    view.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a || a.target === '_blank') return;
      if (a.hasAttribute('data-back')) { e.preventDefault(); navigate(null, { x: e.clientX, y: e.clientY }); }
      else if (a.dataset.id) { e.preventDefault(); navigate(a.dataset.id, { x: e.clientX, y: e.clientY }); }
    });
    addEventListener('popstate', () => navigate(parseHash(), { push: false }));
    addEventListener('keydown', (e) => {
      if (!current || e.target.matches('input')) return;
      const i = G.indexOf(byId[current]);
      if (e.key === 'Escape') navigate(null);
      else if (e.key === 'ArrowRight') navigate(G[(i + 1) % G.length].id);
      else if (e.key === 'ArrowLeft') navigate(G[(i - 1 + G.length) % G.length].id);
    });
  }

  /* ---------- курсор и звук ---------- */
  function setupCursor() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const c = $('.cursor');
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    (function loop() {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      c.style.transform = `translate(${cx}px,${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', (e) => {
      c.classList.toggle('big', !!e.target.closest('a,button,input,.card'));
    });
  }

  function setupSound() {
    const b = $('#soundToggle');
    b.addEventListener('click', () => SFX.toggle());
    SFX.onChange((on) => {
      b.setAttribute('aria-pressed', on);
      $('.lbl', b).textContent = on ? 'Звук вкл' : 'Звук выкл';
    });
  }

  /* ---------- старт ---------- */
  renderGrid();
  setupHero();
  setupReveal();
  setupTilt();
  setupSearch();
  setupNav();
  setupCursor();
  setupSound();

  runIntro().then(() => {
    const id = parseHash();
    if (id) { setView(id); view.classList.add('play'); }
  });
})();
