# Suno Saver (GitHub Pages)

Static frontend for the Suno Saver serverless API.

## Behavior

- accepts canonical public `suno.com/s/...`, `/song/<uuid>` and `/hook/...` links;
- validates the URL locally before contacting the backend;
- sends only the public Suno URL to the configured Suno Saver API;
- displays bounded canonical title, artist, duration, tags/model and trusted cover metadata;
- downloads the backend's decrypted current Suno audio stream;
- saves Original without re-encoding;
- converts playable source audio to 16-bit PCM WAV locally;
- converts playable source audio to 192 kbps MP3 locally with vendored `lamejs` 1.2.1;
- validates audio magic bytes before saving;
- limits browser-side audio buffering to 80 MiB;
- never asks for Suno passwords, cookies, session tokens or API tokens.

## Backend

Backend source: `../suno-api/`

Production API origin is configured in the `suno-saver-api` meta element in `index.html`.

The page uses a strict CSP and does not load remote executable JavaScript.

## Third-party code

`vendor/lame.min.js` is vendored from `zhuker/lamejs` 1.2.1 under LGPL-3.0. The license is retained next to the vendored file.
