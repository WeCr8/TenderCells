# DoorCell V1.4 Assembly Guide

## Mechanical Overview

DoorCell V1 uses a horizontal sliding panel riding inside top and bottom guide rails. A replaceable toothed rack mounts to the moving door panel. A printed pinion gear on a 12V gearmotor drives the rack left or right.

The motor cassette sits in the right-side jamb. The controller pod is an external serviceable electronics box sized for the sub-$100 Basic electronics stack. Limit switches detect full-open and full-closed positions. The rack strip is replaceable because teeth are a wear item.

## Major Subassemblies

1. Tongue-and-groove segmented outer frame ring.
2. Top and bottom guide rails.
3. Two-piece sliding door.
4. Replaceable rack strip.
5. Motor and pinion.
6. Controller box.
7. Limit switches.
8. Manual release cover.
9. Optional two-piece solar panel housing and adjustable ball mount.

## Step 1: Print Parts

Print:

- 3 top rail sections: left, center, right.
- 3 bottom rail sections: left, center, right.
- 2 left jamb sections: lower, upper.
- 3 right jamb sections: lower, motor midsection, upper.
- 4 door panel sections: left lower, left upper, right lower, right upper.
- 3 rack strip segments.
- 1 pinion gear.
- 1 motor mount.
- 1 controller box.
- Optional 1 solar panel front bezel.
- Optional 1 solar panel back tray.
- Optional 1 solar ball mount base.
- Optional 2 solar ball socket clamp halves.
- 2 limit switch brackets.
- 1 manual release cover.

Use PETG, ASA, ABS, nylon, or PETG-CF. PLA is only for bench prototypes.

## Step 2: Install Heat-Set Inserts

Install M3 heat-set inserts into:

- Frame rail join points.
- Motor mount holes.
- Rack strip holes.
- Door panel joining tabs.
- Controller box lid holes.
- Controller box electronics hold-down posts.
- Limit switch bracket holes.
- Solar panel back tray holes.
- Solar ball socket clamp holes if using threaded inserts.

Do not overtighten into printed plastic.

## Step 3: Assemble the Outer Frame

1. Assemble the top rail from left, center, and right sections.
2. Assemble the bottom rail from left, center, and right sections.
3. Assemble the left jamb from lower and upper sections.
4. Assemble the right jamb from lower, motor midsection, and upper sections.
5. Seat each tongue fully into its groove/socket before tightening screws.
6. Add M3 cross-bolts through the tongue-and-groove joints.
7. Join the four sides into a rectangular ring using the corner holes.
8. Confirm the clear opening is square by measuring diagonals.
9. Check that the guide tracks are aligned across split lines.
10. Add weather gasket foam around the coop-facing side.

Do not rely on the printed tongue alone for strength. The tongue aligns the frame; M3 cross-bolts and the coop mounting screws provide clamping strength.

## Step 4: Assemble the Sliding Door

1. Join the lower-left and upper-left door sections using the horizontal tongue-and-groove joint.
2. Join the lower-right and upper-right door sections using the horizontal tongue-and-groove joint.
3. Join the left and right door halves using the vertical lap joint and M3 screws.
4. Add the rack strip segments to the lower rear face of the door.
5. Keep the rack segments flush and straight.
6. Confirm no screw heads protrude into the guide track.
7. Dry-slide the panel in the frame before adding the motor.

## Step 5: Install Motor and Pinion

1. Mount the 25GA-370 or JGA25-370 gearmotor in the motor mount.
2. Confirm the motor body fits the 27.2 mm cradle clearance without forcing it.
3. Route encoder/motor leads through the rear relief before tightening the mount.
4. Fit the printed pinion to the motor shaft.
5. Use a D-shaft fit or M3 set screw if your motor shaft supports it.
6. Install motor mount into the right motor bay.
7. Use the slotted mount holes to adjust pinion/rack mesh.
8. Target light tooth engagement with a small amount of backlash. The door should move without binding when pushed by hand.
9. Do not force the pinion hard into the rack. It should turn without binding.

## Step 6: Install Limit Switches

Use two limit switches:

- Open switch: triggered when the door is fully open.
- Closed switch: triggered when the door is fully closed.

Mount switches so the door panel presses the lever gently. If using reed switches, mount magnets in the door and place reed switches in the jamb.

## Step 7: Install Electronics

The V1.4 controller pod is sized around common low-cost module envelopes:

| Module | Envelope |
| --- | ---: |
| ESP32 dev board | 58 x 31 x 8 mm |
| LM2596 buck converter | 44 x 22 x 14 mm |
| DRV8871 motor driver | 31 x 26 x 7 mm |
| INA219 / ACS712 current sensor | 26 x 22 x 7 mm |
| CN3065 solar charger | 44 x 24 x 8 mm |
| Inline fuse holder | 45 x 15 x 14 mm |

1. Install M3 brass heat-set inserts into the electronics hold-down posts.
2. Mount the ESP32 in the large left tray using printed hold-down straps or a zip tie.
2. Mount the LM2596 in the upper-right tray.
3. Mount the DRV8871 in the lower-right tray.
4. Mount the INA219/ACS712 near the motor driver.
5. If using Solar Lite, mount the CN3065 module in the lower-center solar tray.
6. Place the inline 2A fuse holder in the printed service channel.
7. Route 12V power through one M12 cable gland.
8. Route motor leads through the second M12 cable gland.
9. Route limit switch, button, and sensor leads through the M10 cable gland.
10. Route optional solar panel and 1S battery/service leads through the two M8 side glands.
11. Install the optional 16 mm waterproof local button in the side cutout.
12. Add drip loops before wires enter the box.
13. Keep motor wires separated from switch wires where practical.
14. Confirm the lid closes without pressing on the LM2596 inductor, CN3065 connectors, or wiring.

## Step 7A: Optional Solar Panel Housing

The solar option uses a 145 x 145 mm, 6V 3W/500mA mini panel.

1. Set the panel into the rear tray pocket.
2. Route the panel leads through the rear cable channel.
3. Install the front bezel over the panel.
4. Fasten the bezel into the rear tray inserts with M3 screws.
5. Bolt the printed ball socket clamp to the rear tray using the M5 center hole.
6. Print two socket clamp halves and capture the 22 mm ball from the wall/base mount.
7. Tighten the socket clamp enough to hold angle, but do not crush the printed socket.
8. Aim the panel toward the strongest sun exposure.
9. Route the panel leads into the main controller enclosure M8 solar gland.

Solar Lite does not directly power the 12V motor. Treat it as a 1S battery charging path until the power architecture is validated.

## Step 8: Manual Release

The manual release cover should allow access to the pinion/motor mount screws. For the kit version, add a thumb screw or captive fastener so the user can disengage the pinion from the rack during power loss or service.

## Step 9: Bench Test

Before mounting to a coop:

- Run open command.
- Run close command.
- Trigger both limit switches by hand.
- Block the door lightly and confirm current spike detection.
- Confirm reverse/stop behavior.
- Confirm manual release works.

## Step 10: Coop Install

1. Cut or use an existing pop door opening.
2. Mount frame with M4 screws and washers.
3. Seal the coop-facing edge.
4. Ensure the door slides without rubbing.
5. Confirm no pinch points are accessible to animals.
6. Run at least 50 open/close cycles before live unattended use.
