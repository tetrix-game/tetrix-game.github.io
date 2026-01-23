#!/usr/bin/env python3
"""
Complete Index-Only Files Refactoring
Moves files and fixes imports in a single pass
"""

import os
import re
import subprocess
from pathlib import Path

def add_one_level_to_path(import_path):
    """Add one ../ to a relative import path"""
    if import_path.startswith("./"):
        return "../" + import_path[2:]
    elif import_path.startswith("../"):
        return "../" + import_path
    return import_path

def fix_import_statement(match):
    """Fix a single import statement"""
    before = match.group(1)  # 'from "' or 'from \'' or 'import("' or 'import(\''
    path = match.group(2)     # the import path
    after = match.group(3)    # '"' or '\'' or '")' or '\')'

    # Only fix relative imports
    if path.startswith(('./', '../')):
        new_path = add_one_level_to_path(path)
        return f"{before}{new_path}{after}"
    return match.group(0)

def fix_imports_in_content(content):
    """Fix all imports in file content"""
    # Pattern for from statements: from './path' or from "../path"
    content = re.sub(
        r'''(from\s+['"])([./][^'"]+)(['"])''',
        fix_import_statement,
        content
    )

    # Pattern for inline import(): import('./path') or import("../path")
    content = re.sub(
        r'''(import\(['"])([./][^'"]+)(['"]\))''',
        fix_import_statement,
        content
    )

    return content

def move_file_and_fix_imports(src_file):
    """Move a file to nested index structure and fix its imports"""
    src_path = Path(src_file)

    if not src_path.exists():
        return False, f"File not found: {src_file}"

    # Calculate target path
    parent_dir = src_path.parent
    file_name = src_path.stem  # filename without extension
    file_ext = src_path.suffix  # .ts or .tsx

    # Create nested directory
    nested_dir = parent_dir / file_name
    nested_dir.mkdir(parents=True, exist_ok=True)

    # Target file path
    target_file = nested_dir / f"index{file_ext}"

    # Read original content
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix imports
    fixed_content = fix_imports_in_content(content)

    # Write fixed content to new location
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    # Use git mv to preserve history (move to temp first, then to final location)
    try:
        subprocess.run(['git', 'add', str(target_file)], check=True, capture_output=True)
        subprocess.run(['git', 'rm', str(src_path)], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        return False, f"Git operation failed: {e}"

    # Check for and move associated CSS file
    css_file = parent_dir / f"{file_name}.css"
    if css_file.exists():
        target_css = nested_dir / f"{file_name}.css"
        subprocess.run(['git', 'mv', str(css_file), str(target_css)], check=True, capture_output=True)
        return True, f"Moved {src_file} and {css_file}"

    return True, f"Moved {src_file}"

def main():
    print("Complete index-only-files refactoring...")
    print("=" * 60)

    # Find all non-index TypeScript files
    result = subprocess.run(
        ['find', 'src', '-type', 'f', '(', '-name', '*.ts', '-o', '-name', '*.tsx', ')',
         '!', '-name', 'index.ts', '!', '-name', 'index.tsx',
         '!', '-name', '*.test.ts', '!', '-name', '*.test.tsx'],
        capture_output=True,
        text=True
    )

    files_to_move = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
    files_to_move.sort()

    print(f"Found {len(files_to_move)} files to process\n")

    success_count = 0
    error_count = 0

    for i, file_path in enumerate(files_to_move, 1):
        print(f"[{i}/{len(files_to_move)}] Processing: {file_path}")
        success, message = move_file_and_fix_imports(file_path)

        if success:
            success_count += 1
            print(f"  ✓ {message}")
        else:
            error_count += 1
            print(f"  ✗ {message}")

    print()
    print("=" * 60)
    print(f"Refactoring complete!")
    print(f"Successfully processed: {success_count}")
    print(f"Errors: {error_count}")
    print("=" * 60)

    if error_count == 0:
        print("\nNext steps:")
        print("1. Review changes: git status")
        print("2. Run build: npm run build")
        print("3. Run tests: npm run test")
        print("4. Commit: git commit -m 'refactor: move files to index-only structure'")

if __name__ == "__main__":
    main()
