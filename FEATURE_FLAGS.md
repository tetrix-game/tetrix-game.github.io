# Feature Flags Guide

## Overview

Feature flags allow you to enable/disable features in production without code changes. The compact byte format feature can be controlled via feature flags.

## Current Feature Flags

### `useCompactFormat` (Default: `true`)
Controls whether the API uses compact byte format for tile and shape data.

- **Enabled:** 100-byte tiles, 3-byte shapes (~98% payload reduction)
- **Disabled:** Legacy JSON format (~6KB per request)

## How to Control Feature Flags

### Method 1: Browser Console (Immediate, Testing)

Open browser DevTools console on https://tetrix-game.github.io and run:

```javascript
// Disable compact format (revert to legacy)
window.featureFlags.disable('useCompactFormat')

// Enable compact format
window.featureFlags.enable('useCompactFormat')

// Check current status
window.featureFlags.getAll()

// Reset to defaults
window.featureFlags.reset()
```

Changes persist in `localStorage` and take effect immediately on the next API call.

### Method 2: Environment Variable (Build Time)

Set environment variable before building:

```bash
# Disable compact format
VITE_FEATURE_COMPACT_FORMAT=false npm run build

# Enable compact format (default)
VITE_FEATURE_COMPACT_FORMAT=true npm run build
```

This compiles the flag into the built JavaScript.

### Method 3: LocalStorage (Manual)

Set in browser localStorage:

```javascript
localStorage.setItem('featureFlags', JSON.stringify({
  useCompactFormat: false  // or true
}))
```

Then refresh the page.

## Monitoring in Production

### Check Current Setting

Open DevTools console:
```javascript
window.featureFlags.getAll()
// Output: { useCompactFormat: true, ... }
```

### Verify Compact Format is Active

1. Open DevTools Network tab
2. Place a shape in the game
3. Find the `POST /api/game/state` request
4. Check the request payload for `"useCompactFormat": true`
5. Check the response - tiles should be an array of 100 numbers (not objects)

### Performance Impact

You can compare performance by toggling the flag:

```javascript
// Test with compact format
window.featureFlags.enable('useCompactFormat')
// Play for 1 minute, check Network tab total data transferred

// Test with legacy format
window.featureFlags.disable('useCompactFormat')
// Play for 1 minute, check Network tab total data transferred

// Compare the difference (should be ~95% reduction with compact)
```

## Rollout Strategy

### Current State: Fully Enabled
The compact format is **currently enabled by default** for all users in production.

### Gradual Rollout (If Needed)

If you want to roll back or do a gradual rollout:

1. **0% (Rollback)**: Deploy with `VITE_FEATURE_COMPACT_FORMAT=false`
2. **10% (Canary)**: Use environment variable + localStorage overrides for test users
3. **50% (Beta)**: Update default to `true`, monitor error rates
4. **100% (Full)**: Current state - default is `true`

### Monitoring Metrics

Watch for:
- ✅ Reduced network bandwidth (should see ~95% reduction)
- ✅ Faster API responses
- ❌ Any increase in errors related to shape placement
- ❌ Any UI glitches with tile rendering

## Emergency Rollback

If issues arise:

**Option 1: Instant rollback for all users**
```bash
# Rebuild and deploy with flag disabled
VITE_FEATURE_COMPACT_FORMAT=false npm run build
git add -A
git commit -m "Emergency rollback: disable compact format"
git push
```

**Option 2: Tell individual users to disable**
Instruct users to run in console:
```javascript
window.featureFlags.disable('useCompactFormat')
```
Then refresh the page.

## Testing the Feature

### Test Compact Format is Working

```bash
# Run the test script
node test-compact-format.js
```

Should show:
- ✅ Backend is healthy
- ✅ useCompactFormat flag is true
- ✅ Achieved >90% payload reduction

### Manual Testing

1. Open https://tetrix-game.github.io
2. Open DevTools Console
3. Check: `window.featureFlags.getAll()`
4. Should show: `{ useCompactFormat: true, ... }`
5. Place a shape and check Network tab
6. Response tiles should be 100 numbers, not 100 objects

## Technical Details

### Code Location
- Feature flag system: `src/featureFlags/index.ts`
- Usage in API: `src/api/client.ts` (line ~315)
- Byte packing: `src/bytePacking/index.ts`

### Default Values
```typescript
const DEFAULT_FLAGS = {
  useCompactFormat: true,  // ← Compact format is ON by default
};
```

### Precedence
1. localStorage (highest priority - for user overrides)
2. Environment variables (`VITE_FEATURE_COMPACT_FORMAT`)
3. Default values (fallback)

## FAQ

**Q: Is compact format currently active?**  
A: Yes! It's enabled by default for all users.

**Q: How do I know if it's working?**  
A: Check Network tab in DevTools - tiles should be an array of 100 numbers, not objects. Run `node test-compact-format.js` to verify.

**Q: What if I want to disable it for testing?**  
A: Run `window.featureFlags.disable('useCompactFormat')` in browser console.

**Q: Will disabling break the game?**  
A: No! The code supports both formats. The backend will return legacy format if `useCompactFormat: false`.

**Q: How do I make it permanent?**  
A: It's already permanent - the default is `true` in production.

## Support

If you encounter issues with compact format:
1. Check console for errors
2. Try disabling with `window.featureFlags.disable('useCompactFormat')`
3. If that fixes it, report the issue with Network tab screenshots
4. Consider emergency rollback if affecting many users
