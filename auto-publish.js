#!/usr/bin/env node

/**
 * Automated version bump and publish script
 * Usage: node auto-publish.js [major|minor|patch]
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function incrementVersion(version, type) {
  const parts = parseVersion(version);

  switch (type) {
    case 'major':
      parts.major += 1;
      parts.minor = 0;
      parts.patch = 0;
      break;
    case 'minor':
      parts.minor += 1;
      parts.patch = 0;
      break;
    case 'patch':
      parts.patch += 1;
      break;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }

  return `${parts.major}.${parts.minor}.${parts.patch}`;
}

function main() {
  try {
    log('\n🚀 Automated Publish Utility', 'bright');
    log('━'.repeat(50), 'cyan');

    // Get version bump type from command line
    const bumpType = process.argv[2];
    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      log('\n❌ Error: Version bump type required', 'red');
      log('Usage: node auto-publish.js [major|minor|patch]', 'yellow');
      process.exit(1);
    }

    // Read package.json
    const packagePath = new URL('./package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = incrementVersion(currentVersion, bumpType);

    log(`\nCurrent version: ${colors.bright}${currentVersion}${colors.reset}`, 'yellow');
    log(`Bump type: ${colors.bright}${bumpType}${colors.reset}`, 'cyan');
    log(`New version: ${colors.bright}${newVersion}${colors.reset}`, 'green');

    // Update package.json
    packageJson.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    log('✅ Updated package.json', 'green');

    // Generate icons
    log('\n📦 Generating icons...', 'cyan');
    execSync('npm run generate-icons', { stdio: 'inherit' });

    // Build
    log('\n🔨 Building...', 'cyan');
    execSync('npm run build', { stdio: 'inherit' });

    // Deploy to gh-pages
    log('\n🚀 Deploying to gh-pages...', 'cyan');
    execSync('npx gh-pages -d dist', { stdio: 'inherit' });

    log('\n━'.repeat(50), 'cyan');
    log(`✅ Successfully published version ${colors.bright}${newVersion}${colors.reset}`, 'green');
    log('━'.repeat(50) + '\n', 'cyan');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
