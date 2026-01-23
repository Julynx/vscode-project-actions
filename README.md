# Project Actions

Add custom action buttons to your VS Code status bar that execute shell commands with a single click.

![Project Actions Screenshot](assets/screenshot.png)

## Table of Contents

- [Project Actions](#project-actions)
  - [Quick Start](#quick-start)
    - [Action Syntax](#action-syntax)
    - [Command Variables](#command-variables)
  - [Global Actions](#global-actions)
  - [Active File Actions](#active-file-actions)

## Quick Start

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run **"Project Actions: Edit Project Actions"**
3. Configure your actions in the generated [`.project-actions.json`](.project-actions.json) file

**Example:**

```json
{
  "actions": [
    {
      "text": "$(play) Run",
      "command": "npm start",
      "tooltip": "Start development server"
    },
    {
      "text": "$(beaker) Test",
      "command": "npm test",
      "tooltip": "Run tests"
    }
  ]
}
```

Buttons appear automatically on the status bar and update on file save.

### Action Syntax

Each action requires:

- **`text`**: Button label (supports [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) like `$(play)`)
- **`command`**: Shell command to execute
- **`tooltip`** *(optional)*: Hover text
- **`color`** *(optional)*: Text color (CSS format)

### Command Variables

Use VS Code variables for dynamic commands:

- `${file}` - Current file path
- `${fileBasename}` - Current filename
- `${fileDirname}` - Current file's directory
- `${workspaceFolder}` - Workspace root path
- `${relativeFile}` - File path relative to workspace

**Example:**

```json
{
  "text": "$(play) Run File",
  "command": "python ${file}",
  "tooltip": "Run current Python file"
}
```

[See all variables](https://code.visualstudio.com/docs/editor/variables-reference)

## Global Actions

Define actions in VS Code settings that appear based on file patterns:

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run **"Project Actions: Edit Global Actions"**
3. Add global actions as follows:

```json
{
  "project-actions.globalActions": [
    {
      "text": "$(repo-pull) Pull",
      "command": "git pull",
      "glob": "**/.git",
      "tooltip": "Pull latest changes"
    }
  ]
}
```

Global actions appear when the `glob` pattern matches files in your workspace (e.g., `**/.git` shows the action in Git repositories).

## Active File Actions

Define actions in VS Code settings that appear based on the currently active file:

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run **"Project Actions: Edit Active File Actions"**
3. Add active file actions as follows:

```json
{
  "project-actions.activeFileActions": [
    {
      "text": "$(python) Run Python",
      "command": "python ${file}",
      "glob": "**/*.py",
      "tooltip": "Run current Python file"
    }
  ]
}
```

Active file actions appear when the `glob` pattern matches the currently open file (e.g., `**/*.py` shows the action only when editing Python files).

## Settings

- `project-actions.configFileName`: Config file name (default: `.project-actions.json`)
- `project-actions.globalActions`: Global actions with glob patterns
- `project-actions.activeFileActions`: Active file actions with glob patterns

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/julynx/vscode-project-actions).

## Issues

Found a bug or have a feature request? Please open an issue on the [GitHub issue tracker](https://github.com/julynx/vscode-project-actions/issues).
