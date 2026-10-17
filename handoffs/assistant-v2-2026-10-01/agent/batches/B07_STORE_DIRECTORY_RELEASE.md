# B07 — Public Store / Directory Release

**Depends on:** B01 minimum; B02/B03 strongly recommended; admin batches NOT required.

## Goal

Prepare and submit the TenderCells **customer connector** to:
1. OpenAI universal plugin directory (ChatGPT + Codex)
2. Claude directory
3. optional Claude Code official plugin marketplace

## T01 Release gate

Complete:
`distribution/shared/STORE_RELEASE_GATE.md`

## T02 Production smoke

Run `scripts/store-preflight.sh`.

Then manually test in:
- ChatGPT developer/personal plugin flow
- Claude custom connector flow

## T03 Reviewer environment

Create/verify the dedicated review account and seeded farm.

Do not store credentials in repo/package.

## T04 OpenAI package

Prepare portable package from:
`distribution/openai/package-template/`

Add approved skills/assets.

Run portal validation.

## T05 OpenAI review materials

Use exactly:
- 5 positive cases
- 3 negative cases
- demo recording
- reviewer credentials in secure portal form

## T06 Submit OpenAI

Complete publisher verification and domain/MCP scan first.

Submit, fix findings, then publish after approval.

## T07 Claude plugin bundle

Validate `plugins/tendercells/` and the new skills.

Submit through Claude directory portal using plugin-bundle route.

## T08 Claude review

Fix safety/compatibility findings, then publish after approval.

## T09 Optional Claude Code marketplace

Submit external plugin after main Claude listing is stable.

## T10 Post-launch

Monitor:
- installs/active users
- MCP tool calls
- errors
- latency
- failed OAuth
- support tickets
- listing discovery/search terms where available

## Hard rule

Never add platform-admin tools to either public customer store package.
