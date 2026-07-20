import './styles.css';

export { EmailLabApp } from './App';
export { browserTranslatorProvider } from './core/browser-translator-provider';
export type {
  EmailLabConfig,
  EmailTemplate,
  Locale,
  SourceUpdates,
  TranslationProvider,
  TranslationRequest,
} from './core/types';
export { defineEmailLab } from './core/types';
