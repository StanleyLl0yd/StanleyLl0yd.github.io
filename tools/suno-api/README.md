# Suno Saver API

Serverless companion for the static GitHub Pages frontend in `../suno/`.

## Production flow

The browser cannot reliably call Suno's clip and Mango-rights endpoints directly because of CORS. Current Suno progressive audio can also be encrypted, so the backend performs only the cross-origin/server-side work that GitHub Pages cannot:

- `GET /api/resolve?url=<public-suno-url>`
  - accepts requests only from the production Suno Saver origin;
  - validates a canonical public Suno `/s/`, `/song/` or `/hook/` URL;
  - resolves short links without following untrusted redirects;
  - fetches the public clip object with bounded response size/time;
  - returns bounded title, artist, duration, tags/model, trusted cover URL and source media metadata.

- `GET /api/audio?id=<clip-uuid>`
  - accepts requests only from the production Suno Saver origin;
  - validates the clip UUID;
  - selects only supported progressive media on trusted Suno/CloudFront hosts;
  - re-validates every media redirect;
  - obtains anonymous Mango rights when the current source requires decryption;
  - unwraps the content key/counter and streams AES-CTR-decrypted audio;
  - enforces an 80 MiB maximum stream size and does not persist the audio.

- `GET /api/health`
  - unauthenticated health check for deployment monitoring.

No Suno account password, cookie, session token or user API token is accepted or forwarded.

## Deployment

Vercel project root:

`tools/suno-api`

Production origin:

`https://stanleyll0yd-suno-saver-api-2026092.vercel.app`

The frontend production origin allowed by the API is fixed to:

`https://stanleyll0yd.github.io`

CORS/origin checks reduce browser hotlinking and accidental third-party use; they are not authentication against a client deliberately forging HTTP headers.

## Security and resilience

- HTTPS Suno input hosts only; credentials/custom ports are rejected.
- Canonical route shapes are validated before any upstream request.
- Media hosts are allowlisted to Suno/CloudFront domains.
- Media redirects are followed manually and revalidated.
- Clip/rights/share responses are size-bounded and time-bounded.
- Audio streaming is size-bounded and server-side files are never persisted.
- Unexpected internal errors are logged server-side but returned as `internal_error`.
- Unicode filenames use an ASCII fallback plus RFC 5987 `filename*`.
- API responses use `no-store`, `nosniff` and `no-referrer` headers.

## Verification

`Suno API CI` runs syntax checks and unit tests under pinned Node 22 for both backend and frontend JavaScript.

`Suno Live Smoke` runs weekly (and can be run manually) against production to verify health, origin enforcement, public metadata resolution and a decrypted playable audio signature.
