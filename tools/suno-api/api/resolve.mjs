import {
  applyCors,
  fetchClip,
  publicClipMetadata,
  rejectMethod,
  resolveTrackId,
} from '../lib/suno.mjs';

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  applyCors(req, res);
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const id = await resolveTrackId(req.query?.url);
    const clip = await fetchClip(id);
    const result = publicClipMetadata(clip);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    const status =
      message === 'missing_url' ||
      message === 'invalid_url' ||
      message === 'unsupported_url' ||
      message === 'track_id_not_found'
        ? 400
        : message.startsWith('clip_http_') || message.startsWith('share_http_')
          ? 502
          : 500;

    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: message }));
  }
}
