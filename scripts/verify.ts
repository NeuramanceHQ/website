#!/usr/bin/env bun
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { constants } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as sleep } from 'node:timers/promises';

export type Check = {
  name: string;
  command: readonly [string, ...string[]];
  after?: readonly Check[];
};

export type Outcome = {
  check: Check;
  status: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  output: string;
};

export type Report = { exitCode: 0 | 1; stdout: string; stderr: string };

const SHOWN_HEAD_LINES = 10;
const SHOWN_TAIL_LINES = 40;
const STOP_GRACE_MS = 1_000;
const GIT_TIMEOUT_MS = 10_000;
const LOCK_POLL_MS = 100;
const SQLITE_BUSY = 5;
const EDIT_BUDGET_MS = 15_000;
const TURN_BUDGET_MS = 240_000;

export const script = (name: string): Check => ({
  name,
  command: ['bun', 'run', '--silent', name],
});

const typecheck = script('typecheck');
const lint: Check = { ...script('lint'), after: [typecheck] };

export const EDIT_CHECKS: readonly Check[] = [
  {
    name: 'suppressions',
    command: ['sh', resolve(import.meta.dirname, 'scan-suppressions')],
  },
  typecheck,
  lint,
  script('lint:shell'),
  script('lint:caddy'),
  {
    name: 'lockfile',
    command: [
      'bun',
      'install',
      '--frozen-lockfile',
      '--dry-run',
      '--offline',
      '--ignore-scripts',
    ],
  },
  script('format:check'),
];

export const TURN_CHECKS: readonly Check[] = [
  ...EDIT_CHECKS,
  script('test'),
  { ...script('build'), after: [lint] },
];

export const PUSH_CHECKS: readonly Check[] = [
  ...EDIT_CHECKS,
  script('test'),
  { ...script('test:e2e'), after: [lint] },
];

export function readsEditedFile(path: string): boolean {
  return (
    /\.(?:[cm]?[jt]sx?|json|md|css)$/.test(path) ||
    [
      'bun.lock',
      'Caddyfile',
      'Caddyfile.local',
      'scripts/deploy',
      'scripts/lint-shell',
      'scripts/scan-suppressions',
    ].includes(path)
  );
}

function signalGroup(pid: number | undefined, signal: NodeJS.Signals): void {
  if (pid === undefined) {
    return;
  }
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (
      !(error instanceof Error && 'code' in error && error.code === 'ESRCH')
    ) {
      throw error;
    }
  }
}

export function gitOutput(
  args: string[],
  cwd = process.cwd(),
  env = process.env,
): string {
  const result = spawnSync('git', args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: GIT_TIMEOUT_MS,
  });
  if (result.status !== 0) {
    const reason =
      result.error?.message ??
      (result.stderr.trim() || `exited ${result.status}`);
    throw new Error(`git ${args.join(' ')}: ${reason}`);
  }
  return result.stdout.trim();
}

export function checkEnvironment(): NodeJS.ProcessEnv {
  const local = gitOutput(
    ['rev-parse', '--local-env-vars'],
    process.cwd(),
    process.env,
  );
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
  };
  for (const name of local.split('\n')) {
    delete env[name];
  }
  return env;
}

export function runCheck(
  check: Check,
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
  running: Set<number>,
): Promise<Outcome> {
  return new Promise((settle) => {
    const [command, ...args] = check.command;
    const child = spawn(command, args, {
      cwd,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const chunks: Buffer[] = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      signalGroup(child.pid, 'SIGINT');
      setTimeout(() => signalGroup(child.pid, 'SIGKILL'), STOP_GRACE_MS);
    }, timeoutMs);
    const finish = (
      status: number | null,
      signal: NodeJS.Signals | null,
      output: string,
    ): void => {
      clearTimeout(timer);
      if (child.pid !== undefined) {
        running.delete(child.pid);
      }
      settle({ check, status, signal, timedOut, output });
    };
    if (child.pid !== undefined) {
      running.add(child.pid);
    }
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.on('error', (error) => finish(null, null, error.message));
    child.on('close', (status, signal) =>
      finish(status, signal, Buffer.concat(chunks).toString()),
    );
  });
}

function verdict(outcome: Outcome): string {
  if (outcome.timedOut) {
    return 'timed out';
  }
  if (outcome.signal !== null) {
    return `killed by ${outcome.signal}`;
  }
  return outcome.status === null
    ? 'could not start'
    : `exited ${outcome.status}`;
}

export function failureReport(
  outcome: Outcome,
  saveLog: (output: string) => string,
): string {
  const text = outcome.output.trimEnd();
  const lines = text === '' ? [] : text.split('\n');
  const omitted = lines.length - SHOWN_HEAD_LINES - SHOWN_TAIL_LINES;
  const shown =
    omitted > 0
      ? [
          ...lines.slice(0, SHOWN_HEAD_LINES),
          `... ${omitted} lines omitted; ${saveLog(outcome.output)}`,
          ...lines.slice(-SHOWN_TAIL_LINES),
        ]
      : lines;
  return [
    `FAIL [${outcome.check.name}] ${outcome.check.command.join(' ')} ${verdict(outcome)}`,
    ...shown,
  ].join('\n');
}

function gitPath(root: string, env: NodeJS.ProcessEnv, name: string): string {
  return resolve(root, gitOutput(['rev-parse', '--git-path', name], root, env));
}

function saveLog(
  root: string,
  env: NodeJS.ProcessEnv,
  name: string,
  output: string,
): string {
  try {
    const directory = gitPath(root, env, 'agent-verify-logs');
    mkdirSync(directory, { recursive: true });
    const path = join(directory, `${name}.log`);
    writeFileSync(path, output);
    return `full output in ${path}`;
  } catch (error) {
    return `full output not saved: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function editNotices(
  root: string,
  env: NodeJS.ProcessEnv,
  paths: readonly string[],
): string {
  const targets = paths.map((path) => {
    const absolute = isAbsolute(path) ? path : resolve(path);
    const target = existsSync(absolute)
      ? realpathSync.native(absolute)
      : resolve(absolute);
    return [relative(root, absolute), relative(root, target)] as const;
  });
  const local = new Set(
    targets
      .flat()
      .filter(
        (path) => path !== '' && path !== '..' && !path.startsWith('../'),
      ),
  );
  let ignored = new Set<string>();
  if (local.size > 0) {
    const result = spawnSync('git', ['check-ignore', '-z', '--stdin'], {
      cwd: root,
      env,
      input: [...local].join('\0') + '\0',
      encoding: 'utf8',
      timeout: GIT_TIMEOUT_MS,
    });
    if (result.status !== 0 && result.status !== 1) {
      const reason =
        result.error?.message ??
        (result.stderr.trim() || `exited ${result.status}`);
      throw new Error(`git check-ignore -z --stdin: ${reason}`);
    }
    ignored = new Set(result.stdout.split('\0'));
  }
  return paths
    .filter((_, index) => {
      const [source, target] = targets[index]!;
      return (
        !local.has(source) ||
        !local.has(target) ||
        ignored.has(source) ||
        ignored.has(target) ||
        !readsEditedFile(target)
      );
    })
    .map(
      (path) =>
        `agent-verify: not verified: ${path} (no check reads this file)\n`,
    )
    .join('');
}

function busy(error: unknown): boolean {
  return (
    error instanceof Error &&
    'errcode' in error &&
    error.errcode === SQLITE_BUSY
  );
}

async function acquireLock(
  path: string,
  deadline: number,
): Promise<DatabaseSync | undefined> {
  const database = new DatabaseSync(path);
  for (;;) {
    try {
      database.exec('BEGIN EXCLUSIVE');
      return database;
    } catch (error) {
      if (!busy(error)) {
        throw error;
      }
    }
    if (Date.now() >= deadline) {
      database.close();
      return undefined;
    }
    await sleep(LOCK_POLL_MS);
  }
}

const failed = (stderr: string): Report => ({
  exitCode: 1,
  stdout: '',
  stderr,
});

function requireEarlierPrerequisites(checks: readonly Check[]): void {
  checks.forEach((check, index) => {
    for (const prerequisite of check.after ?? []) {
      if (!checks.slice(0, index).includes(prerequisite)) {
        throw new Error(
          `${check.name} requires ${prerequisite.name} earlier in the list`,
        );
      }
    }
  });
}

function checkReports(
  root: string,
  env: NodeJS.ProcessEnv,
  checks: readonly Check[],
  outcomes: readonly (Outcome | undefined)[],
): string[] {
  const reports = outcomes
    .filter((outcome) => outcome !== undefined)
    .filter(({ status, timedOut }) => status !== 0 || timedOut)
    .map(
      (failure) =>
        `${failureReport(failure, (output) => saveLog(root, env, failure.check.name, output))}\n`,
    );
  const late = checks
    .filter((_, index) => outcomes[index] === undefined)
    .map(({ name }) => name);
  if (late.length > 0) {
    reports.push(`FAIL [deadline] no time left to run ${late.join(', ')}\n`);
  }
  return reports;
}

export async function verify(
  root: string,
  checks: readonly Check[],
  deadline: number,
  running: Set<number>,
  paths: readonly string[] = [],
): Promise<Report> {
  requireEarlierPrerequisites(checks);
  const started = performance.now();
  let env: NodeJS.ProcessEnv;
  let path: string;
  try {
    env = checkEnvironment();
    path = gitPath(root, env, 'agent-verify.lock');
  } catch (error) {
    return failed(
      `FAIL [git] ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }
  const lock = await acquireLock(path, deadline);
  if (lock === undefined) {
    return failed(
      `FAIL [lock] another verification of ${root} still held ${path} at the deadline\n`,
    );
  }
  const pending = new Map<Check, Promise<Outcome | undefined>>();
  try {
    for (const check of checks) {
      const prerequisites = (check.after ?? []).map((item) =>
        pending.get(item)!,
      );
      pending.set(
        check,
        Promise.all(prerequisites).then(() => {
          const remaining = deadline - Date.now();
          if (remaining <= 0) return undefined;
          return runCheck(check, root, env, remaining, running);
        }),
      );
    }
    const outcomes = await Promise.all(
      checks.map((check) => pending.get(check)!),
    );
    const reports = checkReports(root, env, checks, outcomes);
    if (reports.length > 0) {
      return failed(reports.join(''));
    }
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const names = checks.map(({ name }) => name).join(', ');
    let notices: string;
    try {
      notices = editNotices(root, env, paths);
    } catch (error) {
      return failed(
        `FAIL [git] ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
    return {
      exitCode: 0,
      stdout: `agent-verify: ${names} passed in ${seconds}s\n${notices}`,
      stderr: '',
    };
  } finally {
    lock.close();
  }
}

export async function main(
  checks: readonly Check[],
  budgetMs: number,
  paths: readonly string[] = [],
): Promise<void> {
  const running = new Set<number>();
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => {
      const groups = [...running];
      for (const pid of groups) signalGroup(pid, 'SIGINT');
      Atomics.wait(
        new Int32Array(new SharedArrayBuffer(4)),
        0,
        0,
        STOP_GRACE_MS,
      );
      for (const pid of groups) signalGroup(pid, 'SIGKILL');
      process.exit(128 + constants.signals[signal]);
    });
  }
  const root = resolve(import.meta.dirname, '..');
  const report = await verify(
    root,
    checks,
    Date.now() + budgetMs,
    running,
    paths,
  );
  process.stdout.write(report.stdout);
  process.stderr.write(report.stderr);
  process.exitCode = report.exitCode;
}

if (import.meta.main) {
  const edited = process.argv.length > 2;
  await main(
    edited ? EDIT_CHECKS : TURN_CHECKS,
    edited ? EDIT_BUDGET_MS : TURN_BUDGET_MS,
    process.argv.slice(2),
  );
}
