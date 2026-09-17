from pathlib import Path
import re

page_path = Path("apps/biorhythms/index.html")
page = page_path.read_text()
pattern = re.compile(
    r'    <section class="section"><div class="container"><div class="section-heading compact"><div><p class="eyebrow"><span class="lang-en">Product UI</span>.*?</section>',
    re.S,
)
replacement = '''    <section class="section"><div class="container"><div class="section-heading compact"><div><p class="eyebrow"><span class="lang-en">Product UI</span><span class="lang-ru">Интерфейс приложения</span></p><h2><span class="lang-en">Verified Biorhythms 1.7.0 captures.</span><span class="lang-ru">Проверенные снимки Biorhythms 1.7.0.</span></h2></div></div><p class="screenshot-note"><span class="lang-en">Captured by the product repository's dedicated API 37 screenshot tooling from real Biorhythms 1.7.0 UI. The CI collector validates all five PNG files at 1080×1920 before publication.</span><span class="lang-ru">Снимки созданы специальным screenshot-tooling репозитория продукта на эмуляторе API 37 из реального интерфейса Biorhythms 1.7.0. Перед публикацией CI проверяет все пять PNG размером 1080×1920.</span></p><div class="screenshot-gallery" tabindex="0" aria-label="Biorhythms screenshots"><figure class="screenshot-card"><img src="/assets/screenshots/biorhythms/01_today.png" alt="Biorhythms Today screen with current cycle values and interactive chart" width="1080" height="1920" loading="lazy" decoding="async"><figcaption><span class="lang-en">Today</span><span class="lang-ru">Сегодня</span></figcaption></figure><figure class="screenshot-card"><img src="/assets/screenshots/biorhythms/02_7_days.png" alt="Biorhythms seven-day forecast with cycle trends" width="1080" height="1920" loading="lazy" decoding="async"><figcaption><span class="lang-en">7 days</span><span class="lang-ru">7 дней</span></figcaption></figure><figure class="screenshot-card"><img src="/assets/screenshots/biorhythms/03_notifications.png" alt="Biorhythms local notification settings" width="1080" height="1920" loading="lazy" decoding="async"><figcaption><span class="lang-en">Notifications</span><span class="lang-ru">Уведомления</span></figcaption></figure><figure class="screenshot-card"><img src="/assets/screenshots/biorhythms/04_about.png" alt="Biorhythms About screen" width="1080" height="1920" loading="lazy" decoding="async"><figcaption><span class="lang-en">About</span><span class="lang-ru">О приложении</span></figcaption></figure><figure class="screenshot-card"><img src="/assets/screenshots/biorhythms/05_widget.png" alt="Biorhythms widget configuration screen" width="1080" height="1920" loading="lazy" decoding="async"><figcaption><span class="lang-en">Widget</span><span class="lang-ru">Виджет</span></figcaption></figure></div></div></section>'''
page, count = pattern.subn(replacement, page, count=1)
assert count == 1, count
page_path.write_text(page)

products_path = Path("data/products.json")
products = products_path.read_text()
old = '      "plannedScreenshots": ["Today", "Interactive chart", "7 days", "Critical points and extrema", "Notifications", "Widget"]'
new = '''      "screenshots": [
        {"src": "/assets/screenshots/biorhythms/01_today.png", "label": "Today"},
        {"src": "/assets/screenshots/biorhythms/02_7_days.png", "label": "7 days"},
        {"src": "/assets/screenshots/biorhythms/03_notifications.png", "label": "Notifications"},
        {"src": "/assets/screenshots/biorhythms/04_about.png", "label": "About"},
        {"src": "/assets/screenshots/biorhythms/05_widget.png", "label": "Widget"}
      ]'''
assert old in products
products_path.write_text(products.replace(old, new, 1))
