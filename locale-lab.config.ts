import { defineEmailLabConfig } from './src/config';

export default defineEmailLabConfig({
  sourceLocale: { code: 'en', label: 'English' },
  locales: [
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
  ],
});
