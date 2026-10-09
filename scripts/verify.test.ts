import { execFileSync } from 'node:child_process';
import {
  accessSync,
  constants,
  realpathSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { it } from 'vitest';
import {
  EDIT_CHECKS,
  failureReport,
  PUSH_CHECKS,
  runCheck,
  TURN_CHECKS,
  verify,
  type Check,
} from './verify';

type Cleanup = (cleanup: () => void) => void;

function scratch(finished: Cleanup): string {
  const directory = mkdtempSync(join(tmpdir(), 'agent verify '));
  finished(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function repository(finished: Cleanup): string {
  const root = scratch(finished);
  execFileSync('git', ['init', '--quiet'], { cwd: root, timeout: 10_000 });
  return root;
}

it.concurrent('runs independent checks concurrently at a rendezvous', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const checks: Check[] = ['a', 'b'].map((name, index) => ({
    name,
    command: [
      'sh',
      '-c',
      'touch "$1"; until test -e "$2"; do sleep 0.01; done',
      'sh',
      name,
      index === 0 ? 'b' : 'a',
    ],
  }));
  const report = await verify(root, checks, Date.now() + 500, new Set());
  expect([report.exitCode, report.stderr]).toEqual([0, '']);
  expect(report.stdout).toMatch(/^agent-verify: a, b passed in /);
});

it.concurrent.for([0, 1])(
  'waits for a prerequisite that exits %i',
  async (status, { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    const first: Check = {
      name: 'first',
      command: ['sh', '-c', `sleep 0.08; touch ready; exit ${status}`],
    };
    const second: Check = {
      name: 'second',
      command: ['sh', '-c', 'test -e ready && touch dependent'],
      after: [first],
    };
    const report = await verify(
      root,
      [first, second],
      Date.now() + 1_000,
      new Set(),
    );
    expect(existsSync(join(root, 'dependent'))).toBe(true);
    expect(report.exitCode).toBe(status);
    expect(report.stderr).toBe(
      status === 0
        ? ''
        : 'FAIL [first] sh -c sleep 0.08; touch ready; exit 1 exited 1\n',
    );
  },
);

it.concurrent('rejects a missing prerequisite before starting checks', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const absent: Check = { name: 'absent', command: ['true'] };
  await expect(
    verify(
      root,
      [{ name: 'dependent', command: ['touch', 'started'], after: [absent] }],
      Date.now() + 500,
      new Set(),
    ),
  ).rejects.toThrow(/dependent.*absent/);
  expect(existsSync(join(root, 'started'))).toBe(false);
});

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
    ['format:check', []],
  ]);
  expect(graph(TURN_CHECKS)).toEqual([
    ['suppressions', []],
    ['typecheck', []],
    ['lint', ['typecheck']],
    ['lint:shell', []],
    ['format:check', []],
    ['test', []],
    ['build', ['lint']],
  ]);
  expect(graph(PUSH_CHECKS)).toEqual([
    ['suppressions', []],
    ['typecheck', []],
    ['lint', ['typecheck']],
    ['lint:shell', []],
    ['format:check', []],
    ['test', []],
    ['test:e2e', ['lint']],
  ]);
});

it.concurrent('reports a check that cannot start through the full gate', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const report = await verify(
    root,
    [{ name: 'missing', command: [join(root, 'missing-tool')] }],
    Date.now() + 1_000,
    new Set(),
  );
  expect([report.exitCode, report.stdout]).toEqual([1, '']);
  expect(report.stderr).toMatch(
    /^FAIL \[missing\] .*missing-tool could not start\n.*ENOENT/,
  );
});

it.concurrent('saves exactly the full output of a long failure', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const output = Array.from(
    { length: 45 },
    (_, index) => `line ${index + 1}\n`,
  ).join('');
  writeFileSync(join(root, 'output'), output);
  const report = await verify(
    root,
    [{ name: 'long', command: ['sh', '-c', 'cat output; exit 1'] }],
    Date.now() + 1_000,
    new Set(),
  );
  const path = /5 lines omitted; full output in (.*)\n/.exec(
    report.stderr,
  )?.[1];
  expect(path).toBeDefined();
  if (path === undefined) throw new Error('missing log path');
  onTestFinished(() => rmSync(dirname(path), { recursive: true, force: true }));
  expect(readFileSync(path, 'utf8')).toBe(output);
  expect(report.exitCode).toBe(1);
  expect(report.stderr.split('\n')).toEqual([
    'FAIL [long] sh -c cat output; exit 1 exited 1',
    ...Array.from({ length: 30 }, (_, index) => `line ${index + 1}`),
    `... 5 lines omitted; full output in ${path}`,
    ...Array.from({ length: 10 }, (_, index) => `line ${index + 36}`),
    '',
  ]);
});

it.concurrent('shows a failure of 40 lines in full without saving it', ({
  expect,
}) => {
  const lines = Array.from({ length: 40 }, (_, index) => `line ${index + 1}`);
  expect(
    failureReport(
      {
        check: { name: 'lint', command: ['oxlint'] },
        status: 1,
        signal: null,
        timedOut: false,
        output: `${lines.join('\n')}\n`,
      },
      () => {
        throw new Error('a short failure must not be saved');
      },
    ).split('\n'),
  ).toEqual(['FAIL [lint] oxlint exited 1', ...lines]);
});

it.concurrent('reports failures in list order despite reversed completion', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const checks: Check[] = [
    { name: 'first', command: ['sh', '-c', 'sleep 0.08; echo first; exit 1'] },
    { name: 'second', command: ['sh', '-c', 'echo second; exit 2'] },
  ];
  const report = await verify(root, checks, Date.now() + 1_000, new Set());
  expect(report.stderr).toBe(
    'FAIL [first] sh -c sleep 0.08; echo first; exit 1 exited 1\nfirst\nFAIL [second] sh -c echo second; exit 2 exited 2\nsecond\n',
  );
});

it.concurrent('stops a check and its descendants at the deadline', async ({
  expect,
  onTestFinished,
}) => {
  const root = scratch(onTestFinished);
  const outcome = await runCheck(
    { name: 'slow', command: ['sh', '-c', '(sleep 1.5; touch marker) & wait'] },
    root,
    process.env,
    80,
    new Set(),
  );
  await sleep(600);
  expect([
    outcome.timedOut,
    outcome.status,
    existsSync(join(root, 'marker')),
  ]).toEqual([true, null, false]);
});

it.concurrent('lets a timed-out check clean up before killing what ignores the request', async ({
  expect,
  onTestFinished,
}) => {
  const root = scratch(onTestFinished);
  const running = new Set<number>();
  const [polite, stubborn] = await Promise.all([
    runCheck(
      {
        name: 'polite',
        command: [
          'sh',
          '-c',
          'trap "touch cleaned; exit 1" INT; sleep 3 & wait',
        ],
      },
      root,
      process.env,
      80,
      running,
    ),
    runCheck(
      { name: 'stubborn', command: ['sh', '-c', 'trap "" INT; sleep 3'] },
      root,
      process.env,
      80,
      running,
    ),
  ]);
  expect([polite.timedOut, existsSync(join(root, 'cleaned'))]).toEqual([
    true,
    true,
  ]);
  expect([stubborn.timedOut, stubborn.signal, running.size]).toEqual([
    true,
    'SIGKILL',
    0,
  ]);
  expect(failureReport(stubborn, () => 'unused')).toBe(
    'FAIL [stubborn] sh -c trap "" INT; sleep 3 timed out',
  );
});

it.concurrent('reports a check killed by a signal', async ({
  expect,
  onTestFinished,
}) => {
  const outcome = await runCheck(
    { name: 'crash', command: ['sh', '-c', 'kill -TERM $$'] },
    scratch(onTestFinished),
    process.env,
    1_000,
    new Set(),
  );
  expect(failureReport(outcome, () => 'unused')).toBe(
    'FAIL [crash] sh -c kill -TERM $$ killed by SIGTERM',
  );
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
  expect(result.stderr.split('\n')).toEqual([
    'FAIL [suppressions] sh -c git grep -nE --text --untracked "(o[x]lint|e[s]lint)-(disable|enable)" -- "*.[jt]s" "*.[jt]sx" "*.[cm][jt]s"; test $? -eq 1 exited 1',
    `components/binary.ts:2:/*\0*/ // ${directive}-line`,
    `components/hidden.tsx:2:/* ${directive} */`,
    '',
  ]);
});

it.concurrent('reports the checks it had no time to run instead of starting them', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const first: Check = { name: 'first', command: ['sh', '-c', 'sleep 3'] };
  const second: Check = {
    name: 'second',
    command: ['touch', 'late'],
    after: [first],
  };
  const third: Check = {
    name: 'third',
    command: ['touch', 'late'],
    after: [second],
  };
  const report = await verify(
    root,
    [first, second, third],
    Date.now() + 500,
    new Set(),
  );
  expect(report.exitCode).toBe(1);
  expect(report.stderr).toBe(
    'FAIL [first] sh -c sleep 3 timed out\nFAIL [deadline] no time left to run second, third\n',
  );
  expect(existsSync(join(root, 'late'))).toBe(false);
});

it.concurrent('rejects a prerequisite listed after its dependent before starting checks', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const first: Check = { name: 'first', command: ['touch', 'started'] };
  const second: Check = { name: 'second', command: ['true'], after: [first] };
  await expect(
    verify(root, [second, first], Date.now() + 500, new Set()),
  ).rejects.toThrow('second requires first earlier in the list');
  expect(existsSync(join(root, 'started'))).toBe(false);
});

it.concurrent('gives a dependent only the time remaining when it starts', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const first: Check = { name: 'first', command: ['sh', '-c', 'sleep 0.45'] };
  const second: Check = {
    name: 'second',
    command: ['sh', '-c', 'sleep 0.6'],
    after: [first],
  };
  const report = await verify(
    root,
    [first, second],
    Date.now() + 900,
    new Set(),
  );
  expect([report.exitCode, report.stderr]).toEqual([
    1,
    'FAIL [second] sh -c sleep 0.6 timed out\n',
  ]);
});

it.for([
  ['scripts/agent-verify', 'scripts/verify.ts'],
  ['.githooks/pre-push', 'scripts/pre-push.ts'],
])('keeps %s executable and linked to %s', ([link, target], { expect }) => {
  const root = resolve(import.meta.dirname, '..');
  expect(() => accessSync(resolve(root, link), constants.X_OK)).not.toThrow();
  expect(realpathSync(resolve(root, link))).toBe(resolve(root, target));
});

it.concurrent('starts after all prerequisites without waiting for unrelated checks', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const fast: Check = { name: 'fast', command: ['touch', 'fast'] };
  const slow: Check = {
    name: 'slow',
    command: ['sh', '-c', 'sleep 0.08; touch slow'],
  };
  const dependent: Check = {
    name: 'dependent',
    command: ['sh', '-c', 'test -e fast && test -e slow && touch dependent'],
    after: [fast, slow],
  };
  const unrelated: Check = {
    name: 'unrelated',
    command: ['sh', '-c', 'until test -e dependent; do sleep 0.01; done'],
  };
  const report = await verify(
    root,
    [unrelated, fast, slow, dependent],
    Date.now() + 2_000,
    new Set(),
  );
  expect([report.exitCode, report.stderr]).toEqual([0, '']);
});
