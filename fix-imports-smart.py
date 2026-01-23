#!/usr/bin/env python3
"""
Smart Import Path Fixer
Intelligently fix import paths after moving files one level deeper
"""

import re
from pathlib import Path

def count_levels_up(path_str):
    """Count how many levels up a relative path goes"""
    parts = path_str.split("/")
    count = 0
    for part in parts:
        if part == "..":
            count += 1
        else:
            break
    return count

def add_one_level(import_path):
    """Add one more ../ to a relative import path"""
    if import_path.startswith("./"):
        # ./ becomes ../
        return "../" + import_path[2:]
    elif import_path.startswith("../"):
        # ../ becomes ../../
        return "../" + import_path
    else:
        # Shouldn't happen for relative imports, but handle it
        return import_path

def fix_imports_in_file(file_path):
    """Fix all relative imports in a file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changed = False
    new_lines = []

    for line in lines:
        original_line = line

        # Pattern 1: from 'path' or from "path"
        match = re.search(r'''(from\s+['"])([./][^'"]+)(['"])''', line)
        if match:
            prefix = match.group(1)
            path = match.group(2)
            suffix = match.group(3)
            new_path = add_one_level(path)
            new_line = line.replace(f"{prefix}{path}{suffix}", f"{prefix}{new_path}{suffix}")
            line = new_line
            if line != original_line:
                changed = True

        # Pattern 2: import('path') or import("path")
        match = re.search(r'''(import\(['"])([./][^'"]+)(['"]\))''', line)
        if match:
            prefix = match.group(1)
            path = match.group(2)
            suffix = match.group(3)
            new_path = add_one_level(path)
            new_line = line.replace(f"{prefix}{path}{suffix}", f"{prefix}{new_path}{suffix}")
            line = new_line
            if line != original_line:
                changed = True

        new_lines.append(line)

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def main():
    print("Smart import path fixing...")
    print("=" * 50)

    fixed_count = 0
    src_path = Path("src")

    # Find all nested index files (files that were moved)
    for index_file in src_path.rglob("index.t*"):
        if index_file.suffix not in ['.ts', '.tsx']:
            continue

        parts = index_file.parts
        if len(parts) < 3:
            continue

        grandparent_dir = index_file.parent.parent.name
        if grandparent_dir == "src":
            continue

        if fix_imports_in_file(index_file):
            fixed_count += 1
            print(f"✓ Fixed: {index_file}")

    print()
    print("=" * 50)
    print(f"Smart fixing complete!")
    print(f"Files fixed: {fixed_count}")
    print("=" * 50)

if __name__ == "__main__":
    main()
