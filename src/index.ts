import './styles.css';

export { EmailLabApp } from './App';
export { browserTranslatorProvider } from './core/browser-translator-provider';
export type { BrowserTranslatorProviderOptions } from './core/browser-translator-provider';
export { defineEmailLab } from './core/types';
export type {
  EmailLabConfig,
  EmailTemplate,
  Locale,
  SourceUpdates,
  TranslationProvider,
  TranslationRequest,
  TranslationRetry,
} from './core/types';
