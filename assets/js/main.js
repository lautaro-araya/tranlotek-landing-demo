(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- Servicio: etapas en slides ---------- */
  const slider = document.querySelector('[data-slides]');
  if (slider) {
    const tabs = [...slider.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const prev = slider.querySelector('[data-slides-prev]');
    const next = slider.querySelector('[data-slides-next]');
    const current = slider.querySelector('[data-slides-current]');
    let index = 0;
    const go = (i, focus) => {
      i = Math.max(0, Math.min(tabs.length - 1, i));
      slider.style.setProperty('--from', i >= index ? '24px' : '-24px');
      index = i;
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-done', n < i);
      });
      panels.forEach((panel, n) => panel.classList.toggle('is-active', n === i));
      current.textContent = String(i + 1).padStart(2, '0');
      prev.disabled = i === 0;
      next.disabled = i === tabs.length - 1;
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, n) => {
      t.addEventListener('click', () => go(n));
      t.addEventListener('keydown', (e) => {
        const to = { ArrowRight: n + 1, ArrowLeft: n - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        go(to, true);
      });
    });
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    go(0);
  }

  /* ---------- Formularios de contacto ---------- */
  // Teléfono chileno: 9 dígitos, con o sin el 56 adelante
  const phoneDigits = (v) => {
    const d = v.replace(/\D/g, '');
    return d.length === 11 && d.startsWith('56') ? d.slice(2) : d;
  };
  const formatPhone = (v) => {
    const d = phoneDigits(v);
    if (!/^[2-9]\d{8}$/.test(d)) return v.trim();
    if (d[0] === '9' || d[0] === '2') return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`; // celular o Santiago
    return `+56 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`; // fijo regional, ej. 41
  };

  // Cada validador devuelve el mensaje de error, o '' si el valor es válido
  const validators = {
    nombre: (v) => {
      v = v.trim();
      if (!v) return 'Ingresa tu nombre.';
      if (!/^\p{L}[\p{L}\s'.-]*$/u.test(v)) return 'Usa solo letras en tu nombre, sin números ni símbolos.';
      return (v.match(/\p{L}/gu) || []).length >= 2 ? '' : 'Ingresa tu nombre.';
    },
    empresa: (v) => {
      v = v.trim();
      if (v.length < 2) return 'Indica el nombre de tu empresa.';
      return /\p{L}/u.test(v) ? '' : 'El nombre de la empresa debe tener letras.';
    },
    telefono: (v) => {
      const d = phoneDigits(v);
      if (!d) return 'Ingresa un teléfono de contacto.';
      if (/[^\d\s+()-]/.test(v)) return 'Usa solo números en el teléfono.';
      return d.length === 9 && /^[2-9]/.test(d) ? '' : 'Ingresa un teléfono chileno de 9 dígitos, por ejemplo +56 9 1234 5678.';
    },
    correo: (v) => {
      v = v.trim();
      if (!v) return '';
      const ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v)
        && !/\.\./.test(v) && !/^\.|\.@/.test(v);
      return ok ? '' : 'Revisa el correo, por ejemplo nombre@empresa.cl.';
    },
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
    if (input.name === 'telefono') input.value = formatPhone(input.value);
    const msg = fn(input.value);
    setError(input, msg);
    return !msg;
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
      input.addEventListener('input', () => {
        // El teléfono solo admite números y separadores; el formato se aplica al salir del campo
        if (input.name === 'telefono') {
          const clean = input.value.replace(/[^\d\s+()-]/g, '');
          if (clean !== input.value) input.value = clean;
        }
        if (input.getAttribute('aria-invalid') === 'true') setError(input, validators[input.name](input.value));
      });
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
        let res;
        try {
          res = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' },
          });
        } catch {
          throw new Error('No hubo conexión con el servidor. Revisa tu conexión a internet.');
        }
        const data = await res.json().catch(() => null);
        if (!data) throw new Error(`Hubo un problema en nuestro servidor (error ${res.status}).`);
        // Errores por campo: se marcan igual que la validación del navegador
        if (data.campos) {
          Object.entries(data.campos).forEach(([name, msg]) => { if (form[name]) setError(form[name], msg); });
          const first = Object.keys(data.campos).find((name) => form[name]);
          if (first) form[first].focus();
        }
        if (!res.ok || !data.ok) throw new Error([data.mensaje || `Error ${res.status}.`, data.detalle && `Detalle: ${data.detalle}`].filter(Boolean).join(' '));

        form.querySelector('[data-done-phone]').textContent = form.telefono.value.trim();
        sealed = true;
        form.classList.add('is-sealed');
        seal.classList.add('is-closed');
        seal.disabled = true;
        sealLabel.textContent = 'Enviada';
        done.hidden = false;
        done.focus();
      } catch (err) {
        // El motivo exacto va como texto (nunca como HTML) antes del contacto de respaldo
        const mail = document.createElement('a');
        mail.href = 'mailto:contacto@tranlotek.com';
        mail.textContent = 'contacto@tranlotek.com';
        errorBox.replaceChildren(`No pudimos enviar tu solicitud. ${err.message} Intenta otra vez o escríbenos a `, mail, '.');
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
