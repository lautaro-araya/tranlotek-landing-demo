(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Referencia de solicitud (un mismo folio por visita) ---------- */
  const serial = (() => {
    const KEY = 'tlk-ref';
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) return saved;
    } catch (e) { /* almacenamiento no disponible */ }
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const ref = `TLK-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
    try { sessionStorage.setItem(KEY, ref); } catch (e) { /* sin persistencia */ }
    return ref;
  })();
  document.querySelectorAll('[data-serial]').forEach((el) => { el.textContent = serial; });
  document.querySelectorAll('[data-serial-input]').forEach((el) => { el.value = serial; });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Cabecera ---------- */
  const masthead = document.querySelector('[data-masthead]');
  const onScroll = () => masthead.classList.toggle('is-solid', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector('[data-nav-toggle]');
  const list = document.querySelector('[data-nav-list]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav__toggle-label').textContent = open ? 'Cerrar' : 'Menú';
    list.classList.toggle('is-open', open);
    masthead.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });

  // Sección activa en la navegación
  const navLinks = [...document.querySelectorAll('.nav__list a[href^="#"]:not(.tag-link)')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ---------- Mapa: dibujo de rutas ---------- */
  const map = document.querySelector('[data-routemap]');
  if (map) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      map.classList.add('is-drawn');
    } else {
      const mapIO = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { map.classList.add('is-drawn'); mapIO.disconnect(); }
      }, { threshold: 0.35 });
      mapIO.observe(map);
    }
  }

  /* ---------- Conversemos: la grúa baja la ficha ---------- */
  const hoist = document.querySelector('[data-hoist]');
  if (hoist) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      hoist.classList.add('is-hoisted');
    } else {
      const hoistIO = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { hoist.classList.add('is-hoisted'); hoistIO.disconnect(); }
      }, { threshold: 0.2 });
      hoistIO.observe(hoist);
    }
  }

  /* ---------- Servicio: riel de etapas ---------- */
  const custody = document.querySelector('[data-custody]');
  if (custody) {
    const steps = [...custody.querySelectorAll('[data-step]')];
    const stages = steps.map((li) => document.getElementById(li.dataset.step));
    const fill = custody.querySelector('[data-rail-fill]');
    const labels = { done: 'Registrado', active: 'En curso', idle: '' };
    let ticking = false;

    const update = () => {
      ticking = false;
      const probe = window.innerHeight * 0.42;
      let active = -1;
      stages.forEach((stage, i) => { if (stage.getBoundingClientRect().top <= probe) active = i; });
      steps.forEach((li, i) => {
        const state = i < active ? 'done' : i === active ? 'active' : 'idle';
        li.classList.toggle('is-done', state === 'done');
        li.classList.toggle('is-active', state === 'active');
        li.querySelector('[data-state]').textContent = labels[state];
        const link = li.querySelector('a');
        if (state === 'active') link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      });
      if (fill) {
        const first = stages[0].getBoundingClientRect();
        const last = stages[stages.length - 1].getBoundingClientRect();
        const span = last.top - first.top || 1;
        const p = Math.min(1, Math.max(0, (probe - first.top) / span));
        fill.style.setProperty('--p', p.toFixed(3));
      }
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }

  /* ---------- Formularios de contacto ---------- */
  const messages = {
    nombre: 'Ingresa tu nombre.',
    empresa: 'Indica el nombre de tu empresa.',
    telefono: 'Ingresa al menos 8 dígitos.',
    correo: 'Revisa el correo: falta el @ o el dominio.',
  };
  const validators = {
    nombre: (v) => v.trim().length >= 2,
    empresa: (v) => v.trim().length >= 2,
    telefono: (v) => { const d = v.replace(/\D/g, ''); return d.length >= 8 && d.length <= 12; },
    correo: (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  };

  const setError = (input, msg) => {
    const err = document.getElementById(`${input.id}-err`);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  };
  const check = (input) => {
    const fn = validators[input.name];
    if (!fn) return true;
    const ok = fn(input.value);
    setError(input, ok ? '' : messages[input.name]);
    return ok;
  };

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    const inputs = [...form.querySelectorAll('input[name]')].filter((i) => validators[i.name]);
    const seal = form.querySelector('[data-seal]');
    const sealLabel = form.querySelector('[data-seal-label]');
    const errorBox = form.querySelector('[data-form-error]');
    const done = form.querySelector('[data-form-done]');
    let sealed = false;

    inputs.forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) check(input); });
      input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(input); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sealed) return;
      errorBox.hidden = true;
      const invalid = inputs.filter((i) => !check(i));
      if (invalid.length) { invalid[0].focus(); return; }
      if (form.web && form.web.value) return; // trampa anti-spam

      seal.setAttribute('aria-busy', 'true');
      seal.disabled = true;
      sealLabel.textContent = 'Enviando…';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'send');

        form.querySelector('[data-done-phone]').textContent = form.telefono.value.trim();
        sealed = true;
        form.classList.add('is-sealed');
        seal.classList.add('is-closed');
        seal.disabled = true;
        sealLabel.innerHTML = `<span class="seal__word">Recibida · </span><span class="seal__serial">${serial}</span>`;
        done.hidden = false;
        done.focus();
      } catch (err) {
        errorBox.innerHTML = 'No pudimos enviar tu solicitud. Intenta otra vez o escríbenos a <a href="mailto:contacto@tranlotek.cl">contacto@tranlotek.cl</a>.';
        errorBox.hidden = false;
      } finally {
        seal.removeAttribute('aria-busy');
        if (!sealed) {
          seal.disabled = false;
          sealLabel.textContent = 'Solicitar reunión';
        }
      }
    });
  });
})();
