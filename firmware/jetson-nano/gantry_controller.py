import time
from arm_interface import ArmController, ArmConfig

try:  # Jetson-only; the simulated gantry below works anywhere.
    import Jetson.GPIO as GPIO
except ImportError:  # pragma: no cover - off-Jetson
    GPIO = None

GANTRY_CONFIG = ArmConfig(
    name="XYZ Gantry Platform",
    dof=3,
    kinematics_type="linear",
    max_speed=100,
    payload_kg=10,
    workspace_radius_mm=1000
)

class GantryController(ArmController):
    def __init__(self):
        super().__init__(GANTRY_CONFIG)
        self.motors = {}
        self.mm_per_step = 1.0                       # ASSUMED placeholder: set from the real screw/belt and microstepping
        self.position = [0.0, 0.0, 0.0]
        self.estop_active = False
        # ASSUMED travel per axis in mm: set from the real machine before use. Moves outside this range are refused.
        self.limits_mm = [(0.0, float(GANTRY_CONFIG.workspace_radius_mm))] * 3
        self.speed_range = (0.05, 1.0)              # fraction of max; 0 would divide by zero, huge values fall under the driver's minimum pulse width
        self.max_move_seconds = 120.0

    def connect(self) -> bool:
        try:
            GPIO.setmode(GPIO.BOARD)
            axes = {
                'X': (33, 35, 37),
                'Y': (11, 13, 15),
                'Z': (19, 21, 23),
            }
            for axis, (pul, dir, ena) in axes.items():
                GPIO.setup([pul, dir, ena], GPIO.OUT)
                GPIO.output(ena, GPIO.HIGH)
                self.motors[axis] = {'pul': pul, 'dir': dir, 'ena': ena, 'position': 0}

            self.is_connected = True
            print("✅ Gantry connected")
            return True
        except Exception as e:
            print(f"❌ Gantry failed: {e}")
            return False

    def move_joints(self, mm_offsets, speed=0.5) -> bool:
        """Move X, Y, Z by offset in mm. Refuses while E-STOP is active, refuses moves outside the travel limits (no partial moves),
        clamps speed, polls E-STOP before every step and updates the position by the steps actually taken."""
        if not self.is_connected:
            return False
        if self.estop_active:
            raise RuntimeError("E-STOP is active - clear it before moving the gantry")
        if not speed or speed <= 0:
            raise ValueError("speed must be > 0")
        speed = min(max(float(speed), self.speed_range[0]), self.speed_range[1])
        offsets = [float(v) for v in list(mm_offsets)[:3]] + [0.0] * (3 - len(list(mm_offsets)[:3]))
        for idx, mm in enumerate(offsets):
            lo, hi = self.limits_mm[idx]
            if not (lo <= self.position[idx] + mm <= hi):
                raise ValueError(f"move on axis {idx} to {self.position[idx] + mm:.1f} mm is outside the travel limits {lo}..{hi}")

        step_delay = 0.01 / speed
        deadline = time.monotonic() + self.max_move_seconds
        axes = ['X', 'Y', 'Z']
        for idx, (axis, mm) in enumerate(zip(axes, offsets)):
            if mm == 0:
                continue
            steps = int(abs(mm) / self.mm_per_step)
            motor = self.motors[axis]
            direction = GPIO.HIGH if mm > 0 else GPIO.LOW
            GPIO.output(motor['dir'], direction)
            done = 0
            for _ in range(steps):
                if self.estop_active or time.monotonic() > deadline:
                    break
                GPIO.output(motor['pul'], GPIO.HIGH)
                time.sleep(step_delay)
                GPIO.output(motor['pul'], GPIO.LOW)
                time.sleep(step_delay)
                done += 1
            sign = 1 if mm > 0 else -1
            self.position[idx] += sign * done * self.mm_per_step      # what actually moved, not what was asked
            motor['position'] += sign * done
            if self.estop_active:
                self.joint_angles = self.position[:]
                raise RuntimeError("E-STOP during move: position is the point where motion stopped")
            if done < steps:
                self.joint_angles = self.position[:]
                raise TimeoutError("gantry move exceeded max_move_seconds")

        self.joint_angles = self.position[:]
        return True

    def move_cartesian(self, x, y, z, rx=0, ry=0, rz=0) -> bool:
        """Move to absolute cartesian position"""
        offsets = [
            x - self.position[0],
            y - self.position[1],
            z - self.position[2]
        ]
        return self.move_joints(offsets)

    def get_joint_state(self):
        """Return current X, Y, Z position"""
        return self.position[:]

    def get_position(self):
        """Return X, Y, Z position tuple"""
        return tuple(self.position)

    def estop(self) -> bool:
        """Disable all motors. The flag is set first so a move in another thread stops at its next step."""
        self.estop_active = True
        for motor in self.motors.values():
            GPIO.output(motor['ena'], GPIO.LOW)
        print("⚠️  Gantry E-STOP activated")
        return True

    def clear_estop(self) -> bool:
        """Explicit re-enable after the cause is fixed. Position must be re-homed afterwards."""
        for motor in self.motors.values():
            GPIO.output(motor['ena'], GPIO.HIGH)
        self.estop_active = False
        return True

    # ArmController hooks. The gantry overrides the public methods above
    # (relative mm moves), so these only satisfy the shared interface.
    def _connect(self) -> bool:
        return self.is_connected

    def _move_joints(self, target, speed) -> None:
        self.move_cartesian(*target[:3])

    def _read_joints(self):
        return self.position[:]

    def _stop(self) -> None:
        self.estop()


class SimulatedGantry(GantryController):
    """XYZ gantry with no GPIO - positions are tracked, moves are instant.

    Used in simulation mode (ARM_MODE=simulation) and on machines without
    Jetson.GPIO, so routines run end to end off-hardware.
    """

    mode = "simulation"

    def connect(self) -> bool:
        self.is_connected = True
        print("✅ Gantry connected (simulated)")
        return True

    def move_joints(self, mm_offsets, speed=0.5) -> bool:
        if self.estop_active:
            raise RuntimeError("E-STOP is active - clear it before moving the gantry")
        for idx, mm in enumerate(mm_offsets[:3]):
            self.position[idx] += float(mm)
        self.joint_angles = self.position[:]
        return True

    def estop(self) -> bool:
        self.estop_active = True
        print("⚠️  Gantry E-STOP (simulated)")
        return True


def create_gantry(simulated: bool) -> GantryController:
    """Real gantry on a Jetson, simulated one otherwise (or when asked)."""
    return SimulatedGantry() if simulated or GPIO is None else GantryController()
