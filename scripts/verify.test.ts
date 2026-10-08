import { execFile, execFileSync, spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { it } from 'vitest';
import {
  EDIT_CHECKS,
  failureReport,
  runCheck,
  TURN_CHECKS,
  verify,
  type Outcome,
} from './verify';

type Cleanup = (cleanup: () => void) => void;

function scratch(finished: Cleanup): string {
  const directory = mkdtempSync(join(tmpdir(), 'agent verify '));
  finished(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

it.concurrent('runs checks to completion and reports each status and output', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const directory = scratch(onTestFinished);
  const outcomes = await Promise.all([
    runCheck(
      { name: 'pass', command: ['sh', '-c', 'echo fine'] },
      directory,
      process.env,
      5_000,
      running,
    ),
    runCheck(
      { name: 'fail', command: ['sh', '-c', 'echo broken >&2; exit 3'] },
      directory,
      process.env,
      5_000,
      running,
    ),
  ]);
  expect(
    outcomes.map(({ check, status, signal, timedOut, output }) => [
      check.name,
      status,
      signal,
      timedOut,
      output,
    ]),
  ).toEqual([
    ['pass', 0, null, false, 'fine\n'],
    ['fail', 3, null, false, 'broken\n'],
  ]);
  expect(running.size).toBe(0);
});

it.concurrent('stops a check and its descendants at the deadline', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const directory = scratch(onTestFinished);
  const marker = join(directory, 'marker');
  const outcome = await runCheck(
    {
      name: 'slow',
      command: ['sh', '-c', '(sleep 0.3; touch "$1") & wait', 'sh', marker],
    },
    directory,
    process.env,
    100,
    running,
  );
  await sleep(500);
  expect([outcome.timedOut, outcome.status, existsSync(marker)]).toEqual([
    true,
    null,
    false,
  ]);
});

it.concurrent('lets a timed-out check clean up before killing what ignores the request', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const directory = scratch(onTestFinished);
  const cleaned = join(directory, 'cleaned');
  const [polite, stubborn] = await Promise.all([
    runCheck(
      {
        name: 'polite',
        command: [
          'sh',
          '-c',
          'trap \'touch "$1"; exit 1\' TERM; sleep 5 & wait',
          'sh',
          cleaned,
        ],
      },
      directory,
      process.env,
      100,
      running,
    ),
    runCheck(
      { name: 'stubborn', command: ['sh', '-c', 'trap "" TERM; sleep 5'] },
      directory,
      process.env,
      100,
      running,
    ),
  ]);
  expect([polite.timedOut, existsSync(cleaned)]).toEqual([true, true]);
  expect([stubborn.timedOut, stubborn.signal]).toEqual([true, 'SIGKILL']);
});

it.concurrent('reports a check that cannot start', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const directory = scratch(onTestFinished);
  const outcome = await runCheck(
    { name: 'missing', command: [join(directory, 'missing-tool')] },
    directory,
    process.env,
    5_000,
    running,
  );
  expect([outcome.status, outcome.signal, outcome.timedOut]).toEqual([
    null,
    null,
    false,
  ]);
  expect(failureReport(outcome, () => 'unused')).toMatch(
    /^FAIL \[missing\] .*missing-tool could not start\n.*ENOENT/,
  );
});

it.concurrent('reports a check killed by a signal', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const outcome = await runCheck(
    { name: 'crash', command: ['sh', '-c', 'kill -TERM $$'] },
    scratch(onTestFinished),
    process.env,
    5_000,
    running,
  );
  expect(failureReport(outcome, () => 'unused')).toBe(
    'FAIL [crash] sh -c kill -TERM $$ killed by SIGTERM',
  );
});

it.concurrent('shows the first 30 and last 10 lines of a long failure and saves the full output', ({
  expect,
}) => {
  const lines = Array.from({ length: 45 }, (_, index) => `line ${index + 1}`);
  const outcome: Outcome = {
    check: { name: 'test', command: ['vitest', 'run'] },
    status: 1,
    signal: null,
    timedOut: false,
    output: `${lines.join('\n')}\n`,
  };
  const saved: string[] = [];
  const report = failureReport(outcome, (output) => {
    saved.push(output);
    return '/logs/output.log';
  });
  expect(report.split('\n')).toEqual([
    'FAIL [test] vitest run exited 1',
    ...lines.slice(0, 30),
    '... 5 lines omitted; full output in /logs/output.log',
    ...lines.slice(35),
  ]);
  expect(saved).toEqual([outcome.output]);
});

it.concurrent('shows a failure of 40 lines in full without saving it', ({
  expect,
}) => {
  const lines = Array.from({ length: 40 }, (_, index) => `line ${index + 1}`);
  const outcome: Outcome = {
    check: { name: 'lint', command: ['oxlint'] },
    status: 1,
    signal: null,
    timedOut: false,
    output: `${lines.join('\n')}\n`,
  };
  expect(
    failureReport(outcome, () => {
      throw new Error('a short failure must not be saved');
    }).split('\n'),
  ).toEqual(['FAIL [lint] oxlint exited 1', ...lines]);
});

it.concurrent('names a timeout in the failure report', ({ expect }) => {
  const outcome: Outcome = {
    check: { name: 'lint', command: ['oxlint'] },
    status: null,
    signal: 'SIGKILL',
    timedOut: true,
    output: '',
  };
  expect(failureReport(outcome, () => 'unused')).toBe(
    'FAIL [lint] oxlint timed out',
  );
});

const TOOL = `#!/bin/sh
trap 'echo "$1 stopped" >> calls; exit 143' TERM
echo "$1 start" >> calls
grep -qx "$1 fails" behavior && { echo "planted failure" >&2; exit 1; }
grep -qx "$1 lingers" behavior && sleep 0.8
grep -qx "$1 reports-git" behavior && git rev-parse --absolute-git-dir >> calls
echo "$1 end" >> calls
`;

function fakeRepository(root: string, behavior: string): string {
  const scripts = [
    'typecheck',
    'lint',
    'lint:shell',
    'format:check',
    'test',
    'build',
  ];
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      scripts: Object.fromEntries(
        scripts.map((name) => [name, `sh tool.sh ${name}`]),
      ),
    }),
  );
  writeFileSync(join(root, 'tool.sh'), TOOL);
  writeFileSync(join(root, 'behavior'), behavior);
  writeFileSync(join(root, '.gitignore'), 'calls\nbehavior\n');
  mkdirSync(join(root, 'scripts'));
  copyFileSync(
    resolve(import.meta.dirname, 'verify.ts'),
    join(root, 'scripts/verify.ts'),
  );
  execFileSync('git', ['init', '--quiet'], { cwd: root, timeout: 10_000 });
  return root;
}

const calls = (root: string): string[] =>
  readFileSync(join(root, 'calls'), 'utf8').trimEnd().split('\n');

const ran = (...names: string[]): string[] =>
  names.flatMap((name) => [`${name} start`, `${name} end`]);

function gate(
  root: string,
  args: readonly string[] = [],
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((settle, reject) => {
    execFile(
      'bun',
      [join(root, 'scripts/verify.ts'), ...args],
      { cwd: root, env, encoding: 'utf8', timeout: 20_000 },
      (error, stdout, stderr) => {
        if (error === null) {
          settle({ status: 0, stdout, stderr });
        } else if (typeof error.code === 'number') {
          settle({ status: error.code, stdout, stderr });
        } else {
          reject(error);
        }
      },
    );
  });
}

it.concurrent('runs every check in order at the end of a turn', async ({
  expect,
  onTestFinished,
}) => {
  const root = fakeRepository(scratch(onTestFinished), '');
  const result = await gate(root);
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(result.stdout).toMatch(
    /^agent-verify: suppressions, typecheck, lint, lint:shell, format:check, test, build passed in \d+\.\ds\n$/,
  );
  expect(calls(root)).toEqual(
    ran('typecheck', 'lint', 'lint:shell', 'format:check', 'test', 'build'),
  );
});

it.concurrent('skips the tests and the build after an edit', async ({
  expect,
  onTestFinished,
}) => {
  const root = fakeRepository(scratch(onTestFinished), '');
  const result = await gate(root, [join(root, 'app/page.tsx')]);
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(result.stdout).toMatch(
    /^agent-verify: suppressions, typecheck, lint, lint:shell, format:check passed in /,
  );
  expect(calls(root)).toEqual(
    ran('typecheck', 'lint', 'lint:shell', 'format:check'),
  );
});

it.concurrent('reports a failing check after running the others', async ({
  expect,
  onTestFinished,
}) => {
  const root = fakeRepository(scratch(onTestFinished), 'lint fails\n');
  const result = await gate(root);
  expect([result.status, result.stdout, result.stderr]).toEqual([
    1,
    '',
    'FAIL [lint] bun run --silent lint exited 1\nplanted failure\n',
  ]);
  expect(calls(root)).toEqual([
    ...ran('typecheck'),
    'lint start',
    ...ran('lint:shell', 'format:check', 'test', 'build'),
  ]);
});

it.concurrent('runs checks against its own checkout even when started from another repository hook', async ({
  expect,
  onTestFinished,
}) => {
  const victim = scratch(onTestFinished);
  execFileSync('git', ['init', '--quiet'], { cwd: victim, timeout: 10_000 });
  const root = fakeRepository(scratch(onTestFinished), 'lint reports-git\n');
  const result = await gate(root, [], {
    ...process.env,
    GIT_DIR: join(victim, '.git'),
    GIT_WORK_TREE: victim,
  });
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(calls(root)).toContain(join(realpathSync(root), '.git'));
});

it.concurrent('rejects lint suppression directives in code, wherever they hide', async ({
  expect,
  onTestFinished,
}) => {
  const root = fakeRepository(scratch(onTestFinished), '');
  const directive = ['oxlint', 'disable'].join('-');
  mkdirSync(join(root, 'components'));
  writeFileSync(join(root, 'components/clean.tsx'), 'export {};\n');
  writeFileSync(join(root, 'notes.md'), `/* ${directive} */\n`);
  writeFileSync(join(root, '.gitattributes'), '*.ts -diff\n');
  expect((await gate(root, ['x'])).status).toBe(0);

  writeFileSync(
    join(root, 'components/hidden.tsx'),
    `export {};\n/* ${directive} */\n`,
  );
  writeFileSync(
    join(root, 'components/binary.ts'),
    `export {};\n/*\0*/ // ${directive}-line\n`,
  );
  const result = await gate(root, ['x']);
  expect(result.status).toBe(1);
  expect(result.stderr.split('\n')).toEqual([
    `FAIL [suppressions] ${EDIT_CHECKS[0]?.command.join(' ')} exited 1`,
    `components/binary.ts:2:/*\0*/ // ${directive}-line`,
    `components/hidden.tsx:2:/* ${directive} */`,
    '',
  ]);
});

it.concurrent('reports the checks it had no time to run instead of starting them', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const root = fakeRepository(scratch(onTestFinished), 'typecheck lingers\n');
  const report = await verify(root, TURN_CHECKS, Date.now() + 300, running);
  expect(report.exitCode).toBe(1);
  expect(report.stderr).toMatch(
    /^FAIL \[typecheck\] bun run --silent typecheck timed out\n/,
  );
  expect(report.stderr).toMatch(
    /\nFAIL \[deadline\] no time left to run lint, lint:shell, format:check, test, build\n$/,
  );
  expect(calls(root)).toEqual(['typecheck start', 'typecheck stopped']);
});

it.concurrent('waits for a verification already running in the same checkout', async ({
  expect,
  onTestFinished,
}) => {
  const running = new Set<number>();
  const root = fakeRepository(scratch(onTestFinished), 'typecheck lingers\n');
  const first = spawn('bun', [join(root, 'scripts/verify.ts')], {
    cwd: root,
    env: { ...process.env, TMPDIR: scratch(onTestFinished) },
    stdio: 'ignore',
  });
  onTestFinished(() => {
    first.kill('SIGKILL');
  });
  const exited = new Promise<number | null>((settle) =>
    first.on('exit', settle),
  );
  await expect
    .poll(() => existsSync(join(root, 'calls')), { timeout: 10_000 })
    .toBe(true);

  const impatient = await verify(root, TURN_CHECKS, Date.now() + 300, running);
  expect([impatient.exitCode, impatient.stderr]).toEqual([
    1,
    expect.stringMatching(/^FAIL \[lock\] another verification of /),
  ]);

  const patient = await verify(root, TURN_CHECKS, Date.now() + 15_000, running);
  expect([patient.exitCode, patient.stderr]).toEqual([0, '']);
  expect(await exited).toBe(0);
  const sequence = calls(root);
  expect(sequence).toHaveLength(24);
  expect(sequence.slice(0, 12)).toEqual(sequence.slice(12));
}, 20_000);

it.concurrent('asks its running check to stop when interrupted', async ({
  expect,
  onTestFinished,
}) => {
  const root = fakeRepository(scratch(onTestFinished), 'typecheck lingers\n');
  const child = spawn('bun', [join(root, 'scripts/verify.ts')], {
    cwd: root,
    stdio: 'ignore',
  });
  onTestFinished(() => {
    child.kill('SIGKILL');
  });
  const exited = new Promise<number | null>((settle) =>
    child.on('exit', settle),
  );
  await expect
    .poll(() => existsSync(join(root, 'calls')), { timeout: 10_000 })
    .toBe(true);
  child.kill('SIGTERM');
  expect(await exited).toBe(143);
  expect(calls(root)).toEqual(['typecheck start', 'typecheck stopped']);
}, 20_000);
