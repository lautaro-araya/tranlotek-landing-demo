/* Tranlotek · landing B2B. Incluye los scripts rescatados de metricas/ y cobertura/ sin cambios. */

/* Gráficos de las cifras.
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

  function play() {
    if (reduced) return;
    figs.classList.remove('rings-in');
    figs.classList.add('rings-armed');
    void figs.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { figs.classList.add('rings-in'); }); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !figs.classList.contains('rings-in')) play();
    }, { threshold: .25 }).observe(figs);
  }
})();

/* Cobertura: la animación del mapa parte al entrar en pantalla; sin JS o con movimiento reducido se ve completo */
(function () {
  var cov = document.querySelector('[data-cov]');
  if (!cov) return;

  // Las guías de las comunas terminan justo antes de su etiqueta, mida lo que mida el texto
  function leads() {
    Array.prototype.forEach.call(cov.querySelectorAll('.cov__pin'), function (pin) {
      var t = pin.querySelector('text'), path = pin.querySelector('.cov__lead'), c = pin.querySelector('circle');
      var b = t.getBBox(), west = t.getAttribute('text-anchor') === 'start';
      var gx = west ? b.x + b.width + 6 : b.x - 6;
      path.setAttribute('d', 'M' + c.getAttribute('cx') + ' ' + c.getAttribute('cy') + 'L' + gx.toFixed(1) + ' ' + (b.y + b.height / 2).toFixed(1));
    });
  }
  leads();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(leads);
  window.addEventListener('resize', leads);

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (cov.getBoundingClientRect().top < window.innerHeight * .9) return;
  cov.classList.add('is-armed');
  var obs = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { cov.classList.add('is-in'); obs.disconnect(); }
  }, { threshold: .3 });
  obs.observe(cov);
})();

/* Barra: sombra al hacer scroll, menú móvil y sección activa */
(function () {
  var bar = document.querySelector('[data-bar]');
  var nav = document.getElementById('nav');
  var toggle = document.querySelector('[data-nav-toggle]');
  if (!bar || !nav || !toggle) return;

  function onScroll() { bar.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !bar.contains(e.target)) setOpen(false);
  });

  if (!('IntersectionObserver' in window)) return;
  var links = {};
  Array.prototype.forEach.call(nav.querySelectorAll('.nav__list a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = links[en.target.id];
      if (!a || !en.isIntersecting) return;
      Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
})();

/* Sectores: pestañas accesibles (flechas, Inicio, Fin). El sector elegido se lleva al formulario. */
(function () {
  var list = document.querySelector('[data-tabs]');
  var panel = document.getElementById('sect-panel');
  if (!list || !panel) return;
  var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  var pointsEl = panel.querySelector('[data-points]');
  var labelEl = panel.querySelector('[data-sec-label]');
  var field = document.getElementById('f-sector');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DATA = {
    log: [
      ['i-route', 'Punto a punto', 'Retiramos en origen y entregamos en destino, con la hora de cada etapa registrada.'],
      ['i-shield', 'Máxima seguridad', 'El vehículo va cargado y asegurado en la plataforma durante todo el trayecto.'],
      ['i-pin', 'Seguimiento GPS', 'Cada grúa reporta su posición a la central mientras dura el traslado.']
    ],
    seg: [
      ['i-route', 'Trazabilidad', 'La ruta GPS de cada traslado, de origen a destino, queda registrada.'],
      ['i-sign', 'Documentación completa', 'Acta de retiro y entrega firmada en cada servicio.'],
      ['i-cam', 'Set fotográfico', 'Fotos del vehículo al retirarlo y al entregarlo, con su hora.']
    ],
    flota: [
      ['i-doc', 'Convenio mensual', 'Un solo convenio para los traslados de tu flota durante el mes.'],
      ['i-truck', 'Livianos y pesados', 'Grúas para autos, camionetas, camiones y buses.'],
      ['i-phone', 'Un solo contacto', 'Un coordinador para tu empresa y la central atendiendo las 24 h.']
    ],
    conc: [
      ['i-clock', 'Ventana horaria', 'Entregamos a la hora pactada con tu sucursal o taller.'],
      ['i-search', 'Registro de estado', 'Inspección y fotos del vehículo antes de moverlo.'],
      ['i-cal', 'Traslados programados', 'Retiros y entregas agendados por semana.']
    ]
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function render(id) {
    pointsEl.innerHTML = DATA[id].map(function (p) {
      return '<li><span class="points__ico"><svg class="ico" aria-hidden="true"><use href="#' + p[0] + '"/></svg></span>' +
        '<div><h3 class="h3">' + esc(p[1]) + '</h3><p>' + esc(p[2]) + '</p></div></li>';
    }).join('');
  }
  function choose(tab, focus) {
    var id = tab.getAttribute('data-sec');
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) { tab.focus(); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    var swap = function () {
      render(id);
      labelEl.textContent = tab.textContent;
      if (field) field.value = tab.textContent;
    };
    if (reduced) { swap(); return; }
    panel.classList.add('is-swapping');
    setTimeout(function () { swap(); panel.classList.remove('is-swapping'); }, 180);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { if (tab.getAttribute('aria-selected') !== 'true') choose(tab); });
    tab.addEventListener('keydown', function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      choose(tabs[(n + tabs.length) % tabs.length], true);
    });
  });
})();

/* Formulario: validación al salir de cada campo y al enviar. En la demo no se envía nada. */
(function () {
  var form = document.querySelector('[data-form]');
  var ok = document.getElementById('form-ok');
  if (!form || !ok) return;
  var submit = form.querySelector('[data-submit]');
  var label = submit.querySelector('[data-submit-label]');
  var reset = ok.querySelector('[data-reset]');

  function valid(input) {
    var v = input.value.trim();
    if (input.hasAttribute('data-contact')) {
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      var phone = /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 9;
      return email || phone;
    }
    return v.length > 1;
  }
  function check(input) {
    var good = valid(input);
    input.closest('.field').classList.toggle('is-invalid', !good);
    input.setAttribute('aria-invalid', good ? 'false' : 'true');
    return good;
  }
  var inputs = Array.prototype.slice.call(form.querySelectorAll('input[required]'));
  inputs.forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value.trim()) check(input); });
    input.addEventListener('input', function () { if (input.closest('.field').classList.contains('is-invalid')) check(input); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = inputs.filter(function (i) { return !check(i); });
    if (bad.length) { bad[0].focus(); return; }
    submit.setAttribute('aria-busy', 'true');
    label.textContent = 'Enviando…';
    // DESARROLLADOR: reemplazar por el envío real (fetch al PHP del formulario) y medir el evento en GA4.
    setTimeout(function () {
      submit.removeAttribute('aria-busy');
      label.textContent = 'Solicitar reunión';
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
    }, 700);
  });
  reset.addEventListener('click', function () {
    form.reset();
    inputs.forEach(function (i) { i.closest('.field').classList.remove('is-invalid'); i.removeAttribute('aria-invalid'); });
    ok.hidden = true;
    form.hidden = false;
    inputs[0].focus();
  });
})();

/* Aparición suave de bloques al entrar en pantalla */
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-reveal');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  Array.prototype.forEach.call(els, function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
    obs.observe(el);
  });
})();
