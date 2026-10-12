// Measures the bundle size of the package as users get it: minified, then gzip and brotli.
import { build } from "esbuild";
import { brotliCompressSync, gzipSync } from "node:zlib";

async function measure(label, contents) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    target: "es2020",
  });
  const code = result.outputFiles[0].contents;
  const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
  console.log(
    `${label.padEnd(28)} min ${kb(code.length).padStart(9)}   gzip ${kb(gzipSync(code).length).padStart(8)}   brotli ${kb(brotliCompressSync(code).length).padStart(8)}`,
  );
}

await measure("whole library", 'export * from "./dist/index.js";');
await measure("parse only", 'export { parse } from "./dist/index.js";');
await measure("parseCurrency only", 'export { parseCurrency } from "./dist/index.js";');
await measure("detect only", 'export { detect } from "./dist/index.js";');
await measure("normalizeInput only", 'export { normalizeInput } from "./dist/index.js";');
