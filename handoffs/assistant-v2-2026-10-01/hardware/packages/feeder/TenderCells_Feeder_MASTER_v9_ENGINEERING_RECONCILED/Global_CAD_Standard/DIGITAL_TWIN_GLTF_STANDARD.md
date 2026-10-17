# Tender Cells GLB / Digital Twin Standard

GLB is a visualization/runtime format, never the dimensional manufacturing authority.

Every released GLB must ship with a sibling JSON manifest recording: source STEP SHA-256, units, coordinate frame, node names, envelope, revision, and whether geometry is `CAD_EXACT` or `FUNCTIONAL_SIMPLIFIED`.

Node names use stable semantic IDs (`Rotor`, `Hopper`, `LoadCellPlatform`, `StatusLED`) rather than display strings. Animated nodes must rotate/translate around a documented functional origin from `INTERFACE_CONTROL.csv`.
