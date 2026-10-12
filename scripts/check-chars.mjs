// Fails when a tracked text file contains emoji or typographic dash characters.
// Code must spell such characters as escapes (for example "\u" + "2212").
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const banned = [
  [0x1f000, 0x1faff, "emoji"],
  [0x2600, 0x27bf, "symbol or dingbat"],
  [0x2013, 0x2014, "en or em dash"],
];
const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !/\.(png|ico|jpg|gif|woff2?)$/i.test(f));

let problems = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    for (const ch of line) {
      const cp = ch.codePointAt(0);
      const hit = banned.find(([from, to]) => cp >= from && cp <= to);
      if (hit) {
        problems++;
        console.error(`${file}:${index + 1}: U+${cp.toString(16).toUpperCase()} (${hit[2]})`);
      }
    }
  });
}
if (problems > 0) {
  console.error(`${problems} banned character(s) found.`);
  process.exit(1);
}
console.log(`Checked ${files.length} files: no emoji or dash characters.`);
