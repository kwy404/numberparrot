import { describe, expect, it } from "vitest";
import { NumberParseError, parseCurrency } from "../src";

describe("parseCurrency", () => {
  it.each([
    ["R$ 1.234,56", "pt-BR", 1234.56, "BRL"],
    ["US$ 10,00", "pt-BR", 10, "USD"],
    ["$1,234.56", "en-US", 1234.56, "USD"],
    ["$1,234.56", "en-CA", 1234.56, "CAD"],
    ["$1,234.56", "es-MX", 1234.56, "MXN"],
    ["1.234,56 \u20AC", "de-DE", 1234.56, "EUR"],
    ["\u20AC1,234.56", "en-IE", 1234.56, "EUR"],
    ["\u00A31,234.56", "en-GB", 1234.56, "GBP"],
    ["CHF 1\u2019234.50", "de-CH", 1234.5, "CHF"],
    ["1.234,56 EUR", "de-DE", 1234.56, "EUR"],
    ["USD 99", "en-US", 99, "USD"],
    ["usd 99", "en-US", 99, "USD"],
    ["\u20B912,34,567.89", "en-IN", 1234567.89, "INR"],
    ["\uFFE51,235", "ja-JP", 1235, "JPY"],
    ["1\u00A0234,56\u00A0\u20BD", "ru-RU", 1234.56, "RUB"],
    ["1\u00A0234,56 z\u0142", "pl-PL", 1234.56, "PLN"],
    ["1 234,56 kr", "sv-SE", 1234.56, "SEK"],
    ["\u20BA1.234,56", "tr-TR", 1234.56, "TRY"],
    ["\u0E3F1,234.56", "th-TH", 1234.56, "THB"],
    ["\u0661\u066C\u0662\u0663\u0664\u066B\u0665\u0666\u00A0\u062C.\u0645.\u200F", "ar-EG", 1234.56, "EGP"],
  ])("%j in %s", (input, locale, amount, currency) => {
    const result = parseCurrency(input, locale);
    expect(result.amount).toBe(amount);
    expect(result.currency).toBe(currency);
  });

  it("returns the raw symbol and the currency minor unit digits", () => {
    expect(parseCurrency("R$ 1.234,56", "pt-BR")).toEqual({
      amount: 1234.56,
      currency: "BRL",
      symbol: "R$",
      fractionDigits: 2,
    });
  });

  it("returns null currency when there is none", () => {
    expect(parseCurrency("1.234,56", "pt-BR")).toEqual({
      amount: 1234.56,
      currency: null,
      symbol: null,
      fractionDigits: null,
    });
  });

  it("uses the fallback currency option", () => {
    expect(parseCurrency("12,50", "pt-BR", { currency: "BRL" }).currency).toBe("BRL");
    expect(parseCurrency("\u20AC 12,50", "pt-BR", { currency: "BRL" }).currency).toBe("EUR");
  });

  it("accepts numbers", () => {
    expect(parseCurrency(12.5, "en-US").amount).toBe(12.5);
    expect(parseCurrency(0.29, "en-US", { currency: "USD", toMinorUnits: true }).amount).toBe(29);
  });

  it("returns NaN for invalid input", () => {
    const result = parseCurrency("hello", "en-US");
    expect(result.amount).toBeNaN();
    expect(result.currency).toBeNull();
  });
});

describe("money safety with toMinorUnits", () => {
  it("converts on the decimal digits, not with floating point multiplication", () => {
    // 0.29 * 100 === 28.999999999999996 and 1.005 * 100 === 100.49999999999999
    expect(parseCurrency("0,29", "pt-BR", { toMinorUnits: true }).amount).toBe(29);
    expect(parseCurrency("$1.005", "en-US", { toMinorUnits: true }).amount).toBe(101);
    expect(parseCurrency("R$ 19,99", "pt-BR", { toMinorUnits: true }).amount).toBe(1999);
    expect(parseCurrency("$4.35", "en-US", { toMinorUnits: true }).amount).toBe(435);
  });

  it("uses the minor unit digits of each currency", () => {
    expect(parseCurrency("\u00A51,235", "ja-JP", { toMinorUnits: true }).amount).toBe(1235);
    expect(parseCurrency("BHD 1.234", "en-US", { toMinorUnits: true }).amount).toBe(1234);
    expect(parseCurrency("BHD 1.234", "en-US", { toMinorUnits: true }).fractionDigits).toBe(3);
    expect(parseCurrency("\u20AC 1", "en-US", { toMinorUnits: true }).amount).toBe(100);
  });

  it("assumes 2 digits when the currency is unknown", () => {
    expect(parseCurrency("12.34", "en-US", { toMinorUnits: true }).amount).toBe(1234);
  });

  it("handles negatives and accounting parentheses", () => {
    expect(parseCurrency("($1,234.56)", "en-US", { toMinorUnits: true }).amount).toBe(-123456);
    expect(parseCurrency("-R$ 0,01", "pt-BR", { toMinorUnits: true }).amount).toBe(-1);
  });

  it("rounds extra digits half away from zero, or throws in strict mode", () => {
    expect(parseCurrency("$1.234", "en-US", { toMinorUnits: true }).amount).toBe(123);
    expect(parseCurrency("$1.235", "en-US", { toMinorUnits: true }).amount).toBe(124);
    expect(parseCurrency("-$1.235", "en-US", { toMinorUnits: true }).amount).toBe(-124);
    expect(() => parseCurrency("$1.235", "en-US", { toMinorUnits: true, strict: true })).toThrow(
      NumberParseError,
    );
    expect(parseCurrency("$1.230", "en-US", { toMinorUnits: true, strict: true }).amount).toBe(123);
  });

  it("refuses amounts that are not safe integers", () => {
    expect(parseCurrency("$99,999,999,999,999,999", "en-US", { toMinorUnits: true }).amount).toBeNaN();
  });
});

describe("strict currency checks", () => {
  it("throws for unknown currencies", () => {
    expect(() => parseCurrency("12 abc", "en-US", { strict: true })).toThrow(/Unknown currency/);
  });

  it("throws when the currency differs from the expected one", () => {
    let code: string | null = null;
    try {
      parseCurrency("\u20AC 12", "en-US", { strict: true, currency: "USD" });
    } catch (error) {
      code = (error as NumberParseError).code;
    }
    expect(code).toBe("CURRENCY_MISMATCH");
  });
});
