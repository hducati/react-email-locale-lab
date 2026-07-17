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
});
