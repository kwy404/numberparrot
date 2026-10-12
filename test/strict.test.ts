import { describe, expect, it } from "vitest";
import { NumberParseError, type ParseErrorCode, createParser, isValid, parse } from "../src";

function codeOf(fn: () => unknown): ParseErrorCode | null {
  try {
    fn();
    return null;
  } catch (error) {
    expect(error).toBeInstanceOf(NumberParseError);
    return (error as NumberParseError).code;
  }
}

describe("strict mode", () => {
  it.each([
    ["", "en-US", "EMPTY"],
    ["   ", "en-US", "EMPTY"],
    ["abc", "en-US", "NO_DIGITS"],
    ["1,23", "en-US", "INVALID_GROUPING"],
    ["12,34,5", "en-IN", "INVALID_GROUPING"],
    ["1.2.3", "en-US", "MULTIPLE_DECIMALS"],
    ["1,234.567,8", "en-US", "INVALID_GROUPING"],
    ["1#5", "en-US", "INVALID_CHARACTER"],
    ["1,,5", "en-US", "INVALID_SEPARATOR"],
    ["1.234,56", "fr-FR", "INVALID_SEPARATOR"],
    ["1 234.5", "en-US", "INVALID_SEPARATOR"],
    ["--5", "en-US", "INVALID_SIGN"],
    ["(5", "en-US", "INVALID_SIGN"],
    ["5%%", "en-US", "INVALID_AFFIX"],
    ["12 zz", "en-US", "UNKNOWN_CURRENCY"],
    ["5,", "pt-BR", "INVALID_SEPARATOR"],
    ["1e999", "en-US", "OUT_OF_RANGE"],
  ])("%j in %s throws %s", (input, locale, code) => {
    expect(codeOf(() => parse(input, locale, { strict: true }))).toBe(code);
  });

  it("throws for non strings", () => {
    expect(codeOf(() => parse(null as unknown as string, "en-US", { strict: true }))).toBe("NOT_A_STRING");
    expect(codeOf(() => parse(NaN, "en-US", { strict: true }))).toBe("OUT_OF_RANGE");
  });

  it("returns NaN instead of throwing when not strict", () => {
    expect(parse("1,23", "en-US")).toBeNaN();
    expect(parse("1.2.3", "en-US")).toBeNaN();
    expect(parse(undefined as unknown as string, "en-US")).toBeNaN();
  });

  it("keeps lenient spellings out of strict mode", () => {
    expect(parse("1 234,56", "de-DE")).toBe(1234.56);
    expect(codeOf(() => parse("1 234,56", "de-DE", { strict: true }))).toBe("INVALID_SEPARATOR");
    expect(parse("1\u00A0234,56", "fr-FR", { strict: true })).toBe(1234.56);
    expect(parse("1 234,56", "fr-FR", { strict: true })).toBe(1234.56);
  });

  it("puts details on the error", () => {
    let error: NumberParseError | null = null;
    try {
      parse("1,23", "en-US", { strict: true });
    } catch (e) {
      error = e as NumberParseError;
    }
    expect(error?.name).toBe("NumberParseError");
    expect(error?.input).toBe("1,23");
    expect(error?.locale).toBe("en-US");
    expect(error?.message).toContain("1,23");
  });

  it("looseGrouping accepts groups anywhere", () => {
    expect(parse("1,23,4", "en-US", { looseGrouping: true })).toBe(1234);
    expect(parse("1,23,4", "en-US")).toBeNaN();
  });
});

describe("isValid", () => {
  it("never throws", () => {
    expect(isValid("1.234,56", "pt-BR")).toBe(true);
    expect(isValid("1.234,56", "en-US")).toBe(false);
    expect(isValid("12 apples", "en-US")).toBe(false);
    expect(isValid("1,23", "en-US", { strict: true })).toBe(false);
    expect(isValid(42)).toBe(true);
    expect(isValid(NaN)).toBe(false);
  });
});

describe("createParser", () => {
  it("binds locale and options", () => {
    const brl = createParser("pt-BR");
    expect(["1.234,56", "R$ 10,00", "(5,25)"].map(brl.parse)).toEqual([1234.56, 10, -5.25]);
    expect(brl.isValid("1,234.56")).toBe(false);
    expect(brl.parseCurrency("R$ 10,00", { toMinorUnits: true }).amount).toBe(1000);
    expect(brl.normalizeInput("1.234,").complete).toBe(false);
    expect(brl.info.decimal).toBe(",");
  });

  it("applies strict mode to every call", () => {
    const de = createParser("de-DE", { strict: true });
    expect(de.parse("1.234,56")).toBe(1234.56);
    expect(() => de.parse("1,234.56")).toThrow(NumberParseError);
    expect(de.isValid("1,234.56")).toBe(false);
  });

  it("uses the runtime default locale when none is given", () => {
    const parser = createParser();
    const nf = new Intl.NumberFormat();
    expect(parser.parse(nf.format(1234.5))).toBe(1234.5);
  });

  it("accepts locale lists", () => {
    expect(parse("1.234,56", ["pt-BR", "en-US"])).toBe(1234.56);
    expect(parse("1,234.56", ["en-US", "pt-BR"])).toBe(1234.56);
  });
});
