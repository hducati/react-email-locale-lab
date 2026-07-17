import { describe, expect, it } from 'vitest';
import { templateIdFromUrl, urlForTemplate } from '../app/utils/url-state';

describe('template preview routes', () => {
  const templates = ['order', 'passwordReset'];

  it('selects a template from a configurable route', () => {
    expect(templateIdFromUrl(new URL('http://localhost/email-preview/passwordReset?langs=de'), templates, '/email-preview'))
      .toBe('passwordReset');
  });

  it('builds a canonical template URL and preserves selected locales', () => {
    expect(urlForTemplate(new URL('http://localhost/?template=order&langs=pt-BR,de'), 'passwordReset', '/preview').pathname)
      .toBe('/preview/passwordReset');
    expect(urlForTemplate(new URL('http://localhost/?template=order&langs=pt-BR,de'), 'passwordReset', '/preview').search)
      .toBe('?langs=pt-BR%2Cde');
  });
});
