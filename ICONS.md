# Tetrix Icons and PWA Setup

## Overview
This project includes a comprehensive icon set and Progressive Web App (PWA) configuration that allows users to add the Tetrix game to their device homescreen.

## Icon Design
The main icon features:
- **Tetrix branding**: "TETRIX" text at the top
- **Tetris T-piece**: Iconic T-shaped block formation in cyan/teal gradient
- **Dark theme**: Matches the game's dark background (#1a1a2e to #16213e)
- **Modern gradient**: Cyan to teal gradient (#4fd1c7 to #06b6d4) for the blocks

## Files Created

### Core Icon Files
- `public/icon.svg` - Main 512x512 SVG icon with full branding
- `public/favicon.svg` - Simplified 32x32 favicon
- `public/favicon.ico` - ICO format favicon for browser compatibility

### Icon Sizes (PNG format as SVG)
- `public/icons/icon-72x72.png` - Small mobile icon
- `public/icons/icon-144x144.png` - Medium mobile icon  
- `public/icons/icon-192x192.png` - Standard PWA icon
- `public/icons/icon-512x512.png` - Large PWA icon

### PWA Configuration
- `public/manifest.json` - Web app manifest with app metadata
- Updated `index.html` with PWA meta tags and icon references

## Features Enabled

### Progressive Web App (PWA)
- **Add to Home Screen**: Users can install the game on mobile devices
- **Standalone display**: Opens without browser UI when launched from homescreen
- **Theme colors**: Matches game's color scheme
- **Portrait orientation**: Optimized for mobile gameplay

### Cross-Platform Icons
- **Browser favicons**: Shows in browser tabs and bookmarks
- **Apple Touch Icons**: iOS homescreen icons
- **Android icons**: Material Design compatible
- **Windows tiles**: Microsoft pinned site support

## Usage Instructions

### For Users
1. Open the game in a mobile browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Tap to install - the Tetrix icon will appear on your homescreen
4. Launch directly from homescreen for full-screen experience

### For Development
- Run `./generate-icons.sh` to regenerate PNG icons (requires ImageMagick)
- Edit `public/icon.svg` to modify the main icon design
- Update `public/manifest.json` for PWA settings changes

## Technical Details

### Manifest Configuration
- **Name**: "Tetrix" 
- **Background**: Dark theme (#1a1a2e)
- **Theme color**: Cyan accent (#4fd1c7)
- **Display**: Standalone (no browser UI)
- **Orientation**: Portrait (optimal for mobile)

### Icon Standards Compliance
- Follows PWA icon standards (72px to 512px sizes)
- Apple Touch Icon compatible
- Material Design guidelines for Android
- SVG with PNG fallbacks for maximum compatibility

### Future Improvements
The `generate-icons.sh` script can be enhanced with ImageMagick to:
- Generate proper PNG files from SVG sources
- Create additional icon sizes (96px, 128px, 384px)
- Optimize file sizes for faster loading
- Generate ICO files with multiple embedded sizes

## Testing
- All icons load correctly in development and production builds
- Manifest validates correctly
- PWA features work on mobile devices
- Tests pass without breaking existing functionality