import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "site-static");
const contentPath = path.join(root, "content", "site.json");
const data = JSON.parse(fs.readFileSync(contentPath, "utf8"));

const routeMap = {
  "index.html": "",
  "blackliste.html": "blackliste",
  "jobs.html": "jobs",
  "discography.html": "discography",
  "imagery.html": "imagery",
  "espace-pro.html": "espace-pro",
  "confidentialite.html": "confidentialite",
  "404.html": "404.html"
};

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(path.join(outDir, "www.aquaserge.com"), { recursive: true, force: true });
for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|xml|txt|json|css|js)$/i.test(entry.name)) {
    fs.rmSync(path.join(outDir, entry.name));
  }
}
for (const dir of ["blackliste", "jobs", "discography", "imagery", "espace-pro", "confidentialite"]) {
  fs.rmSync(path.join(outDir, dir), { recursive: true, force: true });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function asset(src, basePath = "./") {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return `${basePath}${src}`.replace(/^\.\//, basePath === "./" ? "./" : basePath);
}

function absoluteAsset(src) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return `${data.site.url}/${src}`;
}

function cleanUrl(file) {
  const route = routeMap[file] ?? file.replace(/\.html$/, "");
  return route ? `${data.site.url}/${route}` : `${data.site.url}/`;
}

function jsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`;
}

function nav(active, basePath) {
  return data.navigation.map((item) => {
    const current = item.key === active ? " aria-current=\"page\"" : "";
    const className = item.key === active ? " class=\"active\"" : "";
    return `<a${className}${current} href="${basePath}${item.url}">${escapeHtml(item.label)}</a>`;
  }).join("");
}

function contacts(basePath) {
  return `
<section id="contact" class="section contact-band" aria-labelledby="contact-title">
  <div class="wrap">
    <div class="section-kicker">Contacts</div>
    <h2 id="contact-title" class="section-title">Presse, booking, label</h2>
    <div class="contact-grid">
      ${data.contacts.map((item) => `
      <a class="contact-item" href="${escapeAttr(item.url)}">
        <span>${escapeHtml(item.role)}</span>
        <strong>${escapeHtml(item.label)}</strong>
      </a>`).join("")}
    </div>
    <div class="pro-links">
      <a href="${basePath}espace-pro.html">Espace pro</a>
      <a href="${basePath}confidentialite.html">Confidentialité et mentions légales</a>
    </div>
  </div>
</section>`;
}

function albumCard(album, basePath, eager = false) {
  return `
<a class="album-card" href="${escapeAttr(album.url)}">
  <img src="${asset(album.image, basePath)}" alt="Pochette de ${escapeAttr(album.title)}" loading="${eager ? "eager" : "lazy"}" decoding="async">
  <span class="album-meta">${escapeHtml(album.year || "Sortie")}</span>
  <strong>${escapeHtml(album.title)}</strong>
</a>`;
}

function eventRow(event) {
  const note = event.note ? `<span class="date-note">${escapeHtml(event.note)}</span>` : "";
  return `
<article class="date-row">
  <time datetime="${escapeAttr(event.date)}">${escapeHtml(event.displayDate)}</time>
  <div>
    <strong>${escapeHtml(event.venue)}</strong>
    ${note}
  </div>
  <span>${escapeHtml(event.place)}</span>
</article>`;
}

function baseSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: data.site.name,
    url: data.site.url,
    image: absoluteAsset(data.site.ogImage),
    email: data.site.email,
    genre: ["Pop expérimentale", "Rock expérimental", "Jazz libre", "Chanson"],
    foundingLocation: "Toulouse, France",
    sameAs: data.social.map((item) => item.url)
  };
}

function head({ title, description, file, image = data.site.ogImage, schema = [] }) {
  const canonical = cleanUrl(file);
  const ogImage = absoluteAsset(image);
  const allSchema = [baseSchema(), ...schema];
  return `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:locale" content="${escapeAttr(data.site.locale)}">
<meta property="og:site_name" content="${escapeAttr(data.site.name)}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="theme-color" content="#f4f0e6">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23151512'/%3E%3Ctext x='8' y='43' font-size='34' fill='%23df2438' font-family='Arial, sans-serif'%3EA%3C/text%3E%3C/svg%3E">
<link rel="manifest" href="./site.webmanifest">
<link rel="stylesheet" href="./styles.css">
${allSchema.map(jsonLd).join("\n")}`;
}

function page({ file, active = "", title, description, image, main, schema = [] }) {
  return `<!doctype html>
<html lang="${escapeAttr(data.site.language)}">
<head>
${head({ title, description, file, image, schema })}
</head>
<body>
  <a class="skip-link" href="#content">Aller au contenu</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="./index.html" aria-label="Aquaserge - accueil">
        <img src="${asset(data.site.logo)}" alt="Aquaserge" width="210" height="66" decoding="async">
      </a>
      <nav class="nav" aria-label="Navigation principale">${nav(active, "./")}</nav>
    </div>
  </header>
  <main id="content">${main}</main>
  <footer class="site-footer">
    <div class="footer-inner">
      <div>© ${escapeHtml(data.site.copyrightYear)}, Aquaserge, Treignac</div>
      <nav class="social" aria-label="Réseaux et plateformes">
        ${data.social.map((item) => `<a href="${escapeAttr(item.url)}">${escapeHtml(item.label)}</a>`).join("")}
      </nav>
    </div>
  </footer>
  <div class="modal" data-modal hidden>
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Média agrandi">
      <button class="modal-close" type="button" data-modal-close aria-label="Fermer">×</button>
      <div data-modal-content></div>
    </div>
  </div>
  <script src="./site.js" defer></script>
</body>
</html>`;
}

const latest = data.albums.find((album) => album.id === data.home.latestRelease) || data.albums[0];
const now = new Date();
const futureDates = data.tourDates.filter((event) => new Date(`${event.date}T23:59:59`) >= now);
const pastDates = data.tourDates.filter((event) => new Date(`${event.date}T23:59:59`) < now);

const pages = {
  "index.html": page({
    file: "index.html",
    active: "home",
    title: data.home.title,
    description: data.home.description,
    main: `
<section class="home-poster" aria-labelledby="home-title">
  <div class="poster-paper">
    <div class="poster-panel panel-red" aria-hidden="true"></div>
    <div class="poster-panel panel-blue" aria-hidden="true"></div>
    <img class="poster-photo poster-photo-left" src="${asset(data.photos[0].src)}" alt="" loading="eager" decoding="async">
    <img class="poster-photo poster-photo-main" src="${asset(data.site.heroImage)}" alt="Aquaserge" loading="eager" decoding="async" fetchpriority="high">
    <img class="poster-photo poster-photo-side" src="${asset(data.photos[7].src)}" alt="" loading="eager" decoding="async">
    <div class="poster-scrap scrap-blue" aria-hidden="true"></div>
    <div class="poster-scrap scrap-yellow" aria-hidden="true"></div>
    <div class="poster-count" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>
    <div class="poster-title-block">
      <p class="eyebrow">${escapeHtml(data.home.eyebrow)}</p>
      <h1 id="home-title">${escapeHtml(data.home.headline)}</h1>
    </div>
    <a class="release-ticket" href="${escapeAttr(latest.url)}" aria-label="Écouter ${escapeAttr(latest.title)}">
      <span>Dernière sortie</span>
      <strong>${escapeHtml(latest.title)}</strong>
      <img src="${asset(latest.image)}" alt="Pochette de ${escapeAttr(latest.title)}" loading="eager" decoding="async">
      <em>Listen / Order</em>
    </a>
  </div>
  <div class="home-date-peek" aria-labelledby="home-live-title">
    <h2 id="home-live-title">Tour dates</h2>
    <div class="home-date-list">
      ${data.tourDates.slice(0, 3).map((event) => `
      <a href="./jobs.html">
        <time datetime="${escapeAttr(event.date)}">${escapeHtml(event.displayDate)}</time>
        <strong>${escapeHtml(event.venue)}</strong>
        <span>${escapeHtml(event.place)}</span>
        <b aria-hidden="true">+</b>
      </a>`).join("")}
    </div>
  </div>
</section>
<section class="section home-records" aria-labelledby="disc-title">
  <div class="wrap">
    <div class="section-kicker">Discographie</div>
    <h2 id="disc-title" class="section-title">Albums et sorties</h2>
    <div class="album-strip">
      ${data.albums.slice(0, 5).map((album) => albumCard(album, "./")).join("")}
    </div>
    <a class="text-link" href="./discography.html">Voir toute la discographie</a>
  </div>
</section>
${contacts("./")}`
  }),
  "blackliste.html": page({
    file: "blackliste.html",
    active: "blacklist",
    title: data.blacklist.title,
    description: data.blacklist.description,
    image: data.blacklist.image,
    main: `
<section class="section page-hero">
  <div class="wrap split-hero">
    <div>
      <div class="section-kicker">Information</div>
      <h1 class="page-title">${escapeHtml(data.blacklist.headline)}</h1>
      <div class="text-panel">
        ${data.blacklist.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </div>
      <div class="actions">
        <a class="button" href="${escapeAttr(data.blacklist.support.url)}">${escapeHtml(data.blacklist.support.label)}</a>
      </div>
    </div>
    <img class="feature-image" src="${asset(data.blacklist.image)}" alt="Aquaserge en concert" loading="eager" decoding="async">
  </div>
</section>
${contacts("./")}`
  }),
  "jobs.html": page({
    file: "jobs.html",
    active: "jobs",
    title: data.pages.jobs.title,
    description: data.pages.jobs.description,
    schema: [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Concerts Aquaserge",
      itemListElement: data.tourDates.map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MusicEvent",
          name: `${data.site.name} - ${event.venue}`,
          startDate: event.date,
          location: {
            "@type": "Place",
            name: event.venue,
            address: event.place
          },
          performer: { "@type": "MusicGroup", name: data.site.name }
        }
      }))
    }],
    main: `
<section class="section page-hero compact">
  <div class="wrap">
    <div class="section-kicker">Live</div>
    <h1 class="page-title">Tour dates</h1>
    <p class="large-text">${futureDates.length ? "Les prochaines dates annoncées." : "Aucune date future n'est annoncée pour le moment. Les dernières dates restent archivées ici."}</p>
  </div>
</section>
<section class="section">
  <div class="wrap dates">
    ${futureDates.length ? `<h2 class="section-title small">Prochaines dates</h2>${futureDates.map(eventRow).join("")}` : ""}
    <h2 class="section-title small">Archives récentes</h2>
    ${pastDates.map(eventRow).join("")}
  </div>
</section>
${contacts("./")}`
  }),
  "discography.html": page({
    file: "discography.html",
    active: "discography",
    title: data.pages.discography.title,
    description: data.pages.discography.description,
    schema: [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Discographie Aquaserge",
      itemListElement: data.albums.map((album, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MusicAlbum",
          name: album.title,
          byArtist: { "@type": "MusicGroup", name: data.site.name },
          image: absoluteAsset(album.image),
          url: album.url,
          datePublished: album.year
        }
      }))
    }],
    main: `
<section class="section page-hero compact">
  <div class="wrap">
    <div class="section-kicker">Catalogue</div>
    <h1 class="page-title">Discography</h1>
    <p class="large-text">Albums, EP, collaborations et portes d'entrée vers les écoutes officielles.</p>
  </div>
</section>
<section class="section">
  <div class="wrap album-grid">
    ${data.albums.map((album, index) => albumCard(album, "./", index < 4)).join("")}
  </div>
</section>
${contacts("./")}`
  }),
  "imagery.html": page({
    file: "imagery.html",
    active: "imagery",
    title: data.pages.imagery.title,
    description: data.pages.imagery.description,
    main: `
<section class="section page-hero compact">
  <div class="wrap">
    <div class="section-kicker">Images</div>
    <h1 class="page-title">Imagery</h1>
    <p class="large-text">Clips, vidéos et photographies du groupe.</p>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <h2 class="section-title small">Vidéos</h2>
    <div class="video-grid">
      ${data.videos.map((video) => `
      <button class="video-card" type="button" data-video="${escapeAttr(video.youtubeId)}" data-title="${escapeAttr(video.title)}">
        <img src="${asset(video.thumbnail)}" alt="${escapeAttr(video.title)}" loading="lazy" decoding="async">
        <span class="play-dot" aria-hidden="true">▶</span>
        <span class="video-title">${escapeHtml(video.title)}</span>
        <span class="album-meta">${escapeHtml(video.duration)}</span>
      </button>`).join("")}
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <h2 class="section-title small">Photos</h2>
    <div class="photo-grid">
      ${data.photos.map((photo, index) => `
      <a class="photo-card" href="${asset(photo.src)}" data-photo="${asset(photo.src)}" data-alt="${escapeAttr(photo.alt)}">
        <img src="${asset(photo.src)}" alt="${escapeAttr(photo.alt)}" loading="${index < 4 ? "eager" : "lazy"}" decoding="async">
      </a>`).join("")}
    </div>
  </div>
</section>
${contacts("./")}`
  }),
  "espace-pro.html": page({
    file: "espace-pro.html",
    title: data.pages.pro.title,
    description: data.pages.pro.description,
    main: `
<section class="section page-hero compact">
  <div class="wrap">
    <div class="section-kicker">Professionnels</div>
    <h1 class="page-title">Espace pro</h1>
    <p class="large-text">Pour les demandes de presse, booking, management ou matériel promotionnel, utilisez les contacts ci-dessous.</p>
  </div>
</section>
${contacts("./")}`
  }),
  "confidentialite.html": page({
    file: "confidentialite.html",
    title: data.pages.privacy.title,
    description: data.pages.privacy.description,
    main: `
<section class="section page-hero compact">
  <div class="wrap legal">
    <div class="section-kicker">Site officiel</div>
    <h1 class="page-title">Confidentialité</h1>
    <p>Ce site statique ne dépose pas de cookie de suivi et ne collecte pas de donnée personnelle hors action volontaire de contact par e-mail.</p>
    <p>Les liens externes vers Bandcamp, YouTube, Spotify, Instagram ou autres plateformes sont soumis à leurs propres politiques de confidentialité.</p>
    <p>Contact : <a class="text-link" href="mailto:${escapeAttr(data.site.email)}">${escapeHtml(data.site.email)}</a></p>
  </div>
</section>
${contacts("./")}`
  }),
  "404.html": page({
    file: "404.html",
    title: "Page introuvable | Aquaserge",
    description: "Page introuvable sur le site officiel d'Aquaserge.",
    main: `
<section class="section page-hero compact">
  <div class="wrap">
    <div class="section-kicker">404</div>
    <h1 class="page-title">Page introuvable</h1>
    <p class="large-text">La page demandée n'existe pas ou a changé d'adresse.</p>
    <a class="button" href="./index.html">Retour à l'accueil</a>
  </div>
</section>`
  })
};

const css = `
:root {
  --bg: #eee5d3;
  --paper: #f4ecdc;
  --ink: #11100e;
  --muted: #706b5e;
  --line: #cdbf9f;
  --red: #e53a32;
  --blue: #0f5c86;
  --yellow: #e8c51f;
  --green: #376b4f;
  --shadow: 0 18px 60px rgba(21, 21, 18, .12);
  color-scheme: light;
  font-family: Arial, Helvetica, sans-serif;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; color: var(--ink); background: var(--bg); font-size: 16px; }
img { max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--red); }
.skip-link { position: absolute; left: 12px; top: -60px; z-index: 1000; background: var(--ink); color: var(--paper); padding: 10px 14px; border-radius: 4px; }
.skip-link:focus { top: 12px; }
.site-header { position: sticky; top: 0; z-index: 20; background: #050505; border-bottom: 1px solid #23201a; }
.header-inner { max-width: 1440px; min-height: 64px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 22px; padding: 8px 28px; }
.logo { display: inline-flex; align-items: center; }
.logo img { width: 190px; max-width: 42vw; display: block; filter: saturate(1.15) contrast(1.05); }
.nav { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 8px clamp(14px, 2.8vw, 42px); color: #f4ecdc; font-size: 13px; line-height: 1; text-transform: uppercase; font-weight: 900; }
.nav a { padding: 10px 0; border-bottom: 2px solid transparent; }
.nav a.active { color: var(--red); border-color: currentColor; }
main { min-height: 70vh; }
.wrap { width: min(1180px, calc(100% - 44px)); margin: 0 auto; }
.section { padding: 72px 0; content-visibility: auto; contain-intrinsic-size: 720px; }
.section + .section { border-top: 1px solid var(--line); }
.section-kicker { margin-bottom: 12px; color: var(--red); font-size: 13px; font-weight: 800; text-transform: uppercase; }
.section-title { margin: 0 0 22px; font-size: clamp(34px, 5vw, 72px); line-height: .92; text-transform: uppercase; }
.section-title.small { font-size: clamp(28px, 3vw, 42px); }
.page-title { margin: 0 0 24px; max-width: 920px; font-size: clamp(52px, 10vw, 132px); line-height: .84; text-transform: uppercase; }
.large-text, .text-panel { max-width: 780px; color: var(--muted); font-size: clamp(18px, 2vw, 24px); line-height: 1.45; }
.text-panel { display: grid; gap: 18px; color: var(--ink); }
.text-panel p, .large-text { margin: 0 0 20px; }
.home-poster { position: relative; min-height: calc(100svh - 64px); overflow: hidden; background: #050505; }
.poster-paper { position: relative; min-height: clamp(560px, 78svh, 820px); overflow: hidden; background: var(--paper); isolation: isolate; border-bottom: 1px solid #050505; }
.poster-paper::before { content: ""; position: absolute; inset: 0; z-index: 10; pointer-events: none; opacity: .32; mix-blend-mode: multiply; background-image: radial-gradient(#111 0.8px, transparent 0.8px), linear-gradient(90deg, rgba(17,16,14,.09) 1px, transparent 1px), linear-gradient(rgba(17,16,14,.07) 1px, transparent 1px); background-size: 5px 5px, 78px 100%, 100% 86px; }
.poster-paper::after { content: ""; position: absolute; inset: 0; z-index: 11; pointer-events: none; background: radial-gradient(circle at 24% 12%, transparent 0 18%, rgba(244,236,220,.18) 19% 21%, transparent 22%), linear-gradient(108deg, transparent 0 56%, rgba(17,16,14,.06) 56.2% 56.6%, transparent 57%); }
.poster-panel { position: absolute; z-index: 1; top: 0; bottom: 0; mix-blend-mode: multiply; }
.panel-red { left: 0; width: 15vw; min-width: 124px; background: var(--red); opacity: .86; }
.panel-blue { left: 15vw; width: 8vw; min-width: 78px; background: var(--blue); opacity: .86; }
.poster-photo { position: absolute; display: block; object-fit: cover; filter: grayscale(1) contrast(1.32); mix-blend-mode: multiply; }
.poster-photo-left { z-index: 2; left: 0; bottom: 0; width: min(25vw, 340px); height: 58%; object-position: center; opacity: .94; clip-path: polygon(0 0, 86% 8%, 100% 100%, 0 100%); }
.poster-photo-main { z-index: 3; left: clamp(120px, 18vw, 300px); bottom: -2%; width: min(70vw, 1080px); height: 48%; object-position: center 38%; opacity: .92; clip-path: polygon(4% 12%, 100% 0, 95% 100%, 0 90%); }
.poster-photo-side { z-index: 2; right: -2vw; top: 0; width: min(20vw, 300px); height: 100%; object-position: center; opacity: .68; clip-path: polygon(24% 0, 100% 0, 100% 100%, 0 83%); }
.poster-scrap { position: absolute; z-index: 4; mix-blend-mode: multiply; transform: rotate(-2deg); }
.scrap-blue { right: 19vw; top: 8%; width: 90px; height: 64px; background: var(--blue); }
.scrap-yellow { right: 4vw; top: 24%; width: 140px; height: 360px; background: var(--yellow); clip-path: polygon(10% 0, 100% 6%, 84% 100%, 0 86%); opacity: .9; }
.poster-title-block { position: relative; z-index: 6; width: min(100% - 48px, 940px); margin-left: clamp(138px, 16vw, 255px); padding-top: clamp(70px, 12vh, 135px); }
.poster-title-block h1 { margin: 0; color: #0b0a09; font-family: Impact, Haettenschweiler, "Arial Narrow Bold", Arial, Helvetica, sans-serif; font-size: clamp(62px, 11.8vw, 172px); line-height: .82; text-transform: uppercase; letter-spacing: 0; transform: scaleY(1.12); transform-origin: left top; text-shadow: 1px 0 0 #0b0a09, -1px 0 0 #0b0a09; }
.eyebrow { margin: 0 0 18px; color: var(--red); font-size: 13px; font-weight: 900; text-transform: uppercase; }
.poster-count { position: absolute; z-index: 6; left: 34px; bottom: 34px; display: grid; gap: 8px; color: #111; font-size: 14px; font-weight: 900; }
.poster-count span:first-child { color: var(--red); }
.release-ticket { position: absolute; z-index: 12; right: clamp(20px, 8vw, 150px); bottom: 0; width: min(244px, 23vw); min-width: 210px; display: grid; gap: 10px; padding: 20px 20px 0; background: #0b0a09; color: var(--paper); box-shadow: 0 18px 38px rgba(0,0,0,.28); }
.release-ticket span { color: var(--red); font-size: 13px; font-weight: 900; text-transform: uppercase; }
.release-ticket strong { font-size: clamp(23px, 2.2vw, 34px); line-height: .92; text-transform: uppercase; }
.release-ticket img { width: 100%; aspect-ratio: 1; object-fit: cover; border: 0; filter: contrast(1.05); }
.release-ticket em { margin: 4px -20px 0; padding: 17px 20px; background: var(--red); color: #fff; font-style: normal; font-size: 14px; font-weight: 900; text-transform: uppercase; }
.home-date-peek { position: relative; z-index: 8; display: grid; grid-template-columns: minmax(250px, 39vw) minmax(0, 1fr); min-height: 190px; border-top: 1px solid #050505; background: #050505; color: var(--paper); }
.home-date-peek h2 { margin: 0; padding: 42px clamp(22px, 4vw, 58px); background: var(--paper); color: #111; font-size: clamp(42px, 7.5vw, 112px); line-height: .82; text-transform: uppercase; }
.home-date-list { display: grid; align-content: center; padding: 22px clamp(20px, 4vw, 58px); }
.home-date-list a { display: grid; grid-template-columns: 118px minmax(0, 1fr) minmax(120px, .8fr) 24px; gap: 22px; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(244,236,220,.15); }
.home-date-list time, .home-date-list span { color: #cfc5b2; font-size: 14px; text-transform: uppercase; }
.home-date-list strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 17px; text-transform: uppercase; }
.home-date-list b { color: var(--yellow); font-size: 24px; line-height: 1; }
.home-records { background: var(--bg); }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.button { display: inline-flex; align-items: center; min-height: 44px; border: 2px solid var(--ink); border-radius: 4px; padding: 11px 15px; background: var(--ink); color: var(--paper); font-weight: 800; text-align: center; white-space: normal; }
.button:hover { background: var(--red); border-color: var(--red); color: #fff; }
.button.secondary { border-color: currentColor; background: transparent; color: inherit; }
.button.secondary:hover { color: #fff; border-color: #fff; }
.text-link { display: inline-flex; margin-top: 10px; color: var(--red); font-weight: 800; text-decoration: underline; text-underline-offset: 4px; }
.feature-release { background: var(--paper); }
.feature-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 420px); align-items: center; gap: clamp(28px, 6vw, 84px); }
.cover-feature { display: block; transform: rotate(1.5deg); box-shadow: var(--shadow); }
.cover-feature img { display: block; aspect-ratio: 1; object-fit: cover; border: 1px solid var(--ink); }
.album-strip, .album-grid, .video-grid, .contact-grid { display: grid; gap: 18px; }
.album-strip { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: 18px; }
.album-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.album-card { display: grid; gap: 8px; align-content: start; min-width: 0; }
.album-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; border: 1px solid var(--line); border-radius: 6px; background: #e5ddcf; transition: transform .18s ease, border-color .18s ease; }
.album-card:hover img { transform: translateY(-3px); border-color: var(--red); }
.album-card strong, .video-title { display: block; font-size: 17px; line-height: 1.2; }
.album-meta { color: var(--muted); font-size: 13px; font-weight: 700; text-transform: uppercase; }
.page-hero { background: var(--paper); }
.page-hero.compact { padding: 88px 0 56px; }
.split-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 470px); align-items: center; gap: clamp(28px, 6vw, 76px); }
.feature-image { display: block; width: 100%; border: 1px solid var(--ink); border-radius: 6px; box-shadow: var(--shadow); }
.dates { display: grid; gap: 0; }
.date-row { display: grid; grid-template-columns: 150px minmax(0, 1fr) minmax(180px, .7fr); gap: 22px; align-items: baseline; padding: 18px 0; border-top: 1px solid var(--line); }
.date-row time { color: var(--red); font-weight: 900; }
.date-row strong { display: block; font-size: 19px; }
.date-row > span, .date-note { color: var(--muted); }
.date-note { display: block; margin-top: 5px; font-size: 14px; }
.video-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.video-card { position: relative; display: grid; gap: 10px; padding: 0 0 14px; text-align: left; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; background: var(--paper); color: var(--ink); cursor: pointer; }
.video-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; background: #111; }
.video-card span:not(.play-dot) { margin: 0 14px; }
.play-dot { position: absolute; right: 12px; top: 12px; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--red); color: #fff; font-size: 16px; box-shadow: 0 6px 20px rgba(0,0,0,.22); }
.photo-grid { columns: 3 260px; column-gap: 18px; }
.photo-card { display: block; margin: 0 0 18px; break-inside: avoid; cursor: zoom-in; }
.photo-card img { display: block; width: 100%; border-radius: 6px; border: 1px solid var(--line); }
.contact-band { background: var(--ink); color: var(--paper); }
.contact-band .section-kicker, .contact-band a:hover { color: #f3d950; }
.contact-grid { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.contact-item { display: grid; gap: 8px; min-height: 112px; padding: 18px; border: 1px solid rgba(255,250,240,.22); border-radius: 6px; }
.contact-item span { color: #cfc7b8; font-size: 13px; font-weight: 800; text-transform: uppercase; }
.contact-item strong { overflow-wrap: anywhere; font-size: 18px; }
.pro-links { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 26px; color: #cfc7b8; }
.legal p { max-width: 760px; color: var(--muted); font-size: 20px; line-height: 1.5; }
.site-footer { border-top: 1px solid var(--line); padding: 26px 22px; color: var(--muted); }
.footer-inner { width: min(1180px, 100%); margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.social { display: flex; flex-wrap: wrap; gap: 14px; font-weight: 700; }
.modal { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 24px; background: rgba(0,0,0,.9); }
.modal[hidden] { display: none; }
.modal-content { position: relative; width: min(1080px, 100%); }
.modal-close { position: absolute; right: 0; top: -48px; width: 40px; height: 40px; border: 0; border-radius: 4px; background: #fff; color: #000; font-size: 26px; cursor: pointer; }
.modal img { max-height: 82vh; display: block; margin: 0 auto; border-radius: 6px; }
.modal iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; display: block; background: #000; }
@media (max-width: 980px) {
  .header-inner { align-items: flex-start; flex-direction: column; gap: 8px; }
  .logo img { max-width: 70vw; }
  .nav { justify-content: flex-start; gap: 2px 14px; font-size: 12px; }
  .poster-title-block { margin-left: clamp(126px, 24vw, 210px); width: min(100% - 28px, 760px); }
  .poster-title-block h1 { font-size: clamp(54px, 12.2vw, 108px); }
  .release-ticket { right: 24px; width: 230px; }
  .home-date-peek { grid-template-columns: 1fr; }
  .home-date-peek h2 { padding: 32px 22px 18px; }
  .home-date-list { padding: 0 22px 28px; }
}
@media (max-width: 860px) {
  .poster-paper { min-height: 660px; }
  .panel-red { width: 90px; min-width: 90px; }
  .panel-blue { left: 90px; width: 58px; min-width: 58px; }
  .poster-photo-left { width: 150px; height: 54%; }
  .poster-photo-main { left: 66px; bottom: 122px; width: 92vw; height: 34%; }
  .poster-photo-side, .scrap-yellow { opacity: .38; }
  .scrap-blue { right: 22px; top: 132px; width: 72px; height: 52px; }
  .poster-title-block { margin-left: 22px; padding-top: 182px; width: calc(100% - 36px); }
  .poster-title-block h1 { font-size: clamp(40px, 13.6vw, 72px); }
  .release-ticket { right: 16px; bottom: 0; width: 214px; min-width: 0; padding: 16px 16px 0; }
  .release-ticket strong { font-size: 22px; }
  .release-ticket em { margin-left: -16px; margin-right: -16px; padding: 14px 16px; }
  .poster-count { left: 20px; bottom: 145px; }
  .home-date-list a { grid-template-columns: 1fr 22px; gap: 8px 14px; }
  .home-date-list time, .home-date-list span { grid-column: 1; }
  .home-date-list b { grid-column: 2; grid-row: 1 / span 3; justify-self: end; }
  .eyebrow { line-height: 1.15; font-size: 12px; }
  .section { padding: 52px 0; }
  .feature-grid, .split-hero { grid-template-columns: 1fr; }
  .album-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .date-row { grid-template-columns: 1fr; gap: 6px; }
  .page-title { font-size: clamp(48px, 17vw, 92px); }
}
@media (max-width: 460px) {
  .wrap { width: min(100% - 30px, 1180px); }
  .poster-title-block .eyebrow { display: inline-block; max-width: 210px; padding: 3px 5px; background: rgba(244,236,220,.78); color: #11100e; }
  .poster-title-block h1 { width: 128%; font-size: clamp(42px, 14.2vw, 54px); transform: scaleX(.78) scaleY(1.12); }
  .release-ticket { width: 190px; }
  .release-ticket img { display: none; }
  .album-strip, .album-grid, .video-grid, .contact-grid { grid-template-columns: 1fr; }
  .button { width: 100%; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
`;

const js = `
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
`;

function writePage(file, html) {
  fs.writeFileSync(path.join(outDir, file), html);
  const route = routeMap[file];
  if (route && !route.endsWith(".html")) {
    const cleanDir = path.join(outDir, route);
    fs.mkdirSync(cleanDir, { recursive: true });
    const cleanHtml = html
      .replaceAll('href="./styles.css"', 'href="../styles.css"')
      .replaceAll('src="./site.js"', 'src="../site.js"')
      .replaceAll('href="./', 'href="../')
      .replaceAll('src="./assets/', 'src="../assets/')
      .replaceAll("url('./assets/", "url('../assets/");
    fs.writeFileSync(path.join(cleanDir, "index.html"), cleanHtml);
  }
}

for (const [file, html] of Object.entries(pages)) {
  writePage(file, html);
}

fs.writeFileSync(path.join(outDir, "styles.css"), css.trim() + "\n");
fs.writeFileSync(path.join(outDir, "site.js"), js.trim() + "\n");
fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${data.site.url}/sitemap.xml
`);
fs.writeFileSync(path.join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(pages).filter((file) => file !== "404.html").map((file) => `  <url><loc>${cleanUrl(file)}</loc></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(outDir, "site.webmanifest"), JSON.stringify({
  name: data.site.name,
  short_name: data.site.name,
  start_url: "/",
  display: "standalone",
  background_color: "#f4f0e6",
  theme_color: "#f4f0e6"
}, null, 2) + "\n");

console.log(`Built ${Object.keys(pages).length} pages in ${path.relative(root, outDir)}`);
