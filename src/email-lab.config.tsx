import { defineEmailLab } from './core/types';
import { browserTranslatorProvider } from './core/browser-translator-provider';
import { WelcomeEmail } from './emails/welcome';

export default defineEmailLab({
  sourceLocale: { code: 'en', label: 'English' },
  locales: [
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
  ],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome email', render: () => <WelcomeEmail /> },
  },
});
