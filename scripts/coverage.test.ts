import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { it } from 'vitest';
import { runCheck } from './verify';

const root = resolve(import.meta.dirname, '..');

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
  })
    .split('\0')
    .filter(Boolean);
}

it.concurrent('enforces complexity at every tracked JavaScript and TypeScript path', async ({
  expect,
  onTestFinished,
}) => {
  const expected = trackedFiles()
    .filter((file) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(file))
    .toSorted();
  const directory = mkdtempSync(join(tmpdir(), 'lint coverage '));
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  for (const file of [
    '.gitignore',
    '.oxlintrc.json',
    'tsconfig.json',
    'package.json',
  ]) {
    copyFileSync(join(root, file), join(directory, file));
  }
  const config = JSON.parse(
    readFileSync(join(directory, '.oxlintrc.json'), 'utf8'),
  );
  config.jsPlugins = config.jsPlugins.map((plugin: string) =>
    plugin.startsWith('./') ? resolve(root, plugin) : plugin,
  );
  writeFileSync(join(directory, '.oxlintrc.json'), JSON.stringify(config));
  symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'));
  const branches = Array.from(
    { length: 10 },
    (_, index) => `if (value === ${index}) return ${index};`,
  ).join('\n');
  for (const file of expected) {
    mkdirSync(dirname(join(directory, file)), { recursive: true });
    writeFileSync(
      join(directory, file),
      `export function decide(value) {\n${branches}\nreturn -1;\n}\n`,
    );
  }
  const result = await runCheck(
    {
      name: 'lint',
      command: ['bun', 'run', '--silent', 'lint', '--format=unix'],
    },
    directory,
    process.env,
    10_000,
    new Set(),
  );
  expect(result.timedOut, result.output).toBe(false);
  expect(result.status, result.output).toBe(1);
  const found = [
    ...result.output.matchAll(
      /^(.+?):\d+:\d+: .* \[Error\/eslint\(complexity\)\]$/gm,
    ),
  ]
    .map(([, file]) => file)
    .toSorted();
  expect(found).toEqual(expected);
}, 15_000);

it.concurrent('includes every tracked TypeScript file in the compiler program', async ({
  expect,
  onTestFinished,
}) => {
  const expected = trackedFiles()
    .filter((file) => /\.(?:[cm]?ts|tsx)$/.test(file))
    .toSorted();
  const directory = mkdtempSync(join(tmpdir(), 'typecheck coverage '));
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  const tsconfig = join(root, 'tsconfig.json');
  const config: { include: string[] } = JSON.parse(
    readFileSync(tsconfig, 'utf8'),
  );
  const project = join(directory, 'tsconfig.json');
  writeFileSync(
    project,
    JSON.stringify({
      extends: tsconfig,
      compilerOptions: { noResolve: true },
      include: config.include
        .filter(
          (path) => path !== 'next-env.d.ts' && !path.startsWith('.next/'),
        )
        .map((path) => resolve(root, path)),
    }),
  );
  const result = await runCheck(
    {
      name: 'typecheck coverage',
      command: [
        'bun',
        'run',
        '--silent',
        'tsc',
        '--listFilesOnly',
        '-p',
        project,
      ],
    },
    root,
    process.env,
    10_000,
    new Set(),
  );
  expect(result.status, result.output).toBe(0);
  const program = new Set(
    result.output
      .trim()
      .split('\n')
      .map((file) => relative(root, file)),
  );
  expect(expected.filter((file) => !program.has(file))).toEqual([]);
}, 15_000);

it.concurrent('rejects implicit any, nullable access, and unreachable code', async ({
  expect,
  onTestFinished,
}) => {
  const directory = mkdtempSync(join(tmpdir(), 'compiler settings '));
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  const project = join(directory, 'tsconfig.json');
  writeFileSync(
    project,
    JSON.stringify({
      extends: join(root, 'tsconfig.json'),
      include: ['fixture.ts'],
    }),
  );
  writeFileSync(
    join(directory, 'fixture.ts'),
    `export function implicit(value) {
  return value;
}
export function nullable(value: { name: string } | null): string {
  return value.name;
}
export function unreachable(): number {
  return 1;
  return 2;
}
`,
  );
  const result = await runCheck(
    {
      name: 'compiler settings',
      command: ['bun', 'run', '--silent', 'tsc', '--noEmit', '-p', project],
    },
    root,
    process.env,
    10_000,
    new Set(),
  );
  expect(result.timedOut, result.output).toBe(false);
  expect(result.status, result.output).toBeGreaterThan(0);
  expect(
    [...result.output.matchAll(/fixture\.ts\(\d+,\d+\): error (TS\d+):/g)]
      .map(([, code]) => code)
      .toSorted(),
    result.output,
  ).toEqual(['TS18047', 'TS7006', 'TS7027']);
}, 15_000);

it.concurrent('discovers every tracked Vitest test file', async ({
  expect,
}) => {
  const tracked = trackedFiles();
  const expected = tracked
    .filter((file) => /\.test\.tsx?$/.test(file))
    .toSorted();
  const result = await runCheck(
    {
      name: 'Vitest coverage',
      command: ['bun', 'run', '--silent', 'vitest', 'list', '--filesOnly'],
    },
    root,
    process.env,
    10_000,
    new Set(),
  );
  expect(result.status, result.output).toBe(0);
  expect(
    result.output
      .trim()
      .split('\n')
      .filter((file) => tracked.includes(file))
      .toSorted(),
  ).toEqual(expected);
}, 15_000);

it.concurrent('discovers every tracked Playwright spec without running it', async ({
  expect,
}) => {
  const expected = trackedFiles()
    .filter((file) => /^e2e\/.*\.spec\.ts$/.test(file))
    .toSorted();
  const result = await runCheck(
    {
      name: 'Playwright coverage',
      command: ['bun', 'run', '--silent', 'playwright', 'test', '--list'],
    },
    root,
    { ...process.env, SITE_PORT: '3099' },
    10_000,
    new Set(),
  );
  expect(result.status, result.output).toBe(0);
  const files = [...result.output.matchAll(/› (.+\.spec\.ts):\d+:\d+ ›/g)].map(
    ([, file]) => `e2e/${file}`,
  );
  expect([...new Set(files)].toSorted()).toEqual(expected);
}, 15_000);
