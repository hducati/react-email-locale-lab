# React Email Locale Lab

React Email Locale Lab is a proof of concept for previewing React Email templates in multiple languages while editing them.

The idea came from an internal need I encountered while working at one of the companies in my career. We needed a faster way to understand how email templates behaved across languages, especially when translated text changed the size, spacing or structure of a layout.

This project exists to test the technical and product viability of that workflow. It is not yet intended to be a production localization system or a finished commercial library.

## Install

```bash
pnpm add -D react-email-locale-lab
```

The package expects React 19 and React DOM 19 as peer dependencies.

Create a configuration in the consuming project:

```tsx
import {
  browserTranslatorProvider,
  defineEmailLab,
  EmailLabApp,
} from 'react-email-locale-lab';
import 'react-email-locale-lab/styles.css';

const config = defineEmailLab({
  routeBasePath: '/preview',
  sourceLocale: { code: 'en', label: 'English' },
  locales: [{ code: 'de', label: 'Deutsch' }],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome', render: () => <WelcomeEmail /> },
  },
});

export const App = () => <EmailLabApp config={config} />;
```

Import `react-email-locale-lab/styles.css` once in the consuming application. During local development of this repository, `pnpm pack` can be used to create an installable tarball before publishing to npm.

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4173/preview/welcome`, select up to three languages, then edit `src/emails/welcome.tsx`. Vite refreshes the source and the selected locale cards transition through `stale → translating → ready`.

## Configuration interface

`src/email-lab.config.tsx` defines only the source locale, available target locales, templates, and translation provider. There are no manually maintained translations. The user selects zero to three languages in the UI; translation is not initialized during app startup.

```tsx
export default defineEmailLab({
  routeBasePath: '/preview',
  sourceLocale: { code: 'en', label: 'English' },
  locales: [
    { code: 'de', label: 'Deutsch' },
    { code: 'pt-BR', translationCode: 'pt', label: 'Português (Brasil)' },
  ],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome', render: () => <WelcomeEmail /> },
  },
});
```

## Template routes

Every configured template has a stable preview route:

```text
/preview/welcome
/preview/passwordReset?langs=pt-BR,de
```

Set `routeBasePath` to mount the lab elsewhere, such as `/email-preview`. Selecting a template updates the pathname, selected languages stay in `?langs=`, and browser back/forward navigation restores both template and locales. The host development server must use SPA fallback so these routes return the app entry point; Vite does this automatically in development.

## Languages

Locale identifiers use BCP 47 codes. `code` controls selection, URL state and the rendered HTML `lang` attribute. Optional `translationCode` lets a provider use a broader supported language while preserving a regional application locale—for example, `{ code: 'pt-BR', translationCode: 'pt' }`.

The included Chrome provider supports these language codes in the current Chrome implementation:

```text
ar bg bn cs da de el en es fi fr he hi hr hu id it ja kn ko lt mr
nl no pl pt ro ru sk sl sv ta te th tr uk vi zh zh-Hant
```

The list is provider-specific and may change. The provider checks every source/target pair with `Translator.availability()` at runtime. Chrome's API currently runs on desktop, downloads language packs on demand and is unavailable on mobile. See the [official Translator API language list](https://developer.chrome.com/docs/ai/translator-api#supported-languages).

The provider receives extracted text nodes and translatable attributes (`alt`, `title`, `aria-label`). When source copy changes, every target preview is marked stale and new or changed messages are automatically translated again. Unchanged messages are reused from the in-memory cache.

The included provider uses the browser's built-in Translator API. Language packs are lazy-loaded per selected pair, and translated messages are cached by source text and locale. The source template does not leave the browser. In a browser without this API, the preview reports an actionable error instead of downloading a large JavaScript model or freezing startup.

## Current scope

React Email Locale Lab is currently a POC for validating the developer experience, not a production localization system. It automatically translates rendered text for preview only. Future iterations may protect placeholders, expose language-pack progress and offer an explicitly configured server provider for teams whose browsers do not support on-device translation.
