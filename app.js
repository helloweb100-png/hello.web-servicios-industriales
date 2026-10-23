/* ==========================================================================
   SERVICIOS INDUSTRIALES — app.js
   Vanilla JS, sin dependencias.

   Índice
   01 Utilidades y estado        07 Menú móvil · acordeón · ciclo · FAQ
   02 WhatsApp                   08 Tilt · magnético · cursor
   03 Preloader                  09 Marquesinas
   04 Texto: split + scrub       10 Escenarios fijados (servicios, imagen, galería, método)
   05 Reveals y contadores       11 Hero: canvas + parallax + verbos
   06 Scroll spy                 12 Formulario → WhatsApp · bucle principal
   ========================================================================== */
(() => {
  'use strict';

  /* 01 ─── UTILIDADES Y ESTADO ──────────────────────────────────────────── */
  const WA_NUMBER = '526563008331';           // +52 656 300 8331
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const rand = (a, b) => a + Math.random() * (b - a);
  const root = document.documentElement;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktopMQ = window.matchMedia('(min-width: 1024px)');
  if (reduce) root.classList.add('no-pin');

  const S = { y: 0, sy: 0, vel: 0, vh: window.innerHeight, vw: window.innerWidth, docH: 1 };
  const pinMode = () => desktopMQ.matches && !reduce;

  /* 02 ─── WHATSAPP ─────────────────────────────────────────────────────── */
  const waURL = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  function setupWhatsApp() {
    $$('[data-wa]').forEach((a) => { a.href = waURL(a.dataset.wa); });
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* 03 ─── PRELOADER ────────────────────────────────────────────────────── */
  let readyFired = false;
  const readyCallbacks = [];
  const onReady = (fn) => (readyFired ? fn() : readyCallbacks.push(fn));

  function fireReady() {
    if (readyFired) return;
    readyFired = true;
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    readyCallbacks.forEach((fn) => fn());
  }

  function preloader() {
    const pre = $('#preloader');
    if (!pre) { fireReady(); return; }

    const num = $('#pre-num'), bar = $('#pre-bar'), ring = $('#pre-ring'), fill = $('#pre-fill');
    const ticksG = $('.pre__ticks', pre);
    const TICKS = 72, ticks = [];
    if (ticksG) {
      for (let i = 0; i < TICKS; i++) {
        const a = (i / TICKS) * Math.PI * 2, long = i % 6 === 0;
        const r1 = long ? 103 : 106, r2 = 111;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', (110 + Math.cos(a) * r1).toFixed(2)); l.setAttribute('y1', (110 + Math.sin(a) * r1).toFixed(2));
        l.setAttribute('x2', (110 + Math.cos(a) * r2).toFixed(2)); l.setAttribute('y2', (110 + Math.sin(a) * r2).toFixed(2));
        ticksG.appendChild(l); ticks.push(l);
      }
    }

    // Carga real: tipografías + imagen principal del hero + evento load (con tope de seguridad)
    let assetsReady = false;
    const heroImg = $('.pf--a img');
    const imgDone = new Promise((res) => {
      if (!heroImg || heroImg.complete) return res();
      heroImg.addEventListener('load', res, { once: true });
      heroImg.addEventListener('error', res, { once: true });
    });
    const winLoad = new Promise((res) => (document.readyState === 'complete' ? res() : window.addEventListener('load', res, { once: true })));
    Promise.all([document.fonts ? document.fonts.ready : null, imgDone, winLoad]).catch(() => {}).then(() => { assetsReady = true; });

    let seen = false;
    try { seen = sessionStorage.getItem('si-pre') === '1'; sessionStorage.setItem('si-pre', '1'); } catch (e) { /* almacenamiento no disponible */ }
    const minTime = reduce ? 250 : (seen ? 1000 : 2400);
    const t0 = performance.now();
    let p = 0, finished = false;

    function finish() {
      if (finished) return; finished = true;
      pre.classList.add('is-done');
      pre.setAttribute('aria-hidden', 'true');
      setTimeout(fireReady, reduce ? 0 : 520);
      setTimeout(() => pre.classList.add('is-gone'), reduce ? 50 : 1900);
    }

    function step(now) {
      const t = clamp((now - t0) / minTime);
      const eased = 1 - Math.pow(1 - t, 3);
      const cap = assetsReady ? 1 : 0.9;
      p = lerp(p, Math.min(eased, cap), 0.14);
      if (p > 0.996 && assetsReady && t >= 1) p = 1;
      if (num) num.textContent = Math.round(p * 100);
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      if (ring) ring.style.strokeDashoffset = (100 - p * 100).toFixed(2);
      if (fill) fill.style.setProperty('--p', p.toFixed(4));
      const on = Math.floor(p * TICKS);
      for (let i = 0; i < TICKS; i++) ticks[i] && ticks[i].classList.toggle('on', i < on);
      if (p >= 1) { setTimeout(finish, 280); return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(finish, 9000);   // seguridad: nunca bloquear la página
  }

  /* 04 ─── TEXTO: SPLIT + SCRUB ─────────────────────────────────────────── */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('sr-only')) walk(n);
      });
    };
    walk(el);
    el.classList.add('is-split');
  }
  function setupSplit() { $$('[data-split]').forEach(splitWords); }

  const scrubState = { el: null, words: [], last: -1 };
  function setupScrub() {
    const el = $('[data-scrub]'); if (!el) return;
    const keys = new Set(['20', 'años', 'montaje', 'inspección', 'diseño', 'remodelación', 'seguro', 'confiable', 'mexicana']);
    const text = el.textContent.trim();
    el.textContent = '';
    text.split(/\s+/).forEach((word, idx, arr) => {
      const s = document.createElement('span');
      s.className = 'sw' + (keys.has(word.toLowerCase().replace(/[.,;:]/g, '')) ? ' hl' : '');
      s.textContent = word;
      el.appendChild(s);
      if (idx < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    scrubState.el = el; scrubState.words = $$('.sw', el);
    if (reduce) scrubState.words.forEach((w) => w.classList.add('on'));
  }
  function scrubUpdate() {
    const { el, words } = scrubState; if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    const p = clamp((S.vh * 0.82 - (r.top + off())) / (r.height + S.vh * 0.28));
    const n = Math.round(p * (words.length + 3));
    if (n === scrubState.last) return;
    scrubState.last = n;
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* 05 ─── REVEALS Y CONTADORES ─────────────────────────────────────────── */
  function setupReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    $$('[data-reveal], [data-split]').forEach((el) => { if (!el.matches('.hero__title')) io.observe(el); });

    // Contadores (el HTML trae el valor real por si falla JS; aquí se reinician para animarlos)
    $$('[data-count]').forEach((el) => { el.textContent = '0'; });
    const count = (el) => {
      if (el.dataset.done) return; el.dataset.done = '1';
      const target = +el.dataset.count, dur = reduce ? 1 : 1900, t0 = performance.now();
      const tick = (now) => {
        const t = clamp((now - t0) / dur), e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        el.textContent = Math.round(target * e);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => { if (el.closest('.hero')) onReady(() => setTimeout(() => count(el), 700)); else cio.observe(el); });

    // El título del hero entra cuando termina el preloader
    onReady(() => { const h1 = $('.hero__title'); if (h1) requestAnimationFrame(() => h1.classList.add('in')); });
  }

  /* 06 ─── SCROLL SPY ───────────────────────────────────────────────────── */
  function setupSpy() {
    const links = $$('[data-spy]');
    const map = new Map(links.map((a) => [a.dataset.spy, a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = map.get(e.target.id); if (!a) return;
        if (e.isIntersecting) { links.forEach((l) => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); }); a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* 07 ─── MENÚ MÓVIL · ACORDEÓN · CICLO · HOTSPOTS · FAQ ────────────────── */
  function setupMenu() {
    const burger = $('#burger'), menu = $('#menu'); if (!burger || !menu) return;
    let timer;
    const open = () => {
      clearTimeout(timer); menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      document.body.classList.add('menu-open'); root.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Cerrar menú');
    };
    const close = () => {
      menu.classList.remove('is-open'); document.body.classList.remove('menu-open'); root.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú');
      timer = setTimeout(() => { menu.hidden = true; }, 950);
    };
    burger.addEventListener('click', () => (menu.classList.contains('is-open') ? close() : open()));
    $$('a', menu).forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); burger.focus(); } });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches && menu.classList.contains('is-open')) close(); });
  }

  function setupAccordion() {
    const acc = $('[data-acc]'); if (!acc) return;
    const items = $$('.acc__item', acc);
    const activate = (item, force) => {
      const willOpen = force || !item.classList.contains('is-open');
      items.forEach((it) => {
        const open = it === item ? willOpen : false;
        it.classList.toggle('is-open', open);
        $('.acc__btn', it).setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    };
    items.forEach((item) => {
      $('.acc__btn', item).addEventListener('click', () => activate(item, desktopMQ.matches));
      item.addEventListener('mouseenter', () => { if (desktopMQ.matches && finePointer && !item.classList.contains('is-open')) activate(item, true); });
    });
  }

  function setupCycle() {
    const wrap = $('[data-cycle]'); if (!wrap) return;
    const tabs = $$('[role="tab"]', wrap), panels = $$('[role="tabpanel"]', wrap), arcs = $$('.cy-arc', wrap);
    const label = $('[data-cy-label]', wrap), ico = $('.cycle__ico use', wrap);
    const names = ['Predictivo', 'Preventivo', 'Correctivo'], icons = ['#i-bolt', '#i-shield', '#i-wrench'];
    let cur = 0, timer = null, hover = false, visible = false;
    const set = (i, focus) => {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === cur); t.tabIndex = k === cur ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== cur; p.classList.toggle('is-on', k === cur); });
      arcs.forEach((a, k) => a.classList.toggle('is-on', k === cur));
      if (label) label.textContent = names[cur];
      if (ico) ico.setAttribute('href', icons[cur]);
      if (focus) tabs[cur].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { set(i); restart(); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(cur - 1, true); }
      });
    });
    const restart = () => { clearInterval(timer); if (!reduce && visible) timer = setInterval(() => { if (!hover) set(cur + 1); }, 5200); };
    wrap.addEventListener('mouseenter', () => { hover = true; }); wrap.addEventListener('mouseleave', () => { hover = false; });
    wrap.addEventListener('focusin', () => { hover = true; }); wrap.addEventListener('focusout', () => { hover = false; });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(wrap);
    set(0);
  }

  function setupHotspots() {
    const hots = $$('.hot'); if (!hots.length) return;
    hots.forEach((h) => h.addEventListener('click', (e) => {
      e.stopPropagation();
      const was = h.classList.contains('is-open');
      hots.forEach((x) => x.classList.remove('is-open'));
      if (!was) h.classList.add('is-open');
    }));
    document.addEventListener('click', () => hots.forEach((x) => x.classList.remove('is-open')));
    // Pista inicial: abre el primer punto cuando la foto aparece
    const photo = $('.maint__photo');
    if (photo && !reduce) new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { setTimeout(() => hots[0].classList.add('is-open'), 900); setTimeout(() => hots[0].classList.remove('is-open'), 4200); o.disconnect(); } }, { threshold: 0.5 }).observe(photo);
  }

  function setupFaq() {
    const list = $('[data-faq]'); if (!list) return;
    const items = $$('.qa', list);
    const set = (item, open) => { item.classList.toggle('is-open', open); $('button', item).setAttribute('aria-expanded', open ? 'true' : 'false'); };
    items.forEach((item) => {
      set(item, $('button', item).getAttribute('aria-expanded') === 'true');
      $('button', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((it) => set(it, false)); set(item, open);
      });
    });
  }

  /* 08 ─── TILT · MAGNÉTICO · CURSOR ────────────────────────────────────── */
  function setupTilt() {
    if (!finePointer || reduce) return;
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  function setupMagnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(x * 0.16).toFixed(1)}px, ${(y * 0.28).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  const cursor = { el: null, ring: null, label: null, x: 0, y: 0, rx: 0, ry: 0, on: false };
  function setupCursor() {
    if (!finePointer) return;
    cursor.el = $('.cursor'); if (!cursor.el) return;
    cursor.ring = $('.cursor__ring', cursor.el); cursor.label = $('.cursor__ring span', cursor.el);
    window.addEventListener('pointermove', (e) => {
      cursor.x = e.clientX; cursor.y = e.clientY; if (!cursor.on) { cursor.on = true; cursor.rx = e.clientX; cursor.ry = e.clientY; }
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, [role="tab"], summary, label, input, select, textarea');
      cursor.el.classList.toggle('is-label', !!lab);
      cursor.el.classList.toggle('is-link', !lab && !!link);
      if (lab && cursor.label) cursor.label.textContent = lab.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => { cursor.on = false; });
  }
  function cursorFrame() {
    if (!cursor.el || !cursor.on) return;
    cursor.rx = lerp(cursor.rx, cursor.x, 0.16); cursor.ry = lerp(cursor.ry, cursor.y, 0.16);
    cursor.el.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
    cursor.ring.style.transform = `translate3d(${(cursor.rx - cursor.x).toFixed(1)}px, ${(cursor.ry - cursor.y).toFixed(1)}px, 0)`;
  }

  /* 09 ─── MARQUESINAS (con velocidad ligada al scroll) ─────────────────── */
  const marquees = [];
  function setupMarquees() {
    $$('[data-marquee]').forEach((host) => {
      const mover = host.classList.contains('ticker__track') ? host : $('.marq__row', host);
      if (!mover) return;
      const dir = +host.dataset.marquee || 1;
      const base = host.classList.contains('ticker__track') ? 70 : 42;
      const m = { host, mover, dir, base, x: 0, unit: 0, visible: true, slow: 1 };
      marquees.push(m);
      m.build = () => {
        $$('[data-clone]', mover).forEach((c) => c.remove());
        const originals = Array.from(mover.children);
        if (!originals.length) return;
        let guard = 0;
        const unitOf = () => (mover.children.length > originals.length ? mover.children[originals.length].offsetLeft - originals[0].offsetLeft : 0);
        // duplica hasta cubrir 2 veces el ancho visible
        const clone = () => originals.forEach((o) => { const c = o.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); mover.appendChild(c); });
        clone();
        m.unit = unitOf() || mover.scrollWidth / 2;
        while (mover.scrollWidth < host.clientWidth + m.unit * 1.1 && guard++ < 6) clone();
      };
      m.build();
      new IntersectionObserver((en) => { m.visible = en[0].isIntersecting; }, { rootMargin: '120px' }).observe(host);
      if (!host.classList.contains('ticker__track')) {
        host.addEventListener('mouseenter', () => { m.slow = 0.18; });
        host.addEventListener('mouseleave', () => { m.slow = 1; });
      }
    });
    if (document.fonts) document.fonts.ready.then(() => marquees.forEach((m) => m.build()));
  }
  function marqueeFrame(dt) {
    if (reduce) return;
    marquees.forEach((m) => {
      if (!m.visible || !m.unit) return;
      const boost = Math.min(Math.abs(S.vel), 70) * 0.9;
      m.x += m.dir * (m.base * m.slow + boost * m.slow) * (dt / 1000);
      const x = ((m.x % m.unit) + m.unit) % m.unit;
      m.mover.style.transform = `translate3d(${-x}px, 0, 0)`;
    });
  }

  /* 10 ─── ESCENARIOS FIJADOS (sticky) LIGADOS AL SCROLL ────────────────── */
  const scenes = {};
  const off = () => S.y - S.sy;      // diferencia entre scroll real y suavizado

  function measure() {
    S.vh = window.innerHeight; S.vw = window.innerWidth;
    galMeasure();                     // fija la altura de la galería antes de medir lo que sigue
    Object.values(scenes).forEach((sc) => {
      if (!sc.el) return;
      const r = sc.el.getBoundingClientRect();
      sc.top = r.top + window.scrollY; sc.h = sc.el.offsetHeight;
    });
    S.docH = document.documentElement.scrollHeight;
  }

  /* Especialidades ---------------------------------------------------------- */
  function setupServices() {
    const el = $('#servicios'); if (!el) return;
    const panels = $$('.svc', el), btns = $$('.svc-index button', el), prog = $('#svc-prog');
    const sc = (scenes.svc = { el, panels, btns, prog, cur: -2, n: panels.length });

    btns.forEach((b) => b.addEventListener('click', () => {
      if (!pinMode()) return;
      const i = +b.dataset.go, range = sc.h - S.vh;
      window.scrollTo({ top: sc.top + ((i + 0.5) / sc.n) * range, behavior: reduce ? 'auto' : 'smooth' });
    }));

    // Móvil / tablet: cada especialidad se revela al entrar a pantalla
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting && !pinMode()) e.target.classList.add('is-active'); }), { threshold: 0.18 });
    const applyMode = () => {
      panels.forEach((p) => { p.classList.remove('is-past'); io.unobserve(p); });
      if (pinMode()) { panels.forEach((p) => p.classList.remove('is-active')); sc.cur = -2; }
      else if (reduce) panels.forEach((p) => p.classList.add('is-active'));
      else panels.forEach((p) => io.observe(p));
    };
    desktopMQ.addEventListener('change', () => { applyMode(); measure(); });
    applyMode();
  }
  function servicesUpdate() {
    const sc = scenes.svc; if (!sc || !pinMode()) return;
    const range = sc.h - S.vh, p = clamp((S.y - sc.top) / range);
    sc.prog.style.setProperty('--prog', p.toFixed(4));
    const near = S.y > sc.top - S.vh * 0.5;
    const idx = near ? Math.min(sc.n - 1, Math.floor(p * sc.n)) : -1;
    if (idx !== sc.cur) {
      sc.cur = idx;
      sc.panels.forEach((el, k) => { el.classList.toggle('is-active', k === idx); el.classList.toggle('is-past', idx > -1 && k < idx); });
      sc.btns.forEach((b, k) => b.classList.toggle('is-on', k === idx));
    }
    if (idx > -1) {
      const local = clamp(p * sc.n - idx), img = $('.svc__img img', sc.panels[idx]);
      if (img) img.style.setProperty('--py', ((local - 0.5) * -48).toFixed(1) + 'px');
    }
  }

  /* Imagen que se expande ----------------------------------------------------- */
  function setupExpand() {
    const el = $('#a-medida'); if (!el) return;
    scenes.xp = { el, a: -1, b: -1 };
    if (reduce) { el.style.setProperty('--xp', 1); el.style.setProperty('--xp2', 1); el.classList.add('is-copy'); }
  }
  function expandUpdate() {
    const sc = scenes.xp; if (!sc || reduce) return;
    const range = sc.h - S.vh, pp = clamp((S.sy - sc.top) / range);
    const a = smooth(clamp(pp / 0.6)), b = smooth(clamp((pp - 0.58) / 0.32));
    if (Math.abs(a - sc.a) > 0.0005) { sc.a = a; sc.el.style.setProperty('--xp', a.toFixed(4)); }
    if (Math.abs(b - sc.b) > 0.0005) { sc.b = b; sc.el.style.setProperty('--xp2', b.toFixed(4)); sc.el.classList.toggle('is-copy', b > 0.45); }
  }

  /* Galería horizontal -------------------------------------------------------- */
  function setupGallery() {
    const el = $('#obra'); if (!el) return;
    const sc = (scenes.gal = { el, track: $('#gal-track'), vp: $('.gal-viewport', el), bar: $('#gal-prog'), cur: $('#gal-cur'), cards: $$('.gcard', el), travel: 0, idx: -1 });
    sc.vp.addEventListener('scroll', () => {
      if (pinMode()) return;
      const max = sc.vp.scrollWidth - sc.vp.clientWidth;
      galUI(max > 0 ? sc.vp.scrollLeft / max : 0);
    }, { passive: true });
  }
  function galMeasure() {
    const sc = scenes.gal; if (!sc) return;
    if (!pinMode()) { sc.el.style.removeProperty('--gal-h'); sc.track.style.transform = ''; return; }
    sc.travel = Math.max(0, sc.track.scrollWidth - S.vw);
    sc.el.style.setProperty('--gal-h', Math.round(S.vh + sc.travel) + 'px');
  }
  function galUI(p) {
    const sc = scenes.gal; if (!sc.bar) return;
    sc.bar.style.setProperty('--prog', p.toFixed(4));
    const idx = Math.min(sc.cards.length - 1, Math.round(p * (sc.cards.length - 1)));
    if (idx !== sc.idx) { sc.idx = idx; sc.cur.textContent = String(idx + 1).padStart(2, '0'); }
  }
  function galleryUpdate() {
    const sc = scenes.gal; if (!sc || !pinMode()) return;
    const range = sc.h - S.vh, p = clamp((S.sy - sc.top) / range);
    const tx = (-p * sc.travel).toFixed(1);
    if (tx !== sc.lastTx) { sc.lastTx = tx; sc.track.style.transform = `translate3d(${tx}px, 0, 0)`; }
    galUI(p);
  }

  /* Método (línea que se dibuja) --------------------------------------------- */
  function setupProcess() {
    const el = $('[data-steps]'); if (!el) return;
    scenes.proc = { el: null, steps: el, items: $$('.step', el), last: -1 };
  }
  function processUpdate() {
    const sc = scenes.proc; if (!sc) return;
    const r = sc.steps.getBoundingClientRect(), line = S.vh * 0.62, top = r.top + off();
    const p = reduce ? 1 : clamp((line - top) / r.height);
    sc.steps.style.setProperty('--line', p.toFixed(4));
    sc.items.forEach((it) => {
      const n = $('.step__node', it).getBoundingClientRect();
      it.classList.toggle('is-on', reduce || n.top + off() + 7 < line);
    });
  }

  /* 11 ─── HERO: CANVAS + PARALLAX + VERBOS ─────────────────────────────── */
  const hero = { el: null, cv: null, ctx: null, w: 0, h: 0, dpr: 1, gap: 38, small: false, traces: [], parts: [], visible: true, mx: 0, my: 0, tx: 0, ty: 0, mouse: { x: -999, y: -999, tx: -999, ty: -999 }, depth: [] };

  function setupHero() {
    hero.el = $('.hero'); hero.cv = $('.hero__canvas'); if (!hero.el || !hero.cv) return;
    hero.ctx = hero.cv.getContext('2d');
    hero.depth = $$('[data-depth]', hero.el);
    hero.ghost = $('.hero__ghost', hero.el); hero.slabs = $$('.hero__slab', hero.el);
    new IntersectionObserver((en) => { hero.visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero.el);
    new ResizeObserver(heroResize).observe(hero.el);
    hero.el.addEventListener('pointermove', (e) => {
      const r = hero.el.getBoundingClientRect();
      hero.mouse.tx = e.clientX - r.left; hero.mouse.ty = e.clientY - r.top;
      hero.tx = (e.clientX / S.vw - 0.5) * 2; hero.ty = (e.clientY / S.vh - 0.5) * 2;
    }, { passive: true });
    hero.el.addEventListener('pointerleave', () => { hero.mouse.tx = hero.mouse.ty = -999; hero.tx = hero.ty = 0; });
    heroResize();
  }

  function heroResize() {
    const r = hero.el.getBoundingClientRect(); if (!r.width) return;
    hero.small = r.width < 720;
    hero.w = r.width; hero.h = hero.small ? Math.min(r.height, window.innerHeight * 1.2) : r.height;
    hero.cv.style.height = hero.h + 'px';
    hero.dpr = Math.min(window.devicePixelRatio || 1, hero.small ? 1.25 : 2);
    hero.cv.width = Math.round(hero.w * hero.dpr); hero.cv.height = Math.round(hero.h * hero.dpr);
    hero.ctx.setTransform(hero.dpr, 0, 0, hero.dpr, 0, 0);
    hero.gap = hero.small ? 44 : 38;
    const snap = (v) => Math.round(v / hero.gap) * hero.gap;

    // Trazas ortogonales tipo circuito / tubería / ducto con pulsos viajando
    hero.traces = Array.from({ length: hero.small ? 6 : 13 }, () => {
      let x = snap(rand(0, hero.w)), y = snap(rand(0, hero.h)), horiz = Math.random() < 0.5;
      const pts = [[x, y]], segs = 3 + Math.floor(rand(0, 3));
      for (let i = 0; i < segs; i++) {
        const len = hero.gap * Math.floor(rand(2, 8)), sg = Math.random() < 0.5 ? -1 : 1;
        if (horiz) x += len * sg; else y += len * sg;
        pts.push([x, y]); horiz = !horiz;
      }
      const lens = []; let total = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
      const pulses = [{ d: rand(0, total), v: rand(60, 140) }];
      if (Math.random() < 0.6) pulses.push({ d: rand(0, total), v: rand(50, 120) });
      return { pts, lens, total, pulses };
    });

    // Paralelogramos flotantes (la inclinación del logotipo)
    hero.parts = Array.from({ length: hero.small ? 12 : 26 }, () => ({
      x: rand(0, hero.w), y: rand(0, hero.h), s: rand(6, 20), v: rand(6, 20), a: rand(0.08, 0.26), ph: rand(0, 6.28),
      c: Math.random() < 0.5 ? '#B5BECD' : '#1A3968'
    }));
    if (reduce) heroDraw(0, 0, true);
  }

  const pointAt = (tr, d) => {
    d = ((d % tr.total) + tr.total) % tr.total;
    for (let i = 0; i < tr.lens.length; i++) {
      if (d <= tr.lens[i]) { const k = d / tr.lens[i], a = tr.pts[i], b = tr.pts[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
      d -= tr.lens[i];
    }
    return tr.pts[tr.pts.length - 1];
  };

  function heroDraw(now, dt, still) {
    const { ctx, w, h, gap } = hero, m = hero.mouse, t = now * 0.001;
    ctx.clearRect(0, 0, w, h);
    m.x = lerp(m.x, m.tx, 0.12); m.y = lerp(m.y, m.ty, 0.12);

    // Rejilla de puntos que reacciona al puntero
    ctx.fillStyle = '#1A3968';
    const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        let x = gx * gap, y = gy * gap, a = 0.07 + 0.05 * Math.sin(t * 0.9 + gx * 0.35 + gy * 0.28), r = 1.1;
        const dx = x - m.x, dy = y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < 28000) { const d = Math.sqrt(d2) || 1, k = 1 - d / 167; a += k * 0.4; r += k * 2.4; x += (dx / d) * k * 7; y += (dy / d) * k * 7; }
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
    }

    // Trazas + pulsos
    ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(26,57,104,.11)';
    hero.traces.forEach((tr) => {
      ctx.globalAlpha = 1; ctx.beginPath();
      tr.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
      ctx.fillStyle = 'rgba(26,57,104,.2)';
      tr.pts.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, 6.2832); ctx.fill(); });
      tr.pulses.forEach((pu) => {
        if (!still) pu.d = (pu.d + (pu.v * dt) / 1000) % tr.total;
        ctx.fillStyle = '#4F8DFF';
        for (let k = 0; k < 10; k++) {
          const pos = pointAt(tr, pu.d - k * 5);
          ctx.globalAlpha = (1 - k / 10) * 0.85; ctx.beginPath(); ctx.arc(pos[0], pos[1], 2.8 - k * 0.2, 0, 6.2832); ctx.fill();
        }
      });
    });

    // Paralelogramos flotantes
    hero.parts.forEach((p) => {
      if (!still) { p.y -= (p.v * dt) / 1000; p.x += Math.sin(t * 0.4 + p.ph) * 0.12; if (p.y < -40) { p.y = h + 40; p.x = rand(0, w); } }
      ctx.save(); ctx.translate(p.x, p.y); ctx.transform(1, 0, -0.4, 1, 0, 0);
      ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s, p.s, p.s * 2); ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function heroFrame(now, dt) {
    if (!hero.cv || !hero.visible) return;
    hero.mx = lerp(hero.mx, hero.tx, 0.06); hero.my = lerp(hero.my, hero.ty, 0.06);
    const sp = clamp(S.sy / S.vh);
    hero.depth.forEach((el) => {
      const d = +el.dataset.depth;
      el.style.transform = `translate3d(${(hero.mx * d * 14).toFixed(2)}px, ${(hero.my * d * 10 - sp * d * 46).toFixed(2)}px, 0)`;
    });
    if (hero.ghost) hero.ghost.style.transform = `translate3d(${(hero.mx * -14).toFixed(1)}px, ${(sp * 90).toFixed(1)}px, 0)`;
    hero.slabs.forEach((s, i) => { s.style.transform = `translate3d(0, ${(-sp * (28 + i * 14)).toFixed(1)}px, 0)`; });
    if (!reduce) {
      const step = now - (hero.lastDraw || 0);
      if (step >= 30) { hero.lastDraw = now; heroDraw(now, Math.min(step, 100), false); }
    }
  }

  function setupVerbs() {
    const box = $('[data-verbs]'); if (!box || reduce) return;
    const items = $$('span', box); let i = 0;
    const fit = () => {
      const pad = parseFloat(getComputedStyle(box).paddingLeft) * 2;
      box.style.width = Math.ceil(items[i].offsetWidth + pad) + 'px';
    };
    fit(); if (document.fonts) document.fonts.ready.then(fit); window.addEventListener('resize', fit);
    setInterval(() => {
      if (document.hidden || !hero.visible) return;
      const prev = items[i]; i = (i + 1) % items.length; const next = items[i];
      prev.classList.remove('on'); prev.classList.add('off'); next.classList.add('on'); fit();
      setTimeout(() => { prev.classList.add('no-t'); prev.classList.remove('off'); void prev.offsetWidth; prev.classList.remove('no-t'); }, 900);
    }, 2400);
  }

  /* 12 ─── FORMULARIO → WHATSAPP · WA FLOTANTE · BUCLE PRINCIPAL ────────── */
  function setupForm() {
    const form = $('#quote-form'); if (!form) return;
    const msg = $('.form__msg', form);
    const fields = { name: $('#f-name'), tel: $('#f-tel'), service: $('#f-service') };
    const validators = {
      name: (v) => (v.trim().length < 2 ? 'Escribe tu nombre.' : ''),
      tel: (v) => (v.replace(/\D/g, '').length < 10 ? 'Escribe un teléfono de 10 dígitos.' : ''),
      service: (v) => (!v ? 'Elige un servicio.' : '')
    };
    const setErr = (input, text) => {
      input.closest('.field').classList.toggle('has-error', !!text);
      input.setAttribute('aria-invalid', text ? 'true' : 'false');
      const out = $(`[data-err="${input.id}"]`, form); if (out) out.textContent = text || '';
    };
    Object.entries(fields).forEach(([k, input]) => {
      input.addEventListener('blur', () => setErr(input, validators[k](input.value)));
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) setErr(input, validators[k](input.value)); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstBad = null;
      Object.entries(fields).forEach(([k, input]) => { const m = validators[k](input.value); setErr(input, m); if (m && !firstBad) firstBad = input; });
      if (firstBad) { msg.textContent = 'Revisa los campos marcados.'; msg.classList.add('is-error'); firstBad.focus(); return; }
      msg.classList.remove('is-error');
      const d = new FormData(form);
      const lines = [
        `Hola, soy ${String(d.get('nombre')).trim()}. Estoy listo para mi proyecto con Servicios Industriales.`, '',
        `• Servicio: ${d.get('servicio')}`, `• Tipo de espacio: ${d.get('espacio')}`, `• Mi WhatsApp / teléfono: ${String(d.get('telefono')).trim()}`
      ];
      const detail = String(d.get('mensaje') || '').trim(); if (detail) lines.push(`• Detalles: ${detail}`);
      const url = waURL(lines.join('\n'));
      msg.textContent = '¡Listo! Abriendo WhatsApp con tu mensaje…';
      const win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
    });
  }

  const ui = { hdr: null, prog: null, wa: null, lastProg: -1, lastWp: -1, scrolled: false };
  function setupUI() {
    ui.hdr = $('#header'); ui.prog = $('#progress'); ui.wa = $('#wa');
    if (ui.wa) {
      onReady(() => setTimeout(() => ui.wa.classList.add('is-on'), 1500));
      const tip = () => { ui.wa.classList.add('tip-on'); setTimeout(() => ui.wa.classList.remove('tip-on'), 4200); };
      onReady(() => { setTimeout(tip, 7000); setInterval(tip, 32000); });
    }
  }
  function uiFrame() {
    const y = S.y, max = Math.max(1, S.docH - S.vh), p = clamp(y / max);
    const scrolled = y > 24;
    if (scrolled !== ui.scrolled) { ui.scrolled = scrolled; ui.hdr && ui.hdr.classList.toggle('is-scrolled', scrolled); }
    if (Math.abs(p - ui.lastProg) > 0.0008 && ui.prog) { ui.lastProg = p; ui.prog.style.setProperty('--prog', p.toFixed(4)); }
    if (ui.wa && Math.abs(p - ui.lastWp) > 0.002) { ui.lastWp = p; ui.wa.style.setProperty('--wp', p.toFixed(4)); }
  }

  /* Bucle principal ------------------------------------------------------ */
  let last = performance.now(), resizeQueued = false;
  function loop(now) {
    const dt = Math.min(64, now - last); last = now;
    const y = window.scrollY;
    S.vel = lerp(S.vel, y - S.y, 0.2); S.y = y;
    const k = reduce ? 1 : 1 - Math.exp(-dt / 105);
    S.sy += (y - S.sy) * k; if (Math.abs(y - S.sy) < 0.05) S.sy = y;

    uiFrame(); scrubUpdate(); servicesUpdate(); expandUpdate(); galleryUpdate(); processUpdate();
    heroFrame(now, dt); marqueeFrame(dt); cursorFrame();
    requestAnimationFrame(loop);
  }
  const queueMeasure = () => { if (resizeQueued) return; resizeQueued = true; requestAnimationFrame(() => { resizeQueued = false; measure(); }); };

  /* Arranque ------------------------------------------------------------- */
  function init() {
    root.classList.add('is-loading');
    [setupWhatsApp, setupSplit, setupScrub, setupReveal, setupSpy, setupMenu, setupAccordion, setupCycle, setupHotspots, setupFaq,
     setupTilt, setupMagnetic, setupCursor, setupMarquees, setupServices, setupExpand, setupGallery, setupProcess, setupHero, setupVerbs, setupForm, setupUI]
      .forEach((fn) => { try { fn(); } catch (err) { console.error('[init] ' + fn.name, err); } });

    measure();
    S.y = S.sy = window.scrollY;
    window.addEventListener('resize', queueMeasure, { passive: true });
    window.addEventListener('load', queueMeasure);
    if (document.fonts) document.fonts.ready.then(queueMeasure);
    if ('ResizeObserver' in window) new ResizeObserver(queueMeasure).observe(document.body);
    preloader();
    requestAnimationFrame((t) => { last = t; loop(t); });
  }
  init();
})();
