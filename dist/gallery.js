"use strict";
document.documentElement.classList.add('js');
const exhibition = document.querySelector('.exhibition');
const collection = document.querySelector('.collection');
const groups = [...document.querySelectorAll('.exhibition > .series')];
const groupButtons = [...document.querySelectorAll('[data-step]')];
const modeButtons = [...document.querySelectorAll('[data-gallery-mode]')];
const photoButtons = [...document.querySelectorAll('.quartet [data-photo]')];
const groupCount = document.querySelector('.exhibition-count');
const pages = [...document.querySelectorAll('.site-main > section[id]')];
const navigation = [...document.querySelectorAll('.header-nav a')];
const desktopLayout = window.matchMedia('(min-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeGroupIndex = 0;
let galleryMode = 'collapsed';
let activePage = '';
let pendingFrame = 0;
let gallerySwipeStart = null;
let suppressGalleryClickUntil = 0;

function isGalleryFolded() {
  return !desktopLayout.matches || galleryMode === 'collapsed';
}

function sizeMobileGallery() {
  if (desktopLayout.matches || !exhibition.clientWidth) return;
  const foldWidth = 1;
  const foldGap = 0;
  const width = exhibition.clientWidth;
  const openWidth = Math.max(1, width - (groups.length - 1) * (foldWidth + foldGap));
  collection.style.setProperty('--mobile-open-width', openWidth + 'px');
  collection.style.setProperty('--mobile-gallery-height', openWidth * 1.5 + 'px');
  collection.style.setProperty('--mobile-fold-width', foldWidth + 'px');
  collection.style.setProperty('--mobile-fold-gap', foldGap + 'px');
}

function paintGallery() {
  const folded = isGalleryFolded();
  collection.dataset.mode = folded ? 'collapsed' : 'expanded';
  sizeMobileGallery();
  groups.forEach((group, index) => {
    group.classList.toggle('active', index === activeGroupIndex);
    group.querySelectorAll('[data-photo]').forEach((button, photoIndex) => {
      const step = desktopLayout.matches ? (photoIndex % 2 === 0 ? -1 : 1) : (photoIndex < 2 ? 1 : -1);
      button.dataset.photoStep = String(step);
      button.tabIndex = folded && index !== activeGroupIndex ? -1 : 0;
      button.setAttribute('aria-label', (step < 0 ? '上一組作品：' : '下一組作品：') + button.querySelector('img').alt);
      button.setAttribute('aria-disabled', String(index + step < 0 || index + step >= groups.length));
    });
  });
  groupCount.textContent = String(activeGroupIndex + 1).padStart(2, '0') + ' / ' + String(groups.length).padStart(2, '0');
  groupButtons.forEach(button => {
    button.hidden = desktopLayout.matches && galleryMode === 'expanded';
    button.disabled = Number(button.dataset.step) < 0 ? activeGroupIndex === 0 : activeGroupIndex === groups.length - 1;
  });
  modeButtons.forEach(button => {
    const action = button.dataset.galleryMode;
    button.hidden = !desktopLayout.matches || (action === 'expand' ? galleryMode !== 'collapsed' : galleryMode !== 'expanded');
  });
}

function selectGroup(index, scroll = true) {
  activeGroupIndex = Math.max(0, Math.min(groups.length - 1, index));
  paintGallery();
  if (!scroll || activePage !== 'works') return;
  const behavior = reducedMotion.matches ? 'auto' : 'smooth';
  if (desktopLayout.matches) {
    const left = galleryMode === 'collapsed' ? 0 : groups[activeGroupIndex].offsetLeft - groups[0].offsetLeft;
    window.scrollTo({ left, top: window.scrollY, behavior });
  }
}

function changeGalleryMode(action) {
  if (!desktopLayout.matches || (action !== 'expand' && action !== 'collapse')) return;
  galleryMode = action === 'expand' ? 'expanded' : 'collapsed';
  activeGroupIndex = 0;
  gallerySwipeStart = null;
  paintGallery();
  window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' });
  exhibition.scrollTo({ left: 0, behavior: 'auto' });
}

function updateGalleryPosition() {
  if (activePage !== 'works' || !desktopLayout.matches || galleryMode === 'collapsed') return;
  const position = window.scrollX;
  const origin = groups[0].offsetLeft;
  let index = 0, closest = Infinity;
  groups.forEach((group, candidate) => {
    const distance = Math.abs(group.offsetLeft - origin - position);
    if (distance < closest) { closest = distance; index = candidate; }
  });
  if (index !== activeGroupIndex) { activeGroupIndex = index; paintGallery(); }
}
function queueGalleryPosition() {
  if (pendingFrame) return;
  pendingFrame = requestAnimationFrame(() => { pendingFrame = 0; updateGalleryPosition(); });
}

function showPage(hash) {
  const route = (hash || '').replace(/^#/, '');
  const aliases = {
    link_content_homeCover: 'home', link_content_homeCoverName: 'home',
    link_content_work_2x2_2015: 'works', link_content_about: 'about', link_content_contact: 'contact'
  };
  const linkedGroup = groups.findIndex(group => group.id === route);
  const requested = linkedGroup >= 0 ? 'works' : (aliases[route] || route);
  const page = pages.some(section => section.id === requested) ? requested : 'home';
  const changed = page !== activePage;
  pages.forEach(section => { section.hidden = section.id !== page; });
  document.body.dataset.page = page;
  activePage = page;
  navigation.forEach(link => {
    if (link.getAttribute('href') === '#' + page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (changed && page === 'works') { galleryMode = 'collapsed'; activeGroupIndex = 0; }
  paintGallery();
  window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  if (page === 'works' && linkedGroup >= 0) selectGroup(linkedGroup);
}

document.querySelectorAll('.header-nav a, .wordmark, .skip-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const hash = link.getAttribute('href');
    if (window.location.hash === hash) showPage(hash);
    else window.location.hash = hash;
  });
});
groupButtons.forEach(button => button.addEventListener('click', () => selectGroup(activeGroupIndex + Number(button.dataset.step))));
modeButtons.forEach(button => button.addEventListener('click', () => {
  changeGalleryMode(button.dataset.galleryMode);
  modeButtons.find(control => !control.hidden)?.focus({ preventScroll: true });
}));
photoButtons.forEach(button => button.addEventListener('click', event => {
  if (performance.now() < suppressGalleryClickUntil) return;
  const index = groups.indexOf(button.closest('.series'));
  if (index < 0) return;
  const step = Number(button.dataset.photoStep);
  const previousIndex = activeGroupIndex;
  if (isGalleryFolded() && index !== activeGroupIndex) selectGroup(index);
  else selectGroup(index + step);
  if (event.detail === 0 && activeGroupIndex !== previousIndex) {
    [...groups[activeGroupIndex].querySelectorAll('[data-photo]')]
      .find(control => Number(control.dataset.photoStep) === step)?.focus({ preventScroll: true });
  }
}));
exhibition.addEventListener('scroll', queueGalleryPosition, { passive: true });
window.addEventListener('scroll', queueGalleryPosition, { passive: true });
exhibition.addEventListener('touchstart', event => {
  gallerySwipeStart = !desktopLayout.matches && event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
exhibition.addEventListener('touchmove', event => {
  if (event.touches.length !== 1) gallerySwipeStart = null;
}, { passive: true });
exhibition.addEventListener('touchend', event => {
  const start = gallerySwipeStart;
  gallerySwipeStart = null;
  if (!start || desktopLayout.matches || event.changedTouches.length !== 1 || event.touches.length) return;
  const dx = event.changedTouches[0].clientX - start.x;
  const dy = event.changedTouches[0].clientY - start.y;
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  suppressGalleryClickUntil = performance.now() + 400;
  selectGroup(activeGroupIndex + (dx < 0 ? 1 : -1));
}, { passive: true });
exhibition.addEventListener('touchcancel', () => { gallerySwipeStart = null; }, { passive: true });
exhibition.addEventListener('keydown', event => {
  if (event.target !== exhibition) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    selectGroup(activeGroupIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
desktopLayout.addEventListener('change', () => {
  paintGallery();
  if (activePage === 'works') requestAnimationFrame(() => selectGroup(activeGroupIndex));
});
window.addEventListener('hashchange', () => showPage(window.location.hash));
window.addEventListener('resize', () => {
  sizeMobileGallery();
  queueGalleryPosition();
}, { passive: true });
showPage(window.location.hash);

function useLocalBackup(image) {
  const backup = image.dataset.fallback;
  if (!backup || image.getAttribute('src') === backup) return false;
  image.src = backup;
  return true;
}

document.querySelectorAll('.photo-trigger img, .about-portrait, .contact-photo').forEach(image => {
  const frame = image.closest('.photo-trigger');
  const handleError = () => {
    if (useLocalBackup(image) || !frame) return;
    image.hidden = true;
    if (!frame.querySelector('.photo-failed')) {
      const message = document.createElement('span');
      message.className = 'photo-failed';
      message.textContent = '照片暫時無法顯示';
      frame.append(message);
    }
  };
  image.addEventListener('error', handleError);
  image.addEventListener('load', () => {
    image.hidden = false;
    frame?.querySelector('.photo-failed')?.remove();
  });
  if (image.complete && image.naturalWidth === 0) {
    handleError();
  }
});

