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
import { EXAMPLES, MODES, PLACES, REGIONS, boardState, departures, localeCard } from "../docs/board-model.js";

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
const MODIFIED = "2026-10-13";
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
  "convert-string-with-comma-to-number-javascript.html": { from: "1.234,56", to: "1234.56", stamp: "brl", place: "SÃO PAULO", icon: "ticket" },
  "parsefloat-comma-decimal-separator.html": { from: "1,5", to: "1.5", stamp: "eur", place: "BERLIN", icon: "detect" },
  "parse-localized-number-javascript.html": { from: "1 234,56", to: "1234.56", stamp: "chf", place: "ZÜRICH", icon: "globe" },
  "parse-currency-string-javascript.html": { from: "R$ 10,00", to: "10 BRL", stamp: "usd", place: "NEW YORK", icon: "coins" },
  "arabic-digits-to-number-javascript.html": { from: "١٢٣٫٤", to: "123.4", stamp: "egp", place: "CAIRO", icon: "digits" },
  "intl-numberformat-parse.html": { from: "format()", to: "parse()", stamp: "jpy", place: "TOKYO", icon: "compass" },
  "numeral-js-alternative.html": { from: "numeral", to: "parse", stamp: "gbp", place: "LONDON", icon: "suitcase" },
};

const API_PAGE = {
  file: "api.html",
  nav: "API reference",
  title: "numberparrot API Reference: parse, parseCurrency, detect and More",
  description:
    "Every numberparrot function with options, return values, error codes and examples: parse, parseCurrency, detect, isValid, createParser, normalizeInput and getLocaleInfo.",
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
  return `<a class="np-ticket${compact ? " np-ticket-compact" : ""}" href="${g.file}">
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
  `<div class="np-tickets">
${TICKETS.filter((g) => g.file !== exclude)
  .map((g) => ticket(g, TICKETS.indexOf(g), compact))
  .join("\n")}
</div>`;

function themeButton() {
  return `<button type="button" class="np-icon-btn np-theme" v-theme-toggle.cycle aria-label="Color theme: follow the system, light or dark" title="Color theme">${icon("monitor", "np-icon np-t-system")}${icon("sun", "np-icon np-t-light")}${icon("moon", "np-icon np-t-dark")}</button>`;
}

const NAV = [
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
      <li><a href="./#board">World board</a></li><li><a href="./#departures">Departures</a></li><li><a href="./#use-cases">Use cases</a></li><li><a href="api.html">API reference</a></li><li><a href="./#faq">FAQ</a></li><li><a href="${REPO}/issues">Report an issue</a></li>
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
      <p class="np-meta"><span>${icon("clock", "np-icon")}${minutes} min read</span><span>${icon("check", "np-icon")}Updated <time datetime="${MODIFIED}">October 13, 2026</time></span><span>${icon("code", "np-icon")}numberparrot ${VERSION}</span></p>
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
<p>Zero dependencies, ESM and CommonJS, TypeScript types included. Works in Node.js 18+, Deno, Bun and browsers. <a href="./#board">Try it on the world board</a> or read the <a href="api.html">API reference</a>.</p>
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
  parseCurrency,
  detect,
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
<li>The whole library is about 6.1 kB gzipped. Importing only <code>parse</code> costs about 3.6 kB.</li>
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
    lead: "Seven functions and one error class. Every one takes the locale as an argument, so data from Berlin, Mumbai and Cairo can sit side by side.",
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
  ([st, from, title, text, snippet, file], i) => `<article class="np-postcard">
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
    "How do I convert a string with a comma to a number in JavaScript?",
    'Call <code>parse(text, locale)</code> with the locale the number was written in: <code>parse("1.234,56", "pt-BR")</code> is <code>1234.56</code> and <code>parse("1,5", "de-DE")</code> is <code>1.5</code>. Swapping commas for dots breaks as soon as a number has a group separator.',
  ],
  [
    "Why does parseFloat return the wrong number?",
    '<code>parseFloat</code> reads characters while they look like an English number and silently stops at the first one that does not, so <code>parseFloat("1.234,56")</code> is <code>1.234</code>. A wrong number passes every <code>isNaN</code> check, which makes it worse than an error.',
  ],
  [
    "How do I parse a currency string like R$ 1.234,56?",
    '<code>parseCurrency("R$ 1.234,56", "pt-BR")</code> returns the amount <code>1234.56</code> and the currency <code>"BRL"</code>. Add <code>toMinorUnits: true</code> to get exact integer cents for money.',
  ],
  [
    "What if I do not know the locale of a number?",
    '<code>detect(text)</code> works out the decimal separator from the string itself and tells you when it cannot be sure: <code>detect("1,234")</code> is ambiguous, with the readings <code>1234</code> and <code>1.234</code>. Switch the world board to Detect mode to see it live.',
  ],
  [
    "Does numberparrot work in the browser, Node.js, Deno and Bun?",
    "Yes. It has zero dependencies, ships ESM, CommonJS and TypeScript types, and is about 6.1 kB gzipped. It needs <code>Intl.NumberFormat</code> with full locale data, which every modern browser and Node.js 13 or newer provide.",
  ],
];

const indexBody = `<main id="main">
<section id="board" class="np-hero" aria-labelledby="title">
  <div class="container">
    <div class="np-hero-grid">
      <div>
        <p class="np-eyebrow">${icon("globe", "np-icon")}One number, ${PLACES.length} locales, read back right</p>
        <h1 id="title">Parse localized numbers and currency strings in any locale</h1>
        <p class="np-lead"><code>parseFloat("1.234,56")</code> returns <code class="np-bad">1.234</code>. numberparrot returns <code class="np-good">1234.56</code>. Type one number on the board below: every locale writes it its own way, and numberparrot reads every one back.</p>
        <div class="np-hero-actions">
          <button type="button" class="np-install" @click="copyText('npm i numberparrot', 'hero')" aria-label="Copy the install command: npm i numberparrot"><span class="np-install-prompt" aria-hidden="true">$</span><span>npm i numberparrot</span>${icon("copy", "np-icon")}<span class="np-install-state" v-text="copied === 'hero' ? 'Copied' : 'Copy'">Copy</span></button>
          <a class="btn btn-primary" href="api.html">${icon("book", "np-icon")}API reference</a>
          <a class="btn btn-outline btn-neutral" href="${REPO}">${icon("github", "np-icon")}GitHub</a>
        </div>
      </div>
      <div class="np-hero-art" aria-hidden="true">
        ${globe(undefined, { id: "hero-globe", size: 300 })}
        <img class="np-hero-pico" src="img/mascot.svg" width="132" height="132" alt="">
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
    <div class="np-flapboard" role="table" aria-label="Departures: numbers written in different locales and how they parse">
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
    <div class="np-section-head">
      <p class="np-eyebrow">${icon("postcard", "np-icon")}Use cases</p>
      <h2 id="uc-title">Postcards from where numbers come from</h2>
      <p>Numbers rarely start in your code. They arrive from shoppers, banks, scrapers and spreadsheets, written the way their sender writes them.</p>
    </div>
    <div class="np-postcards">
${usesHtml}
    </div>
  </div>
</section>

<section id="api" class="np-section np-section-tint" aria-labelledby="api-title">
  <div class="container">
    <div class="np-section-head">
      <p class="np-eyebrow">${icon("code", "np-icon")}API</p>
      <h2 id="api-title">Seven functions, one passport each</h2>
      <p>Every function takes the locale as an argument, so data from Berlin, Mumbai and Cairo can sit side by side. No global state, nothing to register.</p>
    </div>
    <div class="np-api">
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
        <p>Node.js 18+, Deno, Bun and every modern browser. ESM, CommonJS and TypeScript types, about 6.1 kB gzipped.</p>
      </div>
      ${installTabs()}
    </div>
  </div>
</section>

<section id="guides" class="np-section" aria-labelledby="guides-title">
  <div class="container">
    <div class="np-section-head">
      <p class="np-eyebrow">${icon("ticket", "np-icon")}Guides</p>
      <h2 id="guides-title">Boarding passes for the usual trouble</h2>
      <p>Short guides for the questions people search for, each with the broken approach, why it breaks and the fix.</p>
    </div>
${ticketGrid(null)}
  </div>
</section>

<section id="faq" class="np-section np-section-tint" aria-labelledby="faq-title">
  <div class="container np-faq">
    <div class="np-section-head">
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
      description:
        "Parse localized number and currency strings into JavaScript numbers for any locale, using Intl.NumberFormat data. Zero dependencies.",
      url: SITE,
      codeRepository: REPO,
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: ["Node.js", "Deno", "Bun", "Web browsers"],
      license: "https://opensource.org/licenses/MIT",
      author: AUTHOR,
      version: VERSION,
      image: SITE + "og.png",
      keywords:
        "parse localized number javascript, convert string with comma to number javascript, parse currency string to number javascript, parseFloat comma decimal, intl number parse, numeral.js alternative",
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
    description:
      'parseFloat("1.234,56") returns 1.234. numberparrot returns 1234.56. Parse numbers and currency strings written in any locale, with Intl data and zero dependencies.',
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
