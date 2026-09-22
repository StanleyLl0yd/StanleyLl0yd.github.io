# Suno Saver (GitHub Pages)

Static browser tool for public Suno song links.

## Current behavior

- accepts `suno.com/s/...`, `/song/<uuid>` and `/hook/...` links;
- resolves public clip metadata without account credentials;
- chooses the best published progressive audio candidate;
- validates the downloaded bytes before saving;
- saves the original playable audio container;
- converts playable source audio to 16-bit PCM WAV locally;
- converts playable source audio to 192 kbps MP3 locally with a vendored `lamejs` 1.2.1 encoder;
- refuses to save payloads that do not identify as a supported audio container.

## Important limitation

GitHub Pages has no server-side runtime. Suno can block cross-origin requests or expose only a protected/unrecognized media payload. In those cases the page intentionally stops instead of creating a broken file. A future resolver service can be added without changing the UI contract.

No Suno passwords, session cookies or API tokens are requested.

## Third-party code

`vendor/lame.min.js` is vendored from `zhuker/lamejs` 1.2.1 and is licensed under LGPL-3.0. Its license is retained next to the vendored file. No remote executable scripts are loaded at runtime.
