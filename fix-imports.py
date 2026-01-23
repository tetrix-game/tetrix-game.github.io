#!/usr/bin/env python3
"""
Fix Import Paths After Refactoring
All files moved one level deeper, so all relative imports need one more "../"
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """Fix relative imports in a file by adding one more '../'"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern 1: from statements with relative paths
    # Add one more "../" to paths starting with "../"
    content = re.sub(
        r"(from\s+['\"])(\.\./)",
        r"\1../\2",
        content
    )

    # Pattern 2: Change "./" to "../" for imports
    content = re.sub(
        r"(from\s+['\"])(\./)([^'\"]+['\"])",
        r"\1../\3",
        content
    )

    # Pattern 3: Fix inline import() type assertions
    # import('./something') -> import('../something')
    # import('../something') -> import('../../something')
    content = re.sub(
        r"(import\(['\"])(\.\./)",
        r"\1../\2",
        content
    )

    content = re.sub(
        r"(import\(['\"])(\./)([^'\"]+['\"])",
        r"\1../\3",
        content
    )

    # Return True if content changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print("Fixing import paths after refactoring...")
    print("=" * 50)

    fixed_count = 0
    src_path = Path("src")

    # Find all nested index files (files that were moved)
    # These are index.{ts,tsx} files that are NOT at the root of major folders
    for index_file in src_path.rglob("index.t*"):
        # Skip if not .ts or .tsx
        if index_file.suffix not in ['.ts', '.tsx']:
            continue

        # Get the directory structure
        parts = index_file.parts

        # Skip root-level index files (src/types/index.ts, src/components/index.tsx, etc.)
        # We only want nested ones like src/types/core/index.ts
        if len(parts) < 3:  # src/folder/index.ts
            continue

        # Check if this is a nested file (has a grandparent directory)
        parent_dir = index_file.parent.name
        grandparent_dir = index_file.parent.parent.name

        # Skip if parent is a top-level directory
        if grandparent_dir == "src":
            continue

        # This is a nested index file that was moved, fix its imports
        if fix_imports_in_file(index_file):
            fixed_count += 1
            print(f"✓ Fixed: {index_file}")

    print()
    print("=" * 50)
    print(f"Import fixing complete!")
    print(f"Files fixed: {fixed_count}")
    print("=" * 50)

if __name__ == "__main__":
    main()
