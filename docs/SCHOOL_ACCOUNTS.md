# School accounts — who owns what

Source: `applications/tendercells_ui/test_output/shared/org/orgModel.ts`. It is enforced by
`firestore.rules` (tested in `tests/firestore-rules`) and `functions/src/orgs.ts`.

| Who | Owns | Sees / does |
|---|---|---|
| **School** (org) | Its properties (farm lab, garden) and products (coops, robots) | — |
| **District** (org) | Shared district properties; schools can point `districtId` at it | — |
| Org **owner / admin** | Creates properties and products for the org (within plan limits) | Everything in the org |
| **Teacher** | Nothing of their own inside the org | The assets of the classes they teach, and can run them |
| **Student** | **Never** their own property or products | Only what their classes allow: view map, cameras, run routines, aim the weeding laser. **Never fires a laser.** |

## Data

| Path | What is stored there |
|---|---|
| `orgs/{orgId}` | `{ name, type: school \| district \| farm, plan, domains[], districtId?, ownerUid }` |
| `orgs/{orgId}/classes/{classId}` | `{ teacherUids, studentUids, propertyIds, productIds, capabilities }` |
| `orgs/{orgId}/members/{uid}` | `{ role, classIds, allowedPropertyIds, allowedProductIds }` |
| `properties/…`, `products/…`, `devices/…` | Carry `orgId` when the org owns them |

The `allowed*` lists on member docs are kept in sync by the `syncClassAccess` and
`syncMemberAccess` functions. The rules read those lists.

## Plans

| Plan | Properties | Products | Classes | Seats |
|---|---|---|---|---|
| Free | 1 | 3 | 0 | 1 |
| Classroom | 1 | 10 | 3 | 40 |
| School | 3 | 40 | 30 | 600 |
| District | 50 | 1000 | 1000 | 20000 |

Enforcement:
- Clients check `planLimitReason()` before adding anything.
- The `enforceOrgPropertyLimit` / `enforceOrgProductLimit` functions remove an over-limit doc and post a notice. Rules cannot count documents, so this has to happen in a function.
- The plan itself can only change from the billing backend. Rules refuse client edits to `plan`.

## Deploying rules + functions

Hosting deploys automatically; rules and functions are deployed on purpose:

```bash
firebase deploy --only firestore:rules,functions --project <project>
```

Functions run on Node 20. Check `tests/firestore-rules` passes before deploying rules; CI runs it
whenever `firestore.rules` changes.
