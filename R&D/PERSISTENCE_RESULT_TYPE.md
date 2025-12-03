# Persistence Idea 1: The "Result Type" Restriction

## Concept
Ban `null` as a return type for persistence operations. Force the consumer to acknowledge failure explicitly.

## The Problem
Currently, `load...` functions return `T | null`. `null` is ambiguous—it could mean "New User" OR "Database Locked" OR "Schema Mismatch". This ambiguity leads to "silent failures" where the app assumes a new user, initializes a blank state, and overwrites existing data.

## The Solution
Introduce a discriminated union type that forces code to handle all three scenarios: Success, Not Found, and Error.

```typescript
// RESTRICTION: You cannot ignore the difference between "Empty" and "Broken"
type LoadResult<T> =
  | { status: 'success'; data: T }
  | { status: 'not_found' }      // Valid: New user
  | { status: 'error'; error: Error }; // Critical: Do not overwrite!

// Usage becomes brittle (good!):
const result = await loadGame();

if (result.status === 'error') {
  // STOP. Do not load default state.
  // Show error screen or retry button.
  showErrorScreen(result.error); 
  return;
}

if (result.status === 'not_found') {
  // Safe to initialize new game
  initializeNewGame();
} else {
  // Safe to load data
  hydrateState(result.data);
}
```

## Benefits
- **Eliminates Ambiguity**: Code cannot accidentally treat an error as an empty state.
- **Prevents Data Loss**: The "Error" path explicitly stops the flow, preventing the `PersistenceListener` from overwriting valid data with a blank slate.
- **Better UX**: Users see an error message instead of losing their progress silently.
