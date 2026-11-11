/* Appointment page: chamber-aware calendar, live validation, WhatsApp hand-off. */
(function () {
  'use strict';

  /* After a successful submit, open WhatsApp once with the prepared message. */
  var wa = document.querySelector('[data-autowa]');
  if (wa) {
    var key = 'dtwa' + wa.getAttribute('data-autowa');
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.open(wa.href, '_blank', 'noopener');
      }
    } catch (e) { /* storage blocked: the visible button still works */ }
  }

  /* Success box fades away after 5 seconds and the address bar is cleaned so a refresh shows the empty form. */
  var done = document.getElementById('done-box');
  if (done) {
    try {
      var u = new URL(window.location.href);
      ['dt_sent', 'k', 'dt_err', 'dt_old'].forEach(function (p) { u.searchParams.delete(p); });
      window.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) { /* ignore */ }
    var ms = parseInt(done.getAttribute('data-hide'), 10) || 5000;
    done.style.setProperty('--ms', ms + 'ms');
    done.classList.add('counting');
    setTimeout(function () {
      done.classList.add('gone');
      setTimeout(function () { window.location.reload(); }, 450);
    }, ms);
  }

  var form = document.getElementById('apt-form');
  if (!form) { return; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var dp = document.getElementById('dp');
  var btn = document.getElementById('dp-btn');
  var pop = document.getElementById('dp-pop');
  var valEl = document.getElementById('dp-val');
  var hint = document.getElementById('dp-hint');
  var hidden = document.getElementById('dt_date');
  var title = $('.dp-title', pop);
  var wdRow = $('.dp-wd', pop);
  var grid = $('.dp-grid', pop);
  var submit = document.getElementById('apt-submit');
  var status = document.getElementById('apt-hint');

  var months = JSON.parse(dp.getAttribute('data-months'));
  var wdShort = JSON.parse(dp.getAttribute('data-wd'));
  var wdLong = JSON.parse(dp.getAttribute('data-wdlong'));
  var isBn = dp.getAttribute('data-bn') === '1';
  var maxDays = parseInt(dp.getAttribute('data-max'), 10) || 120;
  var fmtDays = dp.getAttribute('data-daysfmt') || '%s';
  var firstMsg = dp.getAttribute('data-first');
  var placeholder = dp.getAttribute('data-ph');

  var BN = '০১২৩৪৫৬৭৮৯';
  var num = function (n) { return isBn ? String(n).replace(/\d/g, function (d) { return BN[d]; }) : String(n); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
  var parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };

  var todayD = parse(dp.getAttribute('data-today'));
  var maxD = new Date(todayD.getFullYear(), todayD.getMonth(), todayD.getDate() + maxDays);
  var todayISO = iso(todayD.getFullYear(), todayD.getMonth(), todayD.getDate());
  var maxISO = iso(maxD.getFullYear(), maxD.getMonth(), maxD.getDate());

  var allowed = null;          // array of weekdays (0=Sun) for the chosen chamber
  var selected = '';
  var view = { y: todayD.getFullYear(), m: todayD.getMonth() };

  wdShort.forEach(function (w) { var s = document.createElement('span'); s.textContent = w; wdRow.appendChild(s); });

  function isOpenDay(y, m, d) {
    var s = iso(y, m, d);
    if (s < todayISO || s > maxISO) { return false; }
    return !!allowed && allowed.indexOf(new Date(y, m, d).getDay()) !== -1;
  }

  function render() {
    title.textContent = months[view.m] + ' ' + num(view.y);
    var first = new Date(view.y, view.m, 1).getDay();
    var days = new Date(view.y, view.m + 1, 0).getDate();
    grid.innerHTML = '';
    for (var i = 0; i < first; i++) { grid.appendChild(document.createElement('span')); }
    for (var d = 1; d <= days; d++) {
      var b = document.createElement('button');
      var s = iso(view.y, view.m, d);
      var open = isOpenDay(view.y, view.m, d);
      b.type = 'button';
      b.textContent = num(d);
      b.setAttribute('data-d', s);
      b.setAttribute('role', 'gridcell');
      b.setAttribute('aria-label', wdLong[new Date(view.y, view.m, d).getDay()] + ', ' + num(d) + ' ' + months[view.m] + ' ' + num(view.y));
      b.className = 'dp-d' + (open ? ' on' : ' off') + (s === todayISO ? ' today' : '') + (s === selected ? ' sel' : '');
      if (!open) { b.disabled = true; }
      if (s === selected) { b.setAttribute('aria-selected', 'true'); }
      grid.appendChild(b);
    }
    $('[data-nav="-1"]', pop).disabled = (view.y === todayD.getFullYear() && view.m <= todayD.getMonth()) || view.y < todayD.getFullYear();
    $('[data-nav="1"]', pop).disabled = (view.y > maxD.getFullYear()) || (view.y === maxD.getFullYear() && view.m >= maxD.getMonth());
  }

  function firstOpenMonth() {
    var d = new Date(todayD);
    for (var i = 0; i <= maxDays; i++) {
      if (isOpenDay(d.getFullYear(), d.getMonth(), d.getDate())) { return { y: d.getFullYear(), m: d.getMonth() }; }
      d.setDate(d.getDate() + 1);
    }
    return { y: todayD.getFullYear(), m: todayD.getMonth() };
  }

  function openPop() {
    if (btn.disabled) { return; }
    if (selected) { var p = parse(selected); view = { y: p.getFullYear(), m: p.getMonth() }; }
    else { view = firstOpenMonth(); }
    render();
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var target = $('.dp-d.sel', grid) || $('.dp-d.on', grid);
    if (target) { target.focus({ preventScroll: true }); }
  }
  function closePop(refocus) {
    if (pop.hidden) { return; }
    pop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (refocus) { btn.focus(); }
  }

  function setDate(s) {
    selected = s;
    hidden.value = s;
    if (s) {
      var d = parse(s);
      valEl.textContent = wdLong[d.getDay()] + ', ' + num(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + num(d.getFullYear());
      btn.classList.add('has');
    } else {
      valEl.textContent = placeholder;
      btn.classList.remove('has');
    }
    validate();
  }

  function onChamber() {
    var r = $('input[name="dt_chamber"]:checked', form);
    if (!r) { return; }
    allowed = (r.getAttribute('data-days') || '0,1,2,3,4,5,6').split(',').map(Number);
    btn.disabled = false;
    btn.removeAttribute('aria-disabled');
    var names = allowed.slice().sort(function (a, b) { return a - b; }).map(function (n) { return wdLong[n]; });
    hint.textContent = fmtDays.replace('%s', names.join(isBn ? ', ' : ', '));
    hint.classList.add('ok');
    if (selected && !isOpenDay.apply(null, (function (p) { return [p.getFullYear(), p.getMonth(), p.getDate()]; })(parse(selected)))) { setDate(''); }
    if (!pop.hidden) { render(); }
    validate();
  }

  btn.disabled = true;
  btn.setAttribute('aria-disabled', 'true');
  hint.textContent = firstMsg;

  btn.addEventListener('click', function () { if (pop.hidden) { openPop(); } else { closePop(false); } });
  pop.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (nav && !nav.disabled) {
      var step = parseInt(nav.getAttribute('data-nav'), 10);
      var m = view.m + step;
      view = { y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
      render();
      return;
    }
    var day = e.target.closest('.dp-d');
    if (day && !day.disabled) { setDate(day.getAttribute('data-d')); closePop(true); }
  });
  pop.addEventListener('keydown', function (e) {
    var cur = document.activeElement;
    if (e.key === 'Escape') { e.preventDefault(); closePop(true); return; }
    if (!cur || !cur.classList.contains('dp-d')) { return; }
    var steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in steps)) { return; }
    e.preventDefault();
    var d = parse(cur.getAttribute('data-d'));
    for (var i = 0; i < 400; i++) {
      d.setDate(d.getDate() + steps[e.key]);
      var s = iso(d.getFullYear(), d.getMonth(), d.getDate());
      if (s > maxISO || s < todayISO) { return; }
      if (isOpenDay(d.getFullYear(), d.getMonth(), d.getDate())) {
        if (d.getMonth() !== view.m || d.getFullYear() !== view.y) { view = { y: d.getFullYear(), m: d.getMonth() }; render(); }
        var t = $('.dp-d[data-d="' + s + '"]', grid);
        if (t) { t.focus(); }
        return;
      }
    }
  });
  document.addEventListener('click', function (e) { if (!pop.hidden && !dp.contains(e.target)) { closePop(false); } });

  /* Live validation: the button stays disabled until every field is valid. */
  // Required: name, phone, chamber, date. Age is optional but must be sensible when typed.
  var checks = [
    ['dt_name', function (v) { return v.trim().length >= 2; }],
    ['dt_phone', function (v) { return /^01\d{9}$/.test(v.replace(/\D/g, '')); }],
    ['dt_age', function (v) { if (v === '') { return true; } var n = parseInt(v, 10); return /^\d+$/.test(v) && n >= 1 && n <= 120; }]
  ];
  function validate() {
    var left = 0;
    checks.forEach(function (c) {
      var el = form.elements[c[0]];
      var ok = el && c[1](el.value || '');
      if (!ok) { left++; }
    });
    if (!$('input[name="dt_chamber"]:checked', form)) { left++; }
    if (!hidden.value) { left++; }
    submit.disabled = left > 0;
    submit.setAttribute('aria-disabled', left > 0 ? 'true' : 'false');
    status.textContent = left > 0 ? status.getAttribute('data-left').replace('%s', num(left)) : status.getAttribute('data-ready');
    status.classList.toggle('ready', left === 0);
  }
  form.addEventListener('input', validate);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'dt_chamber') { onChamber(); }
    validate();
  });
  form.addEventListener('submit', function (e) { validate(); if (submit.disabled) { e.preventDefault(); } });

  // Phone: keep digits only while typing.
  var phone = form.elements.dt_phone;
  if (phone) { phone.addEventListener('input', function () { var v = phone.value.replace(/\D/g, '').slice(0, 11); if (v !== phone.value) { phone.value = v; } }); }

  // After a server-side error the previous date is pre-filled: show it, then let onChamber() drop it if the day is closed.
  if (hidden.value) {
    var keep = hidden.value;
    var kp = parse(keep);
    selected = keep;
    valEl.textContent = wdLong[kp.getDay()] + ', ' + num(kp.getDate()) + ' ' + months[kp.getMonth()] + ' ' + num(kp.getFullYear());
    btn.classList.add('has');
  }
  onChamber();
  validate();
})();
