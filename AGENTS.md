# Repository guidance

Build a content-led senior software engineer portfolio with a distinctive visual point of view. Keep the site static-first and easy to update through Markdown. Treat personal details, project claims, metrics, and quotes as user-provided facts; never invent them.

Use the focused skills in `.agents/skills/` when their workflows apply. Keep shared instructions here brief and put task-specific guidance in the relevant skill.

## Engineering defaults

- Prefer Astro components and semantic HTML. Add client-side JavaScript only for interactions that need it.
- WebGL must be an enhancement: preserve useful content without JavaScript or WebGL, honor reduced motion, and keep a performant fallback.
- Add or update meaningful tests when behavior changes. Run `npm run verify` before finishing code changes; run browser tests when changing user-facing behavior.
- Keep content valid against the typed Astro collections. Update documentation when a workflow or required environment setting changes.
- For backlog automation, work only on one GitHub Project item in `Ready` at a time. Require explicit acceptance criteria, open a linked pull request, and allow auto-merge only after all required checks pass. Retry failed checks at most twice, then report and mark the item blocked.
- Never put credentials in tracked files or logs. Do not publish to HostGator from the backlog worker.
