<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Neuramance website

Static marketing site: no backend, database, or auth. `next build` exports it to `out/` (`output: 'export'`), which Caddy serves from i9 behind Cloudflare Tunnel at `neuramance.com`; `www` 301s there.

Stack: Next.js 16 App Router with Turbopack, React 19, TypeScript 7, StyleX, Base UI, Bun, Node 24 LTS, Vitest with Testing Library, Playwright, Oxlint, Oxfmt, Caddy.

## Commands

Use Bun only, and run scripts with `bun run` (`bun test` starts Bun's runner, not Vitest).

- `bun run dev`: development server
- `bun run build`: static export to `out/`
- `bun run start`: serves `out/` on port 3100 with the production `Caddyfile` (needs `caddy`)
- `bun run lint`: Oxlint, type-aware, warnings fail
- `bun run format`, `bun run format:check`: Oxfmt
- `bun run typecheck`: route types, then `tsc`
- `bun run test`: Vitest component tests
- `bun run test:e2e`: Playwright against a fresh build served by `bun run start`

Done means `lint`, `format:check`, `typecheck`, `test`, `test:e2e`, and `build` all pass.

## Layout

- `app/layout.tsx`: metadata, fonts (`next/font/local` from `lib/fonts`), JSON-LD, body styles
- `app/globals.css`: reset inside `@layer resets`, then the `@stylex;` directive where StyleX emits its CSS
- `app/(main)/`: pages sharing the announcement bar, sticky header, and footer (`/`, `/waitlist`, `/error`); `error.tsx` renders the `/error` page as the error boundary
- `components/`: `announcement` (dismissible top bar), `nav` (sticky header), `footer`, `marquee` (endless, pausable ticker), `video-background` (YouTube background fixed behind every page), `copy-button`, `sound-button` (one shared `Audio` element for the audio quote), `music` (header toggle for the background track: Web Audio decodes the clip once, mixes its first 4 seconds into its last 4 with equal-power curves, and loops from 4 seconds to the end; autoplays where the browser allows it and otherwise on the next interaction, remembers a mute), `metal-light` (mounted in the layout: moves the reflection on `[data-metal]` buttons with the pointer, glints each once when it comes into view, tilts it toward a press), `styles.ts` (shared StyleX styles: page frame, buttons, labels, panels)
- `lib/tokens.stylex.ts`: design constants (`defineConsts`) for colors and fonts
- `lib/logotype.ts`: the NEURAMANCE wordmark (Chakra Petch Bold outlines with ®) shared by the nav and footer; `lib/site.ts`: the access email, agent prompt, video ID, and music track; the licensed track is served from i9's `/srv/media` at `media.neuramance.com` with a content-hashed name, never committed to this public repo

## Hosting

- `Caddyfile`: the site's serving rules (clean URLs, the 404 page, security headers, caching, trailing-slash and `www` redirects). Production imports it as `/etc/caddy/neuramance.caddy`; after changing it, run `sudo install -m 644 Caddyfile /etc/caddy/neuramance.caddy && sudo systemctl reload caddy`. `Caddyfile.local` wraps it for `bun run start`.
- Deploys: the `neuramance-deploy` systemd user timer runs `scripts/deploy` every minute. It builds `origin/main` into `/srv/neuramance/releases/<sha>`, switches the `/srv/neuramance/current` symlink, keeps five releases, and reports a `deploy/i9` commit status on GitHub. It skips a commit recorded in `/srv/neuramance/failed`, and refuses to deploy while `Caddyfile` differs from the installed copy. Logs: `journalctl --user -u neuramance-deploy`. Roll back by reverting on `main`.
- Cloudflare: when `CLOUDFLARE_API_TOKEN` is set, it is a scoped token for the owner's Cloudflare zones and tunnels; never print or commit it. Take the account ID from the API's `/zones`. A `PUT` to a ruleset phase entrypoint replaces every rule in that phase: read the entrypoint first and send back the full list.

## Styling

- Style with `stylex.create` and `{...stylex.props(...)}`; `app/globals.css` is the only CSS file.
- StyleX compiles through `babel.config.js` (Turbopack picks it up) and `postcss.config.mjs`; `vitest.config.mjs` reuses the Babel plugins.
- Spread `stylex.props` onto Base UI parts and target their state attributes with keys such as `':is([data-starting-style])'`.
- Write line heights in `rem`, not `calc()` ratios, which the CSS minifier rounds.
- Focus outlines are removed globally on purpose.
