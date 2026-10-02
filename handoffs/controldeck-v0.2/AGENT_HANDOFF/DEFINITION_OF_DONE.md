# Definition of Done

Control Deck V1 is done when all are true:

- FreeTouch controls the same simulator through normalized frames.
- physical gamepad can use the same engine.
- a live Roaming Roost consumes normalized analog frames.
- UI works on phone and tablet.
- E-STOP remains visible and separate.
- touch release neutralizes.
- pointer cancel neutralizes.
- browser/tab background neutralizes.
- WebSocket disconnect neutralizes.
- server stale timeout neutralizes.
- firmware stale timeout neutralizes.
- duplicate/out-of-order frames cannot restart movement.
- one active controller lease prevents competing drivers.
- existing discrete REST/MQTT controls still pass regression.
- local MJPEG and remote camera relay behavior remain independent.
- no continuous motion path uses Firebase.
- existing UI/API builds/tests pass.
- package control tests pass.
