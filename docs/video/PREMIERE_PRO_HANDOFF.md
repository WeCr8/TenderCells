# Premiere Pro handoff

## Current cut: Story v3

Watch `video-out/tender-cells-anthem-story-v3.mp4`: the actual updated 1920x1080, 30 fps film with the original anthem. It adds nine source clips, changes 27 shot selections, and gives approximately half the runtime to farm, animal, outdoor robotics and STEM footage. Prior exports remain available.

The story now alternates animal care with application workflows, connects outdoor rover movement to tire details and a mower on grass/paving, and develops the 4-H project-ideas verse through observation, planning, robot building and circuit work. Brief education titles are editorial context; there is no lyric-caption track.

Rebuild with `python scripts/video/render-story.py` from the repository root. Edit `anthem-cues.json`, then regenerate the matching script and markers with `node applications/tendercells_ui/test_output/tendercells-ui/scripts/video/anthem-cues.mjs`.

For an editable Premiere sequence, use `assemble-tender-cells-story-v3.jsx` with the existing Premiere script bridge, or import `video-out/story-v3/S01.mp4` through `S70.mp4` in filename order and place `docs/video/tender-cells-anthem.mp3` at frame zero. This new assembly targets the v3 renders; the older JSX targets the earlier cut. `video-out/story-v3/edit.json` contains exact frame counts, source offsets, crops and labels. Assembly clips have baked editorial graphics; the original downloaded sources and JSON retain the inputs for changing them.

Stock sources, creators, licenses and the distinction between illustrative learning footage and an affiliated 4-H program are documented in `STOCK_FOOTAGE_MANIFEST.md`.

The automated review render is `video-out/tender-cells-anthem-film.mp4`. Editable takes are in `video-out/shots/`; exact song and shot timing is in `anthem-markers.csv` and `anthem-cues.json`.

For a quick editable Premiere assembly, run `assemble-tender-cells-anthem.jsx` from Premiere Pro using **File > Scripts > Run Script File...**. It imports the generated `video-out/segments/S01.mp4` through `S70.mp4`, places `tender-cells-anthem.mp3`, and adds section markers.

## Sequence setup

1. Create a 1920x1080, 30 fps sequence.
2. Import `tender-cells-anthem.mp3`, the `video-out/shots/*.webm` takes, `tendercells-threejs-demo.mp4`, and approved B-roll from `STOCK_FOOTAGE_MANIFEST.md`.
3. Put the song at 00:00:00:00. Use `anthem-markers.csv` for section and cut timecodes.
4. Keep UI and 3D footage on the primary story track. Use human and farm B-roll only for emotional context and transitions.
5. Do not add a subtitle or closed-caption track. Do not import the SRT, LRC, or ASS files.
6. Product-name graphics may appear briefly at the opening, end, or a chorus hit; they must not transcribe lyrics.
7. Export H.264, 1920x1080, 30 fps, VBR 2-pass at 18-25 Mb/s, AAC 256 kb/s, with fast start enabled.


## Story cut v2

Review export: `video-out/tender-cells-anthem-story-v2.mp4` (1080p, 30 fps, original anthem audio, no subtitle track). This is a separate export; the earlier film and marketing edit remain available.

Rebuild from the repository root with `python scripts/video/render-story.py`. Requires ffmpeg, ffprobe and Pillow (`python -m pip install Pillow`), the existing `video-out/segments/S*.mp4` captures, and the stock sources listed in the manifest. The renderer fails if an asset is missing. `anthem-cues.json` is the source of truth for stock selections, offsets and reuse of captured shots. Some reused demo takes are slowed slightly to fill their slots.

Import `video-out/story-v2/S01.mp4` through `S70.mp4` in filename order onto a 30 fps sequence and place the original anthem at zero. `video-out/story-v2/edit.json` records frame counts and source selections. These clips contain editorial context labels and five brief titles; no lyric captions. Use this folder for v2 rather than the earlier assembly JSX, which targets the original segments.

The story opens with real land, introduces its simulated twin, connects care views and robot workflows, returns to animal life, then holds the application URL. Stock is atmosphere rather than proof of product operation. The invitation is `tendercells.com/app/demo`.

The opening and ending use the official `tender_cells_logo.png` asset. The opening holds the logo and the line “Building the future of animal care,” then dissolves into the farm aerial. The ending holds the logo, “Building the future, one flock at a time,” the application URL and “An open-source project by WeCr8 Solutions.” Keep these cards full-frame and uncluttered; do not place stock-license or simulation labels over the brand lockups.
