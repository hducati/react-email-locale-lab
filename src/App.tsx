import { PreviewCard } from './app/components/PreviewCard';
import { useEmailLab } from './app/hooks/useEmailLab';
import type { EmailLabConfig } from './core/types';

export const EmailLabApp = ({ config }: { config: EmailLabConfig }) => {
  const lab = useEmailLab(config);

  return (
    <main className="email-lab">
      <header className="topbar">
        <div className="topbar-copy">
          <div className="brand"><span className="brand-mark" /><p className="eyebrow">React Email Locale Lab</p></div>
          <h1>See every language while you build.</h1>
        </div>
        <div className="controls">
          <label>
            Template
            <select value={lab.selectedTemplateId} onChange={(event) => lab.selectTemplate(event.target.value)}>
              {lab.templateIds.map((id) => <option key={id} value={id}>{config.templates[id].name}</option>)}
            </select>
          </label>
          <span className="provider">Provider: {config.provider.name}</span>
        </div>
      </header>

      <section className="locale-picker">
        <div><strong>Preview languages</strong><span>Select up to three. Language packs load only when selected.</span></div>
        <div className="locale-options">
          {config.locales.map((locale) => (
            <button
              className={lab.activeLocaleCodes.includes(locale.code) ? 'locale-active' : ''}
              disabled={!lab.activeLocaleCodes.includes(locale.code) && lab.activeLocaleCodes.length >= 3}
              key={locale.code}
              onClick={() => lab.toggleLocale(locale.code)}
            >
              <i />{locale.label}
            </button>
          ))}
        </div>
      </section>

      <section className="notice"><span className="live-dot" />Watching source changes through Vite HMR.</section>
      {lab.activeLocales.length === 0 && (
        <section className="empty-state">
          <strong>Select a language to generate a preview.</strong>
          <span>The source template renders immediately; translation starts only on demand.</span>
        </section>
      )}
      <section className="grid">
        {lab.previewLocales.map((locale) => (
          <PreviewCard
            key={locale.code}
            locale={locale}
            preview={lab.previews[locale.code] ?? { html: lab.sourceHtml, status: 'stale' }}
            sourceRevision={lab.sourceRevision}
            onRefresh={lab.refreshPreviews}
          />
        ))}
      </section>
    </main>
  );
};
