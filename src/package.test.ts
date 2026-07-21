import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const vitePackageJson = require('vite/package.json');

describe('package runtime contract', () => {
  it('requires every Node version supported by the runtime Vite dependency', () => {
    expect(packageJson.engines?.node).toBe(vitePackageJson.engines.node);
  });
});
