# DoorCell V1.4 Print Settings

## Recommended Materials

| Material | Use |
| --- | --- |
| PETG | Best general DIY choice |
| ASA | Best outdoor choice if printer supports it |
| ABS | Good but needs enclosure |
| Nylon | Best rack/pinion wear surface |
| PETG-CF | Good stiff rack/pinion option |
| PLA+ | Bench testing only |

## General Settings

- Layer height: 0.2 mm
- Walls: 4 to 6
- Top/bottom layers: 5 to 7
- Infill: 35% to 50% gyroid or cubic
- Rack strip infill: 60% to 80%
- Pinion infill: 80% to 100%
- Nozzle: 0.4 mm or 0.6 mm
- Heat-set inserts: use modeled holes, install after print

## Print Bed Fit

The V1.4 frame is split for common print beds:

| Printer Class | Typical Bed | Fit |
| --- | ---: | --- |
| Ender 3 / Ender V3 | 220 x 220 mm | Yes |
| Prusa MK3/MK4 | 250 x 210 mm | Yes |
| Bambu A1/P1/X1 | 256 x 256 mm | Yes |
| Most 220-250 mm hobby printers | 220-250 mm class | Yes |

The longest nominal frame section is about 184 mm. The sliding door is split into four printable sections so it also fits common 220 mm beds.

## Orientation

| Part | Orientation |
| --- | --- |
| Frame rails | Flat on back face |
| Frame jamb sections | Flat on back face |
| Door halves | Flat, outside face down |
| Rack strip | Teeth up if supported well, or teeth sideways for strength testing |
| Pinion | Flat on gear face |
| Motor mount | Back face down |
| Controller box | Back face down |
| Solar panel front bezel | Face down |
| Solar panel back tray | Rear face down |
| Solar ball mount base | Base down |
| Solar socket clamp halves | Flat split face down |

The V1.4 controller box is 170 x 115 x 46 mm and remains a one-piece print on common 220 x 220 mm beds. The optional solar panel housing is 165 x 165 mm and also fits common 220 x 220 mm beds.

## Fit Calibration

Before printing the full frame, print one tongue-and-groove joint pair from the frame files or cut a small test sample from the slicer.

Target fit:

- Slides together by hand.
- No hammer required.
- Minimal wobble after M3 cross-bolt is tightened.
- If too tight, increase `tongue_clearance_side` from `0.25` to `0.30`.
- If too loose, reduce `tongue_clearance_side` from `0.25` to `0.20`.

## Post-Processing

- Deburr guide tracks.
- Lightly sand sliding surfaces.
- Use PTFE dry lubricant, not sticky oil.
- Test rack/pinion fit by hand before powering motor.
- If rack teeth wear quickly, print rack and pinion in nylon or PETG-CF.
