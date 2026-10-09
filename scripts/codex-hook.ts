#!/usr/bin/env bun
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { runCheck } from './verify';

const GATE_TIMEOUT_MS = 25_000;
const PATCHED_FILE =
  /^\s*\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/gm;

type Reply = { exitCode: 0 | 2; stdout: string; stderr: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parse(input: string): { cwd: string; patch: string } {
  const event: unknown = JSON.parse(input);
  if (!isObject(event)) {
    throw new Error('expected a JSON object');
  }
  const {
    hook_event_name: name,
    tool_name: tool,
    cwd,
    tool_input: toolInput,
  } = event;
  if (name !== 'PostToolUse') {
    throw new Error('hook_event_name must be PostToolUse');
  }
  if (tool !== 'apply_patch') {
    throw new Error('tool_name must be apply_patch');
  }
  if (typeof cwd !== 'string' || !isAbsolute(cwd)) {
    throw new Error('cwd must be an absolute path');
  }
  const patch = isObject(toolInput) ? toolInput.command : undefined;
  if (typeof patch !== 'string') {
    throw new Error('tool_input.command must be a string');
  }
  return { cwd, patch };
}

function location(path: string): { path: string; directory: string } {
  const parts = path.split(sep);
  let canonical: string = sep;
  let directory: string = sep;
  let links = 0;
  for (;;) {
    const part = parts.shift();
    if (part === undefined) return { path: canonical, directory };
    const candidate = resolve(canonical, part);
    const entry = lstatSync(candidate, { throwIfNoEntry: false });
    if (entry?.isSymbolicLink()) {
      if (++links > 40) throw new Error(`too many symlinks resolving ${path}`);
      const target = readlinkSync(candidate);
      if (isAbsolute(target)) {
        canonical = sep;
        directory = sep;
      }
      parts.unshift(...target.split(sep));
      continue;
    }
    canonical = candidate;
    if (entry?.isDirectory()) directory = canonical;
  }
}

function remaining(deadline: number): number {
  const timeout = deadline - Date.now();
  if (timeout <= 0) throw new Error('timed out: hook budget exhausted');
  return timeout;
}

function failure(result: SpawnSyncReturns<string>): string | undefined {
  if (result.error !== undefined) {
    return 'code' in result.error && result.error.code === 'ETIMEDOUT'
      ? 'timed out'
      : `could not start: ${result.error.message}`;
  }
  if (result.signal !== null) return `killed by ${result.signal}`;
  return result.status === 0 ? undefined : `exited ${String(result.status)}`;
}

function repository(directory: string, deadline: number): string | undefined {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: directory,
    env: { ...process.env, LC_ALL: 'C' },
    encoding: 'utf8',
    timeout: remaining(deadline),
    killSignal: 'SIGKILL',
  });
  if (result.status === 128 && result.stderr.includes('not a git repository')) {
    return undefined;
  }
  const reason = failure(result);
  if (reason !== undefined) {
    throw new Error(
      `Git discovery in ${directory} ${reason}\n${result.stderr ?? ''}`,
    );
  }
  return realpathSync(result.stdout.replace(/\n$/, ''));
}

function changedRepositories(
  paths: { path: string; edited: boolean }[],
  deadline: number,
  notices: string[],
): Map<string, string[]> {
  const repositories = new Map<string, string[]>();
  for (const { path, edited } of paths) {
    const target = location(path);
    const root = repository(target.directory, deadline);
    if (root === undefined) {
      notices.push(`Skipped ${path}: outside any Git repository`);
      continue;
    }
    const files = repositories.get(root) ?? [];
    if (edited && lstatSync(target.path, { throwIfNoEntry: false })?.isFile()) {
      files.push(target.path);
    }
    repositories.set(root, files);
  }
  return repositories;
}

async function verify(
  root: string,
  paths: string[],
  deadline: number,
): Promise<string> {
  try {
    const gate = await runCheck(
      {
        name: 'agent-verify',
        command: [resolve(root, 'scripts/agent-verify'), ...paths],
      },
      root,
      process.env,
      remaining(deadline),
      new Set(),
    );
    let reason = `exited ${gate.status}`;
    if (gate.timedOut) reason = 'timed out';
    else if (gate.signal !== null) reason = `killed by ${gate.signal}`;
    else if (gate.status === null) reason = 'could not start';
    else if (gate.status === 0) return '';
    return `agent-verify failed in ${root}: ${reason}\n${gate.output}\n`;
  } catch (error) {
    return `agent-verify failed in ${root}: ${String(error)}\n`;
  }
}

export async function handle(input: string, deadline: number): Promise<Reply> {
  const notices: string[] = [];
  let stderr = '';
  try {
    const { cwd, patch } = parse(input);
    const headers = [...patch.matchAll(PATCHED_FILE)];
    const paths = headers.map((match, index) => {
      const path = match[2].trim();
      return {
        path: isAbsolute(path) ? path : `${cwd}/${path}`,
        edited:
          match[1] !== 'Delete File' && headers[index + 1]?.[1] !== 'Move to',
      };
    });
    const fallback = paths.length === 0;
    if (fallback) paths.push({ path: cwd, edited: false });
    const repositories = changedRepositories(paths, deadline, notices);
    for (const [root, paths] of repositories) {
      if (fallback) {
        notices.push(`Full gate fallback in ${root} for ${cwd}`);
      } else if (paths.length === 0) {
        notices.push(
          `Skipped ${root}: no existing edited files; left to the turn-end gate`,
        );
        continue;
      }
      if (
        lstatSync(resolve(root, 'scripts/agent-verify'), {
          throwIfNoEntry: false,
        }) === undefined
      ) {
        notices.push(`Skipped ${root}: no scripts/agent-verify`);
        continue;
      }
      stderr += await verify(root, paths, deadline);
    }
  } catch (error) {
    stderr += `codex-hook: ${String(error)}\n`;
  }
  if (stderr !== '') {
    stderr += notices.map((notice) => `${notice}\n`).join('');
  }
  return {
    exitCode: stderr === '' ? 0 : 2,
    stdout:
      notices.length === 0
        ? ''
        : `${JSON.stringify({ systemMessage: notices.join('\n') })}\n`,
    stderr,
  };
}

if (import.meta.main) {
  const deadline = Date.now() + GATE_TIMEOUT_MS;
  const reply = await handle(readFileSync(0, 'utf8'), deadline);
  process.stdout.write(reply.stdout);
  process.stderr.write(reply.stderr);
  process.exitCode = reply.exitCode;
}
