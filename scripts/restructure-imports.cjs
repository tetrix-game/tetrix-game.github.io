#!/usr/bin/env node
/**
 * Updates all import paths after restructuring into App/
 */

const fs = require('fs');
const path = require('path');

function updateImports(filePath, fileDir) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Determine relative path depth from fileDir to App/
  const relativePath = path.relative(process.cwd(), fileDir);
  const depth = relativePath.split(path.sep).filter(p => p && p !== '.').length;

  // Pattern 1: App/index.tsx - siblings to children
  if (filePath.includes('src/App/index.tsx')) {
    content = content.replace(/from ['"]\.\.\/components\//g, "from './components/");
    content = content.replace(/from ['"]\.\.\/contexts\//g, "from './contexts/");
    content = content.replace(/from ['"]\.\.\/hooks\//g, "from './hooks/");
    modified = content !== originalContent;
  }
  // Pattern 2: Files in App/ subdirectories
  else if (filePath.includes('src/App/')) {
    // Update imports to contexts (ancestor)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/contexts\//g, "from '../../contexts/");
    content = content.replace(/from ['"]\.\.\/\.\.\/contexts\//g, "from '../contexts/"); // Some may be shallower

    // Update imports to hooks (ancestor)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/hooks\//g, "from '../../hooks/");

    // Update imports to utils (ancestor)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/utils\//g, "from '../../utils/");

    // Update imports to types (ancestor)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/types\//g, "from '../../types/");
    content = content.replace(/from ['"]\.\.\/\.\.\/types\//g, "from '../types/");

    // Update imports to reducers (ancestor)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/reducers/g, "from '../../reducers");

    // Update Shared imports (now need to go up one more level)
    content = content.replace(/from ['"]\.\.\/\.\.\/\.\.\/Shared\//g, "from '../../../../Shared/");
    content = content.replace(/from ['"]\.\.\/\.\.\/Shared\//g, "from '../../../Shared/");
    content = content.replace(/from ['"]\.\.\/Shared\//g, "from '../../Shared/");

    modified = content !== originalContent;
  }
  // Pattern 3: Test files
  else if (filePath.includes('src/test/')) {
    content = content.replace(/from ['"]\.\.\/components\//g, "from '../App/components/");
    content = content.replace(/from ['"]\.\.\/contexts\//g, "from '../App/contexts/");
    content = content.replace(/from ['"]\.\.\/hooks\//g, "from '../App/hooks/");
    content = content.replace(/from ['"]\.\.\/utils\//g, "from '../App/utils/");
    content = content.replace(/from ['"]\.\.\/types\//g, "from '../App/types/");
    content = content.replace(/from ['"]\.\.\/reducers/g, "from '../App/reducers");
    modified = content !== originalContent;
  }
  // Pattern 4: main/index.tsx
  else if (filePath.includes('src/main/index.tsx')) {
    content = content.replace(/from ['"]\.\.\/App['"]/g, "from '../App'");
    modified = content !== originalContent;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function findFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(item)) {
        results = results.concat(findFiles(fullPath));
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }

  return results;
}

const srcDir = path.join(__dirname, '../src');
const files = findFiles(srcDir);
let count = 0;

for (const file of files) {
  const fileDir = path.dirname(file);
  if (updateImports(file, fileDir)) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`✅ ${relPath}`);
    count++;
  }
}

console.log(`\n🎉 Updated ${count} files`);
