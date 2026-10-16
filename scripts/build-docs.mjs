// Generates the static documentation site in docs/ (GitHub Pages).
//
//   node scripts/build-docs.mjs
//
// Every page shares one template so titles, descriptions, canonical URLs, Open Graph,
// Twitter and JSON-LD tags stay complete and unique. The interactive parts (the world
// board, the departures board, search and the locale picker) are prerendered here with
// the same pure functions the browser runs (docs/board-model.js), so the pages are
// complete without JavaScript and Voodoo.js only takes over.
//
// Styling comes from Monsoon (https://kwy404.github.io/monsoon/) loaded from the CDN,
// plus the small docs/site.css. Code blocks are written raw and highlighted afterwards
// by scripts/highlight-docs.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { API } from "./api-content.mjs";
import { globe, icon, postcard, stamp } from "./art.mjs";
import { code, esc, GUIDES } from "./docs-content.mjs";
import { EXAMPLES, MODES, PASTES, PLACES, REGIONS, boardState, computePaste, departures, localeCard } from "../docs/board-model.js";

const SITE = "https://kwy404.github.io/numberparrot/";
const REPO = "https://github.com/kwy404/numberparrot";
const NPM = "https://www.npmjs.com/package/numberparrot";
const VERSION = JSON.parse(readFileSync("package.json", "utf8")).version;
const AUTHOR = {
  "@type": "Person",
  name: "Alexandre Kohler",
  url: "https://github.com/kwy404",
  sameAs: ["https://github.com/kwy404", "https://www.linkedin.com/in/alexandre-silva-173687256/"],
};
const PUBLISHED = "2026-10-12";
const MODIFIED = "2026-10-15";
const MONSOON_CSS = "https://cdn.jsdelivr.net/npm/monsooncss@0.2.0/dist/monsoon.min.css";
const VOODOO = "https://cdn.jsdelivr.net/npm/voodoojs@1.0.0/dist/voodoo.full.min.js";
const FONTS = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@500;600;700&display=swap";

const MORE = [
  ["Monsoon", "https://kwy404.github.io/monsoon/"],
  ["Voodoo.js", "https://kwy404.github.io/Voodoo.js/"],
  ["breakhound", "https://kwy404.github.io/breakhound/"],
  ["vueleap", "https://kwy404.github.io/vueleap/"],
  ["graphemely", "https://kwy404.github.io/graphemely/"],
  ["edgegoat", "https://kwy404.github.io/edgegoat/"],
  ["cookieowl", "https://kwy404.github.io/cookieowl/"],
  ["installkite", "https://kwy404.github.io/installkite/"],
  ["a11ymedic", "https://kwy404.github.io/a11ymedic/"],
  ["fontsketch", "https://kwy404.github.io/fontsketch/"],
  ["kastor", "https://kwy404.github.io/kastor/"],
];

// Per guide extras: route shown on its ticket, the stamp and the postcard art.
const ROUTES = {
  "parsefloat-comma-decimal-separator.html": { from: "1,5", to: "1.5", stamp: "eur", place: "BERLIN", icon: "detect" },
  "parse-localized-number-javascript.html": { from: "1 234,56", to: "1234.56", stamp: "chf", place: "ZÜRICH", icon: "globe" },
  "parse-currency-string-javascript.html": { from: "R$ 10,00", to: "10 BRL", stamp: "usd", place: "NEW YORK", icon: "coins" },
  "arabic-digits-to-number-javascript.html": { from: "١٢٣٫٤", to: "123.4", stamp: "egp", place: "CAIRO", icon: "digits" },
};

const API_PAGE = {
  file: "api.html",
  nav: "API reference",
  title: "API reference",
  description: "Every numberparrot function with its options, return values, error codes and examples.",
  summary: "Every function, option and error code.",
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const stripTags = (s) =>
  s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Adds ids to every h2, maps the content classes to Monsoon ones and returns the TOC. */
function prepareBody(html) {
  const toc = [];
  const seen = new Set();
  const out = html
    .replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
      let id = slug(inner) || "section";
      while (seen.has(id)) id += "-2";
      seen.add(id);
      toc.push({ id, text: stripTags(inner) });
      return `<h2 id="${id}">${inner}<a class="np-anchor" href="#${id}" aria-label="Link to this section">#</a></h2>`;
    })
    .replace(/<table>/g, '<table class="table table-zebra">')
    .replace(
      /<p class="callout warn">([\s\S]*?)<\/p>/g,
      `<div class="callout callout-warning"><p class="callout-title">${icon("parens", "np-icon")} Watch out</p><p>$1</p></div>`,
    )
    .replace(
      /<p class="callout">([\s\S]*?)<\/p>/g,
      `<div class="callout callout-primary"><p class="callout-title">${icon("compass", "np-icon")} Good to know</p><p>$1</p></div>`,
    )
    .replace(/class="good"/g, 'class="np-good"')
    .replace(/class="bad"/g, 'class="np-bad"');
  return { html: out, toc };
}

// Shared pieces -------------------------------------------------------------------------

const MANAGERS = [
  ["npm", "npm install numberparrot"],
  ["pnpm", "pnpm add numberparrot"],
  ["yarn", "yarn add numberparrot"],
  ["bun", "bun add numberparrot"],
];
let tabSet = 0;
/** Package manager tabs. Static HTML shows npm; Voodoo.js switches the panels. */
function installTabs() {
  tabSet++;
  const tabs = MANAGERS.map(
    ([name], i) =>
      `<button type="button" role="tab" class="np-pm" id="pm-${tabSet}-${name}" aria-controls="pm-${tabSet}-${name}-panel" aria-selected="${i === 0}" :aria-selected="pm === '${name}' ? 'true' : 'false'" @click="pm = '${name}'">${name}</button>`,
  ).join("");
  const panels = MANAGERS.map(
    ([name, command], i) =>
      `<div role="tabpanel" id="pm-${tabSet}-${name}-panel" aria-labelledby="pm-${tabSet}-${name}"${i === 0 ? "" : ' style="display:none"'} v-show="pm === '${name}'">
${code(command, "sh", "Terminal")}
</div>`,
  ).join("\n");
  return `<div class="np-install-tabs">
<div class="np-pms" role="tablist" aria-label="Package manager">${tabs}</div>
${panels}
</div>`;
}

function ticket(g, i, compact = false) {
  const r = ROUTES[g.file] || { from: "API", to: "docs", icon: "book" };
  return `<a class="np-ticket${compact ? " np-ticket-compact" : ""}" href="${g.file}" v-motion-scroll="fadeUp">
  <span class="np-ticket-stub" aria-hidden="true">
    <span class="np-ticket-gate">Gate</span>
    <span class="np-ticket-no">${String(i + 1).padStart(2, "0")}</span>
    ${icon(r.icon, "np-icon")}
  </span>
  <span class="np-ticket-main">
    <span class="np-ticket-route" aria-hidden="true"><span dir="auto">${esc(r.from)}</span>${icon("plane", "np-icon np-ticket-plane")}<span>${esc(r.to)}</span></span>
    <strong class="np-ticket-title">${esc(g.title)}</strong>
    ${compact ? "" : `<span class="np-ticket-text">${esc(g.summary)}</span>`}
  </span>
</a>`;
}

const TICKETS = [...GUIDES, API_PAGE];
const ticketGrid = (exclude, compact = false) =>
  `<div class="np-tickets" v-motion-stagger="60">
${TICKETS.filter((g) => g.file !== exclude)
  .map((g) => ticket(g, TICKETS.indexOf(g), compact))
  .join("\n")}
</div>`;

function themeButton() {
  return `<button type="button" class="np-icon-btn np-theme" v-theme-toggle.cycle aria-label="Color theme: follow the system, light or dark" title="Color theme">${icon("monitor", "np-icon np-t-system")}${icon("sun", "np-icon np-t-light")}${icon("moon", "np-icon np-t-dark")}</button>`;
}

const NAV = [
  ["./#try", "Try it"],
  ["./#board", "World board"],
  ["./#departures", "Departures"],
  ["./#use-cases", "Use cases"],
  ["api.html", "API"],
  ["./#guides", "Guides"],
];

function header(file) {
  const isGuide = GUIDES.some((g) => g.file === file);
  const current = (href) => ((file === "api.html" && href === "api.html") || (isGuide && href === "./#guides") ? ' aria-current="page"' : "");
  const links = NAV.map(([href, label]) => `<a class="np-nav-link" href="${href}"${current(href)}>${label}</a>`).join("");
  return `<header class="np-top">
  <div class="container np-top-row">
    <a class="np-brand" href="./" aria-label="numberparrot home"><img src="favicon.svg" width="30" height="30" alt=""><span>number<b>parrot</b></span></a>
    <a class="badge badge-sm badge-outline np-ver" href="${REPO}/blob/main/CHANGELOG.md" aria-label="Version ${VERSION}, read the changelog">v${VERSION}</a>
    <nav class="np-nav" aria-label="Main">${links}</nav>
    <div class="np-top-end">
      <button type="button" class="np-search-btn" @click="openSearch()" aria-label="Search the docs" aria-haspopup="dialog">${icon("search", "np-icon")}<span>Search</span><kbd class="kbd kbd-xs">Ctrl K</kbd></button>
      <a class="np-icon-btn np-hide-sm" href="${REPO}" aria-label="numberparrot on GitHub">${icon("github", "np-icon")}</a>
      ${themeButton()}
      <button type="button" class="np-icon-btn np-menu-btn" aria-controls="np-menu" aria-expanded="false" :aria-expanded="menu ? 'true' : 'false'" @click="menu = !menu" aria-label="Menu">${icon("menu", "np-icon")}</button>
    </div>
  </div>
  <nav id="np-menu" class="np-mobile" aria-label="Mobile" style="display:none" v-show="menu" @click="menu = false">
    <div class="container">${links}<a class="np-nav-link" href="${REPO}">GitHub</a><a class="np-nav-link" href="${NPM}">npm</a></div>
  </nav>
</header>`;
}

function footer() {
  const stamps = ["brl", "eur", "inr", "jpy", "chf", "gbp", "egp", "usd", "krw", "try"]
    .map((k, i) => stamp(k, undefined, { id: `fs${i}`, size: 74 }))
    .join("");
  return `<footer class="np-foot">
  <div class="np-foot-stamps" aria-hidden="true"><div class="container">${stamps}</div></div>
  <div class="container np-foot-grid">
    <div class="np-foot-brand">
      <a class="np-brand" href="./"><img src="img/mascot.svg" width="56" height="56" alt="Pico, the numberparrot mascot"><span>number<b>parrot</b></span></a>
      <p>Pico repeats every number back the way it was meant, in every locale your runtime knows. MIT licensed, zero dependencies.</p>
      <div class="np-foot-social">
        <a class="np-icon-btn" href="${REPO}" aria-label="Source on GitHub">${icon("github", "np-icon")}</a>
        <a class="np-icon-btn" href="${NPM}" aria-label="numberparrot on npm">${icon("npm", "np-icon")}</a>
        <a class="np-icon-btn" href="${REPO}/blob/main/CHANGELOG.md" aria-label="Changelog">${icon("book", "np-icon")}</a>
      </div>
    </div>
    <nav aria-labelledby="ft-site"><p class="np-foot-title" id="ft-site">On this site</p><ul>
      <li><a href="./#try">Paste and see</a></li><li><a href="./#board">World board</a></li><li><a href="./#departures">Departures</a></li><li><a href="./#use-cases">Use cases</a></li><li><a href="api.html">API reference</a></li><li><a href="./#faq">FAQ</a></li><li><a href="${REPO}/issues">Report an issue</a></li>
    </ul></nav>
    <nav aria-labelledby="ft-guides"><p class="np-foot-title" id="ft-guides">Guides</p><ul>
      ${GUIDES.map((g) => `<li><a href="${g.file}">${esc(g.nav)}</a></li>`).join("")}
    </ul></nav>
    <nav aria-labelledby="ft-more"><p class="np-foot-title" id="ft-more">More from kwy404</p><ul>
      ${MORE.map(([name, url]) => `<li><a href="${url}">${name}</a></li>`).join("")}
    </ul></nav>
  </div>
  <div class="container"><div class="np-foot-bottom">
    <p>Made by <strong>Alexandre Kohler</strong> <a class="np-foot-me" href="https://github.com/kwy404" rel="me noopener" aria-label="Alexandre Kohler on GitHub">${icon("github", "np-icon")}GitHub</a> <a class="np-foot-me" href="https://www.linkedin.com/in/alexandre-silva-173687256/" rel="me noopener" aria-label="Alexandre Kohler on LinkedIn">${icon("linkedin", "np-icon")}LinkedIn</a></p>
    <p><a href="https://kwy404.github.io/monsoon/">Built with Monsoon</a><span aria-hidden="true">/</span><a href="https://kwy404.github.io/Voodoo.js/">Interactive parts built with Voodoo.js</a></p>
  </div></div>
</footer>`;
}

function searchDialog() {
  return `<dialog id="np-search" class="modal modal-top np-search-dialog" aria-label="Search the docs">
  <div class="command-palette">
    <label class="command-palette-search"><span class="sr-only">Search the docs</span>
      <input class="command-palette-input" type="search" placeholder="Search guides, functions and locales" autocomplete="off" spellcheck="false" v-model="q" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="go()" @keydown.esc.prevent="closeSearch()">
    </label>
    <div class="command-palette-list" role="listbox" aria-label="Results">
      <a class="command-palette-item" role="option" v-for="(hit, i) in hits" :key="hit.url" :href="hit.url" :aria-selected="i === sel ? 'true' : 'false'" @mouseenter="sel = i" @click="closeSearch()"><span class="np-hit-kind" v-text="hit.kind"></span><span class="np-hit-title" v-text="hit.title"></span><span class="np-hit-text" v-text="hit.text"></span></a>
      <p class="command-palette-empty" v-show="!hits.length">No match. Try parse, currency, Arabic or pt-BR.</p>
    </div>
    <div class="command-palette-footer"><span><kbd class="kbd kbd-xs">Enter</kbd> open</span><span><kbd class="kbd kbd-xs">Up</kbd> <kbd class="kbd kbd-xs">Down</kbd> move</span><span><kbd class="kbd kbd-xs">Esc</kbd> close</span></div>
  </div>
  <form method="dialog" class="modal-backdrop"><button aria-label="Close search">Close</button></form>
</dialog>`;
}

function layout({ file, title, description, body, jsonld, ogType }) {
  const url = file === "index.html" ? SITE : SITE + file;
  const fullTitle = file === "index.html" ? title : `${title} | numberparrot`;
  const alt = "numberparrot: parse localized numbers and currency strings in JavaScript, with Pico the parrot";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <script>(function(){try{var t=localStorage.getItem("voodoo:theme");if(t&&t.charAt(0)==='"')t=JSON.parse(t);var r=document.documentElement;if(t==="light"||t==="dark"){r.setAttribute("data-theme",t);r.style.colorScheme=t}}catch(e){}})();</script>
  <script src="seasons.js"></script>
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="author" content="Alexandre Kohler">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#F7FBF6" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0E1A14" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="numberparrot">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${alt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}og.png">
  <meta name="twitter:image:alt" content="${alt}">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="${MONSOON_CSS}">
  <link rel="stylesheet" href="site.css">
  <script src="${VOODOO}" data-manual defer></script>
  <script type="module" src="app.js"></script>
</head>
<body class="bg-background text-foreground antialiased">
  <a class="skip-link" href="#main">Skip to content</a>
  ${header(file)}
  ${body}
  ${footer()}
  ${searchDialog()}
</body>
</html>
`;
}

// Docs pages: the two column reference layout ------------------------------------------

function localeOptions(selected) {
  return REGIONS.map(
    (r) =>
      `<optgroup label="${esc(r.name)}">${r.places
        .map(([loc, , city]) => `<option value="${loc}"${loc === selected ? " selected" : ""}>${loc} ${esc(city)}</option>`)
        .join("")}</optgroup>`,
  ).join("");
}

function rail(toc) {
  const c = localeCard("pt-BR", "1.234,56");
  const row = (label, key) => `<div><dt>${label}</dt><dd dir="auto" v-text="card.${key}">${esc(c[key])}</dd></div>`;
  return `<aside aria-label="Search, locale picker and contents">
  <div class="np-rail-inner">
    <div class="np-rail-search" @keydown.esc="rq = ''">
      <label class="search-field">
        <span class="sr-only">Search the docs</span>
        <input type="search" class="input input-sm" placeholder="Search the docs" autocomplete="off" spellcheck="false" v-model="rq" @keydown.enter.prevent="goRail()">
        <kbd class="search-field-shortcut">/</kbd>
      </label>
      <ul class="np-rail-hits" v-show="rq" style="display:none" aria-label="Search results">
        <li v-for="hit in rhits" :key="hit.url"><a :href="hit.url"><span class="np-hit-kind" v-text="hit.kind"></span><span v-text="hit.title"></span></a></li>
        <li class="np-rail-empty" v-show="!rhits.length">No match.</li>
      </ul>
    </div>
    <details class="np-loc" id="np-loc" open>
      <summary>${icon("pin", "np-icon")}<span>Locale picker</span><span class="np-loc-tag" v-text="card.locale">${c.locale}</span></summary>
      <div class="np-loc-body">
        <label class="sr-only" for="np-loc-select">Locale</label>
        <select id="np-loc-select" class="select select-sm" v-model="loc">${localeOptions("pt-BR")}</select>
        <p class="np-loc-city" v-text="card.title">${esc(c.title)}</p>
        <dl class="np-loc-dl">
          ${row("Decimal", "decimal")}
          ${row("Group", "group")}
          ${row("Minus", "minus")}
          ${row("Digits", "digits")}
          ${row("Writes", "sample")}
          ${row("Money", "money")}
        </dl>
        <label class="np-loc-try" for="np-loc-try">Try a number in <span v-text="card.locale">${c.locale}</span></label>
        <input id="np-loc-try" class="input input-sm" v-model="trial" autocomplete="off" spellcheck="false" value="1.234,56">
        <p class="np-loc-out" data-ok="true" :data-ok="card.ok ? 'true' : 'false'"><code>parse()</code><output v-text="card.result">${esc(c.result)}</output></p>
      </div>
    </details>
    ${
      toc.length
        ? `<nav class="np-toc" aria-labelledby="np-toc-title"><p class="toc-title" id="np-toc-title">On this page</p><ul class="toc">${toc
            .map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`)
            .join("")}</ul></nav>`
        : ""
    }
  </div>
</aside>`;
}

function docPage({ file, h1, lead, kicker, art, content, toc, minutes }) {
  const crumb = file === "api.html" ? "API" : `${ROUTES[file].from} to ${ROUTES[file].to}`;
  return `<main id="main" class="container np-doc">
${rail(toc)}
<article class="np-article">
  <nav aria-label="Breadcrumb"><ol class="breadcrumbs"><li><a href="./">numberparrot</a></li><li><a href="${kicker === "Reference" ? "api.html" : "./#guides"}">${kicker === "Reference" ? "Reference" : "Guides"}</a></li><li><span aria-current="page" dir="auto">${esc(crumb)}</span></li></ol></nav>
  <header class="np-doc-head">
    <div>
      <p class="np-eyebrow">${icon(kicker === "Reference" ? "book" : "postcard", "np-icon")}${kicker}</p>
      <h1>${esc(h1)}</h1>
      <p class="np-lead">${lead}</p>
      <p class="np-meta"><span>${icon("clock", "np-icon")}${minutes} min read</span><span>${icon("check", "np-icon")}Updated <time datetime="${MODIFIED}">October 15, 2026</time></span><span>${icon("code", "np-icon")}numberparrot ${VERSION}</span></p>
    </div>
    <div class="np-doc-art" aria-hidden="true">${art}</div>
  </header>
  <div class="prose np-prose">
${content}
  </div>
</article>
</main>`;
}

const minutesOf = (html) => Math.max(2, Math.round(stripTags(html).split(/\s+/).length / 200));

for (const guide of GUIDES) {
  const route = ROUTES[guide.file];
  const raw = guide.body();
  const leadMatch = raw.match(/<p class="lead">([\s\S]*?)<\/p>/);
  const lead = leadMatch ? leadMatch[1] : esc(guide.description);
  const rest = leadMatch ? raw.replace(leadMatch[0], "") : raw;
  const install = `
<h2>Install</h2>
${installTabs()}
<p>Zero dependencies, ESM and CommonJS, TypeScript types included. Works in Node.js 18+, Deno, Bun and browsers. <a href="./#try">Paste your own numbers on the home page</a> or read the <a href="api.html">API reference</a>.</p>
<h2>More guides</h2>
${ticketGrid(guide.file, true)}`;
  const { html, toc } = prepareBody(rest + install);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: guide.title,
        description: guide.description,
        url: SITE + guide.file,
        image: SITE + "og.png",
        datePublished: PUBLISHED,
        dateModified: MODIFIED,
        inLanguage: "en",
        author: AUTHOR,
        publisher: AUTHOR,
        mainEntityOfPage: SITE + guide.file,
        about: { "@type": "SoftwareSourceCode", name: "numberparrot", codeRepository: REPO, programmingLanguage: "TypeScript" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "numberparrot", item: SITE },
          { "@type": "ListItem", position: 2, name: guide.title, item: SITE + guide.file },
        ],
      },
    ],
  };
  const body = docPage({
    file: guide.file,
    title: guide.title,
    h1: guide.title,
    lead,
    kicker: "Guide",
    art: postcard(undefined, { number: route.from, place: route.place, stampKey: route.stamp, id: "pc", width: 300 }),
    content: html,
    toc,
    minutes: minutesOf(html),
  });
  writeFileSync(`docs/${guide.file}`, layout({ ...guide, body, jsonld, ogType: "article" }));
  console.log(`wrote docs/${guide.file}`);
}

// API reference page ----------------------------------------------------------------------
{
  const sections = API.map(
    (fn) => `
<h2>${esc(fn.name)}</h2>
<p class="np-sig"><code>${esc(fn.signature)}</code></p>
${fn.body()}
${code(fn.example, "ts", `${fn.name}.ts`)}`,
  ).join("\n");
  const localeRows = PLACES.map((p) => {
    const c = localeCard(p.locale, "");
    const sym = (x) => ([...x].length === 1 ? `<code>${esc(x)}</code>` : esc(x));
    return `<tr><td><code>${p.locale}</code></td><td>${esc(p.city)}</td><td dir="auto"><code>${esc(c.sample)}</code></td><td>${sym(c.decimal)}</td><td>${sym(c.group)}</td><td>${esc(c.system)}</td></tr>`;
  }).join("\n");
  const content = `
<p>All functions take an optional <code>locale</code>: a BCP 47 tag (<code>"pt-BR"</code>), a list of tags, or nothing for the runtime default. Locale data is read from <code>Intl.NumberFormat#formatToParts()</code> once and cached. Pick a locale in the panel next to this page to see what it uses.</p>
${code(`import {
  parse,
  tryParse,
  parseCurrency,
  detect,
  parseColumn,
  isValid,
  createParser,
  normalizeInput,
  getLocaleInfo,
  NumberParseError,
} from "numberparrot";`, "ts", "imports.ts")}
${sections}
<h2>Locales on the world board</h2>
<p>Every locale your runtime's <code>Intl</code> supports works, because nothing is hard coded. These are the 39 on the world board, as Node.js wrote them when this page was generated. The test suite covers 17 of them with hand written input and a round trip over more than 80 values.</p>
<div class="table-wrap"><table>
<thead><tr><th>Locale</th><th>City</th><th>1234567.89</th><th>Decimal</th><th>Group</th><th>Digits</th></tr></thead>
<tbody>
${localeRows}
</tbody></table></div>
<h2>Runtime support</h2>
<ul>
<li>Node.js 18 and newer, Deno, Bun and all modern browsers. Requires <code>Intl.NumberFormat</code> with <code>formatToParts</code> and full ICU locale data, which Node ships by default since version 13.</li>
<li>The whole library is about 7 kB gzipped. Importing only <code>parse</code> costs about 3.6 kB.</li>
<li>ESM (<code>dist/index.js</code>), CommonJS (<code>dist/index.cjs</code>) and type definitions for both.</li>
</ul>
<h2>Install</h2>
${installTabs()}
<h2>Guides</h2>
${ticketGrid("api.html", true)}`;
  const { html, toc } = prepareBody(content);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: API_PAGE.title,
        description: API_PAGE.description,
        url: SITE + API_PAGE.file,
        image: SITE + "og.png",
        datePublished: MODIFIED,
        dateModified: MODIFIED,
        inLanguage: "en",
        author: AUTHOR,
        publisher: AUTHOR,
        mainEntityOfPage: SITE + API_PAGE.file,
        about: { "@type": "SoftwareSourceCode", name: "numberparrot", codeRepository: REPO, programmingLanguage: "TypeScript" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "numberparrot", item: SITE },
          { "@type": "ListItem", position: 2, name: "API reference", item: SITE + API_PAGE.file },
        ],
      },
    ],
  };
  const body = docPage({
    file: API_PAGE.file,
    title: API_PAGE.title,
    h1: "API reference",
    lead: "Nine functions and one error class. Every one takes the locale as an argument, so data from Berlin, Mumbai and Cairo can sit side by side.",
    kicker: "Reference",
    art: `<div class="np-stamp-pile">${stamp("eur", undefined, { id: "api-s1", size: 128 })}${stamp("inr", undefined, { id: "api-s2", size: 112 })}${stamp("brl", undefined, { id: "api-s3", size: 104 })}</div>`,
    content: html,
    toc,
    minutes: minutesOf(html),
  });
  writeFileSync("docs/api.html", layout({ ...API_PAGE, body, jsonld, ogType: "article" }));
  console.log("wrote docs/api.html");
}

// Home page --------------------------------------------------------------------------------
const B = boardState();
const tileHtml = (place, i) => {
  const t = B.b.tiles[i];
  return `<li class="np-tile" data-a="${t.as}" data-b="${t.bs}" :data-a="B.b.tiles[${i}].as" :data-b="B.b.tiles[${i}].bs">
  <div class="np-tile-head"><span class="np-tile-code">${place.locale}</span><span class="np-tile-iata">${place.iata}</span></div>
  <p class="np-tile-city">${esc(place.city)}</p>
  <p class="np-tile-val" dir="auto" v-text="B.b.tiles[${i}].s">${esc(t.s)}</p>
  <p class="np-tile-row np-tile-a"><span class="np-tile-label" v-text="B.b.labels.a">${MODES.number.a}</span><span class="np-tile-out" dir="auto" v-text="B.b.tiles[${i}].a">${esc(t.a)}</span></p>
  <p class="np-tile-row np-tile-b"><span class="np-tile-label" v-text="B.b.labels.b">${MODES.number.b}</span><span class="np-tile-out" dir="auto" v-text="B.b.tiles[${i}].b">${esc(t.b)}</span></p>
</li>`;
};
let tileIndex = 0;
const regionsHtml = REGIONS.map((r) => {
  const tiles = r.places.map(() => {
    const i = tileIndex++;
    return tileHtml(PLACES[i], i);
  });
  return `<section class="np-region" aria-labelledby="rg-${r.id}">
  <header class="np-region-head">${icon("globe", "np-icon")}<h3 id="rg-${r.id}">${esc(r.name)}</h3><span>${r.places.length} locales</span></header>
  <ol class="np-tiles" aria-label="${esc(r.name)}">
${tiles.join("\n")}
  </ol>
</section>`;
}).join("\n");

const modeRadio = (m, label, ic) =>
  `<label class="segmented-item"><input type="radio" name="np-mode" value="${m}"${m === "number" ? " checked" : ""} @change="setMode('${m}')">${icon(ic, "np-icon")}${label}</label>`;
const exampleChips = Object.entries(EXAMPLES)
  .map(
    ([m, list]) =>
      `<div class="np-examples" ${m === "number" ? "" : 'style="display:none" '}v-show="B.mode === '${m}'" role="group" aria-label="Examples"><span class="np-examples-label">Try</span>${list
        .map((x) => `<button type="button" class="np-chip" dir="ltr" @click="B.text = '${x.replace(/'/g, "\\'")}'">${esc(x)}</button>`)
        .join("")}</div>`,
  )
  .join("");

const D = departures();
const COLS = [
  ["time", "Time", 5],
  ["flight", "Flight", 7],
  ["from", "From", 12],
  ["written", "As written", 13],
  ["pf", "parseFloat", 9],
  ["np", "numberparrot", 10],
  ["status", "Status", 9],
];
const flap = (text, width) => {
  const chars = [...String(text)].slice(0, width);
  while (chars.length < width) chars.push(" ");
  return chars.map((ch) => `<span class="np-ch">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
};
const flapRows = D.slice(0, 6)
  .map(
    (row) =>
      `<div class="np-flap-row" role="row" data-status="${row.status.toLowerCase().replace(" ", "-")}">${COLS.map(
        ([key, , w]) =>
          `<span class="np-flap np-col-${key}" role="cell" data-w="${w}" aria-label="${esc(row[key])}"><span class="np-chars" aria-hidden="true">${flap(row[key], w)}</span></span>`,
      ).join("")}</div>`,
  )
  .join("\n");

const USES = [
  ["brl", "From São Paulo", "Checkout and price fields", "A shopper types 1.234,56 into your price field. normalizeInput keeps partial input valid while they type and hands you the number on blur.", `normalizeInput("1.234,", "pt-BR").value;
// 1234`, "checkout.ts"],
  ["eur", "From Berlin", "CSV and bank exports", "A bank export has 1.234,56 in one column and 1,5 in the next. createParser reads every row in one pass, and detect() takes files with no locale.", `createParser("de-DE").parse("1.234,56");
// 1234.56`, "import.ts"],
  ["jpy", "From Tokyo", "Scraped and pasted prices", "Prices arrive with symbols and codes on either side. parseCurrency returns the amount and the ISO code, so you know what you are adding up.", `parseCurrency("￥1,235", "ja-JP").currency;
// "JPY"`, "prices.ts"],
  ["gbp", "From London", "Accounting reports", "Negatives in parentheses, a trailing minus or the Unicode minus sign all read as negative, the way an accountant meant them.", `parse("(1,234.56)", "en-GB");
// -1234.56`, "ledger.ts"],
  ["inr", "From Mumbai", "Money in integer cents", "toMinorUnits shifts the decimal digits as text, so 0,29 is 29 cents and never 28.999999999999996. Lakh and crore grouping included.", `parseCurrency("₹19.99", "en-IN", {
  toMinorUnits: true,
}).amount;
// 1999`, "cents.ts"],
  ["egp", "From Cairo", "Every script", "Arabic-Indic, Persian, Devanagari, Bengali, Thai and full width digits read like Latin ones, with their own separators.", `parse("١٬٢٣٤٫٥٦", "ar-EG");
// 1234.56`, "digits.ts"],
];
const usesHtml = USES.map(
  ([st, from, title, text, snippet, file], i) => `<article class="np-postcard" v-motion-scroll="fadeUp">
  <div class="np-postcard-text">
    <p class="np-postcard-from">${icon("pin", "np-icon")}${from}</p>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
  </div>
  <div class="np-postcard-back" aria-hidden="true">
    ${stamp(st, undefined, { id: `uc${i}`, size: 88 })}
    <span class="np-postcard-lines"><i></i><i></i><i></i></span>
  </div>
  <div class="np-postcard-code">${code(snippet, "ts", file).replace("<pre ", '<pre data-mini="1" ')}</div>
</article>`,
).join("\n");

const apiList = API.map(
  (fn, i) =>
    `<button type="button" class="np-api-item" role="tab" id="api-tab-${fn.id}" aria-controls="api-panel-${fn.id}" aria-selected="${i === 0}" :aria-selected="api === '${fn.id}' ? 'true' : 'false'" @click="api = '${fn.id}'"><code>${esc(fn.name)}</code><span>${esc(fn.summary)}</span></button>`,
).join("\n");
const apiPanels = API.map(
  (fn, i) =>
    `<div role="tabpanel" id="api-panel-${fn.id}" aria-labelledby="api-tab-${fn.id}"${i === 0 ? "" : ' style="display:none"'} v-show="api === '${fn.id}'">
<p class="np-sig"><code>${esc(fn.signature)}</code></p>
${code(fn.example, "ts", `${fn.name}.ts`)}
<p class="np-api-more"><a class="link link-primary" href="api.html#${slug(fn.name)}">${esc(fn.name)} in the API reference</a></p>
</div>`,
).join("\n");

const FAQ = [
  [
    "Why not swap the comma for a dot?",
    'Because the meaning of <code>.</code> and <code>,</code> depends on who wrote the number. Swapping fixes <code>"1,5"</code> and breaks <code>"1.234,56"</code> and <code>"1,234"</code>. <code>parse(text, locale)</code> reads the separators of that locale from <code>Intl.NumberFormat</code> instead.',
  ],
  [
    "What does parseFloat do with 1.234,56?",
    'It reads characters while they look like an English number and stops at the first one that does not, so <code>parseFloat("1.234,56")</code> is <code>1.234</code>. A wrong number passes every <code>isNaN</code> check, which makes it worse than an error.',
  ],
  [
    "How do I get the currency of a price?",
    '<code>parseCurrency("R$ 1.234,56", "pt-BR")</code> returns the amount <code>1234.56</code> and the code <code>"BRL"</code>. Add <code>toMinorUnits: true</code> to get exact integer cents.',
  ],
  [
    "What if I do not know the locale?",
    'Paste it in the box at the top of this page. For one value, <code>detect(text)</code> works out the decimal separator and says when it cannot be sure. For a column, <code>parseColumn(values)</code> lets the clear cells decide for the unclear ones.',
  ],
  [
    "Where does it run?",
    "Node.js 18 and newer, Deno, Bun and modern browsers. It has zero dependencies, ships ESM, CommonJS and TypeScript types, and is about 7 kB gzipped.",
  ],
];

// Paste and see: the first thing on the home page --------------------------------------------
const P0 = computePaste(PASTES[0].text);
function pasteRow(c, attrs = "") {
  return `<li class="np-paste-row" data-ok="${c.ok}" data-pf="${c.pfWrong ? "bad" : "ok"}"${attrs}>
          <code class="np-paste-raw" dir="ltr" v-text="c.raw">${esc(c.raw)}</code>
          <code class="np-paste-pf" v-text="c.pf">${esc(c.pf)}</code>
          <span class="np-paste-np"><code v-text="c.np">${esc(c.np)}</code><span class="np-paste-cur" v-show="c.currency" v-text="c.currency"${c.currency ? "" : ' style="display:none"'}>${esc(c.currency)}</span></span>
          <span class="np-paste-note" v-show="c.note" v-text="c.note"${c.note ? "" : ' style="display:none"'}>${esc(c.note)}</span>
        </li>`;
}
function pasteBox() {
  const [first, ...rest] = P0.cells;
  const samples = PASTES.map(
    (p, i) => `<button type="button" class="np-chip" @click="sample(${i})">${esc(p.label)}</button>`,
  ).join("");
  return `      <div class="np-paste" data-state="sure" :data-state="P.r.empty ? 'empty' : (P.r.ambiguous || P.r.confidence < 60 ? 'unsure' : 'sure')" v-effect="P.r = computePaste(P.text)" v-motion="{ opacity: [0, 1], y: [24, 0], delay: 160, duration: 600, easing: 'easeOutExpo' }">
        <div class="np-perch" aria-hidden="true">
          <p class="np-perch-bubble" v-text="P.r.empty ? 'Paste away!' : (P.r.wrong ? 'parseFloat missed ' + P.r.wrong : 'All read!')">parseFloat missed ${P0.wrong}</p>
          <span class="np-pico" data-pico><img class="np-pico-base" src="img/mascot.svg" width="96" height="96" alt=""></span>
        </div>
        <div class="np-paste-top">
          <label class="np-paste-label" for="np-paste-text">${icon("input", "np-icon")}Paste and see</label>
          <span class="np-paste-count" v-text="P.r.count ? P.r.read + ' of ' + P.r.count + ' read' : ''">${P0.read} of ${P0.count} read</span>
        </div>
        <textarea id="np-paste-text" class="np-paste-field" rows="5" placeholder="Paste here, for example 1.234,56" spellcheck="false" autocomplete="off" aria-describedby="np-paste-head" v-model="P.text">${esc(PASTES[0].text)}</textarea>
        <div class="np-examples np-paste-samples" role="group" aria-label="Samples"><span class="np-examples-label">Try</span>${samples}</div>
        <div class="np-paste-verdict">
          <p class="np-paste-head" id="np-paste-head" role="status" v-text="P.r.headline">${esc(P0.headline)}</p>
          <p class="np-paste-reason" v-text="P.r.reason">${esc(P0.reason)}</p>
          <div class="np-confidence" v-show="!P.r.empty"><span>Confidence</span><span class="np-meter"><i style="width:${P0.confidence}%" :style="{ width: P.r.confidence + '%' }"></i></span><strong v-text="P.r.confidence + '%'">${P0.confidence}%</strong></div>
        </div>
        <div class="np-paste-table" v-show="!P.r.empty">
          <div class="np-paste-thead" aria-hidden="true"><span>You pasted</span><span>parseFloat</span><span>numberparrot</span></div>
          <ol class="np-paste-rows" aria-label="Values read" v-motion-stagger="45">
        ${pasteRow(first, ` v-for="c in P.r.cells" :key="c.key" :data-ok="c.ok ? 'true' : 'false'" :data-pf="c.pfWrong ? 'bad' : 'ok'" v-motion="fadeUp"`)}
        ${rest.map((c) => pasteRow(c, " data-prerender")).join("\n        ")}
          </ol>
          <p class="np-paste-more" v-show="P.r.more" style="display:none" v-text="'and ' + P.r.more + ' more'"></p>
          <div class="np-paste-foot">
            <span class="np-paste-wrong"><strong v-text="P.r.wrong">${P0.wrong}</strong> wrong with parseFloat</span>
            <span class="np-paste-sum" v-show="P.r.total">Sum <code v-text="P.r.total">${esc(P0.total)}</code></span>
            <button type="button" class="btn btn-xs btn-outline btn-neutral" @click="copyText(P.r.json, 'json')">${icon("copy", "np-icon")}<span v-text="copied === 'json' ? 'Copied' : 'Copy as JSON'">Copy as JSON</span></button>
          </div>
        </div>
      </div>`;
}

const indexBody = `<main id="main">
<section id="try" class="np-hero" aria-labelledby="title">
  <div class="container">
    <div class="np-hero-grid">
      <div class="np-hero-copy" v-motion-stagger="70">
        <p class="np-eyebrow" v-motion="fadeUp">${icon("input", "np-icon")}Paste a number, see it read right</p>
        <h1 id="title" v-motion="fadeUp">Read numbers written in any locale</h1>
        <p class="np-lead" v-motion="fadeUp"><code>parseFloat("1.234,56")</code> returns <code class="np-bad">1.234</code>. numberparrot returns <code class="np-good">1234.56</code>. Paste a price, a bank export or a spreadsheet column in the box: it works out the format and reads every value.</p>
        <div class="np-hero-actions" v-motion="fadeUp">
          <button type="button" class="np-install" @click="copyText('npm i numberparrot', 'hero')" aria-label="Copy the install command: npm i numberparrot"><span class="np-install-prompt" aria-hidden="true">$</span><span>npm i numberparrot</span>${icon("copy", "np-icon")}<span class="np-install-state" v-text="copied === 'hero' ? 'Copied' : 'Copy'">Copy</span></button>
          <a class="btn btn-primary" href="api.html">${icon("book", "np-icon")}API reference</a>
          <a class="btn btn-outline btn-neutral" href="${REPO}">${icon("github", "np-icon")}GitHub</a>
        </div>
        <ul class="np-hero-facts" v-motion="fadeUp" aria-label="At a glance">
          <li>${icon("check", "np-icon")}Zero dependencies</li>
          <li>${icon("check", "np-icon")}About 7 kB gzipped</li>
          <li>${icon("check", "np-icon")}Every locale your runtime knows</li>
        </ul>
      </div>
${pasteBox()}
    </div>
  </div>
</section>

<section id="board" class="np-board-section" aria-labelledby="board-title">
  <div class="container">
    <div class="np-board-head">
      <div class="np-section-head" v-motion-scroll="fadeUp">
        <p class="np-eyebrow">${icon("globe", "np-icon")}World board</p>
        <h2 id="board-title">One number, ${PLACES.length} locales</h2>
        <p>Type one number. Every locale writes it its own way, and numberparrot reads every one back.</p>
      </div>
      <div class="np-board-art" aria-hidden="true">
        ${globe(undefined, { id: "hero-globe", size: 220 })}
        <p class="np-bubble" v-text="B.b.bubble">${esc(B.b.bubble)}</p>
      </div>
    </div>
    <div class="np-board" data-mode="number" :data-mode="B.mode" v-effect="B.b = computeBoard(B.text, B.mode)">
      <div class="np-board-bar">
        <div>
          <label class="np-board-label" for="np-board-text" v-text="B.mode === 'detect' ? 'Paste a number as you found it' : (B.mode === 'currency' ? 'Type an amount' : 'Type a number')">Type a number</label>
          <input id="np-board-text" class="np-board-field" value="${esc(B.text)}" v-model="B.text" autocomplete="off" spellcheck="false" aria-describedby="np-board-hint">
          ${exampleChips}
        </div>
        <div class="np-board-side">
          <div class="segmented segmented-sm np-modes" role="radiogroup" aria-label="Board mode">${modeRadio("number", "Number", "globe")}${modeRadio("currency", "Currency", "coins")}${modeRadio("detect", "Detect", "detect")}</div>
          <div class="np-score">
            <p class="np-score-item np-score-bad"><strong v-text="B.b.wrong">${B.b.wrong}</strong><span v-text="B.mode === 'detect' ? 'read it another way' : 'wrong with parseFloat'">wrong with parseFloat</span></p>
            <p class="np-score-item np-score-good"><strong v-text="B.b.right">${B.b.right}</strong><span v-text="B.mode === 'detect' ? 'agree with detect()' : (B.mode === 'currency' ? 'right with parseCurrency' : 'right with numberparrot')">right with numberparrot</span></p>
          </div>
        </div>
      </div>
      <p class="np-board-hint" id="np-board-hint"><span v-text="B.b.labels.hint">${esc(MODES.number.hint)}</span> <strong v-text="B.b.note"></strong></p>

      <div class="np-detect" style="display:none" v-show="B.mode === 'detect'">
        <div>
          <p class="np-detect-label">detect() picks</p>
          <p class="np-detect-value"><span v-text="B.b.detect ? B.b.detect.value : ''"></span><span class="badge" :class="B.b.detect && B.b.detect.ambiguous ? 'badge-warning' : 'badge-success'" v-text="B.b.detect ? B.b.detect.verdict : ''"></span></p>
          <div class="np-confidence"><span>Confidence</span><span class="np-meter"><i :style="{ width: (B.b.detect ? B.b.detect.confidence : 0) + '%' }"></i></span><strong v-text="(B.b.detect ? B.b.detect.confidence : 0) + '%'"></strong></div>
        </div>
        <div>
          <p class="np-detect-reason" v-text="B.b.detect ? B.b.detect.reason : ''"></p>
          <ul class="np-readings" aria-label="Readings across the board">
            <li v-for="r in (B.b.detect ? B.b.detect.readings : [])" :key="r.value" :data-best="r.best ? 'true' : 'false'"><code v-text="r.value"></code><span v-text="r.count + (r.count === 1 ? ' locale' : ' locales')"></span></li>
          </ul>
        </div>
      </div>

      <p class="np-summary" role="status" v-text="B.b.summary">${esc(B.b.summary)}</p>
      <div class="np-regions">
${regionsHtml}
      </div>
      <div class="np-legend">
        <span><i class="np-swatch np-swatch-bad"></i>Wrong number or NaN</span>
        <span><i class="np-swatch np-swatch-good"></i>Exactly right</span>
        <span><i class="np-swatch np-swatch-alt"></i>Another valid reading</span>
        <span class="np-legend-note">Written live by <code>Intl.NumberFormat</code> in your browser and read back by numberparrot ${VERSION}.</span>
      </div>
    </div>
  </div>
</section>

<section id="departures" class="dark np-departures" aria-labelledby="dep-title">
  <div class="container">
    <div class="np-dep-head">
      <div>
        <p class="np-eyebrow np-eyebrow-sun">${icon("plane", "np-icon")}Departures</p>
        <h2 id="dep-title">Numbers leaving home</h2>
        <p>Each flight is a number written the local way. The status is what <code>parseFloat</code> did with it on arrival. numberparrot lands every one.</p>
      </div>
      <div class="np-dep-clock">${icon("clock", "np-icon")}<span id="np-clock">09:41</span><small>Local time</small></div>
    </div>
    <div class="np-flapboard" v-motion-scroll="fadeUp" role="table" aria-label="Departures: numbers written in different locales and how they parse">
      <div class="np-flap-row np-flap-headrow" role="row">${COLS.map(([key, label]) => `<span class="np-flap-th np-col-${key}" role="columnheader">${label}</span>`).join("")}</div>
${flapRows}
    </div>
    <div class="np-dep-foot">
      <p><span><i class="np-dot np-dot-on-time"></i>On time: parseFloat got it right</span><span><i class="np-dot np-dot-diverted"></i>Diverted: a wrong number</span><span><i class="np-dot np-dot-cancelled"></i>Cancelled: NaN</span></p>
      <button type="button" class="btn btn-sm btn-outline btn-neutral" id="np-dep-next">${icon("arrow", "np-icon")}Next departures</button>
    </div>
  </div>
</section>

<section id="use-cases" class="np-section" aria-labelledby="uc-title">
  <div class="container">
    <div class="np-section-head" v-motion-scroll="fadeUp">
      <p class="np-eyebrow">${icon("postcard", "np-icon")}Use cases</p>
      <h2 id="uc-title">Postcards from where numbers come from</h2>
      <p>Numbers rarely start in your code. They arrive from shoppers, banks, scrapers and spreadsheets, written the way their sender writes them.</p>
    </div>
    <div class="np-postcards" v-motion-stagger="80">
${usesHtml}
    </div>
  </div>
</section>

<section id="api" class="np-section np-section-tint" aria-labelledby="api-title">
  <div class="container">
    <div class="np-section-head" v-motion-scroll="fadeUp">
      <p class="np-eyebrow">${icon("code", "np-icon")}API</p>
      <h2 id="api-title">Nine functions, one passport each</h2>
      <p>Every function takes the locale as an argument, so data from Berlin, Mumbai and Cairo can sit side by side. No global state, nothing to register.</p>
    </div>
    <div class="np-api" v-motion-scroll="fadeUp">
      <div class="np-api-list" role="tablist" aria-label="Functions" aria-orientation="vertical">
${apiList}
      </div>
      <div class="np-api-panel">
${apiPanels}
      </div>
    </div>
    <div class="np-install-row">
      <div>
        <h3>Install</h3>
        <p>Node.js 18+, Deno, Bun and every modern browser. ESM, CommonJS and TypeScript types, about 7 kB gzipped.</p>
      </div>
      ${installTabs()}
    </div>
  </div>
</section>

<section id="guides" class="np-section" aria-labelledby="guides-title">
  <div class="container">
    <div class="np-section-head" v-motion-scroll="fadeUp">
      <p class="np-eyebrow">${icon("ticket", "np-icon")}Guides</p>
      <h2 id="guides-title">Boarding passes for the usual trouble</h2>
      <p>Four short guides. Each one shows the usual approach, why it breaks and what to do instead.</p>
    </div>
${ticketGrid(null)}
  </div>
</section>

<section id="faq" class="np-section np-section-tint" aria-labelledby="faq-title">
  <div class="container np-faq">
    <div class="np-section-head" v-motion-scroll="fadeUp">
      <p class="np-eyebrow">${icon("compass", "np-icon")}FAQ</p>
      <h2 id="faq-title">Questions at the gate</h2>
      <img src="img/mascot.svg" width="120" height="120" alt="Pico the parrot" class="np-faq-pico" loading="lazy">
    </div>
    <div class="accordion collapse-plus">
${FAQ.map(([q, a], i) => `      <details class="collapse" name="faq"${i === 0 ? " open" : ""}><summary class="collapse-title">${esc(q)}</summary><div class="collapse-content"><p>${a}</p></div></details>`).join("\n")}
    </div>
  </div>
</section>
</main>`;

const indexJsonld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareSourceCode",
      name: "numberparrot",
      description: "Reads numbers and prices written in any locale back into JavaScript numbers.",
      url: SITE,
      codeRepository: REPO,
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: ["Node.js", "Deno", "Bun", "Web browsers"],
      license: "https://opensource.org/licenses/MIT",
      author: AUTHOR,
      version: VERSION,
      image: SITE + "og.png",
    },
    { "@type": "WebSite", name: "numberparrot", url: SITE, inLanguage: "en", author: AUTHOR },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: stripTags(a) } })),
    },
  ],
};
writeFileSync(
  "docs/index.html",
  layout({
    file: "index.html",
    title: "numberparrot: parse localized numbers and currency strings in JavaScript",
    description: "A small JavaScript library that reads numbers and prices written in any locale, using the Intl data of the runtime.",
    body: indexBody,
    jsonld: indexJsonld,
    ogType: "website",
  }),
);
console.log("wrote docs/index.html");

// 404 ------------------------------------------------------------------------------------
const notFound = layout({
  file: "404.html",
  title: "Page not found",
  description: "This numberparrot documentation page does not exist.",
  jsonld: { "@context": "https://schema.org", "@type": "WebPage", name: "Page not found" },
  ogType: "website",
  body: `<main id="main" class="container np-404">
  <div class="np-404-grid">
    <div>
      <p class="np-eyebrow">${icon("compass", "np-icon")}Error 404</p>
      <h1>This page flew away</h1>
      <p class="np-lead">Pico looked everywhere and could only find <code>NaN</code>. The world board, the API reference and the guides are still at their gates.</p>
      <div class="np-hero-actions"><a class="btn btn-primary" href="./">${icon("globe", "np-icon")}Back to the world board</a><a class="btn btn-outline btn-neutral" href="api.html">${icon("book", "np-icon")}API reference</a></div>
    </div>
    <div class="np-404-art" aria-hidden="true">${postcard(undefined, { number: "NaN", place: "NOWHERE", stampKey: "krw", id: "nf", width: 380 })}<img src="img/mascot.svg" width="120" height="120" alt=""></div>
  </div>
  <h2 class="np-404-sub">Where to next</h2>
  ${ticketGrid(null, true)}
</main>`,
}).replace('<link rel="canonical" href="https://kwy404.github.io/numberparrot/404.html">\n', '<meta name="robots" content="noindex">\n');
// GitHub Pages serves 404.html from any path, so links must be absolute.
writeFileSync(
  "docs/404.html",
  // The leading space keeps Voodoo bindings such as :href="hit.url" untouched.
  notFound.replace(/ (href|src)="(?!https?:|#|\/)([^"]*)"/g, (_, attr, path) => ` ${attr}="/numberparrot/${path.replace(/^\.\//, "")}"`),
);
console.log("wrote docs/404.html");

// Search index ------------------------------------------------------------------------------
const index = [
  { kind: "Page", title: "Paste and see", text: "Paste numbers, a column or a spreadsheet row and see them read", url: "./#try" },
  { kind: "Page", title: "World board", text: "Type a number, see it in 39 locales", url: "./#board" },
  { kind: "Page", title: "Departures", text: "parseFloat and numberparrot, flight by flight", url: "./#departures" },
  { kind: "Page", title: "Use cases", text: "Checkout, CSV, prices, accounting, cents, scripts", url: "./#use-cases" },
  { kind: "Page", title: "FAQ", text: "Questions at the gate", url: "./#faq" },
  { kind: "Reference", title: "API reference", text: API_PAGE.summary, url: "api.html" },
  ...API.map((fn) => ({ kind: "Function", title: fn.name, text: fn.summary, url: `api.html#${slug(fn.name)}` })),
  ...GUIDES.map((g) => ({ kind: "Guide", title: g.title, text: g.summary, url: g.file })),
  ...GUIDES.flatMap((g) =>
    prepareBody(g.body())
      .toc.map((t) => ({ kind: "Section", title: t.text, text: g.nav, url: `${g.file}#${t.id}` })),
  ),
  ...PLACES.map((p) => {
    const c = localeCard(p.locale, "");
    return { kind: "Locale", title: `${p.locale} ${p.city}`, text: `writes ${c.sample}, decimal ${c.decimal}`, url: "api.html#locales-on-the-world-board" };
  }),
];
writeFileSync(
  "docs/search-index.js",
  `// Generated by scripts/build-docs.mjs: the entries of the docs search.\nexport default [\n${index.map((e) => `  ${JSON.stringify(e)},`).join("\n")}\n];\n`,
);
console.log(`wrote docs/search-index.js (${index.length} entries)`);

// sitemap and robots ---------------------------------------------------------------------
const urls = [SITE, SITE + "api.html", ...GUIDES.map((g) => SITE + g.file)];
writeFileSync(
  "docs/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${MODIFIED}</lastmod></url>`).join("\n")}
</urlset>
`,
);
writeFileSync("docs/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
writeFileSync("docs/.nojekyll", "");
console.log("wrote docs/sitemap.xml, docs/robots.txt, docs/.nojekyll");
