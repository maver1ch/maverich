/*
 * Hero background: a slow field of "saved content" particles drifting through the dark,
 * linked into faint constellations. A few at a time get pulled into the Maverich ring at
 * the centre and become owned (bright, orbiting). Mouse adds a gentle parallax.
 * Pauses when off-screen or hidden; draws a single still frame under reduced motion.
 */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, DPR = 1, CX = 0, CY = 0, RING = 110;
  var particles = [], owned = [];
  var MAX_OWNED = 9, LINK_DIST = 110;
  var mouse = { x: 0, y: 0 }, parallax = { x: 0, y: 0 };
  var running = false, raf = 0, lastCapture = 0;

  var ACCENT = '127, 196, 168';   // mint, matches --accent on dark
  var WARM = '242, 241, 236';     // paper white

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // A large, faint ring frames the headline instead of sitting behind it.
    CX = W / 2; CY = H * 0.52;
    RING = Math.max(170, Math.min(W, H) * 0.42);
    var count = Math.round(Math.min(160, Math.max(70, (W * H) / 11000)));
    particles = [];
    for (var i = 0; i < count; i++) particles.push(spawn(true));
  }

  function spawn(anywhere) {
    // New particles enter from a random edge; the initial field is scattered everywhere.
    var edge = Math.floor(Math.random() * 4), x, y;
    if (anywhere) { x = Math.random() * W; y = Math.random() * H; }
    else if (edge === 0) { x = Math.random() * W; y = -10; }
    else if (edge === 1) { x = W + 10; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + 10; }
    else { x = -10; y = Math.random() * H; }
    return { x: x, y: y, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
             r: 0.8 + Math.random() * 1.6, a: 0.25 + Math.random() * 0.45, pull: Math.random() < 0.18 };
  }

  function step(dt, now) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.pull) { // a minority drifts toward the ring and can be captured
        var dx = CX - p.x, dy = CY - p.y, d = Math.hypot(dx, dy) || 1;
        p.vx += (dx / d) * 0.004 * dt; p.vy += (dy / d) * 0.004 * dt;
        if (d < RING + 6 && owned.length < MAX_OWNED && now - lastCapture > 1400) {
          owned.push({ ang: Math.atan2(p.y - CY, p.x - CX), born: now });
          lastCapture = now; particles[i] = spawn(false); continue;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) particles[i] = spawn(false);
    }
    // Retire the oldest owned dot after a while so the ring keeps breathing.
    if (owned.length && now - owned[0].born > 16000) owned.shift();
    parallax.x += (mouse.x * 14 - parallax.x) * 0.04;
    parallax.y += (mouse.y * 14 - parallax.y) * 0.04;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(parallax.x, parallax.y);

    // Constellation links between nearby particles.
    ctx.lineWidth = 1;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i], b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        if (Math.abs(dx) > LINK_DIST || Math.abs(dy) > LINK_DIST) continue;
        var d = Math.hypot(dx, dy);
        if (d > LINK_DIST) continue;
        ctx.strokeStyle = 'rgba(' + WARM + ',' + (0.09 * (1 - d / LINK_DIST)) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    // Particles.
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];
      ctx.fillStyle = 'rgba(' + (p.pull ? ACCENT : WARM) + ',' + p.a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    // The ring: an open arc like the mark, large and quiet, with a soft inner glow behind the headline.
    var breathe = 1 + Math.sin(now / 1600) * 0.012;
    var halo = ctx.createRadialGradient(CX, CY, 0, CX, CY, RING * 1.05);
    halo.addColorStop(0, 'rgba(' + ACCENT + ',0.10)'); halo.addColorStop(0.75, 'rgba(' + ACCENT + ',0.03)'); halo.addColorStop(1, 'rgba(' + ACCENT + ',0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(CX, CY, RING * 1.05, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = 'rgba(' + ACCENT + ',0.45)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(CX, CY, RING * breathe, -Math.PI * 0.42 + now / 60000, Math.PI * 1.42 + now / 60000); ctx.stroke();

    // Owned dots travel along the ring, each with a small glow.
    for (var m = 0; m < owned.length; m++) {
      var o = owned[m], age = Math.min(1, (now - o.born) / 900);
      var ang = o.ang + (now - o.born) / 14000;
      var px = CX + Math.cos(ang) * RING * breathe, py = CY + Math.sin(ang) * RING * breathe;
      ctx.fillStyle = 'rgba(' + ACCENT + ',' + (0.25 * age) + ')';
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + ACCENT + ',' + (0.95 * age) + ')';
      ctx.beginPath(); ctx.arc(px, py, 2.4 + age * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  var last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(2.5, (now - last) / 16.67 || 1); last = now;
    step(dt, now); draw(now);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduceMotion) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(0); });
  canvas.parentElement.addEventListener('mousemove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width - 0.5; mouse.y = (e.clientY - r.top) / r.height - 0.5;
  });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { entries[0].isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(canvas);
  } else { start(); }

  if (reduceMotion) { for (var i = 0; i < 5; i++) owned.push({ ang: i * 1.3, born: -20000 }); draw(0); }
})();
