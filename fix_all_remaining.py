#!/usr/bin/env python3
"""Fix all remaining string literal issues"""
import re

with open('applications/tendercells_ui/tender.py', 'rb') as f:
    content = f.read().decode('utf-8')

# Fix field_lines = "<newline>".join pattern
content = content.replace('field_lines = "\n".join', 'field_lines = "\\n".join')
# But we need to fix the actual multi-line version
# Pattern: field_lines = "<literal newline>".join
lines = content.split('\n')
output = []
i = 0
while i < len(lines):
    if i < len(lines) and 'field_lines = "' in lines[i]:
        # Check if next line is just ".join
        if i+3 < len(lines) and '".join' in lines[i+3]:
            # This is the multi-line version - fix it
            output.append('        field_lines = "\\n".join(f" {k}: {v};" for k, v in fields.items())')
            i += 4
            continue
    # Fix route_lines = " broken pattern
    if i < len(lines) and 'route_lines = "' in lines[i]:
        # Check if next lines have ".join(
        if i+3 < len(lines) and '".join(' in lines[i+3]:
            # This is the multi-line version - fix it
            output.append('        route_lines = "\\n".join(')
            i += 4
            continue
    output.append(lines[i])
    i += 1

content = '\n'.join(output)

with open('applications/tendercells_ui/tender.py', 'wb') as f:
    f.write(content.encode('utf-8'))

print("Fixed remaining issues")

