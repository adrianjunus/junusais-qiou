# CLAUDE.md

Personal site (junusais quoi) — Astro static site with a Markdown blog (content collections) and
a turtle-cam live-stream page. No backend, no database; the only "dynamic" piece is the
turtle-cam player, which reads a stream URL from an env var at build/runtime.

## Stack & commands
- Astro 4 (`astro.config.mjs` is currently empty — no `site` set yet, no integrations).
- `npm install`, `npm run dev`, `npm run build` (→ `dist/`), `npm run preview`.
- No test suite and no CI workflow checked into this repo — don't assume either exists.

## Structure
- `src/pages/` — routes: `index.astro`, `posts/index.astro`, `posts/[slug].astro`, `turtle-cam.astro`.
- `src/content/posts/*.md` — blog posts (schema in `src/content/config.ts`).
- `src/content/projects/*.md` — portfolio items; numeric filename prefix controls display order.
- `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/DotCloud.astro` — shared chrome.
- `src/styles/site.css`, `src/styles/design-system.css`.
- `design_handoff_personal_site/` — the original design handoff this site was rebuilt from; reference only, not built or imported.

For the "add a post" / "add a portfolio item" recipes, follow [README.md](README.md) rather than
duplicating them here.

## Turtle cam
`src/pages/turtle-cam.astro` plays an HLS stream via hls.js, reading the URL from
`PUBLIC_STREAM_URL` (`.env`, gitignored; `.env.example` holds the placeholder). It prefers
`Hls.isSupported()` over native `<video>` HLS almost everywhere — native HLS playback is really
only correct in Safari, but other browsers (e.g. Brave) also report
`canPlayType('application/vnd.apple.mpegurl') === 'maybe'`, which used to send them down the
wrong branch and leave the video stuck buffered-but-paused (see commit `9e68a6b`). There's a
click-to-play overlay as a fallback for any browser that blocks autoplay outright.

The camera → HLS → public-URL pipeline itself (MediaMTX + a Cloudflare Tunnel) runs entirely
outside this repo, on a separate always-on machine — this repo only ever consumes a URL. Full
setup steps live in [docs/turtle-cam-streaming.md](docs/turtle-cam-streaming.md); day-to-day
operating/troubleshooting of that pipeline is the `turtle-cam-streaming` skill.

## This repo is public — never commit
- Camera credentials, LAN IPs, or the live tunnel hostname/URL. `PUBLIC_STREAM_URL` stays in env
  vars only (local `.env`, or the deploy host's env var settings) — never hardcoded in source.
- Anything from `~/.cloudflared/` (tunnel ID, credentials JSON, `cert.pem`).
- A MediaMTX config's `source:` line for the `turtle` path — it embeds the camera's RTSP
  username/password.

## Deploy
Static `dist/` output. No `netlify.toml` / `vercel.json` / deploy workflow is checked into this
repo, so the actual host and its env var config live outside the repo — check current state
before assuming which host is live. Set `site` in `astro.config.mjs` once a production domain is
settled (needed for canonical links/sitemaps, not for the build itself).

## Multi-machine note
This file and the `turtle-cam-streaming` skill exist so any machine running Claude Code against
this repo picks up the same context after a `git pull` — keep both updated in place rather than
letting machine-specific knowledge live only in one session's history.
