#!/usr/bin/env python3
"""Direct fix for tender.py syntax errors"""
import os

# Get absolute path
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'applications', 'tendercells_ui', 'tender.py')

print(f"Fixing {file_path}...")

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count fixes
fixes = 0

# Fix 1: route_lines = " followed by newlines and ".join(
# This pattern appears multiple times
import re

# Pattern 1: route_lines = " followed by blank lines and ".join(
pattern1 = r'route_lines = "\s+"\.join\('
if re.search(pattern1, content, re.MULTILINE):
    content = re.sub(pattern1, r'route_lines = "\\n".join(', content, flags=re.MULTILINE)
    fixes += 1
    print("Fixed pattern 1")

# Pattern 2: route_lines = " on one line, then blank lines, then ".join( on another line
# We need to handle this line by line
lines = content.split('\n')
fixed_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check for broken route_lines pattern
    if 'route_lines = "' in line and not '".join(' in line:
        # Look ahead to see if there's a ".join( pattern
        lookahead = 1
        found_join = False
        while lookahead <= 5 and i + lookahead < len(lines):
            if '".join(' in lines[i + lookahead]:
                found_join = True
                # Replace the broken pattern
                fixed_lines.append('        route_lines = "\\n".join(')
                # Skip the blank lines and the ".join( line
                i += lookahead + 1
                fixes += 1
                print(f"Fixed broken route_lines at line {i+1}")
                break
            lookahead += 1
        
        if found_join:
            continue
    
    # Fix literal \n\n in accept attribute
    if 'accept=".glb,.gltf"\\n\\n' in line:
        line = line.replace(
            'accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n',
            'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n'
        )
        fixes += 1
        print(f"Fixed literal \\n\\n at line {i+1}")
    
    fixed_lines.append(line)
    i += 1

if fixes > 0:
    content = '\n'.join(fixed_lines)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied {fixes} fixes")
else:
    print("No fixes needed")

print("Done!")





