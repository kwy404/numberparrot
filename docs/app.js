// Interactive parts of the docs site, built with Voodoo.js (https://github.com/kwy404/Voodoo.js).
// Every page loads Voodoo with data-manual; this module publishes pure functions on
// V.config.globals, sets up page state with V.data and then starts Voodoo.
import { analyze, playground } from "./playground-model.js";

const V = window.V;

function storedTheme() {
  try {
    return localStorage.getItem("np-theme");
  } catch {
    return null;
  }
}

if (V) {
  // Values and pure functions only, as the Voodoo.js security guide recommends.
  Object.assign(V.config.globals, { analyze, playground });

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const site = V.data({
    theme: storedTheme() || (systemDark.matches ? "dark" : "light"),
    pm: "npm",
    copied: "",
    toggleTheme() {
      site.theme = site.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = site.theme;
      try {
        localStorage.setItem("np-theme", site.theme);
      } catch {
        /* storage unavailable: the choice lasts for this page only */
      }
    },
    setPm(name) {
      site.pm = name;
    },
    async copy(button) {
      const frame = button.closest(".code-frame");
      const code = frame && frame.querySelector("pre");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ""));
        site.copied = frame.id;
        setTimeout(() => {
          if (site.copied === frame.id) site.copied = "";
        }, 1600);
      } catch {
        site.copied = "";
      }
    },
  });
  systemDark.addEventListener("change", (event) => {
    if (!storedTheme()) site.theme = event.matches ? "dark" : "light";
  });
  V.start();
}
