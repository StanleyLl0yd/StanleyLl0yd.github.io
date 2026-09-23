import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../../suno/i18n.js', import.meta.url), 'utf8');

function runI18n({ browserLanguage = 'en-US', storedLanguage = null } = {}) {
  const storage = new Map();
  if (storedLanguage) storage.set('site-language', storedLanguage);

  let toggleHandler = null;
  const description = { content: '' };
  const toggle = {
    textContent: '',
    title: '',
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    addEventListener(name, handler) {
      if (name === 'click') toggleHandler = handler;
    }
  };

  const document = {
    documentElement: { lang: 'en' },
    title: '',
    querySelector(selector) {
      if (selector === 'meta[name="description"]') return description;
      if (selector === '#lang-toggle') return toggle;
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  const context = {
    document,
    navigator: { languages: [browserLanguage], language: browserLanguage },
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      }
    }
  };
  context.globalThis = context;

  vm.runInNewContext(source, context, { filename: 'i18n.js' });

  return {
    api: context.SunoSaverI18n,
    description,
    document,
    storage,
    toggle,
    clickToggle() {
      assert.equal(typeof toggleHandler, 'function');
      toggleHandler();
    }
  };
}

test('Suno Saver chooses Russian from browser locale when no preference exists', () => {
  const page = runI18n({ browserLanguage: 'ru-RU' });
  assert.equal(page.api.getLanguage(), 'ru');
  assert.equal(page.document.documentElement.lang, 'ru');
  assert.equal(page.toggle.textContent, 'EN');
  assert.match(page.document.title, /скачивание/);
});

test('stored portfolio language overrides browser locale', () => {
  const page = runI18n({ browserLanguage: 'ru-RU', storedLanguage: 'en' });
  assert.equal(page.api.getLanguage(), 'en');
  assert.equal(page.document.documentElement.lang, 'en');
  assert.equal(page.toggle.textContent, 'RU');
  assert.match(page.description.content, /public Suno song link/i);
});

test('manual language toggle persists the shared site-language preference', () => {
  const page = runI18n({ browserLanguage: 'en-US' });
  page.clickToggle();

  assert.equal(page.api.getLanguage(), 'ru');
  assert.equal(page.document.documentElement.lang, 'ru');
  assert.equal(page.storage.get('site-language'), 'ru');
  assert.equal(page.toggle.textContent, 'EN');

  page.clickToggle();
  assert.equal(page.api.getLanguage(), 'en');
  assert.equal(page.storage.get('site-language'), 'en');
  assert.equal(page.toggle.textContent, 'RU');
});
