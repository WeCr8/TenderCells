# Claude Code Official Plugin Marketplace — Secondary Target

Anthropic maintains an official Claude Code plugins directory with third-party external plugins.

TenderCells already has the right high-level shape:
```text
plugins/tendercells/
  .claude-plugin/plugin.json
  .mcp.json
  skills/
```

## Recommended sequence

1. First publish/test the main Claude directory plugin.
2. Confirm the Claude Code plugin installs from the TenderCells repo marketplace:
   `/plugin marketplace add WeCr8/TenderCells`
   `/plugin install tendercells@tendercells`
3. Keep the plugin `name` slug stable.
4. Submit TenderCells as an external plugin through Anthropic's current official plugin-directory submission path/form.
5. If accepted, validate install from the official marketplace and remove any duplicate user instructions that cause confusion.

## Slug rule

The official marketplace documents plugin names as immutable install slugs. Prefer changing display labels rather than renaming `tendercells`.

Official marketplace repository:
https://github.com/anthropics/claude-plugins-official
