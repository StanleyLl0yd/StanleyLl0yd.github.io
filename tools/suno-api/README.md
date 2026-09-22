# Suno Saver API

Small serverless companion for the static GitHub Pages UI in `../suno/`.

## Why it exists

The browser cannot reliably access Suno's public clip and Mango-rights endpoints from a GitHub Pages origin because of CORS. Current Suno playback also no longer uses the old `cdn1.suno.ai/<uuid>.mp3` path: progressive media can be encrypted and the web player obtains anonymous Mango rights before playback.

This service keeps GitHub Pages as the UI and performs only the cross-origin server-side steps:

- `GET /api/resolve?url=<public-suno-url>`
  - validates the Suno URL;
  - follows a public share redirect;
  - fetches the public clip object;
  - returns title, artist, duration, cover, model/tags and the current source container type.

- `GET /api/audio?id=<clip-uuid>`
  - re-fetches the public clip;
  - selects the best progressive audio media entry;
  - requests anonymous Mango rights for that clip;
  - unwraps the content key/CTR counter;
  - streams decrypted audio to the browser without buffering the full song in the function.

- `GET /api/health`
  - simple deployment health check.

No Suno account cookie, password, session or user token is accepted or forwarded.

## Deploy

Deploy this directory as the Vercel project root. The frontend origin allowed by CORS is fixed to:

`https://stanleyll0yd.github.io`

After deployment, set the resulting API origin in `../suno/app.js` and remove the temporary OpenSuno fallback.

## Security notes

- only HTTPS `suno.com` / `www.suno.com` input URLs are accepted;
- only UUID clip IDs reach media/rights endpoints;
- no arbitrary upstream URL is accepted from the browser;
- media URLs are selected only from Suno's clip response;
- decrypted audio is streamed and not persisted;
- responses are `no-store`.
