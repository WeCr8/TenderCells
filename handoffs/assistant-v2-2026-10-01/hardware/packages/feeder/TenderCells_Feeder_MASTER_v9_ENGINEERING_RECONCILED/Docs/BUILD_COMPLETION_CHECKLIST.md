# Full Build Completion Checklist

## Print / mechanical
- [ ] Print heat-set insert coupon and tune M3/M4/M5 pilot holes.
- [ ] Print structural parts in PETG/ASA or another appropriate material.
- [ ] Print gasket in TPU or substitute a cut commercial gasket.
- [ ] Install heat-set inserts square and below-flush.
- [ ] Assemble TAL220B fixed/floating Z-mount without preload or binding.
- [ ] Install 696 bearing, 6 mm shaft and rotor.
- [ ] Install default 28BYJ-48 drive and 5-to-6 mm shaft coupler.
- [ ] Install Hall bracket and rotor magnet carrier.
- [ ] Confirm the rotor turns freely before installing feed.
- [ ] Install removable trough rails and verify tool-free cleaning path.
- [ ] Install hopper gasket, adapter, hopper and lid.

## Electrical
- [ ] XIAO ESP32C3 installed in dry enclosure.
- [ ] HX711 installed and load cell wired correctly.
- [ ] ULN2003 installed and motor connected.
- [ ] Hall sensor connected and home state verified.
- [ ] Motor power sized separately from logic needs and grounds tied correctly.
- [ ] Cable strain relief installed.
- [ ] No exposed conductors accessible to students or animals.

## Firmware / calibration
- [ ] Install ESP32 board support and required Arduino libraries.
- [ ] Calibrate load-cell zero and known mass.
- [ ] Home rotor with Hall sensor.
- [ ] Tune `POCKET_STEPS` so six indexes return to the home mark.
- [ ] Measure grams per pocket with actual feed at least 10 times.
- [ ] Record average, min/max and standard deviation.
- [ ] Add jam timeout / fault behavior before unattended operation.

## Deployment
- [ ] Run dry-cycle test for at least 100 indexes.
- [ ] Run feed-cycle test and check for bridging/jamming.
- [ ] Inspect for pinch points.
- [ ] Verify electronics stay dry.
- [ ] Verify parts touching feed are appropriate for intended use and cleaning method.
- [ ] Supervise initial animal use and inspect for sharp edges or trapped feed.
