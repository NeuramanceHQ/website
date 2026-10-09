# Measuring agent outcomes on this repo

The gate's limits (complexity, nesting, length, import layers) are proxies. They are cheap and run on every edit, but they cannot say whether an agent actually succeeds at a change, how much it had to read, or what it broke. This plan builds the ground truth: a small set of realistic tasks that Claude Code and Codex perform in throwaway copies of this repo, graded by hidden checks.

Run it only when a decision is pending: changing a ceiling, a refactor, the gate itself, or the stack. It costs real agent time and is nondeterministic, so it is never a gate.

## What it measures

A run **succeeds** only when all of these hold, checked by the harness, never taken from the agent's own report:

1. The task's hidden acceptance checks pass.
2. `scripts/agent-verify` passes.
3. The existing e2e suite passes, so nothing regressed.
4. The run finished inside its time, turn, and budget limits.

For every run, also record what the proxies stand in for:

| Metric                                                               | Source                                                                                                                                        |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Files read                                                           | Claude: `Read`, `Grep`, and `Glob` tool calls in `--output-format stream-json`. Codex: `item.completed` events for shell commands in `--json` |
| Files and lines changed, and those outside the task's expected files | `git diff --numstat <base>` in the run's clone                                                                                                |
| Input tokens (including cached) and output tokens                    | Claude: `usage` in the final `result` event. Codex: `usage` in each `turn.completed` event                                                    |
| Cost in dollars                                                      | Claude: `total_cost_usd`. Codex reports tokens only; price them from the provider's rates                                                     |
| Turns and wall time                                                  | Claude: `num_turns`, `duration_ms`. Codex: count turns; time the process                                                                      |
| Gate failures the agent hit                                          | Hook feedback in the transcript                                                                                                               |

Files read and input tokens measure the context a change needed. Files changed outside the expected set measure tangling.

## Questions it answers

Each experiment compares **conditions**: git refs of this repo that differ in one thing, with tasks, models, and CLI versions held fixed.

| Question                             | Conditions                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are the ceilings right?              | Current values against a looser and a tighter branch                                                                                                                                                                                                                         |
| Does the gate pay for itself?        | Hooks on against hooks off. For Claude, try `--settings '{"disableAllHooks": true}'` and confirm in the pilot that the global agent-gate hook really stays silent; avoid `--bare`, which also skips AGENTS.md and CLAUDE.md discovery. For Codex, run from an untrusted path |
| Did a refactor make changes cheaper? | The commit before against the commit after                                                                                                                                                                                                                                   |
| Next.js or another stack?            | A second repository that implements the same site, with the same tasks; worth it only once a migration is seriously on the table                                                                                                                                             |

## Tasks

Six tasks that mirror how this repo actually changes. Each prompt is written the way the owner would ask, says nothing about evaluation, and is graded only on behavior a visitor or crawler can observe, so any reasonable implementation passes.

| Task                  | Prompt, in short                                                                           | Hidden checks                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `faq-section`         | Add an FAQ section with four questions, linked from the header and footer                  | Section with its own `h2`; the header link lands below the sticky header; the footer link works; every new control shows the focus ring; no horizontal scroll at 320 px                                                   |
| `privacy-page`        | Add a `/privacy` page                                                                      | 200 status; title from the template; its own canonical and `og:url`; listed in `sitemap.xml`; linked from the footer                                                                                                      |
| `safari-interruption` | Users report that on iPhone, after switching apps, the speaker cannot bring the music back | The original regression test for the `interrupted` state. Setup: revert that fix and delete its test in the clone                                                                                                         |
| `vimeo-embed`         | Embed the product demo from Vimeo in the For agents section                                | A `player.vimeo.com` iframe is present and loads without a Content-Security-Policy violation. The existing security-header test must still pass, so the agent has to change the Caddyfile's policy and that test together |
| `announcement-config` | Make the announcement text and link editable from `lib/site.ts`                            | Rendered text and link match new values set in `lib/site.ts`; nothing else changes visibly                                                                                                                                |
| `accent-color`        | Change the accent color from `#e4f222` to `#c6ff3d` everywhere                             | Computed color of the accent elements; the old value appears nowhere in the source                                                                                                                                        |

Give each task an expected file set (for example `app/page.tsx` and a new component for `faq-section`) so changes outside it count as tangling. Keep one task out of every experiment's analysis as a held-out check against tuning the repo to the task set.

## Harness

Build it in a separate private repository, for example `~/code/nm/site-evals`. This repo is public, and an agent reads everything in its workspace, so hidden checks and reference solutions must never live here.

```text
site-evals/
  tasks/<task>/task.json        base commit, setup, expected files, limits
  tasks/<task>/prompt.md
  tasks/<task>/hidden/*.spec.ts Playwright checks copied in only for grading
  tasks/<task>/oracle.patch     a reference solution
  run.ts                        prepares a clone, runs one agent, calls grade.ts
  grade.ts                      grades a finished clone and appends one result line
  report.ts                     summarizes results/*.jsonl per condition
  results/<date>.jsonl
```

### One run

1. **Prepare an isolated clone** at a fixed slot path, for example `/tmp/site-eval/slot-1`: `git clone --shared` this repo, check out the condition, then `git remote remove origin`. Pushing `main` deploys production, so a clone must never have a push target, and runs never touch the main checkout.
2. **Apply the task setup and commit it**, so the agent starts from a clean tree. That means planting the bug for `safari-interruption`, deleting tests that would reveal it, and deleting `docs/agent-evals.md` so the plan does not prime the agent. Then run `bun install --frozen-lockfile`, which completes from the warm cache.
3. **Run the agent** with a hard timeout, from inside the clone:
   - Claude Code: `timeout 30m claude -p "$(cat prompt.md)" --model <pinned id> --output-format stream-json --verbose --permission-mode bypassPermissions --permission-prompts none --max-turns 200 --max-budget-usd <cap> --no-session-persistence`. Commands that hit an `ask` rule are denied rather than hanging.
   - Codex: `timeout 30m codex exec --json --ephemeral -C <clone> -s workspace-write -m <pinned id> "$(cat prompt.md)"`.
4. **Grade.** Copy the hidden specs into `e2e/hidden/`, run `scripts/agent-verify`, then run `bun run test:e2e -- --reporter=json` for per-test results of both the hidden and the existing specs. Collect the diff and the transcript metrics, and append one JSON line: run id, task, host, model, CLI versions, condition ref, success and each of its four parts, the metrics, and `uptime`.

### Repo-specific pitfalls

- **Hooks are part of the system under test.** Claude Code's global hook (`~/.claude/agent-gate.sh`) runs the clone's own `scripts/agent-verify`, exactly as in real work. Codex records hook trust per absolute path (`hooks.state."<path>/.codex/hooks.json:post_tool_use:0:0"` in `~/.codex/config.toml`), so a clone at a new path silently runs no project hook. Reuse fixed slot paths, trust each one once in Codex's `/hooks`, and record which hooks ran.
- **Slots can grade in parallel.** Each `bun run test:e2e` serves `out/` on a free port, so slots, and an agent's own e2e runs inside them, never share one; set `SITE_PORT` only to pin a port.
- **The machine is shared.** Other sessions have pushed i9's load average above 90, which multiplies wall times. Record `uptime` with each run, and prefer token and turn counts to timings.

### Validate the harness before trusting it

- **Null run:** apply no change. Every hidden check must fail on every task, or that check does not measure the change.
- **Oracle run:** apply `oracle.patch`. Every check must pass, or the task or its checks are broken.
- **Second solution:** a differently structured correct patch must also pass, or the checks over-specify the implementation.
- **Regrade:** grading the same clone twice must give the same result.

## Running an experiment

- **Pin everything.** Record the base commit, task-set version, exact model IDs, and CLI versions with every run. At the time of writing these are Claude Code 2.1.295 and Codex CLI 0.161.0.
- **Repeat runs.** Agents are stochastic, so run each task, host, and condition at least five times, and never compare single runs.
- **Interleave.** Randomize the run order across conditions, so model updates and machine load hit every condition equally.
- **Pilot first.** One task, one host, two runs gives real cost and time figures before you commit to more. For scale, a one-word headless Claude Code call cost $0.18 here, almost all of it prompt-cache setup, so real tasks cost several times that. Estimate the full experiment from the pilot rather than guessing.

### Reading the results

- Report each condition's success rate with a Wilson 95% interval, broken down by task.
- Compare conditions on the same tasks and repetitions, task by task.
- Be honest about power. Thirty runs per condition can only reveal large success differences, around 30 points. Telling 80% from 65% takes about 135 runs per condition (two-sided α = 0.05, power 0.8). Token and turn medians separate with far fewer runs, so treat them as the main signal for context cost, and use success to rule out regressions. Compare medians with a bootstrap interval.
- **Write the decision rule down before running**, for example: "Adopt the change only if no task's success rate drops and median input tokens fall by at least 15%, with a 95% bootstrap interval that excludes zero."
- Rotate tasks over time and keep the held-out task, so the repo is not tuned to the benchmark.

## Build order

Each step ends when its check passes.

1. **One task end to end.** Start with `safari-interruption`: it is small and graded by an existing test. Prepare a clone, run Claude Code, grade, and write one result line. Done when the null run fails and the oracle run passes.
2. **All six tasks,** each with an oracle and a second solution, passing the validation above.
3. **Codex as a second host,** with the slot paths trusted.
4. **`report.ts`:** one table per condition with success intervals and metric medians.
5. **Pilot on the current repo:** both hosts, two runs per task. Then decide whether the question at hand justifies five or more runs per cell.

## What not to do

- Do not run evaluations in the main checkout, or in a clone that still has a remote.
- Do not put hidden checks or reference solutions in this repo.
- Do not use `claude --bare` for realistic runs.
- Do not count the agent's own test runs, or its claim of success, as success.
- Do not make this a gate.
