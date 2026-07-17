const DEFAULT_ROUTE_BASE_PATH = '/preview';

export const normalizeRouteBasePath = (value = DEFAULT_ROUTE_BASE_PATH) => {
  const normalized = `/${value}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || DEFAULT_ROUTE_BASE_PATH;
};

export const templateIdFromUrl = (url: URL, templateIds: string[], routeBasePath?: string) => {
  const basePath = normalizeRouteBasePath(routeBasePath);
  const routeValue = url.pathname.startsWith(`${basePath}/`)
    ? decodeURIComponent(url.pathname.slice(basePath.length + 1))
    : undefined;
  const candidate = routeValue || url.searchParams.get('template') || undefined;
  return candidate && templateIds.includes(candidate) ? candidate : templateIds[0];
};

export const localeCodesFromUrl = (url: URL, limit = 3) =>
  url.searchParams.get('langs')?.split(',').filter(Boolean).slice(0, limit) ?? [];

export const urlForTemplate = (url: URL, templateId: string, routeBasePath?: string) => {
  const next = new URL(url);
  next.pathname = `${normalizeRouteBasePath(routeBasePath)}/${encodeURIComponent(templateId)}`;
  next.searchParams.delete('template');
  return next;
};

export const urlForLocales = (url: URL, localeCodes: string[]) => {
  const next = new URL(url);
  if (localeCodes.length) next.searchParams.set('langs', localeCodes.join(','));
  else next.searchParams.delete('langs');
  return next;
};
