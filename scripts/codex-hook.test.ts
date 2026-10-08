import { spawnSync } from 'node:child_process';
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
import { afterEach, beforeEach, expect, it } from 'vitest';

const GATE = `#!/bin/sh
printf '%s\\n' "$@" > "$(dirname "$0")/../gate-args"
[ -e "$(dirname "$0")/../gate-fails" ] && { echo "FAIL [lint] planted failure" >&2; exit 1; }
exit 0
`;

let root = '';
let outside = '';

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'codex hook ')));
  outside = realpathSync(mkdtempSync(join(tmpdir(), 'codex outside ')));
  mkdirSync(join(root, 'scripts'));
  copyFileSync(
    resolve(import.meta.dirname, 'codex-hook.ts'),
    join(root, 'scripts/codex-hook.ts'),
  );
  writeFileSync(join(root, 'scripts/agent-verify'), GATE, { mode: 0o755 });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

function touch(path: string): string {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, 'export {};\n');
  return path;
}

function hook(input: string): {
  status: number | null;
  stdout: string;
  stderr: string;
  gated: string[] | undefined;
} {
  const result = spawnSync('bun', [join(root, 'scripts/codex-hook.ts')], {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 20_000,
  });
  const args = join(root, 'gate-args');
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    gated: existsSync(args)
      ? readFileSync(args, 'utf8').trimEnd().split('\n')
      : undefined,
  };
}

const event = (cwd: string, patch: string): string =>
  JSON.stringify({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    turn_id: 'turn-1',
    cwd,
    tool_input: { command: patch },
  });

it('checks every added, updated, and renamed file of a patch inside the repository', () => {
  const added = touch(join(root, 'components/new card.tsx'));
  const updated = touch(join(root, 'app/page.tsx'));
  const renamed = touch(join(root, '-renamed.ts'));
  const patch = [
    '*** Begin Patch',
    '*** Add File: components/new card.tsx',
    '+export {};',
    '*** Update File: app/page.tsx',
    '@@',
    '*** Update File: old.ts',
    '*** Move to: -renamed.ts',
    '*** Delete File: gone.ts',
    '*** End Patch',
  ].join('\n');
  expect(hook(event(root, patch))).toEqual({
    status: 0,
    stdout: '',
    stderr: '',
    gated: [added, updated, renamed],
  });
});

it('resolves patch paths from the directory Codex runs in', () => {
  const page = touch(join(root, 'app/page.tsx'));
  expect(
    hook(event(join(root, 'app'), '*** Update File: page.tsx\n')).gated,
  ).toEqual([page]);
});

it('leaves a patch alone when it only deletes files or touches files outside the repository', () => {
  const elsewhere = touch(join(outside, 'other.ts'));
  symlinkSync(elsewhere, join(root, 'link.ts'));
  const patch = [
    `*** Update File: ${elsewhere}`,
    '*** Update File: link.ts',
    '*** Delete File: gone.ts',
  ].join('\n');
  expect(hook(event(root, patch))).toEqual({
    status: 0,
    stdout: '',
    stderr: '',
    gated: undefined,
  });
});

it('hands a failing gate back to Codex as feedback', () => {
  touch(join(root, 'app/page.tsx'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(event(root, '*** Update File: app/page.tsx\n'));
  expect([result.status, result.stdout]).toEqual([2, '']);
  expect(result.stderr).toBe(
    'agent-verify failed after apply_patch; fix these:\nFAIL [lint] planted failure\n',
  );
});

it.each(['not json', '{"cwd": 1}', '{"cwd": "/repo", "tool_input": {}}'])(
  'rejects a malformed event without running the gate: %s',
  (input) => {
    expect(hook(input)).toEqual({
      status: 2,
      stdout: '',
      stderr:
        'codex-hook: expected a PostToolUse event with cwd and tool_input.command\n',
      gated: undefined,
    });
  },
);
