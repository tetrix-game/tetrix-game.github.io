# Structure Flattening Script

## Overview

`flatten-structure.ts` is a script that completely flattens the `src/` directory structure, moving all module folders (folders containing an `index.ts` or `index.tsx` file) to be direct children of `src/`.

## What it does

1. **Discovers all modules**: Recursively scans `src/` for all folders containing an `index.ts` or `index.tsx` file
2. **Updates imports**: Uses ts-morph to update all import/export statements throughout the codebase to reflect the new flat structure
3. **Moves directories**: Physically moves all module folders to `src/`, preserving their contents
4. **Cleans up**: Removes any empty directories left behind after the move

## Before running

**⚠️ IMPORTANT: This script will significantly restructure your codebase. Make sure you:**
- Have committed all your current work
- Have a clean git working tree
- Are prepared to review the changes

## Usage

```bash
npm run flatten
```

Or directly with tsx:

```bash
tsx scripts/flatten-structure.ts
```

## Example transformation

### Before:
```
src/
├── main/
│   └── App/
│       ├── Shared/
│       │   ├── Shared_types/
│       │   │   └── index.ts
│       │   └── Shared_gridConstants/
│       │       └── index.ts
│       └── components/
│           └── GameControlsPanel/
│               └── index.tsx
```

### After:
```
src/
├── main/
│   └── index.tsx
├── App/
│   └── index.tsx
├── Shared_types/
│   └── index.ts
├── Shared_gridConstants/
│   └── index.ts
└── GameControlsPanel/
    └── index.tsx
```

## Naming conflicts

If two modules have the same name (e.g., both called `utils/`), the script will automatically rename the second one by appending a number (e.g., `utils_1/`).

## What happens to imports

All relative imports are automatically updated. For example:

**Before:**
```typescript
import { Shared_types } from '../Shared/Shared_types';
```

**After:**
```typescript
import { Shared_types } from '../Shared_types';
```

## After running

1. Review the changes with `git diff`
2. Run tests: `npm test`
3. Run lint: `npm run lint`
4. Verify the app still works: `npm run dev`
5. Commit the restructured code

## Troubleshooting

- If imports are broken, the script may not have correctly resolved all paths. Check the console output for warnings.
- If directories weren't moved, check for file permissions issues.
- If you encounter issues, revert with `git reset --hard` and report the issue.
