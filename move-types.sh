#!/bin/bash
set -e

echo "=== Phase 1: Move Types to Shared ==="

# Create Shared_types directory
echo "Creating Shared_types directory..."
mkdir -p src/main/App/Shared/Shared_types

# Move all type subdirectories
echo "Moving type subdirectories..."
for dir in animation core drag gameState persistence scoring shapeQueue stats theme; do
  if [ -d "src/main/App/types/$dir" ]; then
    echo "  Moving $dir..."
    mv "src/main/App/types/$dir" "src/main/App/Shared/Shared_types/$dir"
  fi
done

# Create facade export
echo "Creating facade export..."
cat > src/main/App/Shared/Shared_types/index.ts << 'EOF'
// Facade export for Shared_types
export * from './animation';
export * from './core';
export * from './drag';
export * from './gameState';
export * from './persistence';
export * from './scoring';
export * from './shapeQueue';
export * from './stats';
export * from './theme';

export const Shared_types = {};
EOF

# Update imports - handle different quote styles
echo "Updating imports..."
find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from ['\"]../types/|from '../Shared/Shared_types/|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from ['\"]../types/|from '../Shared/Shared_types/|g" {} \;

# Delete old types directory
echo "Deleting old types directory..."
if [ -d "src/main/App/types" ]; then
  rm -rf src/main/App/types
fi

echo "Phase 1 complete!"
