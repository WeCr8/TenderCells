# Stock footage manifest

## Story cut v3 - expanded farm, robotics and STEM edit

Review export: `video-out/tender-cells-anthem-story-v3.mp4`. The 70-shot edit uses approximately 109 seconds of stock footage (49% of the film), intercut with the existing application captures. Original anthem audio and timing remain intact. No lyric captions are burned in.

New sources downloaded and reviewed on 2026-09-30:

| Local asset | Item page / creator | License | Edit use |
|---|---|---|---|
| rover-park-8566714.mp4 | [Outdoor rover](https://www.pexels.com/video/a-robot-rover-moving-around-a-park-8566714/) / Kindel Media | [Pexels](https://www.pexels.com/license/) | Outdoor path movement; S06, S47 |
| rover-wheels-8566727.mp4 | [Rover wheel detail](https://www.pexels.com/video/a-robot-rover-on-he-move-8566727/) / Kindel Media | Pexels | Wheel contact, steering, and tire match cuts; S14, S25, S48, S61 |
| tractor-tire-7456455.mp4 | [Farm machinery detail](https://www.pexels.com/video/close-up-footage-of-a-truck-7456455/) / Kindel Media | Pexels | Agricultural tread and wheel detail; S24, S42 |
| robot-mower-grass-42015.mp4 | [Robotic mower](https://pixabay.com/videos/lawn-mower-lawn-gardening-grass-42015/) / USA-Reiseblogger | [Pixabay Content License](https://pixabay.com/service/license-summary/) | Mower passes on grass and paving by its dock; S19, S41, S57 |
| goats-pasture-29711030.mp4 | [Goats in pasture](https://www.pexels.com/video/goats-grazing-in-a-sunny-pasture-29711030/) / The Instagrapher | Pexels | Broader livestock context; S21, S37, S65 |
| rabbit-grass-4377851.mp4 | [Rabbit grazing](https://www.pexels.com/video/close-up-shot-of-rabbit-feeding-on-the-grass-4377851/) / Zuzanna Musial | Pexels | Animal observation before the learning verse; S29 |
| harvest-lettuce-7456581.mp4 | [Harvesting vegetables](https://www.pexels.com/video/people-harvesting-vegetables-from-the-field-7456581/) / Kindel Media | Pexels | Hands-on farming between application scenes; S09, S32, S52, S67 |
| stem-robot-build-7868280-4k.mp4 | [Building robots](https://www.pexels.com/video/kids-building-robots-7868280/) / Vanessa Loring | Pexels | Hands, wiring and wheels; S22, S30, S45. The 4K source is cropped to its lower-left 1920x1080 region, excluding faces; the source shows a supervised classroom activity. |
| stem-circuit-5736195.mp4 | [Circuit work](https://www.pexels.com/video/a-close-up-shot-of-a-person-soldering-5736195/) / Wojciech | Pexels | Electronics detail completes the project-building story; S33 |

The education title is **4-H project ideas: observe, build, share**. It introduces possible activities, not an existing partnership or a claim that stock participants belong to 4-H. No 4-H emblem is used. Robotics stock is labeled as an outdoor robotics reference, separate from simulated Tender Cells footage. The mower and rover are third-party reference machines, not Tender Cells prototypes or evidence of tested terrain capabilities.

All new sources are 1080p or higher. Existing 720p farm establishing shots remain upscaled. Exact source offsets, crops and editorial titles are recorded in `anthem-cues.json` and `video-out/story-v3/edit.json`. The source footage stays outside Git.

The mower selections use `robot-mower-grass-42015-prepared.mp4`, prepared from the retained original with manufacturer badges obscured. Reproduce this input with `python scripts/video/prepare-mower-stock.py` (OpenCV, NumPy and ffmpeg); only the reviewed 20-33 second range is used. The preparation does not remove a stock-provider watermark.

Stock is optional B-roll. It supports the story without implying that a depicted person, school, farm, or brand endorses Tender Cells. Downloaded media stays outside Git under `video-out/stock/`; record each final clip here before publishing.

| Story beat | Preferred footage | Source | License | Status |
|---|---|---|---|---|
| Opening / whole property | Aerial movement across a working farm with livestock | [Pixabay farmland and livestock aerial](https://pixabay.com/videos/farmland-livestock-plot-drone-167740/) | Pixabay Content License | Candidate; not bundled |
| Kids learning | Adult-supervised robotics or electronics, without school branding | [Pexels robotics videos](https://www.pexels.com/search/videos/kids%20robotics/) | Pexels License | Candidate; verify context before use |
| Farmers and makers | Hands assembling electronics or inspecting crops | [Mixkit stock video](https://mixkit.co/free-stock-video/) | Mixkit Stock Video Free License only | Candidate; verify the individual clip is Free |

## Editorial rules

- Record the item page, creator, and license here before a clip enters the final cut.
- Do not show identifiable children without suitable releases and adult-supervised context.
- Do not imply that stock subjects use, own, recommend, or tested Tender Cells.
- Never use stock to prove a working Tender Cells feature. Product claims use captured demo footage labeled Simulation.
- Crop, grade, and intercut footage; never redistribute an unaltered source file.

## Future Farming marketing sequence — 2026-09-30

Used in the Premiere sequence `Tender Cells - Future Farming Marketing`. Item pages were checked individually for the Mixkit Stock Video Free License (commercial use); page snapshots are saved alongside downloaded sources in `video-out/stock/`. Individual creator names were not displayed on these item pages; provider: Mixkit. Sources are 720p, scaled to the 1080p sequence.

| Asset | Item page | License | Use |
|---|---|---|---|
| agriculture-field-from-above-820 | https://mixkit.co/free-stock-video/agriculture-field-from-above-820/ | Mixkit Stock Video Free License | Opening, future farming bridge, closing CTA |
| a-person-sowing-a-seed-2851 | https://mixkit.co/free-stock-video/a-person-sowing-a-seed-2851/ | Mixkit Stock Video Free License | Growing and hands-on farming |
| landscape-of-a-large-open-field-on-a-sunny-afternoon-21577 | https://mixkit.co/free-stock-video/landscape-of-a-large-open-field-on-a-sunny-afternoon-21577/ | Mixkit Stock Video Free License | Property context and closing montage |
| countryside-meadow-4075 | https://mixkit.co/free-stock-video/countryside-meadow-4075/ | Mixkit Stock Video Free License | Nature and farm context |
| hens-farm-12012874 | https://www.pexels.com/video/hens-in-farm-12012874/ | [Pexels License](https://www.pexels.com/license/) | Morning flock and animal-care context |
| chickens-roaming-34450566 | https://www.pexels.com/video/chickens-roaming-freely-on-a-rural-farm-34450566/ | [Pexels License](https://www.pexels.com/license/) | Flock context before the property map and final invitation |
| robot-arm-factory-32386532 | https://www.pexels.com/video/industrial-robot-arm-in-high-tech-factory-32386532/ | [Pexels License](https://www.pexels.com/license/) | General robotics context; never presented as Tender Cells hardware |

Tender Cells robotics remains existing application simulation footage with explicit simulation labeling. The industrial robot clip is illustrative context only and cuts into the application simulation; it is not presented as deployed Tender Cells hardware. Original sequence and anthem audio are preserved. The marketing overlays are on Video 2; exact placements are in `video-out/marketing/edit.json`.


## Story cut v2 - 2026-09-30

The exported `video-out/tender-cells-anthem-story-v2.mp4` uses the four previously downloaded Mixkit clips above plus [Ducks Gliding on Blue Water](https://mixkit.co/free-stock-video/ducks-gliding-on-blue-water-101500/). The duck item page explicitly permits commercial and personal use under the Mixkit Stock Video Free License; provider Mixkit, no individual creator displayed. Its page snapshot and 1080p source are saved in `video-out/stock/`. The previous four sources are 720p upscaled; the ducks source is 1080p.

Exact selections and source offsets are in `anthem-cues.json` (`stock`, `stockOffset`). Frame counts and source paths for the rendered cut are in `video-out/story-v2/edit.json`. Stock is labeled illustrative; captured application footage is labeled simulated. No stock robotics is presented as Tender Cells hardware. Source footage is used only within this edited song film.
