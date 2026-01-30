#!/bin/bash
set -e

echo "Updating TetrixProvider imports..."

# Update imports
find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../../Shared/Shared_TetrixProvider/Shared_useTetrixDispatchContext'|from '../../Shared/Shared_TetrixProvider'|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../../Shared/Shared_TetrixProvider/Shared_useTetrixStateContext'|from '../../Shared/Shared_TetrixProvider'|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_TetrixProvider/Shared_useTetrixDispatchContext'|from '../Shared/Shared_TetrixProvider'|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_TetrixProvider/Shared_useTetrixStateContext'|from '../Shared/Shared_TetrixProvider'|g" {} \;

# Update usage
find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|Shared_useTetrixDispatchContext|useTetrixDispatchContext|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|Shared_useTetrixStateContext|useTetrixStateContext|g" {} \;

echo "Import updates complete!"
