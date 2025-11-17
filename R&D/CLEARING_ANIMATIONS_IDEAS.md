IMPLEMENTATION HIERARCHY

A comprehensive collection of animation ideas organized by implementation complexity and dependencies. Each section builds on the foundations established in previous layers.

---

## 📐 IMPLEMENTATION ARCHITECTURE

### **LAYER 0: Foundation (Required for Everything)**

#### State Management Extensions
- [ ] **Add `isClearing` state to Block/TileData type** (`src/types/core.ts`)
  - Marks individual blocks that are in the process of being cleared
  - Boolean flag that triggers animation rendering
  
- [ ] **Add `clearingProgress` to Block/TileData type** (`src/types/core.ts`)
  - Number 0-1 tracking animation completion
  - Enables smooth transitions and multi-phase effects
  
- [ ] **Add `clearingStartTime` to Block/TileData type** (`src/types/core.ts`)
  - Timestamp when clearing animation began
  - Allows time-based animation calculations
  
- [ ] **Create ClearingMetadata type** (`src/types/animation.ts`)
  ```typescript
  interface ClearingMetadata {
    clearedRows: number[];
    clearedColumns: number[];
    intersectionPoints: Array<{row: number, column: number}>;
    totalLinesCleared: number;
    comboMultiplier: number;
    clearStartTime: number;
    effectTheme: string;
  }
  ```

#### Reducer Changes
- [ ] **Add INITIATE_CLEARING action** (`src/types/gameState.ts` + `src/reducers/tileReducer.ts`)
  - Triggered in `COMPLETE_PLACEMENT` before `clearFullLines()` is called
  - Sets `isClearing: true` on affected tiles
  - Stores clearing metadata in state
  
- [ ] **Add COMPLETE_CLEARING action** (`src/types/gameState.ts` + `src/reducers/tileReducer.ts`)
  - Called after animation completes
  - Actually removes the blocks (what `clearFullLines()` does now)
  - Updates score and triggers GemShower
  
- [ ] **Modify COMPLETE_PLACEMENT logic** (`src/reducers/tileReducer.ts`)
  - Split into: mark for clearing → animate → actually clear
  - Currently does: place shape → `clearFullLines()` → score → gems
  - Should do: place shape → `INITIATE_CLEARING` → (animation) → `COMPLETE_CLEARING` → score → gems

#### Component Infrastructure
- [ ] **Create ClearingAnimationController component**
  - Watches for `isClearing` tiles in state
  - Manages animation lifecycle (start → progress → complete)
  - Dispatches `COMPLETE_CLEARING` when animations finish
  
- [ ] **Extend TileVisual component** (`src/components/TileVisual/TileVisual.tsx`)
  - Read `isClearing` and `clearingProgress` from tile data
  - Apply CSS classes/styles based on clearing state
  - Handle animation rendering

---

### **LAYER 1: Basic Visual Feedback** (Build on Layer 0)

Once Layer 0 is complete, these simple effects can be implemented:

#### Quick Win Effects (Individual)
- [ ] **Flash White** - Simple opacity pulse
  - TileVisual: Apply `.clearing-flash` CSS class
  - Keyframe: `opacity: 1 → 0` over 300ms
  
- [ ] **Scale Down** - Shrink to nothing
  - CSS: `transform: scale(1) → scale(0)` with ease-out
  - Duration: 400ms
  
- [ ] **Fade Out** - Simple opacity fade
  - CSS: `opacity: 1 → 0` linear
  - Duration: 500ms
  
- [ ] **Color Pulse** - Brighten then fade
  - CSS: Animate `filter: brightness(1) → brightness(2) → brightness(0)`
  - Duration: 600ms

#### Row/Column Highlighting
- [ ] **Border Glow on Cleared Lines**
  - TileVisual: Add `.clearing-line-member` class
  - CSS: Animated border or box-shadow glow
  - Runs simultaneously with block animations

---

### **LAYER 2: Intersection Detection** (Build on Layer 1)

#### New Utilities
- [ ] **Create `findIntersections()` function** (`src/utils/lineUtils.ts`)
  ```typescript
  function findIntersections(
    rows: number[], 
    columns: number[]
  ): Array<{row: number, column: number}>
  ```
  - Returns grid positions where cleared rows and columns cross
  - Used to identify blocks that should get special effects

#### State Extensions
- [ ] **Add `clearingEffectType` to Block/TileData**
  - Values: `'row' | 'column' | 'intersection' | 'normal'`
  - Allows different animations for different clearing contexts
  
- [ ] **Store intersection points in ClearingMetadata**
  - Calculated during `INITIATE_CLEARING`
  - Passed to animation system

#### Enhanced Effects
- [ ] **Star Burst at Intersections**
  - TileVisual: Check if `effectType === 'intersection'`
  - Render particle burst or CSS effect overlay
  - Triggers after brief delay (100ms)
  
- [ ] **Plus Sign Glow**
  - CSS: Animated `::before` and `::after` pseudo-elements forming +
  - Position at intersection tiles
  - Fades after 500ms

---

### **LAYER 3: Wave & Propagation Effects** (Build on Layer 2)

#### New Utilities
- [ ] **Create `calculateDistanceFromClearOrigin()` function** (`src/utils/lineUtils.ts`)
  ```typescript
  function calculateDistanceFromClearOrigin(
    tileLocation: Location,
    clearedRows: number[],
    clearedColumns: number[]
  ): number
  ```
  - Used for ripple timing and intensity calculations

#### State Extensions  
- [ ] **Add `distanceFromClearOrigin` to Block/TileData**
  - Calculated during `INITIATE_CLEARING`
  - Used to stagger animation timing (domino effect)

#### Wave Animations (Row/Column)
- [ ] **Energy Beam Sweep**
  - Create beam overlay div in Grid component
  - CSS: Animate `left` or `top` property across cleared line
  - Duration: 300ms, starts immediately
  
- [ ] **Ripple Distortion**
  - TileVisual: Apply wave transform based on distance
  - CSS: `transform: translateY(sin(time + distance))` pattern
  - Requires requestAnimationFrame loop
  
- [ ] **Sequential Block Fade**
  - Use `distanceFromClearOrigin` to stagger `animation-delay`
  - Each block starts 50ms after previous
  - Creates cascading effect

#### Grid-Wide Ripples
- [ ] **Gravity Ripple**
  - Apply transform to ALL tiles based on distance from cleared area
  - CSS: `transform: scale(1 - rippleIntensity * 0.1)`
  - Affects non-clearing tiles briefly
  
- [ ] **Screen Flash**
  - Add overlay div at app level
  - CSS: `background: white; opacity: 0.8 → 0`
  - Duration: 200ms

---

### **LAYER 4: Particle Systems** (Build on Layer 3)

#### New Components
- [ ] **Create ClearingParticle component** (similar to GemParticle)
  - Accepts particle data: position, velocity, color, lifetime
  - Renders single particle with physics
  
- [ ] **Create ClearingParticleShower component** (similar to GemShower)
  - Watches for clearing events
  - Spawns particles based on clearing type
  - Manages particle lifecycle

#### Particle Effects
- [ ] **Pixel Explosion**
  - Spawn 20-50 tiny colored squares per clearing block
  - Random velocity vectors radiating outward
  - Gravity and fade over 1 second
  
- [ ] **Sparkler Trail**
  - Spawn particles along cleared line path
  - Particle birth rate: 100/second
  - Short lifetime (300ms), upward velocity
  
- [ ] **Confetti Burst**
  - Spawn at intersection points
  - Multicolored particles with rotation
  - Parabolic trajectories

#### Performance Optimization
- [ ] **Particle Pooling System**
  - Reuse particle components instead of creating/destroying
  - Max pool size: 500 particles
  
- [ ] **Performance Tier Detection**
  - Measure FPS during first few clearings
  - Reduce particle count on low-end devices
  - Store preference in settings

---

### **LAYER 5: Multi-Line Combo System** (Build on Layer 4)

#### State Management
- [ ] **Add combo tracking to state**
  - `currentCombo: number` - consecutive clears without missing
  - `comboTimeout: number | null` - timer reference
  - `maxComboThisGame: number` - high score tracking
  
- [ ] **Add COMBO_INCREASE and COMBO_RESET actions**
  - Update combo counter
  - Trigger escalating effects

#### Escalating Effect System
- [ ] **Combo Multiplier Visual** (similar to ScoreNotification)
  - Show "2x COMBO!" "3x COMBO!" text overlay
  - Position: center top of grid
  - Animation: zoom in + shake + fade out
  
- [ ] **Intensity Scaling**
  - 1 line: Basic fade effect
  - 2 lines: Fade + particles
  - 3 lines: Fade + particles + screen shake
  - 4 lines: Fade + particles + screen shake + grid tilt
  - 5+ lines: ALL effects + special audio cue

#### Combo Effects
- [ ] **Screen Shake** (requires camera/grid transform)
  - Add shake intensity to Grid wrapper
  - CSS: `transform: translate(randX, randY)` over 300ms
  - Intensity scales with combo level
  
- [ ] **Grid Tilt**
  - CSS: `transform: perspective(1000px) rotateX(10deg)`
  - Spring back to normal over 400ms
  - Only on 4+ line combos

---

### **LAYER 6: Advanced Visual Effects** (Build on Layer 5)

#### Shader-Based Effects (Requires WebGL/Canvas)
- [ ] **Setup Canvas Overlay System**
  - Create canvas layer above grid
  - Match grid dimensions and tile positions
  - Render advanced effects on canvas
  
- [ ] **Chromatic Aberration**
  - Split RGB channels during clearing
  - Offset red/blue by 5px in opposite directions
  - Reunite over 300ms
  
- [ ] **Blur Wave**
  - Apply CSS `filter: blur()` dynamically
  - Propagate blur amount based on wave position
  - Requires per-tile blur calculation
  
- [ ] **Voronoi Fracture**
  - Generate voronoi cells over block area
  - Animate cells flying apart
  - Computationally expensive - combo 5+ only

#### 3D Transform Effects
- [ ] **Card Flip**
  - CSS: `transform: rotateY(180deg)` with perspective
  - Show empty backside of tile
  - Duration: 400ms with ease-in-out
  
- [ ] **Origami Fold**
  - Multiple transform stages simulating paper folding
  - Keyframes: rotate on multiple axes
  - Complex but impressive visual

---

### **LAYER 7: Sound-Reactive Features** (Build on Layer 6)

#### Audio Analysis
- [ ] **Extend BackgroundMusic component** with audio analysis
  - Use Web Audio API `AnalyserNode`
  - Extract frequency and amplitude data
  - Expose via context or props
  
- [ ] **Create Audio Analysis Hook**
  ```typescript
  useAudioAnalysis() => {
    currentBeat: number,
    bassLevel: number,
    trebleLevel: number,
    isBeatDetected: boolean
  }
  ```

#### Sync Animations
- [ ] **Beat-Synced Clearing**
  - Time `INITIATE_CLEARING` to coincide with music beat
  - Buffer clearings if necessary (don't delay gameplay)
  
- [ ] **Frequency Visualizer Bars**
  - Render frequency bars along cleared line
  - Bar height matches audio frequency intensity
  - Fades as clearing animation progresses
  
- [ ] **Bass Drop Enhancement**
  - Detect bass drops in background music
  - Amplify clearing effects during bass drops
  - Extra screen shake, brighter flashes

---

### **LAYER 8: Themed Effect Sets** (Build on Layer 7)

#### Effect Theme System
- [ ] **Add `effectTheme` setting to game state**
  - Values: 'arcade' | 'scifi' | 'fantasy' | 'nature' | 'minimal'
  - Stored in persistence
  - Affects clearing animation choices
  
- [ ] **Create Theme Configuration**
  ```typescript
  type EffectTheme = {
    blockAnimation: 'fade' | 'explode' | 'dissolve' | ...;
    lineAnimation: 'beam' | 'sparkle' | 'wave' | ...;
    intersectionEffect: 'burst' | 'portal' | 'glow' | ...;
    particleType: 'squares' | 'sparkles' | 'leaves' | ...;
    soundSet: 'retro' | 'modern' | 'magical' | ...;
  }
  ```

#### Theme Implementations
- [ ] **Arcade Theme**
  - Scanlines, pixelation, CRT phosphor effects
  - Chiptune sound effects
  - Score popups with pixel font
  
- [ ] **Sci-Fi Theme**
  - Hologram flicker, energy dispersal
  - EMP pulse, system restore sounds
  - Futuristic blue/cyan color palette
  
- [ ] **Fantasy Theme**
  - Magic circles, sparkles, fairy dust
  - Runes glow, mystical sounds
  - Purple/gold particle effects
  
- [ ] **Nature Theme**
  - Leaf scatter, flower bloom, water ripples
  - Organic sounds (wind, water)
  - Earth tone particles
  
- [ ] **Minimal Theme**
  - Simple fades, geometric transforms
  - Subtle sounds
  - Monochrome effects

---

### **LAYER 9: Contextual & Meta Effects** (Build on Layer 8)

#### Context-Aware Animations
- [ ] **Score-Based Scaling**
  - Low scores (< 100): Gentle fade only
  - Medium scores (100-1000): Moderate effects
  - High scores (1000+): Full effect suite
  - Based on `state.score` value
  
- [ ] **Time-of-Day Theming**
  - Use system time or user preference
  - Morning: Warm sunrise colors
  - Noon: Bright vibrant colors  
  - Evening: Sunset orange/red
  - Night: Cool blue/purple tones
  
- [ ] **Streak Milestone Celebrations**
  - Detect streaks of 5, 10, 20 consecutive clears
  - Special "MILESTONE!" animation overlay
  - Reward bonus points or special shape

#### Ghost Trail System
- [ ] **Add cleared block history**
  - Store last N cleared block positions
  - Render semi-transparent ghosts at those positions
  - Fade over 2 seconds
  
- [ ] **Instant Replay**
  - Record last 3 seconds of state changes
  - On special combo, show brief slow-mo replay
  - Picture-in-picture or center stage
