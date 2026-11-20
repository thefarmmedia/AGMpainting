// Static site generator for AGM Painting. No dependencies.
// Usage: node tools/build.mjs   → writes HTML, sitemap.xml, robots.txt into the repo root.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIZ, SERVICES, AREAS, REVIEWS, HOME_FAQS } from './data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/img/manifest.json'), 'utf8'));
const SITE = BIZ.site.replace(/\/$/, '');
const THEME_COLOR = '#202020';
const VERSION = Date.now().toString(36);
const pages = []; // for sitemap

// ── helpers ─────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const tel = `tel:${BIZ.phoneE164}`;

function img(slug, { sizes = '(min-width: 1024px) 50vw, 100vw', cls = '', eager = false, alt } = {}) {
  const m = MANIFEST[slug];
  if (!m) throw new Error('Missing image ' + slug);
  const big = Math.min(m.w, 1600);
  const h = Math.round((m.h / m.w) * 800);
  return `<img src="/assets/img/${slug}-800.webp" srcset="/assets/img/${slug}-800.webp 800w, /assets/img/${slug}-1600.webp ${big}w" sizes="${sizes}" width="800" height="${h}" alt="${esc(alt || m.alt)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
}

const ICONS = {
  roller: '<path d="M4 4h13v5H4z"/><path d="M17 6.5h2.5V12H11v3"/><path d="M10 15h2v6h-2z"/>',
  house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  building: '<path d="M4 21V5l8-2v18"/><path d="M12 8h8v13"/><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
  brush: '<path d="M14 4l6 6-8 8-6-6z"/><path d="M6 12l-2 6 6-2"/><path d="M11 7l6 6"/>',
  layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="m2 13 10 5 10-5"/>',
  door: '<path d="M6 21V3h12v18"/><path d="M3 21h18"/><circle cx="15" cy="12" r="1"/>',
  patch: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-2a6 6 0 0 1 12 0v2"/><path d="M14 21v-1.5a4 4 0 0 1 8 0V21"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v7h4v-7h3l1-4h-4V8z"/>',
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

// ── JSON-LD ─────────────────────────────────────────────────
const BUSINESS_ID = `${SITE}/#business`;
function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['HousePainter', 'LocalBusiness'],
    '@id': BUSINESS_ID,
    name: BIZ.name,
    alternateName: BIZ.short,
    url: `${SITE}/`,
    telephone: BIZ.phoneE164,
    email: BIZ.email,
    image: `${SITE}/assets/img/stained-cedar-garage-exterior-springfield-mo.jpg`,
    logo: `${SITE}/assets/img/agm-painting-logo.jpg`,
    description: 'Family-owned painting contractor in Springfield, MO offering interior, exterior and commercial painting, cedar siding staining, exposed basement ceilings, door and trim painting and drywall repair within 30 miles of Springfield.',
    founder: { '@type': 'Person', name: BIZ.owner },
    address: { '@type': 'PostalAddress', addressLocality: BIZ.city, addressRegion: BIZ.region, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: BIZ.geo.lat, longitude: BIZ.geo.lng },
    areaServed: [
      { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: BIZ.geo.lat, longitude: BIZ.geo.lng }, geoRadius: Math.round(BIZ.radiusMiles * 1609.34) },
      ...AREAS.map((a) => ({ '@type': 'City', name: `${a.name}, MO` })),
    ],
    priceRange: '$$',
    sameAs: [BIZ.facebook],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Painting Services',
      itemListElement: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${SITE}/services/${s.slug}/` } })),
    },
  };
}
const breadcrumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${url}` })),
});
const faqSchema = (faqs) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
const serviceSchema = (name, url, desc, area) => ({
  '@context': 'https://schema.org', '@type': 'Service',
  serviceType: name, name, description: desc, url: `${SITE}${url}`,
  provider: { '@id': BUSINESS_ID },
  areaServed: area ? { '@type': 'City', name: `${area}, MO` } : AREAS.map((a) => ({ '@type': 'City', name: `${a.name}, MO` })),
});

// ── layout pieces ───────────────────────────────────────────
function header(active, url) {
  const menu = (label, key, links, wide = false) => `<details class="nav-group${wide ? ' nav-group-wide' : ''}" name="main-navigation"${active === key ? ' data-current' : ''}>
    <summary>${label}</summary>
    <ul class="nav-links">
      ${links.map(([text, href]) => `<li><a href="${esc(href)}"${url === href ? ' aria-current="page"' : ''}>${esc(text)}</a></li>`).join('\n      ')}
    </ul>
  </details>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="hdr" data-hdr>
  <div class="wrap hdr-in">
    <a class="brand" href="/" aria-label="AGM Painting home">
      <img src="/assets/img/agm-painting-logo-white.webp" alt="AGM Painting logo" width="600" height="487">
    </a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Open menu" data-burger><span></span><span></span><span></span></button>
    <nav class="nav" id="nav" aria-label="Main">
      ${menu('Services', 'services', [['All services', '/services/'], ...SERVICES.map((s) => [s.name, `/services/${s.slug}/`])])}
      ${menu('Service Areas', 'areas', [['All service areas', '/service-areas/'], ...AREAS.map((a) => [a.name, `/service-areas/${a.slug}/`])], true)}
      ${menu('Our Work', 'gallery', [['Project gallery', '/gallery/'], ['Before & after', '/gallery/#before-after']])}
      ${menu('About', 'about', [['Meet the owner', '/about/'], ['Our process', '/#proc-h'], ['Customer reviews', '/#rev-h']])}
      ${menu('Contact', 'contact', [['Contact information', '/contact/'], ['Request a free estimate', '/contact/#quote'], [`Call ${BIZ.phone}`, tel]])}
    </nav>
    <a class="btn btn-sm btn-accent hdr-cta" href="/#estimate-form">Free Estimate ${icon('arrow')}</a>
  </div>
</header>`;
}

function footer() {
  return `<section class="cta-band">
  <div class="wrap cta-in">
    <div>
      <p class="eyebrow">Ready when you are</p>
      <h2>Let’s make your place look brand new.</h2>
      <p>Free estimates across Springfield and 30 miles around. Call, text or send a request.</p>
    </div>
    <div class="cta-btns">
      <a class="btn btn-accent btn-lg" href="${tel}">${icon('phone')} ${BIZ.phone}</a>
      <a class="btn btn-ghost btn-lg" href="/#estimate-form">Get a Free Estimate</a>
    </div>
  </div>
</section>
<footer class="ftr">
  <div class="wrap ftr-grid">
    <div class="ftr-brand">
      <img src="/assets/img/agm-painting-logo-white.webp" alt="AGM Painting" width="600" height="487" loading="lazy">
      <p>Family-focused interior, exterior and commercial painting in Springfield, MO. We put the customer first and take pride in every line.</p>
      <p class="nap"><strong>${BIZ.name}</strong><br>${BIZ.city}, ${BIZ.region}<br><a href="${tel}">${BIZ.phone}</a><br><a href="mailto:${BIZ.email}">${BIZ.email}</a></p>
      <a class="social" href="${BIZ.facebook}" rel="noopener" target="_blank" aria-label="AGM Painting on Facebook">${icon('fb')}</a>
    </div>
    <div>
      <h3>Services</h3>
      <ul>${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${s.name}</a></li>`).join('')}</ul>
    </div>
    <div class="ftr-areas">
      <h3>Service Areas</h3>
      <ul>${AREAS.map((a) => `<li><a href="/service-areas/${a.slug}/">${a.name}, MO</a></li>`).join('')}</ul>
    </div>
  </div>
  <div class="wrap ftr-bot">
    <p>© <span data-year>2026</span> ${BIZ.name} · Painting contractor serving Springfield, MO &amp; a 30-mile radius.</p>
    <p><a href="/contact/">Contact</a> · <a href="/sitemap.xml">Sitemap</a></p>
  </div>
</footer>
<div class="mbar" aria-label="Quick contact">
  <a href="${tel}">${icon('phone')} Call</a>
  <a href="/#estimate-form" class="mbar-cta">Free Estimate</a>
</div>`;
}

function estimateForm({ id = 'estimate-form', heading = 'Get Your Free Estimate', city = '', service = '' } = {}) {
  const cities = AREAS.map((a) => `<option${a.name === city ? ' selected' : ''}>${a.name}</option>`).join('');
  const services = SERVICES.map((s) => `<option${s.name === service ? ' selected' : ''}>${s.name}</option>`).join('');
  return `<form class="form" id="${id}" action="${BIZ.formAction}" method="POST" data-form>
  <div class="form-head">
    <h2>${heading}</h2>
    <p>Fast reply, usually same day. No pressure.</p>
  </div>
  <input type="hidden" name="_subject" value="New estimate request: AGM Painting website">
  <input type="hidden" name="_next" value="${SITE}/thank-you/">
  <input type="hidden" name="_template" value="table">
  <input type="hidden" name="_captcha" value="false">
  <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="fgrid">
    <label class="f"><span>Name</span><input name="name" autocomplete="name" required placeholder="Your name"></label>
    <label class="f"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" required placeholder="(417) 555-0123"></label>
    <label class="f full"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@email.com"></label>
    <label class="f"><span>City</span><select name="city">${cities}<option>Other / not sure</option></select></label>
    <label class="f"><span>Service</span><select name="service">${services}<option>Not sure yet</option></select></label>
    <label class="f full"><span>Project details</span><textarea name="message" rows="3" placeholder="Rooms, square footage, colors, timeline…"></textarea></label>
  </div>
  <button class="btn btn-accent btn-block" type="submit">Request My Free Estimate ${icon('arrow')}</button>
  <p class="form-note">Prefer to talk? <a href="${tel}">Call or text ${BIZ.phone}</a></p>
</form>`;
}

function reviewsBlock() {
  return `<section class="sec reviews" aria-labelledby="rev-h">
  <div class="wrap">
    <div class="sec-head center">
      <p class="eyebrow">Real Google reviews</p>
      <h2 id="rev-h">What our neighbors say</h2>
    </div>
    <div class="rev-grid">
      ${REVIEWS.map((r) => `<figure class="rev reveal">
        <div class="stars" aria-label="5 out of 5 stars">${icon('star').repeat(5)}</div>
        <blockquote>“${esc(r.text)}”</blockquote>
        <figcaption><strong>${esc(r.name)}</strong><span>${esc(r.tags)}</span></figcaption>
      </figure>`).join('')}
    </div>
    <p class="center rev-link"><a href="${BIZ.google}" target="_blank" rel="noopener">See AGM Painting on Google ${icon('arrow')}</a></p>
  </div>
</section>`;
}

function faqBlock(faqs, title = 'Frequently asked questions') {
  return `<section class="sec faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <div class="sec-head center"><p class="eyebrow">Good questions</p><h2 id="faq-h">${title}</h2></div>
    ${faqs.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
  </div>
</section>`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([n, u], i) => i === items.length - 1 ? `<li aria-current="page">${n}</li>` : `<li><a href="${u}">${n}</a></li>`).join('')}</ol></nav>`;
}

function pageHero({ title, lead, image, items, eyebrow }) {
  return `<section class="phero">
  ${img(image, { sizes: '100vw', cls: 'phero-bg', eager: true, alt: '' })}
  <div class="wrap phero-in">
    ${crumbs(items)}
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
    <h1>${title}</h1>
    <p class="lead">${lead}</p>
    <div class="hero-btns">
      <a class="btn btn-accent btn-lg" href="/#estimate-form">Get a Free Estimate</a>
      <a class="btn btn-ghost btn-lg" href="${tel}">${icon('phone')} ${BIZ.phone}</a>
    </div>
  </div>
</section>`;
}

function layout({ url, title, desc, body, active, schema = [], ogImage = 'stained-cedar-garage-exterior-springfield-mo', noindex = false, preload, preloadSizes = '100vw' }) {
  if (!noindex) pages.push(url);
  const canonical = `${SITE}${url}`;
  const ld = [businessSchema(), ...schema].map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  const pre = preload ? `<link rel="preload" as="image" href="/assets/img/${preload}-800.webp" imagesrcset="/assets/img/${preload}-800.webp 800w, /assets/img/${preload}-1600.webp ${Math.min(MANIFEST[preload].w, 1600)}w" imagesizes="${preloadSizes}" fetchpriority="high">` : '';
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="geo.region" content="US-MO">
<meta name="geo.placename" content="Springfield">
<meta name="geo.position" content="${BIZ.geo.lat};${BIZ.geo.lng}">
<meta name="ICBM" content="${BIZ.geo.lat}, ${BIZ.geo.lng}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BIZ.short}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/img/${ogImage}.jpg">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${THEME_COLOR}">
<link rel="icon" href="/assets/icon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap">
${pre}
<link rel="stylesheet" href="/assets/css/site.css?v=${VERSION}">
${ld}
</head>
<body>
${header(active, url)}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/js/site.js?v=${VERSION}" defer></script>
</body>
</html>`;
}

function write(url, html) {
  const file = url.endsWith('.html') ? path.join(ROOT, url) : path.join(ROOT, url, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const serviceCards = (list = SERVICES, citySuffix = '') => `<div class="svc-grid">
  ${list.map((s) => `<a class="svc reveal" href="/services/${s.slug}/">
    <div class="svc-img">${img(s.hero, { sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' })}</div>
    <div class="svc-body">
      <span class="svc-ic">${icon(s.icon)}</span>
      <h3>${s.name}${citySuffix}</h3>
      <p>${s.short}</p>
      <span class="more">Learn more ${icon('arrow')}</span>
    </div>
  </a>`).join('')}
</div>`;

const ba = (before, after, label) => `<figure class="ba reveal" data-ba>
  <div class="ba-stage">
    ${img(after, { sizes: '(min-width: 1024px) 50vw, 100vw', cls: 'ba-after' })}
    <div class="ba-before">${img(before, { sizes: '(min-width: 1024px) 50vw, 100vw' })}</div>
    <span class="ba-tag ba-tag-b">Before</span><span class="ba-tag ba-tag-a">After</span>
    <div class="ba-handle" aria-hidden="true"><span></span></div>
    <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after: ${esc(label)}">
  </div>
  <figcaption>${label}</figcaption>
</figure>`;

// ── HOME ────────────────────────────────────────────────────
function home() {
  const project = 'vaulted-living-room-painting-springfield-mo';
  const projectSizes = '(min-width: 1240px) 620px, (min-width: 900px) 52vw, 100vw';
  const body = `
<section class="hero" id="estimate">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="eyebrow">Springfield, Missouri</p>
      <h1>Painting for homes<br class="hero-break"> <em>&amp; businesses.</em></h1>
      <p class="lead">Interior and exterior painting, commercial repaints, and cedar staining by a family-owned crew that takes the time to prep right.</p>
      <div class="hero-btns">
        <a class="btn btn-accent" href="#estimate-form">Get a free estimate ${icon('arrow')}</a>
        <a class="link-under" href="/gallery/">See our work ${icon('arrow')}</a>
      </div>
    </div>
    <figure class="hero-project">
      ${img(project, { sizes: projectSizes, eager: true })}
      <figcaption><a href="/services/interior-painting/">Interior painting in Springfield ${icon('arrow')}</a></figcaption>
    </figure>
  </div>
</section>

<section class="sec estimate-section">
  <div class="wrap split">
    ${estimateForm()}
    <div>
      <h2>What happens next?</h2>
      <p>Anthony will reach out to set up your free estimate and talk through your project.</p>
      <a class="link-under" href="${tel}">${icon('phone')} ${BIZ.phone}</a>
    </div>
  </div>
</section>

<section class="trust" aria-label="Why choose AGM Painting">
  <div class="wrap trust-in">
    <div>${icon('family')}<p><strong>Family-owned</strong><span>Owner on every job</span></p></div>
    <div>${icon('shield')}<p><strong>Careful prep</strong><span>Floors &amp; landscaping protected</span></p></div>
    <div>${icon('star')}<p><strong>Detailed finish</strong><span>Crisp lines and even coats</span></p></div>
    <div>${icon('pin')}<p><strong>Local crew</strong><span>Serving a 30-mile radius</span></p></div>
  </div>
</section>

<section class="sec" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="svc-h">Painting services in Springfield, MO</h2>
      <p>From a single room to a full exterior, find the right service for your project.</p>
    </div>
    ${serviceCards()}
  </div>
</section>

<section class="sec sec-dark" aria-labelledby="ba-h">
  <div class="wrap">
    <div class="sec-head center">
      <p class="eyebrow">Drag the slider</p>
      <h2 id="ba-h">Before &amp; after</h2>
    </div>
    <div class="ba-grid">
      ${ba('garage-before-peeling-paint-springfield-mo', 'garage-after-exterior-painting-springfield-mo', 'Peeling garage: scraped, primed &amp; repainted')}
      ${ba('ranch-house-before-exterior-painting', 'ranch-house-after-exterior-painting-gray', 'Ranch home: green siding to modern charcoal')}
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="proc-h">
  <div class="wrap split">
    <div class="split-media reveal">
      ${img('commercial-office-repaint-in-progress-springfield-mo', { sizes: '(min-width: 1024px) 50vw, 100vw' })}
    </div>
    <div class="split-copy">
      <p class="eyebrow">How we work</p>
      <h2 id="proc-h">A paint job is only as good as the prep.</h2>
      <ol class="steps">
        <li><strong>Free estimate</strong><span>We walk the project with you, talk colors and sheens, and give you a clear written price.</span></li>
        <li><strong>Protect &amp; prep</strong><span>Floors, furniture, windows and landscaping get covered. Then we patch, caulk, scrape, sand and prime.</span></li>
        <li><strong>Paint with precision</strong><span>Quality coatings, crisp cut lines and even coverage, on schedule.</span></li>
        <li><strong>Walkthrough &amp; cleanup</strong><span>We check every detail with you and leave your space spotless.</span></li>
      </ol>
    </div>
  </div>
</section>

${reviewsBlock()}

<section class="sec" aria-labelledby="gal-h">
  <div class="wrap">
    <div class="sec-head row">
      <div><p class="eyebrow">Recent projects</p><h2 id="gal-h">Work we’re proud of</h2></div>
      <a class="btn btn-dark" href="/gallery/">View full gallery ${icon('arrow')}</a>
    </div>
    <div class="mosaic">
      ${['red-cedar-home-staining-springfield-mo', 'home-gym-basement-black-ceiling-painting', 'navy-accent-wall-bedroom-springfield-mo', 'stone-home-garage-doors-stained-springfield-mo', 'white-painted-brick-home-porch-springfield-mo', 'commercial-office-repaint-finished'].map((s) => `<a href="/gallery/" class="reveal">${img(s, { sizes: '(min-width: 1024px) 33vw, 50vw' })}</a>`).join('')}
    </div>
  </div>
</section>

<section class="sec sec-paper" aria-labelledby="area-h">
  <div class="wrap split">
    <div class="split-copy">
      <p class="eyebrow">Service areas</p>
      <h2 id="area-h">Proudly painting within 30 miles of Springfield</h2>
      <p>Based in Springfield, we serve Greene, Christian and Webster counties, from the city to the country.</p>
      <ul class="area-chips">
        ${AREAS.map((a) => `<li><a href="/service-areas/${a.slug}/">${a.name}</a></li>`).join('')}
      </ul>
    </div>
    <div class="radar reveal" aria-hidden="true">${radarSvg()}</div>
  </div>
</section>

<section class="sec" aria-labelledby="about-h">
  <div class="wrap split flip">
    <div class="split-media reveal">${img('agm-painting-crew-exterior-staining-job', { sizes: '(min-width: 1024px) 50vw, 100vw' })}</div>
    <div class="split-copy">
      <p class="eyebrow">About AGM Painting</p>
      <h2 id="about-h">Small, family-focused, and serious about quality.</h2>
      <p>AGM Painting is owned and run by <strong>Anthony Runyon</strong> right here in Springfield. We’re a small, family-focused business that puts the customer first, specializing in high-end painting where the details matter.</p>
      <p>Our favorite part of the job? The look on a customer’s face when the drop cloths come up and the room, or the whole house, looks brand new.</p>
      <a class="btn btn-dark" href="/about/">Meet Anthony ${icon('arrow')}</a>
    </div>
  </div>
</section>

${faqBlock(HOME_FAQS)}
`;
  write('/', layout({
    url: '/',
    title: 'Painters in Springfield, MO | Interior & Exterior | AGM Painting',
    desc: 'Family-owned painting contractor in Springfield, MO. Interior, exterior & commercial painting and cedar staining within 30 miles. Free estimates: (417) 224-0103.',
    body, active: 'home', ogImage: project, preload: project, preloadSizes: projectSizes,
    schema: [faqSchema(HOME_FAQS), { '@context': 'https://schema.org', '@type': 'WebSite', name: BIZ.short, url: `${SITE}/` }],
  }));
}

function radarSvg() {
  // Simple map-like plot of towns relative to Springfield (≈30 mi rings).
  const cx = 200, cy = 200, R = 180, maxMi = 32;
  const milesPerLat = 69, milesPerLng = 69 * Math.cos((BIZ.geo.lat * Math.PI) / 180);
  const dots = AREAS.filter((a) => a.mi > 0).map((a) => {
    const dx = (a.lng - BIZ.geo.lng) * milesPerLng, dy = (a.lat - BIZ.geo.lat) * milesPerLat;
    const x = cx + (dx / maxMi) * R, y = cy - (dy / maxMi) * R;
    const anchor = dx < 0 ? 'end' : 'start';
    // towns hugging Springfield/Nixa get a dot only, so labels never collide
    if (['Brookline', 'Battlefield', 'Fremont Hills'].includes(a.name)) return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/></g>`;
    return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/><text x="${(x + (dx < 0 ? -8 : 8)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${a.name}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 400 400" role="img">
  <circle cx="${cx}" cy="${cy}" r="${R}" class="ring r3"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.66}" class="ring"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.33}" class="ring"/>
  <text x="${cx}" y="${cy - R - 6}" text-anchor="middle" class="ring-l">30 mi</text>
  <g class="dots">${dots}</g>
  <circle cx="${cx}" cy="${cy}" r="10" class="home-dot"/><circle cx="${cx}" cy="${cy}" r="10" class="home-pulse"/>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" class="home-l">Springfield</text>
</svg>`;
}

// ── SERVICES ────────────────────────────────────────────────
function servicesIndex() {
  const body = `${pageHero({ title: 'Painting Services in Springfield, MO', lead: 'Interior, exterior, commercial, staining and specialty painting from one family-focused crew, with free estimates within 30 miles of Springfield.', image: 'vaulted-living-room-painting-springfield-mo', items: [['Home', '/'], ['Services', '/services/']] })}
<section class="sec"><div class="wrap">${serviceCards()}</div></section>
<section class="sec sec-paper" id="quote"><div class="wrap split"><div class="split-copy"><p class="eyebrow">Not sure what you need?</p><h2>Tell us about your project.</h2><p>Send a few details and Anthony will follow up to schedule your free estimate. Most requests get a reply the same day.</p></div><div>${estimateForm({ id: 'svc-form' })}</div></div></section>
${reviewsBlock()}`;
  write('/services/', layout({
    url: '/services/', active: 'services',
    title: 'Painting Services in Springfield, MO | AGM Painting',
    desc: 'Explore AGM Painting’s services in Springfield, MO: interior & exterior painting, commercial painting, cedar staining, basement ceilings, doors & trim, drywall repair.',
    body, preload: 'vaulted-living-room-painting-springfield-mo',
    schema: [breadcrumbs([['Home', '/'], ['Services', '/services/']])],
  }));
}

function servicePage(s) {
  const url = `/services/${s.slug}/`;
  const others = SERVICES.filter((x) => x.slug !== s.slug);
  const body = `${pageHero({ title: s.title, lead: s.short, image: s.hero, eyebrow: 'AGM Painting Services', items: [['Home', '/'], ['Services', '/services/'], [s.name, url]] })}
<section class="sec">
  <div class="wrap split">
    <div class="split-copy prose">
      <h2>${s.name} done right, from prep to final coat</h2>
      ${s.intro.map((p) => `<p>${p}</p>`).join('')}
      <h3>What’s included</h3>
      <ul class="checks">${s.includes.map((i) => `<li>${icon('check')} ${i}</li>`).join('')}</ul>
    </div>
    <aside class="side" id="quote">${estimateForm({ id: 'svc-form', heading: `Free ${s.name} Estimate`, service: s.name })}</aside>
  </div>
</section>
<section class="sec sec-paper" aria-labelledby="sg-h">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">Recent ${s.nav.toLowerCase()} projects</p><h2 id="sg-h">${s.name} by AGM Painting</h2></div>
    <div class="mosaic">${s.gallery.map((g) => `<figure class="reveal">${img(g, { sizes: '(min-width: 1024px) 33vw, 50vw' })}<figcaption>${esc(MANIFEST[g].alt)}</figcaption></figure>`).join('')}</div>
  </div>
</section>
<section class="sec" aria-labelledby="sa-h">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">Where we work</p><h2 id="sa-h">${s.name} near you</h2><p>We provide ${s.name.toLowerCase()} throughout the Springfield area, including:</p></div>
    <ul class="area-chips">${AREAS.map((a) => `<li><a href="/service-areas/${a.slug}/">${a.name}</a></li>`).join('')}</ul>
  </div>
</section>
${faqBlock(s.faqs, `${s.name} FAQs`)}
${reviewsBlock()}
<section class="sec sec-paper" aria-labelledby="os-h">
  <div class="wrap"><div class="sec-head"><p class="eyebrow">More services</p><h2 id="os-h">Other ways we can help</h2></div>${serviceCards(others.slice(0, 3))}</div>
</section>`;
  write(url, layout({
    url, active: 'services', title: s.metaTitle, desc: s.metaDesc, body, ogImage: s.hero, preload: s.hero,
    schema: [serviceSchema(s.name, url, s.metaDesc), faqSchema(s.faqs), breadcrumbs([['Home', '/'], ['Services', '/services/'], [s.name, url]])],
  }));
}

// ── AREAS ───────────────────────────────────────────────────
function areasIndex() {
  const body = `${pageHero({ title: 'Painting Service Areas Around Springfield, MO', lead: 'AGM Painting serves homes and businesses within about 30 miles of Springfield, across Greene, Christian and Webster counties.', image: 'red-stained-home-wooded-lot-springfield-mo', items: [['Home', '/'], ['Service Areas', '/service-areas/']] })}
<section class="sec">
  <div class="wrap split">
    <div class="split-copy">
      <h2>Find your town</h2>
      <p>Don’t see your town? If you’re within roughly 30 miles of Springfield, we can probably help. Just ask.</p>
      <div class="area-list">
        ${AREAS.map((a) => `<a href="/service-areas/${a.slug}/" class="area-card"><strong>${a.name}, MO</strong><span>${a.county} County${a.mi ? ` · ~${a.mi} mi` : ' · Home base'}</span>${icon('arrow')}</a>`).join('')}
      </div>
    </div>
    <div class="radar reveal" aria-hidden="true">${radarSvg()}</div>
  </div>
</section>
<section class="sec sec-paper" id="quote"><div class="wrap narrow">${estimateForm({ id: 'area-form' })}</div></section>`;
  write('/service-areas/', layout({
    url: '/service-areas/', active: 'areas',
    title: 'Service Areas | Painters Near Springfield MO | AGM Painting',
    desc: 'AGM Painting serves Springfield, Nixa, Ozark, Republic, Battlefield, Willard, Strafford, Rogersville and more, all within 30 miles. Free painting estimates.',
    body, preload: 'red-stained-home-wooded-lot-springfield-mo',
    schema: [breadcrumbs([['Home', '/'], ['Service Areas', '/service-areas/']])],
  }));
}

function areaPage(a) {
  const url = `/service-areas/${a.slug}/`;
  const near = AREAS.filter((x) => x.slug !== a.slug)
    .map((x) => ({ ...x, d: Math.hypot((x.lat - a.lat) * 69, (x.lng - a.lng) * 55) }))
    .sort((p, q) => p.d - q.d).slice(0, 6);
  const faqs = [
    [`Do you offer free painting estimates in ${a.name}, MO?`, `Yes. AGM Painting provides free, no-pressure estimates in ${a.name} and throughout ${a.county} County. Call ${BIZ.phone} or use the form on this page.`],
    [`What painting services are available in ${a.name}?`, `We offer interior painting, exterior painting, commercial painting, cedar siding and wood staining, black exposed basement ceilings, door, trim and garage door painting, and drywall repair in ${a.name}, MO.`],
    [`How far is ${a.name} from AGM Painting?`, a.mi ? `${a.name} is about ${a.mi} miles from our Springfield base, well inside our 30-mile service radius.` : `Springfield is our home base, so we can usually get out for an estimate quickly.`],
  ];
  const title = a.mi ? `Painters in ${a.name}, MO` : `Painting Contractor in Springfield, MO`;
  const body = `${pageHero({ title: `${title}: Interior, Exterior &amp; Commercial`, lead: `Family-focused painting for ${a.name} homes and businesses, with meticulous prep, high-end finishes and free estimates.`, image: a.img, eyebrow: `${a.county} County, Missouri`, items: [['Home', '/'], ['Service Areas', '/service-areas/'], [`${a.name}, MO`, url]] })}
<section class="sec">
  <div class="wrap split">
    <div class="split-copy prose">
      <h2>Your local painting contractor in ${a.name}</h2>
      <p>${a.blurb}</p>
      <p>${a.homes}</p>
      <p>Every project gets the same prep-first approach: floors and landscaping protected, surfaces patched, scraped and primed, and crisp, even finish coats. Owner Anthony Runyon is hands-on from estimate to final walkthrough.</p>
      <h3>Painting services in ${a.name}, MO</h3>
      <ul class="checks two">${SERVICES.map((s) => `<li>${icon('check')} <a href="/services/${s.slug}/">${s.name}</a></li>`).join('')}</ul>
    </div>
    <aside class="side" id="quote">${estimateForm({ id: 'city-form', heading: `Free Estimate in ${a.name}`, city: a.name })}</aside>
  </div>
</section>
<section class="sec sec-paper" aria-labelledby="cs-h">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">What we do in ${a.name}</p><h2 id="cs-h">Painting services for ${a.name} homes &amp; businesses</h2></div>
    ${serviceCards(SERVICES.slice(0, 6))}
  </div>
</section>
${reviewsBlock()}
${faqBlock(faqs, `Painting in ${a.name}: FAQs`)}
<section class="sec sec-paper" aria-labelledby="nb-h">
  <div class="wrap"><div class="sec-head"><p class="eyebrow">Nearby</p><h2 id="nb-h">We also paint near ${a.name}</h2></div>
  <ul class="area-chips">${near.map((n) => `<li><a href="/service-areas/${n.slug}/">Painters in ${n.name}, MO</a></li>`).join('')}<li><a href="/service-areas/">All service areas</a></li></ul></div>
</section>`;
  write(url, layout({
    url, active: 'areas',
    title: a.mi ? `Painters in ${a.name}, MO | Interior & Exterior | AGM Painting` : 'House Painters in Springfield, MO | AGM Painting',
    desc: `Painters in ${a.name}, MO: interior, exterior & commercial painting and cedar staining in ${a.county} County. Family-owned. Free estimates: ${BIZ.phone}.`,
    body, ogImage: a.img, preload: a.img,
    schema: [serviceSchema(`Painting Contractor in ${a.name}, MO`, url, `Interior, exterior and commercial painting in ${a.name}, Missouri.`, a.name), faqSchema(faqs), breadcrumbs([['Home', '/'], ['Service Areas', '/service-areas/'], [`${a.name}, MO`, url]])],
  }));
}

// ── ABOUT / GALLERY / CONTACT / MISC ────────────────────────
function about() {
  const body = `${pageHero({ title: 'About AGM Painting', lead: 'A small, family-focused Springfield painting company that always puts the customer first.', image: 'agm-painting-crew-exterior-staining-job', items: [['Home', '/'], ['About', '/about/']] })}
<section class="sec">
  <div class="wrap split">
    <div class="split-copy prose">
      <p class="eyebrow">Our story</p>
      <h2>Built on integrity, one room at a time.</h2>
      <p>AGM Painting LLC is owned and operated by <strong>Anthony Runyon</strong> in Springfield, Missouri. What started as one painter who cared more than most has grown into a trusted local company serving homeowners and businesses across the Springfield area.</p>
      <p>We’re a small, family-focused business, and we like it that way. It means Anthony is hands-on with every project. The person who gives you the estimate is invested in how your walls look when we leave. We specialize in high-end painting, where clean lines, smooth finishes and careful prep separate a good job from a great one.</p>
      <p>Our favorite part of the job is the look of satisfaction on a customer’s face when the project is finished. We take pride in our work, and our customers notice. They talk about our punctuality, our professionalism and taking the time to explain the process and help pick the right colors.</p>
      <h3>What you can count on</h3>
      <ul class="checks">
        <li>${icon('check')} Honest, clear estimates with fair pricing</li>
        <li>${icon('check')} We show up on time and communicate</li>
        <li>${icon('check')} Prep done right: patch, caulk, scrape, prime</li>
        <li>${icon('check')} Your home and landscaping protected</li>
        <li>${icon('check')} Help choosing colors and sheens</li>
        <li>${icon('check')} A clean job site and a final walkthrough</li>
      </ul>
    </div>
    <div class="stack">
      <div class="split-media reveal">${img('painter-rolling-ceiling-springfield-mo', { sizes: '(min-width: 1024px) 45vw, 100vw' })}</div>
      <div class="split-media reveal">${img('painter-staining-wood-siding-ladder', { sizes: '(min-width: 1024px) 45vw, 100vw' })}</div>
    </div>
  </div>
</section>
${reviewsBlock()}
<section class="sec sec-paper" id="quote"><div class="wrap narrow">${estimateForm({ id: 'about-form' })}</div></section>`;
  write('/about/', layout({
    url: '/about/', active: 'about',
    title: 'About AGM Painting | Family-Owned Painters in Springfield MO',
    desc: 'Meet Anthony Runyon of AGM Painting LLC, a family-focused Springfield, MO painting company known for high-end finishes and customer-first service.',
    body, ogImage: 'agm-painting-crew-exterior-staining-job', preload: 'agm-painting-crew-exterior-staining-job',
    schema: [breadcrumbs([['Home', '/'], ['About', '/about/']]), { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About AGM Painting', url: `${SITE}/about/`, about: { '@id': BUSINESS_ID } }],
  }));
}

function gallery() {
  const cats = [['all', 'All'], ['interior', 'Interior'], ['exterior', 'Exterior'], ['staining', 'Staining'], ['commercial', 'Commercial'], ['basement', 'Basements'], ['doors', 'Doors']];
  const items = Object.entries(MANIFEST).filter(([, m]) => m.cat !== 'prep');
  const body = `${pageHero({ title: 'Our Painting Work in Springfield, MO', lead: 'Real projects from real Springfield-area homes and businesses. No stock photos.', image: 'stone-home-garage-doors-stained-springfield-mo', items: [['Home', '/'], ['Our Work', '/gallery/']] })}
<section class="sec">
  <div class="wrap">
    <div class="filters" role="toolbar" aria-label="Filter gallery">${cats.map(([k, l], i) => `<button type="button" data-filter="${k}"${i === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${l}</button>`).join('')}</div>
    <div class="gal" data-gallery>
      ${items.map(([slug, m]) => `<a href="/assets/img/${slug}-1600.webp" data-cat="${m.cat}" class="gal-item">${img(slug, { sizes: '(min-width: 1024px) 25vw, 50vw' })}</a>`).join('')}
    </div>
  </div>
</section>
<section class="sec sec-dark" id="before-after"><div class="wrap"><div class="sec-head center"><p class="eyebrow">Before &amp; after</p><h2>See the difference prep makes</h2></div><div class="ba-grid">
  ${ba('garage-before-peeling-paint-springfield-mo', 'garage-after-exterior-painting-springfield-mo', 'Garage: peeling green to fresh gray')}
  ${ba('ranch-house-before-exterior-painting', 'ranch-house-after-exterior-painting-gray', 'Ranch home exterior repaint')}
  ${ba('commercial-wall-repair-prep-before', 'commercial-office-repaint-finished', 'Commercial office: repaired &amp; repainted')}
  ${ba('commercial-office-wall-primer-springfield-mo', 'commercial-office-painting-finished-springfield-mo', 'Office: bold colors to clean neutral')}
</div></div></section>
<dialog class="lb" data-lb><button class="lb-x" aria-label="Close" data-lb-close>×</button><img alt=""><p></p></dialog>`;
  write('/gallery/', layout({
    url: '/gallery/', active: 'gallery',
    title: 'Our Work: Before & After Painting Projects | AGM Painting',
    desc: 'Browse AGM Painting’s interior, exterior, staining, commercial and basement projects around Springfield, MO, including before-and-after transformations.',
    body, ogImage: 'stone-home-garage-doors-stained-springfield-mo', preload: 'stone-home-garage-doors-stained-springfield-mo',
    schema: [breadcrumbs([['Home', '/'], ['Our Work', '/gallery/']])],
  }));
}

function contact() {
  const body = `${pageHero({ title: 'Contact AGM Painting', lead: 'Free estimates in Springfield, MO and 30 miles around. Call, text, email or send the form.', image: 'white-painted-brick-home-porch-springfield-mo', items: [['Home', '/'], ['Contact', '/contact/']] })}
<section class="sec">
  <div class="wrap split">
    <div class="split-copy">
      <h2>Let’s talk about your project</h2>
      <p>Tell us what you’re looking to paint and we’ll get back to you quickly to set up a free estimate.</p>
      <div class="contact-cards">
        <a href="${tel}" class="cc">${icon('phone')}<span><strong>Call or text</strong>${BIZ.phone}</span></a>
        <a href="mailto:${BIZ.email}" class="cc">${icon('mail')}<span><strong>Email</strong>${BIZ.email}</span></a>
        <div class="cc">${icon('pin')}<span><strong>Based in</strong>Springfield, MO · serving a 30-mile radius</span></div>
        <div class="cc">${icon('clock')}<span><strong>Hours</strong>Early starts, opening at 6 AM</span></div>
        <a href="${BIZ.facebook}" target="_blank" rel="noopener" class="cc">${icon('fb')}<span><strong>Facebook</strong>Message us on Facebook</span></a>
      </div>
    </div>
    <aside class="side" id="quote">${estimateForm({ id: 'contact-form' })}</aside>
  </div>
</section>`;
  write('/contact/', layout({
    url: '/contact/', active: 'contact',
    title: 'Contact AGM Painting | Free Painting Estimates Springfield MO',
    desc: `Contact AGM Painting for a free painting estimate in Springfield, MO and surrounding towns. Call or text ${BIZ.phone}.`,
    body, ogImage: 'white-painted-brick-home-porch-springfield-mo', preload: 'white-painted-brick-home-porch-springfield-mo',
    schema: [breadcrumbs([['Home', '/'], ['Contact', '/contact/']]), { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact AGM Painting', url: `${SITE}/contact/`, about: { '@id': BUSINESS_ID } }],
  }));
}

function thanks() {
  const body = `<section class="sec thanks"><div class="wrap narrow center">
  <div class="thanks-ic">${icon('check')}</div>
  <h1>Thanks! We got your request.</h1>
  <p class="lead">Anthony will reach out soon, usually the same day, to set up your free estimate. Need us sooner? Call or text <a href="${tel}">${BIZ.phone}</a>.</p>
  <div class="hero-btns center"><a class="btn btn-dark" href="/gallery/">Browse our work</a><a class="btn btn-accent" href="/">Back to home</a></div>
</div></section>`;
  write('/thank-you/', layout({ url: '/thank-you/', title: 'Thank You | AGM Painting', desc: 'Thanks for contacting AGM Painting.', body, noindex: true }));
  const nf = `<section class="sec thanks"><div class="wrap narrow center">
  <p class="eyebrow">404</p><h1>This page needs a fresh coat.</h1>
  <p class="lead">We couldn’t find that page. Try one of these instead:</p>
  <div class="hero-btns center"><a class="btn btn-accent" href="/">Home</a><a class="btn btn-dark" href="/services/">Services</a><a class="btn btn-dark" href="/contact/">Contact</a></div>
</div></section>`;
  write('/404.html', layout({ url: '/404.html', title: 'Page Not Found | AGM Painting', desc: 'Page not found.', body: nf, noindex: true }));
}

// ── build ───────────────────────────────────────────────────
home();
servicesIndex();
SERVICES.forEach(servicePage);
areasIndex();
AREAS.forEach(areaPage);
about();
gallery();
contact();
thanks();

const today = new Date().toISOString().slice(0, 10);
const prio = (u) => (u === '/' ? '1.0' : u.split('/').length <= 3 ? '0.9' : '0.8');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${prio(u)}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /thank-you/\nDisallow: /_originals/\nDisallow: /tools/\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({ name: BIZ.name, short_name: BIZ.short, icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }], theme_color: THEME_COLOR, background_color: THEME_COLOR, display: 'standalone', start_url: '/' }, null, 2));
console.log(`Built ${pages.length} indexable pages → ${SITE}`);
