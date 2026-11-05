# CT72 rev A1.2 – assembly addendum (draft)

This only covers the A1.2 changes. The frame steps are the same as A1.1 (`ASSEMBLY.md`). Dimensions are in mm, in the CAD frame: origin at the front-left-bottom outer corner, +X right, +Y back, +Z up.

1. **Frame + rails.** Build the A1.1 frame. Add a 2040 nest shelf rail between the left posts at z 692–732. Add 2040 roost pivot rails between the right posts, centred at z 1200 (bar A) and z 1403 (bar B).
2. **X axis.** Mount the 2040 X beams on the rail ring (top face at 2195). Starter uses V-wheel carriages on the beams; Plus/Pro use MGN12 rails. Fit NEMA17s at the LEFT ends (front + back) with 20T pulleys, idler + tensioner at the right ends, and closed GT2-10 loops clamped to each X plate. Put the X-min switches at the left of both beams.
3. **Bridge + Y.** Fit the 2080 bridge on both X plates. The Y motor rides on the bridge (+X face), and the Y loop runs along that face. Y-min switch at the front.
4. **Z mast.** The 4040 mast hangs from the Y plate down to z 830. Fit the MGN15 rail, the Tr8x2 screw (KFL08 top, KP08 bottom), and the NEMA17 + coupler on top. The **Z-max switch** is at the top: Z homes UP.
5. **Universal plate.** Bolt the 250x250x12.7 plate under the Z carriage plate. Fit the adapter ring for your tier: SO-101 printed ring, Starter vacuum outrigger, or UR3e 6061 ring. SO-101: mount the follower **inverted** and route its bus + 12 V star harness through the cable chain.
6. **Square + home.** Klipper `CELL_HOME` (Z up first, then each X side to its own switch, then Y). Check the bridge is square to within 0.5 mm over 1.7 m.
7. **Nest bank.** Fit the shelf on the rail, then 2 boxes against the left ring plane starting at y 420: flat floors, liners, 60 mm aisle lip, top rail, lids on one hinge rod. Fit the lid actuator in the gap at y 360–400 and the reed switch.
8. **Basket pocket** at y 90–344: corner locators, AprilTag tab on the front-Y wall top. The exterior hatch goes in the left guard.
9. **Roost bars.** Tubes on pillow blocks (A at x 1778.8, B at x 1728.8). Fit the swing arms (A outboard, B inboard), the bars, and 2 load cells per bar at the bar brackets. Actuators mount on levers: A in front of the bars, B behind them. Fit limit switches at deployed and stowed, then the pinch guards. **Manual check first:** pull each quick-release pin and swing each bar by hand through its full arc. Bar B must nest inside A when stowed.
10. **Bring-up (no birds):** E-stop opens all three supplies. Roost moves refuse with 2 kg on a bar. The node faults on pinch (block the arm with a foam bar). Run the timestamp audit with `--simulate`, then live. Run the egg routine in simulation (`pytest tests/test_ct72_routines.py`), then dry with an empty cell.
