// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav: border on scroll + highlight current section
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const navLinks = [...document.querySelectorAll('.nav nav a[href^="#"]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));

// Reveal on scroll
if (!reduceMotion && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.section-head, .prose, .focus, .role, .pub, .more-pubs, .card');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => { el.classList.add('reveal'); revealObserver.observe(el); });
}

// Hero background: a few faint geometric-Brownian-motion price paths drawing across the page
(() => {
  const canvas = document.querySelector('.hero-paths');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const STEPS = 220;
  let paths = [];
  let progress = 0;
  let width = 0;
  let height = 0;

  // Box–Muller standard normal
  const randn = () => {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const simulate = () => {
    paths = Array.from({ length: 7 }, (_, i) => {
      const mu = 0.0006;
      const sigma = 0.012 + i * 0.0025;
      const pts = [1];
      for (let t = 1; t < STEPS; t++) pts.push(pts[t - 1] * Math.exp(mu - 0.5 * sigma * sigma + sigma * randn()));
      return { pts, highlight: i === 0 };
    });
    const all = paths.flatMap((p) => p.pts);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    paths.forEach((p) => { p.ys = p.pts.map((v) => 0.82 - 0.6 * (v - lo) / (hi - lo || 1)); });
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  const draw = () => {
    const styles = getComputedStyle(document.documentElement);
    const gold = styles.getPropertyValue('--gold').trim();
    const line = styles.getPropertyValue('--line').trim();
    ctx.clearRect(0, 0, width, height);
    const n = Math.max(2, Math.floor(progress * STEPS));
    paths.forEach((p) => {
      ctx.beginPath();
      for (let t = 0; t < n; t++) {
        const x = (t / (STEPS - 1)) * width;
        const y = p.ys[t] * height;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = p.highlight ? gold : line;
      ctx.globalAlpha = p.highlight ? 0.55 : 0.9;
      ctx.lineWidth = p.highlight ? 1.5 : 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  const animate = () => {
    progress = Math.min(1, progress + 0.006);
    draw();
    if (progress < 1) requestAnimationFrame(animate);
  };

  simulate();
  progress = reduceMotion ? 1 : 0;
  resize();
  window.addEventListener('resize', resize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  if (!reduceMotion) requestAnimationFrame(animate);
})();
