(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Selector de paleta ---------- */
  const palettes = document.querySelector('[data-palettes]');
  if (palettes) {
    const opts = [...palettes.querySelectorAll('[data-palette-option]')];
    const list = palettes.querySelector('#palettes-list');
    const toggleBtn = palettes.querySelector('[data-palettes-toggle]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const KEY = 'tlk-paleta';
    const apply = (id, animate) => {
      if (!opts.some((o) => o.dataset.paletteOption === id)) id = '1';
      if (animate && !reduceMotion) {
        document.documentElement.classList.add('is-swapping');
        clearTimeout(apply.t);
        apply.t = setTimeout(() => document.documentElement.classList.remove('is-swapping'), 500);
      }
      if (id === '1') delete document.documentElement.dataset.palette;
      else document.documentElement.dataset.palette = id;
      opts.forEach((o) => {
        const on = o.dataset.paletteOption === id;
        o.setAttribute('aria-checked', String(on));
        o.tabIndex = on ? 0 : -1;
      });
      if (themeMeta) themeMeta.content = getComputedStyle(document.documentElement).getPropertyValue('--door').trim();
      try { localStorage.setItem(KEY, id); } catch (e) { /* sin almacenamiento */ }
    };
    let initial = new URLSearchParams(location.search).get('paleta');
    if (!initial) { try { initial = localStorage.getItem(KEY); } catch (e) { initial = null; } }
    apply(initial || '1', false);

    opts.forEach((o, i) => {
      o.addEventListener('click', () => apply(o.dataset.paletteOption, true));
      o.addEventListener('keydown', (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = opts[(i + step + opts.length) % opts.length];
        next.focus();
        apply(next.dataset.paletteOption, true);
      });
    });

    const setOpen = (open) => {
      toggleBtn.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
      document.documentElement.classList.toggle('palettes-open', open);
    };
    setOpen(!window.matchMedia('(max-width: 900px)').matches);
    toggleBtn.addEventListener('click', () => setOpen(toggleBtn.getAttribute('aria-expanded') !== 'true'));
  }

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
  const canAnimate = !reduceMotion && 'IntersectionObserver' in window;
  if (hoist) {
    if (!canAnimate) {
      hoist.classList.add('is-hoisted');
    } else {
      new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) hoist.classList.add('is-hoisted');
      }, { threshold: 0.2 }).observe(hoist);
    }
  }

  // "Contacto": scroll lento hasta la sección, terminando con la ficha centrada
  const contact = document.getElementById('conversemos');
  const contactPlate = contact && contact.querySelector('.contact__plate .plate');
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const isVisible = (el) => { const b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < window.innerHeight; };

  document.querySelectorAll('a[href="#conversemos"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (!contact || !contactPlate) return;
      e.preventDefault();
      const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--masthead')) || 72;
      const plate = contactPlate.getBoundingClientRect();
      const room = window.innerHeight - head;
      const offset = plate.height < room ? head + (room - plate.height) / 2 : head + 16;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      // Si la grúa aún no bajó la ficha, su posición final está 40px más abajo
      const pending = hoist && !hoist.classList.contains('is-hoisted') ? 40 : 0;
      const target = Math.min(maxY, Math.max(0, window.scrollY + plate.top + pending - offset));
      const finish = () => {
        history.pushState(null, '', '#conversemos');
        document.getElementById('contact-title').focus({ preventScroll: true });
      };

      if (!canAnimate) { window.scrollTo({ top: target, behavior: 'instant' }); finish(); return; }

      // La grúa vuelve a bajar la ficha si la sección no está a la vista
      if (hoist && !isVisible(hoist)) hoist.classList.remove('is-hoisted');

      const start = window.scrollY;
      const dist = target - start;
      const duration = Math.min(2600, Math.max(1300, Math.abs(dist) * 0.45));
      let t0 = null;
      let cancelled = false;
      const cancel = () => { cancelled = true; };
      window.addEventListener('wheel', cancel, { passive: true, once: true });
      window.addEventListener('touchstart', cancel, { passive: true, once: true });
      const step = (now) => {
        if (cancelled) return;
        if (t0 === null) t0 = now;
        const t = Math.min(1, (now - t0) / duration);
        window.scrollTo({ top: start + dist * easeInOut(t), behavior: 'instant' });
        if (t < 1) requestAnimationFrame(step);
        else {
          window.removeEventListener('wheel', cancel);
          window.removeEventListener('touchstart', cancel);
          finish();
        }
      };
      requestAnimationFrame(step);
    });
  });

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
        sealLabel.textContent = 'Enviada';
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
