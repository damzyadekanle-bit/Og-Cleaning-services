
const testimonials=[
'"Outstanding service. Professional and dependable!"',
'"My Airbnb has never looked better."',
'"Great attention to detail and excellent customer service."'
];
let i=0;
setInterval(()=>{
i=(i+1)%testimonials.length;
document.getElementById('testimonial-text').textContent=testimonials[i];
},4000);
