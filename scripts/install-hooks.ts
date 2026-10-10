import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';

const HOOKS_PATH = '.githooks';

function git(...args: string[]): { status: number | null; output: string } {
  const result = spawnSync('git', args, { encoding: 'utf8', timeout: 10_000 });
  if (result.error !== undefined) {
    throw new Error(`git ${args.join(' ')}: ${result.error.message}`);
  }
  return { status: result.status, output: result.stdout.trim() };
}

export function conflict(
  configured: string,
  existingHooks: readonly string[],
): string | undefined {
  if (configured !== '' && resolve(configured) === resolve(HOOKS_PATH)) {
    return undefined;
  }
  if (configured !== '') {
    return `core.hooksPath is already ${configured}; call ${HOOKS_PATH}/pre-push from those hooks to verify before each push`;
  }
  if (existingHooks.length > 0) {
    return `setting core.hooksPath would stop ${existingHooks.join(', ')} from running; call ${HOOKS_PATH}/pre-push from them to verify before each push`;
  }
  return undefined;
}

function install(): string | undefined {
  const top = git('rev-parse', '--show-toplevel');
  if (top.status !== 0 || top.output !== realpathSync(process.cwd())) {
    return 'not the root of a Git checkout, so the pre-push hook is not installed';
  }
  const configured = git('config', '--get', 'core.hooksPath').output;
  if (configured !== '' && resolve(configured) === resolve(HOOKS_PATH)) {
    return undefined;
  }
  const hooks = join(git('rev-parse', '--git-common-dir').output, 'hooks');
  const existing = existsSync(hooks)
    ? readdirSync(hooks, { withFileTypes: true })
        .filter(
          (entry) =>
            (entry.isFile() || entry.isSymbolicLink()) &&
            !entry.name.endsWith('.sample'),
        )
        .map((entry) => join(hooks, entry.name))
    : [];
  const blocked = conflict(configured, existing);
  if (blocked !== undefined) {
    return blocked;
  }
  return git('config', 'core.hooksPath', HOOKS_PATH).status === 0
    ? undefined
    : 'git config core.hooksPath failed';
}

if (import.meta.main) {
  try {
    const problem = install();
    if (problem !== undefined) {
      process.stderr.write(`install-hooks: ${problem}\n`);
    }
  } catch (error) {
    process.stderr.write(
      `install-hooks: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }
}
