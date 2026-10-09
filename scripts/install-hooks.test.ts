import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { conflict } from './install-hooks';

it.each([
  { configured: '', existing: [], expected: undefined },
  { configured: '.githooks', existing: [], expected: undefined },
  {
    configured: '.githooks',
    existing: ['.git/hooks/pre-push'],
    expected: undefined,
  },
  {
    configured: '/shared/hooks',
    existing: [],
    expected:
      'core.hooksPath is already /shared/hooks; call .githooks/pre-push from those hooks to verify before each push',
  },
  {
    configured: '',
    existing: ['.git/hooks/pre-push'],
    expected:
      'setting core.hooksPath would stop .git/hooks/pre-push from running; call .githooks/pre-push from them to verify before each push',
  },
])(
  'decides whether core.hooksPath can be set: $configured $existing',
  ({ configured, existing, expected }) => {
    expect(conflict(configured, existing)).toBe(expected);
  },
);

let directory = '';
let globalConfig = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'install hooks '));
  globalConfig = join(directory, 'global.gitconfig');
  writeFileSync(globalConfig, '');
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

const isolated = (): NodeJS.ProcessEnv => ({
  ...process.env,
  GIT_CONFIG_GLOBAL: globalConfig,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CEILING_DIRECTORIES: resolve(directory, '..'),
});

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: isolated(),
    timeout: 10_000,
  });
  return result.stdout.trim();
}

function install(cwd: string): {
  status: number | null;
  stderr: string;
  hooksPath: string;
} {
  const result = spawnSync(
    'bun',
    [resolve(import.meta.dirname, 'install-hooks.ts')],
    { cwd, encoding: 'utf8', env: isolated(), timeout: 10_000 },
  );
  return {
    status: result.status,
    stderr: result.stderr,
    hooksPath: git(cwd, 'config', '--local', '--get', 'core.hooksPath'),
  };
}

function repository(): string {
  const root = join(directory, 'repository');
  execFileSync('git', ['init', '--quiet', root], {
    env: isolated(),
    timeout: 10_000,
  });
  return root;
}

it('points a fresh clone at .githooks, and stays idempotent', () => {
  const root = repository();
  expect([install(root), install(root)]).toEqual([
    { status: 0, stderr: '', hooksPath: '.githooks' },
    { status: 0, stderr: '', hooksPath: '.githooks' },
  ]);
});

it('keeps a hooks path the engineer already configured', () => {
  writeFileSync(globalConfig, '[core]\n\thooksPath = /shared/hooks\n');
  expect(install(repository())).toEqual({
    status: 0,
    stderr:
      'install-hooks: core.hooksPath is already /shared/hooks; call .githooks/pre-push from those hooks to verify before each push\n',
    hooksPath: '',
  });
});

it('keeps hooks another tool installed in .git/hooks', () => {
  const root = repository();
  writeFileSync(
    join(root, '.git/hooks/pre-push'),
    '#!/bin/sh\ngit lfs pre-push "$@"\n',
    { mode: 0o755 },
  );
  expect(install(root)).toEqual({
    status: 0,
    stderr: `install-hooks: setting core.hooksPath would stop .git/hooks/pre-push from running; call .githooks/pre-push from them to verify before each push\n`,
    hooksPath: '',
  });
});

it('leaves an enclosing repository alone when installed below its root', () => {
  const root = repository();
  const nested = join(root, 'build');
  mkdirSync(nested);
  expect(install(nested)).toEqual({
    status: 0,
    stderr:
      'install-hooks: not the root of a Git checkout, so the pre-push hook is not installed\n',
    hooksPath: '',
  });
});

it('explains that nothing is installed outside a Git checkout', () => {
  expect(install(directory)).toMatchObject({
    status: 0,
    stderr:
      'install-hooks: not the root of a Git checkout, so the pre-push hook is not installed\n',
  });
});

it('refuses to disable a symlinked pre-push hook', () => {
  const root = repository();
  const target = join(directory, 'shared-pre-push');
  writeFileSync(target, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  symlinkSync(target, join(root, '.git/hooks/pre-push'));
  expect(install(root)).toEqual({
    status: 0,
    stderr: `install-hooks: setting core.hooksPath would stop .git/hooks/pre-push from running; call .githooks/pre-push from them to verify before each push\n`,
    hooksPath: '',
  });
});
