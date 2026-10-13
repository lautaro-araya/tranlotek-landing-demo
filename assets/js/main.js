(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* GA4: clics marcados con data-ga (Conversemos, teléfono, WhatsApp) */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ga]');
    if (el) track(el.getAttribute('data-ga'), { ubicacion: el.getAttribute('data-ga-lugar') || '' });
  });

  /* Portada: registro de servicio que avanza retiro → ruta → entrega */
  var log = document.querySelector('[data-log]');
  if (log && !reduced) {
    var rows = log.querySelectorAll('li');
    var bar = document.querySelector('.log__track span');
    var step = 0, timer = null;
    var render = function () {
      rows.forEach(function (li, i) {
        li.classList.toggle('is-done', i < step);
        li.classList.toggle('is-now', i === step);
      });
      if (bar) bar.style.setProperty('--p', Math.min(step / rows.length, 1));
    };
    var tick = function () {
      step = step >= rows.length ? 0 : step + 1;
      render();
      timer = setTimeout(tick, step === rows.length ? 3200 : 1700);
    };
    step = 0; render();
    timer = setTimeout(tick, 1400);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(timer); } else { clearTimeout(timer); timer = setTimeout(tick, 900); }
    });
  }

  /* Navegación: marca la sección visible */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.bar__nav a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var setCurrent = function () {
      var best = null;
      navLinks.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (visible[id] && (!best || visible[id] > visible[best])) best = id;
      });
      navLinks.forEach(function (a) {
        if (a === byId[best]) {
          a.setAttribute('aria-current', 'true');
          var nav = a.parentNode;
          if (nav.scrollWidth > nav.clientWidth) {
            var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
            if (ar.left < nr.left + 16 || ar.right > nr.right - 16) {
              nav.scrollTo({ left: nav.scrollLeft + ar.left - nr.left - 16, behavior: reduced ? 'auto' : 'smooth' });
            }
          }
        } else a.removeAttribute('aria-current');
      });
    };
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      setCurrent();
    }, { rootMargin: '-110px 0px -45% 0px', threshold: [0, .1, .25, .5, .75, 1] });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) navObs.observe(sec);
    });
  }

  /* Respaldo: entrada escalonada de título, texto, verificaciones y foto */
  var rvSec = document.querySelector('[data-reveal]');
  if (rvSec && !reduced && 'IntersectionObserver' in window && rvSec.getBoundingClientRect().top > window.innerHeight * .9) {
    var targets = rvSec.querySelectorAll('.h2, .lead, .checks caption, .checks tbody tr, .resp__photo');
    Array.prototype.forEach.call(targets, function (el, i) {
      el.setAttribute('data-rv', '');
      el.style.setProperty('--i', i);
    });
    rvSec.classList.add('rv');
    var rvObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        rvSec.classList.add('rv-in');
        rvObs.disconnect();
      }
    }, { threshold: .2 });
    rvObs.observe(rvSec);
  }

  /* Sectores: pestañas accesibles; el sector elegido se copia al formulario */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var select = document.getElementById('sector');

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-in', on);
    });
    if (focus) tab.focus();
    if (select) {
      select.value = tab.getAttribute('data-sector');
      select.classList.remove('is-set'); void select.offsetWidth; select.classList.add('is-set');
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      if (tab.getAttribute('aria-selected') === 'true') return;
      selectTab(tab);
      track('cambio_sector', { sector: tab.getAttribute('data-sector') });
    });
    tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') n = tabs[0];
      else if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) {
        e.preventDefault();
        selectTab(n, true);
        track('cambio_sector', { sector: n.getAttribute('data-sector') });
      }
    });
  });

  /* Formulario */
  var form = document.getElementById('form');
  if (!form) return;
  var ok = document.getElementById('form-ok');
  var err = document.getElementById('form-err');
  var stamp = document.getElementById('form-t');
  if (stamp) stamp.value = String(Date.now());

  function showError(msg, field) {
    err.textContent = msg;
    err.hidden = false;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;

    var nombre = form.elements.nombre, empresa = form.elements.empresa, contacto = form.elements.contacto;
    if (!nombre.value.trim()) return showError('Falta tu nombre.', nombre);
    if (!empresa.value.trim()) return showError('Falta el nombre de tu empresa.', empresa);
    var c = contacto.value.trim();
    var esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
    var esFono = c.replace(/[^\d]/g, '').length >= 8;
    if (!esCorreo && !esFono) return showError('Escribe un teléfono (con al menos 8 dígitos) o un correo válido para poder contactarte.', contacto);

    var btn = form.querySelector('[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando…';

    // Demo sin servidor PHP (p. ej. GitHub Pages): simula el envío, no manda datos.
    if (form.hasAttribute('data-demo')) {
      setTimeout(function () {
        form.hidden = true; ok.hidden = false; ok.focus();
        btn.disabled = false; btn.textContent = label;
      }, 600);
      return;
    }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'envio');
        track('envio_formulario', { sector: form.elements.sector.value });
        form.hidden = true;
        ok.hidden = false;
        ok.focus();
      })
      .catch(function (ex) {
        var msg = ex && ex.message && ex.message !== 'envio' && ex.message !== 'Failed to fetch'
          ? ex.message
          : 'No pudimos enviar tu solicitud. Intenta de nuevo o llámanos al +56 41 296 4800.';
        showError(msg);
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });

  document.getElementById('form-reset').addEventListener('click', function () {
    form.reset();
    if (stamp) stamp.value = String(Date.now());
    var cur = document.querySelector('[role="tab"][aria-selected="true"]');
    if (cur && select) select.value = cur.getAttribute('data-sector');
    ok.hidden = true;
    form.hidden = false;
    form.elements.nombre.focus();
  });
})();

/* DEMO: selector de paleta (ámbar del brief / azul de marca). Eliminar al publicar. */
(function () {
  var root = document.documentElement;
  var opts = document.querySelectorAll('[data-palette-opt]');
  if (!opts.length) return;
  var meta = document.querySelector('meta[name="theme-color"]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function apply(name, animate) {
    if (animate && !reduced) {
      root.classList.add('palette-anim');
      setTimeout(function () { root.classList.remove('palette-anim'); }, 500);
    }
    if (name === 'azul') root.setAttribute('data-palette', 'azul'); else root.removeAttribute('data-palette');
    Array.prototype.forEach.call(opts, function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-palette-opt') === name ? 'true' : 'false');
    });
    if (meta) meta.setAttribute('content', name === 'azul' ? '#0B1A2C' : '#14181F');
    try { localStorage.setItem('tk-paleta', name); } catch (e) {}
  }
  apply(root.getAttribute('data-palette') === 'azul' ? 'azul' : 'ambar', false);
  Array.prototype.forEach.call(opts, function (b, i) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-palette-opt'), true); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var n = opts[(i + 1) % opts.length];
        apply(n.getAttribute('data-palette-opt'), true); n.focus();
      }
    });
  });
})();
