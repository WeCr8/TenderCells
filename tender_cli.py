#!/usr/bin/env python3
"""
Runner script for TenderCells scaffolding generator.
Can be run from project root.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from applications.tendercells_ui.cli import main

if __name__ == "__main__":
    main()



