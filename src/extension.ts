import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import JSON5 from 'json5';

interface ActionButton {
    text: string;
    command: string;
    tooltip?: string;
    color?: string;
}

interface GlobalActionButton extends ActionButton {
    glob?: string;
}

interface ProjectActionsConfig {
    actions: ActionButton[];
}

let statusBarItems: vscode.StatusBarItem[] = [];
let commandDisposables: vscode.Disposable[] = [];
let fileWatcher: vscode.FileSystemWatcher | undefined;

export function activate(context: vscode.ExtensionContext): void {
    console.log('Project Actions extension is now active');

    context.subscriptions.push(
        vscode.commands.registerCommand('project-actions.reload', () => {
            reloadActions();
            vscode.window.showInformationMessage('Project Actions reloaded');
        }),
        vscode.commands.registerCommand('project-actions.editProjectActions', async () => {
            await openProjectConfigFile();
        }),
        vscode.commands.registerCommand('project-actions.editGlobalActions', async () => {
            await openGlobalSettings();
        }),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('project-actions.globalActions')) {
                console.log('Global actions configuration changed, reloading...');
                reloadActions();
            }
        })
    );

    setupFileWatcher(context);
    reloadActions();
}

export function deactivate(): void {
    disposeStatusBarItems();
    disposeCommandDisposables();
    fileWatcher?.dispose();
}

/**
 * Sets up file system watcher to automatically reload when the local configuration file changes.
 * Watches for create, change, and delete events on the project-specific config file.
 */
function setupFileWatcher(context: vscode.ExtensionContext): void {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const configFileName = getConfigFileName();
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const pattern = new vscode.RelativePattern(workspaceRoot, configFileName);
    
    fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    
    fileWatcher.onDidChange(() => reloadActions());
    fileWatcher.onDidCreate(() => reloadActions());
    fileWatcher.onDidDelete(() => {
        console.log('Configuration file deleted, clearing actions...');
        disposeStatusBarItems();
    });

    context.subscriptions.push(fileWatcher);
}

function getConfigFileName(): string {
    const config = vscode.workspace.getConfiguration('project-actions');
    return config.get<string>('configFileName', '.project-actions.json');
}

/**
 * Opens the project-specific configuration file in the editor.
 * If the file doesn't exist, creates it with a template and opens it.
 */
async function openProjectConfigFile(): Promise<void> {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const configFileName = getConfigFileName();
    const configPath = path.join(workspaceRoot, configFileName);

    // Create the file with a template if it doesn't exist
    if (!fs.existsSync(configPath)) {
        const template = {
            actions: [
                {
                    text: "$(play) Run",
                    command: "npm start",
                    tooltip: "Start the development server"
                },
                {
                    text: "$(testing-run-icon) Test",
                    command: "npm test",
                    tooltip: "Run tests"
                }
            ]
        };

        try {
            fs.writeFileSync(configPath, JSON.stringify(template, null, 2), 'utf8');
            console.log(`Created new configuration file: ${configPath}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to create configuration file: ${errorMessage}`);
            return;
        }
    }

    // Open the file in the editor
    try {
        const document = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to open configuration file: ${errorMessage}`);
    }
}

/**
 * Opens the VS Code settings UI focused on the global actions configuration.
 */
async function openGlobalSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'project-actions.globalActions');
}

/**
 * Checks if a glob pattern matches any files/folders in the workspace.
 * Uses Node's glob package directly to bypass VSCode's file.exclude settings,
 * allowing patterns like "**\/.git" to match even though .git is typically excluded.
 */
async function matchesGlobPattern(workspaceRoot: string, globPattern: string): Promise<boolean> {
    try {
        const matches = await glob.glob(globPattern, {
            cwd: workspaceRoot,
            dot: true,
            nodir: false,
            absolute: false,
            withFileTypes: false
        });
        
        return matches.length > 0;
    } catch (error) {
        console.error(`Error matching glob pattern '${globPattern}':`, error);
        return false;
    }
}

/**
 * Retrieves global actions from settings and filters them based on glob pattern matching.
 * Returns only actions whose glob patterns match at least one file/folder in the workspace.
 */
async function getMatchingGlobalActions(workspaceRoot: string): Promise<ActionButton[]> {
    const config = vscode.workspace.getConfiguration('project-actions');
    const globalActions = config.get<GlobalActionButton[]>('globalActions', []);
    
    const matchingActions: ActionButton[] = [];
    
    for (const action of globalActions) {
        if (!isValidAction(action)) {
            console.warn('Skipping invalid global action:', action);
            continue;
        }
        
        // If no glob pattern is specified, always show the action
        if (!action.glob) {
            matchingActions.push({
                text: action.text,
                command: action.command,
                tooltip: action.tooltip,
                color: action.color
            });
            continue;
        }
        
        // If glob pattern is specified, check if it matches
        if (await matchesGlobPattern(workspaceRoot, action.glob)) {
            matchingActions.push({
                text: action.text,
                command: action.command,
                tooltip: action.tooltip,
                color: action.color
            });
        }
    }
    
    return matchingActions;
}

/**
 * Loads local actions from the project-specific configuration file.
 * Returns an empty array if the file doesn't exist or contains invalid data.
 */
function loadLocalActions(workspaceRoot: string): ActionButton[] {
    const configFileName = getConfigFileName();
    const configPath = path.join(workspaceRoot, configFileName);

    if (!fs.existsSync(configPath)) {
        console.log(`Configuration file not found: ${configPath}`);
        return [];
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config: ProjectActionsConfig = JSON5.parse(configContent);

        if (!config.actions || !Array.isArray(config.actions)) {
            vscode.window.showErrorMessage('Invalid configuration: "actions" array not found');
            return [];
        }

        console.log(`Loaded ${config.actions.length} local action(s) from ${configFileName}`);
        return config.actions;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to load project actions: ${errorMessage}`);
        console.error('Error loading project actions:', error);
        return [];
    }
}

/**
 * Validates that an action has the required properties.
 */
function isValidAction(action: Partial<ActionButton>): action is ActionButton {
    return Boolean(action.text && action.command);
}

/**
 * Creates a status bar item for the given action and registers its command.
 * Returns the status bar item and command disposable for cleanup.
 */
function createStatusBarItem(action: ActionButton, index: number): {
    item: vscode.StatusBarItem;
    disposable: vscode.Disposable;
} {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        1000 - index
    );

    statusBarItem.text = action.text;
    statusBarItem.tooltip = action.tooltip || action.command;
    
    if (action.color) {
        statusBarItem.color = action.color;
    }

    const commandId = `project-actions.action-${index}`;
    const disposable = vscode.commands.registerCommand(commandId, () => {
        executeAction(action.command);
    });

    statusBarItem.command = commandId;
    statusBarItem.show();

    return { item: statusBarItem, disposable };
}

/**
 * Creates a visual separator status bar item to distinguish between local and global actions.
 */
function createSeparator(index: number): vscode.StatusBarItem {
    const separator = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        1000 - index
    );
    separator.text = ':';
    separator.tooltip = 'Separator between local and global actions';
    separator.show();
    return separator;
}

/**
 * Main function that loads and displays all actions (local + global).
 * Clears existing actions before loading to ensure a clean state.
 * Adds a visual separator between local and global actions when both are present.
 */
async function reloadActions(): Promise<void> {
    disposeStatusBarItems();
    disposeCommandDisposables();

    if (!vscode.workspace.workspaceFolders) {
        console.log('No workspace folder open');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const localActions = loadLocalActions(workspaceRoot);
    const globalActions = await getMatchingGlobalActions(workspaceRoot).catch(error => {
        console.error('Error loading global actions:', error);
        return [];
    });

    let index = 0;

    // Display local actions
    localActions.forEach((action) => {
        if (!isValidAction(action)) {
            console.warn('Skipping invalid local action:', action);
            return;
        }

        const { item, disposable } = createStatusBarItem(action, index++);
        statusBarItems.push(item);
        commandDisposables.push(disposable);
    });

    // Add separator if both local and global actions exist
    if (localActions.length > 0 && globalActions.length > 0) {
        const separator = createSeparator(index++);
        statusBarItems.push(separator);
    }

    // Display global actions
    globalActions.forEach((action) => {
        if (!isValidAction(action)) {
            console.warn('Skipping invalid global action:', action);
            return;
        }

        const { item, disposable } = createStatusBarItem(action, index++);
        statusBarItems.push(item);
        commandDisposables.push(disposable);
    });

    console.log(`Total ${statusBarItems.length} item(s) displayed (${localActions.length} local, ${globalActions.length} global)`);
}

/**
 * Resolves VS Code variables in a command string.
 * Supports common variables like ${workspaceFolder}, ${file}, ${relativeFile}, etc.
 */
function resolveVariables(command: string): string {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    let resolved = command;
    
    // Workspace-related variables
    if (workspaceFolder) {
        resolved = resolved.replace(/\$\{workspaceFolder\}/g, workspaceFolder.uri.fsPath);
        resolved = resolved.replace(/\$\{workspaceFolderBasename\}/g, path.basename(workspaceFolder.uri.fsPath));
    }
    
    // File-related variables (require an active editor)
    if (editor?.document) {
        const filePath = editor.document.uri.fsPath;
        const fileDir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const fileNameNoExt = path.basename(filePath, path.extname(filePath));
        const fileExt = path.extname(filePath);
        
        // Resolve file path
        resolved = resolved.replace(/\$\{file\}/g, filePath);
        resolved = resolved.replace(/\$\{fileBasename\}/g, fileName);
        resolved = resolved.replace(/\$\{fileBasenameNoExtension\}/g, fileNameNoExt);
        resolved = resolved.replace(/\$\{fileExtname\}/g, fileExt);
        resolved = resolved.replace(/\$\{fileDirname\}/g, fileDir);
        
        // Resolve relative file path
        if (workspaceFolder) {
            const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
            const relativeDir = path.relative(workspaceFolder.uri.fsPath, fileDir);
            resolved = resolved.replace(/\$\{relativeFile\}/g, relativePath);
            resolved = resolved.replace(/\$\{relativeFileDirname\}/g, relativeDir);
        }
        
        // Resolve selection-related variables
        const selection = editor.selection;
        if (!selection.isEmpty) {
            const selectedText = editor.document.getText(selection);
            resolved = resolved.replace(/\$\{selectedText\}/g, selectedText);
        }
        
        // Line number (1-based)
        const lineNumber = selection.active.line + 1;
        resolved = resolved.replace(/\$\{lineNumber\}/g, lineNumber.toString());
    }
    
    // Current working directory
    const cwd = workspaceFolder?.uri.fsPath || process.cwd();
    resolved = resolved.replace(/\$\{cwd\}/g, cwd);
    
    return resolved;
}

function executeAction(command: string): void {
    const resolvedCommand = resolveVariables(command);
    const terminal = vscode.window.createTerminal('Project Actions');
    terminal.show();
    terminal.sendText(resolvedCommand);
}

function disposeCommandDisposables(): void {
    commandDisposables.forEach(disposable => disposable.dispose());
    commandDisposables = [];
}

function disposeStatusBarItems(): void {
    statusBarItems.forEach(item => item.dispose());
    statusBarItems = [];
}
