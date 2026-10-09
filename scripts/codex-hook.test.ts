import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
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
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { handle } from './codex-hook';

const GATE = `#!/bin/sh
printf '%s\\n' "$@" >> gate-args
printf 'run\\n' >> gate-calls
[ -e gate-fails ] && { echo "FAIL [lint] planted failure" >&2; exit 1; }
echo verified-fixture
exit 0
`;

let directory = '';
let root = '';

function repository(name: string): string {
  const path = join(directory, name);
  execFileSync('git', ['init', '--quiet', path], { timeout: 10_000 });
  mkdirSync(join(path, 'scripts'));
  writeFileSync(join(path, 'scripts/agent-verify'), GATE, { mode: 0o755 });
  return path;
}

beforeEach(() => {
  directory = realpathSync(mkdtempSync(join(tmpdir(), 'codex hook ')));
  vi.stubEnv('GIT_CEILING_DIRECTORIES', resolve(directory, '..'));
  vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
  root = repository('repository A');
  copyFileSync(
    resolve(import.meta.dirname, 'codex-hook.ts'),
    join(root, 'scripts/codex-hook.ts'),
  );
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

function touch(path: string): string {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, 'export {};\n');
  return path;
}

function gated(path: string): string[] {
  return readFileSync(join(path, 'gate-args'), 'utf8').trimEnd().split('\n');
}

function hook(input: string) {
  return spawnSync('bun', [join(root, 'scripts/codex-hook.ts')], {
    cwd: root,
    input,
    encoding: 'utf8',
    timeout: 10_000,
    killSignal: 'SIGKILL',
  });
}

const event = (cwd: string, patch: string): string =>
  JSON.stringify({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    cwd,
    tool_input: { command: patch },
  });

it('checks added, updated, renamed, and deleted paths as absolute arguments', () => {
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
  expect(hook(event(root, patch))).toMatchObject({
    status: 0,
    stdout: '',
    stderr: '',
  });
  expect(gated(root)).toEqual([
    added,
    updated,
    join(root, 'old.ts'),
    renamed,
    join(root, 'gone.ts'),
  ]);
});

it('resolves patch paths from the directory Codex runs in', () => {
  const page = touch(join(root, 'app/page.tsx'));
  expect(
    hook(event(join(root, 'app'), '*** Update File: page.tsx\n')).status,
  ).toBe(0);
  expect(gated(root)).toEqual([page]);
});

it('verifies a deleted path whose parent directories are gone', () => {
  expect(
    hook(event(root, '*** Delete File: removed/deep/gone.ts\n')),
  ).toMatchObject({ status: 0, stdout: '', stderr: '' });
  expect(gated(root)).toEqual([join(root, 'removed/deep/gone.ts')]);
});

it('runs each repository gate once with only its own paths', () => {
  const other = repository('repository B');
  const first = touch(join(root, 'a.ts'));
  const second = touch(join(other, 'b.ts'));
  const third = join(root, 'gone.ts');
  const patch = [
    `*** Update File: ${first}`,
    `*** Update File: ${second}`,
    `*** Delete File: ${third}`,
  ].join('\n');
  expect(hook(event(root, patch))).toMatchObject({
    status: 0,
    stdout: '',
    stderr: '',
  });
  expect(gated(root)).toEqual([first, third]);
  expect(gated(other)).toEqual([second]);
  expect(readFileSync(join(root, 'gate-calls'), 'utf8')).toBe('run\n');
  expect(readFileSync(join(other, 'gate-calls'), 'utf8')).toBe('run\n');
});

it.each(['file', 'directory'])(
  'attributes a %s symlink to the repository holding its target',
  (kind) => {
    const other = repository('repository B');
    const target = touch(join(other, 'target.ts'));
    symlinkSync(kind === 'file' ? target : other, join(root, 'link'));
    const path = kind === 'file' ? 'link' : 'link/target.ts';
    expect(hook(event(root, `*** Update File: ${path}\n`))).toMatchObject({
      status: 0,
      stdout: '',
      stderr: '',
    });
    expect(gated(other)).toEqual([target]);
    expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  },
);

it('does not attribute the repository parent to the repository', () => {
  const result = hook(event(root, '*** Update File: ..\n'));
  expect(result).toMatchObject({ status: 0, stderr: '' });
  expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: expect.stringContaining(directory),
  });
});

it('runs a focused fallback in cwd and reports it when no headers exist', () => {
  const cwd = join(root, 'subdirectory');
  mkdirSync(cwd);
  const result = hook(event(cwd, '*** Begin Patch\n*** End Patch\n'));
  expect(result).toMatchObject({ status: 0, stderr: '' });
  expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: expect.stringMatching(/fallback/i),
  });
  expect(result.stdout).toContain(root);
  expect(gated(root)).toEqual([cwd]);
});

it('names paths outside Git and repositories without a gate in one warning', () => {
  const other = repository('without gate');
  rmSync(join(other, 'scripts/agent-verify'));
  const outside = touch(join(directory, 'outside.ts'));
  const patch = [
    `*** Update File: ${outside}`,
    `*** Add File: ${join(other, 'new.ts')}`,
  ].join('\n');
  const result = hook(event(root, patch));
  expect(result).toMatchObject({ status: 0, stderr: '' });
  expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: expect.stringContaining(outside),
  });
  expect(result.stdout).toContain(other);
  expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it('hands a failing gate back to Codex with its repository and output', () => {
  touch(join(root, 'app/page.tsx'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(event(root, '*** Update File: app/page.tsx\n'));
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(root);
  expect(result.stderr).toContain('FAIL [lint] planted failure\n');
});

it.each([
  ['not json', 'JSON'],
  ['null', 'object'],
  ['[]', 'object'],
  ['{"cwd": 1}', 'hook_event_name'],
  [
    '{"hook_event_name":"PostToolUse","tool_name":"apply_patch","cwd":"/repo","tool_input":{}}',
    'tool_input.command',
  ],
])('rejects malformed input %s', (input, field) => {
  const result = hook(input);
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(field);
  expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it.each([
  ['hook_event_name', 'PreToolUse'],
  ['tool_name', 'Write'],
  ['cwd', 'relative/path'],
  ['cwd', 42],
  ['tool_input', { command: 42 }],
])('validates %s before running a gate', (field, value) => {
  const input = JSON.parse(event(root, '*** Add File: new.ts\n'));
  input[field] = value;
  const result = hook(JSON.stringify(input));
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(field);
  expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it('reports a gate that cannot start with its repository and reason', () => {
  chmodSync(join(root, 'scripts/agent-verify'), 0o644);
  const result = hook(event(root, '*** Update File: new.ts\n'));
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(root);
  expect(result.stderr).toMatch(/could not start.*EACCES/i);
});

it('reports a gate killed by a signal even when it printed output', () => {
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\necho before-signal\nkill -TERM "$$"\n',
  );
  const result = hook(event(root, '*** Update File: new.ts\n'));
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(root);
  expect(result.stderr).toContain('SIGTERM');
  expect(result.stderr).toContain('before-signal');
});

it('runs the configured command from a repository subdirectory', () => {
  const config = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../.codex/hooks.json'), 'utf8'),
  );
  const command = config.hooks.PostToolUse[0].hooks[0].command;
  const cwd = join(root, 'subdirectory');
  mkdirSync(cwd);
  writeFileSync(join(root, 'gate-fails'), '');
  const result = spawnSync('sh', ['-c', command], {
    cwd,
    input: event(cwd, '*** Add File: new.ts\n'),
    encoding: 'utf8',
    timeout: 10_000,
    killSignal: 'SIGKILL',
  });
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain('FAIL [lint] planted failure');
});

it('reports a timeout and preserves output within a short budget', () => {
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\ntrap "" TERM\necho before-timeout\nexec sleep 3\n',
  );
  const result = handle(
    event(root, '*** Update File: new.ts\n'),
    Date.now() + 600,
  );
  expect(result).toMatchObject({ exitCode: 2, stdout: '' });
  expect(result.stderr).toContain(root);
  expect(result.stderr).toContain('timed out');
  expect(result.stderr).toContain('before-timeout');
});

it('shares one deadline between repositories and runs gates sequentially', () => {
  const other = repository('repository B');
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\nsleep 0.6\n: > finished\n',
  );
  writeFileSync(
    join(other, 'scripts/agent-verify'),
    '#!/bin/sh\ntest -f "../repository A/finished" || { echo overlap; exit 1; }\nexec sleep 0.9\n',
  );
  const result = handle(
    event(root, `*** Add File: a.ts\n*** Add File: ${other}/b.ts\n`),
    Date.now() + 1_200,
  );
  expect(result).toMatchObject({ exitCode: 2, stdout: '' });
  expect(result.stderr).toContain(other);
  expect(result.stderr).toContain('timed out');
  expect(result.stderr).not.toContain('overlap');
  expect(result.stderr).not.toContain(root);
});

it.each(['header', 'cwd'])(
  'resolves symlinks before parent traversal in the %s',
  (part) => {
    const other = repository('repository B');
    const nested = join(other, 'nested');
    mkdirSync(nested);
    const target = touch(join(other, 'target.ts'));
    const link = join(root, 'link');
    symlinkSync(nested, link);
    const cwd = part === 'cwd' ? link : root;
    const path = part === 'cwd' ? '../target.ts' : 'link/../target.ts';
    expect(hook(event(cwd, `*** Update File: ${path}\n`))).toMatchObject({
      status: 0,
      stdout: '',
      stderr: '',
    });
    expect(gated(other)).toEqual([target]);
    expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  },
);

it('attributes deleted paths through a dangling symlink to its target repository', () => {
  const other = repository('repository B');
  symlinkSync(join(other, 'removed'), join(root, 'link'));
  expect(
    hook(event(root, '*** Delete File: link/deep/gone.ts\n')),
  ).toMatchObject({ status: 0, stdout: '', stderr: '' });
  expect(gated(other)).toEqual([join(other, 'removed/deep/gone.ts')]);
  expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it('keeps verifying later repositories after a gate fails', () => {
  const other = repository('repository B');
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(
    event(
      root,
      `*** Update File: first.ts\n*** Update File: ${other}/last.ts\n`,
    ),
  );
  expect(result).toMatchObject({ status: 2, stdout: '' });
  expect(result.stderr).toContain(root);
  expect(result.stderr).toContain('FAIL [lint] planted failure');
  expect(gated(other)).toEqual([join(other, 'last.ts')]);
});
