import os
import sys

# Modules live next to the controllers (flat layout used by coordinated_motion_controller).
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
