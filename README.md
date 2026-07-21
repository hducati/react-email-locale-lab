# React Email Locale Lab

React Email Locale Lab is a development utility for previewing [React Email](https://react.email/) templates in multiple languages while editing them.

[Live demo](https://react-email-locale-lab-integration.vercel.app/) · [Integration example](https://github.com/hducati/react-email-locale-lab-integration-example)

I developed this library after encountering this need while working at an organization that used React Email templates in multiple languages. The templates were usually created first in English, but we also needed to understand how the same layout behaved in languages such as German and Russian, where translated text could change line wrapping, spacing and element dimensions.

During local development, the library renders a React Email template and generates on-demand previews for the selected languages. When the source template changes, Vite refreshes it and the selected previews are generated again, allowing the versions to be inspected side by side in near real time.

The generated translations are intended only for visual inspection of the templates. The library does not replace the localization workflow or the reviewed translations used by the application.

## Quick start

```bash
pnpm add -D react-email-locale-lab
```

Create `locale-lab.config.ts` at the project root. These are the only project-specific inputs required by the conventional path:

```ts
import { defineEmailLabConfig } from 'react-email-locale-lab/config';

export default defineEmailLabConfig({
  sourceLocale: { code: 'en', label: 'English' },
  locales: [{ code: 'de', label: 'Deutsch' }],
});
```

Then start the owned development host:

```bash
pnpm locale-lab dev
```

Locale Lab discovers default exports or a single component export under `./emails`, derives stable ids and names from their relative paths, uses React Email `PreviewProps`, and owns the Vite host, styles, routing and refresh behavior. Use `--dir <path>`, `--port <number>` or `--open` when needed.

Open `http://localhost:4174/preview/<template>`, select up to three languages, then edit the template. The browser translator is used by default. Set `provider` in the config when the project needs a custom translation adapter.

The package supports React and React DOM 18 or 19. The existing `EmailLabApp` interface remains available for advanced embedding and custom hosts.

## Advanced embedding

Most projects should use the CLI described above. Use the embedding interface only when templates need custom rendering or when Locale Lab must run inside an existing host.

With this interface, the consumer explicitly owns the template registry, translation provider, source updates and host application:

```tsx
import {
  browserTranslatorProvider,
  defineEmailLab,
} from 'react-email-locale-lab';
import { viteSourceUpdates } from 'react-email-locale-lab/vite';
import { WelcomeEmail } from './emails/welcome';

export default defineEmailLab({
  routeBasePath: '/preview',
  sourceUpdates: viteSourceUpdates(import.meta.hot, { watchPaths: ['src/emails'] }),
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

### Template requirements

The lab renders templates synchronously to static HTML. Prefer presentation-only email components whose output is determined by props. Pass preview data through `PreviewProps` or `props`; fetch production data before rendering the email.

Data fetching in `useEffect`, async/Server Components, application routes and components that require missing providers may not render as expected. Use `render` to add synchronous providers or wrappers:

```tsx
templates: {
  welcome: {
    name: 'Welcome',
    render: () => <WelcomeEmail />,
  },
}
```

## Template discovery and source updates

The CLI discovers templates under `./emails`, matching the React Email convention. Pass `--dir <path>` to use another directory, such as `src/emails`. Files may be nested and must export the email component as the default export or as their only component export.

When using advanced embedding, templates can be imported from anywhere in the consuming project and do not need to follow a specific directory structure.

The embedded interface is bundler-agnostic. Without `sourceUpdates`, previews still work and can be regenerated manually. Vite users can opt into HMR updates and restrict them to path fragments:

```tsx
import { viteSourceUpdates } from 'react-email-locale-lab/vite';

sourceUpdates: viteSourceUpdates(import.meta.hot, {
  watchPaths: ['src/message-templates', 'packages/notifications'],
}),
```

Omit `watchPaths` to react to any JavaScript or TypeScript module update. Other tools can implement the small `SourceUpdates` subscription interface and pass it through `sourceUpdates`.

## Template routes

Every configured template has a stable preview route:

```text
/preview/welcome
/preview/passwordReset?langs=pt-BR,de
```

Set `routeBasePath` to mount the lab elsewhere, such as `/email-preview`. Selecting a template updates the pathname, selected languages stay in `?langs=`, and browser back/forward navigation restores both template and locales. The CLI configures SPA fallback automatically; custom hosts must provide it themselves.

## Languages

Locale identifiers use BCP 47 codes. `code` controls selection, URL state and the rendered HTML `lang` attribute. Optional `translationCode` lets a provider use a broader supported language while preserving a regional application locale—for example, `{ code: 'pt-BR', translationCode: 'pt' }`.

The included Chrome provider supports these language codes in the current Chrome implementation:

```text
ar bg bn cs da de el en es fi fr he hi hr hu id it ja kn ko lt mr
nl no pl pt ro ru sk sl sv ta te th tr uk vi zh zh-Hant
```

The list is provider-specific and may change. The provider checks every source/target pair with `Translator.availability()` at runtime. Chrome's API currently runs on desktop, downloads language packs on demand and is unavailable on mobile. See the [official Translator API language list](https://developer.chrome.com/docs/ai/translator-api#supported-languages).

The provider receives extracted text nodes and translatable attributes (`alt`, `title`, `aria-label`). When source copy changes, every target preview is marked stale and new or changed messages are automatically translated again. Unchanged messages are reused from the session cache.

The included provider uses the browser's built-in Translator API. Language packs are lazy-loaded per selected pair, and translated messages are cached by source text and locale in session storage so unchanged copy is reused across Vite reloads. The source template does not leave the browser. In a browser without this API, the preview reports an actionable error instead of downloading a large JavaScript model or freezing startup.

Translated previews set both the BCP 47 `lang` attribute and the corresponding `dir` attribute on the rendered document. Right-to-left locales such as Arabic and Hebrew therefore render with `dir="rtl"`; other target locales explicitly use `dir="ltr"`.

## Current scope

React Email Locale Lab is currently a development-time proof of concept. It automatically translates rendered React Email content for visual preview only; it is not a production localization system or a replacement for testing in real email clients. Future iterations may protect placeholders, improve RTL coverage, expose language-pack progress and support additional translation providers.
