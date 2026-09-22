import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import {
  deriveContentCipher,
  extractSongIdFromLocation,
  parsePublicSunoUrl,
  pickProgressiveAudio,
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

test('parsePublicSunoUrl accepts public Suno routes only', () => {
  assert.equal(parsePublicSunoUrl('https://suno.com/s/abcDEF123').hostname, 'suno.com');
  assert.equal(parsePublicSunoUrl('suno.com/song/' + CLIP_ID).pathname, '/song/' + CLIP_ID);
  assert.throws(() => parsePublicSunoUrl('https://example.com/s/abc'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('http://suno.com/s/abc'), /unsupported_url/);
  assert.throws(() => parsePublicSunoUrl('https://suno.com/account'), /unsupported_url/);
});


test('extractSongIdFromLocation accepts only canonical Suno song redirects', () => {
  assert.equal(
    extractSongIdFromLocation(`/song/${CLIP_ID}?sh=abc123`),
    CLIP_ID,
  );
  assert.equal(extractSongIdFromLocation('/'), null);
  assert.equal(extractSongIdFromLocation('https://example.com/song/' + CLIP_ID), null);
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
      headers: { location: `/song/${CLIP_ID}?sh=abc123` },
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

test('pickProgressiveAudio prefers current m4a-opus progressive media', () => {
  const media = pickProgressiveAudio({
    audio_url: 'https://cdn1.suno.ai/legacy.mp3',
    media_urls: [
      { url: 'https://example.test/video.mp4', content_type: 'video/mp4', delivery: 'progressive' },
      { url: 'https://example.test/audio.aac', content_type: 'aac', delivery: 'progressive' },
      { url: 'https://example.test/audio.m4a', content_type: 'm4a-opus', delivery: 'progressive' },
    ],
  });

  assert.equal(media.url, 'https://example.test/audio.m4a');
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
