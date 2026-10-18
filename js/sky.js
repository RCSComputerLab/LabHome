/* Night sky: twinkling stars, shooting stars, and sparkle effects. */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ffffff', '#ffd1f1', '#fff4a8', '#b8f3ff', '#d9c8ff', '#a8ffd9'];

  function buildSky(options) {
    options = options || {};
    const sky = document.createElement('div');
    sky.className = 'sky';
    sky.setAttribute('aria-hidden', 'true');
    sky.innerHTML =
      '<div class="aurora"><span></span><span></span><span></span><span></span></div>' +
      '<canvas id="stars"></canvas>' +
      '<div class="horizon-glow"></div>';
    document.body.prepend(sky);
    startStars(sky.querySelector('#stars'), options.starCount || 170);
  }

  function startStars(canvas, count) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shooting = null;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        r: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.002 + 0.0006,
        phase: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        big: Math.random() < 0.06
      }));
      addHiddenMickey();
    }

    /** A little three-circle constellation tucked into the sky for sharp-eyed kids to find. */
    function addHiddenMickey() {
      const narrow = w < 700;
      const cx = w * (narrow ? 0.8 : 0.86);
      const cy = h * (narrow ? 0.82 : 0.5);
      const R = Math.max(18, Math.min(30, Math.min(w, h) * 0.03));
      const circles = [
        { x: cx, y: cy, r: R },
        { x: cx - R * 0.95, y: cy - R * 0.95, r: R * 0.62 },
        { x: cx + R * 0.95, y: cy - R * 0.95, r: R * 0.62 }
      ];

      // Clear random stars out of the way so the shape reads cleanly.
      stars = stars.filter(s => !circles.some(c => Math.hypot(s.x - c.x, s.y - c.y) < c.r + 4));

      // Stars along the outline only: skip points that fall inside another circle.
      const gap = 11;
      circles.forEach(c => {
        const n = Math.round((Math.PI * 2 * c.r) / gap);
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          const x = c.x + Math.cos(a) * c.r;
          const y = c.y + Math.sin(a) * c.r;
          if (circles.some(o => o !== c && Math.hypot(x - o.x, y - o.y) < o.r - 1)) continue;
          stars.push({
            x, y,
            r: 0.7 + Math.random() * 0.4,
            speed: 0.0008 + Math.random() * 0.0012,
            phase: Math.random() * Math.PI * 2,
            min: 0.25,
            max: 0.75,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            big: false
          });
        }
      });
    }

    function drawStar(s, t) {
      const min = s.min || 0.35;
      const max = s.max || 1;
      const a = reduceMotion ? max * 0.8 : min + (max - min) * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      if (s.big) {
        // four-point twinkle
        const r = s.r * 3.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - r);
        ctx.quadraticCurveTo(s.x, s.y, s.x + r, s.y);
        ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + r);
        ctx.quadraticCurveTo(s.x, s.y, s.x - r, s.y);
        ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - r);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => drawStar(s, t));

      if (!reduceMotion) {
        if (!shooting && Math.random() < 0.004) {
          shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.35, life: 0 };
        }
        if (shooting) {
          shooting.life += 1;
          const len = 120;
          const x = shooting.x + shooting.life * 9;
          const y = shooting.y + shooting.life * 3.5;
          const grad = ctx.createLinearGradient(x, y, x - len, y - len * 0.39);
          grad.addColorStop(0, 'rgba(255,255,255,0.95)');
          grad.addColorStop(1, 'rgba(255,180,240,0)');
          ctx.globalAlpha = Math.max(0, 1 - shooting.life / 60);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - len, y - len * 0.39);
          ctx.stroke();
          if (shooting.life > 60) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', () => { resize(); if (reduceMotion) frame(0); });
    requestAnimationFrame(frame);
  }

  /** A puff of sparkles at a point on screen. */
  function burst(x, y, count, spread) {
    count = count || 14;
    spread = spread || 90;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = spread * (0.5 + Math.random() * 0.6);
      spawn(x, y, Math.cos(angle) * dist, Math.sin(angle) * dist, 700 + Math.random() * 400, 10 + Math.random() * 10);
    }
  }

  /** Sparkles raining down across the whole screen. */
  function celebrate() {
    if (reduceMotion) return;
    const rainbow = ['#ff6b9d', '#ff9f43', '#feca57', '#7bed9f', '#48dbfb', '#a29bfe', '#d980fa'];
    for (let i = 0; i < 90; i++) {
      setTimeout(() => {
        spawn(Math.random() * innerWidth, -10, (Math.random() - 0.5) * 120, innerHeight * (0.6 + Math.random() * 0.4),
          1800 + Math.random() * 1200, 12 + Math.random() * 14, rainbow[i % rainbow.length]);
      }, i * 25);
    }
  }

  function spawn(x, y, dx, dy, life, size, color) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = el.style.height = size + 'px';
    el.style.margin = (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px';
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.style.setProperty('--life', life + 'ms');
    el.style.setProperty('--c', color || COLORS[Math.floor(Math.random() * COLORS.length)]);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), life + 50);
  }

  /** Pixie-dust trail that follows the mouse. */
  function enableTrail() {
    if (reduceMotion) return;
    let last = 0;
    window.addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      spawn(e.clientX, e.clientY, (Math.random() - 0.5) * 30, 20 + Math.random() * 30, 700, 6 + Math.random() * 7);
    }, { passive: true });
  }

  window.Sky = { buildSky, burst, celebrate, enableTrail, reduceMotion };
})();
