#!/usr/bin/env python3
"""Fix syntax errors in tender.py"""
import re

file_path = 'applications/tendercells_ui/tender.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Fix broken route_lines assignment
# Pattern: route_lines = " followed by newlines and ".join(
# Match: route_lines = " followed by any whitespace and ".join(
lines = content.split('\n')
fixed_lines = []
i = 0
while i < len(lines):
    if 'route_lines = "' in lines[i] and i + 3 < len(lines) and '".join(' in lines[i + 3]:
        # Found the broken pattern - fix it
        fixed_lines.append('        route_lines = "\\n".join(')
        i += 4  # Skip the broken lines
        continue
    fixed_lines.append(lines[i])
    i += 1
content = '\n'.join(fixed_lines)

# Fix 2: Fix literal \n\n in accept attribute  
# Replace literal \n\n with actual newlines
content = content.replace(
    'accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n',
    'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n'
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors in tender.py")

