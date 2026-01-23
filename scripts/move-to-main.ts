#!/usr/bin/env tsx
/**
 * Moves App/ and Shared/ under main/ and updates all imports using ts-morph
 */

import { Project } from 'ts-morph';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.app.json'),
});

console.log('📦 Moving directories with git...\n');

// Move directories (preserve git history)
try {
  execSync('git mv src/App src/main/App', { stdio: 'inherit' });
  console.log('✅ Moved src/App → src/main/App');
} catch (e) {
  console.log('⚠️  App already moved or error:', e);
}

try {
  execSync('git mv src/Shared src/main/Shared', { stdio: 'inherit' });
  console.log('✅ Moved src/Shared → src/main/Shared');
} catch (e) {
  console.log('⚠️  Shared already moved or error:', e);
}

console.log('\n🔄 Updating imports with ts-morph...\n');

// Add all source files to the project
project.addSourceFilesAtPaths('src/**/*.{ts,tsx}');

let updateCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  let modified = false;

  // Get all import declarations
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // Skip non-relative imports
    if (!moduleSpecifier.startsWith('.')) {
      continue;
    }

    let newSpecifier = moduleSpecifier;

    // Pattern 1: main/index.tsx importing from sibling App
    if (filePath.includes('src/main/index.tsx')) {
      if (moduleSpecifier === '../App') {
        newSpecifier = './App';
        modified = true;
      }
    }
    // Pattern 2: Files in main/App/ importing from what was ../Shared
    else if (filePath.includes('src/main/App/')) {
      // ../../../Shared/ → ../../Shared/
      newSpecifier = moduleSpecifier.replace(/^\.\.\/\.\.\/\.\.\/Shared\//, '../../Shared/');

      if (newSpecifier !== moduleSpecifier) {
        modified = true;
      }
    }
    // Pattern 3: Test files importing from ../App or ../Shared
    else if (filePath.includes('src/test/')) {
      newSpecifier = moduleSpecifier
        .replace(/^\.\.\/App\//, '../main/App/')
        .replace(/^\.\.\/Shared\//, '../main/Shared/');

      if (newSpecifier !== moduleSpecifier) {
        modified = true;
      }
    }

    if (newSpecifier !== moduleSpecifier) {
      importDecl.setModuleSpecifier(newSpecifier);
      console.log(`  ${path.relative(process.cwd(), filePath)}`);
      console.log(`    ${moduleSpecifier} → ${newSpecifier}`);
    }
  }

  if (modified) {
    sourceFile.saveSync();
    updateCount++;
  }
}

console.log(`\n✅ Updated ${updateCount} files\n`);

// Final verification
console.log('🔍 Verifying structure...\n');
try {
  execSync('ls -la src/', { stdio: 'inherit' });
  console.log('\n');
  execSync('ls -la src/main/', { stdio: 'inherit' });
} catch (e) {
  // Ignore
}

console.log('\n✨ Migration complete!');
console.log('\nNext steps:');
console.log('  1. Run: npm run build');
console.log('  2. Run: npm run test');
console.log('  3. Commit: git add -A && git commit -m "refactor: move App and Shared under main/"');
