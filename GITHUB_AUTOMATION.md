# GitHub backlog automation setup

The hourly worker only processes open GitHub issues in the configured Project V2 board whose `Status` is `Ready`. It handles one item per run, requires a non-empty `Acceptance criteria` heading with checkable bullets, runs the local quality suite, opens a linked pull request, and optionally enables auto-merge. It never deploys the production site.

## One-time setup

1. Create a repository-level GitHub Project V2 board from this repository’s **Projects** tab. Add a single-select field named `Status` with these options: `Backlog`, `Ready`, `In Progress`, `Blocked`, and `Done`. Add repository issues to the board; draft cards and issues from other repositories are ignored.
2. Create a GitHub App for this repository. Grant only the repository permissions required to read metadata and write contents, issues, pull requests, and Projects. Install it on this repository.
3. Add Actions secrets `CODEX_APP_ID`, `CODEX_APP_PRIVATE_KEY`, and `OPENAI_API_KEY`. Add the repository variable `CODEX_PROJECT_ID` with the Project V2 node ID.
4. Protect `main` with the `CI / verify` check as required. Enable repository auto-merge and set `CODEX_AUTOMERGE_ENABLED=true` only after the required checks and GitHub App permissions are in place. Leave it unset to create PRs without enabling auto-merge.
5. Use `workflow_dispatch` to confirm configuration before relying on the hourly schedule.

When the issue lacks criteria, the worker moves it to `Blocked` and explains what is missing. After two repair attempts with failing checks, it blocks the item with the relevant output. A merged PR moves its linked issue to `Done`.
