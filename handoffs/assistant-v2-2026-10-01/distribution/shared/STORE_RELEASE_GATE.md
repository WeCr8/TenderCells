# Shared Store Release Gate

Do not submit until every REQUIRED item is complete.

## Product
- [ ] B01 customer facade/Builder reads merged
- [ ] Existing Farm Card works
- [ ] Hosted connector remains read-only
- [ ] Admin MCP is NOT exposed on customer resource
- [ ] Tool titles/descriptions are plain-language and accurate
- [ ] Simulation is visibly labeled SIMULATED

## Safety / authorization
- [ ] OAuth is production-ready
- [ ] `farm:read` is still customer scope
- [ ] Cross-user isolation test passes
- [ ] hosted connector exposes no E-STOP/action tools
- [ ] local confirm-twice path regression tests pass
- [ ] no secrets committed

## Production endpoints
- [ ] `https://tendercells.com/mcp`
- [ ] OAuth discovery
- [ ] protected-resource discovery
- [ ] authorization endpoint
- [ ] token endpoint
- [ ] privacy policy
- [ ] terms
- [ ] customer assistant help page
- [ ] support contact

## Reviewer experience
- [ ] Dedicated reviewer account
- [ ] Seeded sample farm owned only by reviewer UID
- [ ] Representative devices: Chicken Tender, Duck Dock, WatchTower
- [ ] One safe warning state (e.g. low water)
- [ ] One predator alert
- [ ] Builder/Mission content available
- [ ] No real customer's data

## Assets
- [ ] Square TenderCells icon
- [ ] high-resolution icon
- [ ] screenshots from real ChatGPT
- [ ] screenshots from real Claude
- [ ] Farm Card screenshot
- [ ] OAuth consent screenshot
- [ ] demo recording

## Quality
- [ ] Express API tests pass
- [ ] Express API build passes
- [ ] Builder tests pass
- [ ] UI build passes
- [ ] production smoke test passes
- [ ] no P0/P1 known issues

## Release ownership
- [ ] Verified publisher identity/company
- [ ] One named owner for OpenAI listing
- [ ] One named owner for Claude listing
- [ ] support inbox monitored
- [ ] rollback contact identified
