import { afterEach, describe, expect, it } from 'vitest';
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
});

const createSessionStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
};
