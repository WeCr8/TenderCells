# Demo video script: the Tender Cells Anthem

> Generated from [`anthem-cues.json`](anthem-cues.json) by `npm run video:cues` (in `tendercells-ui`). Edit the JSON, not this file.

**Song:** [Tender Cells Anthem](tender-cells-anthem.mp3) by wecr8. Length 3:44.9, about **129.2 BPM**, so one bar is 1.86 s. The first beat is at 0.37 s.

**Format:** 16:9, 1920×1080, 30 fps. The whole song is the video.

**Audio: the song only.** No voice-over, narration, app sounds or sound effects. There is no closed-caption or lyric overlay track; the song and moving pictures carry the story. Any spoken explanation belongs in a separate video.

**Rules for the edit:**
- **Every screen is the real demo** (`/app/demo` in the OS, or the website). Keep the "Simulation" / "simulated" labels visible. Never show a simulated robot as real hardware.
- **Cut on the downbeat.** Snap each cut to the nearest bar line in your editor.
- **Motion first.** Every UI take includes a deliberate orbit, push, scroll, pointer move, control change, or simulated event. Never hold a browser screenshot for a lyric.
- **No closed captions.** SRT/LRC/ASS files are timing references only and are not imported or burned into the film. Brief product-name or end-card graphics are editorial titles, not lyric transcription.
- **Timing.** Section starts follow the existing anthem edit. Cuts retain the established timing; lyric files are timing references only and are not included in the film.
- **No claims the product can't back up.** The bridge lyric "From California out to Texas" plays over the property map, with no pins or claims about where customers are.

## Files

| File | Use |
|---|---|
| `tender-cells-anthem.mp3` | The song (the master audio) |
| `tender-cells-anthem.srt` | Lyric timing reference only; do not import into the film |
| `tender-cells-anthem.lrc` | Timed lyrics |
| `tender-cells-anthem.ass` | Lyrics plus on-screen titles, styled in the brand colours (ffmpeg / Aegisub) |
| `anthem-markers.csv` | Section and shot markers with 30 fps timecodes |

To record every motion take and assemble a caption-free review film with the song, run `npm run video:shots` and then `npm run video:roughcut` (see the end of this page).

## Story

Care -> observe -> build -> apply -> return to the farm. Hens, ducks, goats and rabbits alternate with care and mapping views. Outdoor rovers, wheel details and a robotic mower on grass and paving make movement tangible. The 4-H project-ideas verse links animal observation, DIY planning, hands-on robotics and circuit work. Harvesting brings the story back to people and land before the application invitation. Stock illustrates these ideas; it is not Tender Cells hardware, customer footage, or an affiliated 4-H program.

Stock clips and source takes are specified per shot in the JSON. Render the stock-inclusive story cut with `python scripts/video/render-story.py` from the repository root.

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
| 0:00.0–0:07.1 | *(instrumental)* | S01 | Stock: agriculture-field-from-above-820.mp4 | Official Tender Cells logo / BUILDING THE FUTURE OF ANIMAL CARE | Open on the official Tender Cells brand card, dissolve into real farmland, then reveal the digital twin so the application feels grounded in the work it supports. |
| 0:07.1–0:14.2 | *(instrumental)* | S02 | OS `/demo` · hero2d | Your whole property in 2D and 3D | Reveal the 2D property plan while four bordered story windows enter sequentially: hens, ducks, an outdoor rover and hands-on STEM robotics. |

## Verse 1 (0:14.2–0:48.3)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:14.2–0:18.5 | Sun comes up and the birds wake too | S03 | Stock: hens-farm-12012874.mp4 |  | Real hens moving through a farmyard at first light: establish who the system is built to care for. |
| 0:18.5–0:22.7 | Got a smarter way to do what farmers do | S04 | OS `/schedules` | Doors, feed, water and cleaning on schedules | Schedules list. |
| 0:22.7–0:27.0 | Feeders running, gates all clear | S05 | OS `/chicken-tender?section=feed` | Feed and water levels - demo data | Feeding & Water section. |
| 0:27.0–0:31.3 | Tender Cells is working while we're drinking beer | S06 | Stock: rover-park-8566714.mp4 |  | An outdoor rover moves along a park path; connect the care schedule to the idea of movement across a property. |
| 0:31.3–0:35.5 | Chickens happy, ducks in line | S07 | Stock: chickens-roaming-34450566.mp4 |  | Free-roaming chickens connect the flock data to real animal life before the property map appears. |
| 0:35.5–0:39.8 | Everything's connected and running fine | S08 | OS `/layout` · viewer2d | Everything connected on one map | 2D top view of the whole property with the boundary line. |
| 0:39.8–0:44.0 | Open source and built to share | S09 | Stock: harvest-lettuce-7456581.mp4 |  | Hands harvest greens between the property map and the digital twin: the map serves everyday farm work. |
| 0:44.0–0:48.3 | Growing the future everywhere | S10 | OS `/demo` · hero3d |  | Reveal the same property in 3D: the digital twin gives the map a spatial purpose. |

## Pre-chorus 1 (0:48.3–0:56.1)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:48.3–0:50.3 | From the backyard coop | S11 | OS `/chicken-tender?section=coop` | From the backyard coop… | Coop close-up. |
| 0:50.3–0:52.2 | To the family farm | S12 | Stock: landscape-of-a-large-open-field-on-a-sunny-afternoon-21577.mp4 |  | Widen from an individual enclosure to the land around it. |
| 0:52.2–0:54.2 | Technology and care | S13 | OS `/chicken-eye` | Explore the vision dashboard | ChickenEye AI vision. |
| 0:54.2–0:56.1 | Working arm in arm | S14 | Stock: rover-wheels-8566727.mp4 |  | Low wheel-level view of an outdoor rover: show tire contact and steering before the product chorus. |

## Chorus 1 (0:56.1–1:31.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 0:56.1–0:58.0 | Hey! Tender Cells, let's go! | S15 | OS `/demo` · hero3d | TENDER CELLS — LET'S GO! | Big title slam on the downbeat over the 3D farm. |
| 0:58.0–1:01.7 | Chicken Tender keeps the flock alright | S16 | OS `/chicken-tender?section=coop` | Chicken Tender™ | Open on the Chicken Tender dashboard, then cut inside the same beat to the real flock behind the care workflow. |
| 1:01.7–1:05.4 | Duck Dock keeps the water shining bright | S17 | Stock: ducks-gliding-on-blue-water-101500.mp4 |  | Real ducks on water give Duck Dock a living context; the later watershed view returns to the application. |
| 1:05.4–1:09.1 | Roaming Roost moving through the field | S18 | OS `/roaming-roost` | Roaming Roost™ | Roaming Roost dashboard (3D viewer shows it moving). |
| 1:09.1–1:12.8 | Future farming's finally been revealed | S19 | Stock: robot-mower-grass-42015-prepared.mp4 |  | A robotic mower rolls across grass after the Roaming Roost simulation; show a different outdoor surface as general robotics context. |
| 1:12.8–1:16.5 | Hey! Everybody sing along | S20 | OS `/missions` | Missions for kids and families | Missions page. |
| 1:16.5–1:20.2 | Tender Cells all day long | S21 | Stock: goats-pasture-29711030.mp4 |  | Goats grazing broaden the animal-care story beyond poultry, following the missions view. |
| 1:20.2–1:23.9 | Teaching kids and helping farms | S22 | Stock: stem-robot-build-7868280-4k.mp4 |  | Hands adjust wiring on a small wheeled robot, connecting practical STEM learning to the robot-arm workflow. |
| 1:23.9–1:27.6 | Building better barns and robot arms | S23 | OS `/chicken-tender?section=robot` | 6DOF arm + XYZ gantry (simulated) | Robot Arm section. |
| 1:27.6–1:29.5 | Tender Cells! Whoa-oh-oh! | S24 | Stock: tractor-tire-7456455.mp4 |  | A tight farm-tire detail starts a match cut from agricultural tread to small rover wheels. |
| 1:29.5–1:31.4 | Tender Cells! Whoa-oh-oh! | S25 | Stock: rover-wheels-8566727.mp4 |  | Match the tractor tire to outdoor rover wheels rolling on pavement, then return to egg records. |

## Verse 2 (1:31.4–2:05.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 1:31.4–1:35.7 | Eggs get counted, data flows | S26 | OS `/egg-map` | Egg Map - demo records | Read the Egg Map briefly, then return to hens before the next sensor workflow. |
| 1:35.7–1:39.9 | Every day the system grows | S27 | Stock: hens-farm-12012874.mp4 |  | Return from the egg map to real hens: connect the recorded care task to the flock. |
| 1:39.9–1:44.2 | Sensors watching day and night | S28 | OS `/sensors` | Sensor readings - demo data | Sensors. |
| 1:44.2–1:48.4 | Keeping every animal safe and right | S29 | Stock: rabbit-grass-4377851.mp4 |  | Observe a rabbit grazing before the learning sequence; caring starts with looking closely at an animal. |
| 1:48.4–1:52.7 | 4-H kids are learning too | S30 | Stock: stem-robot-build-7868280-4k.mp4 | 4-H project ideas: observe, build, share | 4-H project ideas: connect animal observation to hands-on robotics. Use a non-identifying hands-and-robot crop of a supervised classroom activity; these are illustrative project ideas, not footage of a named 4-H club. |
| 1:52.7–1:56.9 | Building things and seeing them through | S31 | OS `/projects` | Build it yourself | Move from the DIY Projects page into close circuit work within the same beat. |
| 1:56.9–2:01.2 | Makers, farmers, engineers | S32 | Stock: harvest-lettuce-7456581.mp4 |  | Return from project planning to harvesting: show the practical farm work that inspires the build. |
| 2:01.2–2:05.4 | Creating tomorrow through the years | S33 | Stock: stem-circuit-5736195.mp4 | From curiosity to a working circuit | Close circuit-board work completes the observe, plan, build sequence before the open-source resources. |

## Pre-chorus 2 (2:05.4–2:13.1)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:05.4–2:07.3 | Open source dreams | S34 | Website `/open-source` |  | Open-source resources show where makers can participate. |
| 2:07.3–2:09.3 | Built by many hands | S35 | Stock: a-person-sowing-a-seed-2851.mp4 |  | Human hands connect the open-source idea to practical work. |
| 2:09.3–2:11.2 | Sharing knowledge | S36 | OS `/library` | Animal & plant library | Library. |
| 2:11.2–2:13.1 | Across the lands | S37 | Stock: goats-pasture-29711030.mp4 |  | After the animal library, return to goats in pasture to reconnect learning with everyday care. |

## Chorus 2 (2:13.1–2:49.7)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:13.1–2:15.0 | Hey! Tender Cells, let's go! | S38 | OS `/layout` · viewer | TENDER CELLS — LET'S GO! | Title slam over the Property Twin viewer. |
| 2:15.0–2:18.7 | Chicken Tender keeps the flock alright | S39 | OS `/chicken-tender?section=eggs` | Chicken Tender™ | Egg Map section. |
| 2:18.7–2:22.4 | Duck Dock keeps the water shining bright | S40 | OS `/watershed` | Duck Dock™ · water | Watershed & drainage (water on the map). |
| 2:22.4–2:26.1 | Roaming Roost moving through the field | S41 | Stock: robot-mower-grass-42015-prepared.mp4 |  | A close outdoor mower pass across grass adds physical movement between the water map and farm machinery detail; label as stock robotics reference. |
| 2:26.1–2:29.8 | Future farming's finally been revealed | S42 | Stock: tractor-tire-7456455.mp4 |  | Farm machinery and tread texture bridge physical terrain into the simulated event-and-response workflow. |
| 2:29.8–2:33.5 | Hey! Everybody sing along | S43 | OS `/simulator` · trigger | Trigger an event | Trigger the simulated predator response, then cut to chickens outdoors to show who the response is designed to protect. |
| 2:33.5–2:37.2 | Tender Cells all day long | S44 | OS `/mowers` | Explore supported mower integrations | Introduce mower integrations in the application, then show a robot mower moving on grass. |
| 2:37.2–2:40.9 | Teaching kids and helping farms | S45 | Stock: stem-robot-build-7868280-4k.mp4 | Build. Test. Learn together. | Return to the student-built robot: inspecting wheels and sensors connects STEM projects to the application robotics pages. |
| 2:40.9–2:44.6 | Building better barns and robot arms | S46 | OS `/weed-patrol` | Weed patrol robots | Weed Patrol. |
| 2:44.6–2:47.2 | Tender Cells! Whoa-oh-oh! | S47 | Stock: rover-park-8566714.mp4 |  | Outdoor rover movement continues the robotics story after Weed Patrol. |
| 2:47.2–2:49.7 | Tender Cells! Whoa-oh-oh! | S48 | Stock: rover-wheels-8566727.mp4 |  | Cut down to the moving wheels before returning to the simulated arm and vision views. |

## Bridge (2:49.7–3:14.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 2:49.7–2:52.8 | Robot arm picking eggs today | S49 | OS `/chicken-tender?section=robot` | Robot arm workflow - simulated | Robot Arm section. |
| 2:52.8–2:55.9 | Computer vision leads the way | S50 | OS `/chicken-eye` | Vision dashboard - demo | ChickenEye. |
| 2:55.9–2:59.0 | Solar power, sensors too | S51 | OS `/predator-monitor` | WatchTower and sensor workflow - demo | WatchTower. |
| 2:59.0–3:02.1 | There's nothing that we cannot do | S52 | Stock: harvest-lettuce-7456581.mp4 |  | After sensors and vision, show a real harvest as the human purpose behind the engineering. |
| 3:02.1–3:05.1 | From California out to Texas | S53 | OS `/layout` · viewer2d | Your property, your boundary | 2D map with the property boundary. No map pins or claims about where users are. |
| 3:05.1–3:08.2 | Helping every farmer next us | S54 | OS `/mowers` | Supported integrations; setup required | Show the supported-integration view, then cut immediately to outdoor mower movement before the small-beginnings farming beat. |
| 3:08.2–3:11.3 | Big ideas from small beginnings | S55 | Stock: a-person-sowing-a-seed-2851.mp4 |  | Small beginnings: one seed and one practical task. |
| 3:11.3–3:14.4 | Tender Cells is just beginning | S56 | OS `/demo` · hero3d |  | Return to the simulated twin: this is the application viewers can explore. |

## Break (3:14.4–3:18.4)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:14.4–3:18.4 | *(instrumental)* | S57 | Stock: robot-mower-grass-42015-prepared.mp4 |  | A moving mower crosses grass and paving at its dock, leading into the final montage. |

## Final chorus (3:18.4–3:40.3)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:18.4–3:19.3 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S58 | OS `/chicken-tender?section=coop` | CHICKEN TENDER! |  |
| 3:19.3–3:20.2 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S59 | Stock: ducks-gliding-on-blue-water-101500.mp4 |  | Brief duck cutaway on the Duck Dock callout. |
| 3:20.2–3:21.1 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S60 | OS `/roaming-roost` | ROAMING ROOST! |  |
| 3:21.1–3:22.1 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S61 | Stock: rover-wheels-8566727.mp4 |  | A quick wheel-level outdoor motion accent. |
| 3:22.1–3:23.0 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S62 | OS `/chicken-tender?section=robot` | CHICKEN TENDER! |  |
| 3:23.0–3:23.9 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S63 | Stock: ducks-gliding-on-blue-water-101500.mp4 |  | Return to real ducks on the repeated Duck Dock callout. |
| 3:23.9–3:24.8 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S64 | OS `/layout` · viewer | ROAMING ROOST! |  |
| 3:24.8–3:25.7 | Chicken Tender! Duck Dock! Roaming Roost! Don't stop! | S65 | Stock: goats-pasture-29711030.mp4 |  | A quick pasture beat expands the final animal montage. |
| 3:25.7–3:29.4 | Tender Cells! Building the future one flock at a time! | S66 | OS `/demo` · hero3d | Explore your farm in 2D and 3D | Use the 3D property as the center of a four-corner recap: goats, rabbit care, harvesting and an outdoor mower appear in sequence. |
| 3:29.4–3:33.0 | Tender Cells! Building the future one flock at a time! | S67 | Stock: harvest-lettuce-7456581.mp4 |  | Close with the harvest before returning to the flock and the final application invitation. |
| 3:33.0–3:36.7 | Whoa-oh-oh-oh! Tender Cells! | S68 | Stock: chickens-roaming-34450566.mp4 |  | Return to the flock before the final invitation, completing the journey from animals to application and back. |
| 3:36.7–3:40.3 | Whoa-oh-oh-oh! Tender Cells! | S69 | OS `/demo` · hero3d | TENDER CELLS |  |

## Outro / end card (3:40.3–3:44.9)

| Time | Lyric | Shot | Screen | On-screen text | Visual |
|---|---|---|---|---|---|
| 3:40.3–3:44.9 | *(instrumental)* | S70 | Title card | Official Tender Cells logo / BUILDING THE FUTURE, ONE FLOCK AT A TIME / tendercells.com/app/demo / WeCr8 Solutions | Resolve on a clean official-logo end card with an inspiring line, application invitation, URL, and WeCr8 Solutions credit; fade to black on the final frames. |

## Capture and rough cut

```bash
# In applications/tendercells_ui/test_output/tendercells-ui, with the OS on :5173 and the website on :5176:
npm run video:shots      # records one clip per shot (Playwright, 1920x1080) into video-out/shots/
npm run video:roughcut   # trims motion clips and adds the song only -> video-out/tender-cells-anthem-film.mp4
```

Screen actions used above:

| Action | What it does |
|---|---|
| `page` | Open the page and perform a smooth editorial scroll or pointer move. |
| `hero3d` / `hero2d` | The simulated Property Twin at the top of `/demo`, in 3D or 2D. |
| `viewer` / `viewer2d` | The page's 3D viewer, with the autonomous-farm panel, in 3D or 2D top view. |
| `trigger` | The event simulator runs its predator event. |

Instrumental cards (`CARD`) use the rendered 3D property film in the automated cut. Add only a minimal opening identity and final URL in Premiere Pro.
