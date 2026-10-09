import { spawnSync } from 'node:child_process';
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
import { dirname, join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { runCheck } from './verify';

const root = resolve(import.meta.dirname, '..');

function lint(sources: Record<string, string>): string[] {
  const directory = mkdtempSync(join(tmpdir(), 'lint rules '));
  try {
    const paths = Object.entries(sources).map(([name, source]) => {
      writeFileSync(join(directory, name), source);
      return join(directory, name);
    });
    const result = spawnSync(
      join(root, 'node_modules/.bin/oxlint'),
      ['-c', join(root, '.oxlintrc.json'), '--format=unix', ...paths],
      { cwd: root, encoding: 'utf8', timeout: 10_000 },
    );
    return [
      ...result.stdout.matchAll(
        /([^/\n]+\.tsx?):(\d+):\d+: .* \[Error\/(.+)\]$/gm,
      ),
    ]
      .map(([, file, line, rule]) => `${file}:${line} ${rule}`)
      .toSorted();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const TAUTOLOGY = 'local(no-tautological-assertion)';

const vitestImports = `import { expect, expect as check, it, vi } from 'vitest';
import { expect as assertThat } from 'chai';

it('compares values', () => {
  const value = { count: 1 };
  const other = { count: 1 };
  expect(true).toBe(true);
  expect(value).toEqual(value);
  check(value).toStrictEqual(value);
  expect.soft('a').toBe('a');
  expect(value).toEqual(other);
  expect(String(1)).toBe(String(1));
  expect(value.count).toBe(value.count);
  expect(value).not.toEqual({});
  assertThat(1).toBe(1);
});

it('ignores a local function named expect', () => {
  const expect = (actual: number) => ({
    toBe: (expected: number) => actual === expected,
  });
  expect(1).toBe(1);
});

it('uses the test context expect', ({ expect }) => {
  const value = 1;
  expect(value).toBe(value);
});

it('renames the test context expect', ({ expect: verify }) => {
  verify(2).toBe(2);
});

it('checks mock calls', () => {
  const mock = vi.fn((value: number) => value);
  mock(1);
  expect(mock).toHaveBeenCalledWith(1);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls).toEqual([[1]]);
  const target = { accept: (value: number) => value };
  const spy = vi.spyOn(target, 'accept');
  target.accept(1);
  expect(spy).toHaveBeenCalledWith(1);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls).toEqual([[1]]);
  spy.mockRestore();
});
`;

const playwright = `import { expect, test } from '@playwright/test';

test('compares values', async ({ page }) => {
  const title = await page.title();
  expect(title).toBe(title);
  expect.soft(title).toEqual(title);
  expect(title).toBe('Neuramance');
  await expect(page).toHaveTitle(title);
});
`;

const namespace = `import * as vitest from 'vitest';

vitest.it('uses a namespace import', () => {
  const value = 1;
  vitest.expect(value).toBe(value);
  vitest.expect.soft(value).toEqual(value);
  vitest.expect(value).toBe(2);
});
`;

const globals = `it('uses the global expect', () => {
  const value = 1;
  expect(value).toBe(value);
});
`;

it('reports self-comparing Vitest and Playwright assertions through the repository lint config', () => {
  const reported = lint({
    'vitest.test.ts': vitestImports,
    'playwright.spec.ts': playwright,
    'namespace.test.ts': namespace,
    'globals.test.ts': globals,
  });
  expect(reported.filter((entry) => entry.endsWith(TAUTOLOGY))).toEqual([
    `globals.test.ts:3 ${TAUTOLOGY}`,
    `namespace.test.ts:5 ${TAUTOLOGY}`,
    `namespace.test.ts:6 ${TAUTOLOGY}`,
    `playwright.spec.ts:5 ${TAUTOLOGY}`,
    `playwright.spec.ts:6 ${TAUTOLOGY}`,
    `vitest.test.ts:10 ${TAUTOLOGY}`,
    `vitest.test.ts:27 ${TAUTOLOGY}`,
    `vitest.test.ts:31 ${TAUTOLOGY}`,
    `vitest.test.ts:7 ${TAUTOLOGY}`,
    `vitest.test.ts:8 ${TAUTOLOGY}`,
    `vitest.test.ts:9 ${TAUTOLOGY}`,
  ]);
});

it('reports every comment and suppression directive but not a shebang or slashes in strings', () => {
  const directive = ['oxlint', 'disable', 'next', 'line'].join('-');
  expect(
    lint({
      'script.ts': `#!/usr/bin/env bun\nexport const url = 'https://neuramance.com/llms.txt';\n`,
      'line.ts': `export const a = 1; // why\n`,
      'block.ts': `/* what */\nexport const b = 2;\n`,
      'directive.ts': `// ${directive} local/no-comments\nexport const c = 3;\n`,
      'view.tsx': `export const view = (\n  <p>\n    {/* note */}\n    text\n  </p>\n);\n`,
    }),
  ).toEqual([
    'block.ts:1 local(no-comments)',
    'directive.ts:1 local(no-comments)',
    'line.ts:1 local(no-comments)',
    'view.tsx:3 local(no-comments)',
  ]);
});

it('runs the correctness rules of the default oxc and unicorn plugins', () => {
  expect(
    lint({
      'defaults.ts': `export const never = (x: number) => x > 5 && x < 3;\ndocument.removeEventListener('click', () => {});\n`,
    }),
  ).toEqual([
    'defaults.ts:1 oxc(const-comparisons)',
    'defaults.ts:2 unicorn(no-invalid-remove-event-listener)',
  ]);
});

it('lints and checks the formatting of files that ignore files or nested configs try to exclude', () => {
  const { scripts } = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8'),
  ) as { scripts: Record<string, string> };
  const directory = mkdtempSync(join(tmpdir(), 'ignore files '));
  try {
    writeFileSync(join(directory, 'hidden.ts'), 'export   const a=1\n');
    writeFileSync(join(directory, 'buggy.ts'), 'debugger;\n');
    writeFileSync(join(directory, '.gitignore'), '');
    writeFileSync(join(directory, '.eslintignore'), 'buggy.ts\n');
    writeFileSync(join(directory, '.prettierignore'), 'hidden.ts\n');
    mkdirSync(join(directory, 'nested'));
    writeFileSync(join(directory, 'nested/buggy.ts'), 'debugger;\n');
    writeFileSync(join(directory, 'nested/hidden.ts'), 'export   const b=2\n');
    writeFileSync(
      join(directory, 'nested/.oxlintrc.json'),
      JSON.stringify({ rules: { 'no-debugger': 'off' } }),
    );
    writeFileSync(
      join(directory, 'nested/.oxfmtrc.json'),
      JSON.stringify({ ignorePatterns: ['*.ts'] }),
    );
    const run = (name: string): string => {
      const [tool, ...args] = scripts[name]?.split(' ') ?? [];
      const result = spawnSync(
        join(root, 'node_modules/.bin', tool ?? ''),
        args,
        { cwd: directory, encoding: 'utf8', timeout: 10_000 },
      );
      return `${result.status} ${result.stdout}`;
    };
    const lint = run('lint');
    expect(lint).toMatch(/(^|\n|\s)buggy\.ts:1:1: .*no-debugger/);
    expect(lint).toMatch(/nested\/buggy\.ts:1:1: .*no-debugger/);
    const format = run('format:check');
    expect(format).toMatch(/^1 /);
    expect(format).toMatch(/(^|\n|\s)hidden\.ts/);
    expect(format).toMatch(/nested\/hidden\.ts/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function lintRepository(sources: Record<string, string>): string[] {
  const directory = mkdtempSync(join(tmpdir(), 'lint layers '));
  try {
    const config = JSON.parse(
      readFileSync(join(root, '.oxlintrc.json'), 'utf8'),
    ) as { jsPlugins: string[] };
    config.jsPlugins = config.jsPlugins.map((plugin) =>
      plugin.startsWith('./') ? join(root, plugin) : plugin,
    );
    writeFileSync(join(directory, '.oxlintrc.json'), JSON.stringify(config));
    writeFileSync(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          jsx: 'react-jsx',
          module: 'esnext',
          moduleResolution: 'bundler',
          noEmit: true,
          skipLibCheck: true,
          paths: { '@/*': ['./*'] },
        },
      }),
    );
    symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'));
    for (const [name, source] of Object.entries(sources)) {
      mkdirSync(dirname(join(directory, name)), { recursive: true });
      writeFileSync(join(directory, name), source);
    }
    const result = spawnSync(
      join(root, 'node_modules/.bin/oxlint'),
      [
        '--disable-nested-config',
        '--no-ignore',
        '--format=unix',
        ...new Set(Object.keys(sources).map((name) => name.split('/')[0])),
      ],
      { cwd: directory, encoding: 'utf8', timeout: 10_000 },
    );
    return [
      ...result.stdout.matchAll(
        /^([\w./-]+\.tsx?):(\d+):\d+: .* \[Error\/(.+)\]$/gm,
      ),
    ]
      .map(([, file, line, rule]) => `${file}:${line} ${rule}`)
      .toSorted();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

it('keeps imports flowing from app/ to components/ to lib/, without cycles, and keeps e2e/ black-box', () => {
  expect(
    lintRepository({
      'lib/site.ts': "export const SITE = 'site';\n",
      'lib/a.ts':
        "import { b } from '@/lib/b';\nexport const a = (): string => b();\n",
      'lib/b.ts':
        "import { a } from '@/lib/a';\nexport const b = (): string => a();\n",
      'lib/upward.ts':
        "import { Thing } from '@/components/thing';\nexport const up = Thing;\n",
      'lib/nested.ts':
        "import { Button } from '@/components/ui/button';\nexport const nested = Button;\n",
      'lib/parent.ts':
        "import { Thing } from '../components/thing';\nexport const parent = Thing;\n",
      'components/thing.tsx':
        "import { SITE } from '@/lib/site';\nexport const Thing = (): string => SITE;\n",
      'components/ui/button.tsx':
        "export const Button = (): string => 'button';\n",
      'components/upward.tsx':
        "import Page from '@/app/page';\nexport const Up = Page;\n",
      'app/page.tsx':
        "import { Thing } from '@/components/thing';\nimport { SITE } from '@/lib/site';\nexport default function Page(): string {\n  return Thing() + SITE;\n}\n",
      'app/tooling.ts':
        "import { tool } from '@/scripts/tool';\nexport const used = tool;\n",
      'scripts/tool.ts': "export const tool = 'tool';\n",
      'e2e/peek.spec.ts':
        "import { SITE } from '@/lib/site';\nexport const peek = SITE;\n",
    }),
  ).toEqual([
    'app/tooling.ts:1 eslint(no-restricted-imports)',
    'components/upward.tsx:1 eslint(no-restricted-imports)',
    'e2e/peek.spec.ts:1 eslint(no-restricted-imports)',
    'lib/a.ts:1 import(no-cycle)',
    'lib/b.ts:1 import(no-cycle)',
    'lib/nested.ts:1 eslint(no-restricted-imports)',
    'lib/parent.ts:1 import(no-relative-parent-imports)',
    'lib/upward.ts:1 eslint(no-restricted-imports)',
  ]);
});

function branching(complexity: number): string {
  const branches = Array.from(
    { length: complexity - 1 },
    (_, index) => `  if (value === ${index}) {\n    return ${index};\n  }\n`,
  );
  return `export function decide(value: number): number {\n${branches.join('')}  return -1;\n}\n`;
}

function nested(depth: number): string {
  const opening = Array.from(
    { length: depth },
    (_, index) => `${'  '.repeat(index + 1)}if (value > ${index}) {\n`,
  );
  const closing = Array.from(
    { length: depth },
    (_, index) => `${'  '.repeat(depth - index)}}\n`,
  );
  return `export function deep(value: number): number {\n${opening.join('')}${'  '.repeat(depth + 1)}return value;\n${closing.join('')}  return 0;\n}\n`;
}

function longFunction(lines: number): string {
  const additions = Array.from(
    { length: lines - 4 },
    (_, index) => `  total += ${index};\n`,
  );
  return `export function sum(): number {\n  let total = 0;\n${additions.join('')}  return total;\n}\n`;
}

function longFile(lines: number): string {
  return Array.from(
    { length: lines },
    (_, index) => `export const line${index} = ${index};\n`,
  ).join('');
}

it('enforces each complexity ceiling at its boundary', () => {
  const switches = Object.fromEntries(
    [9, 10].map((count) => [
      `switch-${count}.ts`,
      `export function choose(value: number): number {\n  switch (value) {\n${Array.from(
        { length: count },
        (_, index) => `    case ${index}: return ${index};\n`,
      ).join('')}    default: return -1;\n  }\n}\n`,
    ]),
  );
  expect(
    lint({
      ...switches,
      'complexity-10.ts': branching(10),
      'complexity-11.ts': branching(11),
      'depth-3.ts': nested(3),
      'depth-4.ts': nested(4),
      'function-100.ts': longFunction(100),
      'function-101.ts': longFunction(101),
      'function-blank-100.ts': longFunction(99).replace('\n', '\n\n'),
      'function-blank-101.ts': longFunction(100).replace('\n', '\n\n'),
      'function-comment-101.ts': longFunction(100).replace(
        '\n',
        '\n  // counted\n',
      ),
      'iife-101.ts': `${longFunction(101).replace('export function sum()', '(function()').trimEnd()})();\n`,
      'file-500.ts': longFile(500),
      'file-501.ts': longFile(501),
      'file-blank-500.ts': longFile(499).replace('\n', '\n\n'),
      'file-blank-501.ts': longFile(500).replace('\n', '\n\n'),
    }),
  ).toEqual([
    'complexity-11.ts:1 eslint(complexity)',
    'depth-4.ts:5 eslint(max-depth)',
    'file-501.ts:501 eslint(max-lines)',
    'file-blank-501.ts:501 eslint(max-lines)',
    'function-101.ts:1 eslint(max-lines-per-function)',
    'function-blank-101.ts:1 eslint(max-lines-per-function)',
    'function-comment-101.ts:1 eslint(max-lines-per-function)',
    'function-comment-101.ts:2 local(no-comments)',
    'iife-101.ts:1 eslint(max-lines-per-function)',
    'switch-10.ts:1 eslint(complexity)',
  ]);
});

it('enforces complexity across repository paths through the lint script', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint coverage '));
  try {
    for (const file of [
      '.gitignore',
      '.oxlintrc.json',
      'tsconfig.json',
      'scripts/lint-rules.mts',
      'package.json',
    ]) {
      mkdirSync(dirname(join(directory, file)), { recursive: true });
      copyFileSync(join(root, file), join(directory, file));
    }
    symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'));
    for (const file of [
      'app/x.tsx',
      'components/x.tsx',
      'components/x.test.ts',
      'components/x.test.tsx',
      'lib/x.ts',
      'e2e/x.spec.ts',
      'scripts/x.ts',
      'scripts/x.mts',
    ]) {
      mkdirSync(dirname(join(directory, file)), { recursive: true });
      writeFileSync(join(directory, file), branching(11));
    }
    const result = await runCheck(
      { name: 'lint', command: ['bun', 'run', '--silent', 'lint'] },
      directory,
      process.env,
      10_000,
      new Set(),
    );
    expect(result.timedOut, result.output).toBe(false);
    expect(result.status, result.output).toBe(1);
    expect(
      [
        ...result.output.matchAll(
          /^([\w./-]+\.[cm]?tsx?):\d+:\d+: error eslint\(complexity\): /gm,
        ),
      ]
        .map(([, file]) => file)
        .toSorted(),
    ).toEqual([
      'app/x.tsx',
      'components/x.test.ts',
      'components/x.test.tsx',
      'components/x.tsx',
      'e2e/x.spec.ts',
      'lib/x.ts',
      'scripts/x.mts',
      'scripts/x.ts',
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 15_000);
