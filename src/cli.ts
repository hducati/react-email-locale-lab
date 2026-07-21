#!/usr/bin/env node

import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { createServer, type Plugin } from 'vite';

const CONFIG_NAMES = [
  'locale-lab.config.ts',
  'locale-lab.config.tsx',
  'locale-lab.config.js',
  'locale-lab.config.mjs',
];
const EMAIL_EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js']);

type CliOptions = { root: string; dir?: string; port: number; open: boolean };

export const parseOptions = (args: string[]): CliOptions => {
  if (args[0] && args[0] !== 'dev') {
    throw new Error(
      `Unknown command "${args[0]}". Usage: locale-lab dev [--dir emails] [--port 4174] [--open]`,
    );
  }
  const root = resolve(process.cwd());
  let dir: string | undefined;
  let port = 4174;
  let open = false;
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    const readValue = (description: string) => {
      const value = args[index + 1];
      if (!value || value.startsWith('--'))
        throw new Error(`${arg} requires ${description}.`);
      index += 1;
      return value;
    };
    if (arg === '--dir') dir = readValue('a path');
    else if (arg === '--port') port = Number(readValue('a value'));
    else if (arg === '--open') open = true;
    else throw new Error(`Unknown option "${arg}".`);
  }
  if (!Number.isInteger(port) || port < 1)
    throw new Error('--port must be a positive integer.');
  return { root, dir, port, open };
};

const findConfig = (root: string) => {
  const name = CONFIG_NAMES.find((candidate) =>
    existsSync(resolve(root, candidate)),
  );
  if (!name) {
    throw new Error(
      `Missing Locale Lab config. Create locale-lab.config.ts with sourceLocale and locales.`,
    );
  }
  return resolve(root, name);
};

const findEmailsDir = (root: string, configured?: string) => {
  const directory = resolve(root, configured ?? 'emails');
  if (existsSync(directory)) return directory;
  const suggestion =
    !configured && existsSync(resolve(root, 'src/emails'))
      ? ' Found ./src/emails; run locale-lab dev --dir src/emails.'
      : '';
  throw new Error(
    `No email directory found at ${configured ?? './emails'}.${suggestion}`,
  );
};

const discoverEmails = (directory: string): string[] => {
  const files: string[] = [];
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (
        EMAIL_EXTENSIONS.has(extname(entry.name)) &&
        !entry.name.endsWith('.d.ts') &&
        !entry.name.includes('.test.') &&
        !entry.name.includes('.spec.')
      )
        files.push(path);
    }
  };
  visit(directory);
  if (files.length === 0)
    throw new Error(`No email modules found in ${directory}.`);
  return files.sort();
};

const moduleId = (file: string, directory: string) =>
  relative(directory, file)
    .split(sep)
    .join('/')
    .replace(/\.[^.]+$/, '');
const displayName = (id: string) =>
  basename(id)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const hostHtml =
  '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Locale Lab</title></head><body><div id="root"></div><script type="module" src="/@locale-lab-entry"></script></body></html>';

export const localeLabPlugin = (
  configPath: string,
  emailsDir: string,
): Plugin => {
  const virtualId = '\0locale-lab:entry';
  return {
    name: 'locale-lab-host',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.includes('.') || request.url?.startsWith('/@'))
          return next();
        try {
          const html = await server.transformIndexHtml(
            request.url ?? '/',
            hostHtml,
          );
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html');
          response.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
    resolveId(id) {
      if (id === '/@locale-lab-entry') return virtualId;
    },
    load(id) {
      if (id !== virtualId) return;
      const files = discoverEmails(emailsDir);
      const imports = files
        .map(
          (file, index) =>
            `import * as email${index} from ${JSON.stringify(file)};`,
        )
        .join('\n');
      const entries = files.map((file, index) => {
        const key = moduleId(file, emailsDir);
        return `${JSON.stringify(key)}: { name: ${JSON.stringify(displayName(key))}, component: (() => { const candidates = Object.entries(email${index}).filter(([key, value]) => key !== 'PreviewProps' && typeof value === 'function'); if (email${index}.default) return email${index}.default; if (candidates.length !== 1) return undefined; return candidates[0][1]; })() }`;
      });
      return `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { EmailLabApp, browserTranslatorProvider } from 'react-email-locale-lab';
        import config from ${JSON.stringify(configPath)};
        import 'react-email-locale-lab/styles.css';
        ${imports}
        const templates = { ${entries.join(',')} };
        const invalid = Object.entries(templates).filter(([, template]) => typeof template.component !== 'function');
        if (invalid.length) throw new Error('Locale Lab could not find a React component export in: ' + invalid.map(([id]) => id).join(', '));
        const resolved = { routeBasePath: '/preview', provider: browserTranslatorProvider(), ...config, templates };
        createRoot(document.getElementById('root')).render(React.createElement(EmailLabApp, { config: resolved }));
      `;
    },
  };
};

const run = async () => {
  const options = parseOptions(process.argv.slice(2));
  const configPath = findConfig(options.root);
  const emailsDir = findEmailsDir(options.root, options.dir);
  const templates = discoverEmails(emailsDir);
  const server = await createServer({
    configFile: false,
    root: options.root,
    appType: 'spa',
    plugins: [react(), localeLabPlugin(configPath, emailsDir)],
    server: { port: options.port, open: options.open },
  });
  await server.listen();
  console.log(
    `Locale Lab discovered ${templates.length} template(s) in ${relative(options.root, emailsDir)}.`,
  );
  server.printUrls();
};

export const isMainModule = (moduleUrl: string, executablePath?: string) => {
  if (!executablePath) return false;
  return (
    realpathSync(fileURLToPath(moduleUrl)) === realpathSync(executablePath)
  );
};

if (isMainModule(import.meta.url, process.argv[1])) {
  run().catch((error) => {
    console.error(
      `Locale Lab: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
