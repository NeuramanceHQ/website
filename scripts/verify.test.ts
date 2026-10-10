import { execFileSync } from 'node:child_process';
import {
  accessSync,
  copyFileSync,
  readdirSync,
  symlinkSync,
  constants,
  realpathSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { it } from 'vitest';
import {
  EDIT_CHECKS,
  PUSH_CHECKS,
  runCheck,
  TURN_CHECKS,
  verify,
  type Check,
} from './verify';
import { scratch, emptyRepository as repository } from './pre-push-fixture';

it('defines the ordered edit, turn and push dependency graphs', ({
  expect,
}) => {
  const graph = (checks: readonly Check[]) =>
    checks.map(({ name, after }) => [
      name,
      after?.map((check) => check.name) ?? [],
    ]);
  expect(graph(EDIT_CHECKS)).toEqual([
    ['suppressions', []],
    ['typecheck', []],
    ['lint', ['typecheck']],
    ['lint:shell', []],
    ['lint:caddy', []],
    ['lockfile', []],
    ['format:check', []],
  ]);
  expect(graph(TURN_CHECKS)).toEqual([
    ['suppressions', []],
    ['typecheck', []],
    ['lint', ['typecheck']],
    ['lint:shell', []],
    ['lint:caddy', []],
    ['lockfile', []],
    ['format:check', []],
    ['test', []],
    ['build', ['lint']],
  ]);
  expect(graph(PUSH_CHECKS)).toEqual([
    ['suppressions', []],
    ['typecheck', []],
    ['lint', ['typecheck']],
    ['lint:shell', []],
    ['lint:caddy', []],
    ['lockfile', []],
    ['format:check', []],
    ['test', []],
    ['test:e2e', ['lint']],
  ]);
});

it.concurrent('rejects lint suppression directives in code, wherever they hide', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const directive = ['oxlint', 'disable'].join('-');
  mkdirSync(join(root, 'components'));
  writeFileSync(join(root, 'components/clean.tsx'), 'export {};\n');
  writeFileSync(join(root, 'notes.md'), `/* ${directive} */\n`);
  writeFileSync(join(root, '.gitattributes'), '*.ts -diff\n');
  expect(
    (await verify(root, EDIT_CHECKS.slice(0, 1), Date.now() + 1_000, new Set()))
      .exitCode,
  ).toBe(0);
  writeFileSync(
    join(root, 'components/hidden.tsx'),
    `export {};\n/* ${directive} */\n`,
  );
  writeFileSync(
    join(root, 'components/binary.ts'),
    `export {};\n/*\0*/ // ${directive}-line\n`,
  );
  const result = await verify(
    root,
    EDIT_CHECKS.slice(0, 1),
    Date.now() + 1_000,
    new Set(),
  );
  expect(result.exitCode).toBe(1);
  expect(result.stderr.split('\n')[0]).toMatch(
    /^FAIL \[suppressions\] .* exited 1$/,
  );
  expect(result.stderr.split('\n').slice(1)).toEqual([
    `components/binary.ts:2:/*\0*/ // ${directive}-line`,
    `components/hidden.tsx:2:/* ${directive} */`,
    '',
  ]);
});

it.concurrent.for(['components/.gitignore', '.git/info/exclude'])(
  'rejects tracked files hidden by %s',
  async (ignore, { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    mkdirSync(join(root, 'components'));
    writeFileSync(join(root, 'components/hidden.tsx'), 'export {};\n');
    execFileSync('git', ['add', 'components/hidden.tsx'], {
      cwd: root,
      timeout: 10_000,
    });
    writeFileSync(join(root, 'components/untracked.tsx'), 'export {};\n');
    writeFileSync(join(root, ignore), 'untracked.tsx\n');
    const clean = await verify(
      root,
      EDIT_CHECKS.slice(0, 1),
      Date.now() + 1_000,
      new Set(),
    );
    expect([clean.exitCode, clean.stderr]).toEqual([0, '']);
    writeFileSync(join(root, ignore), 'untracked.tsx\nhidden.tsx\n');
    const hidden = await verify(
      root,
      EDIT_CHECKS.slice(0, 1),
      Date.now() + 1_000,
      new Set(),
    );
    expect(hidden.exitCode).toBe(1);
    expect(hidden.stderr.split('\n')[0]).toMatch(
      /^FAIL \[suppressions\] .* exited 1$/,
    );
    expect(hidden.stderr.split('\n').slice(1)).toEqual([
      'tracked file hidden by an ignore rule: components/hidden.tsx',
      '',
    ]);
  },
);

it.for([
  ['scripts/agent-verify', 'scripts/verify.ts'],
  ['.githooks/pre-push', 'scripts/pre-push.ts'],
])('keeps %s executable and linked to %s', ([link, target], { expect }) => {
  const root = resolve(import.meta.dirname, '..');
  expect(() => accessSync(resolve(root, link), constants.X_OK)).not.toThrow();
  expect(realpathSync(resolve(root, link))).toBe(resolve(root, target));
});

it.concurrent.for([
  ['scripts/check', ['# shellcheck', 'disable=SC2086'].join(' ')],
  ['a.test.ts', ['it', 'skip'].join('.') + '('],
  ['a.test.ts', ['describe', 'skip'].join('.') + '('],
  ['a.test.ts', ['it', 'todo'].join('.') + '('],
  ['a.test.ts', ['it', 'fails'].join('.') + '('],
  ['a.test.ts', ['it', 'skipIf'].join('.') + '('],
  ['a.test.tsx', ['it', 'runIf'].join('.') + '('],
  ['a.test.tsx', ['it', 'only'].join('.') + '('],
  ['e2e/x.spec.ts', ['test', 'fixme'].join('.') + '('],
  ['e2e/x.spec.ts', ['test', 'skip'].join('.') + '('],
  ['e2e/x.spec.ts', ['test', 'fail'].join('.') + '()'],
  ['e2e/x.spec.ts', ['test', 'fail'].join('.') + '(true, "known failure")'],
  ...['skip', 'only', 'todo', 'fails'].map((modifier) => [
    'a.test.ts',
    `it('y', { ${modifier}: true }, () => {})`,
  ]),
])(
  'rejects bypasses in %s: %s',
  async ([file, source], { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), source + '\n');
    const report = await verify(
      root,
      EDIT_CHECKS.slice(0, 1),
      Date.now() + 1_000,
      new Set(),
    );
    expect(report.exitCode, report.stderr).toBe(1);
    expect(report.stderr).toContain(`${file}:1:`);
  },
);

it.concurrent('accepts an rc-free repository and ordinary member access outside tests', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  mkdirSync(join(root, 'components'));
  writeFileSync(
    join(root, 'components/a.ts'),
    ['value', 'skip'].join('.') + '();\n',
  );
  const report = await verify(
    root,
    EDIT_CHECKS.slice(0, 1),
    Date.now() + 1_000,
    new Set(),
  );
  expect([report.exitCode, report.stderr]).toEqual([0, '']);
});

it.concurrent('reports scanner Git errors with status at least two', async ({
  expect,
  onTestFinished,
}) => {
  const outcome = await runCheck(
    EDIT_CHECKS[0],
    scratch(onTestFinished),
    { ...process.env, GIT_CEILING_DIRECTORIES: tmpdir() },
    1_000,
    new Set(),
  );
  expect(outcome.status).toBeGreaterThanOrEqual(2);
  expect(outcome.output).toContain('not a git repository');
});

it.concurrent.for([false, true])(
  'checks lockfile freshness with a stale manifest: %s',
  async (stale, { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    for (const file of ['package.json', 'bun.lock']) {
      copyFileSync(resolve(import.meta.dirname, '..', file), join(root, file));
    }
    if (stale) {
      const path = join(root, 'package.json');
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      manifest.dependencies.react = '19.3.1';
      writeFileSync(path, JSON.stringify(manifest));
    }
    const report = await verify(
      root,
      EDIT_CHECKS.filter(({ name }) => name === 'lockfile'),
      Date.now() + 5_000,
      new Set(),
    );
    expect(report.exitCode, report.stderr).toBe(stale ? 1 : 0);
    if (stale) expect(report.stderr).toContain('lockfile');
  },
);

it.concurrent('does not install dependencies or run prepare during the lockfile check', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  for (const file of ['package.json', 'bun.lock'])
    copyFileSync(resolve(import.meta.dirname, '..', file), join(root, file));
  mkdirSync(join(root, 'scripts'));
  writeFileSync(
    join(root, 'scripts/install-hooks.ts'),
    'Bun.write("prepared", "ran");\n',
  );
  const before = readdirSync(root).toSorted();
  const check = EDIT_CHECKS.find(({ name }) => name === 'lockfile');
  expect(check).toBeDefined();
  if (check === undefined) throw new Error('missing lockfile check');
  const config = readFileSync(join(root, '.git/config'), 'utf8');
  const lock = readFileSync(join(root, 'bun.lock'), 'utf8');
  const result = await runCheck(check, root, process.env, 5_000, new Set());
  expect([result.status, result.output]).toEqual([0, expect.any(String)]);
  expect(readdirSync(root).toSorted()).toEqual(before);
  expect(readFileSync(join(root, '.git/config'), 'utf8')).toBe(config);
  expect(readFileSync(join(root, 'bun.lock'), 'utf8')).toBe(lock);
});

it.concurrent.for([
  ['app/page.tsx', true],
  ['a.mjs', true],
  ['a.cjs', true],
  ['a.jsx', true],
  ['a.mts', true],
  ['a.cts', true],
  ['a.ts', true],
  ['a.json', true],
  ['a.md', true],
  ['a.css', true],
  ['package.json', true],
  ['bun.lock', true],
  ['Caddyfile', true],
  ['Caddyfile.local', true],
  ['scripts/deploy', true],
  ['scripts/lint-shell', true],
  ['scripts/scan-suppressions', true],
  ['public/a.svg', false],
  ['a.xml', false],
  ['a.txt', false],
  ['a.png', false],
  ['a.woff2', false],
  ['a.mp3', false],
  ['.gitignore', false],
  ['.nvmrc', false],
  ['nested/Caddyfile', false],
  ['nested/bun.lock', false],
  ['other.sh', false],
  ['out/zz.js', false],
  ['.vscode/settings.json', false],
  ['../outside.ts', false],
  ['.', false],
] as const)(
  'reports edit coverage for %s',
  async ([file, covered], { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    writeFileSync(join(root, '.gitignore'), 'out/\n.vscode/\n');
    const path = join(root, file);
    const report = await verify(root, [], Date.now() + 1_000, new Set(), [
      path,
    ]);
    expect(report.exitCode).toBe(0);
    expect(
      report.stdout.includes(
        `agent-verify: not verified: ${path} (no check reads this file)\n`,
      ),
    ).toBe(!covered);
  },
);

it.concurrent('classifies symlink targets and retains the original unsupported argument', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, '.githooks'));
  mkdirSync(join(root, 'out'));
  writeFileSync(join(root, '.gitignore'), 'out/\n');
  writeFileSync(join(root, 'scripts/pre-push.ts'), 'export {};\n');
  writeFileSync(join(root, 'asset.svg'), '<svg/>');
  symlinkSync('../scripts/pre-push.ts', join(root, '.githooks/pre-push'));
  symlinkSync('asset.svg', join(root, 'misleading.ts'));
  symlinkSync('../scripts/pre-push.ts', join(root, 'out/ignored.ts'));
  const report = await verify(root, [], Date.now() + 1_000, new Set(), [
    join(root, '.githooks/pre-push'),
    `${root}/./misleading.ts`,
    join(root, 'out/ignored.ts'),
  ]);
  expect(report.exitCode).toBe(0);
  expect(
    report.stdout.split('\n').filter((line) => line.includes('not verified')),
  ).toEqual([
    `agent-verify: not verified: ${root}/./misleading.ts (no check reads this file)`,
    `agent-verify: not verified: ${root}/out/ignored.ts (no check reads this file)`,
  ]);
});

it.concurrent('resolves a symlink before a following parent segment', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  mkdirSync(join(root, 'deep/nested'), { recursive: true });
  writeFileSync(join(root, 'deep/Caddyfile'), 'nested');
  writeFileSync(join(root, 'Caddyfile'), 'root');
  symlinkSync('deep/nested', join(root, 'link'));
  const report = await verify(root, [], Date.now() + 1_000, new Set(), [
    `${root}/link/../Caddyfile`,
  ]);
  expect(report.stdout).toContain(
    `agent-verify: not verified: ${root}/link/../Caddyfile (no check reads this file)\n`,
  );
});

it.concurrent('scans the whole checkout from a nested working directory', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const nested = join(root, 'nested');
  mkdirSync(nested);
  writeFileSync(join(root, 'root.test.ts'), ['it', 'skip'].join('.') + '(');
  const result = await runCheck(
    EDIT_CHECKS[0],
    nested,
    process.env,
    1_000,
    new Set(),
  );
  expect(result.status).toBe(1);
  expect(result.output).toContain('root.test.ts:1:');
});
