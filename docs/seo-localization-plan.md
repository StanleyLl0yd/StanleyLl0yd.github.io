# RU/EN SEO localization plan

## Decision

The current bilingual URLs remain canonical until a complete localized static-page generation path is ready. Do not publish partial `/en/` or `/ru/` trees: the existing pages contain both languages and a JavaScript language switch, while search metadata is currently English-first.

Target structure:

- `/en/` and `/ru/`
- `/en/apps/<product>/` and `/ru/apps/<product>/`
- localized privacy pages below the same language roots
- `/` as an x-default language chooser/portfolio entry point, only after the localized trees exist

## Atomic migration requirements

A localization PR must generate both language trees together and, for every indexable page:

1. emit the correct `<html lang>` value at build time;
2. emit localized `<title>`, description and Open Graph metadata at build time;
3. use a self-referencing canonical URL;
4. add `hreflang="en"`, `hreflang="ru"` and `hreflang="x-default"` alternates;
5. preserve an accessible language switch that links to the equivalent localized URL;
6. update sitemap.xml with both localized routes and lastmod;
7. preserve every legacy public URL until its redirect/canonical behavior is explicit;
8. pass security and site audits before merging.

## Why this is staged

Adding localized directories by hand while the existing bilingual pages remain canonical would create duplicate-content ambiguity and a maintenance burden. A small local generator using `data/products.json` is preferred over introducing a framework or runtime dependency.

## Metadata direction

Examples of concise search-oriented titles:

- `Biorhythms for Android — Forecast & Widget | Stanley Lloyd`
- `Биоритмы для Android — график и прогноз | Stanley Lloyd`
- `Offline Password Generator for Android | Stanley Lloyd`
- `Генератор паролей офлайн для Android | Stanley Lloyd`
- `My Cycle — Private Offline Period Tracker | Stanley Lloyd`
- `Everon — Keep Windows Awake Utility | Stanley Lloyd`
- `Infinite Five — Five in a Row Game | Stanley Lloyd`
- `Dots — Territory Strategy Game | Stanley Lloyd`
- `IMPULSE — Offline Chain-Reaction Game | Stanley Lloyd`

Titles and descriptions must stay human-readable and avoid keyword stuffing.
