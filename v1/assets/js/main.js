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

  /* Portada: tarjeta que rota por lo que incluye cada servicio.
     Avanza sola cuando la barra de progreso termina (se pausa al pasar el mouse o con foco);
     con movimiento reducido no hay animación y solo avanza con el botón. */
  var card = document.querySelector('[data-hcard]');
  if (card) {
    var ITEMS = [
      ['Retiro y traslado con grúa', '25 grúas para todo tipo de vehículos.'],
      ['Control GPS en toda la flota', 'Cada grúa reporta su posición a la central.'],
      ['Acta y fotos de cada servicio', 'Retiro y entrega con hora, fotos y firma de recepción.'],
      ['Central telefónica 24 h', 'Atendemos todos los días del año.']
    ];
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var restart = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    var hcN = card.querySelector('[data-hcard-n]');
    var hcText = card.querySelector('[data-hcard-text]');
    var hcBar = card.querySelector('[data-hcard-bar]');
    var hcNext = card.querySelector('[data-hcard-next]');
    var hcI = 0;
    var show = function (k, byUser) {
      hcI = (k + ITEMS.length) % ITEMS.length;
      hcN.textContent = pad(hcI + 1);
      hcText.setAttribute('aria-live', byUser ? 'polite' : 'off');
      hcText.querySelector('.hcard__title').textContent = ITEMS[hcI][0];
      hcText.querySelector('.hcard__sub').textContent = ITEMS[hcI][1];
      restart(hcText, 'is-in');
      restart(card, 'is-running');
    };
    var pause = function (on) { card.classList.toggle('is-paused', on); };
    card.querySelector('[data-hcard-total]').textContent = pad(ITEMS.length);
    hcNext.hidden = false;
    hcNext.addEventListener('click', function () { show(hcI + 1, true); });
    hcBar.addEventListener('animationend', function () { show(hcI + 1, false); });
    card.addEventListener('mouseenter', function () { pause(true); });
    card.addEventListener('mouseleave', function () { pause(card.contains(document.activeElement)); });
    card.addEventListener('focusin', function () { pause(true); });
    card.addEventListener('focusout', function () { pause(card.matches(':hover')); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });
    card.classList.add('is-running');
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

  /* Formulario */
  var form = document.getElementById('form');
  if (!form) return;
  var ok = document.getElementById('form-ok');
  var err = document.getElementById('form-err');
  var stamp = document.getElementById('form-t');
  if (stamp) stamp.value = String(Date.now());

  var f = {
    nombre: form.elements.nombre,
    empresa: form.elements.empresa,
    telefono: form.elements.telefono,
    correo: form.elements.correo
  };

  /* Mensaje bajo el campo: kind 'error' marca el campo; 'hint' es un aviso gris que se borra solo */
  var hintTimers = {};
  function msg(input, text, kind) {
    var box = document.getElementById(input.getAttribute('aria-describedby'));
    clearTimeout(hintTimers[input.name]);
    box.classList.toggle('is-hint', kind === 'hint');
    box.textContent = text || '';
    if (kind === 'error' && text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (kind === 'hint' && text) {
      hintTimers[input.name] = setTimeout(function () { if (box.classList.contains('is-hint')) box.textContent = ''; }, 2600);
    }
    return box;
  }

  /* Reemplaza el valor sin mover el cursor de donde el usuario lo dejó */
  function rewrite(input, clean) {
    var v = input.value, pos = input.selectionStart == null ? v.length : input.selectionStart;
    var next = clean(v);
    if (next === v) return false;
    var before = clean(v.slice(0, pos));
    input.value = next;
    var p = Math.min(before.length, next.length);
    try { input.setSelectionRange(p, p); } catch (e) {}
    return true;
  }

  /* Nombre: solo letras (con tildes, ñ y ü) y un espacio entre palabras */
  var NOT_LETTER = /[^\p{L}\s]/u;
  function cleanNombre(v) { return v.replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').replace(/^ /, ''); }
  function checkNombre() {
    var v = f.nombre.value.trim();
    if (!v) return 'Escribe tu nombre.';
    if (v.replace(/\s/g, '').length < 2) return 'Escribe tu nombre completo.';
    return '';
  }

  /* Empresa: se permite todo, pero sin espacios dobles ni al inicio */
  function cleanEmpresa(v) { return v.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').replace(/^ /, ''); }
  function checkEmpresa() {
    var v = f.empresa.value.trim();
    if (!v) return 'Escribe el nombre de tu empresa.';
    if (!/[\p{L}\d]/u.test(v)) return 'Escribe el nombre de tu empresa.';
    return '';
  }

  /* Teléfono chileno: 9 dígitos. Celulares y Santiago: +56 9 1234 5678 / +56 2 1234 5678;
     regiones: +56 41 123 4567. Acepta que peguen el número con +56, espacios o guiones. */
  function phoneDigits(v) {
    var d = v.replace(/\D/g, '');
    if (d.indexOf('56') === 0) d = d.slice(2);   // 56 no es código de área, es el país
    d = d.replace(/^0+/, '');                     // prefijo antiguo de larga distancia
    return d.slice(0, 9);
  }
  function formatPhone(d) {
    if (!d) return '';
    var a = (d[0] === '9' || d[0] === '2') ? 1 : 2, b = a === 1 ? 4 : 3;
    var parts = [d.slice(0, a), d.slice(a, a + b), d.slice(a + b)].filter(Boolean);
    return '+56 ' + parts.join(' ');
  }
  function placeAfterDigit(input, n) {
    var v = input.value, i = 4, seen = 0;
    if (n <= 0) i = v ? 4 : 0;
    else for (; i < v.length && seen < n; i++) if (/\d/.test(v[i])) seen++;
    try { input.setSelectionRange(i, i); } catch (e) {}
  }
  function checkTelefono() {
    var d = phoneDigits(f.telefono.value);
    if (!d) return '';
    if (d.length < 9) return 'Faltan dígitos: el teléfono lleva 9, por ejemplo +56 9 1234 5678.';
    if (!/^[2-9]/.test(d)) return 'Revisa el teléfono: no parece un número de Chile.';
    return '';
  }

  /* Correo: forma nombre@dominio.tld y aviso si el dominio parece mal escrito */
  var EMAIL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;
  var TYPOS = {
    'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.cl': 'gmail.com', 'gmail.con': 'gmail.com', 'gnail.com': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
    'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com'
  };
  function cleanCorreo(v) { return v.replace(/\s+/g, ''); }
  function checkCorreo() {
    var v = f.correo.value.trim();
    if (!v) return '';
    if (v.indexOf('@') < 1) return 'Al correo le falta la @, por ejemplo nombre@empresa.cl.';
    if (v.length > 254 || !EMAIL.test(v)) return 'Revisa el correo: debe tener la forma nombre@empresa.cl.';
    return '';
  }
  function suggestCorreo() {
    var v = f.correo.value.trim().toLowerCase(), at = v.lastIndexOf('@');
    if (at < 1) return;
    var dom = v.slice(at + 1), fix = TYPOS[dom] || (/\.con$/.test(dom) ? dom.replace(/\.con$/, '.com') : '');
    if (!fix) return;
    var sug = v.slice(0, at + 1) + fix;
    var box = msg(f.correo, '', 'hint');
    clearTimeout(hintTimers.correo);
    box.textContent = '¿Quisiste decir ';
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = sug;
    b.addEventListener('click', function () { f.correo.value = sug; msg(f.correo, ''); f.correo.focus(); });
    box.appendChild(b);
    box.appendChild(document.createTextNode('?'));
  }

  function checkContacto() {
    if (!f.telefono.value.trim() && !f.correo.value.trim()) return 'Déjanos un teléfono o un correo para contactarte.';
    return '';
  }

  var checks = { nombre: checkNombre, empresa: checkEmpresa, telefono: checkTelefono, correo: checkCorreo };
  var touched = {};
  function validate(name) {
    var m = checks[name]();
    if (!m && (name === 'telefono' || name === 'correo') && touched.submit) {
      m = checkContacto();
      if (m && name === 'correo') m = '';             // el aviso de "uno de los dos" va solo bajo teléfono
    }
    msg(f[name], m, m ? 'error' : null);
    return !m;
  }

  /* Al escribir: limpia lo que no corresponde y avisa por qué desapareció */
  f.nombre.addEventListener('input', function () {
    var had = f.nombre.value;
    rewrite(f.nombre, cleanNombre);
    if (NOT_LETTER.test(had)) msg(f.nombre, 'Solo letras: sin números ni símbolos.', 'hint');
    else if (/\s\s/.test(had)) msg(f.nombre, 'Un solo espacio entre palabras.', 'hint');
    else if (touched.nombre) validate('nombre');
  });
  f.empresa.addEventListener('input', function () {
    rewrite(f.empresa, cleanEmpresa);
    if (touched.empresa) validate('empresa');
  });
  f.telefono.addEventListener('keydown', function (e) {
    // Borrar sobre un espacio o sobre el +56 salta al dígito anterior en vez de quedarse pegado
    if (e.key !== 'Backspace' || f.telefono.selectionStart !== f.telefono.selectionEnd) return;
    var v = f.telefono.value, pos = f.telefono.selectionStart;
    if (pos > 4 && !/\d/.test(v[pos - 1])) {
      while (pos > 4 && !/\d/.test(v[pos - 1])) pos--;
      f.telefono.setSelectionRange(pos, pos);
    } else if (pos <= 4 && v.length > 4) {
      e.preventDefault();
    }
  });
  f.telefono.addEventListener('input', function () {
    var v = f.telefono.value, pos = f.telefono.selectionStart == null ? v.length : f.telefono.selectionStart;
    var letters = /[^\d\s+\-().]/.test(v);
    var all = v.replace(/\D/g, ''), head = v.slice(0, pos).replace(/\D/g, '');
    var d = phoneDigits(v);
    var strip = all.length - all.replace(/^56/, '').replace(/^0+/, '').length;
    var n = Math.max(0, Math.min(head.length - strip, d.length));
    f.telefono.value = formatPhone(d);
    placeAfterDigit(f.telefono, n);
    if (letters) msg(f.telefono, 'Solo números.', 'hint');
    else if (touched.telefono) validate('telefono');
    if (touched.submit && f.correo.getAttribute('aria-invalid') && !checkCorreo()) validate('correo');
  });
  f.correo.addEventListener('input', function () {
    var had = /\s/.test(f.correo.value);
    rewrite(f.correo, cleanCorreo);
    if (had) msg(f.correo, 'El correo no lleva espacios.', 'hint');
    else if (touched.correo) validate('correo');
    if (touched.submit && f.telefono.getAttribute('aria-invalid')) validate('telefono');
  });

  /* Al salir del campo: ordena el texto y valida */
  Object.keys(f).forEach(function (name) {
    f[name].addEventListener('blur', function () {
      var input = f[name];
      if (name === 'correo') input.value = input.value.trim().toLowerCase();
      else input.value = input.value.trim();
      if (!input.value && !touched.submit) { msg(input, ''); return; }
      touched[name] = true;
      if (validate(name) && name === 'correo') suggestCorreo();
    });
  });

  function showError(text) {
    err.textContent = text;
    err.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    touched.submit = true;

    var firstBad = null;
    ['nombre', 'empresa', 'telefono', 'correo'].forEach(function (name) {
      f[name].value = name === 'correo' ? f[name].value.trim().toLowerCase() : f[name].value.trim();
      touched[name] = true;
      if (!validate(name) && !firstBad) firstBad = f[name];
    });
    if (firstBad) { firstBad.focus(); return; }

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
        if (!res.ok) {
          if (res.campo && f[res.campo]) { msg(f[res.campo], res.error, 'error'); f[res.campo].focus(); throw new Error('campo'); }
          throw new Error(res.error || 'envio');
        }
        track('envio_formulario', { sector: form.elements.sector.value });
        form.hidden = true;
        ok.hidden = false;
        ok.focus();
      })
      .catch(function (ex) {
        if (ex && ex.message === 'campo') return;
        var text = ex && ex.message && ex.message !== 'envio' && ex.message !== 'Failed to fetch'
          ? ex.message
          : 'No pudimos enviar tu solicitud. Intenta de nuevo o llámanos al +56 41 296 4800.';
        showError(text);
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });

  document.getElementById('form-reset').addEventListener('click', function () {
    form.reset();
    touched = {};
    Object.keys(f).forEach(function (name) { msg(f[name], ''); });
    if (stamp) stamp.value = String(Date.now());
    ok.hidden = true;
    form.hidden = false;
    f.nombre.focus();
  });
})();

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
