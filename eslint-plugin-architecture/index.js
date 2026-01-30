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

// Helper to check if a file path is inside src/Shared directory
// Uses normalized path matching to prevent false positives
const isInSharedDir = (filePath) => {
  if (!filePath) return false;
  const normalized = path.normalize(filePath);
  const sharedPattern = path.join('src', 'main', 'Shared');
  return normalized.includes(sharedPattern);
};

// Helper to check if an import path points to src/Shared
const isSharedImport = (importPath, currentFileDir) => {
  if (!importPath) return false;
  // Check if the import path includes 'Shared/' after any number of '../' navigations
  // This covers patterns like '../../../Shared/', '../../Shared/', '../Shared/'
  const normalizedPath = importPath.replace(/\\/g, '/');
  return normalizedPath.includes('Shared/') || normalizedPath.endsWith('Shared');
};

// Helper to check if a file is a types file (named exactly "types.ts" or "types.tsx")
const isTypesFile = (filename) => {
  const basename = path.basename(filename);
  return basename === 'types.ts' || basename === 'types.tsx';
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

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip external modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          return;
        }

        // Normalize the path and check for file-like imports
        const pathParts = importPath.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        // If the last part looks like a file (contains a dot or starts with uppercase
        // and the previous part is also a valid folder name), it's likely a direct file import
        // We detect patterns like: ./Folder/File or ./Folder/FileName
        // But allow: ./Folder (imports from index)

        // Check if the import path has more than one component after ./ or ../
        // and the last component looks like a file (PascalCase or camelCase, not 'index')
        if (pathParts.length >= 2) {
          const relativeParts = pathParts.filter(p => p !== '.' && p !== '..');
          
          if (relativeParts.length >= 2) {
            const lastRelativePart = relativeParts[relativeParts.length - 1];
            
            // Skip if explicitly importing 'index'
            if (lastRelativePart === 'index') {
              return;
            }

            // Check if the last part looks like a file name:
            // - Has an extension like .ts, .tsx, .js, .jsx
            // - OR is PascalCase/camelCase without extension (implicit index resolution won't apply)
            const hasExtension = /\.(ts|tsx|js|jsx)$/.test(lastRelativePart);
            const isPascalOrCamelCase = /^[A-Za-z]/.test(lastRelativePart) && !lastRelativePart.includes('.');
            const looksLikeFile = hasExtension || isPascalOrCamelCase;

            // The previous part should look like a folder (PascalCase typically)
            const previousPart = relativeParts[relativeParts.length - 2];
            const looksLikeFolder = /^[A-Z]/.test(previousPart) || previousPart === 'src';

            if (looksLikeFile && looksLikeFolder) {
              // This looks like a direct file import inside a folder
              // Suggest importing from the parent folder instead
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

    // Skip node_modules and build output
    if (filename.includes('node_modules') || filename.includes('/dist/')) {
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
        'Components in src/Shared must be imported from multiple files',
    },
    messages: {
      notShared:
        'Shared component "{{name}}" is only imported from {{count}} file(s). Components in src/Shared must be imported from at least 2 different files to justify being shared. Move this component closer to where it\'s used.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const fileDir = path.dirname(filename);
    const isSharedFile = isInSharedDir(filename);
    const basename = path.basename(filename, path.extname(filename));

    // For non-shared files: track imports from src/Shared
    if (!isSharedFile) {
      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;

          // Skip external modules
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return;
          }

          // Check if importing from src/Shared
          if (!isSharedImport(importPath, fileDir)) {
            return;
          }

          // Track each imported component using graphManager
          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') continue;

            const importedName = specifier.imported.name;

            // Only track component imports (PascalCase)
            if (!/^[A-Z]/.test(importedName)) continue;

            // Use graphManager to track shared imports
            graphManager.trackSharedImport(importedName, filename);
          }
        },
      };
    }

    // For shared component files: check if they're imported enough
    // Only check .tsx files that export components (not hooks, types, etc.)
    if (!isTsxComponentFile(filename) || basename === 'index') {
      return {};
    }

    return {
      'Program:exit'(node) {
        // Find the primary export (component name)
        let componentName = null;

        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
            if (
              statement.declaration.type === 'FunctionDeclaration'
              && statement.declaration.id
            ) {
              componentName = statement.declaration.id.name;
              break;
            }
            if (statement.declaration.type === 'VariableDeclaration') {
              const firstDecl = statement.declaration.declarations[0];
              if (firstDecl && firstDecl.id.type === 'Identifier') {
                componentName = firstDecl.id.name;
                break;
              }
            }
          }
        }

        if (!componentName) return;

        // Check how many files import this component using graphManager
        const { count: importCount } = graphManager.getSharedImportInfo(componentName);

        if (importCount < 2) {
          context.report({
            node,
            messageId: 'notShared',
            data: {
              name: componentName,
              count: importCount,
            },
          });
        }
      },
    };
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

    // Skip node_modules and build output
    if (filename.includes('node_modules') || filename.includes('/dist/')) {
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

            if (!isSibling) {
              // Extract the module name from the import path
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

          // CASE 2: Multiple imports - should be at LCA
          else if (importCount > 1) {
            // Use graphManager's memoized LCA calculation
            const lca = graphManager.calculateLCA([...importingFiles]);
            const currentModuleDir = path.dirname(resolvedPath);

            // Check if the module is in the LCA directory
            // The module should be a direct child of the LCA
            const expectedParent = lca;
            const actualParent = path.dirname(currentModuleDir);

            if (DEBUG) {
              console.log('[import-from-sibling] Multi-import check:', {
                importPath,
                lca: lca.replace(process.cwd(), ''),
                expectedParent: expectedParent.replace(process.cwd(), ''),
                actualParent: actualParent.replace(process.cwd(), ''),
                match: actualParent === expectedParent,
              });
            }

            if (actualParent !== expectedParent) {
              context.report({
                node: statement,
                messageId: 'multiUseShouldBeInLCA',
                data: {
                  importPath: importPath,
                  count: importCount,
                  lca: lca.replace(process.cwd(), ''),
                  currentLocation: currentModuleDir.replace(process.cwd(), ''),
                },
              });
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

    // Skip node_modules and build output
    if (filename.includes('node_modules') || filename.includes('/dist/')) {
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
 * - Shared directory (../../Shared/Component)
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
        '  ✅ Shared directory: ../../Shared/Component\n' +
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

    // Skip node_modules and build output
    if (filename.includes('node_modules') || filename.includes('/dist/')) {
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
        // Pattern: ./types, ../types, ../../App/types, etc.
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

    // Skip node_modules and build output
    if (filename.includes('node_modules') || filename.includes('/dist/')) {
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

            // Skip Type/Interface exports - we only care about component exports
            // Types don't need to match folder names
          }
        }

        if (exports.length === 0) return;

        // Build expected names
        const expectedNames = [
          folderName,
          `Memo${folderName}`,
          `Memoized${folderName}`,
        ];

        // If in Shared directory, also allow Shared_ prefix
        if (isInSharedDir(filename)) {
          expectedNames.push(`Shared_${folderName}`);
          expectedNames.push(`MemoShared_${folderName}`);
          expectedNames.push(`MemoizedShared_${folderName}`);
        }

        // Check if any export matches
        const hasMatch = exports.some(exp =>
          expectedNames.includes(exp)
        );

        if (!hasMatch) {
          // Filter to only PascalCase exports for the error message
          const pascalCaseExports = exports.filter(exp => /^[A-Z]/.test(exp));

          context.report({
            node,
            messageId: 'mismatch',
            data: {
              folderName,
              actualExports: pascalCaseExports.length > 0
                ? pascalCaseExports.join(', ')
                : '(none)',
              expectedNames: expectedNames.slice(0, 3).join(', '),
            },
          });
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
      },
    },
  },
};
