import json
import time
import threading
from gantry_controller import GantryController
from arm_factory import ArmFactory

class CoordinatedMotionController:
    def __init__(self, arm_type='stepper_6dof', mqtt_client=None):
        self.gantry = GantryController()
        self.arm = ArmFactory.create(arm_type)
        self.mqtt = mqtt_client
        self.is_moving = False

        self.gantry.connect()
        self.arm.connect()

    def execute_command(self, cmd: dict) -> dict:
        """Execute combined 9DOF motion"""
        result = {
            'success': False,
            'command_type': cmd.get('type'),
            'gantry_pos': None,
            'arm_joints': None,
            'error': None
        }

        try:
            if cmd['type'] == 'gantry_only':
                self.gantry.move_joints(
                    cmd['mm_offsets'],
                    cmd.get('speed', 0.5)
                )
                result['gantry_pos'] = self.gantry.get_position()

            elif cmd['type'] == 'arm_only':
                if cmd['arm']['type'] == 'joint':
                    self.arm.move_joints(cmd['arm']['angles'], cmd.get('speed', 0.5))
                elif cmd['arm']['type'] == 'cartesian':
                    self.arm.move_cartesian(
                        cmd['arm']['x'], cmd['arm']['y'], cmd['arm']['z'],
                        cmd['arm'].get('rx', 0), cmd['arm'].get('ry', 0), cmd['arm'].get('rz', 0)
                    )
                result['arm_joints'] = self.arm.get_joint_state()

            elif cmd['type'] == 'sequential':
                self.sequential_motion(cmd['motions'])

            elif cmd['type'] == 'parallel':
                self.parallel_motion(cmd['gantry'], cmd['arm'])
                result['gantry_pos'] = self.gantry.get_position()
                result['arm_joints'] = self.arm.get_joint_state()

            result['success'] = True

        except Exception as e:
            result['error'] = str(e)
            print(f"❌ Motion error: {e}")

        return result

    def sequential_motion(self, motions: list) -> bool:
        """Execute sequence: gantry moves, then arm performs task"""
        for motion in motions:
            if 'gantry' in motion:
                self.gantry.move_joints(
                    motion['gantry'].get('mm_offsets', [0, 0, 0]),
                    motion['gantry'].get('speed', 0.5)
                )

            if 'arm' in motion:
                arm_cmd = motion['arm']
                if arm_cmd['type'] == 'joint':
                    self.arm.move_joints(arm_cmd['angles'], motion.get('speed', 0.5))
                elif arm_cmd['type'] == 'cartesian':
                    self.arm.move_cartesian(
                        arm_cmd['x'], arm_cmd['y'], arm_cmd['z'],
                        arm_cmd.get('rx', 0), arm_cmd.get('ry', 0), arm_cmd.get('rz', 0)
                    )

            wait = motion.get('wait_sec', 0.5)
            if wait > 0:
                time.sleep(wait)

        return True

    def parallel_motion(self, gantry_cmd: dict, arm_cmd: dict) -> bool:
        """Move gantry + arm simultaneously"""
        def move_gantry():
            self.gantry.move_joints(
                gantry_cmd.get('mm_offsets', [0, 0, 0]),
                gantry_cmd.get('speed', 0.5)
            )

        def move_arm():
            if arm_cmd['type'] == 'joint':
                self.arm.move_joints(arm_cmd['angles'], arm_cmd.get('speed', 0.5))
            elif arm_cmd['type'] == 'cartesian':
                self.arm.move_cartesian(
                    arm_cmd['x'], arm_cmd['y'], arm_cmd['z'],
                    arm_cmd.get('rx', 0), arm_cmd.get('ry', 0), arm_cmd.get('rz', 0)
                )

        t1 = threading.Thread(target=move_gantry)
        t2 = threading.Thread(target=move_arm)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        return True

    def egg_collection_routine(self) -> bool:
        """Predefined: move to nest box, collect egg, return"""
        routine = {
            'type': 'sequential',
            'motions': [
                {'gantry': {'mm_offsets': [300, 200, 200], 'speed': 0.7}, 'wait_sec': 1},
                {'arm': {'type': 'joint', 'angles': [0, 30, 60, 45, 0, 90], 'speed': 0.5}, 'wait_sec': 2},
                {'gantry': {'mm_offsets': [0, 0, -150], 'speed': 0.6}, 'wait_sec': 1},
                {'gantry': {'mm_offsets': [400, 0, 0], 'speed': 0.8}, 'wait_sec': 1},
                {'arm': {'type': 'joint', 'angles': [90, 45, 90, 0, 0, 0], 'speed': 0.5}, 'wait_sec': 1},
            ]
        }
        return self.sequential_motion(routine['motions'])

    def cleaning_sweep_routine(self) -> bool:
        """Predefined: parallel motion for floor sweep"""
        return self.parallel_motion(
            {'mm_offsets': [1200, 0, 0], 'speed': 0.9},
            {'type': 'joint', 'angles': [0, 60, 60, 0, 0, 0], 'speed': 0.7}
        )

    def estop(self) -> bool:
        """Emergency stop both gantry and arm"""
        self.gantry.estop()
        self.arm.estop()
        print("⚠️  EMERGENCY STOP - all motors disabled")
        return True

    def get_state(self) -> dict:
        """Return current state of both systems"""
        return {
            'gantry_position': self.gantry.get_position(),
            'arm_joints': self.arm.get_joint_state(),
            'gantry_connected': self.gantry.is_connected,
            'arm_connected': self.arm.is_connected,
            'is_moving': self.is_moving
        }
