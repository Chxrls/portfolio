/* ═══════════════════════════════════════════════════════
   CHARLS MELINDO — main.js
   Parallax scroll controller + reveal animations
═══════════════════════════════════════════════════════ */

// ── ELEMENTS ──────────────────────────────────────────
const navbar      = document.getElementById('navbar');
const stage       = document.getElementById('scroll-stage');
const photoWrap   = document.getElementById('photo-wrap');
const bgType      = document.getElementById('bg-type');
const bgLines     = document.querySelectorAll('.bg-line');
const sideDesc    = document.getElementById('side-desc');
const heroLabel   = document.getElementById('hero-label');
const projPanel   = document.getElementById('projects-panel');
const projHeading = document.querySelector('.proj-heading');
const projCards   = document.querySelectorAll('.proj-card');
const contactPanel = document.getElementById('contact-panel');
const chips       = document.querySelectorAll('.skill-chip');
const isMobile    = () => window.innerWidth <= 768;

// ── LOAD-IN REVEALS ───────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Stagger reveal big text lines
  requestAnimationFrame(() => {
    bgLines.forEach(l => l.classList.add('revealed'));
    setTimeout(() => sideDesc.classList.add('revealed'), 500);
    setTimeout(() => photoWrap.classList.add('revealed'), 400);
    setTimeout(() => heroLabel.classList.add('revealed'), 600);
  });
});

// ── NAV SCROLL STATE ──────────────────────────────────
function updateNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}

// ── ACTIVE NAV LINKS ──────────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const anchors  = [
  { id: 'hero-anchor',     link: navLinks[0] },
  { id: 'skills-anchor',   link: navLinks[1] },
  { id: 'contact-anchor',  link: navLinks[2] },
];

function updateActiveNav() {
  const scrollY = window.scrollY + 120;
  let current = anchors[0];
  anchors.forEach(a => {
    const el = document.getElementById(a.id);
    if (el && el.getBoundingClientRect().top + window.scrollY <= scrollY) {
      current = a;
    }
  });
  navLinks.forEach(l => l.classList.remove('active'));
  current.link.classList.add('active');
}

// ── PARALLAX SCROLL CONTROLLER ────────────────────────
// Stage is 400vh. We divide it into phases:
//   0–25%   → hero visible (photo centered)
//   25–55%  → projects phase (photo left, cards appear)
//   55–85%  → contact phase (photo right, contact appears)
//   85–100% → rest

function lerp(a, b, t) { return a + (b - a) * Math.min(Math.max(t, 0), 1); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

let lastScrollY = -1;
let rafId = null;

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(tick);
}

function tick() {
  rafId = null;
  const scrollY = window.scrollY;
  if (scrollY === lastScrollY) return;
  lastScrollY = scrollY;

  updateNav();
  updateActiveNav();

  if (isMobile()) return; // mobile handled by CSS

  const stageTop    = stage.offsetTop;
  const stageHeight = stage.offsetHeight;
  const viewH       = window.innerHeight;

  // Normalized progress through the stage (0–1)
  const raw = (scrollY - stageTop) / (stageHeight - viewH);
  const p   = Math.min(Math.max(raw, 0), 1);

  // ── Phase breakpoints ──
  const PHASE_PROJ_START  = 0.15;
  const PHASE_PROJ_FULL   = 0.35;
  const PHASE_CONT_START  = 0.55;
  const PHASE_CONT_FULL   = 0.72;

  // ── Photo position ──
  // Hero: centered (translateX -50% of photo, i.e. left:50%)
  // Projects phase: slide photo left to ~18% from left edge
  // Contact phase: slide photo to right ~62% from left edge

  const vw = window.innerWidth;
  const photoW = photoWrap.offsetWidth;

  // Center position (left offset so center of photo = center of vw)
  const centerLeft = (vw - photoW) / 2;

  // Projects phase: photo anchor left ~14% from left
  const leftLeft = vw * 0.10;

  // Contact phase: photo anchor right ~60% from left
  const rightLeft = vw * 0.56;

  let photoLeft = centerLeft;

  if (p >= PHASE_PROJ_START && p < PHASE_CONT_START) {
    // Slide from center → left
    const t = easeOut((p - PHASE_PROJ_START) / (PHASE_PROJ_FULL - PHASE_PROJ_START));
    photoLeft = lerp(centerLeft, leftLeft, t);
  } else if (p >= PHASE_CONT_START) {
    // Slide from left → right
    const t = easeOut((p - PHASE_CONT_START) / (PHASE_CONT_FULL - PHASE_CONT_START));
    photoLeft = lerp(leftLeft, rightLeft, t);
  }

  photoWrap.style.left      = photoLeft + 'px';
  photoWrap.style.transform = 'none'; // override initial -50% after first tick

  // ── Big type parallax (subtle vertical drift) ──
  const typeY = p * -30;
  bgType.style.transform = `translateY(calc(-50% + ${typeY}px))`;

  // ── Project panel ──
  const projProgress = easeOut(Math.min(Math.max(
    (p - PHASE_PROJ_START) / (PHASE_PROJ_FULL - PHASE_PROJ_START), 0), 1));

  if (projProgress > 0.1) {
    projHeading.classList.add('visible');
    projCards.forEach((card, i) => {
      if (projProgress > 0.2 + i * 0.12) card.classList.add('visible');
    });
  } else {
    projHeading.classList.remove('visible');
    projCards.forEach(card => card.classList.remove('visible'));
  }

  // ── Contact panel ──
  const contProgress = easeOut(Math.min(Math.max(
    (p - PHASE_CONT_START) / (PHASE_CONT_FULL - PHASE_CONT_START), 0), 1));

  if (contProgress > 0.15) {
    contactPanel.classList.add('visible');
  } else {
    contactPanel.classList.remove('visible');
  }

  // ── Side desc: fade out as projects appear ──
  const sideOpacity = 1 - easeOut(Math.min(Math.max(
    (p - PHASE_PROJ_START) / 0.12, 0), 1));
  sideDesc.style.opacity = sideOpacity;

  // ── Hero label: fade out early ──
  heroLabel.style.opacity = 1 - easeOut(Math.min(Math.max(p / 0.1, 0), 1));
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', tick);

// ── SMOOTH NAV SCROLLING ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    // For nav links targeting the scroll-stage anchors,
    // scroll to the corresponding stage position
    if (id === 'hero-anchor') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'skills-anchor') {
      const skillsSection = document.getElementById('skills-section');
      window.scrollTo({ top: skillsSection.offsetTop - 60, behavior: 'smooth' });
    } else if (id === 'contact-anchor') {
      // Scroll to contact phase in the stage (≈72% through)
      const stageTop = stage.offsetTop;
      const stageH   = stage.offsetHeight;
      const viewH    = window.innerHeight;
      const target   = stageTop + (stageH - viewH) * 0.63;
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── SKILLS — IntersectionObserver reveal ─────────────
const chipObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-chip').forEach(chip => {
        chip.classList.add('revealed');
      });
      chipObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.chips-row').forEach(row => chipObserver.observe(row));

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
      if (res.ok) {
        submitBtn.textContent = 'sent ✓';
        form.reset();
      } else throw new Error();
    } catch {
      submitBtn.textContent = 'failed — try again';
      submitBtn.disabled = false;
    }
  });
}

// Initial tick on load
window.addEventListener('load', tick);
