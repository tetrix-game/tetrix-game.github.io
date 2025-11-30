# Daily Challenge System

This document outlines the process for creating, verifying, and publishing Daily Challenges for Tetrix.

## Overview

The Daily Challenge mode offers players a unique, curated puzzle every day. Unlike the infinite mode, these puzzles have a specific solution and a finite set of shapes.

The system consists of:
1.  **Custom Grid Layouts**: Created using the in-game Grid Editor.
2.  **Deterministic Solver**: A backtracking algorithm that ensures the grid is solvable with the available shapes.
3.  **Daily Seed**: The solver uses the date as a seed to generate the sequence of shapes, ensuring all players get the same puzzle.

## Creating a Daily Challenge

### 1. Design the Grid
1.  Open the game in development mode (`npm start`).
2.  Navigate to the **Grid Editor** (usually accessible via debug tools or a specific menu option if enabled).
3.  Use the brush tools to paint your desired shape.
    *   **Colors matter!** The solver will generate shapes that match the colors you paint on the grid.
    *   **Sparse is better.** Don't fill the entire 10x10 grid unless you want a very long game. Creative shapes (hearts, letters, islands) work best.

### 2. Verify & Export
1.  In the Grid Editor, open the **Actions** menu.
2.  Click **"📋 Export Layout"** (or the specific Daily Challenge export button if available).
3.  The system will run the solver against your grid using *today's* seed.
    *   **If Solvable:** You will see a success message indicating how many shapes are needed. The JSON data will be copied to your clipboard.
    *   **If Unsolvable:** You will see an error. Try modifying the grid (e.g., removing isolated blocks that don't fit any shape).

### 3. Publish
1.  Create a file in `public/daily-challenges/` named with the target date: `YYYY-MM-DD.json`.
    *   Example: `public/daily-challenges/2025-12-25.json`
2.  Paste the JSON data from your clipboard into this file.
3.  Commit and push the file to the repository.

## JSON Format

The exported JSON looks like this:

```json
{
  "width": 10,
  "height": 10,
  "tiles": ["R1C1", "R1C2", ...],
  "tileBackgrounds": [
    ["R1C1", "red"],
    ["R1C2", "blue"]
  ],
  "shapes": [
    // Array of Shape objects (4x4 grids of blocks)
    // These are the exact pieces the player will receive
  ]
}
```

## The Solver Algorithm

The solver uses a deterministic "Exact Cover" approach with randomized backtracking:
1.  **Seed**: Derived from the date (`Math.floor(Date.now() / 86400000)`).
2.  **Shapes**: Uses an expanded set of shapes including:
    *   Standard Tetrominoes (I, O, T, S, Z, J, L)
    *   New Shapes: 3x3, 3x2, 5x1, 3x1, 2x1, 1x1, Even-L.
3.  **Process**:
    *   Finds the first empty tile (top-left).
    *   Identifies all shapes that can cover that tile.
    *   Shuffles the candidates deterministically based on the seed.
    *   Places a shape and recurses.
    *   If a dead end is reached, it backtracks.
    *   **Final Step**: The resulting sequence of shapes is shuffled deterministically so the order doesn't reveal the placement pattern (e.g., top-to-bottom).

This ensures that every valid grid has a solution, and the solution is consistent for all players on a given day.
