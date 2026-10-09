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
import { afterAll, it, type TestContext, vi } from 'vitest';
import { handle } from './codex-hook';

const GATE = `#!/bin/sh
printf '%s\\n' "$@" >> gate-args
printf '%s\\n' "$#" > gate-count
printf 'run\\n' >> gate-calls
[ -e gate-fails ] && { echo "FAIL [lint] planted failure" >&2; exit 1; }
echo verified-fixture
exit 0
`;

vi.stubEnv('GIT_CEILING_DIRECTORIES', realpathSync(tmpdir()));
vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
afterAll(() => vi.unstubAllEnvs());

function repository(directory: string, name: string): string {
  const path = join(directory, name);
  execFileSync('git', ['init', '--quiet', path], { timeout: 10_000 });
  mkdirSync(join(path, 'scripts'));
  writeFileSync(join(path, 'scripts/agent-verify'), GATE, { mode: 0o755 });
  return path;
}

function fixture(finished: TestContext['onTestFinished']) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'codex hook ')));
  finished(() => rmSync(directory, { recursive: true, force: true }));
  const root = repository(directory, 'repository A');
  for (const file of ['codex-hook.ts', 'verify.ts']) {
    copyFileSync(
      resolve(import.meta.dirname, file),
      join(root, 'scripts', file),
    );
  }
  return { directory, root };
}

function touch(path: string): string {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, 'export {};\n');
  return path;
}

function gated(path: string): string[] {
  return readFileSync(join(path, 'gate-args'), 'utf8').trimEnd().split('\n');
}

function hook(root: string, input: string) {
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

it.concurrent('passes only existing edited files, excluding deletions and move sources', (context) => {
  const { root } = fixture(context.onTestFinished);
  const added = touch(join(root, 'components/new card.tsx'));
  const updated = touch(join(root, 'app/page.tsx'));
  const renamed = touch(join(root, '-renamed.ts'));
  touch(join(root, 'old.ts'));
  const patch = [
    '*** Begin Patch',
    '*** Add File: components/new card.tsx',
    '+export {};',
    '*** Update File: app/page.tsx',
    '@@',
    '*** Update File: old.ts',
    '*** Move to: -renamed.ts',
    '*** Delete File: gone.ts',
    '*** Update File: missing.ts',
    '*** Update File: components',
    '*** End Patch',
  ].join('\n');
  context.expect(hook(root, event(root, patch))).toMatchObject({
    status: 0,
    stdout: '',
    stderr: '',
  });
  context.expect(gated(root)).toEqual([added, updated, renamed]);
});

it.concurrent('accepts indented headers and trims surrounding path whitespace', (context) => {
  const { root } = fixture(context.onTestFinished);
  const first = touch(join(root, 'first.ts'));
  const second = touch(join(root, 'second.ts'));
  const result = hook(
    root,
    event(root, '  *** Add File: first.ts\n*** Update File:  second.ts \t\n'),
  );
  context.expect(result).toMatchObject({ status: 0, stdout: '', stderr: '' });
  context.expect(gated(root)).toEqual([first, second]);
});

it.concurrent('resolves patch paths from the directory Codex runs in', (context) => {
  const { root } = fixture(context.onTestFinished);
  const page = touch(join(root, 'app/page.tsx'));
  context
    .expect(
      hook(root, event(join(root, 'app'), '*** Update File: page.tsx\n'))
        .status,
    )
    .toBe(0);
  context.expect(gated(root)).toEqual([page]);
});

it.concurrent('leaves deletion-only repositories to the turn-end gate', (context) => {
  const { root } = fixture(context.onTestFinished);
  const result = hook(
    root,
    event(root, '*** Delete File: removed/deep/gone.ts\n'),
  );
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringContaining(`Skipped ${root}`),
  });
  context.expect(result.stdout).toContain('turn-end gate');
});

it.concurrent('runs each repository gate once with only its own paths', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'repository B');
  const first = touch(join(root, 'a.ts'));
  const second = touch(join(other, 'b.ts'));
  const third = join(root, 'gone.ts');
  const patch = [
    `*** Update File: ${first}`,
    `*** Update File: ${second}`,
    `*** Delete File: ${third}`,
  ].join('\n');
  context.expect(hook(root, event(root, patch))).toMatchObject({
    status: 0,
    stdout: '',
    stderr: '',
  });
  context.expect(gated(root)).toEqual([first]);
  context.expect(gated(other)).toEqual([second]);
  context.expect(readFileSync(join(root, 'gate-calls'), 'utf8')).toBe('run\n');
  context.expect(readFileSync(join(other, 'gate-calls'), 'utf8')).toBe('run\n');
});

it.concurrent.for(['file', 'directory'])(
  'attributes a %s symlink to the repository holding its target',
  (kind, context) => {
    const { directory, root } = fixture(context.onTestFinished);
    const other = repository(directory, 'repository B');
    const target = touch(join(other, 'target.ts'));
    symlinkSync(kind === 'file' ? target : other, join(root, 'link'));
    const path = kind === 'file' ? 'link' : 'link/target.ts';
    context
      .expect(hook(root, event(root, `*** Update File: ${path}\n`)))
      .toMatchObject({
        status: 0,
        stdout: '',
        stderr: '',
      });
    context.expect(gated(other)).toEqual([target]);
    context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  },
);

it.concurrent('does not attribute the repository parent to the repository', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const result = hook(root, event(root, '*** Update File: ..\n'));
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringContaining(directory),
  });
});

it.concurrent('runs a full fallback in cwd without arguments when no headers exist', (context) => {
  const { root } = fixture(context.onTestFinished);
  const cwd = join(root, 'subdirectory');
  mkdirSync(cwd);
  const result = hook(root, event(cwd, '*** Begin Patch\n*** End Patch\n'));
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringMatching(/fallback/i),
  });
  context.expect(result.stdout).toContain(root);
  context.expect(readFileSync(join(root, 'gate-count'), 'utf8')).toBe('0\n');
  context.expect(readFileSync(join(root, 'gate-calls'), 'utf8')).toBe('run\n');
});

it.concurrent('names paths outside Git and repositories without a gate in one warning', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'without gate');
  rmSync(join(other, 'scripts/agent-verify'));
  const outside = touch(join(directory, 'outside.ts'));
  const added = touch(join(other, 'new.ts'));
  const patch = [`*** Update File: ${outside}`, `*** Add File: ${added}`].join(
    '\n',
  );
  const result = hook(root, event(root, patch));
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringContaining(outside),
  });
  context.expect(result.stdout).toContain(other);
  context.expect(result.stdout).toContain('outside any Git repository');
  context.expect(result.stdout).toContain('no scripts/agent-verify');
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it.concurrent('hands a failing gate back to Codex with its repository and output', (context) => {
  const { root } = fixture(context.onTestFinished);
  touch(join(root, 'app/page.tsx'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(root, event(root, '*** Update File: app/page.tsx\n'));
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(root);
  context.expect(result.stderr).toContain('exited 1');
  context.expect(result.stderr).toContain('FAIL [lint] planted failure\n');
});

it.concurrent('includes skip and fallback notices on stderr when a gate fails', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const outside = touch(join(directory, 'outside.ts'));
  const edited = touch(join(root, 'edited.ts'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(
    root,
    event(root, `*** Update File: ${edited}\n*** Update File: ${outside}\n`),
  );
  context.expect(result.status).toBe(2);
  context.expect(result.stderr).toContain(`Skipped ${outside}`);
  context.expect(result.stderr).toContain('outside any Git repository');
  const fallback = hook(root, event(root, '*** Begin Patch\n*** End Patch\n'));
  context.expect(fallback.status).toBe(2);
  context.expect(fallback.stderr).toMatch(/fallback/i);
  context.expect(fallback.stderr).toContain(root);
});

it.concurrent.for([
  ['not json', 'JSON'],
  ['null', 'object'],
  ['[]', 'object'],
  ['{"cwd": 1}', 'hook_event_name'],
  [
    '{"hook_event_name":"PostToolUse","tool_name":"apply_patch","cwd":"/repo","tool_input":{}}',
    'tool_input.command',
  ],
] as const)('rejects malformed input %s', ([input, field], context) => {
  const { root } = fixture(context.onTestFinished);
  const result = hook(root, input);
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(field);
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it.concurrent.for([
  ['hook_event_name', 'PreToolUse'],
  ['tool_name', 'Write'],
  ['cwd', 'relative/path'],
  ['cwd', 42],
  ['tool_input', { command: 42 }],
] as const)('validates %s before running a gate', ([field, value], context) => {
  const { root } = fixture(context.onTestFinished);
  const input = JSON.parse(event(root, '*** Add File: new.ts\n'));
  input[field] = value;
  const result = hook(root, JSON.stringify(input));
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(field);
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it.concurrent('reports a gate that cannot start with its repository and reason', (context) => {
  const { root } = fixture(context.onTestFinished);
  touch(join(root, 'new.ts'));
  chmodSync(join(root, 'scripts/agent-verify'), 0o644);
  const result = hook(root, event(root, '*** Update File: new.ts\n'));
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(root);
  context.expect(result.stderr).toContain('could not start');
  context.expect(result.stderr).toContain('EACCES');
});

it.concurrent('reports a gate killed by a signal even when it printed output', (context) => {
  const { root } = fixture(context.onTestFinished);
  touch(join(root, 'new.ts'));
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\necho before-signal\nkill -TERM "$$"\n',
  );
  const result = hook(root, event(root, '*** Update File: new.ts\n'));
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(root);
  context.expect(result.stderr).toContain('SIGTERM');
  context.expect(result.stderr).toContain('before-signal');
});

it.concurrent('runs the configured command from a repository subdirectory', (context) => {
  const { root } = fixture(context.onTestFinished);
  const config = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../.codex/hooks.json'), 'utf8'),
  );
  const command = config.hooks.PostToolUse[0].hooks[0].command;
  const cwd = join(root, 'subdirectory');
  mkdirSync(cwd);
  touch(join(cwd, 'new.ts'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = spawnSync('sh', ['-c', command], {
    cwd,
    input: event(cwd, '*** Add File: new.ts\n'),
    encoding: 'utf8',
    timeout: 10_000,
    killSignal: 'SIGKILL',
  });
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain('FAIL [lint] planted failure');
});

it.concurrent('kills a gate ignoring SIGINT within the budget plus grace', async (context) => {
  const { root } = fixture(context.onTestFinished);
  touch(join(root, 'new.ts'));
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\ntrap "" INT\necho before-timeout\nexec sleep 4\n',
  );
  const started = Date.now();
  const result = await handle(
    event(root, '*** Update File: new.ts\n'),
    started + 600,
  );
  context.expect(Date.now() - started).toBeLessThan(2_300);
  context.expect(result).toMatchObject({ exitCode: 2, stdout: '' });
  context.expect(result.stderr).toContain(root);
  context.expect(result.stderr).toContain('timed out');
  context.expect(result.stderr).toContain('before-timeout');
}, 10_000);

it.concurrent('lets a gate clean up on SIGINT when its deadline expires', async (context) => {
  const { root } = fixture(context.onTestFinished);
  touch(join(root, 'new.ts'));
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\ntrap ": > cleaned; exit 0" INT\nsleep 4\n',
  );
  const result = await handle(
    event(root, '*** Update File: new.ts\n'),
    Date.now() + 600,
  );
  context.expect(existsSync(join(root, 'cleaned'))).toBe(true);
  context.expect(result).toMatchObject({ exitCode: 2, stdout: '' });
  context.expect(result.stderr).toContain('timed out');
}, 10_000);

it.concurrent('shares one deadline between repositories and runs gates sequentially', async (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'repository B');
  touch(join(root, 'a.ts'));
  touch(join(other, 'b.ts'));
  writeFileSync(
    join(root, 'scripts/agent-verify'),
    '#!/bin/sh\nsleep 0.8\n: > finished\n',
  );
  writeFileSync(
    join(other, 'scripts/agent-verify'),
    '#!/bin/sh\ntest -f "../repository A/finished" || { echo overlap; exit 1; }\nexec sleep 1.4\n',
  );
  const result = await handle(
    event(root, `*** Add File: a.ts\n*** Add File: ${other}/b.ts\n`),
    Date.now() + 1_800,
  );
  context.expect(result).toMatchObject({ exitCode: 2, stdout: '' });
  context.expect(result.stderr).toContain(other);
  context.expect(result.stderr).toContain('timed out');
  context.expect(result.stderr).not.toContain('overlap');
  context.expect(result.stderr).not.toContain(root);
}, 10_000);

it.concurrent.for(['header', 'cwd'])(
  'resolves symlinks before parent traversal in the %s',
  (part, context) => {
    const { directory, root } = fixture(context.onTestFinished);
    const other = repository(directory, 'repository B');
    const nested = join(other, 'nested');
    mkdirSync(nested);
    const target = touch(join(other, 'target.ts'));
    const link = join(root, 'link');
    symlinkSync(nested, link);
    const cwd = part === 'cwd' ? link : root;
    const path = part === 'cwd' ? '../target.ts' : 'link/../target.ts';
    context
      .expect(hook(root, event(cwd, `*** Update File: ${path}\n`)))
      .toMatchObject({
        status: 0,
        stdout: '',
        stderr: '',
      });
    context.expect(gated(other)).toEqual([target]);
    context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  },
);

it.concurrent('attributes deleted paths through a dangling symlink to its target repository', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'repository B');
  symlinkSync(join(other, 'removed'), join(root, 'link'));
  const result = hook(
    root,
    event(root, '*** Delete File: link/deep/gone.ts\n'),
  );
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringContaining(`Skipped ${other}`),
  });
  context.expect(result.stdout).toContain('turn-end gate');
  context.expect(existsSync(join(other, 'gate-calls'))).toBe(false);
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
});

it.concurrent('leaves a move source repository to the turn-end gate', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'repository B');
  const source = touch(join(root, 'source.ts'));
  const destination = touch(join(other, 'destination.ts'));
  const result = hook(
    root,
    event(root, `*** Update File: ${source}\n*** Move to: ${destination}\n`),
  );
  context.expect(result).toMatchObject({ status: 0, stderr: '' });
  context.expect(existsSync(join(root, 'gate-calls'))).toBe(false);
  context.expect(gated(other)).toEqual([destination]);
  context.expect(JSON.parse(result.stdout)).toEqual({
    systemMessage: context.expect.stringContaining(`Skipped ${root}`),
  });
  context.expect(result.stdout).toContain('turn-end gate');
});

it.concurrent('keeps verifying later repositories after a gate fails', (context) => {
  const { directory, root } = fixture(context.onTestFinished);
  const other = repository(directory, 'repository B');
  touch(join(root, 'first.ts'));
  touch(join(other, 'last.ts'));
  writeFileSync(join(root, 'gate-fails'), '');
  const result = hook(
    root,
    event(
      root,
      `*** Update File: first.ts\n*** Update File: ${other}/last.ts\n`,
    ),
  );
  context.expect(result).toMatchObject({ status: 2, stdout: '' });
  context.expect(result.stderr).toContain(root);
  context.expect(result.stderr).toContain('FAIL [lint] planted failure');
  context.expect(gated(other)).toEqual([join(other, 'last.ts')]);
});
