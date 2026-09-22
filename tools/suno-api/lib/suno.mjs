import crypto from 'node:crypto';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const FRONTEND_ORIGIN = 'https://stanleyll0yd.github.io';
export const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

const SUNO_HOSTS = new Set(['suno.com', 'www.suno.com']);
const CLIP_API = 'https://studio-api.prod.suno.com/api/clip';
const RIGHTS_API = 'https://studio-api.prod.suno.com/api/mango/rights';

const SHARE_PATH_RE = /^\/s\/[A-Za-z0-9_-]{6,64}\/?$/;
const SONG_PATH_RE = /^\/song\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/?$/i;
const HOOK_PATH_RE = /^\/hook\/(?:[A-Za-z0-9_-]{6,64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;

const MAX_INPUT_URL_LENGTH = 2048;
const MAX_SHARE_HTML_BYTES = 3 * 1024 * 1024;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const SHARE_TIMEOUT_MS = 5000;
const API_TIMEOUT_MS = 8000;
const MEDIA_TIMEOUT_MS = 45000;
const MAX_MEDIA_REDIRECTS = 3;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const BASE_HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://suno.com',
};

const SAFE_ERROR_CODES = new Set([
  'missing_url',
  'invalid_url',
  'unsupported_url',
  'track_id_not_found',
  'share_page_too_large',
  'invalid_id',
  'clip_invalid',
  'audio_unavailable',
  'rights_invalid',
  'wrapped_value_invalid',
  'content_cipher_invalid',
  'media_untrusted',
  'media_redirect_invalid',
  'media_redirect_untrusted',
  'media_too_many_redirects',
  'media_too_large',
]);

const SAFE_ERROR_PREFIXES = [
  'share_http_',
  'share_timeout',
  'share_network',
  'clip_http_',
  'clip_timeout',
  'clip_network',
  'rights_http_',
  'rights_timeout',
  'rights_network',
  'media_http_',
  'media_timeout',
  'media_network',
];

function requestHeaders(id, extra = {}) {
  return {
    ...BASE_HEADERS,
    Referer: id ? 'https://suno.com/song/' + id : 'https://suno.com/',
    ...extra,
  };
}

function isTimeoutError(error) {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError';
}

async function fetchWithTimeout(url, options, timeoutMs, errorPrefix) {
  try {
    return await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(errorPrefix + '_timeout');
    }
    throw new Error(errorPrefix + '_network');
  }
}

async function readTextLimited(response, limit, errorCode) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) {
    throw new Error(errorCode);
  }

  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > limit) {
      await reader.cancel().catch(() => {});
      throw new Error(errorCode);
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

async function readJsonLimited(response, invalidCode) {
  const text = await readTextLimited(response, MAX_JSON_BYTES, invalidCode);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(invalidCode);
  }
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function hostMatches(hostname, base) {
  return hostname === base || hostname.endsWith('.' + base);
}

export function isTrustedMediaUrl(value) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch {
    return false;
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port
  ) {
    return false;
  }

  const host = url.hostname.toLowerCase();
  return (
    hostMatches(host, 'suno.ai') ||
    hostMatches(host, 'cloudfront.net')
  );
}

export function applyApiHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

export function applyCors(req, res) {
  const origin = String(req.headers.origin || '');
  res.setHeader('Vary', 'Origin');

  if (origin === FRONTEND_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function rejectMethod(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    applyApiHeaders(res);
    res.statusCode = 204;
    res.end();
    return true;
  }

  if (req.method !== 'GET') {
    applyCors(req, res);
    applyApiHeaders(res);
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end('Method Not Allowed');
    return true;
  }

  return false;
}

export function requireFrontendOrigin(req, res) {
  if (String(req.headers.origin || '') === FRONTEND_ORIGIN) {
    return true;
  }

  applyCors(req, res);
  applyApiHeaders(res);
  res.statusCode = 403;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'untrusted_origin' }));
  return false;
}

export function parsePublicSunoUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) throw new Error('missing_url');
  if (value.length > MAX_INPUT_URL_LENGTH) throw new Error('invalid_url');
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('invalid_url');
  }

  if (
    url.protocol !== 'https:' ||
    !SUNO_HOSTS.has(url.hostname.toLowerCase()) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error('unsupported_url');
  }

  if (
    !SHARE_PATH_RE.test(url.pathname) &&
    !SONG_PATH_RE.test(url.pathname) &&
    !HOOK_PATH_RE.test(url.pathname)
  ) {
    throw new Error('unsupported_url');
  }

  url.hash = '';
  return url;
}

export function extractSongIdFromLocation(location, base = 'https://suno.com') {
  if (!location) return null;

  let target;
  try {
    target = new URL(String(location), base);
  } catch {
    return null;
  }

  if (
    target.protocol !== 'https:' ||
    !SUNO_HOSTS.has(target.hostname.toLowerCase()) ||
    target.username ||
    target.password ||
    target.port
  ) {
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
    /(?:https:\/\/(?:www\.)?suno\.com)?\/(?:song|hook)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?=[/?"'\s<]|$)/i,
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
    let response;
    try {
      response = await fetchWithTimeout(
        url.href,
        {
          method,
          redirect: 'manual',
          headers: requestHeaders(null, { Accept: accept }),
        },
        SHARE_TIMEOUT_MS,
        'share',
      );
    } catch (error) {
      if (method === 'HEAD') continue;
      throw error;
    }

    if (response.status >= 300 && response.status < 400) {
      const redirected = extractSongIdFromLocation(response.headers.get('location'), url.href);
      await response.body?.cancel().catch(() => {});
      if (redirected) return redirected;

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
      throw new Error('share_http_' + response.status);
    }

    let html;
    try {
      html = await readTextLimited(response, MAX_SHARE_HTML_BYTES, 'share_page_too_large');
    } catch (error) {
      if (error instanceof Error && error.message === 'share_page_too_large') throw error;
      if (isTimeoutError(error)) throw new Error('share_timeout');
      throw new Error('share_network');
    }

    const discovered = extractSongIdFromHtml(html);
    if (!discovered) throw new Error('track_id_not_found');
    return discovered;
  }

  throw new Error('track_id_not_found');
}

export async function fetchClip(id) {
  if (!UUID_RE.test(id)) throw new Error('invalid_id');

  const response = await fetchWithTimeout(
    CLIP_API + '/' + encodeURIComponent(id),
    {
      method: 'GET',
      headers: requestHeaders(id),
      redirect: 'error',
    },
    API_TIMEOUT_MS,
    'clip',
  );

  if (!response.ok) {
    throw new Error('clip_http_' + response.status);
  }

  let clip;
  try {
    clip = await readJsonLimited(response, 'clip_invalid');
  } catch (error) {
    if (error instanceof Error && error.message === 'clip_invalid') throw error;
    if (isTimeoutError(error)) throw new Error('clip_timeout');
    throw new Error('clip_network');
  }

  if (!clip || typeof clip !== 'object' || String(clip.id || '').toLowerCase() !== id.toLowerCase()) {
    throw new Error('clip_invalid');
  }

  return clip;
}

function mediaScore(item) {
  const type = String(item?.content_type || '').toLowerCase();

  if (type.includes('m4a-opus')) return 100;
  if (type.includes('m4a') || type === 'audio/mp4') return 90;
  if (type.includes('opus') || type.includes('ogg')) return 85;
  if (type.includes('aac')) return 80;
  if (type.includes('mp3') || type.includes('mpeg')) return 70;
  if (type.includes('webm')) return 65;
  return -1;
}

export function mediaDescriptor(media) {
  const type = String(media?.content_type || '').toLowerCase();
  let extension = 'm4a';
  let mime = 'audio/mp4';

  if (type.includes('mp3') || type.includes('mpeg')) {
    extension = 'mp3';
    mime = 'audio/mpeg';
  } else if (type.includes('aac')) {
    extension = 'aac';
    mime = 'audio/aac';
  } else if (type.includes('ogg')) {
    extension = 'ogg';
    mime = 'audio/ogg';
  } else if (type.includes('webm')) {
    extension = 'webm';
    mime = 'audio/webm';
  }

  const encrypted =
    type.includes('m4a-opus') ||
    (Boolean(media?.encoding) && (type.includes('m4a') || type.includes('opus')));

  return { extension, mime, encrypted };
}

export function pickProgressiveAudio(clip) {
  const entries = Array.isArray(clip?.media_urls) ? clip.media_urls : [];
  const candidates = entries
    .filter((item) => item && typeof item.url === 'string' && isTrustedMediaUrl(item.url))
    .filter((item) => {
      const delivery = String(item.delivery || '').toLowerCase();
      return !delivery || delivery === 'progressive';
    })
    .map((item) => ({ ...item, score: mediaScore(item) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) return candidates[0];

  const legacy = typeof clip?.audio_url === 'string' ? clip.audio_url : '';
  if (
    isTrustedMediaUrl(legacy) &&
    !/\/api\/forbidden(?:$|\?)/i.test(legacy)
  ) {
    return {
      url: legacy,
      content_type: 'audio/mpeg',
      delivery: 'progressive',
      score: 10,
    };
  }

  throw new Error('audio_unavailable');
}

export function publicClipMetadata(clip) {
  const duration = Number(clip?.metadata?.duration);
  const media = pickProgressiveAudio(clip);
  const descriptor = mediaDescriptor(media);
  const rawImage = String(clip.image_large_url || clip.image_url || '');
  const trustedImage = (() => {
    if (isTrustedMediaUrl(rawImage)) return rawImage;
    try {
      const url = new URL(rawImage);
      const host = url.hostname.toLowerCase();
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !url.port &&
        hostMatches(host, 'suno.com')
      ) ? rawImage : '';
    } catch {
      return '';
    }
  })();

  return {
    id: String(clip.id).toLowerCase(),
    title: cleanText(clip.title, 200) || 'Untitled',
    artist: cleanText(clip.display_name || clip.handle, 200) || 'Suno',
    duration:
      Number.isFinite(duration) && duration > 0 && duration <= 24 * 60 * 60
        ? duration
        : null,
    tags: cleanText(clip?.metadata?.tags, 2000),
    model: cleanText(clip.major_model_version, 100),
    image: trustedImage,
    media: {
      contentType: cleanText(media.content_type || 'audio', 100).toLowerCase(),
      delivery: cleanText(media.delivery || 'progressive', 50).toLowerCase(),
      originalExtension: descriptor.extension,
      encrypted: descriptor.encrypted,
    },
  };
}

export async function fetchRights(id) {
  if (!UUID_RE.test(id)) throw new Error('invalid_id');

  const response = await fetchWithTimeout(
    RIGHTS_API,
    {
      method: 'POST',
      headers: requestHeaders(id, {
        'Content-Type': 'application/json',
      }),
      redirect: 'error',
      body: JSON.stringify({
        content_params: {
          content_id: id,
          content_type: 'clip',
        },
      }),
    },
    API_TIMEOUT_MS,
    'rights',
  );

  if (!response.ok) {
    throw new Error('rights_http_' + response.status);
  }

  let data;
  try {
    data = await readJsonLimited(response, 'rights_invalid');
  } catch (error) {
    if (error instanceof Error && error.message === 'rights_invalid') throw error;
    if (isTimeoutError(error)) throw new Error('rights_timeout');
    throw new Error('rights_network');
  }

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

  return crypto.createDecipheriv('aes-' + key.length * 8 + '-ctr', key, counter);
}

export async function fetchEncryptedAudio(media, id) {
  if (!isTrustedMediaUrl(media?.url)) {
    throw new Error('media_untrusted');
  }

  let currentUrl = new URL(media.url);
  const signal = AbortSignal.timeout(MEDIA_TIMEOUT_MS);

  for (let redirectCount = 0; redirectCount <= MAX_MEDIA_REDIRECTS; redirectCount += 1) {
    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: requestHeaders(id, {
          Accept: 'audio/*,*/*;q=0.8',
        }),
        redirect: 'manual',
        signal,
      });
    } catch (error) {
      if (isTimeoutError(error)) throw new Error('media_timeout');
      throw new Error('media_network');
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel().catch(() => {});
      if (!location) throw new Error('media_redirect_invalid');

      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch {
        throw new Error('media_redirect_invalid');
      }

      if (!isTrustedMediaUrl(nextUrl.href)) {
        throw new Error('media_redirect_untrusted');
      }

      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok || !response.body) {
      throw new Error('media_http_' + response.status);
    }

    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES) {
      await response.body.cancel().catch(() => {});
      throw new Error('media_too_large');
    }

    return response;
  }

  throw new Error('media_too_many_redirects');
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

function encodeRfc5987(value) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) =>
    '%' + char.charCodeAt(0).toString(16).toUpperCase()
  );
}

export function contentDisposition(title, extension) {
  const safeTitle = safeFilename(title);
  const safeExtension = String(extension || 'bin').replace(/[^A-Za-z0-9]/g, '') || 'bin';
  const unicodeName = safeTitle + '.' + safeExtension;
  const asciiName =
    safeTitle.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') + '.' + safeExtension;

  return (
    'inline; filename="' +
    asciiName +
    '"; filename*=UTF-8\'\'' +
    encodeRfc5987(unicodeName)
  );
}

export function publicErrorCode(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  if (SAFE_ERROR_CODES.has(message)) return message;
  if (SAFE_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix))) return message;
  return 'internal_error';
}

export function statusForError(code) {
  if (
    code === 'missing_url' ||
    code === 'invalid_url' ||
    code === 'unsupported_url' ||
    code === 'track_id_not_found' ||
    code === 'invalid_id'
  ) {
    return 400;
  }

  if (code === 'untrusted_origin') return 403;
  if (code === 'audio_unavailable') return 404;
  if (code === 'media_too_large') return 413;
  if (code.endsWith('_timeout')) return 504;

  if (
    code === 'share_page_too_large' ||
    code === 'clip_invalid' ||
    code === 'rights_invalid' ||
    code === 'wrapped_value_invalid' ||
    code === 'content_cipher_invalid' ||
    code === 'media_untrusted' ||
    code === 'media_redirect_invalid' ||
    code === 'media_redirect_untrusted' ||
    code === 'media_too_many_redirects' ||
    code.includes('_http_') ||
    code.endsWith('_network')
  ) {
    return 502;
  }

  return 500;
}
