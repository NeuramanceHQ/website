#!/usr/bin/env bun
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { constants, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as sleep } from 'node:timers/promises';

export type Check = {
  name: string;
  command: readonly [string, ...string[]];
};

export type Outcome = {
  check: Check;
  status: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  output: string;
};

export type Report = { exitCode: 0 | 1; stdout: string; stderr: string };

const SHOWN_HEAD_LINES = 30;
const SHOWN_TAIL_LINES = 10;
const STOP_GRACE_MS = 1_000;
const GIT_TIMEOUT_MS = 10_000;
const LOCK_POLL_MS = 100;
const SQLITE_BUSY = 5;
const EDIT_BUDGET_MS = 20_000;
const TURN_BUDGET_MS = 240_000;

export const script = (name: string): Check => ({
  name,
  command: ['bun', 'run', '--silent', name],
});

export const EDIT_CHECKS: readonly Check[] = [
  {
    name: 'suppressions',
    command: [
      'sh',
      '-c',
      'git grep -nE --text --untracked "(o[x]lint|e[s]lint)-(disable|enable)" -- "*.[jt]s" "*.[jt]sx" "*.[cm][jt]s"; test $? -eq 1',
    ],
  },
  script('typecheck'),
  script('lint'),
  script('lint:shell'),
  script('format:check'),
];

export const TURN_CHECKS: readonly Check[] = [
  ...EDIT_CHECKS,
  script('test'),
  script('build'),
];

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

export function checkEnvironment(): NodeJS.ProcessEnv {
  const local = spawnSync('git', ['rev-parse', '--local-env-vars'], {
    encoding: 'utf8',
    timeout: GIT_TIMEOUT_MS,
  });
  const env = { ...process.env };
  for (const name of (local.stdout ?? '').split('\n')) {
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
      signalGroup(child.pid, 'SIGTERM');
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
          `... ${omitted} lines omitted; full output in ${saveLog(outcome.output)}`,
          ...lines.slice(-SHOWN_TAIL_LINES),
        ]
      : lines;
  return [
    `FAIL [${outcome.check.name}] ${outcome.check.command.join(' ')} ${verdict(outcome)}`,
    ...shown,
  ].join('\n');
}

function saveLog(output: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'agent-verify-')), 'output.log');
  writeFileSync(path, output);
  return path;
}

function lockPath(root: string, env: NodeJS.ProcessEnv): string | undefined {
  const result = spawnSync(
    'git',
    ['rev-parse', '--git-path', 'agent-verify.lock'],
    { cwd: root, env, encoding: 'utf8', timeout: GIT_TIMEOUT_MS },
  );
  return result.status === 0 ? resolve(root, result.stdout.trim()) : undefined;
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

export async function verify(
  root: string,
  checks: readonly Check[],
  deadline: number,
  running: Set<number>,
): Promise<Report> {
  const started = performance.now();
  const env = checkEnvironment();
  const path = lockPath(root, env);
  if (path === undefined) {
    return failed(`FAIL [lock] ${root} is not a Git checkout\n`);
  }
  const lock = await acquireLock(path, deadline);
  if (lock === undefined) {
    return failed(
      `FAIL [lock] another verification of ${root} still held ${path} at the deadline\n`,
    );
  }
  const outcomes: Outcome[] = [];
  const late: string[] = [];
  for (const check of checks) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      late.push(check.name);
      continue;
    }
    outcomes.push(await runCheck(check, root, env, remaining, running));
  }
  lock.close();
  const reports = outcomes
    .filter(({ status, timedOut }) => status !== 0 || timedOut)
    .map((failure) => `${failureReport(failure, saveLog)}\n`);
  if (late.length > 0) {
    reports.push(`FAIL [deadline] no time left to run ${late.join(', ')}\n`);
  }
  if (reports.length > 0) {
    return failed(reports.join(''));
  }
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const names = checks.map(({ name }) => name).join(', ');
  return {
    exitCode: 0,
    stdout: `agent-verify: ${names} passed in ${seconds}s\n`,
    stderr: '',
  };
}

export async function main(
  checks: readonly Check[],
  budgetMs: number,
): Promise<void> {
  const running = new Set<number>();
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => {
      const groups = [...running];
      for (const pid of groups) signalGroup(pid, 'SIGTERM');
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
  const report = await verify(root, checks, Date.now() + budgetMs, running);
  process.stdout.write(report.stdout);
  process.stderr.write(report.stderr);
  process.exitCode = report.exitCode;
}

if (import.meta.main) {
  const edited = process.argv.length > 2;
  await main(
    edited ? EDIT_CHECKS : TURN_CHECKS,
    edited ? EDIT_BUDGET_MS : TURN_BUDGET_MS,
  );
}
