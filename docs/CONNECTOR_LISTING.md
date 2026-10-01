# Tender Cells connector: store listing kit (Claude and ChatGPT)

Everything needed to list Tender Cells in the **Claude connectors directory** (and the Claude Desktop extensions directory) and the **ChatGPT apps directory**.

The submission forms change often. Treat the answers below as prepared copy and check them against the current form when you submit.

## The two connectors

| | URL | Sign-in | Data |
|---|---|---|---|
| **Tender Cells** (customer) | `https://tendercells.com/mcp` | OAuth 2.1 with the person's Tender Cells account | Their own devices, read-only, from the cloud mirror their signed-in hub keeps |
| **Tender Cells (demo farm)** | `https://tendercells.com/mcp/demo` | none | A simulated coop, Duck Dock and WatchTower |

Both are served by the `mcp` Firebase Function (source `express-api/backend/src/mcp/hosted.ts`).

**The cloud connector is read-only by design.** It has:
- no door, feed or relay actions;
- no E-STOP;
- no robot motion.

Hardware control stays on the farm network: the Tender Cells app, or the local plugin with confirm-twice actions (`docs/AI_ASSISTANT_PLUGIN.md`).

## Brand assets (our logo)

| File | Use |
|---|---|
| `website/public/brand/tendercells-icon-512.png` | Store icon, Claude Desktop extension icon, MCP server icon (`https://tendercells.com/brand/tendercells-icon-512.png`) |
| `website/public/brand/tendercells-icon-1024.png` | High-res store icon |
| `website/public/brand/tendercells-icon-square-512.png`, `-1024.png` | Full-bleed square, for stores that apply their own corner mask |
| `website/public/brand/tendercells-icon.svg`, `tendercells-icon-square.svg` | Vector source (the Tender Cells mark, `#147C38` on `#F7F4EE`) |
| `website/public/brand/tendercells-icon-64.png` / `-128.png` / `-256.png` | Small sizes, also used as the favicon on the consent page |

The MCP server advertises these icons in `serverInfo.icons`, so clients that support the field show the logo automatically.

## Listing copy

- **Name:** Tender Cells
- **Tagline (≤ 80 chars):** Check on your backyard flock: coop readings, health flags and predator alerts.
- **Short description:**
  > Ask about your Tender Cells farm in plain words. See every coop's temperature, ammonia, feed, water and headcount, with animal-health problems flagged first, plus predator and fault alerts and an at-a-glance farm card. Read-only: it never moves hardware.
- **Long description:**
  > Tender Cells is an automated animal-care platform for backyard farms: smart coops, sensors, predator-watch cameras and robots. Connect it to your assistant and ask "How are the chickens?", "Anything I should worry about tonight?" or "Is the coop door closed?".
  >
  > The connector reads the devices on your Tender Cells account and flags what needs attention, using animal-care thresholds:
  > - cold or heat stress;
  > - high ammonia;
  > - low water or feed;
  > - offline devices;
  > - a latched E-STOP.
  >
  > It also shows a live farm card inside the chat.
  >
  > It is read-only by design: the cloud connector cannot open doors, feed or move robots. Those stay in the Tender Cells app on your farm network, where every hardware action needs your confirmation.
  >
  > No hardware yet? Add the demo farm connector to try it with a simulated farm.
- **Category:** Home and smart devices / Productivity. Use the closest match on each form.
- **Website:** https://tendercells.com
- **Documentation:** https://tendercells.com/docs/ai-assistant-plugin
- **Privacy policy:** https://tendercells.com/privacy (it has a section on AI assistant connectors)
- **Terms:** https://tendercells.com/terms
- **Customer how-to page:** https://tendercells.com/assistants
- **Manage connections (customers):** Tender Cells app → Account → Claude & ChatGPT (`/app/assistants`)
- **Support:** support@wecr8.info
- **Developer:** WeCr8 Solutions

## Tools

All tools on the hosted connectors are read-only.

| Tool | Title | Annotations |
|---|---|---|
| `get_farm_overview` | Farm overview (farm card) | `readOnlyHint: true`, `openWorldHint: false`; output schema; MCP Apps view `ui://tendercells/farm-card.html` |
| `get_hub_status` | Hub status | `readOnlyHint: true` |
| `get_device` | Device readings | `readOnlyHint: true` |
| `get_alerts` | Device alerts | `readOnlyHint: true` |
| `get_yard_events` | Yard events | `readOnlyHint: true` |
| `get_farm_snapshot` | Whole-farm snapshot | `readOnlyHint: true` |

**Prompts:** `farm_check` and `evening_lockup`.

**Farm card (MCP Apps):**
- It makes no network requests and loads no external resources (everything is inline). It needs no CSP domains.
- Its only interaction is Refresh, which calls `get_farm_overview` again.

## Authentication (customer connector)

- **Discovery:**
  - `https://tendercells.com/.well-known/oauth-protected-resource` (also at `/mcp`);
  - `https://tendercells.com/.well-known/oauth-authorization-server`.
- **Client registration:** dynamic (RFC 7591), public clients (`token_endpoint_auth_method: none`). Redirect URIs must be https (or http on localhost).
- **Grant:** authorization code with **PKCE S256 only**. Resource indicator: `https://tendercells.com/mcp`.
- **Scope:** `farm:read`.
- **Tokens:**
  - access tokens last 1 hour;
  - refresh tokens last 30 days, rotate on every use, and can be revoked at `/oauth/revoke`.
  - Only SHA-256 hashes are stored (`oauthGrants`; server-only by Firestore rules).
- **Consent:** `https://tendercells.com/connect`. The person signs in with their Tender Cells account (Firebase Auth) and sees exactly what the assistant can and cannot do.
- **Self-service revocation:** `GET /oauth/connections` and `POST /oauth/connections/revoke`.
  - Both are authenticated with the person's own Firebase ID token, never a connector token.
  - The OS page `/app/assistants` uses them.
- **Isolation:** every grant is bound to one person's uid. Data is read only from `devices` where `ownerId == uid`. There are no admin, platform or Firebase-management capabilities anywhere in the connector.

## Reviewer access

1. **Quickest:** the demo connector `https://tendercells.com/mcp/demo` needs no account.
2. **Customer connector:** create a reviewer account on https://tendercells.com/account. Before submitting, give it devices:
   - claim the hub's simulated devices with `npm run simulate`, or seed `devices/{id}` with `ownerId` set to the reviewer's uid and a `telemetry` map;
   - then put the reviewer email and password in the form's test-credentials field (never in the repo).

## Screenshots

- `docs/connector-listing/farm-card.png`: the farm card on the demo farm.
- `docs/connector-listing/consent.png`: the consent page (`/connect`).
- **To add before submitting:** a real chat in Claude and in ChatGPT asking "How are the chickens?", showing the farm card inline.

## Pre-submission checklist

- [ ] Merged and deployed. Then confirm:
  - `curl https://tendercells.com/.well-known/oauth-authorization-server` returns the metadata;
  - `POST https://tendercells.com/mcp/demo` answers `initialize`.
- [ ] Test the customer connector end to end:
  1. **Claude:** add a custom connector with the URL `https://tendercells.com/mcp`.
  2. **ChatGPT:** with developer mode on, create a connector with the same URL and OAuth.
  3. Sign in, approve, and ask "How is my farm?".
- [ ] **Firestore TTL policies** (console → Firestore → TTL): field `expireAt` on the `oauthRequests` and `oauthGrants` collections, so expired grants are cleaned up.
- [ ] Reviewer account with devices; test credentials go in the submission form.
- [ ] Screenshots from real Claude and ChatGPT chats.
- [ ] **Claude Desktop extension:** run `npm run mcp:pack` in the hub, attach `dist/tendercells.mcpb` to a GitHub release, and submit it to the extensions directory (it uses `icon.png` = the 512 px logo).
- [ ] Submit:
  - the Claude connectors directory form;
  - the ChatGPT apps submission (Apps SDK, MCP server URL, OAuth).
