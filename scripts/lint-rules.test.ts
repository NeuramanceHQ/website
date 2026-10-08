import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

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

const vitestImports = `import { expect, expect as check, it } from 'vitest';
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
  expect(
    lint({
      'complexity-10.ts': branching(10),
      'complexity-11.ts': branching(11),
      'depth-3.ts': nested(3),
      'depth-4.ts': nested(4),
      'function-100.ts': longFunction(100),
      'function-101.ts': longFunction(101),
      'file-500.ts': longFile(500),
      'file-501.ts': longFile(501),
    }),
  ).toEqual([
    'complexity-11.ts:1 eslint(complexity)',
    'depth-4.ts:5 eslint(max-depth)',
    'file-501.ts:501 eslint(max-lines)',
    'function-101.ts:1 eslint(max-lines-per-function)',
  ]);
});
