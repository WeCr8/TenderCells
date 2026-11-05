# Feature Completion Status

Reviewed against live repo handoff on 2026-10-01.

| Feature | Status | Priority | Current truth | Next action |
|---|---|---:|---|---|
| MCP shared core | Complete | P0 | Existing shared MCP server for Claude/ChatGPT | Keep compatibility |
| Hosted customer connector | Complete | P0 | OAuth 2.1, farm:read, read-only Firestore mirror | Preserve safety boundary |
| Hosted demo connector | Complete | P0 | /mcp/demo simulated farm | Use for reviewers |
| Farm Card MCP App | Complete | P0 | Inline farm overview | Retain |
| Local confirm-twice actions | Complete | P0 | request_action -> human yes -> confirm_action | Do not weaken |
| Customer self-service connections | Complete | P0 | /app/assistants + revoke | Keep |
| Claude plugin + farm-check | Complete | P0 | Plugin marketplace structure exists | Add v2 skills |
| Builder M0-M7 | Complete | P1 | 59 LEGO-style steps, missions + Blink + Starter Node | Expose via MCP |
| Chicken Tender Door book | Concept | P1 | 21 illustrated pages, explicitly concept | Verify real BOM/wiring before instruction-ready |
| Builder parts catalog | Draft | P1 | 67 IDs | Reference-check art and technical metadata |
| Assistant v2 customer facade | Planned | P0 | get_farm_home, list_devices, Builder/Mission reads | Implement B01 |
| Builder/Mission assistant cards | Planned | P1 | MCP App cards | Implement B02 |
| Claude Builder/Mission skills | Planned | P1 | builder-guide, mission-guide, device-connect | Implement B03 |
| Property Twin assistant adapters | Planned | P1 | animals, habitats, property twin | Implement B04 from real services |
| Platform admin assistant | Future | P2 | Separate authorization boundary | B05 read-only, B06 writes |
| Store submissions | Pending | P0 | OpenAI + Claude public directories | Complete B07 release gate |
| Signed Claude Desktop MCPB release | Pending | P0 | Package already buildable | Sign/attach release |
| Reviewer account/screenshots | Pending | P0 | Required for store review | Create seeded account + capture real chats |
| Firestore TTL policies | Pending | P0 | oauthRequests/oauthGrants expireAt | Verify in console |
| Builder M8 Sensor | Pending | P1 | replace button with sensor | Implement after B01/store-critical path |
| Builder M9 Invent | Pending | P2 | design a TenderCell | Implement after M8 |
| Printable Builder export | Pending | P2 | same step data -> print manual | No separate content authoring |
| Teacher/classroom mode | Pending | P2 | team/classroom UX | Use existing learner depths/safety |
| Builder generator integration | Pending | P3 | mirror stable Builder into Python generator | Do after content stabilizes |
| Reference-checked part art | Pending | P1 | boards/cables/sensors/etc. | Needed for authoritative hardware lessons |
| Demo event twin highlighting | Pending | P2 | highlight affected twin in 3D | Repo handoff next step |
| Command requested/ack/confirmed UI | Pending | P2 | visual command-state lifecycle | Preserve provenance |
| Mobile/Safari QA | Pending | P1 | demo + Builder + assistant pages | Release quality |

## Newly added engineering sources

| Feature | Status | Priority | Current truth | Next action |
|---|---|---:|---|---|
| Smart Feeder engineering package | Uploaded / reconcile | P1 | 330-file engineering package with CAD/BOM/firmware/validation/app integration | Run B09-A, reconcile with current repo contracts |
| Smart Feeder Builder book | Planned | P2 | Strong engineering source exists, no unified Builder project in this handoff yet | Build after firmware/BOM/safety reconciliation |
| DoorCell V1.4 engineering package | Prototype / reconcile | P1 | 68-file solar-ready printable assembly with BOM/calcs/test plan | Run B09-A and existing door-book audit |
| Chicken Tender Door concept reconciliation | Ready to start | P1 | Existing 21-page concept book now has a real DoorCell source package to compare against | B09-B page-by-page audit |
| DoorCell instruction-ready status | Blocked by validation | P1 | Prototype assumptions; test plan not represented as fully executed | Complete applicable mechanical/electrical/safety/field tests |
