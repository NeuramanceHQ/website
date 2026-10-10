import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { it } from 'vitest';
import { runCheck } from './verify';

it.concurrent.for([
  ['Caddyfile', 'unchanged'],
  ['Caddyfile', 'directive'],
  ['Caddyfile', 'indentation'],
  ['Caddyfile.local', 'indentation'],
])(
  'validates %s with %s',
  async ([file, fault], { expect, onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'caddy lint '));
    onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
    for (const name of ['Caddyfile', 'Caddyfile.local', 'package.json']) {
      copyFileSync(
        resolve(import.meta.dirname, '..', name),
        join(directory, name),
      );
    }
    const path = join(directory, file);
    const source = readFileSync(path, 'utf8');
    if (fault === 'directive')
      writeFileSync(path, source.replace('file_server', 'file_servr'));
    if (fault === 'indentation')
      writeFileSync(path, source.replace('\t', '  '));
    const result = await runCheck(
      { name: 'lint:caddy', command: ['bun', 'run', '--silent', 'lint:caddy'] },
      directory,
      process.env,
      5_000,
      new Set(),
    );
    expect(result.status, result.output).toBe(fault === 'unchanged' ? 0 : 1);
    if (fault === 'directive')
      expect(result.output).toMatch(
        /Caddyfile:\d+: unrecognized directive: file_servr/,
      );
    if (fault === 'indentation') expect(result.output).toMatch(/^- {3}\w/m);
  },
);
