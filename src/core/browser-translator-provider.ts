import type { TranslationProvider } from './types';

export type BrowserTranslatorProviderOptions = {
  maxAttempts?: number;
  retryDelayMs?: number;
};

type BrowserTranslator = {
  translate: (
    text: string,
    options?: { signal?: AbortSignal },
  ) => Promise<string>;
  destroy?: () => void;
};
type TranslatorFactory = {
  availability: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<string>;
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<BrowserTranslator>;
};

declare global {
  interface Window {
    Translator?: TranslatorFactory;
  }
}

const CACHE_STORAGE_KEY = 'react-email-locale-lab:translations:v1';

const readStoredCache = (): Map<string, string> => {
  try {
    const value = window.sessionStorage?.getItem(CACHE_STORAGE_KEY);
    if (!value) return new Map();
    const entries = JSON.parse(value) as unknown;
    if (!Array.isArray(entries)) return new Map();
    return new Map(
      entries.filter(
        (entry): entry is [string, string] =>
          Array.isArray(entry) &&
          entry.length === 2 &&
          entry.every((item) => typeof item === 'string'),
      ),
    );
  } catch {
    return new Map();
  }
};

const storeCache = (cache: Map<string, string>) => {
  try {
    window.sessionStorage?.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify([...cache]),
    );
  } catch {
    // Storage can be unavailable or full. The in-memory cache still works.
  }
};

const isTransientFailure = (error: unknown) =>
  (error instanceof DOMException && error.name === 'UnknownError') ||
  (error instanceof Error &&
    error.message.includes('Other generic failures occurred'));

const wait = (delayMs: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (delayMs === 0) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timeout);
      reject(
        signal?.reason ?? new DOMException('Translation aborted', 'AbortError'),
      );
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export const browserTranslatorProvider = ({
  maxAttempts = 4,
  retryDelayMs = 250,
}: BrowserTranslatorProviderOptions = {}): TranslationProvider => {
  const translators = new Map<string, Promise<BrowserTranslator>>();
  const cache = readStoredCache();
  const queues = new Map<string, Promise<void>>();

  const serialize = async <T>(
    pair: string,
    task: () => Promise<T>,
  ): Promise<T> => {
    const previous = queues.get(pair) ?? Promise.resolve();
    let release = () => {};
    const turn = new Promise<void>((resolve) => {
      release = resolve;
    });
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
      throw new Error(
        'This browser does not support the built-in Translator API. Use a current Chrome build or configure a remote provider.',
      );
    }
    const pair = `${sourceLocale}:${targetLocale}`;
    let translator = translators.get(pair);
    if (!translator) {
      const availability = await window.Translator.availability({
        sourceLanguage: sourceLocale,
        targetLanguage: targetLocale,
      });
      if (availability === 'unavailable')
        throw new Error(
          `The browser cannot translate ${sourceLocale} → ${targetLocale}.`,
        );
      translator = window.Translator.create({
        sourceLanguage: sourceLocale,
        targetLanguage: targetLocale,
      });
      translators.set(pair, translator);
    }
    return translator;
  };

  return {
    name: 'Browser Translator · on-device',
    async translate({ texts, sourceLocale, targetLocale, signal, onRetry }) {
      if (texts.length === 0) return [];
      signal?.throwIfAborted();
      const pair = `${sourceLocale}:${targetLocale}`;
      return serialize(pair, async () => {
        const results: string[] = [];
        let cacheChanged = false;
        try {
          for (const text of texts) {
            signal?.throwIfAborted();
            const key = `${pair}:${text}`;
            let translated = cache.get(key);
            if (!translated) {
              for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                signal?.throwIfAborted();
                const translator = await getTranslator(
                  sourceLocale,
                  targetLocale,
                );
                try {
                  translated = await translator.translate(text, { signal });
                  break;
                } catch (error) {
                  translators.delete(pair);
                  translator.destroy?.();
                  if (!isTransientFailure(error) || attempt === maxAttempts)
                    throw error;
                  const delayMs = retryDelayMs * 2 ** (attempt - 1);
                  onRetry?.({
                    attempt: attempt + 1,
                    maxAttempts,
                    delayMs,
                    error,
                  });
                  await wait(delayMs, signal);
                }
              }
              if (!translated)
                throw new Error(
                  `Translation failed after ${maxAttempts} attempts.`,
                );
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
