#!/usr/bin/env python3
"""Fix all syntax errors in tender.py"""
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'applications', 'tendercells_ui', 'tender.py')

print(f"Reading {file_path}...")
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")
fixed_lines = []
i = 0
fixes = 0

while i < len(lines):
    line = lines[i]
    
    # Fix broken route_lines patterns
    if 'route_lines = "' in line and i + 3 < len(lines):
        # Check if next lines have ".join(
        if '".join(' in lines[i + 3]:
            print(f"Fix 1: Found broken route_lines at line {i+1}")
            fixed_lines.append('        route_lines = "\\n".join(\n')
            i += 4
            fixes += 1
            continue
        # Check for malformed join pattern
        elif '\\n".join(' in line or '\\n".join(\\n".join(' in line:
            print(f"Fix 2: Found malformed join at line {i+1}")
            fixed_lines.append('        route_lines = "\\n".join(\n')
            i += 1
            fixes += 1
            continue
    
    # Fix literal \n\n in accept attribute
    if 'accept=".glb,.gltf"\\n\\n' in line:
        print(f"Fix 3: Found literal \\n\\n at line {i+1}")
        line = line.replace(
            'accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n',
            'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n'
        )
        fixes += 1
    
    fixed_lines.append(line)
    i += 1

print(f"Applied {fixes} fixes")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Fixed all syntax errors!")

