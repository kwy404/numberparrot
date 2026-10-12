import { describe, expect, it } from "vitest";
import { parse, parseCurrency } from "../src";
import { CURRENCY, LOCALES, sampleValues } from "./helpers";

const VALUES = sampleValues();

describe.each(LOCALES)("round trip in %s", (locale) => {
  it("decimal style, 17 significant digits", () => {
    const nf = new Intl.NumberFormat(locale, { maximumSignificantDigits: 17 });
    for (const value of VALUES) expect(parse(nf.format(value), locale), nf.format(value)).toBe(value);
  });

  it("decimal style without grouping", () => {
    const nf = new Intl.NumberFormat(locale, { maximumSignificantDigits: 17, useGrouping: false });
    for (const value of VALUES) expect(parse(nf.format(value), locale)).toBe(value);
  });

  it("scientific notation", () => {
    const nf = new Intl.NumberFormat(locale, { notation: "scientific", maximumSignificantDigits: 17 });
    for (const value of VALUES) expect(parse(nf.format(value), locale), nf.format(value)).toBe(value);
  });

  it("percent style", () => {
    const nf = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
    for (const value of [0.15, 0.5, 1, -0.0425, 1.2345, 12.5]) {
      expect(parse(nf.format(value), locale), nf.format(value)).toBe(value);
      expect(parse(nf.format(value), locale, { keepPercent: true })).toBe(Number((value * 100).toFixed(2)));
    }
  });

  it("currency style with symbol, narrow symbol and code", () => {
    const currency = CURRENCY[locale];
    for (const currencyDisplay of ["symbol", "narrowSymbol", "code"] as const) {
      const nf = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay });
      const digits = nf.resolvedOptions().maximumFractionDigits as number;
      for (const raw of VALUES) {
        const value = Number(raw.toFixed(digits));
        if (!Number.isSafeInteger(Math.round(value * 10 ** digits))) continue;
        const text = nf.format(value);
        expect(parse(text, locale), text).toBe(Object.is(value, -0) ? -0 : value);
        const money = parseCurrency(text, locale);
        expect(money.amount, text).toBe(value);
        expect(money.currency, text).toBe(currency);
      }
    }
  });

  it("accounting negatives", () => {
    const currency = CURRENCY[locale];
    const nf = new Intl.NumberFormat(locale, { style: "currency", currency, currencySign: "accounting" });
    for (const value of [-1234.5, -0.5, -1000000, 42]) {
      const digits = nf.resolvedOptions().maximumFractionDigits as number;
      const expected = Number(value.toFixed(digits));
      expect(parse(nf.format(value), locale), nf.format(value)).toBe(expected);
    }
  });

  it("strict mode accepts everything Intl prints", () => {
    const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
    const reference = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6, useGrouping: false });
    for (const value of VALUES) {
      const text = nf.format(value);
      expect(parse(text, locale, { strict: true }), text).toBe(Number(reference.format(value)));
    }
  });
});
