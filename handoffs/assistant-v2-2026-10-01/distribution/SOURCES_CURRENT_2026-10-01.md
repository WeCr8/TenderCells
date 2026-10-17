# Distribution Sources — checked 2026-10-01

## OpenAI
- https://developers.openai.com/plugins
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/deploy/app-review
- https://developers.openai.com/plugins/plugin-guidelines
- https://developers.openai.com/plugins/deploy/submission-errors

Important current facts used:
- ChatGPT and Codex share one universal public plugin directory.
- Public MCP review uses the plugin submission portal.
- Publisher identity verification is required.
- Initial MCP review requires exactly five positive and three negative cases.
- MCP review requires a reviewer-accessible demo recording.
- Reviewer credentials go in the secure review form, not the package.
- Current public submission ZIPs with app references/lifecycle hooks are not supported.
- Portable packages use root `plugin.json` + `mcp.json`.

## Anthropic
- https://claude.com/blog/build-plugins-for-claude
- https://claude.com/blog/observability-for-developers-building-connectors
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- https://support.claude.com/en/articles/11596036-anthropic-connectors-directory-faq
- https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy
- https://github.com/anthropics/claude-plugins-official

Important current facts used:
- Claude directory submission portal is available to developers on paid Claude plans.
- Submission supports a single remote MCP connector or a GitHub-hosted plugin bundle.
- Portal performs validation/safety scans and exposes review feedback.
- Developers choose when to publish after approval.
- Published connectors have directory observability/usage metrics.
- Claude custom connectors can be used for pre-submission testing.
