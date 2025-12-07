import os
import sys
# Get the directory where this script is located
if hasattr(sys, 'frozen'):
    script_dir = os.path.dirname(sys.executable)
else:
    script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'applications', 'tendercells_ui', 'tender.py')
print(f"Looking for file at: {file_path}")
if not os.path.exists(file_path):
    # Try relative to current working directory
    file_path = os.path.join('applications', 'tendercells_ui', 'tender.py')
    print(f"Trying: {file_path}")
if not os.path.exists(file_path):
    # Try absolute path from current directory
    cwd = os.getcwd()
    file_path = os.path.join(cwd, 'applications', 'tendercells_ui', 'tender.py')
    print(f"Trying: {file_path}")
print(f"Using file: {file_path}")
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = []
i = 0
fixes = 0
while i < len(lines):
    line = lines[i]
    if 'route_lines = "' in line and i + 3 < len(lines) and '".join(' in lines[i + 3]:
        fixed.append('        route_lines = "\\n".join(\n')
        i += 4
        fixes += 1
        print(f'Fixed route_lines at line {i-3}')
        continue
    if 'accept=".glb,.gltf"\\n\\n' in line:
        line = line.replace('accept=".glb,.gltf"\\n\\n              style={{ display: \'none\' }}\\n\\n', 'accept=".glb,.gltf"\n              style={{ display: \'none\' }}\n')
        fixes += 1
        print(f'Fixed accept at line {i+1}')
    fixed.append(line)
    i += 1

if fixes > 0:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed)
    print(f'Applied {fixes} fixes')
else:
    print('No fixes needed')

