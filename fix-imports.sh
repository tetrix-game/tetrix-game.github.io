#!/bin/bash

# Fix Import Paths After Refactoring
# All files moved one level deeper, so all relative imports need one more "../"

set -e

echo "Fixing import paths after refactoring..."
echo "=========================================="

fixed_count=0

# Find all nested index files (these are the ones that moved)
# Pattern: src/something/name/index.{ts,tsx} where name is not "index"
moved_files=$(find src -type f \( -name "index.ts" -o -name "index.tsx" \) | while read file; do
    dir=$(dirname "$file")
    parent=$(dirname "$dir")
    basename=$(basename "$dir")

    # Check if this is a nested index file (not at root of src/types, src/components, etc.)
    # by checking if parent has an index.ts/tsx file
    if [ "$basename" != "src" ] && [ "$basename" != "types" ] && [ "$basename" != "components" ] && [ "$basename" != "hooks" ] && [ "$basename" != "reducers" ] && [ "$basename" != "utils" ] && [ "$basename" != "test" ]; then
        echo "$file"
    fi
done)

for file in $moved_files; do
    if [ ! -f "$file" ]; then
        continue
    fi

    # Create a temporary file for processing
    temp_file=$(mktemp)

    # Process the file line by line
    changed=false
    while IFS= read -r line; do
        # Check if line contains a relative import
        if [[ $line =~ from\ [\'\"]\. ]]; then
            # Add one more "../" to the path
            # Replace patterns:
            # from '../ -> from '../../
            # from "./ -> from "../

            new_line=$(echo "$line" | sed 's|from '\''\.\.\/|from '\''../../|g; s|from "\.\.\/|from "../../|g; s|from '\''\.\/|from '\''../|g; s|from "\.\/|from "../|g')

            if [ "$new_line" != "$line" ]; then
                changed=true
            fi
            echo "$new_line" >> "$temp_file"
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$file"

    # If changes were made, replace the original file
    if [ "$changed" = true ]; then
        mv "$temp_file" "$file"
        ((fixed_count++))
        echo "✓ Fixed: $file"
    else
        rm "$temp_file"
    fi
done

echo ""
echo "=========================================="
echo "Import fixing complete!"
echo "Files fixed: $fixed_count"
echo "=========================================="
