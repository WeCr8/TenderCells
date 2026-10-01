<!-- Generated from docs/ROBOT_MOWERS.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# Bring your own robot mower

Already own a robot mower? Link it to Tender Cells OS and run it from there. You can mow now or
mow with a pattern where your mower supports it, park it, resume its schedule, and change its
cutting height, headlight, schedule and stay-out zones.

The mower keeps its own map, boundary and blade safety. Tender Cells adds what the mower cannot
know: **whether your animals are out on the lawn.** It holds the mower at home until they are
inside.

- **Try it first:** in the demo, open **Robot Mowers**, or trigger **Hens let out while the mower
  runs** in *Trigger an event*.
- **Where it runs:** on your hub (express-api), next to the MQTT broker. Nothing about the mower
  goes through the cloud.

## What Tender Cells adds

While any of these is true, **Start** and **Resume schedule** are refused and the hub **holds**
the mower at home:

- A **Husqvarna** or **GARDENA** mower is parked "until further notice", even if it is already
  docked, so its own schedule cannot send it out into the flock.
- Any other mower that is out is **sent home** (pause, then dock).

| Interlock | When it trips |
|---|---|
| **E-STOP** | E-STOP pressed for the mower |
| **Wildlife quiet hours** | Between 20:00 and 07:00 by default. Night mowing kills hedgehogs, toads and other wildlife. You can change or turn this off per mower. |
| **Flock out** | A guarded coop's door is not `closed`, or its door state is missing or older than 60 s |
| **Animal seen** | A rover or camera reported an animal on the property in the last 15 minutes |
| **Roost on the lawn** | A Roaming Roost (mobile animal housing) is parked in the mower's work area on the Property Twin: its animals may be on the lawn. The work area is 32 × 24 ft around the mower's dock. Today the OS checks this; the hub's rule accepts the same input (`occupiedBy`) once the OS reports positions to it. |

**When the hub checks.** It checks the interlock every 5 s (locally, without waiting for a
vendor poll) and before every start.

**When the hold ends.** The hold is released when the interlock clears. By default the mower
then stays parked until you start it. If you tick **auto-resume**, the mower goes back on its
own schedule instead; ticking it is your standing permission for this.

**Never refused.** Pause, Park until next schedule and Return to dock.

What Tender Cells does **not** do:

- **It does not steer the mower or cut its power.** E-STOP tells the mower to stop and go home. The
  mower's own lift, tilt and stop-button blade cut-offs remain the last line of safety.
- **It does not check for pets, children or toys.** Look at the lawn before you press start; the
  confirm dialog reminds you.

### Choosing what to guard

When you link a mower you must do one of two things:

- pick the **coops whose animals can reach that lawn**, or
- tick **"No animals ever roam where this mower works"** (for example, a front lawn behind a fence).

A mower with neither is refused.

## Supported mowers

The trust level is shown on every card in the app:

- **OFFICIAL:** the vendor's documented API, used with your own developer keys.
- **PARTNER:** a vendor-made Home Assistant integration.
- **COMMUNITY:** a community Home Assistant integration that the vendor does not support. It may
  break when the vendor changes its cloud.
- **OPEN:** open-source hardware on your own network.

Checked September 2026.

| Mower | Its app | Connects through | Trust | What you can do in Tender Cells |
|---|---|---|---|---|
| **Husqvarna Automower** | Automower Connect | [Automower Connect API](https://developer.husqvarnagroup.cloud/) | OFFICIAL | Start for a time or in a **work area**, pause, park until next schedule or until further notice, resume schedule, cutting height, headlight, **weekly schedule**, stay-out zones on/off, confirm errors, GPS position, next start |
| **GARDENA SILENO** | GARDENA smart system | [GARDENA smart system API](https://developer.husqvarnagroup.cloud/) | OFFICIAL | Mow for a time, resume schedule, park until next task or until further notice, battery, status (no pause in the API) |
| **Mammotion LUBA / YUKA** (models released 2025 and later) | Mammotion | [Mammotion Open API](https://developer.mammotion.com/) | OFFICIAL | Start a **saved plan** by name (area and pattern come from the plan), pause, resume, return to dock, battery, status |
| **Segway Navimow** | Navimow | Segway's [own Home Assistant integration](https://github.com/segwaynavimow/NavimowHA) | PARTNER | Start, pause, dock, battery |
| **Ecovacs GOAT** | Ecovacs Home | Home Assistant's [Ecovacs integration](https://www.home-assistant.io/integrations/ecovacs/) | PARTNER | Start, pause, dock |
| **Worx Landroid / Kress / LandXcape** | Landroid, Kress Mission | Community [Landroid Cloud](https://github.com/MTrab/landroid_cloud) integration | COMMUNITY | Start, pause, dock |
| **Dreame / MOVA, Bosch Indego, STIHL iMOW** | Their apps | Community Home Assistant integrations | COMMUNITY | Start, pause, dock |
| **Any other mower in Home Assistant** | - | Its `lawn_mower` entity | COMMUNITY | Start, pause, dock |
| **OpenMower / DIY** | - | Tender Cells MQTT | OPEN | Everything, including **every mowing pattern** |

**Why other brands go through Home Assistant.** Tender Cells only calls vendor APIs that are
documented for third parties. For other brands it uses the Home Assistant integration, so we
never ask for or store your vendor password.

## Mowing: basic and advanced

In the app, **Mow now…** opens two tabs:

- **Basic:** mow the whole lawn now with the mower's own settings. Where the connection supports
  it, you can also choose how long to mow.
- **Advanced:** what you can choose depends on your mower:

| Your mower | Advanced options | Where the pattern is decided |
|---|---|---|
| OpenMower / DIY (Tender Cells MQTT) | **Pattern**: mower's choice, stripes, checkerboard, diamonds, spiral or edges only. Plus stripe **angle**, **edge passes** first, lane **overlap**, **cutting height** and the **area** to mow. A live preview shows the paths and a rough time. | Tender Cells sends it to the mower |
| Husqvarna | **Work area**, and optionally a duration | In Automower Connect, per work area (parallel, checkerboard, triangle on EPOS models) |
| Mammotion | **Saved plan** | In the Mammotion app, as part of the plan |
| GARDENA, Home Assistant mowers | None: basic only | In the mower's own app |

**Mower settings** (below each card) change what the mower's own app would. Each setting appears
only where the connection supports it:

- cutting height
- headlight
- weekly schedule, editable for Husqvarna
- stay-out zones
- work areas
- error confirm
- GPS position

None of these settings move the mower. The mower's own schedule still obeys Tender Cells holds.

## Link a Husqvarna Automower or GARDENA SILENO

Both use the Husqvarna Group developer portal and your own application. You never enter your
Husqvarna password into Tender Cells.

1. **Create an application.** Sign in at [developer.husqvarnagroup.cloud](https://developer.husqvarnagroup.cloud/)
   with your Husqvarna / GARDENA account, then choose **New application**.
2. **Connect the APIs.** Add the **Authentication API**, plus the **Automower Connect API** and/or
   the **GARDENA smart system API**.
3. **Put the application key and secret on the hub,** then restart it:

   ```bash
   HUSQVARNA_APP_KEY=<application key>
   HUSQVARNA_APP_SECRET=<application secret>
   ```

   The hub signs in with OAuth2 `client_credentials`, and the keys never leave the hub.
4. **Link the mower in Tender Cells OS.** Open **Robot Mowers → Link a mower** and pick
   **Husqvarna** or **GARDENA**. Your mowers are listed; pick one.

**Rate limits.** The vendor APIs are rate limited. The hub polls every 5 minutes
(`MOWER_CLOUD_POLL_MS`) and once after each command. Safety holds never wait for a poll.

## Link a Mammotion LUBA / YUKA

Mammotion's Open API serves mower models released in 2025 and later. Check yours before buying
for an integration.

1. **Get API access.** Join Mammotion's developer program at [developer.mammotion.com](https://developer.mammotion.com/)
   and create a client.
2. **Put the client id and secret on the hub,** then restart it:

   ```bash
   MAMMOTION_CLIENT_ID=<client id>
   MAMMOTION_CLIENT_SECRET=<client secret>
   ```

3. **Save your plans in the Mammotion app.** Each plan holds its area, pattern and height.
4. **Link the mower in Tender Cells OS.** Open **Robot Mowers → Link a mower** and pick
   **Mammotion**. In **Mow now… → Advanced**, your saved plans are listed.

**How Mammotion mowers are held.** The Mammotion API has no "park until further notice". The hub
therefore polls it every minute and sends it home if its own schedule starts it while the
animals are out.

## Link a Home Assistant mower

This route works for any mower that [Home Assistant](https://www.home-assistant.io/) controls as a
**`lawn_mower` entity**:

- Husqvarna Automower has a built-in Home Assistant integration.
- Other brands and [OpenMower](https://github.com/ClemensElflein/OpenMower) have community
  integrations. Check that yours shows up as a `lawn_mower.*` entity.

1. **In Home Assistant, create a token.** Go to **Profile → Security → Long-lived access tokens →
   Create token**.
2. **On the hub, set two variables** in its environment or in `express-api/.env`, then restart the hub:

   ```bash
   HA_URL=http://homeassistant.local:8123
   HA_TOKEN=<the long-lived token>
   ```

   The token stays on the hub. It is never sent to the browser, Firestore or the repo.
3. **In Tender Cells OS, link the mower.** Open **Robot Mowers → Link a mower** and set:
   - **How it connects:** Home Assistant.
   - **Mower entity:** pick it from the list, e.g. `lawn_mower.front_yard`.
   - **Battery sensor** (optional): e.g. `sensor.front_yard_battery`.
   - **Coops to guard**, and **quiet hours**.
4. **Optionally, place it on the Property Twin:** go to **Property Twin → Robot Mower**.

The hub then:

- polls `GET /api/states/{entity}`;
- mirrors the state to `tc/{id}/state/mower` (retained) and `tc/{id}/status`;
- calls `lawn_mower.start_mowing`, `lawn_mower.pause` and `lawn_mower.dock`.

On the twin, values from Home Assistant are marked as source **EXTERNAL**.

**Exclusion zones.** Home Assistant cannot send Tender Cells zones to the mower. Draw the matching
no-go areas (coop run, garden beds) in the mower's own app.

## Link a native (MQTT) mower

This route is for a DIY mower, or a bridge you write for a mower platform. Speak the same contract
as other Tender Cells robots:

| Topic | Direction | Payload |
|---|---|---|
| `tc/{id}/cmd/mower` | hub → mower | `{action: "start" \| "resume_schedule" \| "pause" \| "park_until_next_schedule" \| "dock", seq, timestamp}`, plus the plan on start: `durationMin?, pattern?` (`auto \| stripes \| checkerboard \| diamond \| spiral \| perimeter`), `angleDeg?` (0-179, clockwise from map north), `edgePasses?` (0-5), `overlapPct?` (0-50), `cuttingHeightMm?` (15-120), `area?: {x, y, width, depth}` (property feet) |
| `tc/{id}/ack` | mower → hub | `{seq, ok, error?}`: refuse with `ok:false` and a reason |
| `tc/{id}/state/mower` | mower → hub (retained) | `{activity: "mowing" \| "docked" \| "paused" \| "returning" \| "error", battery?, error?, online, estop?, ts}` |
| `tc/{id}/status` | mower → hub (retained, last will `{online:false}`) | `{online}` |
| `tc/{id}/cmd/estop` | hub → mower (QoS 2, retained) | `{active}`: stop the blade and drive, latched |
| `tc/{id}/cfg/zones` | hub → mower (retained) | exclusion zones, the same as other robots |

Link it in **Robot Mowers → Link a mower** with **How it connects: Tender Cells MQTT**. The hub
gives it an id such as `mw_3f9a2c`; use that id in your topics.

## Hub API

The API is described in `/api/tendercells-backend.xml`.

| Method | Path | Does |
|---|---|---|
| `GET` | `/api/mqtt/mowers` | Your linked mowers: state, and why each may not mow now |
| `GET` | `/api/mqtt/mowers/vendors/{vendor}/discover` | Mowers on your `husqvarna`, `gardena` or `mammotion` account, or in `home-assistant` |
| `POST` | `/api/mqtt/mowers` | Link a mower (claimed for you) |
| `GET` / `PUT` / `DELETE` | `/api/mqtt/devices/{id}/mower` | Read, change or unlink |
| `POST` | `/api/mqtt/devices/{id}/mower/command` | `{action, ...plan}`. The action is one of `start`, `resume_schedule`, `pause`, `park_until_next_schedule`, `dock`. Start and resume answer `409` with the reason when refused. The plan fields must match the mower's capabilities (`400` says which do not). |
| `POST` | `/api/mqtt/devices/{id}/mower/settings` | `{cuttingHeight?, headlight?, schedule?, stayOutZone?, confirmError?}` |

**Other settings**

- `MOWER_POLL_MS` sets how often the hub polls (default `15000`).
- Links are stored in `express-api/.tendercells/mower-links.json`. This file holds no secrets.

## Troubleshooting

| You see | Do this |
|---|---|
| "Home Assistant is not configured on this hub" | Set `HA_URL` and `HA_TOKEN` on the hub and restart it. |
| "Home Assistant replied 401" | The token is wrong or was revoked. Create a new one. |
| "no door state from ct_001 yet" | The coop is not sending sensors. Check it is online, or remove it from the guarded coops. |
| The mower keeps being sent home | Read "Sent home at …" on its card. It names the coop, the animal or the quiet hours. |
| "is not configured on this hub" (Husqvarna / GARDENA / Mammotion) | Set the app key + secret (or client id + secret) on the hub and restart it. |
| "The mower cloud is rate limiting requests" | Wait a minute. Raise `MOWER_CLOUD_POLL_MS` if you link many mowers. |
| "This mower's pattern is set per work area in its own app" | Husqvarna: choose the pattern for each work area in Automower Connect, then pick the area here. |
| The mower shows Offline | Home Assistant reports the entity `unavailable`. Check the mower's own app or integration. |
