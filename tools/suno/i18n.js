(() => {
  'use strict';

  const translations = {
    en: {
      skip: 'Skip to content',
      pageTitle: 'Suno Downloader — Download Suno Songs as MP3 or WAV',
      pageDescription: 'Download public Suno songs from a link as original audio, MP3 or WAV. No Suno login required; MP3/WAV conversion runs locally in your browser.',
      back: '← All products',
      toolEyebrow: 'SUNO SAVER',
      heroTitle: 'Suno Downloader',
      lead: 'Paste a public Suno link to download or save the track as original audio, MP3 or WAV. No Suno login is required, and MP3/WAV conversion runs locally in your browser.',
      linkHeading: 'Paste a Suno link',
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
      guideEyebrow: 'QUICK GUIDE',
      guideTitle: 'How to download a Suno song',
      guideIntro: 'Use a public Suno share link. Suno Saver checks the track first, then lets you keep the available audio in the format that fits your workflow.',
      stepPasteTitle: 'Paste the public link',
      stepPasteText: 'Copy a public Suno share, song or hook URL and paste it above.',
      stepChooseTitle: 'Check the track and format',
      stepChooseText: 'Confirm the title and choose Original, MP3 or WAV.',
      stepSaveTitle: 'Download the audio',
      stepSaveText: 'Save the available Suno audio to your device. MP3 and WAV conversion stays in your browser.',
      noteWhatTitle: 'Private by design',
      noteWhatText: 'Only the public Suno link is sent to the serverless backend. Passwords, cookies and account tokens are never requested, and the backend does not store the audio file.',
      noteLimitsTitle: 'Public links and real formats',
      noteLimitsText: 'Suno Saver supports public share, song and hook links. Save the available source audio as-is or convert playable audio to MP3 or WAV locally.',
      noteRightsTitle: 'Rights and availability',
      noteRightsText: 'Download your own compositions or material you are allowed to use. Private, deleted or unavailable tracks cannot be retrieved, and this tool does not change any license or commercial-use rights.',
      faqTitle: 'Suno download FAQ',
      faqMp3Question: 'Can I download a Suno song as MP3?',
      faqMp3Answer: 'Yes. For a supported public Suno track, choose MP3 and Suno Saver will save an MP3 version. When conversion is needed, it runs locally in your browser.',
      faqLoginQuestion: 'Do I need a Suno account or login?',
      faqLoginAnswer: 'No. Suno Saver works with public links and never asks for your Suno password, cookies, session token or API token.',
      faqLinksQuestion: 'Which Suno links can I save?',
      faqLinksAnswer: 'Public suno.com share links, /song/ links and /hook/ links are supported. Private, deleted or otherwise unavailable tracks may not be downloadable.',
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
      skip: 'К содержимому',
      pageTitle: 'Suno Downloader — скачать песню из Suno в MP3 или WAV',
      pageDescription: 'Скачивайте публичные треки Suno по ссылке в исходном формате, MP3 или WAV. Вход в Suno не нужен; конвертация MP3/WAV выполняется локально в браузере.',
      back: '← Все продукты',
      toolEyebrow: 'SUNO SAVER',
      heroTitle: 'Suno Downloader',
      lead: 'Вставьте публичную ссылку Suno, чтобы скачать или сохранить трек в исходном формате, MP3 или WAV. Вход в Suno не нужен, а конвертация MP3/WAV выполняется локально в браузере.',
      linkHeading: 'Вставьте ссылку Suno',
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
      guideEyebrow: 'КРАТКАЯ ИНСТРУКЦИЯ',
      guideTitle: 'Как скачать песню из Suno',
      guideIntro: 'Используйте публичную ссылку Suno. Suno Saver сначала проверит трек, а затем предложит сохранить доступное аудио в подходящем формате.',
      stepPasteTitle: 'Вставьте публичную ссылку',
      stepPasteText: 'Скопируйте публичную ссылку Suno вида share, song или hook и вставьте её выше.',
      stepChooseTitle: 'Проверьте трек и формат',
      stepChooseText: 'Убедитесь, что найден нужный трек, и выберите Original, MP3 или WAV.',
      stepSaveTitle: 'Скачайте аудио',
      stepSaveText: 'Сохраните доступное аудио Suno на устройство. Конвертация MP3 и WAV выполняется в вашем браузере.',
      noteWhatTitle: 'Приватность по умолчанию',
      noteWhatText: 'На serverless backend отправляется только публичная ссылка Suno. Пароли, cookies и токены аккаунта не запрашиваются, а аудиофайл на backend не сохраняется.',
      noteLimitsTitle: 'Публичные ссылки и реальные форматы',
      noteLimitsText: 'Suno Saver поддерживает публичные ссылки share, song и hook. Доступный исходный поток можно сохранить как есть либо локально преобразовать воспроизводимое аудио в MP3 или WAV.',
      noteRightsTitle: 'Права и доступность',
      noteRightsText: 'Скачивайте собственные композиции или материалы, на использование которых у вас есть разрешение. Приватные, удалённые или недоступные треки получить нельзя; инструмент не меняет лицензию и коммерческие права.',
      faqTitle: 'Вопросы о скачивании из Suno',
      faqMp3Question: 'Можно ли скачать песню Suno в MP3?',
      faqMp3Answer: 'Да. Для поддерживаемого публичного трека выберите MP3, и Suno Saver сохранит MP3-версию. Если требуется конвертация, она выполняется локально в браузере.',
      faqLoginQuestion: 'Нужен ли аккаунт или вход в Suno?',
      faqLoginAnswer: 'Нет. Suno Saver работает с публичными ссылками и не запрашивает пароль Suno, cookies, session token или API token.',
      faqLinksQuestion: 'Какие ссылки Suno можно скачать?',
      faqLinksAnswer: 'Поддерживаются публичные ссылки suno.com вида share, /song/ и /hook/. Приватные, удалённые или иным образом недоступные треки могут не скачиваться.',
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

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = t('pageTitle');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = t('pageDescription');

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
