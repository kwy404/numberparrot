import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "docs/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["assets/seasons/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        window: "readonly", globalThis: "readonly", document: "readonly", navigator: "readonly", location: "readonly",
        localStorage: "readonly", matchMedia: "readonly", devicePixelRatio: "readonly", addEventListener: "readonly",
        requestAnimationFrame: "readonly", IntersectionObserver: "readonly", URL: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", Buffer: "readonly", URL: "readonly" },
    },
  },
);
