'use strict';

const collection = document.querySelector('.collection');
const layoutButtons = [...document.querySelectorAll('[data-view]')];
const hint = document.querySelector('.view-hint');

function setLayout(layout) {
  const value = layout === 'single' || (!layout && window.matchMedia('(max-width: 700px)').matches) ? 'single' : 'quartet';
  collection.dataset.layout = value;
  layoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === value)));
  hint.textContent = value === 'single' ? '依原作順序，一張一張向下瀏覽。點圖可放大觀看。' : '保留原作四張一組的排列。點圖可放大，左右滑動切換照片。';
  try { localStorage.setItem('dekko-photo-view', value); } catch {}
}
layoutButtons.forEach(button => button.addEventListener('click', () => setLayout(button.dataset.view)));
try { setLayout(localStorage.getItem('dekko-photo-view')); } catch { setLayout(null); }

const dialog = document.querySelector('.lightbox');
const dialogImage = document.querySelector('.lightbox-image');
const dialogError = document.querySelector('.lightbox-error');
const dialogLabel = document.querySelector('.lightbox-label');
const dialogCount = document.querySelector('.lightbox-count');
const originalLink = document.querySelector('.lightbox-original');
const closeButton = document.querySelector('.lightbox-close');
const previousButton = document.querySelector('.lightbox-prev');
const nextButton = document.querySelector('.lightbox-next');
const stage = document.querySelector('.lightbox-stage');
const photoButtons = [...document.querySelectorAll('[data-photo]')];
let activePhotos = [];
let currentIndex = 0;
let trigger = null;
let savedScrollY = 0;
let swipeStart = null;

function renderPhoto() {
  const button = activePhotos[currentIndex];
  if (!button) return;
  const image = button.querySelector('img');
  dialogImage.hidden = false;
  dialogError.hidden = true;
  dialogImage.dataset.fallback = image.dataset.fallback || '';
  dialogImage.src = image.currentSrc || image.src;
  dialogImage.alt = image.alt;
  originalLink.href = button.dataset.original || image.src;
  dialogLabel.textContent = button.dataset.label;
  dialogCount.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(activePhotos.length).padStart(2, '0')}`;
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === activePhotos.length - 1;
  for (const neighbor of [currentIndex - 1, currentIndex + 1]) {
    if (activePhotos[neighbor]) {
      const preload = new Image();
      preload.referrerPolicy = 'no-referrer';
      preload.src = activePhotos[neighbor].querySelector('img').src;
    }
  }
}

function movePhoto(direction) {
  const next = currentIndex + direction;
  if (next < 0 || next >= activePhotos.length) return;
  currentIndex = next;
  renderPhoto();
}

photoButtons.forEach(button => button.addEventListener('click', () => {
  if (typeof dialog.showModal !== 'function') {
    window.open(button.querySelector('img').src, '_blank', 'noopener');
    return;
  }
  trigger = button;
  activePhotos = photoButtons.filter(photo => photo.dataset.gallery === button.dataset.gallery)
    .sort((a, b) => Number(a.dataset.photo.split('-').pop()) - Number(b.dataset.photo.split('-').pop()));
  currentIndex = activePhotos.indexOf(button);
  renderPhoto();
  savedScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = '100%';
  dialog.showModal();
  closeButton.focus();
}));

previousButton.addEventListener('click', () => movePhoto(-1));
nextButton.addEventListener('click', () => movePhoto(1));
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  const root = document.documentElement;
  const priorBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, savedScrollY);
  if (trigger) trigger.focus({ preventScroll: true });
  root.style.scrollBehavior = priorBehavior;
  swipeStart = null;
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1); }
});
stage.addEventListener('touchstart', event => {
  swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
stage.addEventListener('touchmove', event => {
  if (event.touches.length !== 1) swipeStart = null;
}, { passive: true });
stage.addEventListener('touchend', event => {
  if (!swipeStart || !event.changedTouches.length || event.touches.length) { swipeStart = null; return; }
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) movePhoto(dx < 0 ? 1 : -1);
}, { passive: true });
stage.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
function useLocalBackup(image) {
  const backup = image.dataset.fallback;
  if (!backup || image.getAttribute('src') === backup) return false;
  image.src = backup;
  return true;
}
dialogImage.addEventListener('error', () => {
  if (useLocalBackup(dialogImage)) return;
  dialogImage.hidden = true;
  dialogError.hidden = false;
});

document.querySelectorAll('.photo-trigger img, .about-portrait, .contact-photo').forEach(image => {
  const button = image.closest('.photo-trigger');
  if (button) button.dataset.original = image.src;
  const handleError = () => {
    if (useLocalBackup(image) || !button) return;
    image.hidden = true;
    if (!button.querySelector('.photo-failed')) {
      const message = document.createElement('span');
      message.className = 'photo-failed';
      message.textContent = '照片暫時無法顯示，點此查看原圖';
      button.append(message);
    }
  };
  image.addEventListener('error', handleError);
  image.addEventListener('load', () => {
    image.hidden = false;
    button?.querySelector('.photo-failed')?.remove();
  });
  if (image.complete && image.naturalWidth === 0) {
    handleError();
  }
});

if ('IntersectionObserver' in window) {
  const navigation = [...document.querySelectorAll('.header-nav a, .mobile-nav a')];
  const observedSections = [...document.querySelectorAll('main > section[id]')];
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!active) return;
    navigation.forEach(link => {
      if (link.getAttribute('href') === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  observedSections.forEach(section => observer.observe(section));
}
