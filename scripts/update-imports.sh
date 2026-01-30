#!/bin/bash
# Updates import paths after moving a component
# Usage: ./scripts/update-imports.sh <ComponentName> <OldPath> <NewPath>

COMPONENT=$1
OLD_PATH=$2
NEW_PATH=$3

if [ -z "$COMPONENT" ] || [ -z "$OLD_PATH" ] || [ -z "$NEW_PATH" ]; then
  echo "Usage: ./update-imports.sh <ComponentName> <OldPath> <NewPath>"
  echo "Example: ./update-imports.sh Overlay components/Overlay Shared/Overlay"
  exit 1
fi

echo "🔄 Updating imports for $COMPONENT..."
echo "   From: $OLD_PATH"
echo "   To: $NEW_PATH"

# Find all TypeScript files and update imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s|from ['\"]\.\./$OLD_PATH|from '../$NEW_PATH|g" \
  -e "s|from ['\"]\.\.\/\.\./$OLD_PATH|from '../$NEW_PATH|g" \
  -e "s|from ['\"]\.\.\/\.\.\/\.\./$OLD_PATH|from '../$NEW_PATH|g" \
  {} +

echo "✅ Import paths updated!"
