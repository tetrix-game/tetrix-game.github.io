#!/bin/bash

# Index-Only Files Architecture Refactoring Script
# This script moves files to comply with the architecture/index-only-files rule

set -e  # Exit on error

echo "Starting index-only-files refactoring..."
echo "=========================================="

# Counter for moved files
moved_count=0

# Function to move a file to nested index structure
move_to_index() {
    local file_path="$1"

    # Skip if file doesn't exist
    if [ ! -f "$file_path" ]; then
        echo "⚠ Skipped (not found): $file_path"
        return
    fi

    local dir=$(dirname "$file_path")
    local filename=$(basename "$file_path")
    local name="${filename%.*}"
    local ext="${filename##*.}"

    # Create nested folder
    local new_dir="$dir/$name"
    mkdir -p "$new_dir"

    # Move file to index.ext
    git mv "$file_path" "$new_dir/index.$ext"
    ((moved_count++))

    echo "✓ Moved: $file_path → $new_dir/index.$ext"

    # Check for associated CSS file
    local css_file="$dir/$name.css"
    if [ -f "$css_file" ]; then
        git mv "$css_file" "$new_dir/$name.css"
        echo "  └─ CSS: $css_file → $new_dir/$name.css"
    fi
}

# Get all non-index TypeScript files
echo "Finding all non-index TypeScript files..."
files=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -name "index.ts" ! -name "index.tsx" ! -name "*.test.ts" ! -name "*.test.tsx" | sort)

total_files=$(echo "$files" | wc -l | tr -d ' ')
echo "Found $total_files files to process"
echo ""

# Process each file
current=0
for file in $files; do
    ((current++))
    echo "[$current/$total_files] Processing: $file"
    move_to_index "$file"
done

echo ""
echo "=========================================="
echo "Refactoring complete!"
echo "Files moved: $moved_count"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update central re-export files (types/index.ts, reducers/index.ts, etc.)"
echo "2. Run lint verification"
echo "3. Run build verification"
echo "4. Run test verification"
