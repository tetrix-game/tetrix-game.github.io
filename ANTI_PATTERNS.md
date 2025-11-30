# Anti-Patterns & Architectural Review

This document identifies architectural anti-patterns currently present in the codebase and provides recommendations for remediation.

## 1. Side Effects in Reducers (Critical)

**Severity:** High
**Location:** `src/reducers/tileReducer.ts`, `src/reducers/gameStateReducer.ts`

### Description
Redux reducers must be **pure functions**. They should take the current state and an action, and return the new state. They should **never** trigger side effects like API calls, database saves, or DOM modifications.

### Evidence
The `safeBatchSave` function (an asynchronous IndexedDB operation) is called directly within reducer cases:

*   `src/reducers/tileReducer.ts`:
    *   `COMPLETE_PLACEMENT`: Calls `safeBatchSave` to persist score and tiles.
    *   `DEBUG_*` actions: Call `safeBatchSave`.
*   `src/reducers/gameStateReducer.ts`:
    *   `SET_GAME_MODE`, `UNLOCK_MAP`, `UNLOCK_MODIFIER`: Call persistence functions.

### Consequences
*   **Race Conditions:** Multiple rapid actions can trigger multiple async saves. Since the reducer doesn't await them, an older save might finish *after* a newer one, overwriting the latest data with stale data.
*   **Testing Difficulty:** Unit tests for reducers now have to mock the persistence layer or deal with async side effects, making them complex and brittle.
*   **Unpredictable Behavior:** The flow of data is no longer synchronous and predictable.

### Recommended Solution
Move persistence logic out of the reducer.
1.  **Middleware Pattern:** Use a middleware (like Redux Thunk or a custom middleware) to handle the side effect *after* the action is dispatched.
2.  **Listener Pattern:** Use a `useEffect` hook in a top-level component (e.g., `Main.tsx` or a dedicated `PersistenceManager` component) that subscribes to state changes and handles saving.

## 2. Expensive Operations in Render Loops

**Severity:** Medium
**Location:** `src/components/Grid/Grid.tsx`

### Description
Performing expensive operations (like Regex parsing or object instantiation) inside a render loop (e.g., `map`) causes performance degradation, especially as the grid grows.

### Evidence
In `Grid.tsx`:
```typescript
allPositions.map((position) => {
  // ...
  const match = position.match(/R(\d+)C(\d+)/); // Regex parsing on every render for every tile
  // ...
})
```
And:
```typescript
const hoveredBlockMap = new Map(...) // Created fresh on every render
```

### Consequences
*   **UI Jank:** Parsing regex for 100+ tiles on every frame (during animations or drag events) can cause frame drops.
*   **GC Pressure:** Creating new objects/maps on every render increases garbage collection frequency.

### Recommended Solution
*   **Pre-calculate Data:** Store row/col indices in the `allPositions` array so they don't need to be parsed.
*   **Memoize:** Wrap `hoveredBlockMap` creation in `useMemo`.

## 3. Logic Coupled with UI

**Severity:** Low
**Location:** `src/components/Grid/Grid.tsx`

### Description
The `Grid` component contains logic for determining tile appearance (default tiles, editor mode overrides) mixed with the rendering markup.

### Evidence
The `map` function in `Grid.tsx` contains significant logic to determine `backgroundColor`, `block`, and `editorColor`.

### Recommended Solution
Extract this logic into a helper function or a custom hook (e.g., `useGridTileData(position)`) to keep the JSX clean and the logic testable.

## 4. Circular Persistence Dependency (Loading Triggered by Saving)

**Severity:** High
**Location:** General Architecture / Persistence Layer

### Description
The application should follow a strict "Load Once, Save Often" pattern.
*   **Load:** Occurs exactly once when the application initializes.
*   **Save:** Occurs whenever relevant state changes.
*   **State:** Is the single source of truth during the session.

### Anti-Pattern
Triggering a "Load" operation immediately after a "Save" operation, or treating the database as the source of truth for the active session. This creates a circular dependency where state updates wait for disk I/O, causing lag and potential race conditions.

### Consequences
*   **UI Lag:** Waiting for IndexedDB to read back data you just wrote.
*   **State Thrashing:** If the save is slow, the UI might revert to an old state if it reloads before the write completes.

### Recommended Solution
*   Initialize state from IndexedDB on startup.
*   Update Redux state immediately on user action (optimistic update).
*   Persist to IndexedDB in the background (fire-and-forget or queue).
*   **Never** reload state from IndexedDB unless the user explicitly resets the game or reloads the page.
