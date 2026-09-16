# Product screenshot and social-card assets

This site must use real product UI. Never fabricate or redraw an application screen merely to fill a gallery.

## Source priority

1. original screenshot assets already present in the product repository;
2. original release/store assets produced by the product project;
3. the exact current screenshot image published for the owner's application on RuStore.

When a RuStore image is used, copy an optimized local version into this repository. Do not hotlink RuStore. Do not capture store chrome, ratings, buttons or advertising. If only a visibly compressed image is available, leave the website slot pending and obtain the original instead.

## Website format

- Android portrait: keep the source aspect ratio; 1080×1920 is the preferred working size when the source is 9:16.
- Desktop/web: keep the original aspect ratio; target roughly 1440–1920 px on the long edge when a clean original exists.
- Prefer lossless PNG for source captures where UI text suffers from compression; use a carefully encoded local WebP for the website when it remains visually lossless.
- Every rendered `<img>` must have explicit width/height and useful alt text; below-the-fold gallery images use `loading="lazy" decoding="async"`.

Expected local paths use `assets/screenshots/<product-id>/NN-<screen>.{png,webp}`.

## Required screenshot sets

### Biorhythms

1. `01-today` — Today values.
2. `02-chart` — interactive chart.
3. `03-seven-days` — 7 days forecast.
4. `04-events` — critical points / peaks / minima.
5. `05-notifications` — notification configuration or current ASO notification screenshot.
6. `06-widget` — home-screen widget.

### Password Generator

1. `01-generator`.
2. `02-rules`.
3. `03-strength`.
4. `04-clipboard-privacy`.
5. `05-theme` if a second theme materially helps explain the product.

### My Cycle

The product repository already contains a deterministic real-UI screenshot workflow (`store-screenshots.yml` and `StoreScreenshotActivity`). Import its real output rather than recreating UI.

1. `01-today`.
2. `02-diary-calendar`.
3. `03-history-statistics`.
4. `04-widget`.
5. `05-backup-export`.
6. `06-privacy-lock`.

### IMPULSE

1. `01-campaign`.
2. `02-chain-reaction`.
3. `03-endless`.
4. `04-daily`.

### Infinite Five

1. `01-gameplay`.
2. `02-ai-levels`.
3. `03-local-play`.
4. `04-history-replay`.

### Dots

1. `01-gameplay`.
2. `02-capture`.
3. `03-ai-levels`.
4. `04-result`.

### Everon

1. `01-tray-menu`.
2. `02-timer`.
3. `03-power-settings`.
4. `04-language`.

## Social cards

Do not use product screenshots as an improvised 1200×630 card. Prepare deliberate local artwork with product icon, name, one short value statement and a calm brand background.

Required final paths:

- `assets/social/home-1200x630.webp`
- `assets/social/impulse-1200x630.webp`
- `assets/social/infinite-five-1200x630.webp`
- `assets/social/dots-1200x630.webp`
- `assets/social/password-generator-1200x630.webp`
- `assets/social/my-cycle-1200x630.webp`
- `assets/social/biorhythms-1200x630.webp`
- `assets/social/everon-1200x630.webp`

Once a card exists, set `socialImage` in `data/products.json` and add `og:image`, width=1200, height=630, alt and the corresponding Twitter/X `summary_large_image` metadata. Do not point metadata at a missing placeholder file.
