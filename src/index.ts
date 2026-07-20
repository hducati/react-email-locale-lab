import './styles.css';

export { EmailLabApp } from './App';
export type { BrowserTranslatorProviderOptions } from './core/browser-translator-provider';
export { browserTranslatorProvider } from './core/browser-translator-provider';
export type {
  EmailLabConfig,
  EmailTemplate,
  Locale,
  SourceUpdates,
  TranslationProvider,
  TranslationRequest,
  TranslationRetry,
} from './core/types';
export { defineEmailLab } from './core/types';
