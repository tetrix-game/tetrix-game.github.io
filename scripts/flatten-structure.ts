import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface ModuleInfo {
  originalPath: string;
  newPath: string;
  folderName: string;
  hasIndexFile: boolean;
}

/**
 * Recursively finds all folders containing an index.ts or index.tsx file
 */
function findModuleFolders(dirPath: string, basePath: string): ModuleInfo[] {
  const modules: ModuleInfo[] = [];

  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return modules;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Check if current directory has an index file
  const hasIndexTs = entries.some(e => e.isFile() && e.name === 'index.ts');
  const hasIndexTsx = entries.some(e => e.isFile() && e.name === 'index.tsx');
  const hasIndexFile = hasIndexTs || hasIndexTsx;

  // Only process if we're not already at the src root AND we have an index file
  const isNotSrcRoot = dirPath !== basePath;

  if (isNotSrcRoot && hasIndexFile) {
    const folderName = path.basename(dirPath);
    const newPath = path.join(basePath, folderName);

    modules.push({
      originalPath: dirPath,
      newPath,
      folderName,
      hasIndexFile: true
    });
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = path.join(dirPath, entry.name);
      modules.push(...findModuleFolders(subDirPath, basePath));
    }
  }

  return modules;
}

/**
 * Moves a directory and all its contents
 */
function moveDirectory(sourcePath: string, destPath: string): void {
  // If destination exists, we have a naming conflict
  if (fs.existsSync(destPath)) {
    console.error(`⚠️  Conflict: ${destPath} already exists!`);
    // Generate a unique name
    let counter = 1;
    let newDestPath = destPath;
    while (fs.existsSync(newDestPath)) {
      const basename = path.basename(destPath);
      const dirname = path.dirname(destPath);
      newDestPath = path.join(dirname, `${basename}_${counter}`);
      counter++;
    }
    console.log(`   Renaming to: ${path.basename(newDestPath)}`);
    destPath = newDestPath;
  }

  // Create parent directory if needed
  const parentDir = path.dirname(destPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Move the directory
  fs.renameSync(sourcePath, destPath);
  console.log(`✓ Moved: ${sourcePath} → ${destPath}`);
}

/**
 * Converts a relative import path to the new flat structure
 */
function convertImportPath(
  importingFilePath: string,
  oldImportPath: string,
  moduleMappings: Map<string, string>
): string | null {
  // Skip non-relative imports
  if (!oldImportPath.startsWith('.')) {
    return null;
  }

  // Resolve the absolute path of what's being imported
  const importingDir = path.dirname(importingFilePath);
  const resolvedImport = path.resolve(importingDir, oldImportPath);

  // Try to match with one of our moved modules
  for (const [originalPath, newPath] of moduleMappings.entries()) {
    // Check if the import resolves to this module's index file
    const indexTs = path.join(originalPath, 'index.ts');
    const indexTsx = path.join(originalPath, 'index.tsx');

    if (resolvedImport === indexTs || resolvedImport === indexTsx ||
        resolvedImport === originalPath) {
      // Calculate new relative path from importing file to new location
      const importingFileNewDir = getNewLocationForFile(importingFilePath, moduleMappings);
      const relativeToNew = path.relative(importingFileNewDir, newPath);

      // Ensure it starts with ./ or ../
      const normalizedPath = relativeToNew.startsWith('.')
        ? relativeToNew
        : './' + relativeToNew;

      return normalizedPath.replace(/\\/g, '/');
    }
  }

  return null;
}

/**
 * Determines where a file will be after the restructuring
 */
function getNewLocationForFile(
  filePath: string,
  moduleMappings: Map<string, string>
): string {
  // Check if this file is inside a module that's being moved
  for (const [originalPath, newPath] of moduleMappings.entries()) {
    if (filePath.startsWith(originalPath + path.sep) || filePath === originalPath) {
      // File is inside this module, calculate its new location
      const relativePath = path.relative(originalPath, filePath);
      return path.dirname(path.join(newPath, relativePath));
    }
  }

  // File is not being moved
  return path.dirname(filePath);
}

async function flattenStructure() {
  console.log('🚀 Starting structure flattening...\n');

  const srcPath = path.resolve(process.cwd(), 'src');

  // Step 1: Find all modules
  console.log('📂 Finding all module folders...');
  const modules = findModuleFolders(srcPath, srcPath);
  console.log(`   Found ${modules.length} modules to flatten\n`);

  // Step 2: Create a mapping of old paths to new paths
  const moduleMappings = new Map<string, string>();
  modules.forEach(mod => {
    moduleMappings.set(mod.originalPath, mod.newPath);
  });

  // Step 3: Initialize ts-morph Project
  console.log('🔧 Initializing ts-morph Project...');
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
  });

  // Step 4: Update all imports BEFORE moving files
  console.log('\n📝 Updating import statements...');
  const sourceFiles = project.getSourceFiles();
  let importsUpdated = 0;

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    let fileModified = false;

    // Update import declarations
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const newPath = convertImportPath(filePath, moduleSpecifier, moduleMappings);

      if (newPath && newPath !== moduleSpecifier) {
        importDecl.setModuleSpecifier(newPath);
        fileModified = true;
        importsUpdated++;
      }
    }

    // Update export declarations
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exportDecl of exportDeclarations) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (moduleSpecifier) {
        const newPath = convertImportPath(filePath, moduleSpecifier, moduleMappings);

        if (newPath && newPath !== moduleSpecifier) {
          exportDecl.setModuleSpecifier(newPath);
          fileModified = true;
          importsUpdated++;
        }
      }
    }

    if (fileModified) {
      await sourceFile.save();
    }
  }

  console.log(`   Updated ${importsUpdated} import/export statements\n`);

  // Step 5: Move directories (in reverse depth order to avoid conflicts)
  console.log('📦 Moving directories...');
  const sortedModules = modules.sort((a, b) => {
    const depthA = a.originalPath.split(path.sep).length;
    const depthB = b.originalPath.split(path.sep).length;
    return depthB - depthA; // Deepest first
  });

  for (const module of sortedModules) {
    if (fs.existsSync(module.originalPath)) {
      moveDirectory(module.originalPath, module.newPath);
    } else {
      console.log(`⚠️  Already moved or doesn't exist: ${module.originalPath}`);
    }
  }

  // Step 6: Clean up empty directories
  console.log('\n🧹 Cleaning up empty directories...');
  cleanEmptyDirectories(srcPath);

  console.log('\n✨ Structure flattening complete!');
  console.log(`   ${modules.length} modules moved to src/`);
  console.log(`   ${importsUpdated} imports updated`);
}

/**
 * Recursively removes empty directories
 */
function cleanEmptyDirectories(dirPath: string): boolean {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return false;
  }

  let entries = fs.readdirSync(dirPath);

  // Recursively clean subdirectories
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanEmptyDirectories(fullPath);
    }
  }

  // Check again after cleaning subdirectories
  entries = fs.readdirSync(dirPath);

  if (entries.length === 0) {
    // Don't delete the src directory itself
    if (dirPath !== path.resolve(process.cwd(), 'src')) {
      fs.rmdirSync(dirPath);
      console.log(`   Removed empty directory: ${dirPath}`);
      return true;
    }
  }

  return false;
}

// Run the script
flattenStructure().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
