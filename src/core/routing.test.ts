import { describe, expect, it } from 'vitest';
import {
  localeCodesFromUrl,
  templateIdFromUrl,
  toggleLocaleCode,
  urlForTemplate,
} from '../app/utils/url-state';

describe('template preview routes', () => {
  const templates = ['order', 'passwordReset'];

  it('selects a template from a configurable route', () => {
    expect(
      templateIdFromUrl(
        new URL('http://localhost/email-preview/passwordReset?langs=de'),
        templates,
        '/email-preview',
      ),
    ).toBe('passwordReset');
  });

  it('builds a canonical template URL and preserves selected locales', () => {
    expect(
      urlForTemplate(
        new URL('http://localhost/?template=order&langs=pt-BR,de'),
        'passwordReset',
        '/preview',
      ).pathname,
    ).toBe('/preview/passwordReset');
    expect(
      urlForTemplate(
        new URL('http://localhost/?template=order&langs=pt-BR,de'),
        'passwordReset',
        '/preview',
      ).search,
    ).toBe('?langs=pt-BR%2Cde');
  });

  it('restores every selected locale from a shared URL', () => {
    const localeCodes = [
      'ar',
      'de',
      'es',
      'fr',
      'he',
      'ja',
      'pt-BR',
      'ru',
      'zh',
    ];
    expect(
      localeCodesFromUrl(
        new URL(
          `http://localhost/preview/order?langs=${localeCodes.join(',')}`,
        ),
      ),
    ).toEqual(localeCodes);
  });

  it('adds locales without imposing a selection limit', () => {
    const localeCodes = ['ar', 'de', 'es', 'fr', 'he', 'ja', 'pt-BR', 'ru'];
    expect(toggleLocaleCode(localeCodes, 'zh')).toEqual([...localeCodes, 'zh']);
  });
});
