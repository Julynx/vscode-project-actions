# Quick Start Guide

Get the Project Actions extension running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Compile the Extension

```bash
npm run compile
```

## Step 3: Test the Extension

Press `F5` in VS Code to launch the Extension Development Host.

## Step 4: Try It Out

In the Extension Development Host window:

1. Open any folder/workspace
2. Create a file named `.project-actions.json` in the root
3. Add this content:

```json
{
  "actions": [
    {
      "text": "$(play) Hello",
      "command": "echo Hello from Project Actions!",
      "tooltip": "Say hello"
    },
    {
      "text": "$(folder) List Files",
      "command": "dir",
      "tooltip": "List directory contents"
    }
  ]
}
```

4. Save the file
5. Look at your status bar (bottom of VS Code)
6. You should see two new buttons!
7. Click them to run the commands

## Step 5: Customize

Edit `.project-actions.json` to add your own commands. Changes are applied automatically!

## Next Steps

- Read [README.md](README.md) for detailed usage instructions
- Check [examples/](examples/) for real-world configurations
- See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow

## Building a VSIX Package

```bash
npm install -g @vscode/vsce
vsce package
```

This creates a `.vsix` file you can install or share.

## Troubleshooting

### Buttons Not Showing?

- Check Debug Console for errors (View > Debug Console)
- Verify `.project-actions.json` has valid JSON syntax
- Make sure the file is in the workspace root

### Changes Not Updating?

- The file watcher updates automatically
- If stuck, use Command Palette: "Project Actions: Reload Configuration"

### Extension Not Loading?

- Check that compilation succeeded (`out/extension.js` exists)
- Look for TypeScript errors in the terminal
- Restart the Extension Development Host (Ctrl+R)

## Need Help?

- Open an issue: https://github.com/julynx/vscode-project-actions/issues
- Check existing issues for solutions
- Read the full documentation in README.md
