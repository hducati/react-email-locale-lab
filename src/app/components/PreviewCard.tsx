import { extractPreheader } from '../../core/html';
import type { Locale } from '../../core/types';
import type { PreviewState } from '../types';

type PreviewCardProps = {
  locale: Locale;
  preview: PreviewState;
  sourceRevision: string;
  onRefresh: () => void;
};

export const PreviewCard = ({
  locale,
  preview,
  sourceRevision,
  onRefresh,
}: PreviewCardProps) => (
  <article className="preview-card">
    <header className="preview-header">
      <div>
        <strong>{locale.label}</strong>
        <span>{locale.code}</span>
      </div>
      <div className={`status status-${preview.status}`}>
        <i />
        {preview.status}
      </div>
    </header>
    <div className="revision">
      source {sourceRevision || '…'} · preview {preview.revision ?? 'pending'}
    </div>
    <div className="preheader">
      <span>Preheader</span>
      <strong>{extractPreheader(preview.html) ?? 'Not set'}</strong>
    </div>
    <iframe
      title={`${locale.label} preview`}
      srcDoc={preview.html}
      sandbox="allow-popups allow-popups-to-escape-sandbox"
    />
    {preview.error && <div className="preview-error">{preview.error}</div>}
    {preview.status !== 'source' && (
      <button type="button" className="refresh" onClick={onRefresh}>
        Regenerate translation
      </button>
    )}
  </article>
);
