import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

const previous = '1'.repeat(40);
let directory = '';
let site = '';
let repo = '';
let sha = '';
let env: NodeJS.ProcessEnv;

const gh = `#!/bin/bash
set -euo pipefail
printf '%s\\n' "$*" >> "$NEURAMANCE_SITE/gh.calls"
case "$*" in
    'api repos/NeuramanceHQ/site/git/ref/heads/main --jq .object.sha')
        printf '%s\\n' "$DEPLOY_TEST_SHA"
        ;;
    "api --silent repos/NeuramanceHQ/site/statuses/$DEPLOY_TEST_SHA "*)
        [ "$#" -eq 11 ]
        [ "$7" = context=deploy/i9 ]
        [ "\${11}" = target_url=https://neuramance.com ]
        printf '%s\\t%s\\n' "\${5#state=}" "\${9#description=}" >> "$NEURAMANCE_SITE/statuses"
        ;;
    *) exit 64 ;;
esac
`;

const bun = `#!/bin/bash
set -euo pipefail
printf '%s\\n' "$*" >> "$NEURAMANCE_SITE/bun.calls"
case "$*" in
    'install --frozen-lockfile')
        read -r attempt < "$NEURAMANCE_SITE/attempts"
        attempt=$((attempt + 1))
        printf '%s\\n' "$attempt" > "$NEURAMANCE_SITE/attempts"
        if [ "$attempt" -le "$DEPLOY_TEST_INSTALL_FAILURES" ]; then
            echo 'registry temporarily unavailable' >&2
            exit 1
        fi
        ;;
    'run build')
        if [ "$DEPLOY_TEST_BUILD_STATUS" -ne 0 ]; then
            echo 'compiler failed' >&2
            exit "$DEPLOY_TEST_BUILD_STATUS"
        fi
        timeout 1 mkdir out
        printf '%s\\n' '<h1>deployed</h1>' > out/index.html
        ;;
    *) exit 64 ;;
esac
`;

function run(...args: [string, ...string[]]) {
  const result = spawnSync('timeout', ['--kill-after=1s', '5s', ...args], {
    cwd: repo,
    env,
    encoding: 'utf8',
    timeout: 8_000,
    killSignal: 'SIGKILL',
  });
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function lines(name: string): string[] {
  const text = readFileSync(join(site, name), 'utf8').trimEnd();
  return text === '' ? [] : text.split('\n');
}

function release(name: string, modified: number): void {
  const path = join(site, 'releases', name);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, 'index.html'), 'previous release\n');
  utimesSync(path, modified, modified);
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'neuramance deploy '));
  site = join(directory, 'site');
  repo = join(site, 'repo');
  mkdirSync(join(repo, 'scripts'), { recursive: true });
  mkdirSync(join(directory, 'bin'));
  mkdirSync(join(directory, 'gh-config'));
  env = {
    NODE_ENV: 'test',
    PATH: `${join(directory, 'bin')}:${process.env.PATH}`,
    GH_CONFIG_DIR: join(directory, 'gh-config'),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Deploy test',
    GIT_AUTHOR_EMAIL: 'deploy@example.com',
    GIT_COMMITTER_NAME: 'Deploy test',
    GIT_COMMITTER_EMAIL: 'deploy@example.com',
    NEURAMANCE_SITE: site,
    NEURAMANCE_CADDYFILE: join(directory, 'installed Caddyfile'),
    NEURAMANCE_INSTALL_RETRY_DELAY: '0',
    DEPLOY_TEST_INSTALL_FAILURES: '0',
    DEPLOY_TEST_BUILD_STATUS: '0',
  };
  writeFileSync(join(directory, 'bin/gh'), gh, { mode: 0o755 });
  writeFileSync(join(directory, 'bin/bun'), bun, { mode: 0o755 });
  for (const name of ['gh.calls', 'bun.calls', 'statuses']) {
    writeFileSync(join(site, name), '');
  }
  writeFileSync(join(site, 'attempts'), '0\n');
  writeFileSync(join(repo, 'Caddyfile'), ':8080 {\n\trespond "fixture"\n}\n');
  copyFileSync(join(repo, 'Caddyfile'), env.NEURAMANCE_CADDYFILE!);
  writeFileSync(join(repo, 'package.json'), '{"private":true}\n');
  copyFileSync(
    resolve(import.meta.dirname, 'deploy'),
    join(repo, 'scripts/deploy'),
  );
  for (const args of [
    ['init', '--quiet', '--template='],
    ['add', 'Caddyfile', 'package.json', 'scripts/deploy'],
    ['-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'fixture'],
  ]) {
    const result = run('git', ...args);
    expect(result.status, result.stderr).toBe(0);
  }
  const head = run('git', 'rev-parse', 'HEAD');
  expect(head.status, head.stderr).toBe(0);
  sha = head.stdout.trim();
  env.DEPLOY_TEST_SHA = sha;
  release(previous, 1_000);
  symlinkSync(`releases/${previous}`, join(site, 'current'));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

it('leaves an already live main untouched', () => {
  release(sha, 2_000);
  unlinkSync(join(site, 'current'));
  symlinkSync(`releases/${sha}`, join(site, 'current'));
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: '',
    stderr: '',
  });
  expect(lines('gh.calls')).toEqual([
    'api repos/NeuramanceHQ/site/git/ref/heads/main --jq .object.sha',
  ]);
  expect(lines('statuses')).toEqual([]);
  expect(lines('bun.calls')).toEqual([]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${sha}`);
  expect(readdirSync(join(site, 'releases')).toSorted()).toEqual(
    [previous, sha].toSorted(),
  );
  expect(existsSync(join(site, 'failed'))).toBe(false);
  expect(existsSync(join(site, 'waiting'))).toBe(false);
});

it('skips main recorded as failed', () => {
  writeFileSync(join(site, 'failed'), `${sha}\n`);
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: '',
    stderr: '',
  });
  expect(lines('statuses')).toEqual([]);
  expect(lines('bun.calls')).toEqual([]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${previous}`);
  expect(readdirSync(join(site, 'releases'))).toEqual([previous]);
  expect(lines('failed')).toEqual([sha]);
  expect(existsSync(join(site, 'waiting'))).toBe(false);
});

it('reports a Caddyfile mismatch only once while waiting', () => {
  writeFileSync(
    env.NEURAMANCE_CADDYFILE!,
    'different installed configuration\n',
  );
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: '',
    stderr: `${sha}: Caddyfile differs from ${env.NEURAMANCE_CADDYFILE}; install it with sudo\n`,
  });
  expect(lines('waiting')).toEqual([sha]);
  expect(lines('statuses')).toEqual([
    'pending\tWaiting for the new Caddyfile to be installed with sudo',
  ]);
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: '',
    stderr: '',
  });
  expect(lines('statuses')).toEqual([
    'pending\tWaiting for the new Caddyfile to be installed with sudo',
  ]);
  expect(lines('waiting')).toEqual([sha]);
  expect(lines('bun.calls')).toEqual([]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${previous}`);
  expect(readdirSync(join(site, 'releases'))).toEqual([previous]);
  expect(existsSync(join(site, 'failed'))).toBe(false);
});

it('publishes a successful build using the GitHub stub', () => {
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: `${sha} is live\n`,
    stderr: '',
  });
  expect(lines('gh.calls')).toEqual([
    'api repos/NeuramanceHQ/site/git/ref/heads/main --jq .object.sha',
    `api --silent repos/NeuramanceHQ/site/statuses/${sha} -f state=pending -f context=deploy/i9 -f description=Building on i9 -f target_url=https://neuramance.com`,
    `api --silent repos/NeuramanceHQ/site/statuses/${sha} -f state=success -f context=deploy/i9 -f description=Live on neuramance.com -f target_url=https://neuramance.com`,
  ]);
  expect(lines('statuses')).toEqual([
    'pending\tBuilding on i9',
    'success\tLive on neuramance.com',
  ]);
  expect(lines('bun.calls')).toEqual([
    'install --frozen-lockfile',
    'run build',
  ]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${sha}`);
  expect(readFileSync(join(site, 'releases', sha, 'index.html'), 'utf8')).toBe(
    '<h1>deployed</h1>\n',
  );
  expect(readdirSync(join(site, 'releases')).toSorted()).toEqual(
    [previous, sha].toSorted(),
  );
  expect(existsSync(join(site, 'failed'))).toBe(false);
  expect(existsSync(join(site, 'waiting'))).toBe(false);
  expect(readdirSync(site).filter((name) => name.startsWith('build.'))).toEqual(
    [],
  );
  expect(readdirSync(env.GH_CONFIG_DIR!)).toEqual([]);
});

it('records a build failure without retrying or replacing current', () => {
  env.DEPLOY_TEST_BUILD_STATUS = '1';
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 1,
    stdout: '',
    stderr: `compiler failed\n${sha}: build failed\n`,
  });
  expect(lines('failed')).toEqual([sha]);
  expect(lines('statuses')).toEqual([
    'pending\tBuilding on i9',
    'failure\tbuild failed',
  ]);
  expect(lines('bun.calls')).toEqual([
    'install --frozen-lockfile',
    'run build',
  ]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${previous}`);
  expect(readdirSync(join(site, 'releases'))).toEqual([previous]);
  expect(readFileSync(join(site, 'current/index.html'), 'utf8')).toBe(
    'previous release\n',
  );
  expect(existsSync(join(site, 'waiting'))).toBe(false);
  expect(readdirSync(site).filter((name) => name.startsWith('build.'))).toEqual(
    [],
  );
});

it('keeps only the five newest releases', () => {
  const older = ['a', 'e', 'b', 'f', 'c', 'd'].map((name) => name.repeat(40));
  older.forEach((name, index) => release(name, 2_000 + index * 1_000));
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: `${sha} is live\n`,
    stderr: '',
  });
  expect(readdirSync(join(site, 'releases')).toSorted()).toEqual(
    [
      'b'.repeat(40),
      'c'.repeat(40),
      'd'.repeat(40),
      'f'.repeat(40),
      sha,
    ].toSorted(),
  );
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${sha}`);
  expect(readFileSync(join(site, 'current/index.html'), 'utf8')).toBe(
    '<h1>deployed</h1>\n',
  );
  expect(lines('statuses')).toEqual([
    'pending\tBuilding on i9',
    'success\tLive on neuramance.com',
  ]);
  expect(lines('bun.calls')).toEqual([
    'install --frozen-lockfile',
    'run build',
  ]);
});

it('retries a transient install failure and deploys', () => {
  env.DEPLOY_TEST_INSTALL_FAILURES = '1';
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 0,
    stdout: `${sha} is live\n`,
    stderr: 'registry temporarily unavailable\n',
  });
  expect(lines('statuses')).toEqual([
    'pending\tBuilding on i9',
    'success\tLive on neuramance.com',
  ]);
  expect(lines('bun.calls')).toEqual([
    'install --frozen-lockfile',
    'install --frozen-lockfile',
    'run build',
  ]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${sha}`);
  expect(readFileSync(join(site, 'current/index.html'), 'utf8')).toBe(
    '<h1>deployed</h1>\n',
  );
  expect(readdirSync(join(site, 'releases')).toSorted()).toEqual(
    [previous, sha].toSorted(),
  );
  expect(existsSync(join(site, 'failed'))).toBe(false);
  expect(existsSync(join(site, 'waiting'))).toBe(false);
});

it('records exhausted install attempts without building or replacing current', () => {
  env.DEPLOY_TEST_INSTALL_FAILURES = '99';
  expect(run('bash', 'scripts/deploy')).toEqual({
    status: 1,
    stdout: '',
    stderr: `${'registry temporarily unavailable\n'.repeat(3)}${sha}: build failed\n`,
  });
  expect(lines('failed')).toEqual([sha]);
  expect(lines('statuses')).toEqual([
    'pending\tBuilding on i9',
    'failure\tbuild failed',
  ]);
  expect(lines('bun.calls')).toEqual([
    'install --frozen-lockfile',
    'install --frozen-lockfile',
    'install --frozen-lockfile',
  ]);
  expect(readlinkSync(join(site, 'current'))).toBe(`releases/${previous}`);
  expect(readdirSync(join(site, 'releases'))).toEqual([previous]);
  expect(existsSync(join(site, 'waiting'))).toBe(false);
  expect(readdirSync(site).filter((name) => name.startsWith('build.'))).toEqual(
    [],
  );
});
