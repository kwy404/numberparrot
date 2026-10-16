<p align="right"><a href="https://github.com/kwy404/numberparrot/blob/main/README.md">English</a> | <b>Português (Brasil)</b></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/numberparrot@main/assets/banner.svg" width="880" alt="Banner do numberparrot com o papagaio Pico">
  </picture>
</p>

<h1 align="center">numberparrot</h1>

<p align="center">
  <b><code>parseFloat("1.234,56")</code> retorna <code>1.234</code>. O numberparrot retorna <code>1234.56</code>.</b><br>
  Lê números e preços escritos em qualquer idioma de volta como números JavaScript, usando os dados do <code>Intl</code> que o seu runtime já tem.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/numberparrot"><img src="https://img.shields.io/npm/v/numberparrot?color=2FBF71&label=npm" width="80" alt="versão no npm"></a>
  <a href="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml"><img src="https://github.com/kwy404/numberparrot/actions/workflows/ci.yml/badge.svg" width="92" alt="status do CI"></a>
  <a href="https://github.com/kwy404/numberparrot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" width="78" alt="licença MIT"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/numberparrot/"><b>Teste ao vivo: cole qualquer número ou coluna na página inicial</b></a>
</p>

## Instalação

```sh
npm install numberparrot
```

Zero dependências. ESM, CommonJS e tipos TypeScript. Node.js 18 ou mais novo, Deno, Bun e navegadores modernos. Cerca de 7 kB com gzip para a biblioteca inteira e 3,6 kB só para o `parse`.

## Uso rápido

```ts
import { parse, parseCurrency, parseColumn } from "numberparrot";

parse("1.234,56", "pt-BR");       // 1234.56
parse("1 234,56", "fr-FR");       // 1234.56 (qualquer tipo de espaço)
parse("12,34,567.89", "en-IN");   // 1234567.89
parse("(1.234,56)", "de-DE");     // -1234.56
parse("1.234,56", "en-US");       // NaN: não é um número en-US

parseCurrency("R$ 1.234,56", "pt-BR");
// { amount: 1234.56, currency: "BRL", symbol: "R$", fractionDigits: 2 }

parseCurrency("R$ 0,29", "pt-BR", { toMinorUnits: true }).amount; // 29 centavos exatos

parseColumn(["1,234", "12,5", "1.000,00"]).values;
// [1.234, 12.5, 1000]: "12,5" mostra que a vírgula é o separador decimal
```

O `parse` nunca chuta. Uma entrada que não combina com o locale retorna `NaN`, ou lança um `NumberParseError` com o motivo no modo `strict`.

## API

| Função | O que faz |
| --- | --- |
| `parse(input, locale?, options?)` | Lê um número. `NaN` quando não é um número válido no locale. |
| `tryParse(input, locale?, options?)` | Como o `parse`, mas retorna `{ ok, value, code, message }` e nunca lança erro. |
| `parseCurrency(input, locale?, options?)` | Valor, código ISO e símbolo de um preço. `toMinorUnits` dá centavos inteiros. |
| `detect(input, candidates?)` | Descobre o separador decimal de um valor desconhecido, com confiança e as outras leituras. |
| `parseColumn(values, candidates?)` | Lê uma coluna inteira num formato desconhecido. As células claras decidem pelas ambíguas. |
| `isValid(input, locale?, options?)` | `true` quando o `parse` retornaria um número. |
| `createParser(locale?, options?)` | As funções acima presas a um locale, resolvido uma vez. |
| `normalizeInput(value, locale?, options?)` | Limpa o que a pessoa está digitando e diz se o valor está completo. |
| `getLocaleInfo(locale?)` | Os símbolos e dígitos de um locale. |

Todas as opções e códigos de erro estão na [referência da API](https://kwy404.github.io/numberparrot/api.html) (em inglês).

## Mais de kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): CSS utility-first sem etapa de build
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): HTML reativo sem etapa de build
- [breakhound](https://kwy404.github.io/breakhound/): encontra bugs em bibliotecas JavaScript automaticamente
- [vueleap](https://kwy404.github.io/vueleap/): leva código Vue 2 para Vue 3
- [graphemely](https://kwy404.github.io/graphemely/): trunca, fatia e conta strings com emoji com segurança
- [edgegoat](https://kwy404.github.io/edgegoat/): entradas de teste para datas, unicode e números
- [cookieowl](https://kwy404.github.io/cookieowl/): banner de cookies que bloqueia rastreadores até o consentimento
- [installkite](https://kwy404.github.io/installkite/): torna um site instalável e com funcionamento offline
- [a11ymedic](https://kwy404.github.io/a11ymedic/): verificador de acessibilidade que explica cada correção
- [fontsketch](https://kwy404.github.io/fontsketch/): transforma a sua letra numa fonte, no navegador
- [kastor](https://kwy404.github.io/kastor/): ORM para TypeScript com suporte a muitos bancos de dados

## Autor

Feito por Alexandre Kohler ([GitHub](https://github.com/kwy404), [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

## Licença

[MIT](https://github.com/kwy404/numberparrot/blob/main/LICENSE) © 2026 Alexandre Kohler.
