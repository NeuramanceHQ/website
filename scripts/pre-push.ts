#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { main, PUSH_CHECKS } from './verify';

const ZERO_SHA = '0'.repeat(40);
const PUSH_BUDGET_MS = 600_000;

function git(...args: string[]): string | undefined {
  const result = spawnSync('git', args, { encoding: 'utf8', timeout: 10_000 });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function refusal(updates: string, head: string): string | undefined {
  for (const update of updates.split('\n')) {
    const [ref, sha] = update.split(' ');
    if (ref === undefined || sha === undefined || sha === ZERO_SHA) {
      continue;
    }
    if (git('rev-parse', '--verify', '--quiet', `${sha}^{commit}`) !== head) {
      return `${ref} is not the checked-out HEAD; check it out and push again so it can be verified`;
    }
  }
  return git('status', '--porcelain') === ''
    ? undefined
    : 'commit or stash local changes first; pushes are verified from a clean checkout of HEAD';
}

if (import.meta.main) {
  const head = git('rev-parse', 'HEAD');
  const problem =
    head === undefined
      ? 'cannot read HEAD'
      : refusal(readFileSync(0, 'utf8'), head);
  if (problem === undefined) {
    await main(PUSH_CHECKS, PUSH_BUDGET_MS);
  } else {
    process.stderr.write(`pre-push: ${problem}\n`);
    process.exitCode = 1;
  }
}
