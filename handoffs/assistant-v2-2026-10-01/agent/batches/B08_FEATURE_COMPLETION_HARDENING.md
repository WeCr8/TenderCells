# B08 — Feature Completion + Release Hardening

This is a coordination batch after B01/B07 planning. It does not mean “build everything at once.”

Use `roadmap/machine/feature_status.json` and select the highest-priority incomplete item that:
- has clear source files;
- has an objective acceptance test;
- does not cross a safety/auth boundary unexpectedly.

## P0 order

1. B01 assistant facade
2. store/reviewer blockers
3. signed MCPB
4. directory submissions

## P1 order

1. B02 assistant cards
2. B03 Claude skills
3. B04 Property Twin reads
4. reference-check priority Builder art
5. M8 sensor
6. mobile/Safari QA

## Hard stop

Do not start B05/B06 admin work merely because P0/P1 is waiting on an external store review.
Use that wait time on Builder validation, QA, docs and screenshots instead.
