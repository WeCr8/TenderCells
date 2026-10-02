# TenderCells Store / Directory Release Overview

**Current as of 2026-10-01. Re-check the portals immediately before submission because fields and menus change.**

TenderCells should publish the **customer connector**, not the future platform-admin MCP.

## Recommended public product

**TenderCells**
- remote MCP: `https://tendercells.com/mcp`
- OAuth: TenderCells customer OAuth (`farm:read`)
- hosted behavior: read-only
- source: existing shared MCP implementation
- skills: farm check + Builder/Mission guidance
- UI: existing Farm Card; later Builder/Mission cards are additive
- demo/reviewer support: seeded review account + existing `/mcp/demo`

## Public release order

```text
B01 customer facade + Builder/Mission reads
        ↓
all MCP + Builder tests green
        ↓
production MCP/OAuth deploy
        ↓
store preflight
        ↓
real ChatGPT + Claude test
        ↓
capture screenshots + demo recording
        ↓
OpenAI submission
        ↓
Claude submission
        ↓
review fixes
        ↓
publish deliberately
        ↓
monitor adoption/errors/latency
```

## Do not publish

- platform admin tools;
- unrestricted hardware motion;
- secrets or reviewer credentials in ZIP/Git;
- concept art as verified wiring;
- a staging URL masquerading as production;
- duplicate mission data disconnected from Builder.

## Official-source snapshot used for these instructions

### OpenAI
OpenAI now publishes plugins to one universal directory shared by ChatGPT and Codex. Current public MCP submission uses the plugin submission portal, requires verified publisher identity, tool/MCP scanning, review information, and an approval step before you choose to publish.

### Anthropic
Anthropic's current directory submission portal accepts:
1. a single remote MCP connector; or
2. a GitHub-hosted plugin bundle containing MCP + skills.

For TenderCells, the **plugin bundle** is the recommended Claude submission because the repo already has `.claude-plugin/plugin.json`, `.mcp.json`, and skills.

See the platform-specific files for exact steps and source links.
