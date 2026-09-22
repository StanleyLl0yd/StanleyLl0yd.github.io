import crypto from 'node:crypto';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SUNO_HOSTS = new Set(['suno.com', 'www.suno.com']);
const CLIP_API = 'https://studio-api.prod.suno.com/api/clip';
const RIGHTS_API = 'https://studio-api.prod.suno.com/api/mango/rights';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const BASE_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://suno.com',
};

function requestHeaders(id, extra = {}) {
  return {
    ...BASE_HEADERS,
    Referer: id ? `https://suno.com/song/${id}` : 'https://suno.com/',
    ...extra,
  };
}

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin === 'https://stanleyll0yd.github.io') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function rejectMethod(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.statusCode = 204;
    res.end();
    return true;
  }
  if (req.method !== 'GET') {
    applyCors(req, res);
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end('Method Not Allowed');
    return true;
  }
  return false;
}

export function parsePublicSunoUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) throw new Error('missing_url');
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('invalid_url');
  }

  if (url.protocol !== 'https:' || !SUNO_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('unsupported_url');
  }

  if (!/^\/(?:s|song|hook)\//i.test(url.pathname)) {
    throw new Error('unsupported_url');
  }

  url.hash = '';
  return url;
}

function findUuid(value) {
  const match = String(value || '').match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  return match?.[0]?.toLowerCase() || null;
}

export function extractSongIdFromLocation(location, base = 'https://suno.com') {
  if (!location) return null;

  let target;
  try {
    target = new URL(String(location), base);
  } catch {
    return null;
  }

  if (target.protocol !== 'https:' || !SUNO_HOSTS.has(target.hostname.toLowerCase())) {
    return null;
  }

  const match = target.pathname.match(
    /^\/(?:song|hook)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/|$)/i,
  );
  const id = match?.[1]?.toLowerCase() || null;
  return id && UUID_RE.test(id) ? id : null;
}

function extractSongIdFromHtml(html) {
  const match = String(html || '').match(
    /(?:https:\/\/(?:www\.)?suno\.com)?\/(?:song|hook)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?=[/?\"'\\s<]|$)/i,
  );
  const id = match?.[1]?.toLowerCase() || null;
  return id && UUID_RE.test(id) ? id : null;
}

export async function resolveTrackId(raw) {
  const url = parsePublicSunoUrl(raw);
  const direct = extractSongIdFromLocation(url.href);
  if (direct) return direct;

  const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

  for (const method of ['HEAD', 'GET']) {
    const response = await fetch(url.href, {
      method,
      redirect: 'manual',
      headers: requestHeaders(null, { Accept: accept }),
    });

    if (response.status >= 300 && response.status < 400) {
      const redirected = extractSongIdFromLocation(response.headers.get('location'), url.href);
      await response.body?.cancel().catch(() => {});
      if (redirected) return redirected;

      // HEAD behavior occasionally differs from GET on Suno's share endpoint,
      // so give GET one chance before rejecting an unusable redirect such as "/".
      if (method === 'HEAD') continue;
      throw new Error('track_id_not_found');
    }

    if (method === 'HEAD' && (response.ok || response.status === 405)) {
      await response.body?.cancel().catch(() => {});
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      if (method === 'HEAD') continue;
      throw new Error(`share_http_${response.status}`);
    }

    const html = await response.text();
    if (html.length > 3 * 1024 * 1024) throw new Error('share_page_too_large');

    const discovered = extractSongIdFromHtml(html);
    if (!discovered) throw new Error('track_id_not_found');
    return discovered;
  }

  throw new Error('track_id_not_found');
}

export async function fetchClip(id) {
  if (!UUID_RE.test(id)) throw new Error('invalid_id');

  const response = await fetch(`${CLIP_API}/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: requestHeaders(id),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`clip_http_${response.status}`);
  }

  const clip = await response.json();
  if (!clip || typeof clip !== 'object' || String(clip.id || '').toLowerCase() !== id.toLowerCase()) {
    throw new Error('clip_invalid');
  }

  return clip;
}

export function pickProgressiveAudio(clip) {
  const entries = Array.isArray(clip?.media_urls) ? clip.media_urls : [];
  const candidates = entries
    .filter((item) => item && typeof item.url === 'string' && /^https:\/\//i.test(item.url))
    .filter((item) => {
      const delivery = String(item.delivery || '').toLowerCase();
      return !delivery || delivery === 'progressive';
    })
    .filter((item) => {
      const type = String(item.content_type || '').toLowerCase();
      return !type.startsWith('video') && type !== 'mp4';
    })
    .map((item) => {
      const type = String(item.content_type || '').toLowerCase();
      let score = 0;
      if (type.includes('m4a-opus')) score += 100;
      else if (type.includes('m4a') || type.includes('opus')) score += 90;
      else if (type.includes('aac')) score += 80;
      else if (type.includes('mp3') || type.includes('mpeg')) score += 70;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) return candidates[0];

  const legacy = typeof clip?.audio_url === 'string' ? clip.audio_url : '';
  if (/^https:\/\//i.test(legacy) && !/\/api\/forbidden(?:$|\?)/i.test(legacy)) {
    return { url: legacy, content_type: 'audio/mpeg', delivery: 'progressive', score: 10 };
  }

  throw new Error('audio_unavailable');
}

export function publicClipMetadata(clip) {
  const duration = Number(clip?.metadata?.duration);
  const media = pickProgressiveAudio(clip);
  return {
    id: String(clip.id).toLowerCase(),
    title: String(clip.title || '').trim() || 'Untitled',
    artist: String(clip.display_name || clip.handle || '').trim() || 'Suno',
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    tags: String(clip?.metadata?.tags || '').trim(),
    model: String(clip.major_model_version || '').trim(),
    image:
      String(clip.image_large_url || clip.image_url || '').startsWith('https://')
        ? String(clip.image_large_url || clip.image_url)
        : '',
    media: {
      contentType: String(media.content_type || 'audio').toLowerCase(),
      delivery: String(media.delivery || 'progressive').toLowerCase(),
      originalExtension: mediaExtension(media),
    },
  };
}

function mediaExtension(media) {
  const type = String(media?.content_type || '').toLowerCase();
  if (type.includes('m4a') || type.includes('opus') || type.includes('mp4')) return 'm4a';
  if (type.includes('aac')) return 'aac';
  if (type.includes('mp3') || type.includes('mpeg')) return 'mp3';

  try {
    const path = new URL(media.url).pathname.toLowerCase();
    const match = path.match(/\.(m4a|aac|mp3|ogg|webm)$/);
    return match?.[1] || 'm4a';
  } catch {
    return 'm4a';
  }
}

export async function fetchRights(id) {
  if (!UUID_RE.test(id)) throw new Error('invalid_id');

  const response = await fetch(RIGHTS_API, {
    method: 'POST',
    headers: requestHeaders(id, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      content_params: {
        content_id: id,
        content_type: 'clip',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`rights_http_${response.status}`);
  }

  const data = await response.json();
  if (!data?.key || !data?.iv || !data?.glt) {
    throw new Error('rights_invalid');
  }
  return data;
}

function decodeBase64(value) {
  let normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4) normalized += '=';
  return Buffer.from(normalized, 'base64');
}

export function unwrapRightsValue(wrappedB64, clipId, userKey) {
  const wrapped = decodeBase64(wrappedB64);
  if (wrapped.length < 29) throw new Error('wrapped_value_invalid');

  const nonce = wrapped.subarray(0, 12);
  const ciphertext = wrapped.subarray(12, -16);
  const tag = wrapped.subarray(-16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', userKey, nonce);
  decipher.setAAD(Buffer.from(clipId, 'utf8'));
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function deriveContentCipher(id, rights) {
  const userKey = crypto.createHash('sha256').update(String(rights.glt), 'utf8').digest();
  const key = unwrapRightsValue(rights.key, id, userKey);
  const counter = unwrapRightsValue(rights.iv, id, userKey);

  if (![16, 24, 32].includes(key.length) || counter.length !== 16) {
    throw new Error('content_cipher_invalid');
  }

  const algorithm = `aes-${key.length * 8}-ctr`;
  return crypto.createDecipheriv(algorithm, key, counter);
}

export async function fetchEncryptedAudio(media, id) {
  const response = await fetch(media.url, {
    method: 'GET',
    headers: requestHeaders(id, {
      Accept: 'audio/*,*/*;q=0.8',
    }),
    redirect: 'follow',
  });

  if (!response.ok || !response.body) {
    throw new Error(`media_http_${response.status}`);
  }

  return response;
}

export function safeFilename(value) {
  return (
    String(value || 'suno-track')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      .replace(/[. ]+$/g, '')
      .trim()
      .slice(0, 120) || 'suno-track'
  );
}
