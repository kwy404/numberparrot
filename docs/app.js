// Interactive parts of the docs site, built with Voodoo.js (https://kwy404.github.io/Voodoo.js/).
// Every page loads Voodoo with data-manual: this module publishes pure functions on
// V.config.globals, sets up the page state with V.data and then starts Voodoo. The pages
// declare their behavior in HTML (v-model, v-text, @click, v-effect, v-theme-toggle).
// Plain JavaScript is only used where Voodoo cannot help: the clipboard, the native
// search dialog and the split flap animation of the departures board.
import { EXAMPLES, PASTES, computeBoard, computePaste, departures, localeCard, PLACES, boardState } from "./board-model.js";
import INDEX from "./search-index.js";

const V = window.V;
const LOCALE_KEY = "numberparrot:locale";

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: the choice lasts for this page only */
    }
  },
};

// Search ------------------------------------------------------------------------------------
// Links in the index are relative to the site root, which is where this module lives, so
// they also work from 404.html, which GitHub Pages serves at any path.
const ENTRIES = INDEX.map((entry) => ({
  ...entry,
  url: new URL(entry.url, import.meta.url).href,
  hay: `${entry.title} ${entry.text} ${entry.kind}`.toLowerCase(),
  name: entry.title.toLowerCase(),
}));
const SUGGESTED = ENTRIES.filter((e) => e.kind === "Function" || e.kind === "Reference" || e.kind === "Guide");

/** Ranked search over the index. Pure. */
function search(query, limit) {
  const words = String(query ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return SUGGESTED.slice(0, limit);
  const scored = [];
  for (const entry of ENTRIES) {
    let score = 0;
    for (const word of words) {
      if (!entry.hay.includes(word)) {
        score = -1;
        break;
      }
      if (entry.name.startsWith(word)) score += 6;
      else if (entry.name.includes(word)) score += 3;
      else score += 1;
    }
    if (score > 0) {
      if (entry.kind === "Function" || entry.kind === "Reference") score += 2;
      if (entry.kind === "Guide") score += 1;
      scored.push([score, entry]);
    }
  }
  return scored
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([, entry]) => entry);
}

if (V) {
  // Values and pure functions only, as the Voodoo.js security guide recommends.
  Object.assign(V.config.globals, { computeBoard, computePaste });
  // The paste box rows are prerendered for the first paint; the v-for row takes over.
  for (const row of document.querySelectorAll("[data-prerender]")) row.remove();

  const savedLocale = store.get(LOCALE_KEY);
  const startLocale = PLACES.some((p) => p.locale === savedLocale) ? savedLocale : "pt-BR";
  const dialog = () => document.getElementById("np-search");

  const S = V.data({
    menu: false,
    pm: "npm",
    copied: "",
    api: "parse",
    // search dialog and docs rail search
    q: "",
    hits: search("", 8),
    sel: 0,
    rq: "",
    rhits: [],
    // locale picker
    loc: startLocale,
    trial: "1.234,56",
    card: localeCard(startLocale, "1.234,56"),
    // paste and see
    P: { text: PASTES[0].text, r: computePaste(PASTES[0].text) },
    // world board
    B: boardState(),
    openSearch() {
      const d = dialog();
      if (!d || d.open) return;
      S.q = "";
      d.showModal();
      requestAnimationFrame(() => d.querySelector("input")?.focus());
    },
    closeSearch() {
      dialog()?.close();
    },
    move(step) {
      if (!S.hits.length) return;
      S.sel = (S.sel + step + S.hits.length) % S.hits.length;
      const items = dialog()?.querySelectorAll(".command-palette-item");
      items?.[S.sel]?.scrollIntoView({ block: "nearest" });
    },
    go() {
      const hit = S.hits[S.sel];
      if (!hit) return;
      S.closeSearch();
      location.href = hit.url;
    },
    goRail() {
      const hit = S.rhits[0];
      if (hit) location.href = hit.url;
    },
    sample(i) {
      S.P.text = PASTES[i].text;
    },
    setMode(mode) {
      const from = S.B.mode;
      S.B.mode = mode;
      if (mode === "detect") S.B.text = EXAMPLES.detect[0];
      else if (from === "detect") S.B.text = EXAMPLES[mode][0];
    },
    async copyText(text, id) {
      try {
        await navigator.clipboard.writeText(text);
        S.copied = id;
        setTimeout(() => {
          if (S.copied === id) S.copied = "";
        }, 1600);
      } catch {
        S.copied = "";
      }
    },
    copy(button) {
      const frame = button.closest(".np-code");
      const pre = frame && frame.querySelector("pre");
      if (pre) S.copyText(pre.textContent.replace(/\n$/, ""), frame.id);
    },
  });

  V.effect(() => {
    S.hits = search(S.q, 8);
    S.sel = 0;
  });
  V.effect(() => {
    S.rhits = search(S.rq, 6);
  });
  V.effect(() => {
    S.card = localeCard(S.loc, S.trial);
    store.set(LOCALE_KEY, S.loc);
  });

  addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      S.openSearch();
    } else if (event.key === "/" && !typing) {
      event.preventDefault();
      const railInput = document.querySelector(".np-rail-search input");
      if (railInput && railInput.offsetParent) railInput.focus();
      else S.openSearch();
    } else if (event.key === "Escape" && S.menu) {
      S.menu = false;
    }
  });
  // A click on the backdrop closes the dialog.
  dialog()?.addEventListener("click", (event) => {
    if (event.target === dialog()) S.closeSearch();
  });

  // The locale picker starts folded on narrow screens, where it sits above the article.
  const loc = document.getElementById("np-loc");
  if (loc && matchMedia("(max-width: 1023px)").matches) loc.open = false;

  V.start();
}

// Departures board ----------------------------------------------------------------------------
// Each cell is a row of character flaps. When a value changes, the flaps that differ spin
// through a few glyphs and settle, like a split flap display. Reduced motion skips the spin
// and the automatic rotation.
const flapboard = document.querySelector(".np-flapboard");
if (flapboard) {
  const flights = departures();
  const rows = [...flapboard.querySelectorAll(".np-flap-row:not(.np-flap-headrow)")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GLYPHS = "0123456789.,'ABCDEFGHKLMNOPRSTUVXYZ";
  const KEYS = ["time", "flight", "from", "written", "pf", "np", "status"];
  let offset = 0;

  const flip = (span, text) => {
    span.textContent = text;
    span.classList.remove("np-flip");
    void span.offsetWidth;
    span.classList.add("np-flip");
  };

  const setCell = (cell, value) => {
    const width = Number(cell.dataset.w);
    const chars = [...value].slice(0, width);
    while (chars.length < width) chars.push(" ");
    cell.setAttribute("aria-label", value);
    const spans = cell.querySelectorAll(".np-ch");
    chars.forEach((ch, i) => {
      const span = spans[i];
      const target = ch === " " ? " " : ch;
      if (!span || span.textContent === target) return;
      if (reduce) {
        span.textContent = target;
        return;
      }
      let steps = 2 + Math.floor(Math.random() * 4);
      const tick = () => {
        if (steps-- > 0) {
          flip(span, GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
          setTimeout(tick, 70);
        } else {
          flip(span, target);
        }
      };
      setTimeout(tick, i * 22);
    });
  };

  const render = () => {
    rows.forEach((row, r) => {
      const flight = flights[(offset + r) % flights.length];
      row.dataset.status = flight.status.toLowerCase().replace(" ", "-");
      row.querySelectorAll(".np-flap").forEach((cell, c) => setCell(cell, flight[KEYS[c]]));
    });
  };

  document.getElementById("np-dep-next")?.addEventListener("click", () => {
    offset = (offset + rows.length) % flights.length;
    render();
  });

  let visible = false;
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  }).observe(flapboard);
  if (!reduce) {
    setInterval(() => {
      if (!visible || document.hidden) return;
      offset = (offset + 1) % flights.length;
      render();
    }, 4200);
  }

  const clock = document.getElementById("np-clock");
  const tickClock = () => {
    if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };
  tickClock();
  setInterval(tickClock, 20000);
}
