"use strict";
document.documentElement.classList.add('js');
const exhibition = document.querySelector('.exhibition');
const collection = document.querySelector('.collection');
const groups = [...document.querySelectorAll('.exhibition > .series')];
const groupButtons = [...document.querySelectorAll('[data-step]')];
const modeButtons = [...document.querySelectorAll('[data-gallery-mode]')];
const groupCount = document.querySelector('.exhibition-count');
const pages = [...document.querySelectorAll('.site-main > section[id]')];
const navigation = [...document.querySelectorAll('.header-nav a')];
const desktopLayout = window.matchMedia('(min-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeGroupIndex = 0;
let galleryMode = 'collapsed';
let gallerySpacing = 'separated';
let activePage = '';
let pendingFrame = 0;

function paintGallery() {
  const folded = desktopLayout.matches && galleryMode === 'collapsed';
  collection.dataset.mode = galleryMode;
  collection.dataset.spacing = gallerySpacing;
  groups.forEach((group, index) => {
    group.classList.toggle('active', index === activeGroupIndex);
    group.querySelectorAll('[data-photo]').forEach(button => {
      button.tabIndex = folded && index !== activeGroupIndex ? -1 : 0;
    });
  });
  groupCount.textContent = String(activeGroupIndex + 1).padStart(2, '0') + ' / ' + String(groups.length).padStart(2, '0');
  groupButtons.forEach(button => {
    button.hidden = desktopLayout.matches && galleryMode === 'expanded';
    button.disabled = Number(button.dataset.step) < 0 ? activeGroupIndex === 0 : activeGroupIndex === groups.length - 1;
  });
  modeButtons.forEach(button => {
    const action = button.dataset.galleryMode;
    button.hidden = !desktopLayout.matches ||
      (action === 'expand' ? galleryMode !== 'collapsed' :
       action === 'collapse' ? galleryMode !== 'expanded' :
       action === 'adjoin' ? galleryMode !== 'expanded' || gallerySpacing === 'adjoined' :
       galleryMode !== 'expanded' || gallerySpacing === 'separated');
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
  } else {
    exhibition.scrollTo({ left: groups[activeGroupIndex].offsetLeft - groups[0].offsetLeft, behavior });
  }
}

function changeGalleryMode(action) {
  if (!desktopLayout.matches) return;
  if (action === 'expand') {
    galleryMode = 'expanded';
    gallerySpacing = 'separated';
  } else if (action === 'collapse') {
    galleryMode = 'collapsed';
    activeGroupIndex = 0;
  } else {
    gallerySpacing = action === 'adjoin' ? 'adjoined' : 'separated';
  }
  paintGallery();
  window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' });
}

function updateGalleryPosition() {
  if (activePage !== 'works' || (desktopLayout.matches && galleryMode === 'collapsed')) return;
  const position = desktopLayout.matches ? window.scrollX : exhibition.scrollLeft;
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
  const overlay = document.querySelector('.lightbox');
  if (overlay?.open) overlay.close();
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
modeButtons.forEach(button => button.addEventListener('click', () => changeGalleryMode(button.dataset.galleryMode)));
exhibition.addEventListener('scroll', queueGalleryPosition, { passive: true });
window.addEventListener('scroll', queueGalleryPosition, { passive: true });
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
window.addEventListener('resize', queueGalleryPosition, { passive: true });
showPage(window.location.hash);

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
  const group = button.closest('.series');
  if (desktopLayout.matches && galleryMode === 'collapsed' && group && groups.indexOf(group) !== activeGroupIndex) {
    selectGroup(groups.indexOf(group));
    return;
  }
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

