<p align="right"><a href="https://github.com/kwy404/numberparrot/blob/main/README.md">English</a> | <b>Português (Brasil)</b></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner.svg" width="880" alt="Banner do numberparrot: o papagaio Pico ao lado do texto converter números e valores monetários localizados em JavaScript, mostrando parseFloat('1.234,56') retornando 1.234 e parse('1.234,56', 'pt-BR') retornando 1234.56">
  </picture>
</p>

<h1 align="center">numberparrot: converter números localizados e strings de moeda em JavaScript</h1>

<p align="center">
  <b><code>parseFloat("1.234,56")</code> retorna <code>1.234</code>. O numberparrot retorna <code>1234.56</code>.</b><br>
  O parser que faltava para o <code>Intl.NumberFormat</code>: transforma números escritos em qualquer idioma de volta em números JavaScript de verdade.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/v/numberparrot?color=2FBF71&label=npm" width="80" alt="versão do numberparrot no npm"></a>
  <a href="https://bundlephobia.com/package/numberparrot"><img src="https://img.shields.io/bundlephobia/minzip/numberparrot?label=minzip" width="96" alt="tamanho do pacote numberparrot minificado e com gzip"></a>
  <a href="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml"><img src="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml/badge.svg" width="92" alt="status do CI do numberparrot no Node 18, 20 e 22"></a>
  <a href="https://github.com/kwy404/numberparrot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" width="78" alt="licença MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/types-TypeScript-3178C6?logo=typescript&logoColor=white" width="112" alt="escrito em TypeScript com tipos incluídos"></a>
</p>

<table align="center">
  <tr>
    <td width="64"><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/locales.svg" width="48" alt="ícone de globo: converter números de qualquer idioma"></td>
    <td><b>Qualquer locale</b></td>
    <td>Separadores, dígitos e símbolos vêm do <code>Intl.NumberFormat</code>, então todo locale que o seu runtime conhece funciona.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/currency.svg" width="48" alt="ícone de moedas: converter string de moeda para número"></td>
    <td><b>Moeda</b></td>
    <td>Símbolos e códigos ISO antes ou depois do valor: <code>R$ 1.234,56</code>, <code>1 234,56 €</code>, <code>CHF 1'234.50</code>.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/digits.svg" width="48" alt="ícone de dígitos: arábicos, persas, devanágari e tailandeses"></td>
    <td><b>Qualquer dígito</b></td>
    <td>Arábico-índicos, persas, devanágari, bengali, tailandeses, largura total e todo outro dígito Unicode.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/accounting.svg" width="48" alt="ícone de parênteses: negativos contábeis"></td>
    <td><b>Negativos contábeis</b></td>
    <td><code>(1.234,56)</code>, sinal de menos no final, o sinal de menos Unicode e seus parecidos.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/detection.svg" width="48" alt="ícone de lupa: detectar separador decimal e locale"></td>
    <td><b>Detecção</b></td>
    <td>Não sabe o locale? <code>detect()</code> encontra o separador decimal e avisa quando há ambiguidade real, como em <code>1,234</code>.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/money.svg" width="48" alt="ícone de escudo: segurança com dinheiro em centavos inteiros"></td>
    <td><b>Dinheiro seguro</b></td>
    <td><code>toMinorUnits</code> devolve centavos inteiros a partir dos dígitos: <code>"0,29"</code> vira <code>29</code>, nunca <code>28.999999999999996</code>.</td>
  </tr>
  <tr>
    <td><img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/icons/input.svg" width="48" alt="ícone de campo de texto: validar input numérico durante a digitação"></td>
    <td><b>Formulários</b></td>
    <td><code>normalizeInput()</code> limpa o campo a cada tecla e mantém valores parciais como <code>1.234,</code> válidos.</td>
  </tr>
</table>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/demo.svg" width="820" alt="Demonstração animada: converter números localizados em JavaScript. 1.234.567,89 (pt-BR), 1'234'567.89 (de-CH), 12,34,567.89 (en-IN) e dígitos arábico-índicos (ar-EG) viram 1234567.89 com o numberparrot, enquanto parseFloat retorna 1.234, 1, 12 e NaN">
</p>

<p align="center">
  <a href="https://kwy404.github.io/numberparrot/"><b>Documentação e playground</b></a> (em inglês)
</p>

## Sumário

- [Instalação](#instalação)
- [Uso rápido](#uso-rápido)
- [Como converter string com vírgula em número no JavaScript?](#como-converter-string-com-vírgula-em-número-no-javascript)
- [Por que o parseFloat erra números com vírgula decimal?](#por-que-o-parsefloat-erra-números-com-vírgula-decimal)
- [Como converter uma string de moeda (R$) em número?](#como-converter-uma-string-de-moeda-r-em-número)
- [Como converter dinheiro em centavos inteiros?](#como-converter-dinheiro-em-centavos-inteiros)
- [Como converter dígitos arábicos, persas ou devanágari?](#como-converter-dígitos-arábicos-persas-ou-devanágari)
- [Negativos contábeis e porcentagens](#negativos-contábeis-e-porcentagens)
- [Como detectar o separador decimal de uma string?](#como-detectar-o-separador-decimal-de-uma-string)
- [Como validar um input numérico enquanto o usuário digita?](#como-validar-um-input-numérico-enquanto-o-usuário-digita)
- [Referência da API](#referência-da-api)
- [Locales testados](#locales-testados)
- [Comparação](#comparação)
- [Compatibilidade e tamanho](#compatibilidade-e-tamanho)
- [Documentação](#documentação)
- [Licença](#licença)

## Instalação

```sh
npm install numberparrot
```

Também funciona com pnpm, yarn, Bun (`bun add numberparrot`) e Deno (`import { parse } from "npm:numberparrot";`). Zero dependências em tempo de execução, builds ESM e CommonJS com tipos TypeScript, e tree-shaking (`sideEffects: false`).

## Uso rápido

```ts
import { parse, parseCurrency, detect } from "numberparrot";

parse("1.234,56", "pt-BR");        // 1234.56
parse("1 234,56", "fr-FR");        // 1234.56
parse("1'234.56", "de-CH");        // 1234.56
parse("12,34,567.89", "en-IN");    // 1234567.89
parse("١٬٢٣٤٫٥٦", "ar-EG");        // 1234.56
parse("(1.234,56)", "pt-BR");      // -1234.56
parse("15%", "pt-BR");             // 0.15

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

detect("1,234");
// { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234], ... }
```

## Como converter string com vírgula em número no JavaScript?

Informe o locale em que a string foi escrita. O numberparrot lê os separadores decimal e de milhar do `Intl.NumberFormat` para esse locale:

```ts
parse("1,5", "pt-BR");          // 1.5
parse("1.234,56", "pt-BR");     // 1234.56
parse("1.234,56", "en-US");     // NaN: não é um número válido em en-US
```

O truque comum `Number(valor.replace(",", "."))` quebra assim que aparece um separador de milhar (`"1.234,56"` vira `NaN`) e corrompe valores em inglês (`"1,234"` vira `1.234`). O numberparrot nunca chuta: se a string não combina com o locale, o resultado é `NaN` (ou um erro no modo `strict`). Se você não sabe o locale, use `detect()`.

## Por que o parseFloat erra números com vírgula decimal?

`parseFloat` e `Number` só entendem um formato: `.` como separador decimal e nenhum agrupamento. Pior, o `parseFloat` para no primeiro caractere que não entende e devolve um número errado em vez de falhar:

| Entrada | Locale | `parseFloat` | `Number` | numberparrot |
| --- | --- | --- | --- | --- |
| `1.234,56` | pt-BR | `1.234` | `NaN` | `1234.56` |
| `1'234.56` | de-CH | `1` | `NaN` | `1234.56` |
| `12,34,567.89` | en-IN | `12` | `NaN` | `1234567.89` |
| `١٢٣٫٤٥` | ar-EG | `NaN` | `NaN` | `123.45` |
| `R$ 10,00` | pt-BR | `NaN` | `NaN` | `10` |

## Como converter uma string de moeda (R$) em número?

`parseCurrency` devolve o valor e o código ISO 4217. A moeda pode ser símbolo, código ISO ou abreviação local, antes ou depois do número. Os símbolos são resolvidos pelo `Intl` do locale, então `$` é CAD em `en-CA`, MXN em `es-MX` e USD em `en-US`.

```ts
parseCurrency("R$ 1.234,56", "pt-BR");   // { amount: 1234.56, currency: "BRL", ... }
parseCurrency("US$ 10,00", "pt-BR");     // { amount: 10, currency: "USD", ... }
parseCurrency("1.234,56 €", "de-DE");    // { amount: 1234.56, currency: "EUR", ... }
parseCurrency("12,50", "pt-BR", { currency: "BRL" }); // moeda padrão quando nenhuma está escrita
```

## Como converter dinheiro em centavos inteiros?

Multiplicar ponto flutuante não é seguro para dinheiro: `0.29 * 100` dá `28.999999999999996`. Com `toMinorUnits: true` o numberparrot desloca os dígitos decimais como texto, então o resultado é sempre o inteiro exato:

```ts
parseCurrency("0,29", "pt-BR", { toMinorUnits: true }).amount;     // 29
parseCurrency("R$ 19,99", "pt-BR", { toMinorUnits: true }).amount; // 1999
parseCurrency("¥1,235", "ja-JP", { toMinorUnits: true }).amount;   // 1235 (JPY não tem centavos)
```

Dígitos extras são arredondados (metade para longe do zero); no modo `strict` eles geram o erro `PRECISION_LOSS`.

## Como converter dígitos arábicos, persas ou devanágari?

Todo dígito decimal Unicode é convertido, em qualquer locale. O separador decimal arábico `٫` e o de milhar `٬` são reconhecidos, e as marcas bidi invisíveis que o `Intl` insere são ignoradas.

```ts
parse("١٬٢٣٤٫٥٦", "ar-EG");     // 1234.56
parse("۱۲۳٫۴۵", "fa-IR");        // 123.45
parse("१२,३४,५६७.८९", "hi-IN");  // 1234567.89
parse("๑,๒๓๔.๕", "th-TH");      // 1234.5
parse("１２３４．５", "ja-JP");   // 1234.5
```

## Negativos contábeis e porcentagens

```ts
parse("(1.234,56)", "pt-BR");    // -1234.56
parse("1.234,56-", "de-DE");     // -1234.56
parse("+42", "pt-BR");           // 42
parse("15%", "pt-BR");           // 0.15
parse("15%", "pt-BR", { keepPercent: true }); // 15
parse("1,5E3", "pt-BR");         // 1500
```

## Como detectar o separador decimal de uma string?

Quando o locale é desconhecido (importação de CSV, preços coletados, células coladas de planilha), use `detect`. Ele devolve o valor mais provável, os locales candidatos e avisa quando há ambiguidade real:

```ts
detect("1.234,56");
// { value: 1234.56, decimal: ",", group: ".", ambiguous: false, confidence: 0.95, locales: ["pt-BR", ...] }

detect("1,234");
// { value: 1234, ambiguous: true, confidence: 0.5, alternatives: [1234, 1.234], ... }

detect("1,234", ["pt-BR", "en-US"]).value; // 1.234: a ordem dos candidatos desempata
```

## Como validar um input numérico enquanto o usuário digita?

```ts
normalizeInput("1.234,", "pt-BR");
// { text: "1.234,", value: 1234, valid: true, complete: false }

normalizeInput("R$ 1.234,567", "pt-BR", { maxFractionDigits: 2 });
// { text: "1.234,56", value: 1234.56, valid: true, complete: true }
```

## Referência da API

| Função | Retorno | Descrição |
| --- | --- | --- |
| `parse(input, locale?, options?)` | `number` | Número ou `NaN`. Opções: `strict`, `keepPercent`, `looseGrouping`. |
| `parseCurrency(input, locale?, options?)` | `{ amount, currency, symbol, fractionDigits }` | Opções: `toMinorUnits`, `currency`, `strict`, `looseGrouping`. |
| `detect(input, candidates?)` | `{ value, decimal, group, ambiguous, confidence, reason, locales, alternatives }` | Adivinha o formato quando o locale é desconhecido. |
| `isValid(input, locale?, options?)` | `boolean` | Nunca lança erro. |
| `createParser(locale?, options?)` | `{ info, parse, isValid, parseCurrency, normalizeInput }` | Resolve o locale uma vez. |
| `normalizeInput(value, locale?, options?)` | `{ text, value, valid, complete }` | Para campos de formulário. Opções: `maxFractionDigits`, `allowNegative`. |
| `getLocaleInfo(locale?)` | `LocaleInfo` | Símbolos do locale vindos do `Intl`. |
| `NumberParseError` | classe | Lançado no modo `strict`, com `code`, `input` e `locale`. |

A referência completa, com todas as opções e códigos de erro, está no [README em inglês](https://github.com/kwy404/numberparrot/blob/main/README.md#api-reference).

## Locales testados

`en-US`, `pt-BR`, `de-DE`, `fr-FR`, `de-CH`, `en-IN`, `ar-EG`, `fa-IR`, `hi-IN`, `th-TH`, `ja-JP`, `es-ES`, `it-IT`, `ru-RU`, `pl-PL`, `sv-SE` e `tr-TR`, com entradas escritas à mão e ida e volta (formatar com `Intl.NumberFormat`, converter, comparar) em mais de 80 valores nos estilos decimal, científico, porcentagem, moeda e contábil. Qualquer outro locale conhecido pelo `Intl` também funciona.

## Comparação

| | `parseFloat` / `Number` | numeral.js | @internationalized/number | numberparrot |
| --- | --- | --- | --- | --- |
| Última versão | nativo | 2.0.6 (março de 2017) | 3.6.9 (outubro de 2026) | 0.1.0 |
| Dependências | nenhuma | nenhuma | 1 (`@swc/helpers`) | nenhuma |
| `"1.234,56"` em pt-BR | `1.234` | `1.23456` no locale padrão | `1234.56` | `1234.56` |
| Moeda sem opções de formato | não | só o símbolo do locale ativo | `NaN` sem as opções de moeda | sim, com código ISO |
| Detectar locale ou ambiguidade | não | não | não | `detect()` |
| Centavos inteiros | não | não | não | `toMinorUnits` |

## Compatibilidade e tamanho

Node.js 18 ou mais novo, Deno, Bun e navegadores modernos. O pacote inteiro tem 14,3 kB minificado e **6,1 kB com gzip**; só o `parse` custa 3,6 kB com gzip.

## Documentação

- [Playground](https://kwy404.github.io/numberparrot/)
- [Convert a string with a comma to a number in JavaScript](https://kwy404.github.io/numberparrot/convert-string-with-comma-to-number-javascript.html)
- [parseFloat with a comma decimal separator](https://kwy404.github.io/numberparrot/parsefloat-comma-decimal-separator.html)
- [Parse a localized number in JavaScript](https://kwy404.github.io/numberparrot/parse-localized-number-javascript.html)
- [Parse a currency string to a number in JavaScript](https://kwy404.github.io/numberparrot/parse-currency-string-javascript.html)
- [Convert Arabic and Persian digits to numbers](https://kwy404.github.io/numberparrot/arabic-digits-to-number-javascript.html)
- [Intl.NumberFormat parse](https://kwy404.github.io/numberparrot/intl-numberformat-parse.html)
- [numeral.js alternative](https://kwy404.github.io/numberparrot/numeral-js-alternative.html)

## Mais de kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): CSS utility-first sem etapa de build
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): HTML reativo sem etapa de build
- [breakhound](https://kwy404.github.io/breakhound/): encontre bugs em qualquer biblioteca JavaScript automaticamente, sem escrever testes
- [vueleap](https://kwy404.github.io/vueleap/): migre de Vue 2 para Vue 3 com um comando
- [graphemely](https://kwy404.github.io/graphemely/): truncar, fatiar e contar strings com emoji com segurança
- [edgegoat](https://kwy404.github.io/edgegoat/): entradas de teste para casos extremos de fuso horário, horário de verão, unicode e números
- [cookieowl](https://kwy404.github.io/cookieowl/): banner de cookies gratuito para LGPD e GDPR que bloqueia rastreadores de verdade
- [installkite](https://kwy404.github.io/installkite/): torne qualquer site instalável e com funcionamento offline
- [a11ymedic](https://kwy404.github.io/a11ymedic/): verificador de acessibilidade que explica cada problema e entrega a correção exata
- [fontsketch](https://kwy404.github.io/fontsketch/): crie uma fonte com a sua letra, grátis e no navegador
- [kastor](https://kwy404.github.io/kastor/): o ORM para TypeScript para quase todos os bancos de dados

## Licença

[MIT](https://github.com/kwy404/numberparrot/blob/main/LICENSE) © 2026 Alexandre Kohler.
