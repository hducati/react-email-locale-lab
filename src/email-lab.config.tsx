import { defineEmailLab } from './core/types';
import { browserTranslatorProvider } from './core/browser-translator-provider';
import { WelcomeEmail } from './emails/welcome';
import { viteSourceUpdates } from './adapters/vite';

export default defineEmailLab({
  sourceLocale: { code: 'en', label: 'English' },
  sourceUpdates: viteSourceUpdates(import.meta.hot, { watchPaths: ['src/emails'] }),
  locales: [
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
  ],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome email', component: WelcomeEmail },
  },
});
