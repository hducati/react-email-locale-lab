import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import { isMainModule, localeLabPlugin, parseOptions } from './cli';

describe('Locale Lab CLI entry', () => {
  it('recognizes the module when executed through a package-manager symlink', () => {
    const directory = mkdtempSync(resolve(tmpdir(), 'locale-lab-cli-'));
    const modulePath = fileURLToPath(new URL('./cli.ts', import.meta.url));
    const executablePath = resolve(directory, 'locale-lab');
    symlinkSync(modulePath, executablePath);

    try {
      expect(
        isMainModule(new URL('./cli.ts', import.meta.url).href, executablePath),
      ).toBe(true);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});

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

  it.each(['abc', '0', '-1'])('rejects invalid port %j', (port) => {
    expect(() => parseOptions(['dev', '--port', port])).toThrow(
      '--port must be a positive integer',
    );
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
      const response = await fetch(new URL('/preview/welcome', url));
      expect(response.status).toBe(200);
      const html = await response.text();

      expect(html).toContain('/@react-refresh');
      expect(html).toContain('window.$RefreshReg$');
      expect(html).toContain('/@locale-lab-entry');
    } finally {
      await server.close();
    }
  });
});
