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
  modal.showModal();
}));
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
