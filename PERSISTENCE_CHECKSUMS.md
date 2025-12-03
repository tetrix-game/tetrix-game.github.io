# Persistence Checksum Validation

To ensure data integrity and debug persistence issues, we have implemented a checksum validation system in the persistence layer.

## Overview

The system calculates a checksum of the game state before saving it to IndexedDB. This checksum is stored alongside the data. When loading the data, the checksum is recalculated and compared with the stored value to verify that the data has not been corrupted.

## Implementation Details

### Checksum Calculation

The checksum is generated using a simple hash of the JSON string representation of the data.
- **Function**: `getChecksum(data: any): string` in `src/utils/persistenceAdapter.ts`
- **Exclusions**: The `checksum` field itself is excluded from the calculation to avoid circular dependencies.

### Saving Data

When `saveViewGameState` is called:
1. A checksum is calculated for the entire `ViewGameState` object.
2. The checksum is added to the state object as the `checksum` property.
3. Granular checksums for key sub-objects (tiles, shapes, stats) are logged to the console if `DEBUG_PERSISTENCE_CHECKSUMS` is enabled.
4. The state (including the checksum) is written to IndexedDB.

### Loading Data

When `loadViewGameState` is called:
1. The state is read from IndexedDB.
2. If a `checksum` property exists:
   - The checksum is recalculated from the loaded data (excluding the stored `checksum`).
   - The calculated checksum is compared with the stored `checksum`.
   - **Mismatch**: An error is logged to the console (`[Persistence] Checksum mismatch...`), warning of potential corruption. The load proceeds, but the warning is visible for debugging.
   - **Match**: A verification message is logged if debug mode is on.
3. Granular checksums are logged to the console if `DEBUG_PERSISTENCE_CHECKSUMS` is enabled, allowing comparison with the save logs.

## Debugging

To enable detailed logging, ensure the `DEBUG_PERSISTENCE_CHECKSUMS` constant in `src/utils/persistenceAdapter.ts` is set to `true`.

**Console Output Example:**

```
[Persistence] Saving infinite state
  TIMESTAMP: 2023-10-27T10:00:00.000Z
  FULL STATE Checksum: a1b2c3d4
  - Score: 1500
  - Tiles Checksum: e5f6g7h8 (Count: 100)
  - NextShapes Checksum: i9j0k1l2
  ...
```

If you suspect data loss or corruption:
1. Open the browser console.
2. Look for `[Persistence]` logs.
3. Compare the checksums from the last "Saving" log with the subsequent "Loaded" log.
4. If they match but the game state is wrong, the issue is likely in how the loaded data is applied to the React state (in `TetrixProvider` or reducers).
5. If they don't match, the data is being corrupted in storage or during the read/write process.
