# Definition of Done

A batch is done only when:

1. Code is integrated into existing repo paths.
2. Types compile.
3. Tests pass.
4. Existing connector behavior remains compatible.
5. Documentation states what changed.
6. Tool annotations correctly describe read/write behavior.
7. Demo mode can exercise the new customer reads where applicable.
8. No duplicate Builder/Mission content store was created.
9. Security/safety invariants in `01_DECISIONS_LOCKED.md` still hold.
10. The agent leaves a short handoff with:
   - files changed;
   - tests run;
   - failures/risks;
   - next batch recommendation.
