#!/usr/bin/env python3
"""
Fix Over-Corrected Import Paths
Remove one level of ../ from paths that were corrected twice
"""

import re
from pathlib import Path

def fix_overcorrection_in_file(file_path):
    """Remove one level of ../ from over-corrected imports"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern 1: from statements - remove one ../
    # ../../ -> ../
    content = re.sub(
        r"(from\s+['\"])(\.\./)+",
        lambda m: m.group(1) + "../" * (m.group(0).count("../") - 1),
        content
    )

    # Pattern 2: inline import() - remove one ../
    content = re.sub(
        r"(import\(['\"])(\.\./)+",
        lambda m: m.group(1) + "../" * (m.group(0).count("../") - 1),
        content
    )

    # Return True if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print("Fixing over-corrected import paths...")
    print("=" * 50)

    fixed_count = 0
    src_path = Path("src")

    # Fix all nested index files
    for index_file in src_path.rglob("index.t*"):
        if index_file.suffix not in ['.ts', '.tsx']:
            continue

        parts = index_file.parts
        if len(parts) < 3:
            continue

        grandparent_dir = index_file.parent.parent.name
        if grandparent_dir == "src":
            continue

        if fix_overcorrection_in_file(index_file):
            fixed_count += 1
            print(f"✓ Fixed: {index_file}")

    print()
    print("=" * 50)
    print(f"Over-correction fixing complete!")
    print(f"Files fixed: {fixed_count}")
    print("=" * 50)

if __name__ == "__main__":
    main()
