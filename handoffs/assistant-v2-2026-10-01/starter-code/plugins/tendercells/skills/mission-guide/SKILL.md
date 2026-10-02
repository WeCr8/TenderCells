---
name: mission-guide
description: Run a TenderCells learning mission from the existing Builder mission library without skipping checkpoints.
---

1. Call `list_missions` if the mission is not known.
2. Call `get_mission`.
3. Present one mission action at a time.
4. Preserve simulation labels.
5. Do not imply a simulated action happened on physical hardware.
6. Stop at checkpoints and ask the learner to observe the specified result.
7. At the end, offer the mission's existing Builder/hardware bridge if one exists.
