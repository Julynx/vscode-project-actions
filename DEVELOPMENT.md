# Development Guide

This guide will help you build, test, and package the Project Actions VS Code extension.

## Prerequisites

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Visual Studio Code** (v1.85.0 or later) - [Download](https://code.visualstudio.com/)
- **Git** (optional, for version control) - [Download](https://git-scm.com/)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- TypeScript
- VS Code extension API types
- ESLint and TypeScript ESLint
- Other development tools

### 2. Compile the Extension

```bash
npm run compile
```

This compiles the TypeScript code in `src/` to JavaScript in `out/`.

### 3. Run the Extension in Development Mode

There are two ways to run the extension:

#### Option A: Using VS Code Debug

1. Open the project in VS Code
2. Press `F5` or go to Run > Start Debugging
3. A new VS Code window will open with the extension loaded
4. Create a `.project-actions.json` file in any project to test

#### Option B: Using Command Line

```bash
code --extensionDevelopmentPath=.
```

## Development Workflow

### Watch Mode

For active development, use watch mode to automatically recompile on file changes:

```bash
npm run watch
```

Keep this running in a terminal while you develop. Changes will be compiled automatically.

### Linting

Check for code style and potential errors:

```bash
npm run lint
```

Fix automatically fixable issues:

```bash
npx eslint src --ext ts --fix
```

### Testing Changes

1. Make changes to the code
2. If watch mode is running, changes compile automatically
3. Press `Ctrl+R` (or `Cmd+R` on Mac) in the Extension Development Host window to reload the extension
4. Test your changes

## Project Structure

```
project-actions/
├── src/
│   └── extension.ts          # Main extension code
├── out/                       # Compiled JavaScript (generated)
├── examples/                  # Example configuration files
├── .vscode/
│   ├── launch.json           # Debug configuration
│   ├── tasks.json            # Build tasks
│   └── extensions.json       # Recommended extensions
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
├── .eslintrc.json            # ESLint configuration
└── README.md                 # User documentation
```

## Building for Distribution

### Create a VSIX Package

Install the VS Code Extension Manager (vsce) if you haven't already:

```bash
npm install -g @vscode/vsce
```

Build the package:

```bash
vsce package
```

This creates a `.vsix` file (e.g., `project-actions-1.0.0.vsix`) that can be:
- Installed locally
- Shared with others
- Published to the VS Code Marketplace

### Install the VSIX Locally

1. In VS Code, go to Extensions (Ctrl+Shift+X)
2. Click the `...` menu at the top
3. Select "Install from VSIX..."
4. Choose your `.vsix` file

## Publishing to VS Code Marketplace

### Prerequisites

1. Create a [Visual Studio Marketplace publisher account](https://marketplace.visualstudio.com/manage)
2. Get a Personal Access Token from [Azure DevOps](https://dev.azure.com/)

### Publish

Login with your publisher:

```bash
vsce login your-publisher-name
```

Publish the extension:

```bash
vsce publish
```

Or publish a specific version:

```bash
vsce publish minor  # Increments minor version
vsce publish patch  # Increments patch version
vsce publish major  # Increments major version
```

## Extension Configuration

The extension reads configuration from:
- **User setting**: `project-actions.configFileName` (default: `.project-actions.json`)
- **Config file**: `.project-actions.json` in workspace root

### Example Configuration

```json
{
  "actions": [
    {
      "text": "$(play) Run",
      "command": "npm start",
      "tooltip": "Start the application",
      "color": "#00ff00"
    }
  ]
}
```

## Debugging

### Console Logs

View extension logs in the Debug Console:
1. Open the Extension Development Host
2. Go to View > Debug Console in the main VS Code window

### Breakpoints

1. Set breakpoints in `src/extension.ts`
2. Press `F5` to start debugging
3. Breakpoints will be hit in the main VS Code window

## Common Issues

### Extension Not Loading

- Check the Debug Console for errors
- Ensure TypeScript compiled successfully
- Verify `out/extension.js` was created

### Changes Not Reflecting

- Press `Ctrl+R` in the Extension Development Host to reload
- Restart the debugging session if needed
- Check that watch mode is running and compiling changes

### Configuration Not Loading

- Verify `.project-actions.json` is in the workspace root
- Check JSON syntax (use VS Code's JSON validation)
- Look for errors in the Debug Console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Codicons Reference](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
