# Claude Code Skills

This directory contains custom skills for Claude Code in this project.

## Available Skills

### `/publish` - Automated Publishing with Smart Version Bumping

Automatically determines the appropriate semantic version bump based on git commit history and publishes the application.

**How it works:**

1. Analyzes git history to find the last version bump commit
2. Reviews all commits since the last version bump
3. Applies semantic versioning rules to determine bump type:
   - **MAJOR**: Breaking changes, major refactors
   - **MINOR**: New features, additions
   - **PATCH**: Bug fixes, small tweaks, documentation
4. Runs the automated publish script with the determined version
5. Commits all changes with a descriptive message

**Usage:**
```bash
/publish
```

**Behind the scenes:**
- Uses `auto-publish.js` script to handle version bumping and deployment
- Follows conventional commit message patterns
- Automatically handles icon generation, building, and gh-pages deployment
- Creates a clean commit with the version bump and build artifacts

## Manual Alternative

If you need to manually control the version bump:

```bash
npm run auto-publish patch   # Bug fixes
npm run auto-publish minor   # New features
npm run auto-publish major   # Breaking changes
```

Or use the interactive version bumper:

```bash
npm run publish
```
