# Migration plan

1. Freeze current safety/compatibility guarantees in tests.
2. Add read-only v2 adapters for farm home, animals, habitats, Property Twin, devices, Builder and missions.
3. Keep Farm Card and add compact Alert/Habitat/Mission/Builder/Device views.
4. Render existing Builder content in assistant fullscreen without forking Builder logic.
5. Add Claude builder/mission/device skills.
6. Add a separate admin server/resource, read-only first.
7. Add audited Builder/Mission/Asset admin writes.
8. Refresh directory listing/screenshots after deployment.

Deprecation is documentation-first; do not break current tool names prematurely.
