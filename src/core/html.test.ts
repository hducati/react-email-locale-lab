import { describe, expect, it } from 'vitest';
import { directionForLocale } from './html';

describe('directionForLocale', () => {
  it('recognizes RTL languages in regional BCP 47 locales', () => {
    expect(directionForLocale('ar-SA')).toBe('rtl');
    expect(directionForLocale('he-IL')).toBe('rtl');
    expect(directionForLocale('fa_IR')).toBe('rtl');
  });

  it('uses left-to-right direction for other locales', () => {
    expect(directionForLocale('ha')).toBe('ltr');
    expect(directionForLocale('de')).toBe('ltr');
    expect(directionForLocale('pt-BR')).toBe('ltr');
  });

  it('uses an explicit script subtag instead of the language default', () => {
    expect(directionForLocale('ar-Latn')).toBe('ltr');
    expect(directionForLocale('ku-Latn-TR')).toBe('ltr');
    expect(directionForLocale('en-Arab')).toBe('rtl');
  });

  it('does not interpret extension values as script subtags', () => {
    expect(directionForLocale('ar-u-nu-latn')).toBe('rtl');
    expect(directionForLocale('ar-x-latn')).toBe('rtl');
    expect(directionForLocale('ar-Latn-u-nu-arab')).toBe('ltr');
  });
});
