<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Neuramance website

Static marketing site: no backend, database, or auth. `next build` exports it to `out/` (`output: 'export'`), which Caddy serves from i9 behind Cloudflare Tunnel at `neuramance.com`; `www` 301s there.

Stack: Next.js 16 App Router with Turbopack, React 19, TypeScript 7, StyleX, Bun, Node 24 LTS, Vitest with Testing Library, Playwright, Oxlint, Oxfmt, Caddy. Add Base UI when a component needs more than a native button or link.

## Commands

Use Bun only, and run scripts with `bun run` (`bun test` starts Bun's runner, not Vitest).

- `bun run dev`: development server
- `bun run build`: static export to `out/`
- `bun run start`: serves `out/` on port 3100, or `SITE_PORT`, with the production `Caddyfile` (needs `caddy`)
- `bun run lint`: Oxlint, type-aware, warnings fail
- `bun run lint:shell`: ShellCheck on `scripts/deploy` and `scripts/lint-shell`; it needs exactly ShellCheck 0.11.0 and fails on any other version, so update the pin in `scripts/lint-shell` deliberately
- `bun run format`, `bun run format:check`: Oxfmt
- `bun run typecheck`: route types, then `tsc`
- `bun run test`: Vitest unit tests (`*.test.ts`, `*.test.tsx`)
- `bun run test:e2e`: builds, then runs Playwright against `out/` served by `bun run start` on a free port (or `SITE_PORT`), so runs in parallel checkouts never collide
- `scripts/agent-verify`: the gate. With no arguments it runs a suppression scan, `typecheck`, `lint`, `lint:shell`, `format:check`, `test`, and `build` in parallel, except that `lint` waits for `typecheck` and `build` waits for `lint` (`typecheck` regenerates the route types that `lint` reads and `build` rewrites), and reports each failure with its output; given edited paths it runs only the fast checks (suppression scan, `typecheck`, `lint`, `lint:shell`, `format:check`). Runs in one checkout wait for each other.

Done means `scripts/agent-verify` and `bun run test:e2e` pass. The `.githooks/pre-push` hook runs the gate with `test:e2e` (which builds, and also waits for `lint`) in place of `build` before every push, and refuses a push that is not the checked-out `HEAD` of a clean tree; `bun install` points `core.hooksPath` at `.githooks`. The global `~/.claude/agent-gate.sh` hook runs `scripts/agent-verify` after Claude Code edits and when Claude Code or Codex stops; the project `.codex/hooks.json` runs `scripts/codex-hook.ts` after each Codex `apply_patch`, which runs the fast checks of every repository the patch added, updated, deleted, or renamed files in, and warns about anything it could not verify, once the hook is trusted in Codex's `/hooks`.

## Verification

- `.oxlintrc.json` holds the ceilings (cyclomatic complexity 10, nesting depth 3, 500 lines per file, 100 lines per function, all lines counted) and the local rules in `scripts/lint-rules.mts`: `no-comments` (no comments or suppression directives; a shebang is allowed) and `no-tautological-assertion` (no `expect(x).toBe(x)` from Vitest or Playwright). Never raise a ceiling, disable a rule, or add an override to pass; split along a real seam instead.
- Imports flow one way: `app/` may import `components/` and `lib/`, `components/` may import `lib/`, and `lib/` imports only itself and packages; site code never imports `e2e/` or `scripts/`, and `e2e/` never imports site code. Cross-directory imports use `@/`, and import cycles are errors (`import/no-cycle`, `import/no-relative-parent-imports`, and per-directory `no-restricted-imports` in `.oxlintrc.json`).
- Oxlint and Oxfmt run with `--disable-nested-config` and ignore `.eslintignore` and `.prettierignore` (`--no-ignore`, `--ignore-path=.gitignore`), and the gate rejects any `oxlint-disable` or `eslint-disable` directive, so no nested config, ignore file, or comment can switch a rule off or hide a file.
- Vitest forbids `.only` and Playwright forbids `test.only`. Every e2e spec aborts requests that leave the local server (`blockExternal` in `e2e/helpers.ts`), so tests never reach YouTube or `media.neuramance.com`.

## Layout

- `app/layout.tsx`: metadata, fonts (`next/font/local` from `lib/fonts`), JSON-LD, body styles, and the chrome every page shares: announcement bar, sticky header, footer, and `MetalLight`
- `app/globals.css`: reset inside `@layer resets` (including the keyboard focus ring and scroll padding for the sticky header and ticker), then the `@stylex;` directive where StyleX emits its CSS
- Pages: `app/page.tsx` (`/`), `app/waitlist/page.tsx`, `app/error/page.tsx`; `app/error.tsx` shows the same `ErrorNotice` as the error boundary; `app/not-found.tsx` is the 404 page. Only `/` is indexed; the others set `noindex`
- `components/`: `hero` (headline, agent prompt, showcase, and the facts ticker), `showcase` (the decorative quote and order illustration), `error-notice`, `announcement` (dismissible top bar), `nav` (sticky header), `footer`, `marquee` (endless, pausable ticker), `video-background` (YouTube background fixed behind every page), `copy-button`, `sound-button` (one shared `Audio` element for the audio quote), `music` (header toggle for the background track: Web Audio decodes the clip once, mixes its first 4 seconds into its last 4 with equal-power curves, and loops from 4 seconds to the end; autoplays where the browser allows it and otherwise on the next interaction, remembers a mute), `metal-light` (mounted in the layout: moves the reflection on `[data-metal]` buttons with the pointer, glints each once when it comes into view, tilts it toward a press), `styles.ts` (shared StyleX styles: page frame, buttons, labels, lead text, panels)
- `lib/tokens.stylex.ts`: design constants (`defineConsts`) for colors and fonts
- `lib/logotype.ts`: the NEURAMANCE wordmark (Chakra Petch Bold outlines with ®) shared by the nav and footer; `lib/site.ts`: the access email, agent prompt, video ID, music track, and the Open Graph fields every page spreads into its own `openGraph` (each page sets its own `url`); the licensed track is served from i9's `/srv/media` at `media.neuramance.com` with a content-hashed name, never committed to this public repo
- `public/`: files served as they are: `llms.txt` (the agent guide), `robots.txt` and `sitemap.xml` (list only `/`), `logo.svg` (the square logo the JSON-LD names), the favicons, `hand.svg`, the Open Graph image, and the audio quote

## Hosting

- `Caddyfile`: the site's serving rules (clean URLs, the 404 page, security headers including the Content-Security-Policy, caching, trailing-slash and `www` redirects). A new third-party script, image, frame, or fetch origin must be added to the policy; the e2e suite serves through this file, so a blocked resource fails its test. Production imports it as `/etc/caddy/neuramance.caddy`; after changing it, run `sudo install -m 644 Caddyfile /etc/caddy/neuramance.caddy && sudo systemctl reload caddy`. `Caddyfile.local` wraps it for `bun run start`.
- Deploys: pushing to `main` is the deploy. Ten seconds after each run finishes, the `neuramance-deploy` systemd user timer runs `scripts/deploy` from its own clone at `/srv/neuramance/repo`. It asks the GitHub API for `main`'s sha and stops there unless that commit is new; otherwise it fetches the commit if needed, builds it in a fresh directory into `/srv/neuramance/releases/<sha>`, switches the `/srv/neuramance/current` symlink, keeps five releases, and reports a `deploy/i9` commit status on GitHub. A commit whose build failed is recorded in `/srv/neuramance/failed` and skipped; delete that file to retry it. A commit whose `Caddyfile` differs from the installed copy waits, with a pending status, until it is installed. Logs: `journalctl --user -u neuramance-deploy`, which records deploys and failures but not idle polls. Roll back by reverting on `main`.
- Cloudflare: when `CLOUDFLARE_API_TOKEN` is set, it is a scoped token for the owner's Cloudflare zones and tunnels; never print or commit it. Take the account ID from the API's `/zones`. A `PUT` to a ruleset phase entrypoint replaces every rule in that phase: read the entrypoint first and send back the full list.

## Styling

- Style with `stylex.create` and `{...stylex.props(...)}`; `app/globals.css` is the only CSS file.
- StyleX compiles through `babel.config.js` (Turbopack picks it up) and `postcss.config.mjs`; `vitest.config.mjs` reuses the Babel plugins.
- Spread `stylex.props` onto Base UI parts, once there are any, and target their state attributes with keys such as `':is([data-starting-style])'`.
- Write line heights in `rem`, not `calc()` ratios, which the CSS minifier rounds.
- Focus outlines are removed globally on purpose; keyboard focus shows a box-shadow ring instead, from `app/globals.css` or the button styles.
