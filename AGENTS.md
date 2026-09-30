# AGENTS.md

Instructions for coding agents (Codex and others) working in this repo.

- **Conventions and product context:** read [`.claude/CLAUDE.md`](.claude/CLAUDE.md). It covers the product, the safety rules (E-STOP, confirm dialogs, chickens before robots), the UI colour tokens and the MQTT topics.
- **Current state and next steps:** read [`docs/HANDOFF.md`](docs/HANDOFF.md). It covers what shipped, the per-app checks to run before a PR, and the open threads.
- **Workflow:** branch, run the app's checks from `docs/HANDOFF.md`, open a PR to `main`, and merge when CI is green. A merge to `main` deploys to Firebase Hosting.
- **Never:** commit secrets or device credentials, send motion commands through Firebase, move a robot without its interlocks, or label simulated data as live.
