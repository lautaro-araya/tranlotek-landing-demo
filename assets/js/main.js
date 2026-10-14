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

  /* Portada: registro de servicio que avanza retiro → ruta → entrega.
     Cada tramo dura STEP ms; la barra se llena de forma continua y la hora
     de cada fila solo aparece cuando la etapa se cierra. */
  var log = document.querySelector('[data-log]');
  if (log && !reduced) {
    var panel = log.closest('.log');
    var rows = log.querySelectorAll('li');
    var times = Array.prototype.map.call(rows, function (li) { return li.querySelector('time'); });
    var stamps = times.map(function (t) { return t ? t.textContent : ''; });
    var bar = document.querySelector('.log__track span');
    var STEP = 1800, HOLD = 2600, FADE = 500;
    var n = rows.length, step = 0, timer = null;

    var setBar = function (p, ms) {
      if (!bar) return;
      bar.style.setProperty('--dur', ms + 'ms');
      bar.style.setProperty('--p', p);
    };
    var render = function () {
      rows.forEach(function (li, i) {
        var done = i < step;
        li.classList.toggle('is-done', done);
        li.classList.toggle('is-now', i === step);
        if (times[i]) times[i].textContent = done ? stamps[i] : '--:--';
      });
    };
    var advance = function () {
      render();
      if (step < n) {
        setBar((step + 1) / n, STEP);
        step++;
        timer = setTimeout(advance, STEP);
      } else {
        timer = setTimeout(reset, HOLD);
      }
    };
    var reset = function () {
      panel.classList.add('is-reset');
      step = 0;
      rows.forEach(function (li) { li.classList.remove('is-done', 'is-now'); });
      timer = setTimeout(function () {
        setBar(0, 0);
        render();
        if (bar) void bar.offsetWidth;
        panel.classList.remove('is-reset');
        timer = setTimeout(advance, 400);
      }, FADE);
    };

    step = 0; setBar(0, 0); render();
    timer = setTimeout(advance, 700);
    document.addEventListener('visibilitychange', function () {
      clearTimeout(timer);
      if (!document.hidden) reset();
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

/* DEMO paleta azul: gráficos de las cifras.
   24 h y Diario van en círculo (esfera y semana); el resto usa una forma que
   representa la cantidad tal cual: conteo, línea de tiempo, pictogramas y medidor.
   No inventan datos; los números siguen escritos en el HTML. */
(function () {
  var figs = document.querySelector('.figs');
  var cells = document.querySelectorAll('[data-ring]');
  if (!figs || !cells.length) return;
  var NS = 'http://www.w3.org/2000/svg', C = 100;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pt(r, deg) { var a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
  function arc(r, a0, a1) {
    var p0 = pt(r, a0), p1 = pt(r, a1);
    return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
  }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(g, x, y, txt, anchor, cls, d) {
    el('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'class': 'r-txt' + (cls ? ' ' + cls : ''), style: '--d:' + (d || 0) }, g).textContent = txt;
  }
  function label(g, r, deg, txt, i) {
    var p = pt(r, deg);
    text(g, p[0], p[1] + 3.5, txt, 'middle', '', i);
  }
  function segments(g, n, gap) {
    for (var i = 0; i < n; i++) {
      el('path', { d: arc(84, i * 360 / n + gap / 2, (i + 1) * 360 / n - gap / 2), 'class': 'r-seg', pathLength: 1, style: '--d:' + i }, g);
    }
  }
  function ticks(g, n, major, r0, r1) {
    for (var i = 0; i < n; i++) {
      var big = major && i % major === 0, a = i * 360 / n;
      var p0 = pt(big ? r0 - 6 : r0, a), p1 = pt(r1, a);
      el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], 'class': 'r-tick' + (big ? ' r-tick--major' : ''), style: '--d:' + i }, g);
    }
  }

  /* Gráficos lineales: lienzo de 240 × 150 bajo la cifra */
  var charts = {
    tally: function (g) { // 12.000 = 12 columnas de 1.000; cada celda, 100 traslados
      for (var c = 0; c < 12; c++) {
        for (var r = 0; r < 10; r++) {
          el('rect', { x: c * 20 + 3, y: 108 - r * 11, width: 14, height: 8, rx: 1, 'class': 'c-cell', style: '--d:' + (c * 4 + r * .4).toFixed(1) }, g);
        }
      }
      el('line', { x1: 0, y1: 122.5, x2: 240, y2: 122.5, 'class': 'c-axis' }, g);
      el('rect', { x: 62, y: 134, width: 14, height: 8, rx: 1, 'class': 'c-cell c-key' }, g);
      text(g, 84, 141.5, '= 100 TRASLADOS', 'start', 'c-key', 48);
    },
    timeline: function (g) { // 2 años = 24 meses
      var x0 = 6, x1 = 226, y = 100, step = (x1 - x0) / 24;
      el('line', { x1: x0, y1: y, x2: x1, y2: y, 'class': 'c-axis' }, g);
      for (var i = 0; i <= 24; i++) {
        var x = x0 + i * step, big = i % 12 === 0;
        el('line', { x1: x, y1: y - (big ? 40 : 20), x2: x, y2: y - 8, 'class': 'r-tick' + (big ? ' r-tick--major' : ''), style: '--d:' + i }, g);
      }
      el('path', { d: 'M' + x0 + ' ' + y + 'H' + x1, 'class': 'c-bar', pathLength: 1 }, g);
      el('circle', { cx: x1, cy: y, r: 7, 'class': 'r-hub c-pop', style: '--d:26' }, g);
      [['INICIO', 0], ['AÑO 1', 12], ['AÑO 2', 24]].forEach(function (m) {
        text(g, x0 + m[1] * step, y + 26, m[0], m[1] === 0 ? 'start' : 'middle', 'c-key', m[1]);
      });
      text(g, x0 + 6 * step, y - 50, '12 MESES', 'middle', 'c-faint', 6);
      text(g, x0 + 18 * step, y - 50, '12 MESES', 'middle', 'c-faint', 18);
    },
    fleet: function (g) { // 25 grúas = 25 pictogramas, uno por grúa
      for (var i = 0; i < 25; i++) {
        var t = el('g', { transform: 'translate(' + ((i % 5) * 48 + 2) + ' ' + (Math.floor(i / 5) * 29 + 3) + ')' }, g);
        var u = el('g', { 'class': 'c-truck c-pop', style: '--d:' + i }, t);
        // plataforma, chasis y cabina con ventana calada
        el('path', { d: 'M0 11h27v4H0zM0 15h40v3H0zM27 15V4h8l5 6.5V15zM29 6v4.5h8.6L34.2 6z', 'fill-rule': 'evenodd' }, u);
        el('path', { d: 'M3 11 15 2.5v5', 'class': 'c-boom' }, u);   // pluma y gancho
        el('circle', { cx: 8, cy: 19.5, r: 3.6, 'class': 'c-wheel' }, u);
        el('circle', { cx: 32, cy: 19.5, r: 3.6, 'class': 'c-wheel' }, u);
      }
    },
    gauge: function (g) { // 100 % = medidor completo
      for (var i = 0; i < 10; i++) {
        el('rect', { x: i * 24 + 1.5, y: 44, width: 21, height: 34, rx: 1, 'class': 'c-cell', style: '--d:' + i * 3 }, g);
      }
      [0, 50, 100].forEach(function (v, i) {
        var x = Math.min(Math.max(v * 2.4, .5), 239.5);
        el('line', { x1: x, y1: 86, x2: x, y2: 94, 'class': 'r-tick' + (v === 100 ? ' r-tick--major' : '') }, g);
        text(g, v * 2.4, 112, v + ' %', v === 0 ? 'start' : v === 100 ? 'end' : 'middle', '', i * 12);
      });
      text(g, 0, 30, 'FLOTA', 'start', 'c-faint', 0);
      text(g, 240, 30, 'CON GPS', 'end', 'c-faint', 0);
    }
  };

  /* Círculos: esfera de 200 × 200 detrás de la cifra */
  var rings = {
    clock: function (g) { // 24 h = esfera de 24 horas con barrido continuo
      el('circle', { cx: C, cy: C, r: 92, 'class': 'r-hair' }, g);
      ticks(g, 24, 6, 80, 92);
      [['00', 0], ['06', 90], ['12', 180], ['18', 270]].forEach(function (h, i) { label(g, 106, h[1], h[0], i * 6); });
      var sw = el('g', { 'class': reduced ? '' : 'r-sweep' }, g);
      var tip = pt(88, 0);
      el('line', { x1: C, y1: C - 66, x2: tip[0], y2: tip[1], 'class': 'r-hand' }, sw);
      el('circle', { cx: tip[0], cy: tip[1], r: 4, 'class': 'r-hub' }, sw);
    },
    week: function (g) { // Diario = los 7 días de la semana
      el('circle', { cx: C, cy: C, r: 84, 'class': 'r-track' }, g);
      segments(g, 7, 6);
      'LMMJVSD'.split('').forEach(function (d, i) { label(g, 104, (i + .5) * 360 / 7, d, i); });
    }
  };

  Array.prototype.forEach.call(cells, function (dt, row) {
    var kind = dt.getAttribute('data-ring'), svg, g;
    if (rings[kind]) {
      svg = el('svg', { 'class': 'ring', viewBox: '0 0 200 200', 'aria-hidden': 'true', focusable: 'false' });
      g = el('g', { style: '--row:' + row }, svg);
      rings[kind](g);
      dt.insertBefore(svg, dt.firstChild);
    } else if (charts[kind]) {
      svg = el('svg', { 'class': 'ring ring--chart', viewBox: '0 0 240 150', 'aria-hidden': 'true', focusable: 'false' });
      g = el('g', { style: '--row:' + row }, svg);
      charts[kind](g);
      dt.classList.add('fig--chart');
      dt.appendChild(svg);
    }
  });

  var root = document.documentElement, seen = false;
  function play() {
    if (reduced || root.getAttribute('data-palette') !== 'azul') return;
    figs.classList.remove('rings-in');
    figs.classList.add('rings-armed');
    void figs.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { figs.classList.add('rings-in'); }); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      seen = en[0].isIntersecting;
      if (seen && !figs.classList.contains('rings-in')) play();
    }, { threshold: .25 }).observe(figs);
  }
  new MutationObserver(function () {
    if (root.getAttribute('data-palette') === 'azul') {
      if (seen) play(); else figs.classList.remove('rings-in');
    } else {
      figs.classList.remove('rings-armed', 'rings-in');
    }
  }).observe(root, { attributes: true, attributeFilter: ['data-palette'] });
})();
