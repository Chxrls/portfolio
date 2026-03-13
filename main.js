/* ═══════════════════════════════════════════════════════
   CHARLS MELINDO — main.js  v3
   Scroll phases:
     0  – 20%  → Hero (photo visible)
     20 – 32%  → Photo fades out
     32 – 65%  → Projects cards slide in (photo gone)
     65 – 88%  → Contact phase fades in
═══════════════════════════════════════════════════════ */

const navbar        = document.getElementById('navbar');
const stage         = document.getElementById('scroll-stage');
const bgType        = document.getElementById('bg-type');
const bgLines       = document.querySelectorAll('.bg-line');
const photoCol      = document.getElementById('photo-col');
const heroLabel     = document.getElementById('hero-label');
const projPanel     = document.getElementById('projects-panel');
const projHeading   = document.querySelector('.proj-heading');
const projCards     = document.querySelectorAll('.proj-card');
const contactPanel  = document.getElementById('contact-panel');
const contactOverlay = document.getElementById('contact-overlay');
const navLinks      = document.querySelectorAll('.nav-link');

const isMobile = () => window.innerWidth <= 768;

// ── PHASE BREAKPOINTS ─────────────────────────────────
const PH_PHOTO_FADE_START  = 0.20;  // photo starts fading
const PH_PHOTO_FADE_END    = 0.32;  // photo fully gone
const PH_PROJ_START        = 0.34;  // cards begin appearing
const PH_PROJ_FULL         = 0.60;  // all cards visible
const PH_CONT_START        = 0.65;  // contact fades in
const PH_CONT_FULL         = 0.82;  // contact fully visible

// ── LOAD-IN ANIMATION ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    bgLines.forEach(l => l.classList.add('revealed'));
    setTimeout(() => photoCol.classList.add('revealed'), 420);
    setTimeout(() => heroLabel.classList.add('revealed'), 600);
  });
});

// ── HELPERS ───────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function norm(v, lo, hi)   { return clamp((v - lo) / (hi - lo), 0, 1); }
function easeOut(t)        { return 1 - Math.pow(1 - t, 3); }

// ── SCROLL TICK ───────────────────────────────────────
let lastY = -1;
let raf   = null;

function onScroll() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function tick() {
  raf = null;
  const y = window.scrollY;
  if (y === lastY && !firstTick) return;
  lastY = y; firstTick = false;

  // Nav
  navbar.classList.toggle('scrolled', y > 30);
  updateActiveNav(y);

  if (isMobile()) return;

  const stageTop  = stage.offsetTop;
  const stageH    = stage.offsetHeight;
  const viewH     = window.innerHeight;
  const p         = clamp((y - stageTop) / (stageH - viewH), 0, 1);

  // ── Big type subtle drift ──
  bgType.style.transform = `translateY(calc(-50% + ${p * -28}px))`;

  // ── Photo col: fade out during photo-fade phase ──
  const photoFadeT = easeOut(norm(p, PH_PHOTO_FADE_START, PH_PHOTO_FADE_END));
  photoCol.style.opacity = String(1 - photoFadeT);
  photoCol.style.pointerEvents = photoFadeT > 0.5 ? 'none' : '';

  // Hero label fades at same rate
  heroLabel.style.opacity = String(Math.max(0, 1 - easeOut(norm(p, PH_PHOTO_FADE_START, PH_PHOTO_FADE_END + 0.04))));

  // ── Projects panel ──
  if (p >= PH_PROJ_START) {
    const t = easeOut(norm(p, PH_PROJ_START, PH_PROJ_FULL));
    projHeading.classList.toggle('visible', t > 0.05);
    projCards.forEach((card, i) => {
      card.classList.toggle('visible', t > 0.15 + i * 0.12);
    });
  } else {
    projHeading.classList.remove('visible');
    projCards.forEach(c => c.classList.remove('visible'));
  }

  // ── Contact phase ──
  const contT = easeOut(norm(p, PH_CONT_START, PH_CONT_FULL));
  contactPanel.classList.toggle('visible', contT > 0.12);
  contactOverlay.classList.toggle('visible', contT > 0.08);
}

let firstTick = true;
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { firstTick = true; tick(); });
window.addEventListener('load',   () => { firstTick = true; tick(); });

// ── ACTIVE NAV ────────────────────────────────────────
function updateActiveNav(y) {
  const skillsEl   = document.getElementById('skills-section');
  const skillsTop  = skillsEl ? skillsEl.offsetTop - 100 : Infinity;

  // Check contact scroll position
  const stageTop  = stage.offsetTop;
  const stageH    = stage.offsetHeight;
  const viewH     = window.innerHeight;
  const p         = clamp((y - stageTop) / (stageH - viewH), 0, 1);
  const inContact = p >= PH_CONT_START;

  navLinks.forEach(l => l.classList.remove('active'));
  if (y >= skillsTop) {
    navLinks[1].classList.add('active');
  } else if (inContact) {
    navLinks[2].classList.add('active');
  } else {
    navLinks[0].classList.add('active');
  }
}

// ── SMOOTH NAV CLICKS ─────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);

    if (id === 'hero-anchor') {
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } else if (id === 'skills-anchor') {
      const el = document.getElementById('skills-section');
      if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });

    } else if (id === 'contact-anchor') {
      const stageTop = stage.offsetTop;
      const stageH   = stage.offsetHeight;
      const viewH    = window.innerHeight;
      const target   = stageTop + (stageH - viewH) * (PH_CONT_START + 0.05);
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  });
});

// ── SKILL CHIPS — IntersectionObserver reveal ─────────
const chipObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-chip').forEach(c => c.classList.add('revealed'));
      chipObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.chips-row').forEach(r => chipObs.observe(r));

// ── CONTACT FORM ──────────────────────────────────────
const form      = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    submitBtn.textContent = 'sending...';
    submitBtn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) { submitBtn.textContent = 'sent ✓'; form.reset(); }
      else throw new Error();
    } catch {
      submitBtn.textContent = 'failed — try again';
      submitBtn.disabled = false;
    }
  });
}
