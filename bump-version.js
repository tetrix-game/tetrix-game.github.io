#!/usr/bin/env node

/**
 * Interactive version bump script
 * Prompts user for version type (major, minor, patch) and updates package.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

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

function promptUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  try {
    log('\n🚀 Version Bump Utility', 'bright');
    log('━'.repeat(50), 'cyan');

    // Read package.json
    const packagePath = new URL('./package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;

    log(`\nCurrent version: ${colors.bright}${currentVersion}${colors.reset}`, 'yellow');

    // Calculate preview versions
    const versions = {
      major: incrementVersion(currentVersion, 'major'),
      minor: incrementVersion(currentVersion, 'minor'),
      patch: incrementVersion(currentVersion, 'patch'),
    };

    log('\nSelect version bump type:', 'cyan');
    log(`  ${colors.bright}1${colors.reset}. Major (${versions.major}) - Breaking changes`);
    log(`  ${colors.bright}2${colors.reset}. Minor (${versions.minor}) - New features`);
    log(`  ${colors.bright}3${colors.reset}. Patch (${versions.patch}) - Bug fixes`);
    log(`  ${colors.bright}q${colors.reset}. Cancel`);

    const answer = await promptUser('\nYour choice (1/2/3/q): ');

    let bumpType;
    switch (answer) {
      case '1':
      case 'major':
        bumpType = 'major';
        break;
      case '2':
      case 'minor':
        bumpType = 'minor';
        break;
      case '3':
      case 'patch':
        bumpType = 'patch';
        break;
      case 'q':
      case 'quit':
      case 'cancel':
        log('\n❌ Version bump cancelled', 'red');
        process.exit(0);
        break;
      default:
        log('\n❌ Invalid choice. Exiting.', 'red');
        process.exit(1);
    }

    const newVersion = versions[bumpType];

    // Update package.json
    packageJson.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

    log('\n━'.repeat(50), 'cyan');
    log(`✅ Version bumped: ${currentVersion} → ${colors.bright}${newVersion}${colors.reset}`, 'green');
    log('━'.repeat(50) + '\n', 'cyan');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
