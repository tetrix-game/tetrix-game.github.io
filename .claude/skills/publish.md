# Publish Skill

Automatically determine version bump type and publish the application.

## Instructions

When the user invokes `/publish`, follow these steps:

1. **Find the last version bump commit:**
   - Search git history for commits that modified `package.json` and contain version changes
   - Use: `git log --all --pretty=format:"%H %s" --follow -- package.json`
   - Read the commit diffs to identify which commit actually changed the version number

2. **Get commits since last version bump:**
   - Use `git log` to list all commits between the last version bump and HEAD
   - Analyze commit messages for conventional commit patterns

3. **Determine version bump type using semantic versioning rules:**
   - **MAJOR (breaking):** Look for:
     - "BREAKING CHANGE:" in commit messages
     - "breaking:" prefix
     - Major refactors that change APIs
   - **MINOR (feature):** Look for:
     - "feat:" or "feature:" prefix
     - New functionality additions
     - "add" in commit messages for new features
   - **PATCH (fix):** Look for:
     - "fix:" prefix
     - "bug" in commit messages
     - Small tweaks, style changes, docs
   - **Default to PATCH** if unclear

4. **Run the automated publish:**
   - Use the `auto-publish.js` script with the determined bump type
   - The script will handle version bumping, icon generation, building, and deployment
   - Command: `node auto-publish.js [major|minor|patch]`

5. **Commit the results:**
   - Stage all changes including package.json and dist/
   - Create a commit with a descriptive message about the version bump
   - Format: "Release v{version}: {summary of changes}"
   - Include Co-Authored-By line

## Notes

- Analyze commit messages carefully to make the right semver decision
- If there are multiple types of changes, choose the highest severity (major > minor > patch)
- Always explain your reasoning for the chosen version bump type to the user
