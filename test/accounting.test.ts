import { describe, expect, it } from "vitest";
import { parse } from "../src";

describe("accounting negatives and signs", () => {
  it.each([
    ["(1.234,56)", "pt-BR", -1234.56],
    ["(1,234.56)", "en-US", -1234.56],
    ["($1,234.56)", "en-US", -1234.56],
    ["$(1,234.56)", "en-US", -1234.56],
    ["(1.234,56 \u20AC)", "de-DE", -1234.56],
    ["(R$ 1.234,56)", "pt-BR", -1234.56],
    ["( 42 )", "en-US", -42],
    ["\uFF0842\uFF09", "ja-JP", -42],
    ["1.234,56-", "de-DE", -1234.56],
    ["+1,234.56", "en-US", 1234.56],
    ["+ 5", "en-US", 5],
  ])("%j (%s) is %d", (input, locale, expected) => {
    expect(parse(input, locale)).toBe(expected);
  });

  it.each([
    ["\u2212", "minus sign U+2212"],
    ["\u2012", "figure dash"],
    ["\u2013", "en dash"],
    ["\u2014", "em dash"],
    ["\u2010", "hyphen"],
    ["\u2011", "non breaking hyphen"],
    ["\uFE63", "small hyphen minus"],
    ["\uFF0D", "full width hyphen minus"],
    ["-", "hyphen minus"],
  ])("minus variant %j (%s)", (minus) => {
    expect(parse(`${minus}1,234.5`, "en-US")).toBe(-1234.5);
    expect(parse(`${minus}1.234,5`, "de-DE")).toBe(-1234.5);
  });

  it("keeps the sign of zero", () => {
    expect(Object.is(parse("-0", "en-US"), -0)).toBe(true);
    expect(Object.is(parse("(0)", "en-US"), -0)).toBe(true);
  });

  it.each(["((5))", "-(5)", "(5", "5)", "--5", "+-5", "-5-", ")5("])("rejects %j", (input) => {
    expect(parse(input, "en-US")).toBeNaN();
  });

  it("parses the Intl accounting format", () => {
    for (const [locale, currency] of [
      ["en-US", "USD"],
      ["en-GB", "GBP"],
      ["ja-JP", "JPY"],
      ["de-DE", "EUR"],
    ] as const) {
      const nf = new Intl.NumberFormat(locale, { style: "currency", currency, currencySign: "accounting" });
      expect(parse(nf.format(-1234), locale)).toBe(-1234);
    }
  });
});

describe("percent, per mille, exponents and Infinity", () => {
  it("divides percent by 100 by default", () => {
    expect(parse("15%", "en-US")).toBe(0.15);
    expect(parse("15\u00A0%", "fr-FR")).toBe(0.15);
    expect(parse("12,5 %", "de-DE")).toBe(0.125);
    expect(parse("-4,25%", "pt-BR")).toBe(-0.0425);
    expect(parse("\u0661\u0665\u066A", "ar-EG")).toBe(0.15);
    expect(parse("\uFF11\uFF15\uFF05", "ja-JP")).toBe(0.15);
  });

  it("keeps the percent value with keepPercent", () => {
    expect(parse("15%", "en-US", { keepPercent: true })).toBe(15);
    expect(parse("12,5 %", "de-DE", { keepPercent: true })).toBe(12.5);
  });

  it("divides per mille by 1000", () => {
    expect(parse("5\u2030", "en-US")).toBe(0.005);
  });

  it("reads exponents in every common spelling", () => {
    expect(parse("1.5e3", "en-US")).toBe(1500);
    expect(parse("1.5E-3", "en-US")).toBe(0.0015);
    expect(parse("1,5E3", "de-DE")).toBe(1500);
    expect(parse("1,5\u00D710^3", "sv-SE")).toBe(1500);
    expect(parse("\u0661\u066B\u0665\u0623\u0633\u0663", "ar-EG")).toBe(1500);
  });

  it("reads Intl Infinity", () => {
    expect(parse(new Intl.NumberFormat("en-US").format(Infinity), "en-US")).toBe(Infinity);
    expect(parse(new Intl.NumberFormat("de-DE").format(-Infinity), "de-DE")).toBe(-Infinity);
  });
});
