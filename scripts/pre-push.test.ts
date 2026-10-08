import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

const ZERO_SHA = '0'.repeat(40);
const SCRIPTS = [
  'typecheck',
  'lint',
  'lint:shell',
  'format:check',
  'test',
  'test:e2e',
];
const PASSED =
  /^agent-verify: suppressions, typecheck, lint, lint:shell, format:check, test, test:e2e passed in \d+\.\ds\n$/;
let repository = '';

function git(...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd: repository, encoding: 'utf8', timeout: 10_000 },
  ).trim();
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), 'pre push '));
  mkdirSync(join(repository, 'scripts'));
  mkdirSync(join(repository, '.githooks'));
  for (const name of ['pre-push.ts', 'verify.ts']) {
    copyFileSync(
      resolve(import.meta.dirname, name),
      join(repository, 'scripts', name),
    );
  }
  symlinkSync('../scripts/pre-push.ts', join(repository, '.githooks/pre-push'));
  writeFileSync(
    join(repository, 'package.json'),
    JSON.stringify({
      scripts: Object.fromEntries(
        SCRIPTS.map((name) => [
          name,
          `echo ${name} >> calls; ! grep -qx ${name} failing`,
        ]),
      ),
    }),
  );
  writeFileSync(join(repository, '.gitignore'), 'calls\n');
  git('init', '--quiet');
  git('config', 'core.hooksPath', '.githooks');
  git('add', '.');
  git('commit', '--quiet', '--message', 'fixture');
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

function push(refs: string): {
  status: number | null;
  stderr: string;
  calls: string[];
} {
  const updates = join(repository, '.git/push-updates');
  writeFileSync(updates, refs);
  const result = spawnSync(
    'git',
    [
      'hook',
      'run',
      `--to-stdin=${updates}`,
      'pre-push',
      '--',
      'origin',
      'https://example.com/r',
    ],
    { cwd: repository, encoding: 'utf8', timeout: 20_000 },
  );
  const log = join(repository, 'calls');
  return {
    status: result.status,
    stderr: result.stderr,
    calls: existsSync(log)
      ? readFileSync(log, 'utf8').trimEnd().split('\n')
      : [],
  };
}

const head = (): string => git('rev-parse', 'HEAD');

it('runs the full gate and the browser suite before pushing HEAD', () => {
  expect(
    push(`refs/heads/main ${head()} refs/heads/main ${ZERO_SHA}\n`),
  ).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS,
  });
});

it('blocks the push when a check fails', () => {
  writeFileSync(join(repository, 'failing'), 'test:e2e\n');
  git('add', 'failing');
  git('commit', '--quiet', '--message', 'plant a failure');
  const result = push(
    `refs/heads/main ${head()} refs/heads/main ${ZERO_SHA}\n`,
  );
  expect([result.status, result.calls]).toEqual([1, SCRIPTS]);
  expect(result.stderr).toMatch(
    /^FAIL \[test:e2e\] bun run --silent test:e2e exited 1\n/,
  );
});

it('verifies an annotated tag that points at HEAD', () => {
  git('tag', '--annotate', 'v1', '--message', 'release');
  expect(
    push(`refs/tags/v1 ${git('rev-parse', 'v1')} refs/tags/v1 ${ZERO_SHA}\n`),
  ).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS,
  });
});

it('verifies the checkout when a push only deletes a remote branch', () => {
  expect(push(`(delete) ${ZERO_SHA} refs/heads/old ${head()}\n`)).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS,
  });
});

it('refuses a ref other than the checked-out HEAD without running the gate', () => {
  expect(
    push(`refs/heads/other ${'1'.repeat(40)} refs/heads/other ${ZERO_SHA}\n`),
  ).toEqual({
    status: 1,
    stderr:
      'pre-push: refs/heads/other is not the checked-out HEAD; check it out and push again so it can be verified\n',
    calls: [],
  });
});

it('refuses uncommitted changes without running the gate', () => {
  writeFileSync(join(repository, 'draft.ts'), 'export {};\n');
  expect(
    push(`refs/heads/main ${head()} refs/heads/main ${ZERO_SHA}\n`),
  ).toEqual({
    status: 1,
    stderr:
      'pre-push: commit or stash local changes first; pushes are verified from a clean checkout of HEAD\n',
    calls: [],
  });
});
