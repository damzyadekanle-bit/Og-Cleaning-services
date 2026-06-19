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
