const TRANSLATABLE_ATTRIBUTES = ['alt', 'title', 'aria-label'];
const RTL_LANGUAGES = new Set([
  'ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'khw', 'ks', 'ku', 'nqo', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi',
]);

export const directionForLocale = (locale: string): 'ltr' | 'rtl' => {
  const language = locale.trim().split(/[-_]/, 1)[0].toLowerCase();
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
};

export type MessageSlot = { value: string; apply: (translated: string) => void };
const isMeaningful = (value: string) => /\p{L}/u.test(value);

export const collectMessages = (document: Document): MessageSlot[] => {
  const slots: MessageSlot[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const parent = text.parentElement;
    const value = text.data.trim();
    if (parent && !['STYLE', 'SCRIPT'].includes(parent.tagName) && isMeaningful(value)) {
      const leading = text.data.match(/^\s*/)?.[0] ?? '';
      const trailing = text.data.match(/\s*$/)?.[0] ?? '';
      slots.push({ value, apply: (translated) => { text.data = `${leading}${translated}${trailing}`; } });
    }
    node = walker.nextNode();
  }
  for (const element of document.body.querySelectorAll('*')) {
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const value = element.getAttribute(attribute)?.trim();
      if (value && isMeaningful(value)) {
        slots.push({ value, apply: (translated) => element.setAttribute(attribute, translated) });
      }
    }
  }
  return slots;
};

export const localizeHtml = async (
  sourceHtml: string,
  sourceLocale: string,
  targetLocale: string,
  translate: (texts: string[]) => Promise<string[]>,
): Promise<string> => {
  if (targetLocale === sourceLocale) return sourceHtml;
  const document = new DOMParser().parseFromString(sourceHtml, 'text/html');
  document.documentElement.lang = targetLocale;
  document.documentElement.dir = directionForLocale(targetLocale);
  const slots = collectMessages(document);
  const translated = await translate(slots.map((slot) => slot.value));
  slots.forEach((slot, index) => slot.apply(translated[index] ?? slot.value));
  return `<!doctype html>${document.documentElement.outerHTML}`;
};

export const fingerprint = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash).slice(0, 6), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const extractPreheader = (html: string): string | undefined => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const hidden = Array.from(document.body.querySelectorAll<HTMLElement>('[style]')).find((element) =>
    element.style.display === 'none' && element.textContent?.trim(),
  );
  const text = hidden?.textContent?.replace(/[\u00A0\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').trim();
  return text || undefined;
};
