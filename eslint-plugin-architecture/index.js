/**
 * Custom ESLint Plugin: Architecture Rules
 *
 * Enforces strict architectural patterns for React/TypeScript components.
 */

import path from 'path';
import { ESLintUtils } from '@typescript-eslint/utils';

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
const isInSharedDir = (filePath) => {
  return filePath && filePath.includes('/src/Shared/');
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

// Track shared component imports across all files for shared-must-be-multi-imported rule
const sharedComponentImports = new Map(); // componentName -> Set of importing file paths

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

          // Track each imported component
          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') continue;

            const importedName = specifier.imported.name;

            // Only track component imports (PascalCase)
            if (!/^[A-Z]/.test(importedName)) continue;

            // Add this file to the set of files importing this component
            if (!sharedComponentImports.has(importedName)) {
              sharedComponentImports.set(importedName, new Set());
            }
            sharedComponentImports.get(importedName).add(filename);
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

        // Check how many files import this component
        const importingFiles = sharedComponentImports.get(componentName);
        const importCount = importingFiles ? importingFiles.size : 0;

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

// Export the plugin
export default {
  meta: {
    name: 'eslint-plugin-architecture',
    version: '1.0.0',
  },
  rules: {
    'named-exports-only': namedExportsOnly,
    'no-reexports': noReexports,
    'import-from-index': importFromIndex,
    'shared-must-be-multi-imported': sharedMustBeMultiImported,
    'index-only-files': indexOnlyFiles,
  },
  configs: {
    recommended: {
      plugins: ['architecture'],
      rules: {
        'architecture/named-exports-only': 'error',
        'architecture/no-reexports': 'error',
        'architecture/import-from-index': 'error',
        'architecture/shared-must-be-multi-imported': 'error',
        'architecture/index-only-files': 'error',
      },
    },
  },
};
