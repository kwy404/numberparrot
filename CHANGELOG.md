# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-12

### Added

- `parse(input, locale?, options?)`: parse numbers written in any locale, with
  separators, digits and symbols read from `Intl.NumberFormat#formatToParts()`
  and cached per locale. Handles no-break and narrow no-break space groups,
  apostrophe groups, Indian lakh and crore grouping, every Unicode digit script,
  currency symbols and codes on either side, percent and per mille, accounting
  parentheses, minus sign variants, a leading plus, exponents and whitespace.
- `strict`, `keepPercent` and `looseGrouping` options, and `NumberParseError`
  with machine readable codes.
- `parseCurrency(input, locale?, options?)` returning the amount and the ISO 4217
  code, with `toMinorUnits` for exact integer minor units and a `currency`
  fallback.
- `detect(input, candidates?)` to guess the decimal separator and candidate
  locales, with ambiguity, confidence and a reason.
- `isValid`, `createParser`, `normalizeInput` (form fields while typing) and
  `getLocaleInfo`.
- ESM and CommonJS builds with type definitions, zero runtime dependencies.
- Documentation site with a live playground and seven guides. Interactive parts are
  built with Voodoo.js and code examples are highlighted at build time with Shiki.
- Mascot Pico and project artwork.

[Unreleased]: https://github.com/kwy404/numberparrot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kwy404/numberparrot/releases/tag/v0.1.0
