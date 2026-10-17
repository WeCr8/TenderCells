# Decisions Locked for v2

These are not open design questions during the first implementation pass.

1. **One MCP core for Claude and ChatGPT.**
2. **Hosted customer connector stays read-only.**
3. **OAuth customer scope remains `farm:read` for B01-B04.**
4. **Local actions remain confirm-twice and off by default.**
5. **E-STOP behavior is not weakened or moved to cloud.**
6. **No assistant arm/gantry/Roaming Roost/mower/laser motion.**
7. **Existing v0.3 tool names remain compatible.**
8. **Customer UI says Animals, not Pets.** Legacy internals can remain temporarily.
9. **Builder/Missions use the current Builder JSON as source of truth.**
10. **One Builder screen/tool response represents one step.**
11. **Draft/generated technical art is not an authoritative wiring source.**
12. **Admin is a separate authorization boundary, not an extension of `farm:read`.**
13. **Do not rewrite OAuth during v2 customer-facade work.**
14. **Do not route motion through Firebase.**
15. **Do not move Builder content merely to make MCP imports easier; generate an adapter artifact instead.**
