# Change Log

All notable changes to the "project-actions" extension will be documented in this file.

## [1.0.0] - 2025-12-29

### Added
- Initial release of Project Actions extension
- Display custom action buttons on the status bar
- Execute shell commands when buttons are clicked
- Project-specific configuration via `.project-actions.json`
- Auto-reload when configuration file changes
- Support for custom button text with Codicons
- Support for custom tooltips
- Support for custom button colors
- Manual reload command: "Project Actions: Reload Configuration"
- Configurable config file name via settings
- Comprehensive documentation and examples

### Features
- Reads configuration from `.project-actions.json` in project root
- Creates status bar buttons for each defined action
- Executes commands in VS Code integrated terminal
- File system watcher for automatic configuration reload
- Proper error handling and user feedback
- TypeScript implementation with strict mode
- Clean disposal of resources on deactivation
