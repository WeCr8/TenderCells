# `server.ts` Integration Patch

Current TenderCells creates the server with:

```ts
app.listen(PORT, HOST, () => { ... });
```

Change composition to use Node HTTP explicitly:

```ts
import { createServer } from 'node:http';
import { attachControlGateway } from './control/controlGateway.js';
import { createMotionPublisher } from './control/controlAdapters.js';

const server = createServer(app);

const motionPublisher = createMotionPublisher(
  (topic, payload, retain) => MQTTController.host().publish(topic, payload, retain),
);

attachControlGateway(server, motionPublisher, {
  path: '/api/control/ws',
  staleMs: 500,
  // Add the same owner/session authentication policy used by device routes
  // before exposing outside trusted LAN/demo environments.
});

server.listen(PORT, HOST, () => {
  // keep the existing startup log body
});
```

## Authentication requirement

The included gateway accepts an injected `authorize(req, deviceId)` function.

Before production/remote use, implement the WebSocket equivalent of the existing
device-owner gate. Do not depend on query-string tokens for long-lived production
authentication if a stronger cookie/header/session option is available.

LAN/demo mode can remain unauthenticated only under the same explicit local/demo
assumptions already used by TenderCells.
