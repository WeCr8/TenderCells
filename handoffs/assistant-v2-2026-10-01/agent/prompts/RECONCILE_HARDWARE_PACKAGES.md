# Agent Prompt — Reconcile Feeder and DoorCell

Read the current repository plus:
- `hardware/README.md`
- `hardware/integration/FEEDER_INTEGRATION.md`
- `hardware/integration/DOORCELL_INTEGRATION.md`
- `hardware/integration/HARDWARE_TO_BUILDER_MAP.md`
- `agent/batches/B09_HARDWARE_PACKAGE_RECONCILIATION.md`

Do **B09-A only** first.

Do not copy package files into production code yet.

Produce a reconciliation report with:
1. product identity/type mapping;
2. MQTT differences;
3. firmware/MCU differences;
4. BOM/part-ID mapping;
5. CAD authority mapping;
6. Builder content opportunities;
7. safety/validation gaps;
8. exact repo files that should be changed next.

Clearly separate:
- already validated evidence;
- prototype assumptions;
- tests still outstanding.

Do not call either package production/field validated unless the source explicitly proves it.
