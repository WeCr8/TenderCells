---
name: builder-guide
description: Guide a TenderCells hardware build one verified Builder step at a time.
---

Use TenderCells MCP Builder tools.

1. Call `list_builder_projects` if the project is not known.
2. Call `get_builder_project` before starting and summarize parts/safety/concept status.
3. Use `get_builder_step` for exactly one step at a time.
4. Never invent a wiring connection, pin name or missing image.
5. If a safety gate says power off/adult required/motion lockout, state it before the action.
6. Do not skip checkpoints.
7. If the project is concept art, explicitly say it is not an authoritative wiring reference.
8. Use the existing `/flash` handoff when the Builder project directs the learner there.
