import type { TranslationProvider } from './types';

type BrowserTranslator = { translate: (text: string) => Promise<string>; destroy?: () => void };
type TranslatorFactory = {
  availability: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
  create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<BrowserTranslator>;
};

declare global {
  interface Window { Translator?: TranslatorFactory }
}

const CACHE_STORAGE_KEY = 'react-email-locale-lab:translations:v1';

const readStoredCache = (): Map<string, string> => {
  try {
    const value = window.sessionStorage?.getItem(CACHE_STORAGE_KEY);
    if (!value) return new Map();
    const entries = JSON.parse(value) as unknown;
    if (!Array.isArray(entries)) return new Map();
    return new Map(entries.filter(
      (entry): entry is [string, string] =>
        Array.isArray(entry) && entry.length === 2 && entry.every((item) => typeof item === 'string'),
    ));
  } catch {
    return new Map();
  }
};

const storeCache = (cache: Map<string, string>) => {
  try {
    window.sessionStorage?.setItem(CACHE_STORAGE_KEY, JSON.stringify([...cache]));
  } catch {
    // Storage can be unavailable or full. The in-memory cache still works.
  }
};

export const browserTranslatorProvider = (): TranslationProvider => {
  const translators = new Map<string, Promise<BrowserTranslator>>();
  const cache = readStoredCache();
  const queues = new Map<string, Promise<void>>();

  const serialize = async <T,>(pair: string, task: () => Promise<T>): Promise<T> => {
    const previous = queues.get(pair) ?? Promise.resolve();
    let release = () => {};
    const turn = new Promise<void>((resolve) => { release = resolve; });
    const queued = previous.catch(() => undefined).then(() => turn);
    queues.set(pair, queued);
    await previous.catch(() => undefined);
    try {
      return await task();
    } finally {
      release();
      if (queues.get(pair) === queued) queues.delete(pair);
    }
  };

  const getTranslator = async (sourceLocale: string, targetLocale: string) => {
    if (!window.Translator) {
      throw new Error('This browser does not support the built-in Translator API. Use a current Chrome build or configure a remote provider.');
    }
    const pair = `${sourceLocale}:${targetLocale}`;
    let translator = translators.get(pair);
    if (!translator) {
      const availability = await window.Translator.availability({ sourceLanguage: sourceLocale, targetLanguage: targetLocale });
      if (availability === 'unavailable') throw new Error(`The browser cannot translate ${sourceLocale} → ${targetLocale}.`);
      translator = window.Translator.create({ sourceLanguage: sourceLocale, targetLanguage: targetLocale });
      translators.set(pair, translator);
    }
    return translator;
  };

  return {
    name: 'Browser Translator · on-device',
    async translate({ texts, sourceLocale, targetLocale }) {
      if (texts.length === 0) return [];
      const translator = await getTranslator(sourceLocale, targetLocale);
      const pair = `${sourceLocale}:${targetLocale}`;
      return serialize(pair, async () => {
        const results: string[] = [];
        let cacheChanged = false;
        try {
          for (const text of texts) {
            const key = `${pair}:${text}`;
            let translated = cache.get(key);
            if (!translated) {
              translated = await translator.translate(text);
              cache.set(key, translated);
              cacheChanged = true;
            }
            results.push(translated);
          }
          return results;
        } finally {
          if (cacheChanged) storeCache(cache);
        }
      });
    },
  };
};
