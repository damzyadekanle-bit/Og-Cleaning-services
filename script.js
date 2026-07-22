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
