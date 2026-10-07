/*
 * Maverich landing page behaviour.
 * Everything degrades to static content without JS: the demo shows its first
 * state, tabs show their first panel, the form still exposes the email address.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero product demo: auto-advancing states with clickable steps ---------- */
  function initDemo(root) {
    var panels = root.querySelectorAll('[data-panel]');
    var steps = root.querySelectorAll('[data-step]');
    var bubble = root.querySelector('[data-typewriter]');
    var fullText = bubble ? bubble.getAttribute('data-typewriter') : '';
    var INTERVAL = 4200;
    var current = 0;
    var timer = null;
    var typingTimer = null;

    root.style.setProperty('--demo-interval', INTERVAL + 'ms');

    // Types the Maverich question one character at a time; skipped under reduced motion.
    function typeBubble() {
      if (!bubble) return;
      clearTimeout(typingTimer);
      if (reduceMotion) { bubble.textContent = fullText; bubble.classList.add('is-done'); return; }
      bubble.textContent = '';
      bubble.classList.remove('is-done');
      var i = 0;
      (function tick() {
        bubble.textContent = fullText.slice(0, ++i);
        if (i < fullText.length) typingTimer = setTimeout(tick, 28);
        else bubble.classList.add('is-done');
      })();
    }

    function show(index) {
      current = (index + panels.length) % panels.length;
      panels.forEach(function (p, i) { p.classList.toggle('is-active', i === current); });
      steps.forEach(function (s, i) {
        s.setAttribute('aria-selected', String(i === current));
        // Restart the progress bar animation by forcing a reflow on the newly selected step.
        if (i === current) { var bar = s.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      if (current === 1) typeBubble();
    }

    function start() { stop(); if (!reduceMotion) timer = setInterval(function () { show(current + 1); }, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }

    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { show(i); start(); });
    });
    // Pause while the visitor is reading or interacting with the preview.
    root.addEventListener('mouseenter', function () { root.classList.add('is-paused'); stop(); });
    root.addEventListener('mouseleave', function () { root.classList.remove('is-paused'); start(); });
    root.addEventListener('focusin', function () { root.classList.add('is-paused'); stop(); });
    root.addEventListener('focusout', function () { root.classList.remove('is-paused'); start(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    show(0);
    start();
  }

  /* ---------- Accessible tabs (How it works) with arrow-key navigation ---------- */
  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(index, focus) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1
                 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1
                 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (next === null) return;
        e.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      });
    });
  }

  /* ---------- Request-access form: validates, then opens a pre-filled email ---------- */
  function initAccessForm(form) {
    var input = form.querySelector('input[type="email"]');
    var status = form.querySelector('[data-status]');
    var original = status.innerHTML;

    function setStatus(html, kind) {
      status.innerHTML = html;
      status.className = 'access-hint' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', 'error');
        input.focus();
        return;
      }
      var subject = encodeURIComponent('Maverich beta access');
      var body = encodeURIComponent(
        'Hi Maverich,\n\nI would like access to the private beta.\n\nMy email: ' + email +
        '\nWhat I am trying to learn right now: \n\nThanks!'
      );
      window.location.href = 'mailto:victor@maver1ch.world?subject=' + subject + '&body=' + body;
      setStatus('Opening your email app. If nothing happens, write to <a href="mailto:victor@maver1ch.world">victor@maver1ch.world</a>.', 'ok');
    });

    input.addEventListener('input', function () { if (status.classList.contains('is-error')) setStatus(original, ''); });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  document.querySelectorAll('[data-demo]').forEach(initDemo);
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
  document.querySelectorAll('[data-access-form]').forEach(initAccessForm);
  initReveal();
})();
