/** Locales covered by the test matrix. */
export const LOCALES = [
  "en-US",
  "pt-BR",
  "de-DE",
  "fr-FR",
  "de-CH",
  "en-IN",
  "ar-EG",
  "fa-IR",
  "hi-IN",
  "th-TH",
  "ja-JP",
  "es-ES",
  "it-IT",
  "ru-RU",
  "pl-PL",
  "sv-SE",
  "tr-TR",
] as const;

/** The everyday currency of each locale in the matrix. */
export const CURRENCY: Record<(typeof LOCALES)[number], string> = {
  "en-US": "USD",
  "pt-BR": "BRL",
  "de-DE": "EUR",
  "fr-FR": "EUR",
  "de-CH": "CHF",
  "en-IN": "INR",
  "ar-EG": "EGP",
  "fa-IR": "IRR",
  "hi-IN": "INR",
  "th-TH": "THB",
  "ja-JP": "JPY",
  "es-ES": "EUR",
  "it-IT": "EUR",
  "ru-RU": "RUB",
  "pl-PL": "PLN",
  "sv-SE": "SEK",
  "tr-TR": "TRY",
};

/** Small deterministic PRNG (mulberry32) so failures are reproducible. */
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A mix of edge case and random values. */
export function sampleValues(count = 60, seed = 42): number[] {
  const next = random(seed);
  const fixed = [
    0, 1, -1, 0.1, 0.5, 1.5, 12.34, -12.34, 999, 1000, 1001, 1234.56, -1234.56, 12345.678, 100000,
    1234567.891, 98765432.1, 0.000123, 3.14159, 2 ** 31, -(2 ** 31), 123456789012, 9007199254740991,
  ];
  const randoms: number[] = [];
  for (let i = 0; i < count; i++) {
    const magnitude = Math.floor(next() * 12) - 3;
    const sign = next() < 0.3 ? -1 : 1;
    randoms.push(sign * Number((next() * 10 ** magnitude).toPrecision(1 + Math.floor(next() * 15))));
  }
  return [...fixed, ...randoms];
}
