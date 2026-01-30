/**
 * DependencyGraphManager
 *
 * Centralized manager for tracking import dependencies, calculating LCAs,
 * and detecting circular dependencies across the codebase.
 *
 * Performance Features:
 * - Absolute path-based tracking prevents duplicate tracking
 * - Memoization caches for path resolution and LCA calculation
 * - O(1) lookup for import counts and locations
 * - O(V + E) cycle detection with early exit
 */

import path from 'path';

class DependencyGraphManager {
  constructor() {
    // Import tracking: resolved path -> Set of importing files
    this.importGraph = new Map();

    // Shared component tracking: component name -> Set of importing files
    this.sharedImports = new Map();

    // Export registry: file path -> Set of exported names
    this.exportRegistry = new Map();

    // Track which files have been processed
    this.fileProcessed = new Set();

    // Memoization caches
    this.pathResolutionCache = new Map();
    this.lcaCache = new Map();

    // Circular dependency detection
    // Maps: file path -> Set of dependencies (files it imports)
    this.dependencyEdges = new Map();

    // DFS tracking
    this.visitedInCycle = new Set();
    this.recursionStack = new Set();
  }

  /**
   * Resolve a relative import to an absolute path with memoization
   * @param {string} importingFile - Absolute path of the importing file
   * @param {string} importPath - Relative import path (e.g., '../Header')
   * @returns {string|null} - Absolute path to the imported module, or null if external
   */
  resolvePath(importingFile, importPath) {
    // Skip external modules
    if (!importPath.startsWith('.')) {
      return null;
    }

    // Create cache key
    const cacheKey = `${importingFile}::${importPath}`;

    // Check cache
    if (this.pathResolutionCache.has(cacheKey)) {
      return this.pathResolutionCache.get(cacheKey);
    }

    // Resolve the path
    const importingDir = path.dirname(importingFile);
    const resolved = path.resolve(importingDir, importPath);

    // Normalize to absolute path
    const normalized = path.normalize(resolved);

    // Cache and return
    this.pathResolutionCache.set(cacheKey, normalized);
    return normalized;
  }

  /**
   * Calculate Least Common Ancestor directory with memoization
   * @param {string[]} filePaths - Array of absolute file paths
   * @returns {string|null} - LCA directory path
   */
  calculateLCA(filePaths) {
    if (filePaths.length === 0) return null;
    if (filePaths.length === 1) return path.dirname(filePaths[0]);

    // Create sorted cache key (order shouldn't matter)
    const sortedPaths = [...filePaths].sort();
    const cacheKey = sortedPaths.join('||');

    // Check cache
    if (this.lcaCache.has(cacheKey)) {
      return this.lcaCache.get(cacheKey);
    }

    // Split all paths into segments
    const pathSegments = filePaths.map(p => p.split(path.sep));

    // Find common prefix
    const firstPath = pathSegments[0];
    const lcaSegments = [];

    for (let i = 0; i < firstPath.length; i++) {
      const segment = firstPath[i];
      const allMatch = pathSegments.every(p => p[i] === segment);

      if (!allMatch) break;
      lcaSegments.push(segment);
    }

    const lca = lcaSegments.join(path.sep) || path.sep;

    // Cache and return
    this.lcaCache.set(cacheKey, lca);
    return lca;
  }

  /**
   * Track an import relationship
   * @param {string} importingFile - Absolute path of the importing file
   * @param {string} resolvedPath - Absolute path of the imported module
   */
  trackImport(importingFile, resolvedPath) {
    if (!this.importGraph.has(resolvedPath)) {
      this.importGraph.set(resolvedPath, new Set());
    }
    this.importGraph.get(resolvedPath).add(importingFile);
    this.fileProcessed.add(importingFile);
  }

  /**
   * Track a shared component import
   * @param {string} componentName - Name of the shared component
   * @param {string} importingFile - Absolute path of the importing file
   */
  trackSharedImport(componentName, importingFile) {
    if (!this.sharedImports.has(componentName)) {
      this.sharedImports.set(componentName, new Set());
    }
    this.sharedImports.get(componentName).add(importingFile);
  }

  /**
   * Get import information for a module
   * @param {string} resolvedPath - Absolute path of the module
   * @returns {{count: number, files: Set<string>}} Import count and importing files
   */
  getImportInfo(resolvedPath) {
    const files = this.importGraph.get(resolvedPath);
    return {
      count: files ? files.size : 0,
      files: files || new Set(),
    };
  }

  /**
   * Get shared import information for a component
   * @param {string} componentName - Name of the shared component
   * @returns {{count: number, files: Set<string>}} Import count and importing files
   */
  getSharedImportInfo(componentName) {
    const files = this.sharedImports.get(componentName);
    return {
      count: files ? files.size : 0,
      files: files || new Set(),
    };
  }

  /**
   * Add a dependency edge and check for circular dependencies
   * @param {string} fromFile - Absolute path of the importing file
   * @param {string} toFile - Absolute path of the imported file
   * @returns {{hasCycle: boolean, cyclePath: string[]}} Result with cycle information
   */
  addDependencyEdge(fromFile, toFile) {
    // Initialize edge set if needed
    if (!this.dependencyEdges.has(fromFile)) {
      this.dependencyEdges.set(fromFile, new Set());
    }

    // Check if this edge would create a cycle
    const cycleResult = this.detectCycle(fromFile, toFile);

    // Add the edge regardless (we just report the cycle)
    this.dependencyEdges.get(fromFile).add(toFile);

    return cycleResult;
  }

  /**
   * Detect if adding an edge would create a circular dependency
   * Uses DFS to check if there's a path from toFile back to fromFile
   * @param {string} fromFile - Source file
   * @param {string} toFile - Target file
   * @returns {{hasCycle: boolean, cyclePath: string[]}} Cycle detection result
   */
  detectCycle(fromFile, toFile) {
    // Reset DFS state
    this.visitedInCycle.clear();
    this.recursionStack.clear();

    // Check if adding fromFile -> toFile would create a cycle
    // This means checking if there's a path from toFile back to fromFile
    const cyclePath = this.dfsCycleDetection(toFile, fromFile, [toFile]);

    if (cyclePath) {
      return {
        hasCycle: true,
        cyclePath: [...cyclePath, fromFile],
      };
    }

    return {
      hasCycle: false,
      cyclePath: [],
    };
  }

  /**
   * DFS helper for cycle detection
   * @param {string} current - Current node in DFS
   * @param {string} target - Target node we're looking for
   * @param {string[]} path - Current path taken
   * @returns {string[]|null} - Path if cycle found, null otherwise
   */
  dfsCycleDetection(current, target, path) {
    // Found a cycle!
    if (current === target) {
      return path;
    }

    // Already visited this node in a previous search
    if (this.visitedInCycle.has(current)) {
      return null;
    }

    // Mark as visited
    this.visitedInCycle.add(current);

    // Get all dependencies of current node
    const dependencies = this.dependencyEdges.get(current);
    if (!dependencies) {
      return null;
    }

    // Explore each dependency
    for (const dep of dependencies) {
      const result = this.dfsCycleDetection(dep, target, [...path, dep]);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Format a cycle path for error messages
   * @param {string[]} cyclePath - Array of file paths forming a cycle
   * @param {string} cwd - Current working directory for relative paths
   * @returns {string} - Formatted cycle path
   */
  formatCyclePath(cyclePath, cwd = process.cwd()) {
    const relativePaths = cyclePath.map(p => p.replace(cwd, '').replace(/^\//, ''));
    return relativePaths.join(' → ');
  }

  /**
   * Reset all state (call after lint run completes)
   */
  reset() {
    this.importGraph.clear();
    this.sharedImports.clear();
    this.exportRegistry.clear();
    this.fileProcessed.clear();
    this.pathResolutionCache.clear();
    this.lcaCache.clear();
    this.dependencyEdges.clear();
    this.visitedInCycle.clear();
    this.recursionStack.clear();
  }

  /**
   * Get statistics about the current state (useful for debugging)
   */
  getStats() {
    return {
      trackedImports: this.importGraph.size,
      trackedSharedImports: this.sharedImports.size,
      filesProcessed: this.fileProcessed.size,
      pathCacheSize: this.pathResolutionCache.size,
      lcaCacheSize: this.lcaCache.size,
      dependencyEdges: this.dependencyEdges.size,
    };
  }
}

// Export singleton instance
export const graphManager = new DependencyGraphManager();
