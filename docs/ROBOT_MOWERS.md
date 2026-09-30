# Bring your own robot mower

Already own a robot mower? Link it to Tender Cells OS. It keeps mowing with its own map,
boundary and blade safety. Tender Cells adds what the mower cannot know: **whether your animals
are out on the lawn.** It keeps the mower docked until they are inside.

- **Try it first:** in the demo, open **Robot Mowers**, or trigger **Hens let out while the mower
  runs** in *Trigger an event*.
- **Where it runs:** on your hub (express-api), next to the MQTT broker. Nothing about the mower
  goes through the cloud.

## What Tender Cells adds

A mower is **refused a start** while any of these is true. If it is already mowing (for example,
its own schedule started it), the hub **sends it home** (pause, then dock).

| Interlock | When it trips |
|---|---|
| **E-STOP** | E-STOP pressed for the mower |
| **Wildlife quiet hours** | Between 20:00 and 07:00 by default. Night mowing kills hedgehogs, toads and other wildlife. You can change or turn this off per mower. |
| **Flock out** | A guarded coop's door is not `closed`, or its door state is missing or older than 60 s |
| **Animal seen** | A rover or camera reported an animal on the property in the last 15 minutes |

The hub checks the interlock on every poll (15 s) and before every start. **Pause** and **Return
to dock** are never refused.

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
| `tc/{id}/cmd/mower` | hub → mower | `{action: "start" \| "pause" \| "dock", seq, timestamp}` |
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
| `GET` | `/api/mqtt/mowers/home-assistant/entities` | `lawn_mower` entities in Home Assistant |
| `POST` | `/api/mqtt/mowers` | Link a mower (claimed for you) |
| `GET` / `PUT` / `DELETE` | `/api/mqtt/devices/{id}/mower` | Read, change or unlink |
| `POST` | `/api/mqtt/devices/{id}/mower/command` | `{action: start \| pause \| dock}`; start answers `409` with the reason when it is refused |

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
| The mower shows Offline | Home Assistant reports the entity `unavailable`. Check the mower's own app or integration. |
