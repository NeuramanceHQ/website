import { execFile, execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { it } from 'vitest';
import { TURN_CHECKS, verify } from './verify';

type Cleanup = (cleanup: () => void) => void;
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

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd: root, encoding: 'utf8', timeout: 10_000 },
  ).trim();
}

const TOOL = `#!/bin/sh
ps -o pgid= -p $$ >> groups
trap 'echo "$1 stopped" >> calls; exit 130' INT
echo "$1 start" >> calls
grep -qx "$1 fails" behavior && { echo "planted failure" >&2; exit 1; }
grep -qx "$1 lingers" behavior && sleep 0.4
grep -qx "$1 reports-git" behavior && git rev-parse --absolute-git-dir >> calls
test -f failing && grep -qx "$1" failing && exit 1
echo "$1 end" >> calls
`;

function repository(finished: Cleanup, behavior = ''): string {
  const root = mkdtempSync(join(tmpdir(), 'gate hook '));
  finished(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, '.githooks'));
  for (const name of ['pre-push.ts', 'verify.ts'])
    copyFileSync(
      resolve(import.meta.dirname, name),
      join(root, 'scripts', name),
    );
  symlinkSync('../scripts/pre-push.ts', join(root, '.githooks/pre-push'));
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      scripts: Object.fromEntries(
        [...SCRIPTS, 'build'].map((name) => [name, `sh tool.sh ${name}`]),
      ),
    }),
  );
  writeFileSync(join(root, 'tool.sh'), TOOL);
  writeFileSync(join(root, 'behavior'), behavior);
  writeFileSync(join(root, '.gitignore'), 'calls\nbehavior\ngroups\n');
  git(root, 'init', '--quiet');
  git(root, 'config', 'core.hooksPath', '.githooks');
  git(root, 'add', '.');
  git(root, 'commit', '--quiet', '--message', 'fixture');
  return root;
}

const calls = (root: string): string[] =>
  readFileSync(join(root, 'calls'), 'utf8').trimEnd().split('\n');

function gate(
  root: string,
  args: readonly string[] = [],
  env = process.env,
): Promise<{ status: number; stdout: string; stderr: string }> {
  return new Promise((settle, reject) => {
    execFile(
      'bun',
      [join(root, 'scripts/verify.ts'), ...args],
      { cwd: root, env, encoding: 'utf8', timeout: 5_000 },
      (error, stdout, stderr) => {
        if (error === null) settle({ status: 0, stdout, stderr });
        else if (typeof error.code === 'number')
          settle({ status: error.code, stdout, stderr });
        else reject(error);
      },
    );
  });
}

function startGate(root: string, finished: Cleanup) {
  const child = spawn('bun', [join(root, 'scripts/verify.ts')], {
    cwd: root,
    stdio: 'ignore',
    timeout: 4_000,
    killSignal: 'SIGKILL',
  });
  finished(() => {
    child.kill('SIGKILL');
    if (!existsSync(join(root, 'groups'))) return;
    for (const pid of readFileSync(join(root, 'groups'), 'utf8')
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((pid) => pid > 0)) {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch (error) {
        if (
          !(error instanceof Error && 'code' in error && error.code === 'ESRCH')
        )
          throw error;
      }
    }
  });
  return {
    child,
    exited: new Promise<number | null>((settle) => child.on('exit', settle)),
  };
}

function push(
  repository: string,
  refs: string,
): {
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
      ? readFileSync(log, 'utf8')
          .trimEnd()
          .split('\n')
          .filter((line) => line.endsWith(' start'))
          .map((line) => line.slice(0, -6))
          .toSorted()
      : [],
  };
}

it('runs the full gate and the browser suite before pushing HEAD', ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  expect(
    push(
      root,
      `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${ZERO_SHA}\n`,
    ),
  ).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS.toSorted(),
  });
});

it('blocks the push when a check fails', ({ expect, onTestFinished }) => {
  const root = repository(onTestFinished);
  writeFileSync(join(root, 'failing'), 'test:e2e\n');
  git(root, 'add', 'failing');
  git(root, 'commit', '--quiet', '--message', 'plant a failure');
  const result = push(
    root,
    `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${ZERO_SHA}\n`,
  );
  expect([result.status, result.calls]).toEqual([1, SCRIPTS.toSorted()]);
  expect(result.stderr).toMatch(
    /^FAIL \[test:e2e\] bun run --silent test:e2e exited 1\n/,
  );
});

it('verifies an annotated tag that points at HEAD', ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  git(root, 'tag', '--annotate', 'v1', '--message', 'release');
  expect(
    push(
      root,
      `refs/tags/v1 ${git(root, 'rev-parse', 'v1')} refs/tags/v1 ${ZERO_SHA}\n`,
    ),
  ).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS.toSorted(),
  });
});

it('verifies the checkout when a push only deletes a remote branch', ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  expect(
    push(
      root,
      `(delete) ${ZERO_SHA} refs/heads/old ${git(root, 'rev-parse', 'HEAD')}\n`,
    ),
  ).toEqual({
    status: 0,
    stderr: expect.stringMatching(PASSED),
    calls: SCRIPTS.toSorted(),
  });
});

it.for(['first', 'later'])(
  'refuses a %s ref that is not the checked-out HEAD',
  (position, { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    expect(
      push(
        root,
        (position === 'later'
          ? `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${ZERO_SHA}\n`
          : '') +
          `refs/heads/other ${'1'.repeat(40)} refs/heads/other ${ZERO_SHA}\n`,
      ),
    ).toEqual({
      status: 1,
      stderr:
        'pre-push: refs/heads/other is not the checked-out HEAD; check it out and push again so it can be verified\n',
      calls: [],
    });
  },
);

it('refuses uncommitted changes without running the gate', ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  writeFileSync(join(root, 'draft.ts'), 'export {};\n');
  expect(
    push(
      root,
      `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${ZERO_SHA}\n`,
    ),
  ).toEqual({
    status: 1,
    stderr:
      'pre-push: commit or stash local changes first; pushes are verified from a clean checkout of HEAD\n',
    calls: [],
  });
});
it.concurrent('reports every check in order at the end of a turn', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const result = await gate(root);
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(result.stdout).toMatch(
    /^agent-verify: suppressions, typecheck, lint, lint:shell, format:check, test, build passed in \d+\.\ds\n$/,
  );
  expect(calls(root).toSorted()).toEqual([
    'build end',
    'build start',
    'format:check end',
    'format:check start',
    'lint end',
    'lint start',
    'lint:shell end',
    'lint:shell start',
    'test end',
    'test start',
    'typecheck end',
    'typecheck start',
  ]);
});

it.concurrent('skips the tests and the build after an edit', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  const result = await gate(root, [join(root, 'app/page.tsx')]);
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(result.stdout).toMatch(
    /^agent-verify: suppressions, typecheck, lint, lint:shell, format:check passed in /,
  );
  expect(calls(root).toSorted()).toEqual([
    'format:check end',
    'format:check start',
    'lint end',
    'lint start',
    'lint:shell end',
    'lint:shell start',
    'typecheck end',
    'typecheck start',
  ]);
});

it.concurrent('reports a failing check after running the others', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished, 'lint fails\n');
  const result = await gate(root);
  expect([result.status, result.stdout, result.stderr]).toEqual([
    1,
    '',
    'FAIL [lint] bun run --silent lint exited 1\nplanted failure\n',
  ]);
  expect(calls(root).toSorted()).toEqual([
    'build end',
    'build start',
    'format:check end',
    'format:check start',
    'lint start',
    'lint:shell end',
    'lint:shell start',
    'test end',
    'test start',
    'typecheck end',
    'typecheck start',
  ]);
});

it.concurrent('runs checks against its own checkout even when started from another repository hook', async ({
  expect,
  onTestFinished,
}) => {
  const victim = repository(onTestFinished);
  const root = repository(onTestFinished, 'lint reports-git\n');
  const result = await gate(root, [], {
    ...process.env,
    GIT_DIR: join(victim, '.git'),
    GIT_WORK_TREE: victim,
  });
  expect([result.status, result.stderr]).toEqual([0, '']);
  expect(calls(root)).toContain(join(realpathSync(root), '.git'));
});

it.concurrent('disables telemetry for every check even when inherited as enabled', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  writeFileSync(join(root, 'tool.sh'), 'test "$NEXT_TELEMETRY_DISABLED" = 1\n');
  expect(
    await gate(root, [], { ...process.env, NEXT_TELEMETRY_DISABLED: '0' }),
  ).toEqual({
    status: 0,
    stdout: expect.stringMatching(/^agent-verify: .* passed in /),
    stderr: '',
  });
});

it.concurrent('waits for a verification already running in the same checkout', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished, 'typecheck lingers\n');
  const first = startGate(root, onTestFinished);
  await expect
    .poll(() => existsSync(join(root, 'calls')), { timeout: 1_000 })
    .toBe(true);
  const impatient = await verify(
    root,
    TURN_CHECKS,
    Date.now() + 100,
    new Set(),
  );
  expect([impatient.exitCode, impatient.stderr]).toEqual([
    1,
    expect.stringMatching(/^FAIL \[lock\] another verification of /),
  ]);
  const patient = await verify(
    root,
    TURN_CHECKS,
    Date.now() + 2_000,
    new Set(),
  );
  expect([patient.exitCode, patient.stderr, await first.exited]).toEqual([
    0,
    '',
    0,
  ]);
  expect(
    calls(root).filter((line) => /^(typecheck|lint|build) /.test(line)),
  ).toEqual([
    'typecheck start',
    'typecheck end',
    'lint start',
    'lint end',
    'build start',
    'build end',
    'typecheck start',
    'typecheck end',
    'lint start',
    'lint end',
    'build start',
    'build end',
  ]);
});

it.concurrent.for([
  ['SIGINT', 130],
  ['SIGHUP', 129],
  ['SIGTERM', 143],
] as const)(
  'interrupts every check group on %s, including stubborn grandchildren',
  async ([signal, status], { expect, onTestFinished }) => {
    const root = repository(onTestFinished);
    writeFileSync(
      join(root, 'tool.sh'),
      `ps -o pgid= -p $$ >> groups
case "$1" in typecheck|test) ;; *) exit 0 ;; esac
trap 'echo "$1 INT" >> signals' INT
trap 'echo "$1 TERM" >> signals' TERM
sh -c 'trap "" INT; echo $$ > "$1.child"; sleep 4' sh "$1" &
wait
`,
    );
    const { child, exited } = startGate(root, onTestFinished);
    await expect
      .poll(
        () =>
          ['typecheck', 'test'].every((name) =>
            existsSync(join(root, `${name}.child`)),
          ),
        { timeout: 1_000 },
      )
      .toBe(true);
    child.kill(signal);
    expect(await exited).toBe(status);
    expect(
      new Set(
        readFileSync(join(root, 'signals'), 'utf8').trimEnd().split('\n'),
      ),
    ).toEqual(new Set(['test INT', 'typecheck INT']));
    for (const name of ['typecheck', 'test']) {
      const pid = readFileSync(join(root, `${name}.child`), 'utf8').trim();
      await expect
        .poll(
          () => {
            const state = spawnSync('ps', ['-p', pid, '-o', 'stat='], {
              encoding: 'utf8',
              timeout: 1_000,
            }).stdout.trim();
            return state === '' || state.startsWith('Z');
          },
          { timeout: 300 },
        )
        .toBe(true);
    }
  },
);

it('refuses a repository with no commits', ({ expect, onTestFinished }) => {
  const root = repository(onTestFinished);
  rmSync(join(root, '.git'), { recursive: true, force: true });
  git(root, 'init', '--quiet');
  git(root, 'config', 'core.hooksPath', '.githooks');
  expect(push(root, '')).toEqual({
    status: 1,
    stderr: 'pre-push: cannot read HEAD\n',
    calls: [],
  });
});
