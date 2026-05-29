const modal = document.querySelector('[data-modal]');
const modalContent = document.querySelector('[data-modal-content]');
const modalClose = document.querySelector('[data-modal-close]');

function closeModal() {
  if (!modal || !modalContent) return;
  modal.hidden = true;
  modalContent.replaceChildren();
}

function openPhoto(trigger) {
  const src = trigger.dataset.photo || trigger.getAttribute('href');
  if (!src || !modal || !modalContent) return;
  const img = document.createElement('img');
  img.src = src;
  img.alt = trigger.dataset.alt || trigger.querySelector('img')?.alt || '';
  modalContent.replaceChildren(img);
  modal.hidden = false;
}

function openVideo(trigger) {
  if (!modal || !modalContent || !trigger.dataset.video) return;
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(trigger.dataset.video) + '?autoplay=1&rel=0';
  iframe.title = trigger.dataset.title || 'Video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  modalContent.replaceChildren(iframe);
  modal.hidden = false;
}

modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});
document.addEventListener('click', (event) => {
  const photo = event.target.closest('[data-photo]');
  if (photo) {
    event.preventDefault();
    openPhoto(photo);
    return;
  }
  const video = event.target.closest('[data-video]');
  if (video) {
    event.preventDefault();
    openVideo(video);
  }
});
