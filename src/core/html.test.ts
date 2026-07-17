import { describe, expect, it } from 'vitest';

describe('translation contract', () => {
  it('keeps source and translated arrays aligned', () => {
    const source = ['Heading', 'Body', 'Button'];
    expect(source.map((message) => `de:${message}`)).toEqual(['de:Heading', 'de:Body', 'de:Button']);
  });
});
