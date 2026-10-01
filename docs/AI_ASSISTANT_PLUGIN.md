# Tender Cells for Claude and ChatGPT

Ask an AI assistant about your farm in plain words: "How are the chickens doing?", "Any predator alerts tonight?", "Close the coop door." Tender Cells ships one **MCP server** (Model Context Protocol). Claude and ChatGPT both connect to it, so there is one tool set and one set of safety rules for both.

> **Status: early preview (v0.1).** Reading the farm and E-STOP work today. Hardware actions are off unless you turn them on, and each one needs your explicit "yes". Per-user sign-in (OAuth) and app-store listings are next.

## What the assistant can do

| Tool | What it does | When |
|---|---|---|
| `get_hub_status` | Is the hub connected, and which devices has it heard from? | always |
| `get_device` | Temperature, humidity, ammonia, feed, water, chicken count, door, state, online | always |
| `get_alerts` | Last 100 predator / fault / health alerts | always |
| `get_yard_events` | Eggs ready, weeds found, roost headcount, animal or leak findings | always |
| `get_farm_snapshot` | Every device at once | always |
| `emergency_stop` | Stops every actuator on a device. Never needs confirmation. | always |
| `request_action` | Step 1 of 2: prepares an action **without touching hardware** and returns a summary, a "check first" list and a 6-digit code | only with `TC_MCP_ALLOW_ACTIONS=1` |
| `confirm_action` | Step 2 of 2: runs it, only after you say yes | only with `TC_MCP_ALLOW_ACTIONS=1` |

The backend description (API, MQTT topics, safety rules) is also published as the resource `tendercells://describe.xml`.

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
| `TC_MCP_ALLOW_ACTIONS` | `1` turns on `request_action` / `confirm_action` | off |
| `TC_MCP_HOST` / `TC_MCP_PORT` | Remote server bind address | `127.0.0.1:8787` |
| `TC_MCP_KEY` | Access key for the remote server. Required beyond loopback; at least 24 characters. | none |

### Claude Desktop (same computer as the hub)

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

- "What's the temperature and ammonia in the coop?" → `get_device`
- "Anything I should worry about tonight?" → `get_alerts` and `get_yard_events`
- "Give the hens 100 grams of feed."
  1. `request_action` shows: *Dispense 100 g … Check first: the feeder has feed and the chute is clear.*
  2. You say yes.
  3. `confirm_action` runs it.
- "Stop everything!" → `emergency_stop`

With no hardware, run the simulated coop: `npm run dev` plus `npm run simulate` in the hub folder. Device ids that start with `sim_` are simulated.

## For developers

- **Code:**
  - `express-api/backend/src/mcp/`:
    - `server.ts`: tools and rules;
    - `confirm.ts`: confirmation codes;
    - `hubClient.ts`: hub REST client;
    - `stdio.ts` and `http.ts`: transports.
  - The Claude Code plugin lives in `plugins/tendercells/`, with the marketplace entry in `.claude-plugin/marketplace.json`.
- **Tests:** run `npm test` in the hub. `mcp.test.ts` uses an in-memory MCP client and a fake hub, and covers:
  - read-only by default;
  - nothing moves on request;
  - single-use, expiring codes;
  - E-STOP latch and re-check at confirm;
  - the allow-list;
  - the HTTP key and bind guards.
- **Adding an action:**
  1. Add it to `ACTIONS`, `actionCall` and `actionPreview` (with a "check first" list).
  2. Add a test.
  3. Never add motion that needs the chicken-presence check.
- **Next:**
  - OAuth 2.1 sign-in, so each person sees only their devices without `TC_TOKEN`;
  - a hosted endpoint;
  - ChatGPT app and Claude connector directory listings;
  - a widget UI (farm card) for ChatGPT apps;
  - demo-farm tools that work with no hub.
