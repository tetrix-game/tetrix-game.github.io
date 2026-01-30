#!/bin/bash
set -e

echo "Updating SoundEffectsProvider imports..."

# Update import paths
find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_SoundEffectsProvider/Shared_useSoundEffects'|from '../Shared/Shared_SoundEffectsProvider'|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared/Shared_SoundEffectsProvider/types'|from '../Shared/Shared_SoundEffectsProvider'|g" {} \;

find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|from '../Shared_SoundEffectsProvider/types'|from '../Shared_SoundEffectsProvider'|g" {} \;

# Update usage
find src/main/App -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  "s|Shared_useSoundEffects|useSoundEffects|g" {} \;

echo "Import updates complete!"
