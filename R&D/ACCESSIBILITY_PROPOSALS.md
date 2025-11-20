# Accessibility Proposals for Tetrix

This document outlines potential improvements to make Tetrix more accessible to a wider range of players, including those using screen readers, keyboard-only navigation, or requiring high contrast.

## 1. Keyboard Navigation for Gameplay
Currently, the game relies heavily on drag-and-drop interactions. Adding full keyboard support would significantly improve accessibility.

- **Grid Navigation:** Use Arrow keys to move a "cursor" or the currently selected shape around the grid.
- **Shape Selection:** Use Number keys (1-3) or Tab to select shapes from the queue.
- **Placement:** Use Enter or Space to place the selected shape at the current cursor location.
- **Rotation:** Use specific keys (e.g., Z/X, Q/E, or dedicated UI buttons accessible via Tab) to rotate shapes.

## 2. Focus Management & Trapping
For overlays and modals (Tutorial, Menu, Game Over), implementing "focus trapping" ensures that keyboard users don't accidentally tab outside the active modal.

- **Focus Trap:** When a modal is open, focus should cycle only through elements within that modal.
- **Return Focus:** When a modal closes, focus should return to the element that opened it (e.g., the Menu button).

## 3. Screen Reader Announcements (Live Regions)
Use ARIA live regions to announce dynamic game events to screen reader users.

- **Score Updates:** Announce significant score milestones or combos.
- **Game Events:** Announce "Game Over", "Level Up", or "Shape Placed".
- **Errors:** Announce invalid placement reasons (e.g., "Cannot place shape here").

## 4. Visual Accessibility
- **High Contrast Mode:** A setting to increase contrast between blocks and the grid, and for text.
- **Color Blindness Modes:** Patterns or distinct symbols on blocks to distinguish colors (though Tetrix logic is shape-based, not color-match based, this helps with visual clarity).
- **Reduced Motion:** Respect the user's `prefers-reduced-motion` system setting to disable or simplify animations (like the gem shower).

## 5. Audio Cues
- **Spatial Audio:** If possible, use stereo panning to indicate where on the board an action occurred.
- **Distinct Sounds:** Ensure all interactive elements have distinct feedback sounds (success, error, click).

## 6. Semantic HTML Structure
- Ensure the game grid is represented in a way that screen readers can understand (e.g., a table or grid role with proper labels for rows/columns), though this is complex for a canvas-like game.

## 7. Input Customization
- Allow users to remap keyboard shortcuts if implemented.
