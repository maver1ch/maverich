/*
 * Maverich landing page behaviour.
 * Header theme follows the chapter under it; statements reveal word by word on scroll;
 * chapters 01–04 drive a sticky index; proof tabs are keyboard accessible; the access
 * form validates and opens a pre-filled email. Everything degrades to static content.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');

  /* ---------- Header: glass once scrolled, colour follows the chapter beneath it ---------- */
  function initHeader() {
    var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter-theme]'));
    var ticking = false;
    function update() {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      // Find the chapter sitting under the header's bottom edge. Inside a chapter's top fade band
      // the background still looks like the previous chapter, so keep the previous theme there.
      var probeY = 76, theme = 'dark';
      for (var i = 0; i < chapters.length; i++) {
        var r = chapters[i].getBoundingClientRect();
        if (r.top <= probeY && r.bottom > probeY) {
          theme = chapters[i].getAttribute('data-chapter-theme');
          var fade = chapters[i].querySelector('.fade');
          if (fade && probeY - r.top < fade.offsetHeight * 0.6) theme = theme === 'dark' ? 'light' : 'dark';
          break;
        }
      }
      if (header.getAttribute('data-nav-theme') !== theme) header.setAttribute('data-nav-theme', theme);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Statements: words turn from faint to ink as the block scrolls into view ---------- */
  function splitWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var span = document.createElement('span'); span.className = 'w'; span.textContent = part; frag.appendChild(span);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        splitWords(child);
      }
    });
  }

  function initWordReveal() {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-word-reveal]'));
    blocks.forEach(splitWords);
    if (reduceMotion) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      blocks.forEach(function (b) {
        var r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // 0 when the block enters at 85% of the viewport, 1 once its top passes 35%.
        var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5)));
        var words = b.querySelectorAll('.w');
        var cut = Math.round(p * words.length);
        words.forEach(function (w, i) { w.classList.toggle('on', i < cut); });
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Chapters 01–04: reveal panels and highlight the sticky index ---------- */
  function initChapters(root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-chapter]'));
    var links = Array.prototype.slice.call(root.querySelectorAll('.chapters-nav a'));
    if (!('IntersectionObserver' in window)) { panels.forEach(function (p) { p.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = panels.indexOf(e.target);
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          links.forEach(function (a, j) { a.setAttribute('aria-current', j === i ? 'true' : 'false'); });
        } else if (!reduceMotion && e.boundingClientRect.top > 0) {
          e.target.classList.remove('is-in'); // scrolled back above it: let it fade again on return
        }
      });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });
  }

  /* ---------- Accessible tabs with arrow-key navigation ---------- */
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

  /* ---------- Marquee: duplicate the track once so the loop is seamless ---------- */
  function initMarquee(root) {
    var track = root.querySelector('.marquee-track');
    if (!track || reduceMotion) return;
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var clone = li.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
    });
  }

  /* ---------- Access form: validate, then open a pre-filled email ---------- */
  function initAccessForm(form) {
    var input = form.querySelector('input[type="email"]');
    var status = form.querySelector('[data-status]');
    var original = status.innerHTML;
    function setStatus(html, kind) { status.innerHTML = html; status.className = 'access-hint' + (kind ? ' is-' + kind : ''); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('Please enter a valid email address.', 'error'); input.focus(); return; }
      var subject = encodeURIComponent('Maverich beta access');
      var body = encodeURIComponent('Hi Maverich,\n\nI would like access to the private beta.\n\nMy email: ' + email + '\nOne goal I am working toward: \n\nThanks!');
      window.location.href = 'mailto:victor@maver1ch.world?subject=' + subject + '&body=' + body;
      setStatus('Opening your email app. If nothing happens, write to <a href="mailto:victor@maver1ch.world">victor@maver1ch.world</a>.', 'ok');
    });
    input.addEventListener('input', function () { if (status.classList.contains('is-error')) setStatus(original, ''); });
  }

  /* ---------- Generic scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  initHeader();
  initWordReveal();
  document.querySelectorAll('[data-chapters]').forEach(initChapters);
  document.querySelectorAll('[data-tabs]').forEach(initTabs);
  document.querySelectorAll('[data-marquee]').forEach(initMarquee);
  document.querySelectorAll('[data-access-form]').forEach(initAccessForm);
  initReveal();
})();
