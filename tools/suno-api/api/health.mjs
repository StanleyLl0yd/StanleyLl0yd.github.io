import {
  applyApiHeaders,
  applyCors,
  rejectMethod,
} from '../lib/suno.mjs';

export default function handler(req, res) {
  if (rejectMethod(req, res)) return;
  applyCors(req, res);
  applyApiHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, service: 'suno-saver-api', version: 2 }));
}
