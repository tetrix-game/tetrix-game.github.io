# Architecture Refactoring Plan

**Goal:** Fix 316 ESLint architecture violations by reorganizing folder structure, fixing import paths, and ensuring exports match folder names.

**Status:** In Progress (Phase 1-2 of 6 complete)

**Progress:** 16 violations fixed (316 → 300)

---

## Phase 1: Fix Facade Exports and Style Issues ✅

**Status:** COMPLETE
**Git Commit:** `d1e3ca1`
**Violations Fixed:** 14

### Work Completed

1. **Facade Pattern Conversion** (28 modules)
   - Changed from exporting individual constants/functions to exporting facade objects
   - Pattern: `export const Shared_moduleName = { func1, func2, CONST1 };`
   - Modules converted:
     - `Shared_gridConstants`, `Shared_colorUtils`, `Shared_themeUtils`
     - `Shared_animationConstants`, `Shared_playSound`
     - All shape utilities, reducers (types only), and type modules

2. **Import Updates** (67 files)
   - Updated all imports to use facade pattern with destructuring
   - Pattern:
     ```typescript
     import { Shared_X } from '../Shared_X';
     const { foo, bar } = Shared_X;
     ```

3. **Import Ordering Fixes** (25 files)
   - Moved all imports to top of files (before const destructuring)
   - Fixed "Import in body of module" errors

4. **Style Fixes** (6 files)
   - Fixed line length violations (split long destructuring)
   - Fixed blank line issues (removed extra blank lines)

---

## Phase 2: Restructure Provider Hierarchy ✅

**Status:** COMPLETE
**Git Commit:** Pending
**Violations Fixed:** 2 (302 → 300)

### Work Completed

**2a. Shared_TetrixProvider/**
- Moved `Shared_TetrixDispatchContext/` inside `Shared_useTetrixDispatchContext/`
- Moved `Shared_TetrixStateContext/` inside `Shared_useTetrixStateContext/`
- Updated all import paths to reflect new structure

**2b. Shared_MusicControlProvider/**
- Moved `Shared_MusicControlContext/` from inside hook to provider level (sibling of hook)
- Context is imported by both provider and hook, so it stays at provider level

**2c. Shared_SoundEffectsProvider/**
- Moved `Shared_playSound/` from inside provider to `Shared/` level (has 2 importers)
- Moved `Shared_SoundEffectsContext/` from inside hook to provider level
- Fixed all import paths including `Shared_lineClearingOrchestrator`

**Notes:**
- `Shared_persistence` has 5 importers - stays at root `Shared/` level (as expected)
- Some architecture violations remain due to linter confusion about LCA rules
- Build succeeds, app functionality verified

---

## Phase 3: Move Single-Use Components to Parents

**Status:** PENDING
**Estimated Time:** 5-6 hours

### Priority Components

1. **GameControlsPanel/** - Move child components:
   - `CallToActionPointer/`
   - `PurchasesContainer/`
   - `ShapeQueue/`

2. **Grid/** - Analyze and move single-use children

3. **GridEditor/** - Complex hierarchy, may need `Shared/` subdirectory

4. **Header/** - Move settings/control components inside

**Strategy:** Work bottom-up (leaf components first), verify with grep before moving

---

## Phase 4: Restructure Utility Dependencies

**Status:** PENDING
**Estimated Time:** 8-10 hours
**Risk Level:** HIGH

### Dependency Chains to Collapse

1. **lineClearingOrchestrator chain:**
   ```
   lineClearingOrchestrator/
   ├── clearingAnimationUtils/ (move inside)
   │   └── lineUtils/ (move inside clearingAnimationUtils first)
   └── scoringUtils/ (move inside)
   ```

2. **dailyChallengeSolver chain:**
   - Move `shapeGeometry/`, `Shared_shapeGeneration/`, `Shared_shapeTransforms/` inside

3. **gameOverUtils chain:**
   - Move `Shared_shapeValidation/` inside

**Multi-Use Modules (DO NOT MOVE):**
- `Shared_gridConstants` - 10 imports
- `Shared_persistence` - 7 imports
- `Shared_shapeGeometry` - verify before moving
- `Shared_colorUtils`, `Shared_themeUtils`

---

## Phase 5: Restructure Reducer Dependencies

**Status:** PENDING
**Estimated Time:** 6-8 hours
**Risk Level:** HIGH

### Structure After Moves

```
Shared_reducers/ (inside Shared_TetrixProvider/ after Phase 2)
├── index.ts
├── dragReducer/
│   ├── animationConstants/
│   └── shapeGeometry/
├── gameStateReducer/
│   └── Shared/
│       ├── Shared_gameOverUtils/
│       ├── Shared_gridConstants/
│       └── Shared_statsUtils/
├── shapeReducer/
│   ├── persistence/
│   └── Shared/
│       └── Shared_shapes/
└── tileReducer/
    └── [dependencies]
```

**Critical:** Verify multi-use utilities stay at correct LCA level

---

## Phase 6: Fix Deep Import Paths

**Status:** PENDING
**Estimated Time:** 2-3 hours
**Risk Level:** LOW

### Pattern to Fix

```typescript
// Before: import { foo } from '../Module/utils'
// After:  import { foo } from '../Module'
```

- Update 93 import statements
- Ensure index.ts exports required symbols
- Run lint to verify

---

## Execution Order

1. ✅ Phase 1 (Quick Wins) - Foundation for other changes
2. 🔄 Phase 2 (Providers) - Foundation for other changes
3. Phase 3 (Components) - Independent from utilities/reducers
4. Phase 4 (Utilities) - Must precede Phase 5
5. Phase 5 (Reducers) - Depends on utilities being moved
6. Phase 6 (Import Cleanup) - Final pass after all moves

---

## Critical Files (Will Undergo Significant Changes)

1. `src/main/App/Shared/Shared_TetrixProvider/index.tsx` - Main provider, multiple deps
2. `src/main/App/Shared/Shared_reducers/index.ts` - Reducer composition
3. `src/main/App/Shared/Shared_persistenceAdapter/index.ts` - Persistence logic
4. `src/main/App/Shared/Shared_gridConstants/index.ts` - Multi-use, already has facade
5. `src/main/App/components/GridEditor/index.tsx` - Complex component hierarchy

---

## Verification Strategy

**After Each Phase:**
1. Run `npm run lint:ci` - Check violation count decreases
2. Run `npm run test` - Ensure tests pass
3. Run `npm run build` - Verify build succeeds
4. Visual check - Load app, test affected features

**Final Verification:**
1. `npm run lint:ci` - 0 errors
2. `npm run test` - All tests pass
3. `npm run build` - Clean build
4. Manual smoke test:
   - Game loads and displays grid
   - Shapes can be placed
   - Lines clear correctly
   - Score updates
   - Sound/music works
   - Game modes accessible

---

## Risk Mitigation

- **Git checkpoints** after each phase
- **Bottom-up approach** for dependency trees (move leaves first)
- **Grep verification** before moving any "single-use" module
- **Test after each major change** to catch breakage early
- **Work incrementally** - commit frequently

---

## Estimated Total Time: 27-35 hours

- Phase 1: 2-3 hours ✅ DONE
- Phase 2: 4-5 hours 🔄 IN PROGRESS
- Phase 3: 5-6 hours
- Phase 4: 8-10 hours
- Phase 5: 6-8 hours
- Phase 6: 2-3 hours
