# DoorCell V1.4 Test Plan

## Mechanical Tests

- [ ] Door slides freely by hand.
- [ ] Door does not fall out of guide rails.
- [ ] Rack segments align without tooth step.
- [ ] Pinion turns rack without binding.
- [ ] Door opens fully.
- [ ] Door closes fully.
- [ ] Manual release disengages drive.
- [ ] Frame remains square after mounting.
- [ ] Screws do not protrude into door path.
- [ ] Outdoor gasket does not block motion.

## Electronics Tests

- [ ] ESP32 boots.
- [ ] ESP32 fits the 58 x 31 mm controller tray without USB cable interference.
- [ ] LM2596 fits the 44 x 22 x 14 mm tray and lid closes with wiring.
- [ ] DRV8871 fits the 31 x 26 mm tray with terminal access.
- [ ] INA219/ACS712 fits the 26 x 22 mm tray with motor current wiring.
- [ ] CN3065 fits the 44 x 24 mm tray inside the main controller box.
- [ ] Inline fuse holder fits the printed service channel.
- [ ] M3 brass inserts seat correctly in all electronics hold-down posts.
- [ ] Two M12 glands and one M10 gland seat correctly.
- [ ] Two M8 solar/service glands seat correctly.
- [ ] 16 mm waterproof button seats in the side cutout.
- [ ] Motor driver receives commands.
- [ ] Motor opens.
- [ ] Motor closes.
- [ ] Open limit switch reads correctly.
- [ ] Closed limit switch reads correctly.
- [ ] Current sensor reports nonzero under motor load.
- [ ] Button input works.
- [ ] Status LED works.
- [ ] MQTT publishes state.
- [ ] MQTT receives command.

## Safety Tests

- [ ] Door stops at open limit.
- [ ] Door stops at closed limit.
- [ ] Door stops on timeout.
- [ ] Door stops on overcurrent.
- [ ] Door reverses or releases after close obstruction.
- [ ] Door refuses unsafe close when state is unknown.
- [ ] Emergency stop disables motor.
- [ ] Manual release works after power loss.
- [ ] Firmware does not repeatedly retry after obstruction.
- [ ] Door state is logged after every command.

## Regression Tests

- [ ] Controller lid closes after full harness installation.
- [ ] Controller lid closes with CN3065 installed and JST connectors attached.
- [ ] Motor wires do not pull on the DRV8871 terminals during door motion.
- [ ] Switch wires remain clear of motor/pinion movement.
- [ ] Boot with door open.
- [ ] Boot with door closed.
- [ ] Boot with door halfway open.
- [ ] WiFi offline at boot.
- [ ] MQTT offline at boot.
- [ ] Limit switch disconnected.
- [ ] Motor disconnected.
- [ ] Power loss during opening.
- [ ] Power loss during closing.
- [ ] Command sent while already moving.
- [ ] Rapid repeated open/close commands.
- [ ] Current sensor failure.
- [ ] Motor driver fault.

## Field Tests Before Live Use

- [ ] 50 supervised cycles on bench.
- [ ] 50 supervised cycles mounted on coop.
- [ ] Morning temperature test.
- [ ] Night temperature test.
- [ ] Rain/spray exposure check without electronics getting wet.
- [ ] Dust/debris check in tracks.
- [ ] Animal-safe clearance inspection.
- [ ] Manual override demonstration.

## Optional Solar Tests

- [ ] 145 x 145 mm solar panel fits rear tray pocket.
- [ ] Front bezel overlaps panel without covering too much active area.
- [ ] Ball mount holds panel angle after tightening.
- [ ] Panel leads route through housing channel without pinch.
- [ ] CN3065 charge LED and done LED are visible or testable before sealing.
- [ ] Solar input polarity verified before plugging into CN3065.
- [ ] Battery polarity verified before plugging into CN3065.
- [ ] 1S battery has protection and low-voltage cutoff.
- [ ] Solar path does not backfeed 12V motor supply.
