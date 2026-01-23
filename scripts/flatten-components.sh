#!/bin/bash
# Flattens double-nested component directories
# Pattern: ComponentName/ComponentName/* -> ComponentName/*

cd src/components

for dir in */; do
  component=$(basename "$dir")
  nested_dir="$dir$component"

  if [ -d "$nested_dir" ]; then
    echo "Flattening $component..."

    # Move files up one level
    git mv "$nested_dir"/* "$dir/" 2>/dev/null

    # Update CSS imports inside index.tsx if needed
    if [ -f "$dir/index.tsx" ]; then
      sed -i '' "s|import ['\"]\./$component\.css|import './$component.css|g" "$dir/index.tsx"
    fi

    # Remove empty nested directory
    rmdir "$nested_dir" 2>/dev/null

    echo "✅ Flattened $component"
  fi
done

echo ""
echo "Component flattening complete!"
