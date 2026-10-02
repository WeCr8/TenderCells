# Adding a New Robot Type

1. Define device capabilities.
2. Reuse an existing kinematics type if possible.
3. Create a profile only if input semantics differ.
4. Add a simulator/fixture.
5. Add pure mixer/adapter tests.
6. Add stale-stream and disconnect tests.
7. Add a hardware-side watchdog.
8. Add telemetry fields without inventing unavailable state.
9. Test at reduced speed with the robot physically restrained.
10. Add camera support independently from motion.
