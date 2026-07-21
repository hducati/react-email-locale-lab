import type { EmailLabConfig, Locale, TranslationProvider } from './core/types';

export type EmailLabDevConfig = {
  sourceLocale: Locale;
  locales: Locale[];
  provider?: TranslationProvider;
  routeBasePath?: string;
};

export const defineEmailLabConfig = (
  config: EmailLabDevConfig,
): EmailLabDevConfig => config;

export type ResolvedEmailLabDevConfig = Omit<EmailLabConfig, 'sourceUpdates'>;
