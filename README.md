# React Email Locale Lab

React Email Locale Lab is a development utility for previewing [React Email](https://react.email/) templates in multiple languages while editing them.

[Live demo](https://react-email-locale-lab-integration.vercel.app/) · [Integration example](https://github.com/hducati/react-email-locale-lab-integration-example)

I developed this library after encountering this need while working at an organization that used React Email templates in multiple languages. The templates were usually created first in English, but we also needed to understand how the same layout behaved in languages such as German and Russian, where translated text could change line wrapping, spacing and element dimensions.

During local development, the library renders a React Email template and generates on-demand previews for the selected languages. When the source template changes, Vite refreshes it and the selected previews are generated again, allowing the versions to be inspected side by side in near real time.

The generated translations are intended only for visual inspection of the templates. The library does not replace the localization workflow or the reviewed translations used by the application.

## Install

```bash
pnpm add -D react-email-locale-lab
```

The package supports React and React DOM 18 or 19 as peer dependencies.

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
  watchPaths: ['src/emails'],
  sourceLocale: { code: 'en', label: 'English' },
  locales: [{ code: 'de', label: 'Deutsch' }],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome', component: WelcomeEmail },
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
  watchPaths: ['src/emails'],
  sourceLocale: { code: 'en', label: 'English' },
  locales: [
    { code: 'de', label: 'Deutsch' },
    { code: 'pt-BR', translationCode: 'pt', label: 'Português (Brasil)' },
  ],
  provider: browserTranslatorProvider(),
  templates: {
    welcome: { name: 'Welcome', component: WelcomeEmail },
  },
});
```

When a template declares React Email `PreviewProps`, the lab uses them automatically:

```tsx
WelcomeEmail.PreviewProps = { customerName: 'Taylor' };

templates: {
  welcome: { name: 'Welcome', component: WelcomeEmail },
}
```

Set `props` on the template entry to override `PreviewProps`. A custom `render` function remains available for templates that need bespoke setup.

## Template locations and source watching

Templates can be imported from anywhere in the consuming project. They do not need to live in `src/emails` or follow a specific folder structure.

Use `watchPaths` to select the directories that should trigger preview regeneration during Vite development. Each entry is matched as a path fragment:

```tsx
export default defineEmailLab({
  watchPaths: [
    'src/domains/billing/notifications',
    'src/shared/message-templates',
    'packages/transactional-mail',
  ],
  templates: {
    invoice: { name: 'Invoice', component: InvoiceEmail },
    welcome: { name: 'Welcome', component: WelcomeEmail },
  },
  // sourceLocale, locales and provider...
});
```

When `watchPaths` is omitted, the lab reloads for changes to JavaScript and TypeScript modules anywhere in the Vite application. In a larger codebase, configure it to avoid regenerating previews for unrelated source changes.

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

React Email Locale Lab is currently a development-time proof of concept. It automatically translates rendered React Email content for visual preview only; it is not a production localization system or a replacement for testing in real email clients. Future iterations may protect placeholders, improve RTL coverage, expose language-pack progress and support additional translation providers.
