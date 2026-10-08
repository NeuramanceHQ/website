#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const GATE_TIMEOUT_MS = 25_000;
const PATCHED_FILE = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm;

type Reply = { exitCode: 0 | 2; stderr: string };

function parse(input: string): { cwd: string; patch: string } | undefined {
  try {
    const event: unknown = JSON.parse(input);
    if (typeof event !== 'object' || event === null) {
      return undefined;
    }
    const { cwd, tool_input: toolInput } = event as Record<string, unknown>;
    const patch =
      typeof toolInput === 'object' && toolInput !== null
        ? (toolInput as Record<string, unknown>).command
        : undefined;
    return typeof cwd === 'string' && typeof patch === 'string'
      ? { cwd, patch }
      : undefined;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

function inside(root: string, path: string): boolean {
  const inner = relative(root, path);
  return inner !== '' && !inner.startsWith(`..${sep}`) && !isAbsolute(inner);
}

function patchedFiles(root: string, cwd: string, patch: string) {
  const top = realpathSync(root);
  return [...patch.matchAll(PATCHED_FILE)]
    .map(([, path]) => resolve(cwd, path?.trim() ?? ''))
    .filter((path) => existsSync(path) && inside(top, realpathSync(path)));
}

function handle(root: string, input: string): Reply {
  const event = parse(input);
  if (event === undefined) {
    return {
      exitCode: 2,
      stderr:
        'codex-hook: expected a PostToolUse event with cwd and tool_input.command\n',
    };
  }
  const files = patchedFiles(root, event.cwd, event.patch);
  if (files.length === 0) {
    return { exitCode: 0, stderr: '' };
  }
  const gate = spawnSync(resolve(root, 'scripts/agent-verify'), files, {
    cwd: root,
    encoding: 'utf8',
    timeout: GATE_TIMEOUT_MS,
  });
  if (gate.status === 0) {
    return { exitCode: 0, stderr: '' };
  }
  const output = `${gate.stdout ?? ''}${gate.stderr ?? ''}`;
  return {
    exitCode: 2,
    stderr: `agent-verify failed after apply_patch; fix these:\n${output || `agent-verify did not finish: ${String(gate.error)}\n`}`,
  };
}

if (import.meta.main) {
  const reply = handle(
    resolve(import.meta.dirname, '..'),
    readFileSync(0, 'utf8'),
  );
  process.stderr.write(reply.stderr);
  process.exitCode = reply.exitCode;
}
