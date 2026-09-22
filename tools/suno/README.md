# Suno Saver (GitHub Pages)

Static frontend for the Suno Saver serverless API.

## Behavior

- accepts public `suno.com/s/...`, `/song/<uuid>` and `/hook/...` links;
- sends only the public Suno URL to the configured Suno Saver API;
- displays canonical title, artist, duration, tags/model and cover returned by the backend;
- downloads the backend's decrypted current Suno audio stream;
- saves Original without re-encoding;
- converts the playable source to 16-bit PCM WAV locally;
- converts the playable source to 192 kbps MP3 locally with vendored `lamejs` 1.2.1;
- validates audio bytes before saving;
- does not ask for Suno passwords, cookies, session tokens or API tokens.

## Backend

The backend source lives in `../suno-api/` and is deployed separately because GitHub Pages is static-only.

The production backend origin is configured in:

`<meta name="suno-saver-api" ...>`

in `index.html`.

## Third-party code

`vendor/lame.min.js` is vendored from `zhuker/lamejs` 1.2.1 and is licensed under LGPL-3.0. Its license is retained next to the vendored file. No remote executable scripts are loaded at runtime.
