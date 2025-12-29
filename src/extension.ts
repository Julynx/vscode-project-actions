import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ActionButton {
    text: string;
    command: string;
    tooltip?: string;
    color?: string;
}

interface ProjectActionsConfig {
    actions: ActionButton[];
}

let statusBarItems: vscode.StatusBarItem[] = [];
let fileWatcher: vscode.FileSystemWatcher | undefined;

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Project Actions extension is now active');

    // Register reload command
    const reloadCommand = vscode.commands.registerCommand(
        'project-actions.reload',
        () => {
            loadProjectActions(context);
            vscode.window.showInformationMessage('Project Actions reloaded');
        }
    );

    context.subscriptions.push(reloadCommand);

    // Load actions on activation
    loadProjectActions(context);

    // Watch for changes to the configuration file
    setupFileWatcher(context);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
    disposeStatusBarItems();
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}

/**
 * Sets up a file watcher for the configuration file
 */
function setupFileWatcher(context: vscode.ExtensionContext): void {
    const configFileName = getConfigFileName();
    
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    // Create file watcher pattern
    const pattern = new vscode.RelativePattern(workspaceRoot, configFileName);
    fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Reload on file changes
    fileWatcher.onDidChange(() => {
        console.log('Configuration file changed, reloading...');
        loadProjectActions(context);
    });

    fileWatcher.onDidCreate(() => {
        console.log('Configuration file created, reloading...');
        loadProjectActions(context);
    });

    fileWatcher.onDidDelete(() => {
        console.log('Configuration file deleted, clearing actions...');
        disposeStatusBarItems();
    });

    context.subscriptions.push(fileWatcher);
}

/**
 * Gets the configuration file name from settings
 */
function getConfigFileName(): string {
    const config = vscode.workspace.getConfiguration('project-actions');
    return config.get<string>('configFileName', '.project-actions.json');
}

/**
 * Loads and displays project actions from configuration file
 */
function loadProjectActions(context: vscode.ExtensionContext): void {
    // Clear existing status bar items
    disposeStatusBarItems();

    // Check if workspace is open
    if (!vscode.workspace.workspaceFolders) {
        console.log('No workspace folder open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const configFileName = getConfigFileName();
    const configPath = path.join(workspaceRoot, configFileName);

    // Check if configuration file exists
    if (!fs.existsSync(configPath)) {
        console.log(`Configuration file not found: ${configPath}`);
        return;
    }

    try {
        // Read and parse configuration file
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config: ProjectActionsConfig = JSON.parse(configContent);

        if (!config.actions || !Array.isArray(config.actions)) {
            vscode.window.showErrorMessage(
                'Invalid configuration: "actions" array not found'
            );
            return;
        }

        // Create status bar items for each action
        config.actions.forEach((action, index) => {
            if (!action.text || !action.command) {
                console.warn(`Skipping action at index ${index}: missing text or command`);
                return;
            }

            const statusBarItem = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Left,
                1000 - index // Priority decreases for each button
            );

            statusBarItem.text = action.text;
            statusBarItem.tooltip = action.tooltip || action.command;
            
            if (action.color) {
                statusBarItem.color = action.color;
            }

            // Create a unique command ID for this action
            const commandId = `project-actions.action-${index}`;
            
            // Register the command
            const disposable = vscode.commands.registerCommand(commandId, () => {
                executeAction(action.command);
            });

            context.subscriptions.push(disposable);

            // Assign the command to the status bar item
            statusBarItem.command = commandId;
            statusBarItem.show();

            statusBarItems.push(statusBarItem);
        });

        console.log(`Loaded ${statusBarItems.length} action(s) from ${configFileName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
            `Failed to load project actions: ${errorMessage}`
        );
        console.error('Error loading project actions:', error);
    }
}

/**
 * Executes a shell command in the integrated terminal
 */
function executeAction(command: string): void {
    // Create a new terminal for each action to keep them separate
    const terminal = vscode.window.createTerminal('Project Actions');
    terminal.show();
    terminal.sendText(command);
}

/**
 * Disposes all status bar items
 */
function disposeStatusBarItems(): void {
    statusBarItems.forEach(item => item.dispose());
    statusBarItems = [];
}
