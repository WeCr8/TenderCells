# Jetson / arm controller

- `arm_service.py` — MQTT arm service (simulation, Universal Robots, Hugging Face LeRobot,
  Hugging Face policies). Setup and safety: [docs/ARM_SERVICE.md](../../docs/ARM_SERVICE.md).
- `coordinated_motion_controller.py` — gantry + arm routines (egg collection, cleaning sweep).
- `gantry_controller.py` — XYZ gantry (Jetson GPIO) and `SimulatedGantry`.

Tests: `python -m pytest -q tests`
