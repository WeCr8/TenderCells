# Transport Adapter Contract

All transports implement:

```ts
interface ControlTransport {
  connect(): Promise<void>;
  send(frame: ControlFrame): void;
  close(): void;
  metrics(): LinkMetrics;
}
```

Future adapters can include:
- native BLE
- native USB serial
- WebRTC data channel
- ROS 2 edge bridge
- MAVLink bridge
- ESP-NOW edge bridge
- CRSF/SBUS hardware gateway

The transport must not reinterpret joystick semantics. Kinematics/mapping happens
before transport.
