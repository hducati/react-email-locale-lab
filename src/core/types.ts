import type { ComponentType, ReactElement } from 'react';

export type Locale = {
  code: string;
  label: string;
  translationCode?: string;
};
export type PreviewableEmailComponent = ComponentType<any> & {
  PreviewProps?: Record<string, unknown>;
};
export type EmailTemplate = {
  name: string;
} & (
  | {
      component: PreviewableEmailComponent;
      props?: Record<string, unknown>;
      render?: never;
    }
  | { render: () => ReactElement; component?: never; props?: never }
);
export type TranslationRequest = {
  texts: string[];
  sourceLocale: string;
  targetLocale: string;
  signal?: AbortSignal;
};
export type TranslationProvider = {
  name: string;
  translate: (request: TranslationRequest) => Promise<string[]>;
};
export type SourceUpdates = {
  subscribe: (onUpdate: () => void) => () => void;
};
export type EmailLabConfig = {
  sourceLocale: Locale;
  locales: Locale[];
  templates: Record<string, EmailTemplate>;
  provider: TranslationProvider;
  routeBasePath?: string;
  sourceUpdates?: SourceUpdates;
};

export const defineEmailLab = (config: EmailLabConfig): EmailLabConfig =>
  config;
