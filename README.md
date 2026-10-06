# mwdev portfolio

A static-first portfolio for a senior software engineer, built with Astro, Markdown, and a small WebGL study. Personal details and case studies are starter drafts; replace them with verified information before publishing.

## Local development

```sh
npm install
npm run dev
```

`npm run verify` runs formatting, lint, Astro diagnostics, unit tests, and a production build. After that, `npm run test:e2e` runs Chromium and mobile browser checks against the generated static site; install the browser locally with `npx playwright install chromium` first.

## Content

- Update the profile in `src/content/profile/index.md`.
- Add case studies under `src/content/projects/` and notes under `src/content/writing/`.
- Each collection validates its frontmatter in `src/content.config.ts`. Set `draft: false` to publish an entry. Project role and year are optional; add a `screenshot` object with a public asset path in `src` and descriptive `alt` text to show an application screenshot, and optionally add a `caption`. Writing entries may include an optional `image` object with a public asset path and descriptive `alt` text.
- Keep outcomes and metrics factual. The starter writing note remains a draft until it is replaced with verified content.

## Codex

The root `AGENTS.md` contains short repository-wide guidance. Task workflows live in `.agents/skills/`: portfolio discovery, WebGL experiences, and issue-to-PR automation.

## GitHub backlog automation

Read [GITHUB_AUTOMATION.md](GITHUB_AUTOMATION.md) for Project setup, credentials, required checks, auto-merge configuration, and the hourly worker behavior. The production deployment workflow is intentionally separate from backlog automation.

## HostGator deployment

The site builds to `dist/` as static files. Before adding a production publisher, confirm the HostGator hosting type, domain document root, and available secure transfer method. Do not add credentials to the repository.
