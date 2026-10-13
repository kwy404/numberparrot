// Pre-renders syntax highlighting for every code example in docs/*.html with Shiki,
// using the VS Code themes light-plus and dark-plus as dual themes, and wraps each
// block in an editor frame: window dots, a file tab, a copy button driven by Voodoo.js,
// line numbers and a status bar. `data-mini` blocks get a compact frame without the
// status bar and line numbers.
//
//   node scripts/highlight-docs.mjs
//
// Idempotent: only raw <pre data-lang="..." data-title="..."><code> blocks written by
// scripts/build-docs.mjs are converted, so running it twice changes nothing.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHighlighter } from "shiki";
import { icon } from "./art.mjs";

const LANGS = { ts: "typescript", js: "javascript", sh: "shellscript", html: "html", json: "json" };
const NAMES = { ts: "TypeScript", js: "JavaScript", sh: "Shell", html: "HTML", json: "JSON" };
const BADGES = { ts: "TS", js: "JS", sh: "$_", html: "<>", json: "{}" };
const RAW = /<pre (data-mini="1" )?data-lang="([a-z]+)" data-title="([^"]*)"><code>([\s\S]*?)<\/code><\/pre>/g;

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const highlighter = await createHighlighter({
  themes: ["light-plus", "dark-plus"],
  langs: Object.values(LANGS),
});

let total = 0;
for (const file of readdirSync("docs").filter((f) => f.endsWith(".html"))) {
  const path = `docs/${file}`;
  const html = readFileSync(path, "utf8");
  const existing = html.match(/id="code-(\d+)"/g)?.length ?? 0;
  let n = existing;
  const out = html.replace(RAW, (_, mini, lang, title, body) => {
    n++;
    const id = `code-${n}`;
    const source = decode(body);
    const lines = source.split("\n").length;
    const pre = highlighter
      .codeToHtml(source, {
        lang: LANGS[lang] ?? "text",
        themes: { light: "light-plus", dark: "dark-plus" },
        defaultColor: false,
      })
      .replace(' tabindex="0"', ` tabindex="0" aria-label="${title} code example"`);
    const copy = `<button type="button" class="np-code-copy" aria-label="Copy code from ${title}" @click="copy($el)">${icon("copy", "np-icon")}<span v-text="copied === '${id}' ? 'Copied' : 'Copy'">Copy</span></button>`;
    const bar = `<div class="np-code-bar"><span class="np-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="np-code-tab"><span class="np-code-badge" data-lang="${lang}" aria-hidden="true">${escText(BADGES[lang] ?? lang)}</span>${title}</span>${copy}</div>`;
    const status = mini
      ? ""
      : `<div class="np-code-status" aria-hidden="true"><span>${icon("check", "np-icon")}numberparrot</span><span>${NAMES[lang] ?? lang}</span><span>UTF-8</span><span>${lines} ${lines === 1 ? "line" : "lines"}</span></div>`;
    return `<figure class="np-code${mini ? " np-code-mini" : ""}" id="${id}" data-lang="${lang}">${bar}${pre}${status}</figure>`;
  });
  if (out !== html) {
    writeFileSync(path, out);
    total += n - existing;
    console.log(`highlighted ${n - existing} block(s) in ${path}`);
  }
}
console.log(total === 0 ? "Nothing to highlight: docs are already highlighted." : `Highlighted ${total} block(s).`);
highlighter.dispose();
