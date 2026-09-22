(() => {
  'use strict';

  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
  const SUNO_HOSTS = new Set(['suno.com', 'www.suno.com']);
  const API_BASES = ['https://studio-api-prod.suno.com', 'https://studio-api.prod.suno.com'];
  const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

  const form = document.querySelector('#lookup-form');
  const urlInput = document.querySelector('#suno-url');
  const lookupButton = document.querySelector('#lookup-button');
  const statusBox = document.querySelector('#status');
  const trackCard = document.querySelector('#track-card');
  const titleEl = document.querySelector('#track-title');
  const metaEl = document.querySelector('#track-meta');
  const tagsEl = document.querySelector('#track-tags');
  const coverEl = document.querySelector('#cover');
  const downloadButton = document.querySelector('#download-button');
  const mediaNote = document.querySelector('#media-note');
  const progressWrap = document.querySelector('#progress-wrap');
  const progressEl = document.querySelector('#progress');
  const progressLabel = document.querySelector('#progress-label');
  const progressValue = document.querySelector('#progress-value');

  let currentClip = null;
  let resolverClip = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setBusy(true);
    trackCard.hidden = true;
    setStatus('Проверяю ссылку…');

    try {
      const normalized = normalizeSunoUrl(urlInput.value);
      urlInput.value = normalized.href;
      const clipId = await resolveClipId(normalized);
      setStatus('Получаю публичные данные трека…');

      if (resolverClip?.id === clipId) {
        currentClip = resolverClip;
      } else {
        try {
          currentClip = await fetchClip(clipId);
        } catch {
          setStatus('Suno не разрешает браузеру читать публичный API. Использую резервный resolver…');
          currentClip = await fetchClipWithFallback(clipId);
        }
      }

      renderClip(currentClip);
      setStatus('Готово. Выберите формат и скачайте файл.');
    } catch (error) {
      currentClip = null;
      setStatus(humanError(error), true);
    } finally {
      setBusy(false);
    }
  });

  downloadButton.addEventListener('click', async () => {
    if (!currentClip) return;
    const format = document.querySelector('input[name="format"]:checked')?.value || 'original';
    downloadButton.disabled = true;
    progressWrap.hidden = false;
    setProgress('Получаю аудио…', 0);

    try {
      const source = chooseSource(currentClip);
      if (!source) throw new Error('Для этого трека Suno не публикует доступный audio URL.');

      const audio = await fetchAudio(source.url);
      const kind = detectAudioKind(audio.bytes);
      if (!kind.playable) {
        throw new Error('Suno вернул защищённый или неизвестный поток. Сохранять его как аудиофайл нельзя.');
      }

      const baseName = safeFilename(currentClip.title || `suno-${currentClip.id}`);
      if (format === 'original') {
        setProgress('Сохраняю исходный файл…', 92);
        saveBlob(new Blob([audio.bytes], { type: kind.mime }), `${baseName}.${kind.ext}`);
      } else {
        if (format === 'mp3' && kind.ext === 'mp3') {
          setProgress('Сохраняю MP3 без перекодирования…', 92);
          saveBlob(new Blob([audio.bytes], { type: 'audio/mpeg' }), `${baseName}.mp3`);
          setProgress('Готово', 100);
          return;
        }
        const decoded = await decodeAudio(audio.bytes);
        if (format === 'wav') {
          setProgress('Создаю WAV…', 75);
          const wav = encodeWav(decoded);
          saveBlob(wav, `${baseName}.wav`);
        } else if (format === 'mp3') {
          if (!globalThis.lamejs?.Mp3Encoder) {
            throw new Error('MP3-кодек не загрузился. Обновите страницу и повторите попытку.');
          }
          const mp3 = encodeMp3(decoded, (pct) => setProgress('Создаю MP3…', 55 + Math.round(pct * .4)));
          saveBlob(mp3, `${baseName}.mp3`);
        }
      }
      setProgress('Готово', 100);
    } catch (error) {
      setStatus(humanError(error), true);
      progressWrap.hidden = true;
    } finally {
      downloadButton.disabled = false;
    }
  });

  function normalizeSunoUrl(raw) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('Вставьте ссылку Suno.');
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    let url;
    try { url = new URL(value); } catch { throw new Error('Некорректная ссылка.'); }
    if (url.protocol !== 'https:' || !SUNO_HOSTS.has(url.hostname.toLowerCase())) {
      throw new Error('Нужна HTTPS-ссылка именно с suno.com.');
    }
    const supported = /^\/(?:s|song|hook)\//i.test(url.pathname);
    if (!supported) throw new Error('Поддерживаются ссылки /s/…, /song/… и /hook/….');
    url.hash = '';
    return url;
  }

  async function resolveClipId(url) {
    const direct = url.href.match(UUID_RE)?.[0];
    if (direct) return direct.toLowerCase();

    const shareMatch = url.pathname.match(/^\/s\/([A-Za-z0-9_-]{6,32})\/?$/);
    if (!shareMatch) {
      throw new Error('Для этой ссылки не найден UUID трека. Используйте /s/<code> или /song/<uuid>.');
    }

    const shareCode = shareMatch[1];
    const shareUrl = `https://suno.com/s/${encodeURIComponent(shareCode)}`;

    for (const mode of ['cors', 'no-cors']) {
      try {
        const response = await fetch(shareUrl, {
          method: 'GET',
          redirect: 'follow',
          mode,
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer'
        });
        const resolved = response.url?.match(UUID_RE)?.[0];
        if (resolved) return resolved.toLowerCase();
      } catch {
        // GitHub Pages cannot normally read Suno's cross-origin redirect.
      }
    }

    setStatus('Suno блокирует чтение редиректа из браузера. Использую резервный resolver для короткой ссылки…');
    return resolveShortLinkWithFallback(shareCode);
  }

  async function resolveShortLinkWithFallback(shareCode) {
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(shareCode)) {
      throw new Error('Некорректный код короткой ссылки Suno.');
    }

    const canonicalShort = `https://suno.com/s/${encodeURIComponent(shareCode)}`;
    const resolverUrl = 'https://opensuno.vercel.app/track?url=' + encodeURIComponent(canonicalShort);

    let response;
    try {
      response = await fetch(resolverUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        referrerPolicy: 'no-referrer'
      });
    } catch {
      throw new Error('Не удалось обратиться к резервному resolver для короткой ссылки.');
    }

    if (!response.ok) {
      throw new Error(`Resolver короткой ссылки вернул HTTP ${response.status}.`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Resolver короткой ссылки вернул некорректный ответ.');
    }

    const resolved = String(payload?.data?.id || '').match(UUID_RE)?.[0];
    if (payload?.status !== 'ok' || !resolved) {
      throw new Error('Не удалось определить UUID по короткой ссылке Suno.');
    }

    const id = resolved.toLowerCase();
    resolverClip = normalizeResolverClip(payload.data, id);
    return id;
  }

  async function fetchClipWithFallback(id) {
    if (!UUID_RE.test(id)) throw new Error('Некорректный UUID трека Suno.');

    const canonicalSong = `https://suno.com/song/${encodeURIComponent(id)}`;
    const resolverUrl = 'https://opensuno.vercel.app/track?url=' + encodeURIComponent(canonicalSong);

    let response;
    try {
      response = await fetch(resolverUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        referrerPolicy: 'no-referrer'
      });
    } catch {
      throw new Error('Не удалось получить данные трека через резервный resolver.');
    }

    if (!response.ok) {
      throw new Error(`Resolver данных трека вернул HTTP ${response.status}.`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Resolver данных трека вернул некорректный ответ.');
    }

    const resolved = String(payload?.data?.id || '').match(UUID_RE)?.[0]?.toLowerCase();
    if (payload?.status !== 'ok' || resolved !== id.toLowerCase()) {
      throw new Error('Resolver вернул данные другого или неизвестного трека.');
    }

    resolverClip = normalizeResolverClip(payload.data, resolved);
    return resolverClip;
  }

  function normalizeResolverClip(data, id) {
    const cover = isTrustedSunoMediaUrl(data?.cover_url) ? data.cover_url : '';
    const duration = Number(data?.duration);

    return {
      id,
      title: typeof data?.title === 'string' && data.title.trim() ? data.title.trim() : `Suno ${id.slice(0, 8)}`,
      display_name: typeof data?.artist === 'string' && data.artist.trim() ? data.artist.trim() : 'Suno',
      image_url: cover,
      metadata: {
        duration: Number.isFinite(duration) && duration > 0 ? duration : null,
        tags: ''
      },
      media_urls: [{
        url: `https://opensuno.vercel.app/download/${encodeURIComponent(id)}`,
        content_type: 'mp3',
        delivery: 'resolver-proxy'
      }],
      resolver_fallback: true
    };
  }

  async function fetchClip(id) {
    let lastError = null;
    for (const base of API_BASES) {
      try {
        const response = await fetch(`${base}/api/clip/${encodeURIComponent(id)}`, {
          credentials: 'omit',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          referrerPolicy: 'no-referrer'
        });
        if (!response.ok) throw new Error(`Suno API: HTTP ${response.status}`);
        const data = await response.json();
        if (!data || typeof data !== 'object' || !data.id) throw new Error('Suno API вернул некорректные данные.');
        if (data.is_public === false) throw new Error('Трек не опубликован публично.');
        return data;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Не удалось прочитать публичные данные Suno${lastError?.message ? `: ${lastError.message}` : '.'}`);
  }

  function renderClip(clip) {
    const duration = Number(clip.metadata?.duration);
    const author = clip.display_name || clip.handle || 'Suno';
    titleEl.textContent = clip.title || 'Untitled';
    metaEl.textContent = [author, Number.isFinite(duration) ? formatDuration(duration) : null, clip.major_model_version || null].filter(Boolean).join(' · ');
    tagsEl.textContent = clip.metadata?.tags || '';

    const cover = clip.image_large_url || clip.image_url;
    if (cover && isHttpsUrl(cover)) {
      coverEl.src = cover;
      coverEl.alt = `Обложка: ${clip.title || 'Suno track'}`;
      coverEl.hidden = false;
    } else {
      coverEl.removeAttribute('src');
      coverEl.hidden = true;
    }

    const source = chooseSource(clip);
    mediaNote.textContent = source
      ? `Источник: ${source.contentType || source.content_type || 'audio'}${source.delivery ? ` · ${source.delivery}` : ''}. Файл проверяется перед сохранением.`
      : 'Suno не опубликовал audio URL для этого трека.';
    trackCard.hidden = false;
  }

  function chooseSource(clip) {
    const candidates = [];
    for (const item of Array.isArray(clip.media_urls) ? clip.media_urls : []) {
      if (item?.url && isHttpsUrl(item.url)) candidates.push({ ...item, score: sourceScore(item) });
    }
    if (clip.audio_url && isHttpsUrl(clip.audio_url) && !/\/api\/forbidden(?:$|\?)/.test(clip.audio_url)) {
      candidates.push({ url: clip.audio_url, contentType: 'mp3', delivery: 'progressive', score: 90 });
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }

  function sourceScore(item) {
    const type = String(item.content_type || '').toLowerCase();
    const delivery = String(item.delivery || '').toLowerCase();
    let score = delivery === 'progressive' ? 30 : 0;
    if (type.includes('mp3')) score += 70;
    else if (type.includes('m4a') || type.includes('aac') || type.includes('opus')) score += 60;
    else score += 10;
    return score;
  }

  async function fetchAudio(url) {
    const response = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    });
    if (!response.ok) throw new Error(`Не удалось получить аудио: HTTP ${response.status}.`);
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES) throw new Error('Аудиофайл слишком большой для обработки в браузере.');

    const reader = response.body?.getReader();
    if (!reader) {
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > MAX_AUDIO_BYTES) throw new Error('Аудиофайл слишком большой для обработки в браузере.');
      return { bytes };
    }

    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_AUDIO_BYTES) {
        reader.cancel();
        throw new Error('Аудиофайл слишком большой для обработки в браузере.');
      }
      chunks.push(value);
      const pct = declared > 0 ? Math.min(50, Math.round((received / declared) * 50)) : Math.min(45, Math.round(received / 300000));
      setProgress('Получаю аудио…', pct);
    }
    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
    return { bytes: merged.buffer };
  }

  function detectAudioKind(buffer) {
    const b = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 64));
    const ascii = (from, len) => String.fromCharCode(...b.slice(from, from + len));
    if (ascii(0, 3) === 'ID3') return { playable: true, ext: 'mp3', mime: 'audio/mpeg' };
    if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0) return { playable: true, ext: 'mp3', mime: 'audio/mpeg' };
    if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return { playable: true, ext: 'aac', mime: 'audio/aac' };
    if (b.length >= 12 && ascii(4, 4) === 'ftyp') return { playable: true, ext: 'm4a', mime: 'audio/mp4' };
    if (ascii(0, 4) === 'OggS') return { playable: true, ext: 'ogg', mime: 'audio/ogg' };
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { playable: true, ext: 'webm', mime: 'audio/webm' };
    if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return { playable: true, ext: 'wav', mime: 'audio/wav' };

    return { playable: false, ext: 'bin', mime: 'application/octet-stream' };
  }

  async function decodeAudio(arrayBuffer) {
    setProgress('Декодирую аудио…', 55);
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) throw new Error('Этот браузер не поддерживает декодирование аудио.');
    const ctx = new AudioCtx();
    try {
      return await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      throw new Error('Браузер не смог декодировать исходный аудиопоток.');
    } finally {
      await ctx.close().catch(() => {});
    }
  }

  function encodeWav(audioBuffer) {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const sampleRate = audioBuffer.sampleRate;
    const frames = audioBuffer.length;
    const bytesPerSample = 2;
    const dataSize = frames * channels * bytesPerSample;
    const out = new ArrayBuffer(44 + dataSize);
    const view = new DataView(out);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const data = Array.from({ length: channels }, (_, i) => audioBuffer.getChannelData(i));
    let offset = 44;
    for (let i = 0; i < frames; i++) {
      for (let ch = 0; ch < channels; ch++) {
        const sample = Math.max(-1, Math.min(1, data[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([out], { type: 'audio/wav' });
  }

  function encodeMp3(audioBuffer, onProgress) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const encoder = new globalThis.lamejs.Mp3Encoder(channels, sampleRate, 192);
    const left = floatTo16(audioBuffer.getChannelData(0));
    const right = channels > 1 ? floatTo16(audioBuffer.getChannelData(1)) : null;
    const blockSize = 1152;
    const chunks = [];
    for (let i = 0; i < left.length; i += blockSize) {
      const l = left.subarray(i, i + blockSize);
      const encoded = channels > 1 ? encoder.encodeBuffer(l, right.subarray(i, i + blockSize)) : encoder.encodeBuffer(l);
      if (encoded.length) chunks.push(new Int8Array(encoded));
      if ((i / blockSize) % 64 === 0) onProgress?.(i / left.length * 100);
    }
    const end = encoder.flush();
    if (end.length) chunks.push(new Int8Array(end));
    onProgress?.(100);
    return new Blob(chunks, { type: 'audio/mpeg' });
  }

  function floatTo16(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  function writeAscii(view, offset, text) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }

  function saveBlob(blob, filename) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  }

  function safeFilename(value) {
    return String(value || 'suno-track').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 120) || 'suno-track';
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const min = Math.floor(total / 60);
    const sec = String(total % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  function isHttpsUrl(value) {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }

  function isTrustedSunoMediaUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (
        url.hostname === 'cdn1.suno.ai' ||
        url.hostname === 'cdn2.suno.ai' ||
        url.hostname.endsWith('.suno.ai') ||
        url.hostname.endsWith('.suno.com') ||
        url.hostname.endsWith('.cloudfront.net')
      );
    } catch {
      return false;
    }
  }

  function setBusy(value) {
    lookupButton.disabled = value;
    lookupButton.textContent = value ? 'Проверяю…' : 'Открыть';
  }

  function setStatus(message, error = false) {
    statusBox.hidden = false;
    statusBox.textContent = message;
    statusBox.classList.toggle('error', error);
  }

  function setProgress(label, value) {
    progressLabel.textContent = label;
    progressEl.value = Math.max(0, Math.min(100, value));
    progressValue.textContent = `${Math.round(progressEl.value)}%`;
  }

  function humanError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message || 'Неизвестная ошибка.';
  }

  const qs = new URLSearchParams(location.search);
  const prefill = qs.get('url');
  if (prefill) urlInput.value = prefill;
})();
