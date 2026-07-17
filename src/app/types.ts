export type PreviewStatus = 'source' | 'stale' | 'translating' | 'ready' | 'error';

export type PreviewState = {
  html: string;
  status: PreviewStatus;
  revision?: string;
  error?: string;
};
