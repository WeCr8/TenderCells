# Tender Cells for Claude and ChatGPT

Ask an AI assistant about your farm in plain words: "How are the chickens doing?", "Any predator alerts tonight?", "Close the coop door." Tender Cells ships one **MCP server** (Model Context Protocol). Claude and ChatGPT both connect to it, so there is one tool set and one set of safety rules for both.

> **Status: preview (v0.3).**
> - **For customers:** add the hosted **Tender Cells** connector at `https://tendercells.com/mcp` in Claude or ChatGPT and sign in with your Tender Cells account. It's read-only. There's also a no-sign-in **demo farm** at `https://tendercells.com/mcp/demo`.
> - **On the farm network:** the local plugin adds E-STOP, and hardware actions that are off unless you turn them on; each one needs your explicit "yes".
> - Store listings are being prepared (`docs/CONNECTOR_LISTING.md`).

## Quick start for customers (Claude or ChatGPT)

1. Open your assistant's connector settings:
   - **Claude:** Settings → Connectors → *Add custom connector*.
   - **ChatGPT:** with developer mode on, create a connector. Once Tender Cells is in the directory, just search for it.
2. Enter the URL `https://tendercells.com/mcp`.
3. The assistant opens tendercells.com/connect. Sign in with your Tender Cells account and choose **Allow read-only access**.
4. Ask "How is my farm?". You'll get readings, health flags, alerts and the farm card.

**What it reads:** devices on your account that your hub syncs to the cloud. A hub syncs only when it's signed in to your account.

**What it can't do:** open doors, feed, move robots or press E-STOP. For an emergency, use E-STOP in the Tender Cells app or on the device.

**Disconnecting:** remove the connector in your assistant, or email hello@wecr8.info to revoke every connection.

| | Hosted connector (`tendercells.com/mcp`) | Local plugin (on your farm network) |
|---|---|---|
| Works from | Claude.ai, ChatGPT, mobile apps | Claude Desktop, Claude Code, your own HTTPS tunnel |
| Sign-in | OAuth with your Tender Cells account | Hub token or none (LAN) |
| Readings, alerts, farm card | yes (cloud mirror) | yes (live from the hub, incl. yard flags) |
| E-STOP | no: use the app or the device | yes |
| Door / feed / relay | no | confirm-twice, off by default |

## What the assistant can do

| Tool | What it does | When |
|---|---|---|
| `get_farm_overview` | Every device with key readings, animal-health flags (critical first), open yard flags and recent alerts. Shows the **farm card** inline in Claude and ChatGPT. | always |
| `get_hub_status` | Is the hub connected, and which devices has it heard from? | always |
| `get_device` | Temperature, humidity, ammonia, feed, water, chicken count, door, state, online | always |
| `get_alerts` | Last 100 predator / fault / health alerts | always |
| `get_yard_events` | Eggs ready, weeds found, roost headcount, animal or leak findings | always |
| `get_farm_snapshot` | Every device at once | always |
| `emergency_stop` | Stops every actuator on a device. Never needs confirmation. | always |
| `request_action` | Step 1 of 2: prepares an action **without touching hardware** and returns a summary, a "check first" list and a 6-digit code | only with `TC_MCP_ALLOW_ACTIONS=1` |
| `confirm_action` | Step 2 of 2: runs it, only after you say yes | only with `TC_MCP_ALLOW_ACTIONS=1` |

**Prompts** (Claude shows them as slash commands):
- `farm_check`: the daily check;
- `evening_lockup`: headcount, door, water, temperature and predators, then an offer to close the door with confirm-twice.

**Resources:**
- the backend description `tendercells://describe.xml`;
- the farm card `ui://tendercells/farm-card.html`.

### The farm card

The farm card is an [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) view, the shared inline-UI format Claude and ChatGPT both render, returned by `get_farm_overview`.
- It shows each device's readings, what needs attention, yard flags and alerts, plus a Refresh button.
- It has **no hardware buttons** on purpose: actions go through the chat and your confirmation.
- In apps without MCP Apps support, the assistant gets the same data as text and structured output.

**Health flags** use the project thresholds:
- **Warning:** temperature below 35°F or above 85°F, ammonia above 10 ppm, water below 15%, feed below 20%, or a device that's offline or in error.
- **Critical:** E-STOP latched, temperature below 32°F or above 90°F, or ammonia above 25 ppm.

### Demo farm (no hub needed)

`npm run mcp:demo`, or set `TC_MCP_DEMO=1`, serves a simulated farm:
- **Devices:** a coop with low water and eggs waiting, a Duck Dock, and a WatchTower that saw a raccoon.
- **Actions:** confirm-twice actions are on and change only the simulated devices.
- **Labels:** every id ends in `_demo` and is labelled SIMULATED.

It's the easy way to try the plugin, and to give app-directory reviewers something to test.

**Actions on the allow-list:**
- open or close the door;
- feed 1–500 g;
- relay on or off (heat lamp, fan, pump or grow light);
- stop a cleaning cycle;
- mark a yard flag handled.

**Never available to an assistant:** arm, gantry, Roaming Roost driving, routines, Hugging Face policies, laser weeding, mowers, exclusion zones, and clearing an E-STOP. Those stay in the Tender Cells OS, behind its own confirmations and the chicken-presence interlocks.

## Safety model

1. **Confirm twice.** The assistant can never actuate in one call.
   - `request_action` only returns a preview and a code.
   - The code is single-use and lasts 2 minutes.
   - The assistant is told to show you the preview and wait for a clear yes.
   - Your assistant app also asks before running tools marked as changing things.
2. **E-STOP wins.**
   - Actions are refused while a device reports E-STOP. This is checked again at confirm time.
   - Actions are also refused for 30 s after an E-STOP sent through the assistant, before the device has reported it.
   - Sending E-STOP cancels that device's pending actions.
3. **The hub decides.**
   - The MCP server only calls the hub's REST API, so device ownership, payload validation and the arm / weed / mower interlocks still apply.
   - Motion never goes through the cloud.
4. **Off by default.** Actions need `TC_MCP_ALLOW_ACTIONS=1`. The remote server refuses to listen beyond this computer without a long access key.

## Run it

Everything runs from the hub (`applications/tendercells_ui/test_output/express-api`), with the hub itself running (`npm run dev`).

| Variable | Meaning | Default |
|---|---|---|
| `TC_API` | Hub URL | `http://localhost:4000` |
| `TC_TOKEN` | Firebase ID token, if your hub enforces accounts. It expires after an hour; OAuth replaces this next. | none |
| `TC_MCP_ALLOW_ACTIONS` | `1` turns on `request_action` / `confirm_action` | off (on for the demo farm unless `0`) |
| `TC_MCP_DEMO` | `1`, or the `--demo` flag, serves the simulated farm instead of a hub | off |
| `TC_MCP_HOST` / `TC_MCP_PORT` | Remote server bind address | `127.0.0.1:8787` |
| `TC_MCP_KEY` | Access key for the remote server. Required beyond loopback; at least 24 characters. | none |

### Claude Desktop: one-click extension

1. Build the extension in the hub folder:

   ```bash
   npm run mcp:pack     # → dist/tendercells.mcpb
   ```

2. Double-click `tendercells.mcpb`, or drag it into Claude Desktop's Extensions settings.
3. Fill in the settings:
   - **Hub URL**, e.g. `http://192.168.1.50:4000`;
   - **Hub sign-in token**, only if your hub enforces accounts;
   - **Demo farm**, to try it with no hub;
   - **Allow hardware actions**.

The extension bundles the server (Node 20+) and a prebuilt farm card.

### Claude Desktop: manual config

Add this to `claude_desktop_config.json` and restart Claude Desktop:

```json
{
  "mcpServers": {
    "tendercells": {
      "command": "npx",
      "args": ["tsx", "/path/to/TenderCells/applications/tendercells_ui/test_output/express-api/backend/src/mcp/stdio.ts"],
      "env": { "TC_API": "http://localhost:4000" }
    }
  }
}
```

### Claude Code

- **Option 1, one command:**

  ```bash
  claude mcp add tendercells -e TC_API=http://localhost:4000 -- npx tsx /path/to/express-api/backend/src/mcp/stdio.ts
  ```

- **Option 2, the plugin (adds the farm-check skill too):** start the remote server (below), then run:

  ```bash
  /plugin marketplace add WeCr8/TenderCells
  /plugin install tendercells@tendercells
  ```

  The plugin connects to `TC_MCP_URL` (default `http://127.0.0.1:8787/mcp`) and sends `TC_MCP_KEY` when it is set.

### ChatGPT and Claude on the web (remote connector)

To try it without a hub, start the remote server with `--demo` (`npx tsx backend/src/mcp/http.ts --demo`).

These connect to a URL, so the server must be reachable over HTTPS.

1. Start the remote server with a long random key:

   ```bash
   export TC_MCP_KEY=$(openssl rand -hex 24)
   npm run mcp:http        # http://127.0.0.1:8787/mcp
   ```

2. Publish it over HTTPS with a tunnel or reverse proxy you control, pointing at `127.0.0.1:8787`.
3. Add the connector:
   - **ChatGPT:** turn on developer mode, then create a connector with the URL `https://<your-host>/mcp/<TC_MCP_KEY>` and no authentication. The key in the URL is the password, so keep it private.
   - **Claude:** in Settings → Connectors, add a custom connector with the same URL.

The menu names in both apps change often; follow each app's current help page for adding a custom MCP connector.

> The URL key is a stopgap for apps that can't send headers. Treat the URL like a password; rotate it by changing `TC_MCP_KEY`. Leave `TC_MCP_ALLOW_ACTIONS` off on an internet-facing server until OAuth lands.

## Try it

- "How's the farm?" → `get_farm_overview` and the farm card
- "What's the temperature and ammonia in the coop?" → `get_device`
- "Anything I should worry about tonight?" → `get_alerts` and `get_yard_events`
- "Give the hens 100 grams of feed."
  1. `request_action` shows: *Dispense 100 g … Check first: the feeder has feed and the chute is clear.*
  2. You say yes.
  3. `confirm_action` runs it.
- "Stop everything!" → `emergency_stop`

With no hardware, use the demo farm (`npm run mcp:demo`). To exercise the real hub path, run the simulated coop instead: `npm run dev` plus `npm run simulate` in the hub folder. Device ids that start with `sim_` are simulated.

## For developers

- **Code:**
  - `express-api/backend/src/mcp/`:
    - `server.ts`: tools, prompts, the farm overview and the rules;
    - `health.ts`: animal-health thresholds;
    - `confirm.ts`: confirmation codes;
    - `hubClient.ts`: hub REST client;
    - `demoHub.ts`: the simulated farm;
    - `env.ts`: environment switches;
    - `farmCard.ts`: builds the farm card from `express-api/mcp-view/`;
    - `stdio.ts` and `http.ts`: transports.
  - The Claude Desktop extension is the manifest `express-api/mcpb/manifest.json` plus `tools/build-mcpb.mts` (`npm run mcp:pack`). CI packs and validates it.
  - The Claude Code plugin lives in `plugins/tendercells/`, with the marketplace entry in `.claude-plugin/marketplace.json`.
- **Tests:** run `npm test` in the hub. `mcp.test.ts` uses an in-memory MCP client and a fake hub, and covers:
  - read-only by default;
  - health thresholds;
  - the demo farm overview and actions;
  - the farm card resource;
  - prompts;
  - environment switches;
  - nothing moves on request;
  - single-use, expiring codes;
  - E-STOP latch and re-check at confirm;
  - the allow-list;
  - the HTTP key and bind guards.
- **Adding an action:**
  1. Add it to `ACTIONS`, `actionCall` and `actionPreview` (with a "check first" list).
  2. Add a test.
  3. Never add motion that needs the chicken-presence check.
- **Farm card:** rendered through the MCP Apps host bridge (`AppBridge`) in a browser. It shows the device cards, attention list and SIMULATED badge, and Refresh calls back to the server.
- **Hosted connector:**
  - `hosted.ts` (OAuth 2.1 + MCP), `oauth.ts` (PKCE, stores), `firestoreHub.ts` (read-only farm data) and `connector.ts` (the Firebase Function entry).
  - `functions/scripts/build-connector.mjs` bundles it into the `mcp` function.
  - `firebase.json` rewrites `/mcp`, `/mcp/demo`, `/oauth/**` and `/.well-known/oauth-*` to it.
  - The consent page is `website/src/pages/ConnectPage.tsx`.
  - `hosted.test.ts` runs the whole OAuth flow over HTTP.
- **Next:**
  - list in the Claude and ChatGPT directories (`docs/CONNECTOR_LISTING.md`);
  - a signed `.mcpb` attached to GitHub releases;
  - mirror yard flags to the cloud so the hosted connector can show them.
