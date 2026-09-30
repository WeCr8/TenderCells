# DIY habitat projects and feeds

These are projects for terrariums and vivariums, indoor small animals, ponds and coops. You build one, connect it in the OS (**DIY Projects**, `/projects`), and watch its feed.

Each project lists its species groups, parts, the JSON it publishes, video/audio, Hugging Face models and a lesson. The source is `shared/library/projects.ts`, shown on tendercells.com/library#projects and in the OS.

| Project | Groups | Media | Hugging Face model |
|---|---|---|---|
| Terrarium / vivarium climate monitor | reptiles, small mammals | — | — |
| Enclosure camera + AI species check | reptiles, small mammals, poultry, aquatic | video | [imageomics/bioclip](https://huggingface.co/imageomics/bioclip), [google/owlv2-base-patch16-ensemble](https://huggingface.co/google/owlv2-base-patch16-ensemble) |
| Habitat sound monitor (`firmware/jetson-nano/habitat_listener.py`) | poultry, small mammals, livestock | audio | [MIT/ast-finetuned-audioset-10-10-0.4593](https://huggingface.co/MIT/ast-finetuned-audioset-10-10-0.4593) |
| Aquarium / pond water monitor | aquatic, reptiles | — | — |
| Activity wheel counter | small mammals | — | — |

Safety is part of every project:

- A hardware thermostat controls heat lamps; the ESP32 only monitors.
- Anything near water uses a GFCI outlet.
- In classrooms, tell people when a microphone is recording.

## Local-first feeds: what is free and what is paid

| | Free (every plan) | Paid (Starter monthly, School annual) |
|---|---|---|
| Live video / audio on your network | ✅ straight from the device to your browser | ✅ |
| Telemetry + AI events (JSON) | ✅ through Tender Cells | ✅ |
| Event snapshots | 7 days | 30 days |
| **Live cloud view** away from home | — | ✅ (hours per month by plan) |
| Clip history | — | 7-30 days |

Allowances are in `CLOUD_FEED` (`shared/library/projects.ts`), keyed by the Stripe plans in `functions/src/billing.ts`. They are **proposed**; pricing sets the final numbers.

**Why this split:**

- A camera at 5 fps × 30 KB is about **13 GB/day**, and 64 kbps audio adds about 0.7 GB/day. Relaying that for every device would be the largest cost in the system.
- JSON telemetry every 10 s plus events is about **2 MB/day**.
- The OS shows the comparison, computed by `feedBudget()`.

This is the same model that consumer camera products use: local live view is free, and cloud relay and recording are a subscription.

**How the cloud view should be built** (not built yet; shown as "coming soon"):

- On-demand only: the relay starts when someone opens the view and stops when they leave.
- Capped resolution and frame rate.
- Metered against the plan's hours.
- A WebRTC relay near the hub (for example go2rtc on the hub pushing to a managed SFU / TURN) keeps latency low. It only costs money while someone watches.

## Connecting a project

1. Flash the device and give it a device ID (for example `terra_001`). It publishes `tc/terra_001/sensors` every 10 s.
2. In the OS, go to **DIY Projects → Connect a project**:
   - Pick the project and enter the device ID.
   - For cameras and microphones, optionally enter the **local** stream URL, such as `http://192.168.1.50:81/stream`. A camera node that publishes `streamUrl` is picked up automatically.
3. The feed card shows the live readings (JSON only) and recent AI events.

   The OS is served over https, so browsers may block a plain-http LAN stream. The card then offers an **Open it directly** link, or you can use the OS from your local hub.
