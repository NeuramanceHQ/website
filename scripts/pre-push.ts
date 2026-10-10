#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { gitOutput, main, PUSH_CHECKS } from './verify';

const ZERO_SHA = '0'.repeat(40);
const PUSH_BUDGET_MS = 600_000;

function refusal(updates: string, head: string): string | undefined {
  for (const update of updates.split('\n')) {
    const [ref, sha] = update.split(' ');
    if (ref === undefined || sha === undefined || sha === ZERO_SHA) {
      continue;
    }
    if (
      gitOutput(['rev-parse', '--verify', '--quiet', `${sha}^{commit}`]) !==
      head
    ) {
      return `${ref} is not the checked-out HEAD; check it out and push again so it can be verified`;
    }
  }
  return gitOutput(['status', '--porcelain']) === ''
    ? undefined
    : 'commit or stash local changes first; pushes are verified from a clean checkout of HEAD';
}

if (import.meta.main) {
  try {
    const problem = refusal(
      readFileSync(0, 'utf8'),
      gitOutput(['rev-parse', 'HEAD']),
    );
    if (problem !== undefined) throw new Error(problem);
    await main(PUSH_CHECKS, PUSH_BUDGET_MS);
  } catch (error) {
    process.stderr.write(
      `pre-push: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
