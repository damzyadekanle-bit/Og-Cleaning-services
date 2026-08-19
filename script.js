const testimonials = [
  '"Outstanding service. Professional and dependable!"',
  '"My Airbnb has never looked better."',
  '"Great attention to detail and excellent customer service."'
];

const testimonialText = document.getElementById('testimonial-text');
let testimonialIndex = 0;

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

const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const galleryFilters = document.querySelectorAll('.gallery-filter');
const galleryFilterStatus = document.getElementById('gallery-filter-status');
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
let visibleGalleryItems = galleryItems;
let currentGalleryIndex = 0;
let touchStartX = 0;

const showGalleryImage = (index) => {
  if (!galleryLightbox || !lightboxImage || !visibleGalleryItems.length) return;
  currentGalleryIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;
  const item = visibleGalleryItems[currentGalleryIndex];
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = item.querySelector('img')?.alt || `${item.dataset.categoryLabel} cleaning gallery image`;
  if (lightboxCategory) lightboxCategory.textContent = item.dataset.categoryLabel;
  if (lightboxTitle) lightboxTitle.textContent = item.dataset.title;
  if (lightboxDescription) lightboxDescription.textContent = item.dataset.description;
  if (lightboxCount) lightboxCount.textContent = `${currentGalleryIndex + 1} / ${visibleGalleryItems.length}`;
};

const openLightbox = (item) => {
  if (!galleryLightbox) return;
  lastGalleryTrigger = item;
  currentGalleryIndex = visibleGalleryItems.indexOf(item);
  showGalleryImage(currentGalleryIndex);
  galleryLightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!galleryLightbox) return;
  galleryLightbox.hidden = true;
  document.body.style.overflow = '';
  lastGalleryTrigger?.focus();
};

galleryItems.forEach((item) => {
  item.addEventListener('click', () => openLightbox(item));
});

galleryFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedFilter = button.dataset.filter;
    galleryFilters.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    galleryItems.forEach((item) => {
      item.hidden = selectedFilter !== 'all' && item.dataset.category !== selectedFilter;
    });
    visibleGalleryItems = galleryItems.filter((item) => !item.hidden);
    if (galleryFilterStatus) {
      const label = button.textContent.trim();
      galleryFilterStatus.textContent = `Showing ${visibleGalleryItems.length} ${label === 'All' ? '' : `${label} `}gallery ${visibleGalleryItems.length === 1 ? 'image' : 'images'}.`;
    }
  });
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
