import { execFile, execFileSync, spawn, spawnSync } from 'node:child_process';
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

type Cleanup = (cleanup: () => void) => void;
export const ZERO_SHA = '0'.repeat(40);
export const SCRIPTS = [
  'typecheck',
  'lint',
  'lint:shell',
  'lint:caddy',
  'format:check',
  'test',
  'test:e2e',
];
export const PASSED =
  /^agent-verify: suppressions, typecheck, lint, lint:shell, lint:caddy, lockfile, format:check, test, test:e2e passed in \d+\.\ds\n$/;

export function git(root: string, ...args: string[]): string {
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

export function scratch(finished: Cleanup): string {
  const root = mkdtempSync(join(tmpdir(), 'agent verify '));
  finished(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

export function emptyRepository(finished: Cleanup): string {
  const root = scratch(finished);
  git(root, 'init', '--quiet');
  return root;
}

export function repository(finished: Cleanup, behavior = ''): string {
  const root = emptyRepository(finished);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, '.githooks'));
  for (const name of ['pre-push.ts', 'verify.ts', 'scan-suppressions']) {
    copyFileSync(
      resolve(import.meta.dirname, name),
      join(root, 'scripts', name),
    );
  }
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
  git(root, 'config', 'core.hooksPath', '.githooks');
  git(root, 'add', '.');
  git(root, 'commit', '--quiet', '--message', 'fixture');
  return root;
}

export const calls = (root: string): string[] =>
  readFileSync(join(root, 'calls'), 'utf8').trimEnd().split('\n');

export function gate(
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

export function startGate(root: string, finished: Cleanup) {
  const child = spawn('bun', [join(root, 'scripts/verify.ts')], {
    cwd: root,
    stdio: 'ignore',
    timeout: 4_000,
    killSignal: 'SIGKILL',
  });
  finished(() => {
    child.kill('SIGKILL');
    if (!existsSync(join(root, 'groups'))) {
      return;
    }
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
        ) {
          throw error;
        }
      }
    }
  });
  return {
    child,
    exited: new Promise<number | null>((settle) => child.on('exit', settle)),
  };
}

export function push(
  repository: string,
  refs: string,
  env = process.env,
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
    { cwd: repository, env, encoding: 'utf8', timeout: 20_000 },
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
