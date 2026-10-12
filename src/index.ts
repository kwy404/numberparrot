/**
 * numberparrot: parse numbers written in any locale back into JavaScript numbers.
 *
 * `Intl.NumberFormat` turns numbers into localized strings; numberparrot turns
 * them back, using the same `Intl` data, with zero dependencies.
 *
 * @packageDocumentation
 */
export { parse, isValid, type ParseOptions } from "./parse";
export { parseCurrency, type CurrencyOptions, type CurrencyResult } from "./money";
export { detect, DEFAULT_CANDIDATES, type DetectResult } from "./detect";
export { normalizeInput, type InputOptions, type InputState } from "./input";
export { createParser, type Parser } from "./parser";
export { getLocaleInfo, type LocaleInfo, type LocaleInput } from "./locale";
export { NumberParseError, type ParseErrorCode } from "./errors";
