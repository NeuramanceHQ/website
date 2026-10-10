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
  mkdirSync(join(directory, 'scripts'));
  copyFileSync(
    resolve(import.meta.dirname, 'scan-suppressions'),
    join(directory, 'scripts/scan-suppressions'),
  );
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

it('reports a ShellCheck finding in the deploy script', () => {
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

it.each(['.shellcheckrc', 'scripts/.shellcheckrc'])(
  'ignores disabling configuration in %s',
  (file) => {
    copyFileSync(
      resolve(import.meta.dirname, 'lint-shell'),
      join(directory, 'scripts/lint-shell'),
    );
    writeFileSync(
      join(directory, 'scripts/deploy'),
      '#!/bin/sh\nrelease=$1\nrm -r $release\n',
    );
    writeFileSync(join(directory, file), 'disable=SC2086\n');
    const result = lintShell(join(directory, 'scripts/lint-shell'));
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/deploy line 3:[\s\S]*SC2086/);
  },
);

it('reports a ShellCheck finding in the suppression scanner', () => {
  for (const file of ['lint-shell', 'deploy']) {
    copyFileSync(
      resolve(import.meta.dirname, file),
      join(directory, 'scripts', file),
    );
  }
  writeFileSync(
    join(directory, 'scripts/scan-suppressions'),
    '#!/bin/sh\npattern=$1\nprintf %s $pattern\n',
  );
  const result = lintShell(join(directory, 'scripts/lint-shell'));
  expect(result.status).toBe(1);
  expect(result.output).toMatch(/scan-suppressions line 3:[\s\S]*SC2086/);
});
