import Jetson.GPIO as GPIO
import time
from arm_interface import ArmController, ArmConfig

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
        self.mm_per_step = 1.0
        self.position = [0.0, 0.0, 0.0]

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
        """Move X, Y, Z by offset in mm"""
        if not self.is_connected:
            return False

        step_delay = 0.01 / speed
        axes = ['X', 'Y', 'Z']

        for idx, (axis, mm) in enumerate(zip(axes, mm_offsets)):
            if mm == 0:
                continue

            steps = int(abs(mm) / self.mm_per_step)
            motor = self.motors[axis]
            direction = GPIO.HIGH if mm > 0 else GPIO.LOW

            GPIO.output(motor['dir'], direction)

            for _ in range(steps):
                GPIO.output(motor['pul'], GPIO.HIGH)
                time.sleep(step_delay)
                GPIO.output(motor['pul'], GPIO.LOW)
                time.sleep(step_delay)

            self.position[idx] += mm
            motor['position'] += steps

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
        """Disable all motors"""
        for motor in self.motors.values():
            GPIO.output(motor['ena'], GPIO.LOW)
        print("⚠️  Gantry E-STOP activated")
        return True
