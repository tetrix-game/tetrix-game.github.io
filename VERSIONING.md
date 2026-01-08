# Versioning & PWA Update System

This document explains how versioning and PWA updates work in the Tetrix game.

## Quick Start

### Publishing a New Version

When you're ready to publish, run:

```bash
npm run publish
```

This will:
1. **Prompt you for version type** (major/minor/patch)
2. **Auto-update package.json** with the new version
3. Generate icons
4. Build the project
5. Deploy to GitHub Pages

### Version Types

When prompted, choose the appropriate version bump:

- **Option 1: Major (x.0.0)** - Breaking changes, major new features
  - Example: 1.2.3 → 2.0.0
- **Option 2: Minor (1.x.0)** - New features, backwards compatible
  - Example: 1.2.3 → 1.3.0
- **Option 3: Patch (1.2.x)** - Bug fixes, minor improvements
  - Example: 1.2.3 → 1.2.4

Press `q` to cancel the publish operation.

## How PWA Updates Work

### For Users

1. **Update Detection**: When you visit the site, the browser checks for updates
2. **Update Notification**: If a new version is available, a banner appears at the bottom
3. **User Control**: Click "Update Now" to install, or "Later" to continue playing
4. **Automatic Update**: After clicking "Update Now", the page reloads with the new version

### Version Display

Users can see their current app version in:
- Settings menu (hamburger menu) → Scroll down to see "Version X.X.X"

### Technical Details

#### PWA Update Strategy: `prompt` Mode

The app uses **prompt mode** instead of auto-update:

- ✅ **User Control**: Updates don't interrupt gameplay
- ✅ **Better UX**: Users choose when to update
- ✅ **Reliability**: Clear feedback about update status
- ❌ Auto-update (old): Would reload the page automatically (bad for mid-game)

#### Service Worker Lifecycle

1. **First Visit**: Service worker installs, caches all assets
2. **Subsequent Visits**:
   - Browser checks for updates automatically (every 24hrs or on navigation)
   - Our code also checks every hour while the app is open
3. **Update Available**: New service worker downloads but waits
4. **User Clicks "Update Now"**:
   - New service worker activates
   - Page reloads with new code
   - Old cache cleaned up

#### Caching Strategy

The service worker uses **Workbox** with:
- Precaching for all build assets (JS, CSS, HTML)
- Runtime caching for images and audio files
- Automatic cleanup of outdated caches

## Development

### Manual Version Bump

To bump the version without publishing:

```bash
npm run bump-version
```

### Testing Updates Locally

1. Build and serve the app:
   ```bash
   npm run build
   npm run preview
   ```
2. Make changes and rebuild
3. Refresh the preview - you should see the update notification

### Modifying the Update UI

- **Update Notification**: `src/components/UpdateNotification/`
- **Version Display**: `src/components/SettingsOverlay/` (search for "version-display")
- **Hook Logic**: `src/hooks/usePWAUpdate.ts`
- **Integration**: `src/App.tsx`

## Files Modified

- `vite.config.ts` - Changed from `autoUpdate` to `prompt` mode
- `package.json` - Added `bump-version` script, updated `publish` script
- `bump-version.js` - Interactive version bump script
- `src/version.ts` - Exports version from package.json
- `src/components/UpdateNotification/` - Update banner component
- `src/hooks/usePWAUpdate.ts` - PWA update management hook
- `src/App.tsx` - Integrated update detection and notification
- `src/components/SettingsOverlay/` - Added version display
- `tsconfig.app.json` - Added `resolveJsonModule: true`

## Troubleshooting

### "Update not detected after publishing"

- Browser caches are aggressive. Try:
  1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
  2. Clear site data in DevTools
  3. Open in incognito/private window

### "Version not updating in package.json"

- Make sure you're running `npm run publish`, not just `npm publish`
- The script should show interactive prompts

### "TypeScript error importing package.json"

- Ensure `resolveJsonModule: true` is in `tsconfig.app.json`
- Check that `vite-env.d.ts` includes PWA types

### "Service worker not updating"

- Check the browser console for service worker errors
- In DevTools → Application → Service Workers, you can manually unregister
- The update check runs every hour automatically

## Best Practices

1. **Version appropriately**: Use semantic versioning consistently
2. **Test before publishing**: Always test your changes locally
3. **Clear changelog**: Users see "New version available!" - consider adding what's new
4. **Don't skip versions**: The bump script increments logically
5. **Commit version changes**: The script updates package.json - commit it!

## Future Enhancements

Potential improvements to consider:

- [ ] Show changelog/release notes in update notification
- [ ] Add "What's New" modal after update
- [ ] Version history page
- [ ] Force update for critical security fixes
- [ ] Update check on app focus (in addition to hourly)
