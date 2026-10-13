// Pre-renders syntax highlighting for every code example in docs/*.html with Shiki,
// using the VS Code themes light-plus and dark-plus as dual themes, and wraps each
// block in an editor style frame (file name tab and a copy button driven by Voodoo.js).
//
//   node scripts/highlight-docs.mjs
//
// Idempotent: only raw <pre data-lang="..." data-title="..."><code> blocks written by
// scripts/build-docs.mjs are converted, so running it twice changes nothing.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHighlighter } from "shiki";

const LANGS = { ts: "typescript", js: "javascript", sh: "shellscript", html: "html", json: "json" };
const RAW = /<pre data-lang="([a-z]+)" data-title="([^"]*)"><code>([\s\S]*?)<\/code><\/pre>/g;

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

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
  const out = html.replace(RAW, (_, lang, title, body) => {
    n++;
    const id = `code-${n}`;
    const pre = highlighter
      .codeToHtml(decode(body), {
        lang: LANGS[lang] ?? "text",
        themes: { light: "light-plus", dark: "dark-plus" },
        defaultColor: false,
      })
      .replace(' tabindex="0"', ` tabindex="0" aria-label="${title} code example"`);
    return `<div class="code-frame" id="${id}" data-lang="${lang}"><div class="code-bar"><span class="code-tab">${title}</span><button type="button" class="code-copy" aria-label="Copy code" @click="copy($el)" v-text="copied === '${id}' ? 'Copied' : 'Copy'">Copy</button></div>${pre}</div>`;
  });
  if (out !== html) {
    writeFileSync(path, out);
    total += n - existing;
    console.log(`highlighted ${n - existing} block(s) in ${path}`);
  }
}
console.log(total === 0 ? "Nothing to highlight: docs are already highlighted." : `Highlighted ${total} block(s).`);
highlighter.dispose();
