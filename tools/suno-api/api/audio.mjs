import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  MAX_AUDIO_BYTES,
  UUID_RE,
  applyApiHeaders,
  applyCors,
  contentDisposition,
  deriveContentCipher,
  fetchClip,
  fetchEncryptedAudio,
  fetchRights,
  mediaDescriptor,
  pickProgressiveAudio,
  publicErrorCode,
  rejectMethod,
  requireFrontendOrigin,
  statusForError,
} from '../lib/suno.mjs';

function createByteLimiter(limit) {
  let total = 0;

  return new Transform({
    transform(chunk, _encoding, callback) {
      total += chunk.length;
      if (total > limit) {
        callback(new Error('media_too_large'));
        return;
      }
      callback(null, chunk);
    },
  });
}

function isExpectedClientDisconnect(error) {
  return (
    error?.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    error?.code === 'ECONNRESET'
  );
}

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  applyCors(req, res);
  applyApiHeaders(res);
  if (!requireFrontendOrigin(req, res)) return;

  const id = String(req.query?.id || '').toLowerCase();
  if (!UUID_RE.test(id)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'invalid_id' }));
    return;
  }

  try {
    const clip = await fetchClip(id);
    const media = pickProgressiveAudio(clip);
    const descriptor = mediaDescriptor(media);
    const upstream = await fetchEncryptedAudio(media, id);
    const transforms = [Readable.fromWeb(upstream.body), createByteLimiter(MAX_AUDIO_BYTES)];

    if (descriptor.encrypted) {
      const rights = await fetchRights(id);
      transforms.push(deriveContentCipher(id, rights));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', descriptor.mime);
    res.setHeader('Content-Disposition', contentDisposition(clip.title || 'suno-' + id, descriptor.extension));

    const contentLength = upstream.headers.get('content-length');
    if (
      contentLength &&
      /^\d+$/.test(contentLength) &&
      Number(contentLength) <= MAX_AUDIO_BYTES
    ) {
      res.setHeader('Content-Length', contentLength);
    }

    transforms.push(res);
    await pipeline(...transforms);
  } catch (error) {
    if (isExpectedClientDisconnect(error)) return;

    console.error('audio_handler_error', error);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }

    const code = publicErrorCode(error);
    res.statusCode = statusForError(code);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: code }));
  }
}
