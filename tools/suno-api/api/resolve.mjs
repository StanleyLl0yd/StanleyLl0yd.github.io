import {
  applyApiHeaders,
  applyCors,
  fetchClip,
  publicClipMetadata,
  publicErrorCode,
  rejectMethod,
  requireFrontendOrigin,
  resolveTrackId,
  statusForError,
} from '../lib/suno.mjs';

export default async function handler(req, res) {
  if (rejectMethod(req, res)) return;
  applyCors(req, res);
  applyApiHeaders(res);
  if (!requireFrontendOrigin(req, res)) return;

  try {
    const id = await resolveTrackId(req.query?.url);
    const clip = await fetchClip(id);
    const result = publicClipMetadata(clip);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result));
  } catch (error) {
    const code = publicErrorCode(error);
    const status = statusForError(code);
    if (status >= 500) console.error('resolve_handler_error', error);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: code }));
  }
}
