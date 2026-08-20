const testimonials = [
  '"Outstanding service. Professional and dependable!"',
  '"My Airbnb has never looked better."',
  '"Great attention to detail and excellent customer service."'
];

const testimonialText = document.getElementById('testimonial-text');
let testimonialIndex = 0;

const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');

const closeNavigation = (returnFocus = false) => {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.querySelector('.sr-only').textContent = 'Open menu';
  navMenu.classList.remove('open');
  if (returnFocus) navToggle.focus();
};

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navToggle.querySelector('.sr-only').textContent = isOpen ? 'Open menu' : 'Close menu';
  navMenu?.classList.toggle('open', !isOpen);
});

navMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeNavigation());
});

document.addEventListener('click', (event) => {
  if (nav && !nav.contains(event.target)) closeNavigation();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    closeNavigation(true);
  }
});

const desktopNavigation = window.matchMedia('(min-width: 1051px)');
const handleNavigationBreakpoint = (event) => {
  if (event.matches) closeNavigation();
};

if (desktopNavigation.addEventListener) {
  desktopNavigation.addEventListener('change', handleNavigationBreakpoint);
} else {
  desktopNavigation.addListener(handleNavigationBreakpoint);
}

if (testimonialText) {
  setInterval(() => {
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
    testimonialText.textContent = testimonials[testimonialIndex];
  }, 4000);
}

const quoteForm = document.getElementById('quote-form');
const formStatus = document.getElementById('form-status');
const uploadButton = document.getElementById('upload-photos');
const serviceInputs = document.querySelectorAll('input[name="services[]"]');
const conditionalSections = document.querySelectorAll('.conditional-section');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const uploadedPhotosList = document.getElementById('uploaded-photos');
const photoUrlFields = document.getElementById('photo-url-fields');
const uploadedPhotos = [];
const maxPhotoUploads = 5;

const getSelectedServiceKeys = () => new Set(
  Array.from(serviceInputs)
    .filter((input) => input.checked)
    .map((input) => input.dataset.service)
);

const setSectionEnabled = (section, isEnabled) => {
  window.clearTimeout(Number(section.dataset.hideTimer));

  if (isEnabled) {
    section.hidden = false;
    window.requestAnimationFrame(() => section.classList.add('active'));
  } else {
    section.classList.remove('active');
    section.dataset.hideTimer = window.setTimeout(() => {
      section.hidden = true;
    }, 260);
  }

  section.querySelectorAll('input, select, textarea').forEach((field) => {
    field.disabled = !isEnabled;
  });
};

const updateConditionalSections = () => {
  const selectedServices = getSelectedServiceKeys();

  conditionalSections.forEach((section) => {
    const sectionServices = section.dataset.services.split(' ');
    setSectionEnabled(section, sectionServices.some((service) => selectedServices.has(service)));
  });
};

const updateProgress = () => {
  if (!quoteForm || !progressPercent || !progressBar) return;

  const requiredFields = Array.from(quoteForm.querySelectorAll('[required]')).filter((field) => !field.disabled);
  const completedRequiredFields = requiredFields.filter((field) => {
    if (field.type === 'checkbox') return field.checked;
    return field.value.trim() !== '';
  });
  const hasSelectedService = Array.from(serviceInputs).some((input) => input.checked);
  const totalSteps = requiredFields.length + 1;
  const completedSteps = completedRequiredFields.length + (hasSelectedService ? 1 : 0);
  const percent = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
};

const refreshFormState = () => {
  updateConditionalSections();
  updateProgress();
};

const showFormStatus = (message, type) => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;
};

const renderUploadedPhotos = () => {
  if (!uploadedPhotosList || !photoUrlFields) return;

  uploadedPhotosList.innerHTML = '';
  photoUrlFields.innerHTML = '';

  uploadedPhotos.forEach((photo, index) => {
    const listItem = document.createElement('li');
    const photoLink = document.createElement('a');
    photoLink.href = photo.url;
    photoLink.target = '_blank';
    photoLink.rel = 'noopener';
    photoLink.textContent = photo.name;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.dataset.photoIndex = index;
    removeButton.textContent = 'Remove';

    listItem.append(photoLink, removeButton);
    uploadedPhotosList.appendChild(listItem);

    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = `Photo ${index + 1} URL`;
    hiddenField.value = photo.url;
    photoUrlFields.appendChild(hiddenField);
  });

  if (uploadedPhotos.length) {
    const allPhotoLinks = document.createElement('textarea');
    allPhotoLinks.name = 'All Uploaded Photo Links';
    allPhotoLinks.hidden = true;
    allPhotoLinks.value = uploadedPhotos.map((photo) => photo.url).join('\n');
    photoUrlFields.appendChild(allPhotoLinks);
  }

  if (uploadButton) {
    uploadButton.disabled = uploadedPhotos.length >= maxPhotoUploads;
    uploadButton.textContent = uploadedPhotos.length >= maxPhotoUploads ? 'Photo Limit Reached' : 'Upload Photos';
  }
};

const addUploadedPhoto = (uploadInfo) => {
  if (!uploadInfo?.secure_url || uploadedPhotos.length >= maxPhotoUploads) return;

  uploadedPhotos.push({
    name: uploadInfo.original_filename || `Photo ${uploadedPhotos.length + 1}`,
    url: uploadInfo.secure_url
  });
  renderUploadedPhotos();
};

refreshFormState();

serviceInputs.forEach((input) => {
  input.addEventListener('change', refreshFormState);
});

if (quoteForm) {
  quoteForm.addEventListener('input', updateProgress);
  quoteForm.addEventListener('change', updateProgress);
}

if (uploadedPhotosList) {
  uploadedPhotosList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('button[data-photo-index]');
    if (!removeButton) return;

    uploadedPhotos.splice(Number(removeButton.dataset.photoIndex), 1);
    renderUploadedPhotos();
  });
}

if (uploadButton) {
  uploadButton.addEventListener('click', () => {
    if (!window.cloudinary?.createUploadWidget) {
      showFormStatus('Photo uploads are temporarily unavailable. You can still submit the quote request and share photos when we contact you.', 'error');
      return;
    }

    const uploadWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'jsuiyqfc',
        uploadPreset: 'chuko_cleaning_uploads',
        sources: ['local', 'camera'],
        multiple: true,
        maxFiles: maxPhotoUploads - uploadedPhotos.length,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        maxFileSize: 10000000
      },
      (error, result) => {
        if (error) {
          showFormStatus('Sorry, photo upload is not available right now. You can still submit the quote request and share photos when we contact you.', 'error');
          return;
        }

        if (result?.event === 'success') {
          addUploadedPhoto(result.info);
        }
      }
    );

    uploadWidget.open();
  });
}

if (quoteForm) {
  quoteForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!Array.from(serviceInputs).some((input) => input.checked)) {
      showFormStatus('Please select at least one cleaning service before submitting your request.', 'error');
      serviceInputs[0]?.focus();
      return;
    }

    if (!quoteForm.checkValidity()) {
      quoteForm.reportValidity();
      return;
    }

    const submitButton = quoteForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending Request…';
    showFormStatus('', '');

    try {
      const response = await fetch(quoteForm.action, {
        method: 'POST',
        body: new FormData(quoteForm),
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      quoteForm.reset();
      refreshFormState();
      uploadedPhotos.splice(0, uploadedPhotos.length);
      renderUploadedPhotos();
      showFormStatus('Thank you! Your quote request has been received. A member of the Chuko Cleaning Services team will contact you soon.', 'success');
    } catch (error) {
      showFormStatus('Sorry, we could not send your request. Please try again or call us at (619) 679-3390.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

const revealElements = document.querySelectorAll('.reveal-section');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('in-view'));
}

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

document.querySelectorAll('.hero .hero-badges').forEach((badgeRow) => badgeRow.remove());

const galleryPhoto = (id, alt, title, description) => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`,
  alt,
  title,
  description
});

// Add or replace photos within an album here; each service folder opens its own image set.
const galleryAlbums = {
  residential: {
    label: 'Residential Cleaning',
    images: [
      galleryPhoto('photo-1560448204-e02f11c3d0e2', 'Bright residential living room after cleaning', 'Refreshed Living Space', 'A bright living room prepared for comfortable everyday use.'),
      galleryPhoto('photo-1600566753086-00f18fb6b3ea', 'Tidy residential home interior', 'Comfortable Home Interior', 'Everyday surfaces refreshed throughout an inviting home.'),
      galleryPhoto('photo-1600585154340-be6161a56a0c', 'Clean contemporary home interior', 'Ready-to-Enjoy Home', 'A polished interior ready for residents and guests.')
    ]
  },
  'deep-cleaning': {
    label: 'Deep Cleaning',
    images: [
      galleryPhoto('photo-1556911220-bff31c812dba', 'Detailed clean kitchen countertop and cabinets', 'Detailed Kitchen Care', 'Careful attention across counters, cabinets, and high-use surfaces.'),
      galleryPhoto('photo-1584622650111-993a426fbf0a', 'Polished bathroom vanity and mirror', 'Polished Bathroom', 'Fixtures, vanity surfaces, and glass refreshed with detail.'),
      galleryPhoto('photo-1484154218962-a197022b5858', 'Bright clean kitchen after detailed cleaning', 'Fresh Kitchen Finish', 'A refreshed kitchen with clean lines and polished surfaces.')
    ]
  },
  'move-in': {
    label: 'Move-In Cleaning',
    images: [
      galleryPhoto('photo-1560184897-ae75f418493e', 'Clean empty room prepared for move in', 'A Fresh Start', 'An empty room cleaned and prepared before move-in day.'),
      galleryPhoto('photo-1522708323590-d24dbb6b0267', 'Clean apartment interior ready for new residents', 'Move-In Ready', 'A welcoming apartment prepared for its next residents.'),
      galleryPhoto('photo-1600566753190-17f0baa2a6c3', 'Freshly prepared modern home interior', 'Prepared Interior', 'Key living areas refreshed before belongings arrive.')
    ]
  },
  'move-out': {
    label: 'Move-Out Cleaning',
    images: [
      galleryPhoto('photo-1560185008-b033106af5c3', 'Clean room prepared for a property handoff', 'Walkthrough Ready', 'A clean interior prepared for a final walkthrough.'),
      galleryPhoto('photo-1554995207-c18c203602cb', 'Empty polished apartment interior', 'Clean Property Handoff', 'An uncluttered space refreshed for the next occupant.'),
      galleryPhoto('photo-1493809842364-78817add7ffb', 'Bright empty living room after move-out cleaning', 'Final Room Reset', 'Living areas cleaned for a smooth property transition.')
    ]
  },
  commercial: {
    label: 'Commercial Cleaning',
    images: [
      galleryPhoto('photo-1497366754035-f200968a6e72', 'Clean modern commercial workspace', 'Professional Workspace', 'An organized office prepared for a productive workday.'),
      galleryPhoto('photo-1497366811353-6870744d04b2', 'Organized clean office desks', 'Ready-to-Work Office', 'A clean office environment prepared for teams and visitors.'),
      galleryPhoto('photo-1497366216548-37526070297c', 'Bright polished business office', 'Welcoming Business Interior', 'A professional space refreshed for employees and guests.')
    ]
  },
  airbnb: {
    label: 'Airbnb Turnovers',
    images: [
      galleryPhoto('photo-1564078516393-cf04bd966897', 'Guest-ready short-term rental bedroom', 'Guest-Ready Bedroom', 'A welcoming bedroom reset for the next arriving guest.'),
      galleryPhoto('photo-1505693416388-ac5ce068fe85', 'Neatly prepared vacation rental bedroom', 'Turnover Complete', 'Fresh presentation and thoughtful details between stays.'),
      galleryPhoto('photo-1522708323590-d24dbb6b0267', 'Clean short-term rental living space', 'Arrival-Ready Rental', 'A comfortable rental interior prepared for check-in.')
    ]
  },
  'post-construction': {
    label: 'Post-Construction Cleaning',
    images: [
      galleryPhoto('photo-1600607687939-ce8a6c25118c', 'Finished modern interior after construction cleanup', 'Finished Renovation', 'A completed interior cleared of surface dust for final presentation.'),
      galleryPhoto('photo-1600585154340-be6161a56a0c', 'Polished newly finished home interior', 'New-Build Finish', 'A newly finished space prepared for use after project work.'),
      galleryPhoto('photo-1600566753190-17f0baa2a6c3', 'Clean modern room following renovation', 'Post-Project Detail', 'Dust and residue addressed across the finished interior.')
    ]
  }
};

const galleryFolders = Array.from(document.querySelectorAll('.gallery-folder'));
const galleryLightbox = document.getElementById('gallery-lightbox');
const lightboxImage = galleryLightbox?.querySelector('img');
const lightboxCategory = galleryLightbox?.querySelector('.lightbox-category');
const lightboxTitle = galleryLightbox?.querySelector('#lightbox-title');
const lightboxDescription = galleryLightbox?.querySelector('#lightbox-description');
const lightboxCount = galleryLightbox?.querySelector('.lightbox-count');
const lightboxClose = galleryLightbox?.querySelector('.lightbox-close');
const lightboxPrevious = galleryLightbox?.querySelector('.lightbox-previous');
const lightboxNext = galleryLightbox?.querySelector('.lightbox-next');
let lastGalleryTrigger = null;
let activeGalleryImages = [];
let activeGalleryLabel = '';
let currentGalleryIndex = 0;
let touchStartX = 0;

const showGalleryImage = (index) => {
  if (!galleryLightbox || !lightboxImage || !activeGalleryImages.length) return;
  currentGalleryIndex = (index + activeGalleryImages.length) % activeGalleryImages.length;
  const image = activeGalleryImages[currentGalleryIndex];
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  if (lightboxCategory) lightboxCategory.textContent = activeGalleryLabel;
  if (lightboxTitle) lightboxTitle.textContent = image.title;
  if (lightboxDescription) lightboxDescription.textContent = image.description;
  if (lightboxCount) lightboxCount.textContent = `${currentGalleryIndex + 1} / ${activeGalleryImages.length}`;
};

const openGalleryFolder = (folder) => {
  const album = galleryAlbums[folder.dataset.album];
  if (!galleryLightbox || !album) return;
  lastGalleryTrigger = folder;
  activeGalleryImages = album.images;
  activeGalleryLabel = album.label;
  showGalleryImage(0);
  galleryLightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!galleryLightbox) return;
  galleryLightbox.hidden = true;
  document.body.style.overflow = '';
  lightboxImage?.removeAttribute('src');
  lastGalleryTrigger?.focus();
};

galleryFolders.forEach((folder) => {
  folder.addEventListener('click', () => openGalleryFolder(folder));
});

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrevious?.addEventListener('click', () => showGalleryImage(currentGalleryIndex - 1));
lightboxNext?.addEventListener('click', () => showGalleryImage(currentGalleryIndex + 1));
galleryLightbox?.addEventListener('click', (event) => {
  if (event.target === galleryLightbox) closeLightbox();
});
galleryLightbox?.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
galleryLightbox?.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 50) return;
  showGalleryImage(currentGalleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (!galleryLightbox || galleryLightbox.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showGalleryImage(currentGalleryIndex - 1);
  if (event.key === 'ArrowRight') showGalleryImage(currentGalleryIndex + 1);
  if (event.key === 'Tab') {
    const controls = [lightboxClose, lightboxPrevious, lightboxNext].filter(Boolean);
    const nextIndex = controls.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= controls.length) {
      event.preventDefault();
      controls[event.shiftKey ? controls.length - 1 : 0].focus();
    }
  }
});
