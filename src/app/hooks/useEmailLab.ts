import { useEffect, useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fingerprint, localizeHtml } from '../../core/html';
import type { EmailLabConfig } from '../../core/types';
import type { PreviewState } from '../types';
import { localeCodesFromUrl, templateIdFromUrl, urlForLocales, urlForTemplate } from '../utils/url-state';

const LOCALE_LIMIT = 3;

export const useEmailLab = (config: EmailLabConfig) => {
  const templateIds = useMemo(() => Object.keys(config.templates), [config.templates]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() =>
    templateIdFromUrl(new URL(window.location.href), templateIds, config.routeBasePath));
  const [activeLocaleCodes, setActiveLocaleCodes] = useState(() =>
    localeCodesFromUrl(new URL(window.location.href), LOCALE_LIMIT));
  const [previews, setPreviews] = useState<Record<string, PreviewState>>({});
  const [sourceRevision, setSourceRevision] = useState('');
  const [generation, setGeneration] = useState(0);

  const template = config.templates[selectedTemplateId] ?? config.templates[templateIds[0]];
  const sourceHtml = useMemo(() => `<!doctype html>${renderToStaticMarkup(template.render())}`, [template]);
  const activeLocales = config.locales.filter((locale) => activeLocaleCodes.includes(locale.code));
  const previewLocales = [config.sourceLocale, ...activeLocales];

  useEffect(() => {
    const currentId = templateIdFromUrl(new URL(window.location.href), templateIds, config.routeBasePath);
    window.history.replaceState({}, '', urlForTemplate(new URL(window.location.href), currentId, config.routeBasePath));

    const restoreUrlState = () => {
      setSelectedTemplateId(templateIdFromUrl(new URL(window.location.href), templateIds, config.routeBasePath));
      setActiveLocaleCodes(localeCodesFromUrl(new URL(window.location.href), LOCALE_LIMIT));
    };
    window.addEventListener('popstate', restoreUrlState);
    return () => window.removeEventListener('popstate', restoreUrlState);
  }, [config.routeBasePath, templateIds]);

  useEffect(() => {
    const beforeUpdate = (payload: { updates: Array<{ path: string }> }) => {
      if (payload.updates.some((update) => update.path.includes('/src/emails/'))) window.location.reload();
    };
    import.meta.hot?.on('vite:beforeUpdate', beforeUpdate);
    return () => import.meta.hot?.off('vite:beforeUpdate', beforeUpdate);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fingerprint(sourceHtml).then((revision) => { if (!cancelled) setSourceRevision(revision); });
    return () => { cancelled = true; };
  }, [sourceHtml]);

  useEffect(() => {
    let cancelled = false;
    setPreviews((current) => Object.fromEntries(previewLocales.map((locale) => [
      locale.code,
      locale.code === config.sourceLocale.code
        ? { html: sourceHtml, status: 'source' }
        : { html: current[locale.code]?.html ?? sourceHtml, status: 'stale', revision: current[locale.code]?.revision },
    ])));

    const translatePreviews = async () => {
      for (const locale of activeLocales) {
        if (cancelled) return;
        setPreviews((current) => ({
          ...current,
          [locale.code]: { ...current[locale.code], status: 'translating', error: undefined },
        }));
        try {
          const html = await localizeHtml(sourceHtml, config.sourceLocale.code, locale.code, (texts) =>
            config.provider.translate({
              texts,
              sourceLocale: config.sourceLocale.translationCode ?? config.sourceLocale.code,
              targetLocale: locale.translationCode ?? locale.code,
            }));
          const revision = await fingerprint(sourceHtml);
          if (!cancelled) {
            setPreviews((current) => ({ ...current, [locale.code]: { html, status: 'ready', revision } }));
          }
        } catch (error) {
          if (!cancelled) {
            setPreviews((current) => ({
              ...current,
              [locale.code]: {
                ...current[locale.code],
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
              },
            }));
          }
        }
      }
    };
    void translatePreviews();
    return () => { cancelled = true; };
  }, [sourceHtml, generation, activeLocaleCodes.join(',')]);

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    window.history.pushState({}, '', urlForTemplate(new URL(window.location.href), templateId, config.routeBasePath));
  };

  const toggleLocale = (localeCode: string) => {
    const next = activeLocaleCodes.includes(localeCode)
      ? activeLocaleCodes.filter((code) => code !== localeCode)
      : [...activeLocaleCodes, localeCode].slice(0, LOCALE_LIMIT);
    setActiveLocaleCodes(next);
    window.history.replaceState({}, '', urlForLocales(new URL(window.location.href), next));
  };

  return {
    activeLocaleCodes,
    activeLocales,
    previewLocales,
    previews,
    refreshPreviews: () => setGeneration((value) => value + 1),
    selectTemplate,
    selectedTemplateId,
    sourceHtml,
    sourceRevision,
    templateIds,
    toggleLocale,
  };
};
