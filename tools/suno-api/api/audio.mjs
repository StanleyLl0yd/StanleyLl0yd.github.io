import { Readable } from 'node:stream';
import {
  UUID_RE,
  applyCors,
  deriveContentCipher,
  fetchClip,
  fetchEncryptedAudio,
  fetchRights,
  pickProgressiveAudio,
  rejectMethod,
  safeFilename,
} from '../lib/suno.mjs';

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  applyCors(req, res);
  res.setHeader('Cache-Control', 'private, no-store');

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
    const rights = await fetchRights(id);
    const upstream = await fetchEncryptedAudio(media, id);
    const decipher = deriveContentCipher(id, rights);

    const title = safeFilename(clip.title || `suno-${id}`);
    const contentType = String(media.content_type || '').toLowerCase().includes('mp3')
      ? 'audio/mpeg'
      : 'audio/mp4';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${title}.${contentType === 'audio/mpeg' ? 'mp3' : 'm4a'}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const contentLength = upstream.headers.get('content-length');
    if (contentLength && /^\d+$/.test(contentLength)) {
      res.setHeader('Content-Length', contentLength);
    }

    const source = Readable.fromWeb(upstream.body);
    source.on('error', (error) => {
      console.error('upstream_audio_error', error);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.end();
      } else {
        res.destroy(error);
      }
    });

    decipher.on('error', (error) => {
      console.error('audio_decrypt_error', error);
      res.destroy(error);
    });

    source.pipe(decipher).pipe(res);
  } catch (error) {
    console.error('audio_handler_error', error);
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : undefined);
      return;
    }

    const message = error instanceof Error ? error.message : 'unknown_error';
    res.statusCode =
      message === 'invalid_id' ? 400 :
      message === 'audio_unavailable' ? 404 :
      message.startsWith('clip_http_') ||
      message.startsWith('rights_http_') ||
      message.startsWith('media_http_') ? 502 : 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: message }));
  }
}
