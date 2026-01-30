/**
 * Custom ESLint Plugin: Architecture Rules
 *
 * Enforces strict architectural patterns for React/TypeScript components.
 */

import path from 'path';
import { ESLintUtils } from '@typescript-eslint/utils';
import { graphManager } from './managers/DependencyGraphManager.js';

// Helper to check if a file is a hook file (prefixed with "use")
const isHookFile = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  return /^use[A-Z]/.test(basename);
};

// Helper to check if a file is a TSX component file
const isTsxComponentFile = (filename) => {
  return filename.endsWith('.tsx') && !isHookFile(filename);
};

// Helper to check if a component name is a Memo component
const isMemoComponent = (name) => {
  return name && /^Memo[A-Z]/.test(name);
};

// Helper to check if a file path is inside any Shared directory
// Uses normalized path matching to prevent false positives
// Matches both src/main/Shared and src/main/App/Shared
const isInSharedDir = (filePath) => {
  if (!filePath) return false;
  const normalized = path.normalize(filePath);
  const pathParts = normalized.split(path.sep);
  // Check if any directory in the path is named exactly "Shared"
  return pathParts.includes('Shared');
};

// Helper to check if an import path points to src/Shared
const isSharedImport = (importPath, currentFileDir) => {
  if (!importPath) return false;
  // Check if the import path includes 'Shared/' after any number of '../' navigations
  // This covers patterns like '../Shared/', '../Shared/', '../Shared/'
  const normalizedPath = importPath.replace(/\\/g, '/');
  return normalizedPath.includes('Shared/') || normalizedPath.endsWith('Shared');
};

// Helper to check if a file is a types file (named exactly "types.ts" or "types.tsx")
const isTypesFile = (filename) => {
  const basename = path.basename(filename);
  return basename === 'types.ts' || basename === 'types.tsx';
};

// Helper to check if a file is a config file (e.g., vite.config.ts, eslint.config.js)
const isConfigFile = (filename) => {
  const basename = path.basename(filename);
  return basename.endsWith('.config.ts') ||
    basename.endsWith('.config.js') ||
    basename.endsWith('.config.tsx') ||
    basename.endsWith('.config.mjs') ||
    basename.endsWith('.config.cjs');
};

// Helper to check if a file is part of the React ecosystem
// (components, hooks, reducers, contexts, etc.)
const isReactEcosystemFile = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename);

  // Must be a TypeScript file
  if (!['.ts', '.tsx'].includes(ext)) return false;

  // Exclude config files
  if (isConfigFile(filename)) return false;

  // Exclude type-only files
  if (isTypesFile(filename)) return false;

  // TSX files are always React ecosystem (components)
  if (ext === '.tsx') return true;

  // TS files: include if they match React patterns
  // - Hooks: useXxx
  // - Reducers: xxxReducer
  // - Contexts: xxxContext
  // - Providers: xxxProvider
  // - Utils/helpers in Shared (if in Shared dir, assume React ecosystem for .ts)
  if (ext === '.ts') {
    // If in Shared directory, assume it's React ecosystem code
    // (utilities, reducers, contexts used by React components)
    if (isInSharedDir(filename)) return true;

    // Hook files
    if (/^use[A-Z]/.test(basename)) return true;

    // Reducer files
    if (basename.endsWith('Reducer')) return true;

    // Context files
    if (basename.endsWith('Context')) return true;

    // Provider files
    if (basename.endsWith('Provider')) return true;
  }

  return false;
};

// Helper to check if a file is in the src/test directory
const isInTestDir = (filename) => {
  if (!filename) return false;
  const normalized = path.normalize(filename);
  return normalized.includes(path.join('src', 'test'));
};

// Forbidden React hooks in component files
const FORBIDDEN_HOOKS_IN_COMPONENTS = [
  'useContext',
  'useEffect',
  'useCallback',
  'useMemo',
  'useState',
  'useRef',
];

// Hooks only allowed in hook files
const HOOKS_ONLY_IN_HOOK_FILES = [
  'useState',
  'useCallback',
  'useEffect',
  'useMemo',
];

/**
 * Rule: named-exports-only
 *
 * All exports MUST be named exports. No default exports allowed.
 */
const namedExportsOnly = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce named exports only, no default exports',
    },
    messages: {
      noDefaultExport: 'Default exports are forbidden. Use named exports only.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip test directory files
    if (isInTestDir(filename)) {
      return {};
    }

    return {
      ExportDefaultDeclaration(node) {
        context.report({
          node,
          messageId: 'noDefaultExport',
        });
      },
    };
  },
};

/**
 * Rule: no-reexports
 *
 * No symbol can be imported and re-exported from a file.
 * All exports must be declared in the file itself.
 *
 * This ensures clear module boundaries and prevents unnecessary indirection.
 */
const noReexports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow re-exporting symbols from other modules',
    },
    messages: {
      noReexport:
        'Re-exporting "{{name}}" from "{{source}}" is not allowed. Declare exports in this file or import directly from the source.',
      noReexportAll:
        'Re-exporting all symbols from "{{source}}" is not allowed. Export symbols individually from this file.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip test directory files
    if (isInTestDir(filename)) {
      return {};
    }

    return {
      // Check named re-exports: export { Foo } from './bar'
      ExportNamedDeclaration(node) {
        if (node.source) {
          const exportSource = node.source.value;

          // Report each re-exported specifier
          for (const specifier of node.specifiers || []) {
            const exportedName = specifier.exported.name;

            context.report({
              node: specifier,
              messageId: 'noReexport',
              data: {
                name: exportedName,
                source: exportSource,
              },
            });
          }
        }
      },
      // Check wildcard re-exports: export * from './bar'
      ExportAllDeclaration(node) {
        const exportSource = node.source.value;

        context.report({
          node,
          messageId: 'noReexportAll',
          data: {
            source: exportSource,
          },
        });
      },
    };
  },
};

/**
 * Rule: import-from-index
 *
 * Imports must come from folder paths (via index file), never directly from a file inside a folder.
 * Example:
 *   ✅ import { Header } from './Header';
 *   ❌ import { Header } from './Header/Header';
 *   ❌ import { Header } from './Header/index';
 */
const importFromIndex = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce imports from folder index files, not direct file paths',
    },
    messages: {
      importNotFromIndex:
        'Import from "{{path}}" is not allowed. Import from the folder path instead (via index file). Use "{{suggestedPath}}" instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip test directory files
    if (isInTestDir(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          return;
        }

        // Normalize the path and check for explicit index or redundant imports
        const pathParts = importPath.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        // CASE 1: Explicitly importing 'index' - should just import the folder
        // ❌ import { Header } from './Header/index'
        // ✅ import { Header } from './Header'
        if (lastPart === 'index') {
          const suggestedParts = pathParts.slice(0, -1);
          const suggestedPath = suggestedParts.join('/') || './';

          context.report({
            node,
            messageId: 'importNotFromIndex',
            data: {
              path: importPath,
              suggestedPath,
            },
          });
          return;
        }

        // CASE 2: Check for redundant imports where folder and file name match
        // ❌ import { Header } from './Header/Header'
        // ❌ import { Shared_Tile } from './Shared/Shared_Tile/Shared_Tile'
        // ✅ import { Header } from './Header'
        // ✅ import { Shared_Tile } from './Shared/Shared_Tile'
        if (pathParts.length >= 2) {
          const relativeParts = pathParts.filter(p => p !== '.' && p !== '..');

          if (relativeParts.length >= 2) {
            const lastRelativePart = relativeParts[relativeParts.length - 1];
            const secondToLastPart = relativeParts[relativeParts.length - 2];

            // Check if the last two parts match (redundant import)
            // This catches: './Header/Header' but allows './Shared/Shared_Header'
            if (lastRelativePart === secondToLastPart) {
              const suggestedParts = pathParts.slice(0, -1);
              const suggestedPath = suggestedParts.join('/');

              context.report({
                node,
                messageId: 'importNotFromIndex',
                data: {
                  path: importPath,
                  suggestedPath: suggestedPath || './',
                },
              });
              return;
            }

            // Check for file extensions - these should never be used
            // ❌ import { Header } from './Header/Header.tsx'
            // ❌ import { Header } from './Header.tsx'
            const hasExtension = /\.(ts|tsx|js|jsx)$/.test(lastRelativePart);
            if (hasExtension) {
              // Remove the extension and check if we should also remove the filename
              const withoutExt = lastRelativePart.replace(/\.(ts|tsx|js|jsx)$/, '');
              const isIndex = withoutExt === 'index';
              const matchesPrevious = withoutExt === secondToLastPart;

              let suggestedParts;
              if (isIndex || matchesPrevious) {
                // Remove both extension and filename
                suggestedParts = pathParts.slice(0, -1);
              } else {
                // Just remove extension
                suggestedParts = [...pathParts.slice(0, -1), withoutExt];
              }

              const suggestedPath = suggestedParts.join('/') || './';

              context.report({
                node,
                messageId: 'importNotFromIndex',
                data: {
                  path: importPath,
                  suggestedPath,
                },
              });
              return;
            }
          }
        }
      },
    };
  },
};

// Primitive types that are allowed in Memo component props
const PRIMITIVE_TYPE_FLAGS = [
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'literal', // string/number/boolean literals
  'stringLiteral',
  'numberLiteral',
  'booleanLiteral',
];

// Global Maps removed - now handled by DependencyGraphManager
// See graphManager.trackSharedImport() and graphManager.trackImport()

/**
 * Rule: index-only-files
 *
 * All TypeScript/JavaScript files must be named index.{ts,tsx,js,jsx} and
 * must be nested within a folder named after the component/module.
 *
 * This enforces a strict folder structure:
 *   ✅ ComponentName/index.tsx
 *   ✅ utils/index.ts
 *   ❌ ComponentName.tsx
 *   ❌ utils.ts
 *
 * This ensures consistent imports and clear module boundaries.
 */
const indexOnlyFiles = {
  meta: {
    type: 'problem',
    docs: {
      description: 'All declarations must be in index files nested in folders',
    },
    messages: {
      notIndexFile:
        'File "{{filename}}" must be renamed to "index.{{ext}}" and placed in a "{{suggestedFolder}}/" folder. All declarations must be in index files: {{suggestedPath}}',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename).slice(1);
    const dirname = path.dirname(filename);
    const folderName = path.basename(dirname);

    // Only apply to TypeScript/JavaScript files
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      return {};
    }

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    // If this is not an index file, report an error
    if (basename !== 'index') {
      return {
        Program(node) {
          // Suggest the proper structure
          const suggestedFolder = basename;
          const currentDir = path.dirname(filename);
          const suggestedPath = path.join(currentDir, basename, `index.${ext}`);

          context.report({
            node,
            messageId: 'notIndexFile',
            data: {
              filename: path.basename(filename),
              ext,
              suggestedFolder: basename,
              suggestedPath: suggestedPath.replace(process.cwd(), ''),
            },
          });
        },
      };
    }

    return {};
  },
};

/**
 * Rule: shared-must-be-multi-imported
 *
 * Components in src/Shared must be imported from at least 2 different files.
 * This ensures that shared components are actually shared and not just misplaced.
 *
 * Note: This rule works by tracking imports across files during a lint run.
 * The error is reported on the shared component's export declaration.
 */
const sharedMustBeMultiImported = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'React ecosystem code in src/Shared must be imported from multiple files',
    },
    messages: {
      notShared:
        'Shared module "{{name}}" is only imported from {{count}} file(s). Code in src/Shared must be imported from at least 2 different files to justify being shared. Move this module closer to where it\'s used.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const fileDir = path.dirname(filename);
    const isSharedFile = isInSharedDir(filename);
    const basename = path.basename(filename, path.extname(filename));

    // Skip test directory files
    if (isInTestDir(filename)) {
      return {};
    }

    // Return handlers for both tracking imports and validating exports
    const handlers = {
      // Track ALL imports of Shared modules (both from outside and within Shared)
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          return;
        }

        // Resolve the import path to see if it's in a Shared directory
        const resolvedPath = graphManager.resolvePath(filename, importPath);
        if (!resolvedPath) return;

        // Only track if the imported file is in a Shared directory
        if (!isInSharedDir(resolvedPath)) {
          return;
        }

        // Track each imported component/function using graphManager
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;

          const importedName = specifier.imported.name;

          // Track both PascalCase (components) and camelCase (functions/utilities)
          // Skip only lowercase constants and type imports
          if (!/^[A-Z]/.test(importedName) && !/^[a-z][a-zA-Z]*$/.test(importedName)) continue;

          // Use graphManager to track shared imports
          graphManager.trackSharedImport(importedName, filename);
        }
      },
    };

    // For shared React ecosystem files: add validation handler
    // Check .tsx (components) and .ts (reducers, hooks, utils) files
    if (isReactEcosystemFile(filename)) {
      handlers['Program:exit'] = (node) => {
        // Find the primary export (component/function/reducer name)
        let exportName = null;

        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
            if (
              statement.declaration.type === 'FunctionDeclaration'
              && statement.declaration.id
            ) {
              exportName = statement.declaration.id.name;
              break;
            }
            if (statement.declaration.type === 'VariableDeclaration') {
              const firstDecl = statement.declaration.declarations[0];
              if (firstDecl && firstDecl.id.type === 'Identifier') {
                exportName = firstDecl.id.name;
                break;
              }
            }
          }
        }

        if (!exportName) return;

        // Skip lowercase constants (UPPER_CASE or lowercase)
        if (!/^[A-Z]/.test(exportName) && !/^[a-z][a-zA-Z]*$/.test(exportName)) return;

        // Check how many files import this component/function using graphManager
        const { count: importCount } = graphManager.getSharedImportInfo(exportName);

        if (importCount < 2) {
          context.report({
            node,
            messageId: 'notShared',
            data: {
              name: exportName,
              count: importCount,
            },
          });
        }
      };
    }

    return handlers;
  },
};

// Helper functions removed - now handled by DependencyGraphManager
// See graphManager.resolvePath() and graphManager.calculateLCA()

/**
 * Helper: Check if import path is a direct sibling (./Name pattern)
 */
const isDirectSibling = (importPath) => {
  // Must start with ./ and have exactly one segment after it
  if (!importPath.startsWith('./')) return false;

  const withoutDotSlash = importPath.slice(2);
  // Should not contain any more slashes (just the folder name)
  return !withoutDotSlash.includes('/');
};

// Helper removed - unused after refactoring

/**
 * Rule: import-from-sibling-directory-or-shared
 *
 * Enforces that imports are located at the appropriate level:
 * - If a module is imported only once (single dependency), it should be a direct sibling
 *   of the importing file (import path: './Name')
 * - If a module is imported from multiple locations, it should be located at the
 *   Least Common Ancestor directory of all importing files
 *
 * This ensures modules are placed at the right level in the hierarchy based on usage.
 */
const importFromSiblingDirectoryOrShared = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce imports are from sibling directories (single use) or from LCA (multi-use)',
    },
    messages: {
      singleUseShouldBeSibling:
        'Module "{{importPath}}" is only imported once. Since it has a single dependency, move it to be a direct sibling of this file. The import path should be "./{{moduleName}}" (current: "{{currentPath}}").',
      notActualChild:
        'Import "{{importPath}}" appears to be a child import but is not a subdirectory.\n\n' +
        'Expected: {{expectedPath}}\n' +
        'Actual: {{actualPath}}\n\n' +
        'Single-use components must be in child directories of their parent.\n' +
        'Move the module to be a direct subdirectory or fix the import path.',
      multiUseNotInShared:
        'Module "{{importPath}}" is imported from {{count}} locations but NOT in a Shared directory.\n\n' +
        'Current: {{currentLocation}}\n' +
        'Expected: {{expectedSharedPath}}\n\n' +
        'Multi-use components must be in Shared at the LCA level.\n' +
        'Move to: {{lcaPath}}/Shared/Shared_{{moduleName}}',
      multiUseWrongSharedLevel:
        'Module "{{importPath}}" is in Shared but not at correct LCA level.\n\n' +
        'Current: {{currentLocation}}\n' +
        'Expected: {{expectedSharedPath}}\n\n' +
        'Shared directory should be at: {{lcaPath}}/Shared/\n' +
        'Move the module to the LCA-level Shared directory.',
      multiUseShouldBeInLCA:
        'Module "{{importPath}}" is imported from {{count}} different locations. It should be located at the Least Common Ancestor directory ({{lca}}) to minimize coupling. Current location: {{currentLocation}}',
      checkUsageAndMove:
        'Import from "{{importPath}}" may not be at the correct level. Check if this module is imported from multiple locations:\n' +
        '  - If this is the ONLY file importing it, move the imported folder to be a direct sibling (./Name)\n' +
        '  - If MULTIPLE files import it, move it to the Least Common Ancestor directory of all importers\n' +
        'This ensures the folder structure documents dependencies clearly.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const DEBUG = process.env.ESLINT_DEBUG_ARCHITECTURE === 'true';

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    return {
      // First pass: Track all imports using graphManager
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.')) {
          return;
        }

        // Skip asset imports (CSS, images, fonts, etc.)
        if (/\.(css|scss|sass|less|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(importPath)) {
          return;
        }

        // Resolve the import to an absolute path using graphManager
        const resolvedPath = graphManager.resolvePath(filename, importPath);
        if (!resolvedPath) return;

        if (DEBUG) {
          console.log('[import-from-sibling] Tracking:', {
            from: filename.replace(process.cwd(), ''),
            import: importPath,
            resolved: resolvedPath.replace(process.cwd(), ''),
          });
        }

        // Track this import using graphManager
        graphManager.trackImport(filename, resolvedPath);
      },

      // Second pass: Validate each import
      'Program:exit'(node) {
        // Re-visit all imports in this file
        for (const statement of node.body) {
          if (statement.type !== 'ImportDeclaration') continue;

          const importPath = statement.source.value;

          // Skip external modules
          if (!importPath.startsWith('.')) continue;

          // Skip imports from Shared (these have their own rule)
          const fileDir = path.dirname(filename);
          if (isSharedImport(importPath, fileDir)) continue;

          // Skip imports from types files (they're shared resources)
          if (importPath === './types' || importPath.endsWith('/types') || importPath.includes('/types/')) {
            continue;
          }

          // Resolve the import using graphManager
          const resolvedPath = graphManager.resolvePath(filename, importPath);
          if (!resolvedPath) continue;

          // Get all files that import this module using graphManager
          const { count: importCount, files: importingFiles } = graphManager.getImportInfo(resolvedPath);
          if (importCount === 0) continue;

          if (DEBUG) {
            console.log('[import-from-sibling] Validating:', {
              file: filename.replace(process.cwd(), ''),
              import: importPath,
              importCount,
              importingFiles: [...importingFiles].map(f => f.replace(process.cwd(), '')),
            });
          }

          // CASE 1: Single import - should be a direct sibling
          if (importCount === 1) {
            const isSibling = isDirectSibling(importPath);

            // If it looks like a sibling, verify it's actually a subdirectory
            if (isSibling) {
              const importingDir = path.dirname(filename);
              const importedModuleName = importPath.slice(2); // Remove './'
              const expectedChildPath = path.join(importingDir, importedModuleName);
              // resolvedPath points to index.ts, so get its parent directory
              const actualModuleDir = path.dirname(resolvedPath);

              if (path.normalize(actualModuleDir) !== path.normalize(expectedChildPath)) {
                if (DEBUG) {
                  console.log('[import-from-sibling] VIOLATION: Looks like child but is not subdirectory', {
                    importPath,
                    expectedChildPath: expectedChildPath.replace(process.cwd(), ''),
                    actualModuleDir: actualModuleDir.replace(process.cwd(), ''),
                  });
                }

                context.report({
                  node: statement,
                  messageId: 'notActualChild',
                  data: {
                    importPath,
                    expectedPath: expectedChildPath.replace(process.cwd(), ''),
                    actualPath: actualModuleDir.replace(process.cwd(), ''),
                  },
                });
              }
            } else {
              // Not a sibling pattern - report as before
              const parts = importPath.split('/');
              const moduleName = parts[parts.length - 1];

              if (DEBUG) {
                console.log('[import-from-sibling] VIOLATION: Single import not sibling', {
                  importPath,
                  isSibling,
                  moduleName,
                });
              }

              context.report({
                node: statement,
                messageId: 'singleUseShouldBeSibling',
                data: {
                  importPath: importPath,
                  currentPath: importPath,
                  moduleName: moduleName,
                },
              });
            }
          }

          // CASE 2: Multiple imports - should be in Shared at LCA
          else if (importCount > 1) {
            // Use graphManager's memoized LCA calculation
            const lca = graphManager.calculateLCA([...importingFiles]);
            const currentModuleDir = path.dirname(resolvedPath);
            const moduleName = path.basename(currentModuleDir);

            // Check if the module is in a Shared directory by parsing path parts
            const pathParts = currentModuleDir.split(path.sep);
            const hasSharedDir = pathParts.includes('Shared');

            if (!hasSharedDir) {
              // Multi-use component not in Shared - report error
              const expectedSharedPath = path.join(lca, 'Shared', `Shared_${moduleName}`);

              if (DEBUG) {
                console.log('[import-from-sibling] VIOLATION: Multi-use not in Shared', {
                  importPath,
                  count: importCount,
                  currentModuleDir: currentModuleDir.replace(process.cwd(), ''),
                  expectedSharedPath: expectedSharedPath.replace(process.cwd(), ''),
                });
              }

              context.report({
                node: statement,
                messageId: 'multiUseNotInShared',
                data: {
                  importPath,
                  count: importCount,
                  currentLocation: currentModuleDir.replace(process.cwd(), ''),
                  expectedSharedPath: expectedSharedPath.replace(process.cwd(), ''),
                  lcaPath: lca.replace(process.cwd(), ''),
                  moduleName,
                },
              });
            } else {
              // In Shared - verify it's at the correct LCA level
              // Find the actual "Shared" directory (not as part of a module name like "Shared_foo")
              const pathParts = currentModuleDir.split(path.sep);

              // Find the last occurrence of exactly "Shared" (the directory, not part of a name)
              let sharedIndex = -1;
              for (let i = pathParts.length - 1; i >= 0; i--) {
                if (pathParts[i] === 'Shared') {
                  sharedIndex = i;
                  break;
                }
              }

              if (sharedIndex > 0) {
                // Reconstruct the full path to the Shared directory
                const sharedDirPath = pathParts.slice(0, sharedIndex + 1).join(path.sep);

                // Check if LCA ends with Shared (modules are siblings in Shared)
                const lcaParts = lca.split(path.sep);
                const lcaEndsWithShared = lcaParts[lcaParts.length - 1] === 'Shared';

                // If LCA is a Shared directory, modules should be direct children
                // If LCA is not Shared, modules should be in {LCA}/Shared/
                const expectedSharedDir = lcaEndsWithShared ? lca : path.join(lca, 'Shared');

                if (path.normalize(sharedDirPath) !== path.normalize(expectedSharedDir)) {
                  const expectedSharedPath = path.join(expectedSharedDir, moduleName);

                  if (DEBUG) {
                    console.log('[import-from-sibling] VIOLATION: Shared at wrong level', {
                      importPath,
                      count: importCount,
                      currentModuleDir: currentModuleDir.replace(process.cwd(), ''),
                      sharedDirPath: sharedDirPath.replace(process.cwd(), ''),
                      expectedSharedDir: expectedSharedDir.replace(process.cwd(), ''),
                      expectedSharedPath: expectedSharedPath.replace(process.cwd(), ''),
                      lcaEndsWithShared,
                    });
                  }

                  context.report({
                    node: statement,
                    messageId: 'multiUseWrongSharedLevel',
                    data: {
                      importPath,
                      count: importCount,
                      currentLocation: currentModuleDir.replace(process.cwd(), ''),
                      expectedSharedPath: expectedSharedPath.replace(process.cwd(), ''),
                      lcaPath: lca.replace(process.cwd(), ''),
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

/**
 * Rule: no-circular-dependencies
 *
 * Detects and prevents circular import dependencies between files.
 * A circular dependency occurs when file A imports file B, which imports file C,
 * which eventually imports file A again, forming a cycle.
 *
 * This rule uses DFS cycle detection to identify cycles efficiently.
 */
const noCircularDependencies = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent circular dependencies between modules',
    },
    messages: {
      circularDependency:
        'Circular dependency detected: {{cyclePath}}\n\nCircular dependencies cause:\n' +
        '  - Hard-to-debug initialization issues\n  - Unpredictable module load order\n' +
        '  - Potential runtime errors\n\nTo fix:\n' +
        '  1. Extract shared code to a new module\n  2. Use dependency injection\n' +
        '  3. Refactor to remove the circular reference',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.')) {
          return;
        }

        // Resolve the import path
        const resolvedPath = graphManager.resolvePath(filename, importPath);
        if (!resolvedPath) return;

        // Add dependency edge and check for cycles
        const result = graphManager.addDependencyEdge(filename, resolvedPath);

        if (result.hasCycle) {
          const cyclePath = graphManager.formatCyclePath(result.cyclePath);

          context.report({
            node,
            messageId: 'circularDependency',
            data: {
              cyclePath,
            },
          });
        }
      },
    };
  },
};

/**
 * Rule: enforce-downwards-imports
 *
 * Enforces that components can only import from:
 * - Direct subdirectories (./SubComponent)
 * - Shared directory (../Shared/Component)
 * - Types at same level (./types)
 *
 * Rejects upwards imports (../ParentComponent) to maintain clear hierarchy.
 * This ensures dependencies flow downwards in the component tree.
 */
const enforceDownwardsImports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce downwards-only imports in component hierarchy',
    },
    messages: {
      upwardsImport:
        'Upwards import detected: "{{importPath}}"\n\n' +
        'Components should only import from:\n' +
        '  ✅ Direct subdirectories: ./SubComponent\n' +
        '  ✅ Shared directory: ../Shared/Component\n' +
        '  ✅ Types at same level: ./types\n' +
        '  ❌ Parent directories: ../ParentComponent\n\n' +
        'Upwards imports create tight coupling and make code harder to understand.\n' +
        'Consider:\n' +
        '  1. Moving the imported code to a Shared location\n' +
        '  2. Passing data/behavior through props\n' +
        '  3. Restructuring the component hierarchy',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const fileDir = path.dirname(filename);

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    // Skip type files - they can import types from anywhere
    if (filename.endsWith('types.ts') || filename.endsWith('types.tsx')) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.')) {
          return;
        }

        // Allow imports from Shared (these are explicitly allowed)
        if (isSharedImport(importPath, fileDir)) {
          return;
        }

        // Allow imports from types files at any level
        // Pattern: ./types, ../types, ../App/types, etc.
        if (importPath === './types' || importPath.endsWith('/types') || importPath.includes('/types/')) {
          return;
        }

        // Allow direct subdirectory imports (./Something)
        if (importPath.startsWith('./') && !importPath.startsWith('./.')) {
          const pathWithoutPrefix = importPath.slice(2);
          // If no slashes remain, it's a direct child
          if (!pathWithoutPrefix.includes('/')) {
            return;
          }
        }

        // Allow sibling imports within same parent (../Sibling pattern)
        // This is common in Shared directories where components import from each other
        if (importPath.startsWith('../')) {
          const pathWithoutPrefix = importPath.slice(3); // Remove '../'
          // If no slashes remain, it's a sibling
          if (!pathWithoutPrefix.includes('/')) {
            return;
          }

          // Otherwise, it's an upwards import to a parent directory
          context.report({
            node,
            messageId: 'upwardsImport',
            data: {
              importPath,
            },
          });
        }
      },
    };
  },
};

/**
 * Rule: shared-exports-must-be-prefixed
 *
 * All exports from src/main/Shared/ must be prefixed with "Shared_".
 * This creates an explicit contract that symbols are intended for shared use
 * and prevents false positives from path-based detection.
 *
 * Examples:
 *   ✅ export const Shared_Tile = ...
 *   ✅ export function Shared_BlockVisual() { ... }
 *   ❌ export const Tile = ...
 *   ❌ export function BlockVisual() { ... }
 *
 * This rule includes auto-fix capability for easy migration.
 */
const sharedExportsMustBePrefixed = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Exports from Shared directory must be prefixed with Shared_',
    },
    messages: {
      missingPrefix:
        'Export "{{name}}" from Shared directory must be prefixed with "Shared_"\n\n' +
        'Components in src/main/Shared/ are shared across the codebase.\n' +
        'The Shared_ prefix creates an explicit contract that this symbol is\n' +
        'intended for shared use and makes imports more readable.\n\n' +
        'Example:\n' +
        '  ✅ export const Shared_{{name}} = ...\n' +
        '  ❌ export const {{name}} = ...\n\n' +
        'This rule can auto-fix the export, but you\'ll need to update imports manually.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip test directory files
    if (isInTestDir(filename)) {
      return {};
    }

    // Only apply to files in Shared directory
    if (!isInSharedDir(filename)) {
      return {};
    }

    /**
     * Extract exported names from various export declaration types
     */
    const checkExportAndFix = (node, exportedName, declarationNode) => {
      // Skip if already has Shared_ prefix
      if (exportedName.startsWith('Shared_')) {
        return;
      }

      // Skip lowercase exports (types, constants, utilities)
      if (!/^[A-Z]/.test(exportedName)) {
        return;
      }

      // Skip Memo-wrapped components that already have Shared_ prefix on the wrapped component
      // e.g., MemoShared_Tile is acceptable
      if (exportedName.startsWith('Memo') && exportedName.includes('Shared_')) {
        return;
      }

      const newName = `Shared_${exportedName}`;

      context.report({
        node: declarationNode || node,
        messageId: 'missingPrefix',
        data: {
          name: exportedName,
        },
        fix(fixer) {
          // Find the identifier node and replace it
          if (declarationNode && declarationNode.type === 'Identifier') {
            return fixer.replaceText(declarationNode, newName);
          }
          return null;
        },
      });
    };

    return {
      // Handle: export const Foo = ...
      // Handle: export function Foo() { ... }
      ExportNamedDeclaration(node) {
        if (!node.declaration) return;

        // Function declaration: export function Foo() { ... }
        if (
          node.declaration.type === 'FunctionDeclaration' &&
          node.declaration.id
        ) {
          checkExportAndFix(node, node.declaration.id.name, node.declaration.id);
        }

        // Variable declaration: export const Foo = ...
        if (node.declaration.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            if (declarator.id.type === 'Identifier') {
              checkExportAndFix(node, declarator.id.name, declarator.id);
            }
          }
        }

        // Type alias: export type Foo = ...
        if (
          node.declaration.type === 'TSTypeAliasDeclaration' &&
          node.declaration.id
        ) {
          checkExportAndFix(node, node.declaration.id.name, node.declaration.id);
        }

        // Interface: export interface Foo { ... }
        if (
          node.declaration.type === 'TSInterfaceDeclaration' &&
          node.declaration.id
        ) {
          checkExportAndFix(node, node.declaration.id.name, node.declaration.id);
        }
      },
    };
  },
};

/**
 * Rule: folder-export-must-match
 *
 * Enforces that the primary export from an index file must match the folder name.
 * This ensures the folder structure clearly documents what's inside.
 *
 * Examples:
 *   ✅ Header/index.tsx exports Header or MemoHeader
 *   ✅ Shared/Tile/index.tsx exports Shared_Tile or MemoShared_Tile
 *   ❌ Header/index.tsx exports Button
 *   ❌ Utils/index.tsx exports Header
 *
 * Allows variations: ComponentName, MemoComponentName, MemoizedComponentName
 * Skips root-level index files: src/main/index.tsx, App/index.tsx
 */
const folderExportMustMatch = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Primary export must match folder name',
    },
    messages: {
      mismatch:
        'Folder "{{folderName}}" must export a matching symbol.\n\n' +
        'Current exports: {{actualExports}}\n' +
        'Expected one of: {{expectedNames}}\n\n' +
        'The folder structure should clearly document what\'s inside.\n' +
        'If this folder contains "{{folderName}}", the primary export should be:\n' +
        '  - {{folderName}}\n' +
        '  - Memo{{folderName}}\n' +
        '  - Shared_{{folderName}} (if in Shared directory)\n\n' +
        'If you\'re exporting something else, either:\n' +
        '  1. Rename the folder to match the export\n' +
        '  2. Move the export to a folder with the correct name',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = path.basename(filename);

    // Only apply to index files
    if (basename !== 'index.tsx' && basename !== 'index.ts') {
      return {};
    }

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    const folderName = path.basename(path.dirname(filename));

    // Skip root-level index files (they can export anything)
    const rootLevelFolders = ['src', 'main', 'App', 'components', 'utils'];
    if (rootLevelFolders.includes(folderName)) {
      return {};
    }

    // Skip types folders
    if (folderName === 'types') {
      return {};
    }

    return {
      'Program:exit'(node) {
        // Collect all exports
        const exports = [];

        for (const statement of node.body) {
          // Named exports with declarations
          if (
            statement.type === 'ExportNamedDeclaration' &&
            statement.declaration
          ) {
            // Function: export function Foo() { ... }
            if (
              statement.declaration.type === 'FunctionDeclaration' &&
              statement.declaration.id
            ) {
              exports.push(statement.declaration.id.name);
            }

            // Variable: export const Foo = ...
            if (statement.declaration.type === 'VariableDeclaration') {
              for (const declarator of statement.declaration.declarations) {
                if (declarator.id.type === 'Identifier') {
                  exports.push(declarator.id.name);
                }
              }
            }

            // Skip Type/Interface exports - we only care about component/function exports
            // Types don't need to match folder names
          }
        }

        if (exports.length === 0) return;

        // Build expected names - exact match only (no Memo variations)
        const expectedNames = [folderName];

        // If in Shared directory, also allow Shared_ prefix
        if (isInSharedDir(filename)) {
          expectedNames.push(`Shared_${folderName}`);
        }

        // Check if exports match the expected pattern
        // Allow both PascalCase (components) and camelCase (functions/hooks) exports
        const matchingExports = exports.filter(exp =>
          expectedNames.includes(exp)
        );

        // Check for facade pattern: one export matches folder name and wraps others
        const hasFacade = matchingExports.length > 0;

        if (hasFacade) {
          // Facade pattern is allowed - the matching export can wrap other exports
          // This is the preferred pattern for utility modules
          return;
        }

        // No facade - check for single export matching folder name
        // Only count actual code exports (not lowercase like 'initialState')
        // PascalCase = components, camelCase starting with lowercase letter = functions/hooks
        const codeExports = exports.filter(exp => /^[A-Za-z]/.test(exp));
        const hasMatch = matchingExports.length === 1 && codeExports.length === 1;

        if (!hasMatch) {
          // Show all code exports in error message (both PascalCase and camelCase)
          const codeExportsList = codeExports.length > 0
            ? codeExports.join(', ')
            : '(none)';

          context.report({
            node,
            messageId: 'mismatch',
            data: {
              folderName,
              actualExports: codeExportsList,
              expectedNames: expectedNames.slice(0, 3).join(', '),
            },
          });
        }
      },
    };
  },
};

/**
 * Rule: one-declaration-per-file
 *
 * Each file must contain exactly ONE export declaration (component, constant, or function).
 * This enforces single responsibility and ensures folder names accurately reflect their contents.
 *
 * Facade pattern exception: If the folder exports a matching named object that wraps
 * other exports, it's considered a facade and is allowed.
 *
 * Examples:
 *   ✅ Single export: export const Header = ...
 *   ✅ Facade: export const Shared_utils = { helper1, helper2, ... } (folder named Shared_utils)
 *   ❌ Multiple exports: export const Header = ...; export const Icon = ...;
 */
const oneDeclarationPerFile = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce exactly one declaration per file',
    },
    messages: {
      multipleDeclarations:
        'File has {{count}} declarations but must have exactly ONE.\n\n' +
        'Found: {{declarations}}\n\n' +
        'Each declaration should be in its own folder:\n' +
        '{{suggestions}}\n\n' +
        'Single responsibility: One file = one thing.\n' +
        'This keeps the codebase organized and folder names meaningful.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    // Skip types files (they can have multiple type exports)
    if (isTypesFile(filename)) {
      return {};
    }

    return {
      'Program:exit'(node) {
        const declarations = [];

        // Count export declarations (skip type/interface exports)
        for (const statement of node.body) {
          if (
            statement.type === 'ExportNamedDeclaration' &&
            statement.declaration
          ) {
            // Function: export function Foo() { ... }
            if (
              statement.declaration.type === 'FunctionDeclaration' &&
              statement.declaration.id
            ) {
              declarations.push(statement.declaration.id.name);
            }

            // Variable: export const Foo = ...
            if (statement.declaration.type === 'VariableDeclaration') {
              for (const declarator of statement.declaration.declarations) {
                if (declarator.id.type === 'Identifier') {
                  declarations.push(declarator.id.name);
                }
              }
            }

            // Skip Type/Interface exports
          }
        }

        // Allow 0 (empty file) or 1 declaration
        if (declarations.length <= 1) return;

        // Check for facade pattern: one export matches folder name and wraps others
        const folderName = path.basename(path.dirname(filename));
        const hasFacade = declarations.some(decl =>
          decl === folderName || decl === `Shared_${folderName}`
        );

        if (hasFacade) {
          // This is a facade pattern - allowed
          return;
        }

        // Multiple declarations without facade - report error
        const suggestions = declarations
          .map(decl => `  - ${decl}/index.tsx or ${decl}/index.ts`)
          .join('\n');

        context.report({
          node,
          messageId: 'multipleDeclarations',
          data: {
            count: declarations.length,
            declarations: declarations.join(', '),
            suggestions,
          },
        });
      },
    };
  },
};

/**
 * Rule: no-separate-export-declarations
 *
 * Disallows export statements that are separate from declarations.
 * Forces all exports to be inline with their declarations.
 *
 * Examples:
 *   ✅ export const Foo = ...
 *   ✅ export function Bar() { ... }
 *   ❌ export { Foo }
 *   ❌ export { Foo as Bar }
 */
const noSeparateExportDeclarations = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow export statements separate from declarations',
    },
    messages: {
      separateExport:
        'Export "{{name}}" is separate from its declaration.\n\n' +
        'Exports must be inline with declarations:\n' +
        '  ✅ export const {{name}} = ...\n' +
        '  ✅ export function {{name}}() { ... }\n' +
        '  ❌ const {{name}} = ...; export { {{name}} }\n' +
        '  ❌ export { SomethingElse as {{name}} }\n\n' +
        'This ensures declarations and exports are always together,\n' +
        'making the code easier to understand and maintain.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Skip node_modules, build output, and test directory
    if (filename.includes('node_modules') || filename.includes('/dist/') || isInTestDir(filename)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        // Check if this is an export with specifiers but no declaration
        // This catches: export { Foo } and export { Foo as Bar }
        if (!node.declaration && node.specifiers && node.specifiers.length > 0) {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ExportSpecifier') {
              // Report the exported name (the 'as Y' part if renamed)
              const exportedName = specifier.exported.name;

              context.report({
                node: specifier,
                messageId: 'separateExport',
                data: {
                  name: exportedName,
                },
              });
            }
          }
        }
      },
    };
  },
};

// State management for ensuring fresh state on each ESLint run
let lastRunTimestamp = 0;
const RUN_TIMEOUT_MS = 1000; // If more than 1s between files, assume new run

const ensureFreshState = () => {
  const now = Date.now();
  // If it's been more than 1s since last file, assume this is a new ESLint run
  if (now - lastRunTimestamp > RUN_TIMEOUT_MS) {
    graphManager.reset();
  }
  lastRunTimestamp = now;
};

// Processor to manage state lifecycle
const cleanupProcessor = {
  preprocess(text) {
    // Reset state at start of each ESLint run (heuristic: gap > 1s between files)
    ensureFreshState();
    return [text];
  },
  postprocess(messages) {
    return messages[0];
  },
  supportsAutofix: true,
};

// Export the plugin
export default {
  meta: {
    name: 'eslint-plugin-architecture',
    version: '2.0.0', // Bumped for new features
  },
  rules: {
    // Existing rules
    'named-exports-only': namedExportsOnly,
    'no-reexports': noReexports,
    'import-from-index': importFromIndex,
    'shared-must-be-multi-imported': sharedMustBeMultiImported,
    'index-only-files': indexOnlyFiles,
    'import-from-sibling-directory-or-shared': importFromSiblingDirectoryOrShared,

    // New rules
    'no-circular-dependencies': noCircularDependencies,
    'enforce-downwards-imports': enforceDownwardsImports,
    'shared-exports-must-be-prefixed': sharedExportsMustBePrefixed,
    'folder-export-must-match': folderExportMustMatch,
    'one-declaration-per-file': oneDeclarationPerFile,
    'no-separate-export-declarations': noSeparateExportDeclarations,
  },
  processors: {
    // Add cleanup processor for TypeScript files
    '.ts': cleanupProcessor,
    '.tsx': cleanupProcessor,
  },
  configs: {
    recommended: {
      plugins: ['architecture'],
      rules: {
        // Existing rules
        'architecture/named-exports-only': 'error',
        'architecture/no-reexports': 'error',
        'architecture/import-from-index': 'error',
        'architecture/shared-must-be-multi-imported': 'error',
        'architecture/index-only-files': 'error',
        'architecture/import-from-sibling-directory-or-shared': 'error',

        // New rules
        'architecture/no-circular-dependencies': 'error',
        'architecture/enforce-downwards-imports': 'error',
        'architecture/shared-exports-must-be-prefixed': 'error',
        'architecture/folder-export-must-match': 'error',
        'architecture/one-declaration-per-file': 'error',
        'architecture/no-separate-export-declarations': 'error',
      },
    },
  },
};
