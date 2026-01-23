# Changelog

## [1.2.0] - 2026-01-23

### Added
- Support for "Active File Actions": Define actions that only appear when the active file matches a specific glob pattern (e.g., `**/*.ts`).
- New command `project-actions.editActiveFileActions` to easily edit active file actions.

### Changed
- Optimized extension size and startup time by bundling with `esbuild`.
- Updated `.vscodeignore` to exclude unnecessary files from the package.
- Updated build scripts to support bundling and watching.
- Updated `.project-actions.json` with new build commands.

## [1.1.1] - 2026-01-22

### Changed
- Made `glob` property optional for global actions - actions without a glob pattern are now always shown

## [1.1.0] - 2026-01-22

### Added
- Variable substitution in commands (`${file}`, `${workspaceFolder}`, etc.)
- Global actions with glob pattern matching via settings
- Command Palette support: "Edit Project Actions" and "Edit Global Actions"
- JSON Schema validation with IntelliSense and autocomplete
- Automatic config template creation

### Changed
- Global actions merge with local actions on status bar
- Hidden files (like `.git`) now matchable via glob patterns

## [1.0.0] - 2025-12-29

### Added
- Custom status bar buttons for project-specific commands
- Configuration via `.project-actions.json`
- Auto-reload on config file changes
- Codicons, tooltips, and custom colors support
