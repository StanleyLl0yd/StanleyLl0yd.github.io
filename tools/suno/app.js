(() => {
  'use strict';

  const SUNO_HOSTS = new Set(['suno.com', 'www.suno.com']);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const SHARE_PATH_RE = /^\/(?:s)\/[A-Za-z0-9_-]{6,64}\/?$/;
  const SONG_PATH_RE = /^\/song\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/?$/i;
  const HOOK_PATH_RE = /^\/hook\/(?:[A-Za-z0-9_-]{6,64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;
  const MAX_INPUT_URL_LENGTH = 2048;
  const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
  const apiMeta = document.querySelector('meta[name="suno-saver-api"]');
  const API_BASE = String(apiMeta?.content || '').replace(/\/$/, '');

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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setBusy(true);
    trackCard.hidden = true;
    progressWrap.hidden = true;
    setStatus('Проверяю ссылку…');

    try {
      ensureApiConfigured();
      const normalized = normalizeSunoUrl(urlInput.value);
      urlInput.value = normalized.href;
      setStatus('Получаю данные трека…');
      currentClip = await resolveTrack(normalized.href);
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
    const clip = currentClip;
    const format = document.querySelector('input[name="format"]:checked')?.value || 'original';
    setDownloadBusy(true);
    progressWrap.hidden = false;
    setStatus('Получаю аудио…');
    setProgress('Получаю оригинальный поток…', 0);

    try {
      ensureApiConfigured();
      const audio = await fetchAudio(
        `${API_BASE}/api/audio?id=${encodeURIComponent(clip.id)}`
      );
      const kind = detectAudioKind(audio.bytes);
      if (!kind.playable) {
        throw new Error('Backend вернул неподдерживаемый аудиопоток.');
      }

      const baseName = safeFilename(clip.title || `suno-${clip.id}`);
      if (format === 'original') {
        setProgress('Сохраняю оригинал…', 92);
        saveBlob(new Blob([audio.bytes], { type: kind.mime }), `${baseName}.${kind.ext}`);
      } else {
        if (format === 'mp3' && kind.ext === 'mp3') {
          setProgress('Сохраняю MP3 без перекодирования…', 92);
          saveBlob(new Blob([audio.bytes], { type: 'audio/mpeg' }), `${baseName}.mp3`);
          setProgress('Готово', 100);
          setStatus('Готово. Файл передан браузеру.');
          return;
        }

        const decoded = await decodeAudio(audio.bytes);
        if (format === 'wav') {
          setProgress('Создаю WAV…', 75);
          saveBlob(encodeWav(decoded), `${baseName}.wav`);
        } else if (format === 'mp3') {
          if (!globalThis.lamejs?.Mp3Encoder) {
            throw new Error('MP3-кодек не загрузился. Обновите страницу и повторите попытку.');
          }
          const mp3 = encodeMp3(
            decoded,
            (pct) => setProgress('Создаю MP3…', 55 + Math.round(pct * 0.4))
          );
          saveBlob(mp3, `${baseName}.mp3`);
        }
      }
      setProgress('Готово', 100);
      setStatus('Готово. Файл передан браузеру.');
    } catch (error) {
      setStatus(humanError(error), true);
      progressWrap.hidden = true;
    } finally {
      setDownloadBusy(false);
    }
  });

  function ensureApiConfigured() {
    let url;
    try {
      url = new URL(API_BASE);
    } catch {
      throw new Error('Backend Suno Saver ещё не настроен.');
    }

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.origin !== API_BASE
    ) {
      throw new Error('Backend Suno Saver ещё не настроен.');
    }
  }

  function normalizeSunoUrl(raw) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('Вставьте ссылку Suno.');
    if (value.length > MAX_INPUT_URL_LENGTH) throw new Error('Ссылка слишком длинная.');
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Некорректная ссылка.');
    }

    if (
      url.protocol !== 'https:' ||
      !SUNO_HOSTS.has(url.hostname.toLowerCase()) ||
      url.username ||
      url.password ||
      url.port
    ) {
      throw new Error('Нужна обычная HTTPS-ссылка именно с suno.com.');
    }

    if (
      !SHARE_PATH_RE.test(url.pathname) &&
      !SONG_PATH_RE.test(url.pathname) &&
      !HOOK_PATH_RE.test(url.pathname)
    ) {
      throw new Error('Поддерживаются ссылки /s/<код>, /song/<uuid> и /hook/<id>.');
    }

    url.hash = '';
    return url;
  }

  async function resolveTrack(sunoUrl) {
    let response;
    try {
      response = await fetch(
        `${API_BASE}/api/resolve?url=${encodeURIComponent(sunoUrl)}`,
        {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          referrerPolicy: 'no-referrer',
          signal: requestSignal(25_000)
        }
      );
    } catch {
      throw new Error('Не удалось связаться с backend Suno Saver.');
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) throw new Error(`Backend вернул HTTP ${response.status}.`);
      throw new Error('Backend вернул некорректный ответ.');
    }

    if (!response.ok) {
      throw new Error(apiErrorMessage(data?.error, response.status));
    }

    if (!isResolvedTrack(data)) {
      throw new Error('Backend вернул некорректные данные трека.');
    }

    return data;
  }

  function isResolvedTrack(data) {
    if (!data || typeof data !== 'object') return false;
    if (!UUID_RE.test(String(data.id || ''))) return false;
    if (typeof data.title !== 'string' || data.title.length > 200) return false;
    if (typeof data.artist !== 'string' || data.artist.length > 200) return false;
    if (data.tags != null && (typeof data.tags !== 'string' || data.tags.length > 2000)) return false;
    if (data.model != null && (typeof data.model !== 'string' || data.model.length > 100)) return false;
    if (
      data.duration != null &&
      (!Number.isFinite(data.duration) || data.duration <= 0 || data.duration > 24 * 60 * 60)
    ) {
      return false;
    }
    if (data.image && !isTrustedImageUrl(data.image)) return false;

    const media = data.media;
    if (!media || typeof media !== 'object') return false;
    if (
      typeof media.contentType !== 'string' ||
      media.contentType.length < 1 ||
      media.contentType.length > 100
    ) {
      return false;
    }
    if (
      typeof media.delivery !== 'string' ||
      media.delivery.length < 1 ||
      media.delivery.length > 50
    ) {
      return false;
    }
    if (
      typeof media.originalExtension !== 'string' ||
      !/^(?:m4a|mp3|aac|ogg|webm)$/i.test(media.originalExtension)
    ) {
      return false;
    }

    return true;
  }

  function apiErrorMessage(code, status) {
    const value = String(code || '');
    if (value === 'track_id_not_found') {
      return 'Не удалось определить трек по этой ссылке. Убедитесь, что она открывается без входа в Suno, или вставьте ссылку вида /song/<uuid>.';
    }
    if (value === 'unsupported_url' || value === 'invalid_url' || value === 'missing_url') {
      return 'Некорректная или неподдерживаемая ссылка Suno.';
    }
    if (value === 'untrusted_origin') return 'Backend принимает запросы только с опубликованной страницы Suno Saver.';
    if (value === 'audio_unavailable') return 'Для этого трека нет доступного аудиопотока.';
    if (value === 'media_too_large') return 'Аудиофайл превышает допустимый размер.';
    if (
      value === 'rights_invalid' ||
      value === 'wrapped_value_invalid' ||
      value === 'content_cipher_invalid'
    ) {
      return 'Suno изменил формат прав или шифрования потока. Требуется обновление Suno Saver.';
    }
    if (
      value === 'media_untrusted' ||
      value === 'media_redirect_invalid' ||
      value === 'media_redirect_untrusted' ||
      value === 'media_too_many_redirects'
    ) {
      return 'Suno вернул неподдерживаемый адрес аудиопотока.';
    }
    if (value.endsWith('_timeout')) return 'Suno слишком долго не отвечает. Повторите попытку.';
    if (value.endsWith('_network')) return 'Не удалось связаться с Suno. Повторите попытку.';
    if (value.startsWith('share_http_')) return 'Suno не разрешил открыть короткую ссылку.';
    if (value.startsWith('clip_http_') || value === 'clip_invalid') return 'Suno не вернул корректные публичные данные трека.';
    if (value.startsWith('rights_http_')) return 'Suno не выдал права на воспроизведение этого трека.';
    if (value.startsWith('media_http_')) return 'Suno не отдал аудиопоток.';
    if (value === 'internal_error') return 'Внутренняя ошибка Suno Saver. Повторите попытку позже.';
    return `Ошибка backend${status ? ` (HTTP ${status})` : ''}.`;
  }

  function renderClip(clip) {
    const duration = Number(clip.duration);
    const author = clip.artist || 'Suno';
    titleEl.textContent = clip.title || 'Untitled';
    metaEl.textContent = [
      author,
      Number.isFinite(duration) && duration > 0 ? formatDuration(duration) : null,
      clip.model || null
    ].filter(Boolean).join(' · ');
    tagsEl.textContent = clip.tags || '';

    if (clip.image && isTrustedImageUrl(clip.image)) {
      coverEl.src = clip.image;
      coverEl.alt = `Обложка: ${clip.title || 'Suno track'}`;
      coverEl.hidden = false;
    } else {
      coverEl.removeAttribute('src');
      coverEl.hidden = true;
    }

    const sourceType = clip.media?.contentType || 'm4a-opus';
    mediaNote.textContent =
      `Источник: ${sourceType} · Suno Mango · расшифровка потока выполняется backend без сохранения файла.`;
    trackCard.hidden = false;
  }

  async function fetchAudio(url) {
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: requestSignal(70_000)
      });
    } catch {
      throw new Error('Не удалось получить аудио от backend Suno Saver.');
    }

    if (!response.ok) {
      let detail = null;
      try {
        detail = await response.json();
      } catch {
        // Binary/error responses do not need JSON.
      }
      throw new Error(apiErrorMessage(detail?.error, response.status));
    }

    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES) {
      throw new Error('Аудиофайл слишком большой для обработки в браузере.');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > MAX_AUDIO_BYTES) {
        throw new Error('Аудиофайл слишком большой для обработки в браузере.');
      }
      return { bytes };
    }

    const knownLength =
      Number.isInteger(declared) &&
      declared > 0 &&
      declared <= MAX_AUDIO_BYTES
        ? declared
        : 0;
    const preallocated = knownLength ? new Uint8Array(knownLength) : null;
    const chunks = preallocated ? null : [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const nextReceived = received + value.byteLength;
      if (nextReceived > MAX_AUDIO_BYTES) {
        reader.cancel();
        throw new Error('Аудиофайл слишком большой для обработки в браузере.');
      }
      if (preallocated && nextReceived > preallocated.length) {
        reader.cancel();
        throw new Error('Backend вернул некорректную длину аудиопотока.');
      }

      if (preallocated) {
        preallocated.set(value, received);
      } else {
        chunks.push(value);
      }
      received = nextReceived;

      const pct = knownLength > 0
        ? Math.min(50, Math.round((received / knownLength) * 50))
        : Math.min(45, Math.round(received / 300000));
      setProgress('Получаю оригинальный поток…', pct);
    }

    if (preallocated) {
      return {
        bytes:
          received === preallocated.length
            ? preallocated.buffer
            : preallocated.slice(0, received).buffer
      };
    }

    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes: merged.buffer };
  }

  function detectAudioKind(buffer) {
    const b = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 64));
    const ascii = (from, len) => String.fromCharCode(...b.slice(from, from + len));
    if (ascii(0, 3) === 'ID3') return { playable: true, ext: 'mp3', mime: 'audio/mpeg' };
    if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0) {
      return { playable: true, ext: 'mp3', mime: 'audio/mpeg' };
    }
    if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) {
      return { playable: true, ext: 'aac', mime: 'audio/aac' };
    }
    if (b.length >= 12 && ascii(4, 4) === 'ftyp') {
      return { playable: true, ext: 'm4a', mime: 'audio/mp4' };
    }
    if (ascii(0, 4) === 'OggS') return { playable: true, ext: 'ogg', mime: 'audio/ogg' };
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
      return { playable: true, ext: 'webm', mime: 'audio/webm' };
    }
    if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') {
      return { playable: true, ext: 'wav', mime: 'audio/wav' };
    }
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
    if (dataSize > 0xffffffff - 44) {
      throw new Error('Трек слишком длинный для WAV 16-bit PCM.');
    }
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

    const data = Array.from(
      { length: channels },
      (_, i) => audioBuffer.getChannelData(i)
    );
    let offset = 44;
    for (let i = 0; i < frames; i++) {
      for (let ch = 0; ch < channels; ch++) {
        const sample = Math.max(-1, Math.min(1, data[ch][i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
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
      const encoded = channels > 1
        ? encoder.encodeBuffer(l, right.subarray(i, i + blockSize))
        : encoder.encodeBuffer(l);
      if (encoded.length) chunks.push(new Int8Array(encoded));
      if ((i / blockSize) % 64 === 0) onProgress?.((i / left.length) * 100);
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
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
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
    return (
      String(value || 'suno-track')
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
        .replace(/[. ]+$/g, '')
        .trim()
        .slice(0, 120) || 'suno-track'
    );
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const min = Math.floor(total / 60);
    const sec = String(total % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  function requestSignal(timeoutMs) {
    return typeof globalThis.AbortSignal?.timeout === 'function'
      ? globalThis.AbortSignal.timeout(timeoutMs)
      : undefined;
  }

  function isTrustedImageUrl(value) {
    try {
      const url = new URL(value);
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
        host === 'suno.ai' ||
        host.endsWith('.suno.ai') ||
        host === 'suno.com' ||
        host.endsWith('.suno.com') ||
        host === 'media.cloudfront.net'
      );
    } catch {
      return false;
    }
  }

  function setBusy(value) {
    lookupButton.disabled = value;
    urlInput.disabled = value;
    lookupButton.textContent = value ? 'Проверяю…' : 'Открыть';
  }

  function setDownloadBusy(value) {
    downloadButton.disabled = value;
    lookupButton.disabled = value;
    urlInput.disabled = value;
    for (const input of document.querySelectorAll('input[name="format"]')) {
      input.disabled = value;
    }
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
