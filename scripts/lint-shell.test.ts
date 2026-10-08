import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

let directory = '';

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'lint shell '));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

function lintShell(
  script: string,
  path = process.env.PATH,
): { status: number | null; output: string } {
  const result = spawnSync('sh', [script], {
    encoding: 'utf8',
    env: { ...process.env, PATH: path },
    timeout: 20_000,
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

it('passes the repository shell scripts', () => {
  expect(lintShell(resolve(import.meta.dirname, 'lint-shell'))).toEqual({
    status: 0,
    output: '',
  });
});

it('reports a ShellCheck finding in the deploy script', () => {
  mkdirSync(join(directory, 'scripts'));
  copyFileSync(
    resolve(import.meta.dirname, 'lint-shell'),
    join(directory, 'scripts/lint-shell'),
  );
  writeFileSync(
    join(directory, 'scripts/deploy'),
    '#!/usr/bin/env bash\nrelease=$1\nrm -r $release\n',
  );
  const result = lintShell(join(directory, 'scripts/lint-shell'));
  expect(result.status).toBe(1);
  expect(result.output).toMatch(/deploy line 3:[\s\S]*SC2086/);
});

it('reports a ShellCheck finding in its own script', () => {
  mkdirSync(join(directory, 'scripts'));
  copyFileSync(
    resolve(import.meta.dirname, 'deploy'),
    join(directory, 'scripts/deploy'),
  );
  writeFileSync(
    join(directory, 'scripts/lint-shell'),
    `${readFileSync(resolve(import.meta.dirname, 'lint-shell'), 'utf8')}echo $here\n`,
  );
  const result = lintShell(join(directory, 'scripts/lint-shell'));
  expect(result.status).toBe(1);
  expect(result.output).toMatch(/lint-shell line 10:[\s\S]*SC2086/);
});

it('refuses a ShellCheck version other than the pinned one', () => {
  writeFileSync(
    join(directory, 'shellcheck'),
    '#!/bin/sh\necho "ShellCheck - shell script analysis tool"\necho "version: 0.10.0"\n',
    { mode: 0o755 },
  );
  expect(
    lintShell(
      resolve(import.meta.dirname, 'lint-shell'),
      `${directory}:${process.env.PATH}`,
    ),
  ).toEqual({
    status: 1,
    output: 'lint:shell needs ShellCheck 0.11.0, found 0.10.0\n',
  });
});
