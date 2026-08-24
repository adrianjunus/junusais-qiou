# junusais-qiou

Personal site — bare intro homepage, writing (Markdown blog), portfolio, and a turtle-cam
placeholder. Built with [Astro](https://astro.build) and content collections; no backend or
database.

Recreated from the design handoff in [`design_handoff_personal_site/`](design_handoff_personal_site).

## Develop

```sh
npm install
npm run dev
```

## Add a post

Add a Markdown file to `src/content/posts/`:

```md
---
title: "Post title"
date: 2026-08-04
tag: work        # free text, shown as a small pill — e.g. "work" or "life"
excerpt: "One or two sentences shown on the index page."
---
Full post body in Markdown.
```

Push to `main` and it's live — no admin UI.

## Add a portfolio item

Portfolio items are posts, not a separate collection. Add a Markdown file to `src/content/posts/`
with `category: portfolio`:

```md
---
title: "Project title"
date: 2026-08-04
tag: "data engineering"   # free text, shown as a small pill
category: portfolio
link: "https://github.com/you/repo"   # optional
excerpt: "One or two sentences describing the project."
---
Full body in Markdown (shown on the post's own page; the excerpt is what's shown in the list).
```

## Build & deploy

```sh
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally
```

`dist/` is a static site — deploy it to Netlify, Vercel, GitHub Pages, or any static host.
If you set a production domain, fill in `site` in `astro.config.mjs`.

## Turtle cam

`src/pages/turtle-cam.astro` is a static placeholder. When a real feed exists, replace
`.turtle-screen`'s contents with a `<video>`/embed and wire `isLive` and the stat chips to
real state.
