import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import { localeLabPlugin, parseOptions } from './cli';

describe('Locale Lab CLI options', () => {
  it.each([
    ['dev', '--dir'],
    ['dev', '--dir', '--open'],
  ])('rejects --dir without a path: %j', (...args) => {
    expect(() => parseOptions(args)).toThrow('--dir requires a path');
  });

  it.each([
    ['dev', '--port'],
    ['dev', '--port', '--open'],
  ])('rejects --port without a value: %j', (...args) => {
    expect(() => parseOptions(args)).toThrow('--port requires a value');
  });
});

describe('Locale Lab CLI host', () => {
  it('runs the SPA fallback through Vite HTML transforms', async () => {
    const root = resolve(import.meta.dirname, '..');
    const server = await createServer({
      configFile: false,
      root,
      plugins: [
        react(),
        localeLabPlugin(
          resolve(root, 'locale-lab.config.ts'),
          resolve(root, 'src/emails'),
        ),
      ],
      server: { host: '127.0.0.1', port: 0 },
    });

    try {
      await server.listen();
      const url = server.resolvedUrls?.local[0];
      expect(url).toBeDefined();
      const html = await fetch(new URL('/preview/welcome', url)).then(
        (response) => response.text(),
      );

      expect(html).toContain('/@react-refresh');
      expect(html).toContain('window.$RefreshReg$');
      expect(html).toContain('/@locale-lab-entry');
    } finally {
      await server.close();
    }
  });
});
