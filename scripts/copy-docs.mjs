// Copies the built ESM bundle into docs/ so the GitHub Pages playground can import it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("dist/index.js", "utf8");
const code = source
  .split("\n")
  .filter((line) => !line.startsWith("//# sourceMappingURL="))
  .join("\n")
  .trimEnd();
mkdirSync("docs", { recursive: true });
writeFileSync("docs/numberparrot.js", `${code}\n`);
console.log("Copied dist/index.js to docs/numberparrot.js");
