(() => {
  "use strict";

  const root = document.documentElement;

  if (window.top !== window.self) {
    root.classList.add("frame-blocked");
    try {
      window.top.location.replace(window.self.location.href);
    } catch {}
    return;
  }

  const translations = {
    en: {
      skip: "Skip to content",
      navApps: "Apps",
      navAbout: "About",
      eyebrow: "Independent software developer",
      heroTitle: "Simple software that respects your time and privacy.",
      heroLead: "I build focused apps with a preference for local processing, clear interfaces and minimal data collection.",
      viewApps: "View apps",
      githubProfile: "GitHub profile",
      appsEyebrow: "Software",
      appsTitle: "Apps",
      appsLead: "Projects built for real everyday use.",
      pgSummary: "A privacy-focused offline password generator with configurable rules and a password-strength indicator.",
      tagOffline: "100% offline",
      tagNoAds: "No ads",
      tagNoTracking: "No tracking",
      learnMore: "Learn more →",
      moreApps: "More apps",
      moreAppsText: "More projects will appear here as their public pages are prepared.",
      aboutEyebrow: "About",
      aboutTitle: "Stanley Lloyd",
      aboutText1: "Independent developer working on Android, desktop and utility software.",
      aboutText2: "This site is the public home for my apps: product information, downloads, privacy policies and support links — without exposing source code for closed projects.",
      privacy: "Privacy",
      home: "Home",
      backHome: "← All apps",
      pgHero: "Secure passwords, generated locally on your Android device.",
      getRustore: "Get it on RuStore ↗",
      downloadApk: "Download APK ↗",
      demoLabel: "Password preview",
      demoNote: "Illustrative preview — passwords are generated only inside the app.",
      whyTitleSmall: "Privacy by design",
      whyTitle: "Built to stay offline",
      featureOfflineTitle: "No Internet permission",
      featureOfflineText: "The app works fully offline and does not communicate with remote servers.",
      featureRandomTitle: "Secure generation",
      featureRandomText: "Passwords are generated locally using Android SecureRandom.",
      featureTrackingTitle: "No analytics or ads",
      featureTrackingText: "No analytics, tracking, advertising SDKs or cloud accounts.",
      featureRulesTitle: "Flexible rules",
      featureRulesText: "Choose length, character groups, ambiguous-character exclusion and duplicate handling.",
      featureStrengthTitle: "Strength indicator",
      featureStrengthText: "The indicator considers length, character variety, repetition, sequences and weak patterns.",
      featureUiTitle: "Modern Android UI",
      featureUiText: "Material 3, light and dark themes, Dynamic Color on Android 12+, English and Russian.",
      detailsEyebrow: "Details",
      detailsTitle: "What it stores",
      passwordsLabel: "Passwords",
      passwordsValue: "Memory only; not saved by the app",
      settingsLabel: "Settings",
      settingsValue: "Generator preferences stored locally",
      networkLabel: "Network",
      networkValue: "No INTERNET permission",
      analyticsLabel: "Analytics",
      analyticsValue: "None",
      ctaTitle: "Generate passwords without sending anything anywhere.",
      ctaText: "Available for Android 8.0+, Windows 10+ and macOS 13+.",
      privacyPolicy: "Privacy policy",
      backProduct: "← Password Generator",
      privacyTitle: "Privacy Policy",
      privacyUpdated: "Last updated: September 18, 2026",
      privacyIntro: "Password Generator is a privacy-focused offline password generator with native applications for Android, Windows and macOS.",
      privacyCollectionTitle: "Data collection",
      privacyCollectionText: "Password Generator does not collect, transmit, sell, share or otherwise disclose personal data or usage data. It does not use analytics, advertising SDKs, tracking, telemetry, crash-reporting services, cloud synchronization, remote accounts or a backend service.",
      privacyNetworkTitle: "Network access",
      privacyNetworkText: "Password Generator does not require network access for product features. Android does not request the INTERNET permission; the Windows and macOS applications contain no product networking. About links open externally through the operating system.",
      privacyPasswordsTitle: "Passwords",
      privacyPasswordsText: "Passwords are generated locally with the operating system cryptographic random source: SecureRandom on Android, BCryptGenRandom on Windows and SecRandomCopyBytes on macOS. Generated passwords exist only in process memory and are never saved persistently by Password Generator.",
      privacyClipboardText: "When copied, a password is placed in the operating system clipboard. Where the platform supports it, Password Generator treats the value as sensitive and schedules cleanup after 60 seconds, clearing only its own still-current value and never newer clipboard content.",
      privacySettingsTitle: "Local settings",
      privacySettingsText: "Only non-secret generator preferences are stored locally: Android DataStore, the current user's Windows Registry hive or macOS UserDefaults. Generated passwords are never included. Android application backup is disabled and its transfer rules exclude generator preferences.",
      privacyPermissionsTitle: "Platform permissions and capabilities",
      privacyPermissionsText: "Android requests only vibration permission for haptic feedback and no INTERNET permission. Windows runs as the current user without elevation. The macOS application uses App Sandbox and has no network entitlement for product functionality.",
      privacyChildrenTitle: "Children",
      privacyChildrenText: "Password Generator does not collect data from anyone, including children, because the app does not collect personal or usage data at all.",
      privacyThirdTitle: "Third-party services",
      privacyThirdText: "The application does not integrate third-party analytics, advertising, tracking, authentication, cloud or telemetry services. External About links are opened by the operating system in another application such as a browser and are governed by that service's privacy practices.",
      privacyChangesTitle: "Changes",
      privacyChangesText: "If the app's data practices change, this Privacy Policy will be updated before or together with the corresponding app release.",
      privacyContactTitle: "Contact",
      privacyContactText: "For privacy questions, bug reports or other questions, use the project's GitHub repository."
    },
    ru: {
      skip: "К содержимому",
      navApps: "Приложения",
      navAbout: "О разработчике",
      eyebrow: "Независимый разработчик",
      heroTitle: "Простые приложения, которые уважают ваше время и приватность.",
      heroLead: "Я создаю сфокусированные приложения с локальной обработкой данных, понятным интерфейсом и минимальным сбором информации.",
      viewApps: "Смотреть приложения",
      githubProfile: "Профиль GitHub",
      appsEyebrow: "Программы",
      appsTitle: "Приложения",
      appsLead: "Проекты, созданные для повседневного использования.",
      pgSummary: "Приватный офлайн-генератор паролей с гибкими правилами и индикатором стойкости.",
      tagOffline: "100% офлайн",
      tagNoAds: "Без рекламы",
      tagNoTracking: "Без отслеживания",
      learnMore: "Подробнее →",
      moreApps: "Другие приложения",
      moreAppsText: "Здесь появятся новые проекты по мере подготовки их публичных страниц.",
      aboutEyebrow: "О разработчике",
      aboutTitle: "Stanley Lloyd",
      aboutText1: "Независимый разработчик Android-приложений, настольных программ и утилит.",
      aboutText2: "Этот сайт — публичная страница моих приложений: описание, загрузки, политики конфиденциальности и поддержка — без публикации исходного кода закрытых проектов.",
      privacy: "Конфиденциальность",
      home: "Главная",
      backHome: "← Все приложения",
      pgHero: "Надёжные пароли, которые создаются локально на вашем Android-устройстве.",
      getRustore: "Скачать в RuStore ↗",
      downloadApk: "Скачать APK ↗",
      demoLabel: "Пример пароля",
      demoNote: "Демонстрационный пример — реальные пароли генерируются только внутри приложения.",
      whyTitleSmall: "Приватность по умолчанию",
      whyTitle: "Работает полностью офлайн",
      featureOfflineTitle: "Без доступа в Интернет",
      featureOfflineText: "Приложение полностью работает офлайн и не обращается к удалённым серверам.",
      featureRandomTitle: "Надёжная генерация",
      featureRandomText: "Пароли создаются локально с помощью Android SecureRandom.",
      featureTrackingTitle: "Без аналитики и рекламы",
      featureTrackingText: "Нет аналитики, отслеживания, рекламных SDK и облачных аккаунтов.",
      featureRulesTitle: "Гибкие правила",
      featureRulesText: "Настраивайте длину, наборы символов, исключение похожих и повторяющихся символов.",
      featureStrengthTitle: "Оценка стойкости",
      featureStrengthText: "Индикатор учитывает длину, разнообразие символов, повторы, последовательности и слабые шаблоны.",
      featureUiTitle: "Современный Android-интерфейс",
      featureUiText: "Material 3, светлая и тёмная темы, Dynamic Color на Android 12+, русский и английский.",
      detailsEyebrow: "Данные",
      detailsTitle: "Что хранит приложение",
      passwordsLabel: "Пароли",
      passwordsValue: "Только в памяти; приложение их не сохраняет",
      settingsLabel: "Настройки",
      settingsValue: "Параметры генератора хранятся локально",
      networkLabel: "Сеть",
      networkValue: "Нет разрешения INTERNET",
      analyticsLabel: "Аналитика",
      analyticsValue: "Отсутствует",
      ctaTitle: "Создавайте пароли, ничего никуда не отправляя.",
      ctaText: "Для Android 8.0+, Windows 10+ и macOS 13+.",
      privacyPolicy: "Политика конфиденциальности",
      backProduct: "← Password Generator",
      privacyTitle: "Политика конфиденциальности",
      privacyUpdated: "Последнее обновление: 18 сентября 2026 года",
      privacyIntro: "Password Generator — приватный офлайн-генератор паролей с нативными приложениями для Android, Windows и macOS.",
      privacyCollectionTitle: "Сбор данных",
      privacyCollectionText: "Password Generator не собирает, не передаёт, не продаёт, не предоставляет и иным образом не раскрывает персональные данные или сведения об использовании. Приложение не использует аналитику, рекламные SDK, отслеживание, телеметрию, сервисы отчётов о сбоях, облачную синхронизацию, удалённые учётные записи или сервер продукта.",
      privacyNetworkTitle: "Доступ к сети",
      privacyNetworkText: "Для функций Password Generator доступ к сети не требуется. Android не запрашивает разрешение INTERNET; версии для Windows и macOS не содержат сетевых функций продукта. Ссылки из раздела «О приложении» открываются операционной системой во внешнем приложении.",
      privacyPasswordsTitle: "Пароли",
      privacyPasswordsText: "Пароли создаются локально системным криптографическим генератором: SecureRandom на Android, BCryptGenRandom в Windows и SecRandomCopyBytes в macOS. Сгенерированные пароли находятся только в памяти процесса и никогда не сохраняются Password Generator в постоянное хранилище.",
      privacyClipboardText: "При копировании пароль помещается в системный буфер обмена. Там, где платформа это позволяет, Password Generator помечает значение как чувствительное и планирует очистку через 60 секунд, удаляя только своё всё ещё актуальное значение и не затрагивая более новое содержимое буфера.",
      privacySettingsTitle: "Локальные настройки",
      privacySettingsText: "Локально сохраняются только несекретные настройки генератора: Android DataStore, пользовательский раздел реестра Windows или macOS UserDefaults. Сгенерированные пароли в них не входят. Резервное копирование Android-приложения отключено, а правила переноса исключают настройки генератора.",
      privacyPermissionsTitle: "Разрешения и возможности платформ",
      privacyPermissionsText: "Android запрашивает только разрешение на вибрацию для тактильной обратной связи и не запрашивает INTERNET. Версия Windows работает от имени текущего пользователя без повышения привилегий. Версия macOS использует App Sandbox и не имеет сетевого entitlement для функций продукта.",
      privacyChildrenTitle: "Дети",
      privacyChildrenText: "Password Generator не собирает данные ни у кого, включая детей, поскольку приложение вообще не собирает персональные данные или сведения об использовании.",
      privacyThirdTitle: "Сторонние сервисы",
      privacyThirdText: "Приложение не интегрировано со сторонними сервисами аналитики, рекламы, отслеживания, авторизации, облака или телеметрии. Внешние ссылки из раздела «О приложении» открываются операционной системой в другом приложении, например браузере, и регулируются политикой соответствующего сервиса.",
      privacyChangesTitle: "Изменения",
      privacyChangesText: "Если практика обработки данных в приложении изменится, эта Политика конфиденциальности будет обновлена до выпуска или одновременно с выпуском соответствующей версии приложения.",
      privacyContactTitle: "Контакты",
      privacyContactText: "По вопросам конфиденциальности, сообщениям об ошибках и другим вопросам используйте репозиторий проекта GitHub."
    }
  };

  const storedLang = localStorage.getItem("site-language");
  let lang = storedLang || (navigator.language && navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en");

  const themeNames = {
    en: { auto: "automatic", light: "light", dark: "dark" },
    ru: { auto: "автоматически", light: "светлая", dark: "тёмная" }
  };

  const themeToggle = document.getElementById("theme-toggle");

  const updateThemeLabel = () => {
    if (!themeToggle) return;
    const theme = root.dataset.theme || "auto";
    themeToggle.title = lang === "ru" ? `Тема: ${themeNames.ru[theme]}` : `Theme: ${themeNames.en[theme]}`;
    themeToggle.setAttribute("aria-label", lang === "ru" ? "Переключить тему" : "Toggle color theme");
  };

  const setLocalizedAria = (selector, en, ru) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("aria-label", lang === "ru" ? ru : en);
  };

  const applyLanguage = () => {
    root.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (translations[lang][key]) element.textContent = translations[lang][key];
    });

    const toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.textContent = lang === "ru" ? "EN" : "RU";
      toggle.setAttribute("aria-label", lang === "ru" ? "Переключить на английский" : "Switch to Russian");
    }

    setLocalizedAria(".brand", "Stanley Lloyd home", "Главная Stanley Lloyd");
    setLocalizedAria(".nav", "Primary navigation", "Основная навигация");
    setLocalizedAria(".product-system", "Stanley Lloyd product ecosystem", "Экосистема продуктов Stanley Lloyd");
    setLocalizedAria(".quick-facts", "Portfolio summary", "Кратко о портфолио");
    setLocalizedAria(".password-demo", "Password Generator interface preview", "Предпросмотр интерфейса Password Generator");

    updateThemeLabel();
    localStorage.setItem("site-language", lang);
  };

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    lang = lang === "ru" ? "en" : "ru";
    applyLanguage();
  });

  const storedTheme = localStorage.getItem("site-theme") || "auto";
  root.dataset.theme = storedTheme;
  const themes = ["auto", "light", "dark"];

  themeToggle?.addEventListener("click", () => {
    const current = root.dataset.theme || "auto";
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    root.dataset.theme = next;
    localStorage.setItem("site-theme", next);
    updateThemeLabel();
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  applyLanguage();
})();