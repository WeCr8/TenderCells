# Release Critical Path

The fastest useful public release does **not** require finishing every TenderCells feature.

## P0 — Store blockers

1. Implement Assistant v2 B01 customer facade.
2. Keep all existing MCP safety tests green.
3. Verify production OAuth + customer isolation.
4. Verify Firestore TTL policies.
5. Create dedicated reviewer account + seeded farm.
6. Capture real ChatGPT and Claude screenshots.
7. Record reviewer demo video.
8. Build/sign Claude Desktop MCPB release.
9. Run `scripts/store-preflight.sh`.
10. Submit OpenAI.
11. Submit Claude.
12. Fix review findings and publish deliberately.

## P1 — Strong first impression

Can ship before or immediately after directory approval:
- B02 MCP App cards;
- B03 Claude skills;
- B04 Property Twin adapter reads;
- reference-check the most-used Builder assets;
- M8 sensor lesson;
- mobile/Safari QA.

## P2 — Platform depth

- Admin read-only MCP;
- admin content workflow;
- M9 Invent;
- printable Builder manual;
- teacher/classroom mode;
- command lifecycle UI;
- richer Property Twin event highlighting.

## P3 — Long-term platform expansion

- mirror stable Builder into Python generator;
- robot package capability manifest;
- deeper real-hardware survey/GPS;
- broader integrations/orchestration.

## Release rule

Store launch is blocked by security/reviewer/readiness items, **not** by future admin or robot features.
