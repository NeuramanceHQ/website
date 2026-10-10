import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { runCheck, TURN_CHECKS, verify } from './verify';
import {
  ZERO_SHA,
  SCRIPTS,
  PASSED,
  git,
  repository,
  calls,
  gate,
  startGate,
  push,
} from './pre-push-fixture';

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
    const other = git(
      root,
      'commit-tree',
      'HEAD^{tree}',
      '-p',
      'HEAD',
      '-m',
      'other',
    );
    expect(
      push(
        root,
        (position === 'later'
          ? `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${ZERO_SHA}\n`
          : '') + `refs/heads/other ${other} refs/heads/other ${ZERO_SHA}\n`,
      ),
    ).toEqual({
      status: 1,
      stderr:
        'pre-push: refs/heads/other is not the checked-out HEAD; check it out and push again so it can be verified\n',
      calls: [],
    });
  },
);

it.for(['first', 'later'])(
  'reports a git error for a %s ref with an invalid commit',
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
      stderr: `pre-push: git rev-parse --verify --quiet ${'1'.repeat(40)}^{commit}: exited 1\n`,
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
    /^agent-verify: suppressions, typecheck, lint, lint:shell, lint:caddy, lockfile, format:check, test, build passed in \d+\.\ds\n$/,
  );
  expect(calls(root).toSorted()).toEqual([
    'build end',
    'build start',
    'format:check end',
    'format:check start',
    'lint end',
    'lint start',
    'lint:caddy end',
    'lint:caddy start',
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
    /^agent-verify: suppressions, typecheck, lint, lint:shell, lint:caddy, lockfile, format:check passed in /,
  );
  expect(calls(root).toSorted()).toEqual([
    'format:check end',
    'format:check start',
    'lint end',
    'lint start',
    'lint:caddy end',
    'lint:caddy start',
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
    'lint:caddy end',
    'lint:caddy start',
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
case "$1" in lint|test) ;; *) exit 0 ;; esac
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
          ['lint', 'test'].every((name) =>
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
    ).toEqual(new Set(['test INT', 'lint INT']));
    for (const name of ['lint', 'test']) {
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
    stderr: expect.stringMatching(
      /pre-push: git rev-parse HEAD: fatal: ambiguous argument 'HEAD'/,
    ),
    calls: [],
  });
});

it('reports a failed git status instead of claiming the checkout is dirty', ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  writeFileSync(join(root, '.git/index'), 'corrupt');
  const result = push(root, '');
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(
    /pre-push: git status --porcelain: fatal: .*index/,
  );
  expect(result.stderr).not.toContain('commit or stash');
  expect(result.calls).toEqual([]);
});

it.concurrent('resolves CLI edit paths from the caller subdirectory', async ({
  expect,
  onTestFinished,
}) => {
  const root = repository(onTestFinished);
  copyFileSync(
    join(import.meta.dirname, 'agent-verify'),
    join(root, 'scripts/agent-verify'),
  );
  mkdirSync(join(root, 'components'));
  mkdirSync(join(root, 'public'));
  writeFileSync(join(root, 'components/nav.tsx'), 'export {};\n');
  writeFileSync(join(root, 'public/logo.svg'), '<svg/>');
  writeFileSync(join(root, 'Caddyfile'), ':3099 {}\n');
  writeFileSync(
    join(root, '.gitignore'),
    'calls\nbehavior\ngroups\nout/\n.vscode/\n',
  );
  const result = await runCheck(
    {
      name: 'relative edit paths',
      command: [
        join(root, 'scripts/agent-verify'),
        '../public/logo.svg',
        'nav.tsx',
        '../Caddyfile',
        '../out/zz.js',
        '../.vscode/settings.json',
        '../../outside.ts',
      ],
    },
    join(root, 'components'),
    process.env,
    3_000,
    new Set(),
  );
  expect(result.status, result.output).toBe(0);
  expect(
    result.output.split('\n').filter((line) => line.includes('not verified')),
  ).toEqual([
    'agent-verify: not verified: ../public/logo.svg (no check reads this file)',
    'agent-verify: not verified: ../out/zz.js (no check reads this file)',
    'agent-verify: not verified: ../.vscode/settings.json (no check reads this file)',
    'agent-verify: not verified: ../../outside.ts (no check reads this file)',
  ]);
});
