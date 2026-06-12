#!/usr/bin/env python3
"""Final fix for tender.py - removes duplicate broken express_router function"""
import os

# Find the file
possible_paths = [
    os.path.join('applications', 'tendercells_ui', 'tender.py'),
    os.path.join(os.getcwd(), 'applications', 'tendercells_ui', 'tender.py'),
]

file_path = None
for path in possible_paths:
    if os.path.exists(path):
        file_path = path
        break

if not file_path:
    print("ERROR: Could not find tender.py")
    print(f"Current directory: {os.getcwd()}")
    print(f"Tried paths: {possible_paths}")
    exit(1)

print(f"Fixing: {file_path}")

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")

# Find and fix broken route_lines patterns
fixed_lines = []
i = 0
fixes = 0

while i < len(lines):
    line = lines[i]
    
    # Check for broken route_lines = " pattern
    if 'route_lines = "' in line and not '".join(' in line:
        # Look ahead up to 5 lines for ".join(
        found_join = False
        skip_count = 0
        for j in range(1, 6):
            if i + j < len(lines):
                if '".join(' in lines[i + j]:
                    found_join = True
                    skip_count = j + 1
                    break
        
        if found_join:
            # Replace with correct version
            fixed_lines.append('        route_lines = "\\n".join(\n')
            i += skip_count
            fixes += 1
            print(f"Fixed broken route_lines at line {i - skip_count + 1}")
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
    print("\n⚠️  No fixes were needed (or pattern not found)")

print("Done!")






