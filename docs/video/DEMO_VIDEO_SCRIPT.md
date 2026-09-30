# Demo video script: the Tender Cells Anthem

> Generated from [`anthem-cues.json`](anthem-cues.json) by `npm run video:cues` (in `tendercells-ui`). Edit the JSON, not this file.

**Song:** [Tender Cells Anthem](tender-cells-anthem.mp3) by wecr8. Length 3:44.9, about **129.2 BPM**, so one bar is 1.86 s. The first beat is at 0.37 s.

**Format:** 16:9, 1920×1080, 30 fps. The whole song is the video. There is no voice-over: the lyrics carry it, and the on-screen titles name what is shown.

**Rules for the edit:**
- **Every screen is the real demo** (`/app/demo` in the OS, or the website). Keep the "Simulation" / "simulated" labels visible. Never show a simulated robot as real hardware.
- **Cut on the downbeat.** Snap each cut to the nearest bar line in your editor.
- **Timing.** Section starts come from audio analysis (repeated sections matched: chorus 0:56.1 = 2:13.1, pre-chorus 0:48.3 = 2:05.4, verse 0:14.2 = 1:31.4; final chorus 3:18.4). Line times inside a section are spread evenly - nudge each caption to the vocal in the editor.
- **No claims the product can't back up.** The bridge lyric "From California out to Texas" plays over the property map, with no pins or claims about where customers are.

## Files

| File | Use |
|---|---|
| `tender-cells-anthem.mp3` | The song (the master audio) |
| `tender-cells-anthem.srt` | Lyric captions: import into Premiere, Resolve, CapCut or YouTube |
| `tender-cells-anthem.lrc` | Timed lyrics |
| `tender-cells-anthem.ass` | Lyrics plus on-screen titles, styled in the brand colours (ffmpeg / Aegisub) |
| `anthem-markers.csv` | Section and shot markers with 30 fps timecodes |

To capture every shot from the demo and assemble a rough cut with the song and captions burned in, run `npm run video:shots` and then `npm run video:roughcut` (see the end of this page).

## Song structure

| Section | Start | End | Length |
|---|---|---|---|
| Intro (instrumental) | 0:00.0 | 0:14.2 | 14.2 s |
| Verse 1 | 0:14.2 | 0:48.3 | 34.1 s |
| Pre-chorus 1 | 0:48.3 | 0:56.1 | 7.8 s |
| Chorus 1 | 0:56.1 | 1:31.4 | 35.3 s |
| Verse 2 | 1:31.4 | 2:05.4 | 34.0 s |
| Pre-chorus 2 | 2:05.4 | 2:13.1 | 7.7 s |
| Chorus 2 | 2:13.1 | 2:49.7 | 36.6 s |
| Bridge | 2:49.7 | 3:14.4 | 24.7 s |
| Break | 3:14.4 | 3:18.4 | 4.0 s |
| Final chorus | 3:18.4 | 3:40.3 | 21.9 s |
| Outro / end card | 3:40.3 | 3:44.9 | 4.6 s |

## Intro (instrumental) (0:00.0–0:14.2)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:00.0–0:07.1 | *(instrumental)* | S01 | OS `/demo` · hero3d | TENDER CELLS / The Tender Cells Anthem | Open on the live 3D demo farm (landing hero). Slow push-in; the autopilot panel shows every unit working. |
| 0:07.1–0:14.2 | *(instrumental)* | S02 | OS `/demo` · hero2d | Your whole property in 2D and 3D | Same hero, flip to 2D top-down plan on the downbeat at 0:07.1. |

## Verse 1 (0:14.2–0:48.3)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:14.2–0:18.5 | Sun comes up and the birds wake too | S03 | OS `/chicken-tender?section=coop` | 6:30 AM · coop door opens on schedule | Chicken Tender coop dashboard: temperature, humidity, occupancy. |
| 0:18.5–0:22.7 | Got a smarter way to do what farmers do | S04 | OS `/schedules` | Doors, feed, water and cleaning on schedules | Schedules list. |
| 0:22.7–0:27.0 | Feeders running, gates all clear | S05 | OS `/chicken-tender?section=feed` | Feed and water levels, live | Feeding & Water section. |
| 0:27.0–0:31.3 | Tender Cells is working while we're drinking beer | S06 | OS `/layout` · viewer | Autonomous farm · simulated | 3D viewer with the autopilot panel: rover, mower and Roaming Roost moving. Optional real b-roll: owner relaxing on the porch with the app. |
| 0:31.3–0:35.5 | Chickens happy, ducks in line | S07 | OS `/flock` | Every bird has a profile | Flock roster. |
| 0:35.5–0:39.8 | Everything's connected and running fine | S08 | OS `/layout` · viewer2d | Everything connected on one map | 2D top view of the whole property with the boundary line. |
| 0:39.8–0:44.0 | Open source and built to share | S09 | Website `/open-source` | Open source · github.com/WeCr8/TenderCells | Website open-source page (or a screen capture of the GitHub repo). |
| 0:44.0–0:48.3 | Growing the future everywhere | S10 | Website `/digital-twin` | A digital twin of your farm | Website digital-twin page. |

## Pre-chorus 1 (0:48.3–0:56.1)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:48.3–0:50.3 | From the backyard coop | S11 | OS `/chicken-tender?section=coop` | From the backyard coop… | Coop close-up. |
| 0:50.3–0:52.2 | To the family farm | S12 | OS `/demo` · hero3d | …to the family farm | Wide 3D farm. |
| 0:52.2–0:54.2 | Technology and care | S13 | OS `/chicken-eye` | Vision that watches over the flock | ChickenEye AI vision. |
| 0:54.2–0:56.1 | Working arm in arm | S14 | OS `/chicken-tender?section=robot` | Robot arm + gantry | Robot Arm section. |

## Chorus 1 (0:56.1–1:31.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:56.1–0:58.0 | Hey! Tender Cells, let's go! | S15 | OS `/demo` · hero3d | TENDER CELLS — LET'S GO! | Big title slam on the downbeat over the 3D farm. |
| 0:58.0–1:01.7 | Chicken Tender keeps the flock alright | S16 | OS `/chicken-tender?section=coop` | Chicken Tender™ | Chicken Tender dashboard. |
| 1:01.7–1:05.4 | Duck Dock keeps the water shining bright | S17 | OS `/duck-dock` | Duck Dock™ | Duck Dock dashboard. |
| 1:05.4–1:09.1 | Roaming Roost moving through the field | S18 | OS `/roaming-roost` | Roaming Roost™ | Roaming Roost dashboard (3D viewer shows it moving). |
| 1:09.1–1:12.8 | Future farming's finally been revealed | S19 | OS `/demo` · hero3d | Tender Cells OS | Whole farm in 3D. |
| 1:12.8–1:16.5 | Hey! Everybody sing along | S20 | OS `/missions` | Missions for kids and families | Missions page. |
| 1:16.5–1:20.2 | Tender Cells all day long | S21 | OS `/dashboard` | Automations day and night | Command Center dashboard. |
| 1:20.2–1:23.9 | Teaching kids and helping farms | S22 | Website `/4h` | 4-H · FFA · schools | Website 4-H page. |
| 1:23.9–1:27.6 | Building better barns and robot arms | S23 | OS `/chicken-tender?section=robot` | 6DOF arm + XYZ gantry (simulated) | Robot Arm section. |
| 1:27.6–1:29.5 | Tender Cells! Whoa-oh-oh! | S24 | OS `/demo` · hero3d |  | Whoa 1: 3D. |
| 1:29.5–1:31.4 | Tender Cells! Whoa-oh-oh! | S25 | OS `/demo` · hero2d |  | Whoa 2: 2D. |

## Verse 2 (1:31.4–2:05.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 1:31.4–1:35.7 | Eggs get counted, data flows | S26 | OS `/egg-map` | Egg Map · eggs counted automatically | Egg Map. |
| 1:35.7–1:39.9 | Every day the system grows | S27 | OS `/products` | One OS, many product families | Products & Devices. |
| 1:39.9–1:44.2 | Sensors watching day and night | S28 | OS `/sensors` | Sensors, day and night | Sensors. |
| 1:44.2–1:48.4 | Keeping every animal safe and right | S29 | OS `/predator-monitor` | WatchTower AI · predator watch | WatchTower dashboard / camera views. |
| 1:48.4–1:52.7 | 4-H kids are learning too | S30 | Website `/science-fair` | Projects for 4-H and science fairs | Website science-fair page. |
| 1:52.7–1:56.9 | Building things and seeing them through | S31 | OS `/projects` | Build it yourself | DIY projects. |
| 1:56.9–2:01.2 | Makers, farmers, engineers | S32 | Website `/developers` | Makers · farmers · engineers | Website developers page. |
| 2:01.2–2:05.4 | Creating tomorrow through the years | S33 | Website `/os` | Tender Cells OS | Website OS page. |

## Pre-chorus 2 (2:05.4–2:13.1)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:05.4–2:07.3 | Open source dreams | S34 | Website `/open-source` | Open source | Open-source page. |
| 2:07.3–2:09.3 | Built by many hands | S35 | Website `/os` | Built by many hands | Website OS page, build section. |
| 2:09.3–2:11.2 | Sharing knowledge | S36 | OS `/library` | Animal & plant library | Library. |
| 2:11.2–2:13.1 | Across the lands | S37 | OS `/demo` · hero3d |  | Wide 3D farm. |

## Chorus 2 (2:13.1–2:49.7)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:13.1–2:15.0 | Hey! Tender Cells, let's go! | S38 | OS `/layout` · viewer | TENDER CELLS — LET'S GO! | Title slam over the Property Twin viewer. |
| 2:15.0–2:18.7 | Chicken Tender keeps the flock alright | S39 | OS `/chicken-tender?section=eggs` | Chicken Tender™ | Egg Map section. |
| 2:18.7–2:22.4 | Duck Dock keeps the water shining bright | S40 | OS `/watershed` | Duck Dock™ · water | Watershed & drainage (water on the map). |
| 2:22.4–2:26.1 | Roaming Roost moving through the field | S41 | OS `/layout` · viewer2d | Roaming Roost™ | 2D top view: roost loop inside the boundary. |
| 2:26.1–2:29.8 | Future farming's finally been revealed | S42 | OS `/demo` · hero3d | Future farming | Whole farm in 3D. |
| 2:29.8–2:33.5 | Hey! Everybody sing along | S43 | OS `/simulator` · trigger | Trigger an event | Event simulator: predator event runs its chain. |
| 2:33.5–2:37.2 | Tender Cells all day long | S44 | OS `/mowers` | Bring your own robot mower | Mowers page. |
| 2:37.2–2:40.9 | Teaching kids and helping farms | S45 | Website `/schools` | Teaching kids and helping farms | Website schools page. |
| 2:40.9–2:44.6 | Building better barns and robot arms | S46 | OS `/weed-patrol` | Weed patrol robots | Weed Patrol. |
| 2:44.6–2:47.2 | Tender Cells! Whoa-oh-oh! | S47 | OS `/layout` · viewer |  | Whoa 1. |
| 2:47.2–2:49.7 | Tender Cells! Whoa-oh-oh! | S48 | OS `/demo` · hero2d |  | Whoa 2. |

## Bridge (2:49.7–3:14.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:49.7–2:52.8 | Robot arm picking eggs today | S49 | OS `/chicken-tender?section=robot` | Robot arm · simulated today | Robot Arm section. |
| 2:52.8–2:55.9 | Computer vision leads the way | S50 | OS `/chicken-eye` | Computer vision | ChickenEye. |
| 2:55.9–2:59.0 | Solar power, sensors too | S51 | OS `/predator-monitor` | Solar WatchTower + sensors | WatchTower. |
| 2:59.0–3:02.1 | There's nothing that we cannot do | S52 | OS `/weed-patrol` |  | Weed Patrol. |
| 3:02.1–3:05.1 | From California out to Texas | S53 | OS `/layout` · viewer2d | Your property, your boundary | 2D map with the property boundary. No map pins or claims about where users are. |
| 3:05.1–3:08.2 | Helping every farmer next us | S54 | OS `/mowers` | Works with the gear you already have | Mowers page. |
| 3:08.2–3:11.3 | Big ideas from small beginnings | S55 | OS `/projects` | Big ideas, small beginnings | DIY projects. |
| 3:11.3–3:14.4 | Tender Cells is just beginning | S56 | Website `/digital-twin` | Just beginning | Digital-twin page. |

## Break (3:14.4–3:18.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:14.4–3:18.4 | *(instrumental)* | S57 | Title card | Chicken Tender · Duck Dock · Roaming Roost | Break: hold on black, three product names build in on the beats. |

## Final chorus (3:18.4–3:40.3)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:18.4–3:19.3 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S58 | OS `/chicken-tender?section=coop` | CHICKEN TENDER! |  |
| 3:19.3–3:20.2 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S59 | OS `/duck-dock` | DUCK DOCK! |  |
| 3:20.2–3:21.1 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S60 | OS `/roaming-roost` | ROAMING ROOST! |  |
| 3:21.1–3:22.1 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S61 | OS `/demo` · hero3d | DON'T STOP! |  |
| 3:22.1–3:23.0 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S62 | OS `/chicken-tender?section=robot` | CHICKEN TENDER! |  |
| 3:23.0–3:23.9 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S63 | OS `/duck-dock` | DUCK DOCK! |  |
| 3:23.9–3:24.8 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S64 | OS `/layout` · viewer | ROAMING ROOST! |  |
| 3:24.8–3:25.7 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S65 | OS `/demo` · hero2d | DON'T STOP! |  |
| 3:25.7–3:29.4 | Tender Cells! Building the future one flock at a time! | S66 | OS `/demo` · hero3d | Building the future, one flock at a time | Whole farm in 3D. |
| 3:29.4–3:33.0 | Tender Cells! Building the future one flock at a time! | S67 | OS `/layout` · viewer |  |  |
| 3:33.0–3:36.7 | Whoa-oh-oh-oh! Tender Cells! | S68 | OS `/demo` · hero2d |  |  |
| 3:36.7–3:40.3 | Whoa-oh-oh-oh! Tender Cells! | S69 | OS `/demo` · hero3d | TENDER CELLS |  |

## Outro / end card (3:40.3–3:44.9)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:40.3–3:44.9 | *(instrumental)* | S70 | Title card | tendercells.com/demo / Open source on GitHub · WeCr8 Solutions | End card on black. |

## Capture and rough cut

```bash
# In applications/tendercells_ui/test_output/tendercells-ui, with the OS on :5173 and the website on :5176:
npm run video:shots      # records one clip per shot (Playwright, 1920x1080) into video-out/shots/
npm run video:roughcut   # trims the clips to the script, adds the song + lyrics + titles -> video-out/anthem-rough-cut.mp4
```

Screen actions used above:

| Action | What it does |
|---|---|
| `page` | Open the page, as it is. |
| `hero3d` / `hero2d` | The live Property Twin at the top of `/demo`, in 3D or 2D. |
| `viewer` / `viewer2d` | The page's 3D viewer, with the autonomous-farm panel, in 3D or 2D top view. |
| `trigger` | The event simulator runs its predator event. |

Title cards (`CARD`) are made in the editor. The rough cut shows them as text on black.
