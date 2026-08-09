# Handoff: Personal site (writing / portfolio / turtle cam)

## Overview
A personal website with four sections: a bare intro homepage, a writing/blog section, a portfolio, and a live turtle-cam page. Target repo: `adrianjunus/junusais-qiou` (currently empty).

## About the design files
The bundled `Junusais Quoi.dc.html` is a **design reference** built in a prototyping tool (Design Components) — it's a working visual/interaction mockup, not production code to copy directly. It depends on that tool's runtime (`support.js`) and won't run standalone in a normal repo. Recreate the design in a real static site setup using the structure, copy, and design tokens documented below. `_ds/styles.css` is the actual design-system stylesheet (real CSS) and can be adapted/ported as-is — it's plain CSS with no framework dependency.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy in the mockup are final; recreate pixel-close.

## Recommended architecture
User wants to manage posts as **Markdown files they edit themselves**, is comfortable with git/code, and wants no camera integration yet (placeholder). This points to a static-site generator with file-based content:

- **Astro** (or 11ty/Next.js static export — any is fine) with a `src/content/posts/*.md` collection. Each post is one Markdown file with frontmatter:
  ```md
  ---
  title: "Rewiring the streaming stack, badly at first"
  date: 2026-08-04
  tag: work        # "work" | "life" — free text, used as a small label
  excerpt: "Notes from a week spent replacing a batch job with something that runs continuously."
  ---
  Full post body in Markdown goes here.
  ```
- Adding a post = adding a `.md` file to `src/content/posts/` and pushing to `main`; the build picks it up automatically. No admin UI, no database.
- Portfolio items can follow the same pattern (`src/content/projects/*.md`) with frontmatter for `title`, `kicker`, `tag`, `body`, and an optional `link` (e.g. GitHub URL).
- Turtle cam page ships as a static placeholder block (see Screens below) — no live video wiring in this pass.
- Deploy as a static build (Netlify/Vercel/GitHub Pages all work) since there's no backend or database.

## Screens

### 1. Home (`/`)
**Purpose:** bare intro, no content lists — everything else lives on its own page.
**Layout:** single centered column, max-width 880px, min-height ~60vh, vertically centered content, left-aligned text.
**Content:**
- Small filled square mark (10×10px, accent color) above the heading.
- H1: "Junus" in body-ink color + "ais quoi." in accent color, one heading (`<h1>Junus<span>ais quoi.</span></h1>`), size `clamp(38px, 5vw, 58px)`, line-height 1.05.
- One paragraph, 17px/1.6, max-width 56ch: "I'm Junus. I work in data engineering, I write about whatever I'm up to or thinking about, and I keep a pet turtle whose tank has better uptime than most of the pipelines I build."
- Background flourish: a faint stippled dot-cloud in a single smooth wave shape, accent color, opacity ranging ~0.02–0.12, positioned top-right of the hero, `pointer-events: none`. Purely decorative — implement as an SVG of small circles (see dot coordinates in the DC file) or recreate as a lightweight canvas/SVG noise-along-a-curve effect. Keep it faint; it should read as texture, not a shape.

### 2. Writing (`/writing`)
**Purpose:** blog index.
**Layout:** same 880px column. H1 "Writing", one-line subhead: "Life stuff. What I'm up to, or thinking about." Below, a plain list of posts (from the Markdown collection, newest first), each row separated by a 2px top rule (`var(--color-divider)`):
- Row: uppercase date label (12px, muted) + a `.tag-outline` pill showing the post's `tag`.
- Post title as H2 (23px).
- Excerpt paragraph (15px/1.6, muted, max-width 60ch).
- Clicking a post title navigates to `/writing/[slug]` rendering the full Markdown body (not designed in this pass — reuse the index's typography: H1 for title, date/tag row, then rendered body copy).

### 3. Portfolio (`/portfolio`)
**Purpose:** work index — currently two entries: a Flink streaming GitHub project and a reporting-dashboards project.
**Layout:** H1 "Portfolio", subhead "Data engineering work — pipelines, infrastructure, and dashboards." Below, a stacked list (2px top rule between rows), each row a 2-column grid (`220px` image column + flexible text column):
- Left: a dashed-border placeholder box (4:3), "Screenshot placeholder" — swap for a real project screenshot per item.
- Right: kicker label (e.g. "Code · GitHub"), H2 title, body paragraph, and an accent tag pill (e.g. "data engineering").
- Content:
  1. **Flink streaming starter** — kicker "Code · GitHub" — "A github codebase walking through how to set up a Flink streaming pipeline from scratch — job structure, state handling, and a checkpointing setup that actually recovers."
  2. **Reporting dashboards** — kicker "Dashboards" — "A set of internal reporting dashboards built for stakeholders who needed numbers without needing to ask an engineer for them."

### 4. Turtle Cam (`/turtle-cam`)
**Purpose:** placeholder for a future live feed.
**Layout:** H1 "Turtle Cam", subhead "A live view of the tank. Refreshes on its own; no need to reload." Below:
- A 16:9 dark box (`var(--color-neutral-900)` background) with a "LIVE"/"OFFLINE" pill (top-left, `.tag-accent` or `.tag-neutral`) and centered muted text "Live feed placeholder".
- A row of `.tag-outline` status chips: "78°F", "Last fed: today", "Water: clear" — static placeholder values for now.
- A short muted caption paragraph below.
- When a real camera is added, swap the placeholder box for a `<video>`/embed and wire the LIVE/OFFLINE pill and stats to real state.

## Navigation
Persistent slim topbar, sticky top, 2px bottom rule. Left: wordmark button "Junusais quoi" (navigates home, no separate logo asset). Right: inline nav links (Home, Writing, Portfolio, Turtle Cam), 14px, weight 600, with a 2px accent underline under the current page's link. No hamburger/mobile menu was designed — add one at the same breakpoint your framework's layout starts overflowing (roughly <480px), keeping the same visual language (flush-left, no icons required).

## Design tokens (from the bound Modernist design system — see `_ds/styles.css` for the authoritative values)
- `--color-bg: #f3f2f2`, `--color-text: #201e1d`, `--color-accent: #ec3013`
- Accent ramp for tints/states: `--color-accent-100` … `--color-accent-900` (light→dark)
- Neutral ramp: `--color-neutral-100` … `--color-neutral-900`
- Divider: `color-mix(in srgb, #201e1d 40%, transparent)` — always a solid 2px rule, never a hairline
- Font: Archivo for both heading and body (`--font-heading` / `--font-body`), heading weight 800
- Radius: 0 everywhere (no rounded corners)
- Components used: `.tag`, `.tag-outline`, `.tag-accent`, `.tag-neutral`, `.card`/`.card-kicker` (portfolio home teaser only, not used in the current 4-screen scope), `.hr` (2px divider), `.btn-ghost`
- No color beyond ink + the one accent; no gradients

## Assets
No photography or icons currently — all imagery is placeholder (dashed-border boxes). None of the copy is final personal content beyond what's listed above (bio paragraph and portfolio descriptions are the given final copy; blog post list on `/writing` is placeholder/sample content the user will replace with real Markdown posts).

## Files in this bundle
- `Junusais Quoi.dc.html` — the interactive design reference (all 4 screens, client-side page switch)
- `_ds/styles.css` — the real design-system stylesheet (tokens + component classes), portable as-is
