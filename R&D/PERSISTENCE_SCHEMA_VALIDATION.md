# Persistence Idea 4: Schema "Bouncers" (Validation)

## Concept
Use a runtime validator (like Zod) at the persistence boundary to ensure loaded data matches the expected schema exactly.

## The Problem
The app currently attempts to "patch" missing fields (e.g., `migrateStats`). This allows "zombie" data—half legacy, half new—to persist in the system. `undefined` values can propagate through logic, causing weird bugs (like `NaN` scores) that are hard to trace.

## The Solution
Treat the database as an "untrusted source". Validate data immediately upon load.

1.  **Define Schemas**: Create strict runtime schemas for all persistence types.
2.  **Validate on Load**: When reading from IndexedDB, pass the data through the validator.
3.  **Reject Invalid Data**: If validation fails, treat it as a `LoadResult.Error` (see Idea 1), not a partial success.

```typescript
// Example with Zod-like logic
const GameStateSchema = z.object({
  score: z.number(),
  tiles: z.array(TileSchema).length(100),
  // ...
});

function loadGame() {
  const rawData = await db.get('gameState');
  
  // Brittle validation:
  const result = GameStateSchema.safeParse(rawData);
  
  if (!result.success) {
    // Fail fast! Do not try to patch it.
    return { status: 'error', error: new Error('Save file corrupted or incompatible') };
  }
  
  return { status: 'success', data: result.data };
}
```

## Benefits
- **Data Integrity**: Guarantees that if the app is running, the state is valid.
- **Bug Reduction**: Eliminates "soft errors" caused by missing or malformed data.
- **Clearer Migrations**: Forces explicit migration logic (transforming old schema to new schema) rather than ad-hoc patching.
