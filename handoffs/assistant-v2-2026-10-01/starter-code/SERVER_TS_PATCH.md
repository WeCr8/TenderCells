# server.ts integration patch

Near the existing imports:

```ts
import { registerV2ReadTools } from "./v2/registerV2.js";
```

Inside `createTenderCellsMcp`, after the existing read tools/resources/prompts are registered and **before**:

```ts
if (!allowActions) return server;
```

add:

```ts
registerV2ReadTools(server, { hub });
```

Reason:
- the tools are read-only;
- they must exist in hosted and local modes;
- they must not be nested inside the local-action branch.

Do not relocate E-STOP/action code.
