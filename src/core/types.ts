import type { ReactElement } from 'react';

export type Locale = {
  code: string;
  label: string;
  translationCode?: string;
};
export type EmailTemplate = { name: string; render: () => ReactElement };
export type TranslationRequest = { texts: string[]; sourceLocale: string; targetLocale: string };
export type TranslationProvider = {
  name: string;
  translate: (request: TranslationRequest) => Promise<string[]>;
};
export type EmailLabConfig = {
  sourceLocale: Locale;
  locales: Locale[];
  templates: Record<string, EmailTemplate>;
  provider: TranslationProvider;
  routeBasePath?: string;
};

export const defineEmailLab = (config: EmailLabConfig): EmailLabConfig => config;
