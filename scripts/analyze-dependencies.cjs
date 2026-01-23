#!/usr/bin/env node
/**
 * Analyzes component dependencies to identify:
 * - Which components are used by 2+ other files (Shared candidates)
 * - Current import patterns
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const componentUsage = new Map();

function findFiles(dir, extension = '.tsx') {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(file)) {
      results = results.concat(findFiles(filePath, extension));
    } else if (file.endsWith(extension) || file.endsWith('.ts')) {
      results.push(filePath);
    }
  }

  return results;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const fileImports = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      fileImports.push(importPath);
    }
  }

  return fileImports;
}

function analyzeComponents() {
  const files = findFiles(srcDir);

  for (const file of files) {
    const imports = extractImports(file);
    const relPath = path.relative(srcDir, file);

    for (const imp of imports) {
      // Extract component name from path
      const match = imp.match(/\/components\/([^\/]+)\//);
      if (match) {
        const componentName = match[1];
        if (!componentUsage.has(componentName)) {
          componentUsage.set(componentName, new Set());
        }
        componentUsage.get(componentName).add(relPath);
      }
    }
  }

  // Find components used by 2+ files
  const sharedCandidates = [];
  for (const [component, users] of componentUsage.entries()) {
    if (users.size >= 2) {
      sharedCandidates.push({
        component,
        usageCount: users.size,
        usedBy: Array.from(users).sort()
      });
    }
  }

  sharedCandidates.sort((a, b) => b.usageCount - a.usageCount);

  console.log('\n📊 SHARED COMPONENT CANDIDATES (used by 2+ files):\n');
  sharedCandidates.forEach(({ component, usageCount, usedBy }) => {
    console.log(`  ${component} (${usageCount} files):`);
    usedBy.forEach(file => console.log(`    - ${file}`));
    console.log('');
  });

  console.log(`\n✅ Found ${sharedCandidates.length} components that should move to src/Shared/\n`);

  return sharedCandidates;
}

analyzeComponents();
