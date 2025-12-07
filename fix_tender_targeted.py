#!/usr/bin/env python3
"""Targeted fix for tender.py - fixes broken route_lines pattern"""
import os
import sys

# Get the file path
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'applications', 'tendercells_ui', 'tender.py')

if not os.path.exists(file_path):
    # Try from current directory
    file_path = os.path.join('applications', 'tendercells_ui', 'tender.py')

print(f"Fixing: {file_path}")
if not os.path.exists(file_path):
    print(f"ERROR: File not found at {file_path}")
    print(f"Current directory: {os.getcwd()}")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")

fixed_lines = []
i = 0
fixes = 0

while i < len(lines):
    line = lines[i]
    
    # Check for broken route_lines = " pattern (not followed by .join on same line)
    if 'route_lines = "' in line and '".join(' not in line:
        # Look ahead for ".join( pattern
        found_join = False
        join_line_idx = None
        for j in range(1, 6):
            if i + j < len(lines) and '".join(' in lines[i + j]:
                found_join = True
                join_line_idx = i + j
                break
        
        if found_join:
            # Replace broken pattern with correct one
            fixed_lines.append('        route_lines = "\\n".join(\n')
            # Skip the broken lines (the route_lines line, blank lines, and the ".join( line)
            i = join_line_idx + 1
            fixes += 1
            print(f"Fixed broken route_lines at line {i - join_line_idx}")
            continue
    
    # Fix literal \n\n in accept attribute
    if 'accept=".glb,.gltf"\\n\\n' in line:
        original = line
        line = line.replace(
            'accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n',
            'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n'
        )
        if line != original:
            fixes += 1
            print(f"Fixed literal \\n\\n at line {i+1}")
    
    fixed_lines.append(line)
    i += 1

if fixes > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    print(f"\n✅ Applied {fixes} fixes successfully!")
else:
    print("\n⚠️  No fixes were needed")

print("Done!")





