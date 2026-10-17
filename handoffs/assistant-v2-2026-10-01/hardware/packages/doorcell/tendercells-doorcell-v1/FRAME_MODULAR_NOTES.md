# Modular Frame Notes

DoorCell V1.4 uses a tongue-and-groove segmented ring sized with explicit FDM clearances.

## Why This Change Matters

The earlier frame direction had horizontal rails that were right on the edge of a 220 mm bed and vertical jambs that were too tall for most common printers. The revised ring is meant to print comfortably on popular machines:

| Printer Class | Typical Bed | DoorCell Frame Fit |
| --- | ---: | --- |
| Creality Ender 3 / V3 | 220 x 220 mm | Yes |
| Prusa MK3/MK4 | 250 x 210 mm | Yes |
| Bambu A1/P1/X1 | 256 x 256 mm | Yes |
| Sovol/Anycubic mid-size | 220-250 mm class | Yes |

## New Frame Split

| Frame Area | New Pieces | Longest Nominal Dimension |
| --- | ---: | ---: |
| Top rail | 3 | 146 mm |
| Bottom rail | 3 | 146 mm |
| Left jamb | 2 | 184 mm |
| Right motor jamb | 3 | 156 mm |

The non-frame parts remain one piece where practical:

- Sliding door sections are split into four pieces because the full door height is too tall for common 220 mm print beds.
- Rack strip.
- Pinion.
- Motor mount.
- Controller box, now 170 x 115 x 46 mm to fit the Basic electronics stack plus optional CN3065 solar charger.
- Optional solar panel housing and ball mount pieces.
- Limit switch bracket.
- Manual release cover.

## Tongue-and-Groove Joint

Each frame split uses:

- A printed tongue for alignment.
- A matching receiver groove/socket.
- M3 cross-bolt holes through the joint.
- M4 coop mounting holes in each section.

The tongue is for alignment, not the only structural element. Use M3 screws and heat-set inserts or locknuts through the cross-bolt holes.

Current joint dimensions:

| Feature | Value |
| --- | ---: |
| Tongue length | 18 mm |
| Tongue width | 22 mm |
| Tongue depth | 10 mm |
| Socket clearance | 0.25 mm per side |
| Socket depth extra | 0.60 mm |

See `ENGINEERING_CALCULATIONS.md` for the fit and shear assumptions.

## Assembly Order

1. Assemble top rail: left to center to right.
2. Assemble bottom rail: left to center to right.
3. Assemble left jamb lower to upper.
4. Assemble right jamb lower to motor-mid to upper.
5. Join the four sides into a rectangular ring.
6. Square the frame before final tightening.
7. Install sliding door and rack.
8. Install motor cassette and electronics.

## Design Intent

This frame is not a copy of any competitor frame. It uses the common horizontal sliding-door concept with an original open-source segmented ring so home users can print, repair, resize, and modify it.
