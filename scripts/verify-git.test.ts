import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { it } from 'vitest';

const bun = execFileSync('bun', ['-p', 'process.execPath'], {
  encoding: 'utf8',
  timeout: 10_000,
}).trim();
const git = execFileSync('sh', ['-c', 'command -v git'], {
  encoding: 'utf8',
  timeout: 10_000,
}).trim();

it.concurrent.for([
  'rev-parse --local-env-vars',
  'rev-parse --git-path agent-verify.lock',
  'missing',
])(
  'reports the actual Git failure: %s',
  (command, { expect, onTestFinished }) => {
    const root = mkdtempSync(join(tmpdir(), 'verify git '));
    onTestFinished(() => rmSync(root, { recursive: true, force: true }));
    execFileSync('git', ['init', '--quiet'], { cwd: root, timeout: 10_000 });
    if (command !== 'missing')
      writeFileSync(
        join(root, 'git'),
        '#!/bin/sh\nif [ "$*" = "$FAIL_GIT_ARGS" ]; then echo "fatal: planted git failure" >&2; exit 128; fi\nexec "$REAL_GIT" "$@"\n',
        { mode: 0o755 },
      );
    const result = spawnSync(
      bun,
      [
        '-e',
        'const {verify} = await import(process.argv[1]); console.log(JSON.stringify(await verify(process.argv[2], [], Date.now() + 1000, new Set())));',
        resolve(import.meta.dirname, 'verify.ts'),
        root,
      ],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 5_000,
        env: {
          ...process.env,
          PATH: root,
          REAL_GIT: git,
          FAIL_GIT_ARGS: command,
          GIT_DIR: join(root, '.git'),
        },
      },
    );
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.exitCode).toBe(1);
    expect(report.stderr).toContain(
      `FAIL [git] git ${command === 'missing' ? 'rev-parse --local-env-vars' : command}`,
    );
    expect(report.stderr).toMatch(
      command === 'missing' ? /ENOENT|not found/ : /fatal: planted git failure/,
    );
    expect(report.stderr).not.toContain('is not a Git checkout');
  },
);
