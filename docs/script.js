const menu = document.querySelector('.hamburger');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(nav.classList.toggle('open')));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));

const modal = document.querySelector('#lightbox');
const modalImg = document.querySelector('#lightbox-img');
const imageButtons = [...document.querySelectorAll('.open-image')];
const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryCount = document.querySelector('.gallery-count');
let viewerItems = imageButtons;
let viewerIndex = 0;
const showImage = () => {
  const button = viewerItems[viewerIndex];
  modalImg.src = button.dataset.image;
  modalImg.alt = button.querySelector('img').alt;
};
imageButtons.forEach(button => button.addEventListener('click', () => {
  viewerItems = button.closest('#gallery') ? galleryItems.filter(item => !item.hidden).map(item => item.querySelector('.open-image')) : imageButtons;
  viewerIndex = viewerItems.indexOf(button);
  showImage();
  document.documentElement.classList.add('image-viewing');
  modal.showModal();
}));
modal.addEventListener('close', () => document.documentElement.classList.remove('image-viewing'));
document.querySelector('#close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});
modal.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !viewerItems.length) return;
  viewerIndex = (viewerIndex + (event.key === 'ArrowRight' ? 1 : -1) + viewerItems.length) % viewerItems.length;
  showImage();
  event.preventDefault();
});

const filters = [...document.querySelectorAll('.filter')];
const updateGalleryCount = () => {
  const count = galleryItems.filter(item => !item.hidden).length;
  galleryCount.textContent = `${count} SCREENSHOT${count === 1 ? '' : 'S'} · SELECT TO EXPAND`;
};
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  galleryItems.forEach(item => {
    item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
  });
  updateGalleryCount();
}));
updateGalleryCount();

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .08, rootMargin: '0px 0px 60px 0px'});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

// Cinematic motion is tied to visibility; no render loop runs in the background.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionScenes = [...document.querySelectorAll('.hero-cinema,.feature,.visual-details,.founder-story,.future-section,.unity-journey,.unity-banner')];
document.querySelectorAll('.story-halo,.future-glow,.journey-beam,.cinema-scroll svg,.launcher-identity').forEach(element => element.setAttribute('data-loop', ''));
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('has-scene-motion');
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('motion-active', entry.isIntersecting));
  }, {threshold: .01});
  motionScenes.forEach(scene => {
    scene.classList.add('motion-scene');
    sceneObserver.observe(scene);
  });
}
document.querySelectorAll('.feature-copy.reveal').forEach(element => {
  element.style.setProperty('--reveal-x', '-18px');
  element.style.setProperty('--reveal-y', '0px');
});
document.querySelectorAll('.feature-shot.reveal').forEach(element => {
  element.style.setProperty('--reveal-x', '18px');
  element.style.setProperty('--reveal-y', '0px');
});
document.querySelectorAll('.visual-detail,.ecosystem-card,.depth-card').forEach((element, index) => element.style.setProperty('--reveal-delay', `${index % 3 * 70}ms`));

const siteHeader = document.querySelector('.header');
let chromeFrame = 0;
const updateChrome = () => {
  if (chromeFrame || document.hidden) return;
  chromeFrame = requestAnimationFrame(() => {
    const length = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--read-progress', String(length > 0 ? Math.min(1, scrollY / length) : 0));
    siteHeader.classList.toggle('is-scrolled', scrollY > 30);
    chromeFrame = 0;
  });
};
addEventListener('scroll', updateChrome, {passive: true});
addEventListener('resize', updateChrome, {passive: true});
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (document.hidden && chromeFrame) {
    cancelAnimationFrame(chromeFrame);
    chromeFrame = 0;
  }
  if (!document.hidden) updateChrome();
});
updateChrome();

const stage = document.querySelector('[data-tilt]');
const heroScene = document.querySelector('.hero-cinema');
let tiltFrame = 0;
let pointerPosition = null;
if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  stage.addEventListener('pointermove', event => {
    if (document.hidden || !heroScene.classList.contains('motion-active')) return;
    pointerPosition = {x: event.clientX, y: event.clientY};
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      const rect = stage.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (pointerPosition.x - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (pointerPosition.y - rect.top) / rect.height));
      stage.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
      stage.style.setProperty('--tilt-y', `${(x - 0.5) * 4}deg`);
      stage.style.setProperty('--spot-x', `${x * 100}%`);
      stage.style.setProperty('--spot-y', `${y * 100}%`);
      tiltFrame = 0;
    });
  });
  stage.addEventListener('pointerleave', () => {
    if (tiltFrame) cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    stage.style.setProperty('--tilt-x', '0deg');
    stage.style.setProperty('--tilt-y', '0deg');
    stage.style.setProperty('--spot-x', '50%');
    stage.style.setProperty('--spot-y', '50%');
  });
}

const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach(entry => {
      sectionLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -65% 0px'});
  sectionLinks.forEach(link => {
    const target = document.querySelector(link.hash);
    if (target) navObserver.observe(target);
  });
}
