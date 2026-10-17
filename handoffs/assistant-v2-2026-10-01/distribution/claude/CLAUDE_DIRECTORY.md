# Anthropic: Publish TenderCells to the Claude Directory

**Current as of 2026-10-01.**

Anthropic now has a directory submission portal for developers on paid Claude plans.

The portal currently supports two paths:

1. **Single MCP connector** — submit the remote MCP server.
2. **Plugin bundle** — host MCP server configuration + skills on GitHub and submit the plugin.

## TenderCells recommendation: plugin bundle

TenderCells already has:
- `plugins/tendercells/.claude-plugin/plugin.json`
- `plugins/tendercells/.mcp.json`
- `plugins/tendercells/skills/farm-check/`
- additional v2 skills planned

Use the **plugin bundle** route so the Claude listing includes the workflow layer, not only raw tools.

## 1. Finish product readiness

Same shared release gate:
- B01 deployed;
- hosted customer connector read-only;
- OAuth production-ready;
- Builder/Mission reads working;
- privacy/terms/help pages live;
- dedicated reviewer account.

## 2. Validate remote connector directly in Claude

Before directory submission, add the remote MCP as a custom connector and verify:
- Claude detects OAuth correctly;
- sign-in succeeds;
- farm tools return only the signed-in person's data;
- Farm Card renders where supported;
- mission/Builder tools behave correctly;
- hosted hardware-control prompt does not expose a write tool.

Current individual custom-connector flow is under:
`Customize → Connectors → Add custom connector`
(menu wording can change).

## 3. Prepare GitHub plugin bundle

Validate:
```text
plugins/tendercells/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
└── skills/
    ├── farm-check/
    │   └── SKILL.md
    ├── builder-guide/
    │   └── SKILL.md
    ├── mission-guide/
    │   └── SKILL.md
    └── device-connect/
        └── SKILL.md
```

Keep plugin slug `tendercells` stable.

If the submission portal accepts a plugin path inside the repo, point it to `plugins/tendercells`. If the current portal accepts only a repository root, publish a release repository/tag containing exactly the plugin bundle or follow the portal's repository-discovery flow. Do not guess silently—use the portal's current supported path.

## 4. Open the Claude directory submission portal

Anthropic's current portal:
- is available to developers on paid Claude plans;
- auto-validates and safety-scans submissions;
- shows review status and feedback;
- lets the developer choose when to publish after approval.

Choose **Plugin bundle**.

## 5. Supply listing/reviewer material

Use:
- `LISTING_COPY.md`
- shared reviewer account
- shared demo video
- current icons/screenshots
- public privacy/support URLs

Avoid claims that Claude can actuate cloud hardware; the hosted connector is read-only.

## 6. Review and fixes

Address:
- safety scan findings;
- tool/auth mismatches;
- privacy concerns;
- broken URLs;
- unclear write semantics;
- overbroad scopes;
- compatibility issues with other MCP servers.

Anthropic's directory policy emphasizes safety, security, privacy and interoperability.

## 7. Publish

Once approved, publish deliberately from the portal.

After launch, use the directory's available analytics/observability to monitor:
- active users;
- tool calls;
- error rates;
- latency;
- product-surface usage;
- listing/search performance.

## 8. Optional second Claude distribution target: Claude Code marketplace

The existing repo already declares a Claude plugin marketplace.

The official Claude Code plugin directory also accepts external third-party plugins. Treat this as a secondary developer-facing target after the main Claude directory submission.

See `CLAUDE_CODE_MARKETPLACE.md`.

## Official sources

- Directory submission announcement: https://claude.com/blog/build-plugins-for-claude
- Connector observability/submission: https://claude.com/blog/observability-for-developers-building-connectors
- Custom connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Connectors directory FAQ: https://support.claude.com/en/articles/11596036-anthropic-connectors-directory-faq
- Directory policy: https://support.claude.com/en/articles/11697096-anthropic-mcp-directory-policy


## Packaged official brand assets

Use `brand/official/tendercells-icon-512.png` or `brand/official/tendercells-icon-1024.png` for store imagery. The exact vector source is in `brand/official/tendercells-icon.svg`.
