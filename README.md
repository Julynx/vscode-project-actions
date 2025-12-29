# Project Actions

Display project-specific action buttons on the status bar that run custom commands when clicked.

## Features

- **Custom Status Bar Buttons**: Add project-specific buttons to your VS Code status bar
- **Command Execution**: Click buttons to execute shell commands in the integrated terminal
- **Project-Specific Configuration**: Each project can have its own set of actions
- **Auto-Reload**: Automatically reloads when the configuration file changes
- **Customizable**: Configure button text, commands, tooltips, and colors

## Usage

### Basic Setup

1. Create a `.project-actions.json` file in the root of your project
2. Define your actions in the following format:

```json
{
  "actions": [
    {
      "text": "$(play) Run",
      "command": "npm start",
      "tooltip": "Start the development server"
    },
    {
      "text": "$(testing-run-icon) Test",
      "command": "npm test",
      "tooltip": "Run all tests",
      "color": "#00ff00"
    },
    {
      "text": "$(package) Build",
      "command": "npm run build",
      "tooltip": "Build for production"
    }
  ]
}
```

3. The buttons will automatically appear in your status bar

### Configuration Options

Each action button can have the following properties:

- **text** (required): The text displayed on the button
  - Can include [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) using `$(icon-name)` syntax
- **command** (required): The shell command to execute when clicked
- **tooltip** (optional): Hover text for the button (defaults to the command)
- **color** (optional): Text color for the button (CSS color value)

### Extension Settings

This extension contributes the following settings:

- `project-actions.configFileName`: Name of the configuration file (default: `.project-actions.json`)

### Commands

- `Project Actions: Reload Configuration`: Manually reload the configuration file

## Examples

### Web Development Project

```json
{
  "actions": [
    {
      "text": "$(rocket) Dev Server",
      "command": "npm run dev",
      "tooltip": "Start development server"
    },
    {
      "text": "$(beaker) Test",
      "command": "npm test",
      "tooltip": "Run tests with coverage"
    },
    {
      "text": "$(package) Build",
      "command": "npm run build",
      "tooltip": "Build for production"
    },
    {
      "text": "$(code-review) Lint",
      "command": "npm run lint",
      "tooltip": "Run ESLint"
    }
  ]
}
```

### Python Project

```json
{
  "actions": [
    {
      "text": "$(play) Run",
      "command": "uv run main.py",
      "tooltip": "Run main script"
    },
    {
      "text": "$(testing-run-icon) Test",
      "command": "uv run pytest",
      "tooltip": "Run pytest"
    },
    {
      "text": "$(code-review) Format",
      "command": "uv run black . && uv run pylint .",
      "tooltip": "Format code and run linter"
    }
  ]
}
```

### Docker Project

```json
{
  "actions": [
    {
      "text": "$(vm-running) Up",
      "command": "docker-compose up -d",
      "tooltip": "Start containers",
      "color": "#00ff00"
    },
    {
      "text": "$(debug-stop) Down",
      "command": "docker-compose down",
      "tooltip": "Stop containers",
      "color": "#ff0000"
    },
    {
      "text": "$(output) Logs",
      "command": "docker-compose logs -f",
      "tooltip": "View container logs"
    }
  ]
}
```

## Tips

- Use [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) to make your buttons visually distinct
- The configuration file is watched for changes, so edits take effect immediately
- Commands are executed in the VS Code integrated terminal
- You can use shell operators like `&&` to chain multiple commands
- Buttons appear from left to right in the order they're defined

## Requirements

- VS Code 1.85.0 or higher

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/julynx/vscode-project-actions).

## Issues

Found a bug or have a feature request? Please open an issue on the [GitHub issue tracker](https://github.com/julynx/vscode-project-actions/issues).
