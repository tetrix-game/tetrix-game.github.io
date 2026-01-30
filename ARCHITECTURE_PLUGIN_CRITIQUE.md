# Critique of ESLint Architecture Plugin v2.0.0

This critique evaluates how the current `index.js` and `DependencyGraphManager.js` align with the "Highly Constrained Architecture" requirements.

---

## 1. Single Declaration Constraint
**Requirement:** ONLY ONE declaration per file.
* **The Failure:** The current plugin lacks a rule to count declarations. While `no-separate-export-declarations` ensures exports are inline, it does not prevent a developer from having multiple `export const ...` or `export function ...` statements in a single `index.tsx`.
* **Impact:** This breaks the 1:1 mapping between folders and components, allowing "mega-files" to exist within the `index.tsx` structure.

## 2. Strict 1:1:1 Naming Identity
**Requirement:** Declaration name === Exported name === Folder name.
* **The Failure:** `folderExportMustMatch` is too permissive. It currently allows variations like `Memo${folderName}` or `Memoized${folderName}`.
* **The Failure:** The rule checks if *any* export matches the folder name, but it does not forbid *additional* exports that don't match. 
* **Impact:** A folder named `Header` could export `Header`, `HeaderIcon`, and `HeaderStyles` without triggering an error, violating the "Single Declaration" and "Strict Identity" paradigms.

## 3. Component Hierarchy & Locality
**Requirement:** Single-use components must be child paths (e.g., `App/index.tsx` -> `App/Header/index.tsx`).
* **The Failure:** `import-from-sibling-directory-or-shared` currently validates that single-use modules are **siblings** (`./Name`). 
* **The Failure:** While "sibling" in an import path (`./Header`) often implies a child directory in this architecture, the rule does not explicitly enforce that the component is a *descendant* in the file system tree relative to the caller.
* **Impact:** It ensures "closeness" but doesn't strictly enforce the "Parent-to-Child" ownership model required for the hierarchy.

## 4. Multi-Use LCA & "Shared" Enforcement
**Requirement:** Multi-use components MUST be in the LCA path within a `Shared` directory with a `Shared_` prefix.
* **The Failure:** The `DependencyGraphManager` correctly calculates the LCA, but the ESLint rule only checks if the module is a direct child of the LCA.
* **The Failure:** It does not mandate that the parent folder *must* be named `Shared`.
* **The Failure:** The `shared-exports-must-be-prefixed` rule only triggers if the file path *already* contains `src/main/Shared`. It does not force a component to move *into* a Shared folder if it becomes multi-use; it only complains once it is already there.
* **Impact:** Components used in two places could exist anywhere in the tree as long as they are at the LCA, failing to force the `Shared/Shared_Name` directory structure.

## 5. Re-export and Import Discipline
**Requirement:** No re-exports EVER.
* **Status:** **Pass.** The `no-reexports` rule comprehensively handles `ExportNamedDeclaration` with a source and `ExportAllDeclaration`.
* **Requirement:** Export must be a combination declaration/export statement.
* **Status:** **Pass.** The `no-separate-export-declarations` rule effectively enforces the AST requirement that exports must be inline with declarations.

---

## Summary of Structural Gaps

| Feature | Current Implementation Status | Logic Required |
| :--- | :--- | :--- |
| **Declaration Count** | ❌ Not Checked | `Program.body.filter(isExport).length === 1` |
| **Strict Naming** | ⚠️ Too Permissive | Remove `Memo` logic; enforce `exportName === folderName` exactly. |
| **Ownership** | ⚠️ Siblings only | Verify imported path is a sub-directory of the current file. |
| **Forced Shared** | ❌ Path agnostic | If `count > 1`, path MUST contain `/Shared/Shared_.../` |

### Next Step
Would you like me to rewrite the `folderExportMustMatch` and `indexOnlyFiles` rules to strictly enforce the **Single Declaration** and **Exact Name Identity** constraints?
