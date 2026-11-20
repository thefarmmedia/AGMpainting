(() => {
  document.documentElement.classList.add('js');

  // Sticky header shadow
  const hdr = document.querySelector('[data-hdr]');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile nav
  const burger = document.querySelector('[data-burger]');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    const set = (open) => { burger.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('in'));

  // Before / after sliders
  document.querySelectorAll('[data-ba]').forEach((ba) => {
    const stage = ba.querySelector('.ba-stage');
    const range = ba.querySelector('.ba-range');
    const update = () => stage.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', update); update();
  });

  // Gallery filters + lightbox
  const gal = document.querySelector('[data-gallery]');
  if (gal) {
    const btns = document.querySelectorAll('[data-filter]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      gal.querySelectorAll('.gal-item').forEach((it) => { it.hidden = f !== 'all' && it.dataset.cat !== f; });
    }));
    const lb = document.querySelector('[data-lb]');
    if (lb && typeof lb.showModal === 'function') {
      const lbImg = lb.querySelector('img'), lbCap = lb.querySelector('p');
      gal.addEventListener('click', (e) => {
        const a = e.target.closest('.gal-item'); if (!a) return;
        e.preventDefault();
        const im = a.querySelector('img');
        lbImg.src = a.getAttribute('href'); lbImg.alt = im.alt; lbCap.textContent = im.alt;
        lb.showModal();
      });
      lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-lb-close]')) lb.close(); });
    }
  }

  // Forms: prevent double submits
  document.querySelectorAll('[data-form]').forEach((f) => f.addEventListener('submit', () => f.classList.add('sending')));
})();

// "Free Estimate" buttons jump to this page's form when it has one
(() => {
  const local = document.querySelector('#quote, #estimate-form');
  if (!local) return;
  document.querySelectorAll('a[href="/#estimate-form"]').forEach((a) => a.setAttribute('href', '#' + local.id));
})();
