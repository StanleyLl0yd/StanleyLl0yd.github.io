import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import resolveHandler from '../api/resolve.mjs';
import audioHandler from '../api/audio.mjs';

import {
  contentDisposition,
  deriveContentCipher,
  extractSongIdFromLocation,
  fetchMediaStream,
  isTrustedMediaUrl,
  mediaDescriptor,
  parsePublicSunoUrl,
  pickProgressiveAudio,
  publicClipMetadata,
  publicErrorCode,
  requireFrontendOrigin,
  statusForError,
  unwrapRightsValue,
} from '../lib/suno.mjs';

const CLIP_ID = '841eb00b-1234-4abc-8def-0123456789ab';

function wrap(value, clipId, userKey) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', userKey, nonce);
  cipher.setAAD(Buffer.from(clipId, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(value), cipher.final()]);
  return Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]).toString('base64');
}

function fakeResponse() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: '',
    setHeader(name, value) {
      this.headers.set(String(name).toLowerCase(), value);
    },
    end(value = '') {
      this.body = value;
    },
  };
}

test('parsePublicSunoUrl accepts only canonical public Suno routes', () => {
  assert.equal(parsePublicSunoUrl('https://suno.com/s/abcDEF123').hostname, 'suno.com');
  assert.equal(parsePublicSunoUrl('suno.com/song/' + CLIP_ID).pathname, '/song/' + CLIP_ID);
  assert.equal(parsePublicSunoUrl('https://www.suno.com/hook/' + CLIP_ID).hostname, 'www.suno.com');

  assert.throws(() => parsePublicSunoUrl('https://example.com/s/abcDEF123'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('http://suno.com/s/abcDEF123'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://user@suno.com/s/abcDEF123'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://suno.com:444/s/abcDEF123'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://suno.com/account'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://suno.com/s/abcDEF123/extra'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://suno.com/song/not-a-uuid'), /unsupported_url/);
});

test('extractSongIdFromLocation accepts only canonical Suno song redirects', () => {
  assert.equal(
    extractSongIdFromLocation('/song/' + CLIP_ID + '?sh=abc123'),
    CLIP_ID,
  );
  assert.equal(extractSongIdFromLocation('/'), null);
  assert.equal(extractSongIdFromLocation('https://example.com/song/' + CLIP_ID), null);
  assert.equal(extractSongIdFromLocation('https://suno.com:444/song/' + CLIP_ID), null);
});

test('resolveTrackId rejects unusable share redirects instead of scraping unrelated UUIDs', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (_url, options = {}) => {
    calls.push(options.method);
    return new Response(null, {
      status: 307,
      headers: { location: '/' },
    });
  };

  try {
    const { resolveTrackId } = await import('../lib/suno.mjs');
    await assert.rejects(
      () => resolveTrackId('https://suno.com/s/invalidShare1234'),
      /track_id_not_found/,
    );
    assert.deepEqual(calls, ['HEAD', 'GET']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resolveTrackId accepts UUID from a canonical share redirect', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options = {}) => {
    assert.equal(options.method, 'HEAD');
    return new Response(null, {
      status: 307,
      headers: { location: '/song/' + CLIP_ID + '?sh=abc123' },
    });
  };

  try {
    const { resolveTrackId } = await import('../lib/suno.mjs');
    assert.equal(
      await resolveTrackId('https://suno.com/s/validShare123456'),
      CLIP_ID,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('resolveTrackId accepts canonical song URLs from a bounded HTML fallback', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (_url, options = {}) => {
    calls.push(options.method);
    if (options.method === 'HEAD') {
      return new Response(null, { status: 200 });
    }
    return new Response('<a href="/song/' + CLIP_ID + '">play</a>', {
      status: 200,
      headers: { 'content-length': '80' },
    });
  };

  try {
    const { resolveTrackId } = await import('../lib/suno.mjs');
    assert.equal(
      await resolveTrackId('https://suno.com/s/htmlFallback123'),
      CLIP_ID,
    );
    assert.deepEqual(calls, ['HEAD', 'GET']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('media redirects are revalidated before the backend follows them', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, {
      status: 302,
      headers: { location: 'https://evil.example/private' },
    });
  };

  try {
    await assert.rejects(
      () => fetchMediaStream(
        {
          url: 'https://media.cloudfront.net/1/clip/example.m4a',
          content_type: 'm4a-opus',
        },
        CLIP_ID,
      ),
      /media_redirect_untrusted/,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('trusted media URL allowlist rejects foreign hosts and credential tricks', () => {
  assert.equal(isTrustedMediaUrl('https://media.cloudfront.net/1/clip/a.m4a'), true);
  assert.equal(isTrustedMediaUrl('https://cdn2.suno.ai/image.jpeg'), true);
  assert.equal(isTrustedMediaUrl('https://d123.cloudfront.net/audio.m4a'), false);
  assert.equal(isTrustedMediaUrl('https://studio-api.prod.suno.com/media/a'), false);

  assert.equal(isTrustedMediaUrl('https://evil.example/audio.m4a'), false);
  assert.equal(isTrustedMediaUrl('https://suno.ai.evil.example/audio.m4a'), false);
  assert.equal(isTrustedMediaUrl('https://127.0.0.1/audio.m4a'), false);
  assert.equal(isTrustedMediaUrl('https://user@suno.ai/audio.m4a'), false);
  assert.equal(isTrustedMediaUrl('https://suno.ai:444/audio.m4a'), false);
});

test('pickProgressiveAudio prefers supported trusted current media', () => {
  const media = pickProgressiveAudio({
    audio_url: 'https://cdn1.suno.ai/legacy.mp3',
    media_urls: [
      {
        url: 'https://evil.example/audio.m4a',
        content_type: 'm4a-opus',
        delivery: 'progressive',
        encoding: '1.0.0',
      },
      {
        url: 'https://media.cloudfront.net/1/clip/audio.m4a',
        content_type: 'm4a-opus',
        delivery: 'progressive',
        encoding: '1.0.0',
      },
      {
        url: 'https://cdn1.suno.ai/audio.mp3',
        content_type: 'mp3',
        delivery: 'progressive',
      },
    ],
  });

  assert.equal(media.url, 'https://media.cloudfront.net/1/clip/audio.m4a');
});

test('mediaDescriptor only decrypts the protected current container', () => {
  assert.deepEqual(
    mediaDescriptor({ content_type: 'm4a-opus', encoding: '1.0.0' }),
    { extension: 'm4a', mime: 'audio/mp4', encrypted: true },
  );
  assert.deepEqual(
    mediaDescriptor({ content_type: 'mp3' }),
    { extension: 'mp3', mime: 'audio/mpeg', encrypted: false },
  );
});

test('publicClipMetadata bounds text and rejects foreign cover hosts', () => {
  const result = publicClipMetadata({
    id: CLIP_ID,
    title: '  Example  ',
    display_name: 'Artist',
    image_large_url: 'https://evil.example/cover.jpeg',
    major_model_version: 'v5.5',
    metadata: {
      duration: 178.8,
      tags: 'x'.repeat(2500),
    },
    media_urls: [{
      url: 'https://media.cloudfront.net/1/clip/audio.m4a',
      content_type: 'm4a-opus',
      delivery: 'progressive',
      encoding: '1.0.0',
    }],
  });

  assert.equal(result.title, 'Example');
  assert.equal(result.duration, 178.8);
  assert.equal(result.image, '');
  assert.equal(result.tags.length, 2000);
  assert.equal(result.media.encrypted, true);
});

test('frontend origin guard rejects direct hotlink requests', () => {
  const blocked = fakeResponse();
  assert.equal(
    requireFrontendOrigin({ headers: { origin: 'https://evil.example' } }, blocked),
    false,
  );
  assert.equal(blocked.statusCode, 403);
  assert.equal(JSON.parse(blocked.body).error, 'untrusted_origin');

  const allowed = fakeResponse();
  assert.equal(
    requireFrontendOrigin({ headers: { origin: 'https://stanleyll0yd.github.io' } }, allowed),
    true,
  );
});


test('API handlers reject foreign origins before any upstream request', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('upstream should not be reached');
  };

  try {
    for (const [handler, query] of [
      [resolveHandler, { url: 'https://suno.com/song/' + CLIP_ID }],
      [audioHandler, { id: CLIP_ID }],
    ]) {
      const res = fakeResponse();
      await handler(
        {
          method: 'GET',
          headers: { origin: 'https://evil.example' },
          query,
        },
        res,
      );
      assert.equal(res.statusCode, 403);
      assert.equal(JSON.parse(res.body).error, 'untrusted_origin');
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resolve handler returns bounded canonical metadata to the frontend origin', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const upstream = new URL(String(url));
    assert.equal(upstream.origin, 'https://studio-api.prod.suno.com');
    assert.match(
      upstream.pathname,
      /^\/api\/clip\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    const body = JSON.stringify({
      id: CLIP_ID,
      title: 'Example',
      display_name: 'Artist',
      image_large_url: 'https://cdn2.suno.ai/cover.jpeg',
      major_model_version: 'v5.5',
      metadata: { duration: 178.8, tags: 'ambient' },
      media_urls: [{
        url: 'https://media.cloudfront.net/1/clip/example.m4a',
        content_type: 'm4a-opus',
        delivery: 'progressive',
        encoding: '1.0.0',
      }],
    });
    return new Response(body, {
      status: 200,
      headers: { 'content-length': String(Buffer.byteLength(body)) },
    });
  };

  try {
    const res = fakeResponse();
    await resolveHandler(
      {
        method: 'GET',
        headers: { origin: 'https://stanleyll0yd.github.io' },
        query: { url: 'https://suno.com/song/' + CLIP_ID },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://stanleyll0yd.github.io');
    const data = JSON.parse(res.body);
    assert.equal(data.id, CLIP_ID);
    assert.equal(data.title, 'Example');
    assert.equal(data.duration, 178.8);
    assert.equal(data.media.encrypted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unwrapRightsValue authenticates clip-bound AES-GCM wrapper', () => {
  const userKey = crypto.randomBytes(32);
  const value = crypto.randomBytes(16);
  const wrapped = wrap(value, CLIP_ID, userKey);

  assert.deepEqual(unwrapRightsValue(wrapped, CLIP_ID, userKey), value);
  assert.throws(() => unwrapRightsValue(wrapped, CLIP_ID.replace('841e', '941e'), userKey));
});

test('deriveContentCipher decrypts Suno-style AES-CTR payload', () => {
  const glt = 'guest-listener-token';
  const userKey = crypto.createHash('sha256').update(glt, 'utf8').digest();
  const contentKey = crypto.randomBytes(16);
  const counter = crypto.randomBytes(16);

  const rights = {
    glt,
    key: wrap(contentKey, CLIP_ID, userKey),
    iv: wrap(counter, CLIP_ID, userKey),
  };

  const plaintext = Buffer.from('current suno m4a bytes would be here');
  const encryptor = crypto.createCipheriv('aes-128-ctr', contentKey, counter);
  const encrypted = Buffer.concat([encryptor.update(plaintext), encryptor.final()]);

  const decryptor = deriveContentCipher(CLIP_ID, rights);
  const decrypted = Buffer.concat([decryptor.update(encrypted), decryptor.final()]);
  assert.deepEqual(decrypted, plaintext);
});

test('Content-Disposition is ASCII-safe and retains UTF-8 filename', () => {
  const header = contentDisposition('Чёрная вода', 'm4a');
  assert.equal(/[^\x00-\x7f]/.test(header), false);
  assert.match(header, /filename\*=/);
  assert.match(header, /%D0%A7/);
  assert.match(header, /\.m4a/);
});

test('public errors do not leak unexpected implementation messages', () => {
  assert.equal(publicErrorCode(new Error('secret implementation detail')), 'internal_error');
  assert.equal(publicErrorCode(new Error('clip_http_404')), 'clip_http_404');
  assert.equal(statusForError('clip_http_404'), 502);
  assert.equal(statusForError('media_timeout'), 504);
  assert.equal(statusForError('media_too_large'), 413);
});
