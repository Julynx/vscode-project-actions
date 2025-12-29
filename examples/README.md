# Example Project Actions Configurations

This directory contains example `.project-actions.json` configuration files for various project types.

## Available Examples

### Web Development (`web-development.json`)
Configuration for typical web development projects with npm scripts.
- Dev server
- Testing
- Building
- Linting
- Formatting

### Python Project (`python-project.json`)
Configuration for Python projects using `uv` package manager.
- Running scripts
- Testing with pytest
- Code formatting with Black
- Linting with pylint
- Type checking with mypy

### Docker Project (`docker-project.json`)
Configuration for projects using Docker Compose.
- Starting containers
- Stopping containers
- Viewing logs
- Restarting services
- Listing containers

### Git Workflow (`git-workflow.json`)
Quick git commands for common workflows.
- Checking status
- Viewing diffs
- Staging changes
- Committing
- Pushing to remote

## Usage

1. Choose an example that matches your project type
2. Copy it to your project root as `.project-actions.json`
3. Customize the actions to fit your specific needs
4. The extension will automatically load the configuration

## Customization Tips

- Add or remove actions based on your workflow
- Use [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) for icons
- Set custom colors to differentiate action types
- Add helpful tooltips to explain what each action does
- Chain multiple commands using `&&`

## Creating Your Own

Create a `.project-actions.json` file with this structure:

```json
{
  "actions": [
    {
      "text": "$(icon-name) Button Text",
      "command": "your-command-here",
      "tooltip": "Description of what this does",
      "color": "#optional-color"
    }
  ]
}
```

All fields except `color` are required. The `tooltip` field defaults to the command if not specified.
