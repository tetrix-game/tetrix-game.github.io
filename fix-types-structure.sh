#!/bin/bash
set -e

echo "=== Fixing Shared_types structure ==="

cd src/main/App/Shared/Shared_types

# Rename subdirectories to have Shared_ prefix
echo "Renaming subdirectories..."
for dir in animation core drag gameState persistence scoring shapeQueue stats theme; do
  if [ -d "$dir" ]; then
    echo "  Renaming $dir to Shared_$dir..."
    mv "$dir" "Shared_$dir"
  fi
done

# Fix facade exports in each subdirectory
echo "Updating facade exports..."

# Core types
if [ -f "Shared_core/index.ts" ]; then
  sed -i '' 's/export const core = {/export const Shared_core = {/' Shared_core/index.ts
fi

# Update the main index.ts to re-export facades
cat > index.ts << 'EOF'
// Facade export for Shared_types
// Re-export all facades from subdirectories
export { Shared_animation } from './Shared_animation';
export { Shared_core } from './Shared_core';
export { Shared_drag } from './Shared_drag';
export { Shared_gameState } from './Shared_gameState';
export { Shared_persistence } from './Shared_persistence';
export { Shared_scoring } from './Shared_scoring';
export { Shared_shapeQueue } from './Shared_shapeQueue';
export { Shared_stats } from './Shared_stats';
export { Shared_theme } from './Shared_theme';

// Re-export all types
export * from './Shared_animation';
export * from './Shared_core';
export * from './Shared_drag';
export * from './Shared_gameState';
export * from './Shared_persistence';
export * from './Shared_scoring';
export * from './Shared_shapeQueue';
export * from './Shared_stats';
export * from './Shared_theme';

export const Shared_types = {};
EOF

echo "Structure fixed!"
