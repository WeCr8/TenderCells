# Prompt: pick the next TenderCells v2 task

Read:
- `agent/00_START_HERE.md`
- `agent/01_DECISIONS_LOCKED.md`
- `roadmap/FEATURE_STATUS.md`
- `roadmap/MASTER_CHECKLIST.md`
- `roadmap/RELEASE_CRITICAL_PATH.md`

Then inspect the current repo before editing.

Choose exactly **one** incomplete item using this priority:
P0 before P1 before P2 before P3.

Constraints:
- prefer a task with objective tests;
- do not cross auth/safety boundaries unless the task explicitly requires it;
- do not create duplicate Builder/Mission/twin sources;
- do not weaken hosted read-only or local confirm-twice behavior;
- use the official brand assets from `brand/official/`.

Before implementation, state:
1. selected task;
2. repo files to change;
3. acceptance tests;
4. why it is the highest-value unblocked item.

After implementation, fill `agent/HANDOFF_TEMPLATE.md`.
