#!/usr/bin/env python3
"""Fix syntax errors in tender.py"""
import os

# Get the script directory and construct file path
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'applications', 'tendercells_ui', 'tender.py')

print(f"Reading {file_path}...")
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")
fixed_lines = []
i = 0
fixes_applied = 0

while i < len(lines):
    line = lines[i]
    
    # Fix 1: Broken route_lines assignment
    if 'route_lines = "' in line:
        # Check if next few lines have the broken pattern
        if i + 3 < len(lines) and '".join(' in lines[i + 3]:
            print(f"Found broken route_lines at line {i+1}")
            fixed_lines.append('        route_lines = "\\n".join(\n')
            i += 4  # Skip the 4 broken lines
            fixes_applied += 1
            continue
    
    # Fix 2: Literal \n\n in accept attribute
    if 'accept=".glb,.gltf"\\n\\n' in line:
        print(f"Found literal \\n\\n at line {i+1}")
        line = line.replace(
            'accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n',
            'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n'
        )
        fixes_applied += 1
    
    fixed_lines.append(line)
    i += 1

print(f"Applied {fixes_applied} fixes")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Fixed syntax errors in tender.py")

