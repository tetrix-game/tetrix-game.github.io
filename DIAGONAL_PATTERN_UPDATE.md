# Diagonal Pattern Detection Update

## Changes Made

Updated the special pattern detection system to support **both ascending and descending diagonal patterns**.

### Files Modified

1. **`src/utils/shapeUtils.ts`**
   - Updated `checkDiagonalPattern()` to check both ascending and descending patterns
   - Modified `checkRowPattern()` to accept an `ascending` parameter
   - Modified `checkColumnPattern()` to accept an `ascending` parameter
   - Updated documentation to reflect support for both diagonal types

2. **`src/components/Tetrix/TetrixReducer.ts`**
   - Updated `GENERATE_SUPER_COMBO_PATTERN` action to randomly generate either ascending or descending diagonals
   - Added calculation for descending diagonal: `(row + column) === 11` for the 4x4 pattern at (4,4)-(7,7)

### Pattern Types Now Supported

#### Ascending Diagonal
Empty blocks follow the pattern where index increases:
```
Row 4, Col 4: O X X X X X X X X X
Row 5, Col 5: X O X X X X X X X X
Row 6, Col 6: X X O X X X X X X X
Row 7, Col 7: X X X O X X X X X X
```

#### Descending Diagonal
Empty blocks follow the pattern where index decreases:
```
Row 4, Col 7: X X X O X X X X X X
Row 5, Col 6: X X O X X X X X X X
Row 6, Col 5: X O X X X X X X X X
Row 7, Col 4: O X X X X X X X X X
```

### Testing

Created comprehensive test suite in `src/test/diagonalPatternDetection.test.ts`:
- ✅ Ascending diagonal patterns at multiple positions
- ✅ Descending diagonal patterns at multiple positions
- ✅ Negative cases (no pattern, incomplete patterns, filled diagonals)

All tests pass successfully.

### How It Works

The detection algorithm now:
1. Checks if an ascending diagonal pattern exists (empty cells at row+i, col+i)
2. If not found, checks if a descending diagonal pattern exists (empty cells at row+i, col+(3-i))
3. Returns true if either pattern is complete

This ensures that the super combo shape (4x4 diagonal piece) can be generated in either orientation and will be properly detected by the game.
