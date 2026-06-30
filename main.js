// ====================================================
// SOFIA PULSE — Premium Main Script v2
// Cinematic hero reveal · Canvas scroll · Glass cards
// Security: honeypot, rate limiting, input sanitization
// ====================================================

'use strict';

// ==================== UTILITY ====================
function sanitize(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ==================== MOBILE MENU ====================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

function openMobileMenu() {
  mobileMenu.classList.add('active');
  mobileMenuBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  const spans = mobileMenuBtn.querySelectorAll('span');
  spans[0].style.transform = 'rotate(45deg) translate(4px, 5px)';
  spans[1].style.opacity = '0';
  spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('active');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  mobileMenuBtn.querySelectorAll('span').forEach(s => {
    s.style.transform = 'none';
    s.style.opacity = '1';
  });
}

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    const isActive = mobileMenu.classList.contains('active');
    if (isActive) closeMobileMenu();
    else openMobileMenu();
  });
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
      mobileMenuBtn.focus();
    }
  });
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMobileMenu();
  });
}

const navBrand = document.querySelector('.nav-brand');
if (navBrand) navBrand.addEventListener('click', closeMobileMenu);

// ==================== NAVBAR SCROLL EFFECT ====================
const navbar = document.getElementById('navbar');
let navTicking = false;

window.addEventListener('scroll', () => {
  if (!navTicking) {
    requestAnimationFrame(() => {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
      navTicking = false;
    });
    navTicking = true;
  }
}, { passive: true });

// ==================== HERO VIDEO — CINEMATIC REVEAL ====================
const heroVideo = document.getElementById('hero-video');
const heroContent = document.getElementById('hero-content');
const heroVignette = document.querySelector('.hero-vignette');
const heroCinematicOverlay = document.getElementById('hero-cinematic-overlay');
const heroAgency = document.getElementById('hero-agency');
let heroRevealed = false;

function revealHeroContent() {
  if (heroRevealed) return;
  heroRevealed = true;
  if (heroVignette) heroVignette.classList.add('active');
  setTimeout(() => {
    if (heroCinematicOverlay) heroCinematicOverlay.classList.add('active');
  }, 180);
  setTimeout(() => {
    if (heroContent) {
      heroContent.classList.add('revealed');
      heroContent.style.opacity = '';
    }
    if (heroAgency) heroAgency.classList.add('revealed');
  }, 580);
}

if (heroVideo) {
  heroVideo.loop = false;
  heroVideo.addEventListener('timeupdate', () => {
    if (!heroRevealed && heroVideo.duration) {
      const progress = heroVideo.currentTime / heroVideo.duration;
      if (progress >= 0.62) {
        if (heroVignette) heroVignette.classList.add('active');
      }
      if (progress >= 0.78) revealHeroContent();
    }
  }, { passive: true });
  heroVideo.addEventListener('ended', () => {
    heroVideo.pause();
    try { heroVideo.currentTime = heroVideo.duration - 0.04; } catch (e) {}
    revealHeroContent();
  });
  heroVideo.addEventListener('loadedmetadata', () => {
    const revealAt = heroVideo.duration * 0.78;
    setTimeout(revealHeroContent, revealAt * 1000);
  });
  heroVideo.addEventListener('error', revealHeroContent);
  setTimeout(revealHeroContent, 11000);
}

// ==================== PRELOADER & FRAME LOADING ====================
const totalFrames = 350;
const images = [];
let loadedCount = 0;

const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function preloadImages(callback) {
  let finished = false;

  function checkDone() {
    loadedCount++;
    const pct = Math.round((loadedCount / totalFrames) * 100);
    if (loaderBar) loaderBar.style.width = `${pct}%`;
    if (loaderText) loaderText.textContent = `${pct}%`;

    if (loadedCount >= totalFrames && !finished) {
      finished = true;
      setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
        if (callback) callback();
      }, 280);
    }
  }

  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    img.src = `/frames/frame_${String(i).padStart(4, '0')}.jpg`;
    img.onload = checkDone;
    img.onerror = checkDone;
    images.push(img);
  }
}

// ==================== CANVAS DRAWING ====================
function drawCover(ctx, img, w, h) {
  const iw = img.width, ih = img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const nw = iw * scale, nh = ih * scale;
  const ox = (w - nw) / 2, oy = (h - nh) / 2;
  ctx.drawImage(img, ox, oy, nw, nh);
}

let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
let currentFrameIndex = 0;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (lastCanvasWidth === w && Math.abs(lastCanvasHeight - h) < 100) return;
  lastCanvasWidth = w;
  lastCanvasHeight = h;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderFrame(currentFrameIndex);
}

function renderFrame(index) {
  if (!canvas || !ctx) return false;
  const img = images[index];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCover(ctx, img, window.innerWidth, window.innerHeight);
    return true;
  }
  return false;
}

// ==================== SCROLL ANIMATION ENGINE ====================
const heroSection = document.getElementById('hero');
const platformWrapper = document.getElementById('platform');
const canvasContainer = document.getElementById('canvas-container');
let scrollTicking = false;
let canvasReady = false;
let canvasShowScheduled = false;

// --- Lerp smoothing for frame animation ---
let targetFrameIndex = 0;      // The frame the scroll wants to show
let smoothFrameIndex = 0;      // The frame currently displayed (float for smooth lerp)
let lerpAnimating = false;     // Whether the lerp loop is active
const LERP_SPEED = 0.055;      // Lower = smoother/slower (0.05–0.15 is a good range)
const FRAME_SCROLL_SLOWDOWN = 1.45;

function lerpLoop() {
  const diff = targetFrameIndex - smoothFrameIndex;

  // Stop animating when close enough to target
  if (Math.abs(diff) < 0.3) {
    smoothFrameIndex = targetFrameIndex;
    const idx = Math.round(smoothFrameIndex);
    if (idx !== currentFrameIndex) {
      currentFrameIndex = idx;
      renderFrame(idx);
    }
    lerpAnimating = false;
    return;
  }

  // Lerp toward target
  smoothFrameIndex += diff * LERP_SPEED;
  const idx = Math.round(smoothFrameIndex);
  if (idx !== currentFrameIndex) {
    currentFrameIndex = idx;
    renderFrame(idx);
  }

  requestAnimationFrame(lerpLoop);
}

function startLerp() {
  if (!lerpAnimating) {
    lerpAnimating = true;
    requestAnimationFrame(lerpLoop);
  }
}

function onScroll() {
  if (!heroSection) return;

  const heroH = heroSection.offsetHeight;
  const scrollY = window.pageYOffset;
  const viewH = window.innerHeight;

  // Map scroll to frame index — scoped to the platform-wrapper section only
  let progress = 0;
  if (platformWrapper) {
    const platTop = platformWrapper.offsetTop;
    const platHeight = platformWrapper.offsetHeight;
    // Start after the hero so the sequence does not jump ahead before it is visible.
    // The multiplier gives the 350-frame sequence more scroll distance, so frames advance slower.
    const scrollStart = platTop;
    const scrollRange = Math.max(platHeight - viewH, 1) * FRAME_SCROLL_SLOWDOWN;
    if (scrollRange > 0 && scrollY > scrollStart) {
      progress = Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollRange));
    }
  } else {
    // Fallback if platform-wrapper not found
    const docH = document.documentElement.scrollHeight;
    const scrollRange = docH - viewH - heroH;
    if (scrollRange > 0 && scrollY > heroH) {
      progress = Math.max(0, Math.min(1, (scrollY - heroH) / scrollRange));
    }
  }

  // Set lerp target and kick off smooth animation
  const newTarget = Math.floor(progress * (totalFrames - 1));
  if (newTarget !== targetFrameIndex) {
    targetFrameIndex = newTarget;
    startLerp();
  }

  // Canvas backdrop: only activate AFTER hero scrolled past AND frame confirmed rendered
  if (scrollY > heroH - 80) {
    if (!canvasReady) {
      const rendered = renderFrame(Math.round(smoothFrameIndex));
      if (rendered) canvasReady = true;
    }
    if (canvasReady && canvasContainer) {
      // Double-rAF to guarantee no black flash
      if (!canvasShowScheduled) {
        canvasShowScheduled = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (canvasContainer) canvasContainer.classList.add('active');
          });
        });
      }
    }
  } else {
    if (canvasContainer) canvasContainer.classList.remove('active');
    canvasReady = false;
    canvasShowScheduled = false;
  }

  // ---- CARD VISIBILITY ----
  const cards = document.querySelectorAll(
    '.content-card, .testimonial-card, .contact-form-card, .contact-text, .section-intro, .service-card'
  );
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const isVisible = rect.top < viewH * 0.84 && rect.bottom > viewH * 0.08;
    if (isVisible && !card.classList.contains('visible')) {
      if (!card.dataset.staggerApplied && (
        card.classList.contains('testimonial-card') ||
        card.classList.contains('service-card')
      )) {
        const siblings = Array.from(card.parentElement.children).filter(
          el => el.classList.contains(card.classList[0])
        );
        const idx = siblings.indexOf(card);
        card.style.transitionDelay = `${idx * 0.10}s`;
        card.dataset.staggerApplied = '1';
      }
      card.classList.add('visible');
    }
  });

  // ---- STAT COUNTERS ----
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewH * 0.88 && !el.dataset.counted) {
      el.dataset.counted = '1';
      animateCounter(el, parseInt(el.dataset.target, 10));
    }
  });

  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(onScroll);
    scrollTicking = true;
  }
}, { passive: true });

window.addEventListener('resize', resizeCanvas, { passive: true });

// ==================== COUNTER ANIMATION ====================
function animateCounter(el, target) {
  const duration = 2000;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 5);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ==================== SMOOTH ANCHOR SCROLLING ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ==================== CONTACT FORM — SECURE ====================
const demoForm = document.getElementById('demo-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');
const formSubmitBtn = document.getElementById('form-submit-btn');

let lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 15000;

if (demoForm) {
  demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const honeypot = demoForm.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== '') {
      if (formSuccess) formSuccess.style.display = 'block';
      return;
    }
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
      if (formError) {
        formError.textContent = 'Please wait a moment before submitting again.';
        formError.style.display = 'block';
        if (formSuccess) formSuccess.style.display = 'none';
        setTimeout(() => { if (formError) formError.style.display = 'none'; }, 4000);
      }
      return;
    }
    const nameEl = demoForm.querySelector('#name');
    const emailEl = demoForm.querySelector('#email');
    const companyEl = demoForm.querySelector('#company');
    if (!nameEl || !emailEl || !companyEl) return;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const company = companyEl.value.trim();
    if (name.length < 2 || name.length > 100) { nameEl.focus(); return; }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) { emailEl.focus(); return; }
    if (company.length < 1 || company.length > 150) { companyEl.focus(); return; }
    lastSubmitTime = Date.now();
    const btn = formSubmitBtn;
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      demoForm.reset();
      if (formSuccess) {
        formSuccess.style.display = 'block';
        formSuccess.textContent = "Thank you! We'll be in touch shortly.";
      }
      if (formError) formError.style.display = 'none';
      setTimeout(() => { if (formSuccess) formSuccess.style.display = 'none'; }, 6000);
    }, 1400);
  });
}

// ==================== INITIALIZE ====================
preloadImages(() => {
  resizeCanvas();
  onScroll();
});
