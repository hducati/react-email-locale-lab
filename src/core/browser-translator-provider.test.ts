import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserTranslatorProvider } from './browser-translator-provider';

describe('browserTranslatorProvider', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('serializes overlapping requests for the same language pair', async () => {
    let translating = false;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: createSessionStorage(),
        Translator: {
          availability: async () => 'available',
          create: async () => ({
            async translate(text: string) {
              if (translating) throw new Error('Translator is already processing another request');
              translating = true;
              await new Promise((resolve) => setTimeout(resolve, 5));
              translating = false;
              return `pt:${text}`;
            },
          }),
        },
      },
    });

    const provider = browserTranslatorProvider();
    const request = (text: string) => provider.translate({ texts: [text], sourceLocale: 'en', targetLocale: 'pt-BR' });

    await expect(Promise.all([request('Order confirmed'), request('Reset your password')]))
      .resolves.toEqual([['pt:Order confirmed'], ['pt:Reset your password']]);
  });

  it('reuses cached translations after the provider is recreated by a page reload', async () => {
    const sessionStorage = createSessionStorage();
    let translations = 0;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage,
        Translator: {
          availability: async () => 'available',
          create: async () => ({
            async translate(text: string) {
              translations += 1;
              return `de:${text}`;
            },
          }),
        },
      },
    });

    const request = { texts: ['Order confirmed'], sourceLocale: 'en', targetLocale: 'de' };
    await browserTranslatorProvider().translate(request);
    await browserTranslatorProvider().translate(request);

    expect(translations).toBe(1);
  });

  it('persists successful translations when a later item fails', async () => {
    const sessionStorage = createSessionStorage();
    const attempts: string[] = [];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage,
        Translator: {
          availability: async () => 'available',
          create: async () => ({
            async translate(text: string) {
              attempts.push(text);
              if (text === 'Body') throw new Error('Translation failed');
              return `de:${text}`;
            },
          }),
        },
      },
    });

    await expect(browserTranslatorProvider().translate({
      texts: ['Heading', 'Body'], sourceLocale: 'en', targetLocale: 'de',
    })).rejects.toThrow('Translation failed');
    await expect(browserTranslatorProvider().translate({
      texts: ['Heading'], sourceLocale: 'en', targetLocale: 'de',
    })).resolves.toEqual(['de:Heading']);

    expect(attempts).toEqual(['Heading', 'Body']);
  });

  it('stops a stale batch before translating its remaining texts', async () => {
    const controller = new AbortController();
    const attempts: string[] = [];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: createSessionStorage(),
        Translator: {
          availability: async () => 'available',
          create: async () => ({
            async translate(text: string) {
              attempts.push(text);
              controller.abort();
              return `de:${text}`;
            },
          }),
        },
      },
    });

    await expect(browserTranslatorProvider().translate({
      texts: ['Old heading', 'Old body'],
      sourceLocale: 'en',
      targetLocale: 'de',
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });

    expect(attempts).toEqual(['Old heading']);
  });

  it('recreates the translator and retries transient generic failures', async () => {
    let sessions = 0;
    const destroyed: number[] = [];
    const onRetry = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: createSessionStorage(),
        Translator: {
          availability: async () => 'available',
          create: async () => {
            const session = ++sessions;
            return {
              destroy: () => { destroyed.push(session); },
              async translate(text: string) {
                if (session < 4) {
                  throw new DOMException('Other generic failures occurred', 'UnknownError');
                }
                return `pl:${text}`;
              },
            };
          },
        },
      },
    });

    await expect(browserTranslatorProvider({ retryDelayMs: 0 }).translate({
      texts: ['Interview scheduled'],
      sourceLocale: 'en',
      targetLocale: 'pl',
      onRetry,
    })).resolves.toEqual(['pl:Interview scheduled']);

    expect(sessions).toBe(4);
    expect(destroyed).toEqual([1, 2, 3]);
    expect(onRetry.mock.calls.map(([retry]) => retry.attempt)).toEqual([2, 3, 4]);
  });

  it('surfaces a transient failure only after four attempts', async () => {
    const onRetry = vi.fn();
    let attempts = 0;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: createSessionStorage(),
        Translator: {
          availability: async () => 'available',
          create: async () => ({
            destroy: () => undefined,
            async translate() {
              attempts += 1;
              throw new DOMException('Other generic failures occurred', 'UnknownError');
            },
          }),
        },
      },
    });

    await expect(browserTranslatorProvider({ retryDelayMs: 0 }).translate({
      texts: ['Order confirmed'],
      sourceLocale: 'en',
      targetLocale: 'pl',
      onRetry,
    })).rejects.toThrow('Other generic failures occurred');

    expect(attempts).toBe(4);
    expect(onRetry).toHaveBeenCalledTimes(3);
  });
});

const createSessionStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
};
