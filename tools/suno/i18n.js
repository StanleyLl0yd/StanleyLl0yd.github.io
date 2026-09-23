(() => {
  'use strict';

  const translations = {
    en: {
      pageTitle: 'Suno Saver — download your public Suno track',
      pageDescription: 'Paste a public Suno song link, inspect the available audio and save it as original audio, MP3 or WAV in your browser.',
      back: '← All products',
      toolEyebrow: 'BROWSER TOOL',
      lead: 'Paste a public Suno track link, verify the track and save the available audio. MP3/WAV conversion runs locally in your browser.',
      linkHeading: 'Track link',
      urlLabel: 'Suno URL',
      urlPlaceholder: 'https://suno.com/s/... or https://suno.com/song/...',
      open: 'Open',
      checkingButton: 'Checking…',
      hintIntro: 'Supported public links:',
      hintPrivacy: 'Private tracks are not requested.',
      publicTrack: 'PUBLIC TRACK',
      defaultTrack: 'Track',
      formatAria: 'Audio format',
      originalDescription: 'No re-encoding, fastest option',
      mp3Description: '192 kbps, created locally in your browser',
      wavDescription: '16-bit PCM, created locally',
      download: 'Download',
      preparing: 'Preparing…',
      noteWhatTitle: 'What this site does',
      noteWhatText: 'The page sends only the public Suno link you enter to our serverless backend. The backend fetches public metadata and the current Suno stream, decrypts it while transferring it, and stores nothing. Passwords, cookies and account tokens are never requested.',
      noteLimitsTitle: 'Limitations',
      noteLimitsText: 'Suno may change its public API or Mango stream format. If the current scheme changes, the site stops with an error instead of saving a damaged file.',
      noteRightsTitle: 'Rights',
      noteRightsText: 'Download your own compositions or material you are allowed to use. This tool does not change the track license or its commercial-use rights.',
      statusCheckingLink: 'Checking the link…',
      statusLoadingTrack: 'Loading track data…',
      statusReady: 'Ready. Choose a format and download the file.',
      statusLoadingAudio: 'Loading audio…',
      statusFileHanded: 'Done. The file was handed to your browser.',
      progressLoadingOriginal: 'Loading the original stream…',
      progressSavingOriginal: 'Saving original…',
      progressSavingMp3Original: 'Saving MP3 without re-encoding…',
      progressDecoding: 'Decoding audio…',
      progressCreatingWav: 'Creating WAV…',
      progressCreatingMp3: 'Creating MP3…',
      progressDone: 'Done',
      sourceNote: 'Source: {type} · Suno Mango · the backend decrypts the stream in transit without storing the file.',
      coverAlt: 'Cover: {title}',
      errorBackendNotConfigured: 'The Suno Saver backend is not configured yet.',
      errorEnterLink: 'Paste a Suno link.',
      errorLinkTooLong: 'The link is too long.',
      errorInvalidLink: 'Invalid link.',
      errorNeedSunoHttps: 'Use a regular HTTPS link from suno.com.',
      errorSupportedRoutes: 'Supported links are /s/<code>, /song/<uuid> and /hook/<id>.',
      errorBackendUnreachable: 'Could not reach the Suno Saver backend.',
      errorBackendHttp: 'The backend returned HTTP {status}.',
      errorBackendInvalidResponse: 'The backend returned an invalid response.',
      errorBackendInvalidTrack: 'The backend returned invalid track data.',
      errorTrackNotFound: 'Could not identify a track from this link. Make sure it opens without signing in to Suno, or paste a /song/<uuid> link.',
      errorUnsupportedUrl: 'Invalid or unsupported Suno link.',
      errorUntrustedOrigin: 'The backend accepts requests only from the published Suno Saver page.',
      errorAudioUnavailable: 'No available audio stream was found for this track.',
      errorMediaTooLarge: 'The audio file exceeds the allowed size.',
      errorRightsChanged: 'Suno changed the stream rights or encryption format. Suno Saver needs an update.',
      errorMediaUntrusted: 'Suno returned an unsupported audio-stream address.',
      errorSunoTimeout: 'Suno is taking too long to respond. Try again.',
      errorSunoNetwork: 'Could not reach Suno. Try again.',
      errorShareHttp: 'Suno did not allow the short link to be opened.',
      errorClipInvalid: 'Suno did not return valid public track data.',
      errorRightsHttp: 'Suno did not grant playback rights for this track.',
      errorMediaHttp: 'Suno did not return the audio stream.',
      errorInternal: 'Internal Suno Saver error. Try again later.',
      errorBackendGeneric: 'Backend error{status}.',
      errorUnsupportedAudio: 'The backend returned an unsupported audio stream.',
      errorAudioFetch: 'Could not get audio from the Suno Saver backend.',
      errorAudioTooLargeBrowser: 'The audio file is too large to process in this browser.',
      errorAudioLength: 'The backend returned an invalid audio-stream length.',
      errorDecodeUnsupported: 'This browser does not support audio decoding.',
      errorDecodeFailed: 'The browser could not decode the source audio stream.',
      errorWavTooLong: 'The track is too long for 16-bit PCM WAV.',
      errorMp3Codec: 'The MP3 codec did not load. Refresh the page and try again.',
      errorUnknown: 'Unknown error.'
    },
    ru: {
      pageTitle: 'Suno Saver — скачивание публичных треков Suno',
      pageDescription: 'Вставьте публичную ссылку Suno, проверьте доступное аудио и сохраните его в исходном формате, MP3 или WAV прямо в браузере.',
      back: '← Все продукты',
      toolEyebrow: 'ИНСТРУМЕНТ В БРАУЗЕРЕ',
      lead: 'Вставьте публичную ссылку на композицию Suno, проверьте трек и сохраните доступное аудио. Конвертация MP3/WAV выполняется локально в вашем браузере.',
      linkHeading: 'Ссылка на трек',
      urlLabel: 'Suno URL',
      urlPlaceholder: 'https://suno.com/s/... или https://suno.com/song/...',
      open: 'Открыть',
      checkingButton: 'Проверяю…',
      hintIntro: 'Поддерживаются публичные ссылки:',
      hintPrivacy: 'Приватные треки не запрашиваются.',
      publicTrack: 'ПУБЛИЧНЫЙ ТРЕК',
      defaultTrack: 'Трек',
      formatAria: 'Формат аудио',
      originalDescription: 'Без перекодирования, самый быстрый вариант',
      mp3Description: '192 kbps, создаётся локально в браузере',
      wavDescription: '16-bit PCM, создаётся локально',
      download: 'Скачать',
      preparing: 'Подготовка…',
      noteWhatTitle: 'Что делает сайт',
      noteWhatText: 'Страница отправляет только введённую публичную Suno-ссылку нашему serverless backend. Backend получает публичные metadata и текущий поток Suno, расшифровывает его во время передачи и ничего не сохраняет. Пароли, cookies и токены аккаунта не запрашиваются.',
      noteLimitsTitle: 'Ограничения',
      noteLimitsText: 'Suno может менять формат публичного API и Mango-потока. Если текущая схема изменится, сайт остановится с ошибкой вместо сохранения повреждённого файла.',
      noteRightsTitle: 'Права',
      noteRightsText: 'Скачивайте собственные композиции или материалы, на использование которых у вас есть разрешение. Этот инструмент не меняет лицензию или коммерческие права на трек.',
      statusCheckingLink: 'Проверяю ссылку…',
      statusLoadingTrack: 'Получаю данные трека…',
      statusReady: 'Готово. Выберите формат и скачайте файл.',
      statusLoadingAudio: 'Получаю аудио…',
      statusFileHanded: 'Готово. Файл передан браузеру.',
      progressLoadingOriginal: 'Получаю оригинальный поток…',
      progressSavingOriginal: 'Сохраняю оригинал…',
      progressSavingMp3Original: 'Сохраняю MP3 без перекодирования…',
      progressDecoding: 'Декодирую аудио…',
      progressCreatingWav: 'Создаю WAV…',
      progressCreatingMp3: 'Создаю MP3…',
      progressDone: 'Готово',
      sourceNote: 'Источник: {type} · Suno Mango · расшифровка потока выполняется backend без сохранения файла.',
      coverAlt: 'Обложка: {title}',
      errorBackendNotConfigured: 'Backend Suno Saver ещё не настроен.',
      errorEnterLink: 'Вставьте ссылку Suno.',
      errorLinkTooLong: 'Ссылка слишком длинная.',
      errorInvalidLink: 'Некорректная ссылка.',
      errorNeedSunoHttps: 'Нужна обычная HTTPS-ссылка именно с suno.com.',
      errorSupportedRoutes: 'Поддерживаются ссылки /s/<код>, /song/<uuid> и /hook/<id>.',
      errorBackendUnreachable: 'Не удалось связаться с backend Suno Saver.',
      errorBackendHttp: 'Backend вернул HTTP {status}.',
      errorBackendInvalidResponse: 'Backend вернул некорректный ответ.',
      errorBackendInvalidTrack: 'Backend вернул некорректные данные трека.',
      errorTrackNotFound: 'Не удалось определить трек по этой ссылке. Убедитесь, что она открывается без входа в Suno, или вставьте ссылку вида /song/<uuid>.',
      errorUnsupportedUrl: 'Некорректная или неподдерживаемая ссылка Suno.',
      errorUntrustedOrigin: 'Backend принимает запросы только с опубликованной страницы Suno Saver.',
      errorAudioUnavailable: 'Для этого трека нет доступного аудиопотока.',
      errorMediaTooLarge: 'Аудиофайл превышает допустимый размер.',
      errorRightsChanged: 'Suno изменил формат прав или шифрования потока. Требуется обновление Suno Saver.',
      errorMediaUntrusted: 'Suno вернул неподдерживаемый адрес аудиопотока.',
      errorSunoTimeout: 'Suno слишком долго не отвечает. Повторите попытку.',
      errorSunoNetwork: 'Не удалось связаться с Suno. Повторите попытку.',
      errorShareHttp: 'Suno не разрешил открыть короткую ссылку.',
      errorClipInvalid: 'Suno не вернул корректные публичные данные трека.',
      errorRightsHttp: 'Suno не выдал права на воспроизведение этого трека.',
      errorMediaHttp: 'Suno не отдал аудиопоток.',
      errorInternal: 'Внутренняя ошибка Suno Saver. Повторите попытку позже.',
      errorBackendGeneric: 'Ошибка backend{status}.',
      errorUnsupportedAudio: 'Backend вернул неподдерживаемый аудиопоток.',
      errorAudioFetch: 'Не удалось получить аудио от backend Suno Saver.',
      errorAudioTooLargeBrowser: 'Аудиофайл слишком большой для обработки в браузере.',
      errorAudioLength: 'Backend вернул некорректную длину аудиопотока.',
      errorDecodeUnsupported: 'Этот браузер не поддерживает декодирование аудио.',
      errorDecodeFailed: 'Браузер не смог декодировать исходный аудиопоток.',
      errorWavTooLong: 'Трек слишком длинный для WAV 16-bit PCM.',
      errorMp3Codec: 'MP3-кодек не загрузился. Обновите страницу и повторите попытку.',
      errorUnknown: 'Неизвестная ошибка.'
    }
  };

  const listeners = new Set();

  function readStoredLanguage() {
    try {
      const value = localStorage.getItem('site-language');
      return value === 'ru' || value === 'en' ? value : null;
    } catch {
      return null;
    }
  }

  function detectLanguage() {
    const stored = readStoredLanguage();
    if (stored) return stored;
    const preferred = String(navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
    return preferred.startsWith('ru') ? 'ru' : 'en';
  }

  let language = detectLanguage();

  function t(key, params = {}) {
    let value = translations[language]?.[key] ?? translations.en[key] ?? key;
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
    return value;
  }

  function applyDocumentLanguage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');

    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t('pageDescription');

    for (const element of document.querySelectorAll('[data-i18n]')) {
      element.textContent = t(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
      element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    }
    for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
      element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    }

    const toggle = document.querySelector('#lang-toggle');
    if (toggle) {
      toggle.textContent = language === 'ru' ? 'EN' : 'RU';
      toggle.setAttribute(
        'aria-label',
        language === 'ru' ? 'Переключить на английский' : 'Switch to Russian'
      );
      toggle.title =
        language === 'ru' ? 'Переключить на английский' : 'Switch to Russian';
    }

    for (const listener of listeners) listener(language);
  }

  function setLanguage(next, persist = true) {
    if (next !== 'ru' && next !== 'en') return;
    language = next;
    if (persist) {
      try {
        localStorage.setItem('site-language', language);
      } catch {
        // Language selection still works when storage is unavailable.
      }
    }
    applyDocumentLanguage();
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  globalThis.SunoSaverI18n = {
    getLanguage: () => language,
    setLanguage,
    subscribe,
    t
  };

  document.querySelector('#lang-toggle')?.addEventListener('click', () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  });

  applyDocumentLanguage();
})();
