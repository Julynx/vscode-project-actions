import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { minimatch } from 'minimatch';
import JSON5 from 'json5';

const DEFAULT_CONFIG_TEMPLATE = {
    actions: [
        {
            text: "$(repo-pull) Pull",
            command: "git pull",
            tooltip: "Pull changes from the remote repository",
            color: "#b0eb93"
        },
        {
            text: "$(repo-push) Push",
            command: "git add .; git commit; git push",
            tooltip: "Add, commit, and push changes to the remote repository",
            color: "#ffc384"
        }
    ]
};

interface ActionButton {
    text: string;
    command: string;
    tooltip?: string;
    color?: string;
}

interface ConfiguredActionButton extends ActionButton {
    glob?: string;
}

interface ProjectActionsConfig {
    actions: ActionButton[];
}

interface ActionItem {
    item: vscode.StatusBarItem;
    disposable: vscode.Disposable;
}

let activeFileItems: ActionItem[] = [];
let projectItems: ActionItem[] = [];
let globalItems: ActionItem[] = [];
let activeSeparator: vscode.StatusBarItem | undefined;
let projectSeparator: vscode.StatusBarItem | undefined;
let fileWatcher: vscode.FileSystemWatcher | undefined;

let isReloading = false;

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
        vscode.commands.registerCommand('project-actions.editActiveFileActions', async () => {
            await openActiveFileSettings();
        }),
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('project-actions.globalActions') ||
                event.affectsConfiguration('project-actions.activeFileActions')) {
                console.log('Configuration changed, reloading...');
                reloadActions();
            }
        }),
        vscode.window.onDidChangeActiveTextEditor(() => {
            updateActiveFileActions();
        }),
        vscode.window.tabGroups.onDidChangeTabs(() => {
            updateActiveFileActions();
        })
    );

    setupFileWatcher(context);
    reloadActions();
}

export function deactivate(): void {
    disposeAllItems();
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
        console.log('Configuration file deleted, reloading actions...');
        reloadActions();
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
        try {
            fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG_TEMPLATE, null, 2), 'utf8');
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
 * Opens the VS Code settings UI focused on the active file actions configuration.
 */
async function openActiveFileSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'project-actions.activeFileActions');
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
async function getMatchingGlobalActions(workspaceRoot: string): Promise<ConfiguredActionButton[]> {
    const config = vscode.workspace.getConfiguration('project-actions');
    const globalActions = config.get<ConfiguredActionButton[]>('globalActions', []);

    const matchingActions: ConfiguredActionButton[] = [];

    for (const action of globalActions) {
        if (!isValidAction(action)) {
            console.warn('Skipping invalid global action:', action);
            continue;
        }

        // If no glob pattern is specified, always show the action
        if (!action.glob) {
            matchingActions.push(action);
            continue;
        }

        // If glob pattern is specified, check if it matches
        if (await matchesGlobPattern(workspaceRoot, action.glob)) {
            matchingActions.push(action);
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
function createStatusBarItem(action: ActionButton, priority: number, idSuffix: string): ActionItem {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        priority
    );

    statusBarItem.text = action.text;
    statusBarItem.tooltip = action.tooltip || action.command;

    if (action.color) {
        statusBarItem.color = action.color;
    }

    // Use a unique command ID to avoid collisions
    const commandId = `project-actions.action-${idSuffix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const disposable = vscode.commands.registerCommand(commandId, () => {
        executeAction(action.command);
    });

    statusBarItem.command = commandId;
    statusBarItem.show();

    return { item: statusBarItem, disposable };
}

function createActionItems(actions: ConfiguredActionButton[], startPriority: number, idPrefix: string): ActionItem[] {
    const items: ActionItem[] = [];
    let index = 0;
    for (const action of actions) {
        if (isValidAction(action)) {
            items.push(createStatusBarItem(action, startPriority - index++, `${idPrefix}-${index}`));
        }
    }
    return items;
}

/**
 * Creates a visual separator status bar item.
 */
function createSeparator(priority: number): vscode.StatusBarItem {
    const separator = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        priority
    );
    separator.text = ':';
    separator.tooltip = 'Separator';
    separator.show();
    return separator;
}

/**
 * Main function that loads and displays all actions.
 */
async function reloadActions(): Promise<void> {
    if (isReloading) {
        return;
    }
    isReloading = true;

    try {
        // Dispose static items
        disposeItems(projectItems);
        projectItems = [];
        disposeItems(globalItems);
        globalItems = [];
        projectSeparator?.dispose();
        projectSeparator = undefined;

        if (!vscode.workspace.workspaceFolders) {
            console.log('No workspace folder open');
            // Still need to update active file actions to clear them
            updateActiveFileActions();
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

        // Load Project Actions
        const localActions = loadLocalActions(workspaceRoot);
        projectItems = createActionItems(localActions, 200, 'project');

        // Load Global Actions
        const globalActions = await getMatchingGlobalActions(workspaceRoot).catch(error => {
            console.error('Error loading global actions:', error);
            return [];
        });
        globalItems = createActionItems(globalActions, 100, 'global');

        // Create separator between Project and Global if both exist
        if (projectItems.length > 0 && globalItems.length > 0) {
            projectSeparator = createSeparator(150);
        }

        // Update Active File Actions
        updateActiveFileActions();

        console.log(`Loaded ${projectItems.length} project, ${globalItems.length} global actions`);
    } finally {
        isReloading = false;
    }
}

function getActiveFileUri(): vscode.Uri | undefined {
    // Try active text editor first
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        return editor.document.uri;
    }

    // Fallback to active tab if it's a file
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    const input = activeTab?.input;

    if (input instanceof vscode.TabInputText ||
        input instanceof vscode.TabInputCustom ||
        input instanceof vscode.TabInputNotebook) {
        return input.uri;
    }

    return undefined;
}

let isUpdatingActiveFile = false;

function updateActiveFileActions(): void {
    if (isUpdatingActiveFile) {
        return;
    }
    isUpdatingActiveFile = true;

    // Dispose active items
    disposeItems(activeFileItems);
    activeFileItems = [];
    activeSeparator?.dispose();
    activeSeparator = undefined;

    const activeUri = getActiveFileUri();
    if (!activeUri) {
        return;
    }

    const config = vscode.workspace.getConfiguration('project-actions');
    const activeActions = config.get<ConfiguredActionButton[]>('activeFileActions', []);
    const filePath = activeUri.fsPath;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeUri);

    let relativePath = filePath;
    if (workspaceFolder) {
        relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
    }
    // Normalize path separators for minimatch
    relativePath = relativePath.split(path.sep).join('/');

    let index = 0;
    activeActions.forEach(action => {
        if (!isValidAction(action)) {
            return;
        }

        let matches = true;
        if (action.glob) {
            matches = minimatch(relativePath, action.glob, { dot: true });
        }

        if (matches) {
            activeFileItems.push(createStatusBarItem(action, 300 - index++, `active-${index}`));
        }
    });

    // Create separator if active items exist AND (project OR global items exist)
    if (activeFileItems.length > 0 && (projectItems.length > 0 || globalItems.length > 0)) {
        activeSeparator = createSeparator(250);
    }

    isUpdatingActiveFile = false;
}

function disposeItems(items: ActionItem[]): void {
    items.forEach(i => {
        i.item.dispose();
        i.disposable.dispose();
    });
}

function disposeAllItems(): void {
    disposeItems(activeFileItems);
    activeFileItems = [];
    disposeItems(projectItems);
    projectItems = [];
    disposeItems(globalItems);
    globalItems = [];
    activeSeparator?.dispose();
    projectSeparator?.dispose();
}

/**
 * Resolves VS Code variables in a command string.
 * Supports common variables like ${workspaceFolder}, ${file}, ${relativeFile}, etc.
 */
function resolveVariables(command: string): string {
    const activeUri = getActiveFileUri();
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    let resolved = command;

    // Workspace-related variables
    if (workspaceFolder) {
        resolved = resolved.replace(/\$\{workspaceFolder\}/g, workspaceFolder.uri.fsPath);
        resolved = resolved.replace(/\$\{workspaceFolderBasename\}/g, path.basename(workspaceFolder.uri.fsPath));
    }

    // File-related variables
    if (activeUri) {
        const filePath = activeUri.fsPath;
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

        // Resolve selection-related variables (require an active editor)
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.uri.toString() === activeUri.toString()) {
            const selection = editor.selection;
            if (!selection.isEmpty) {
                const selectedText = editor.document.getText(selection);
                resolved = resolved.replace(/\$\{selectedText\}/g, selectedText);
            }

            // Line number (1-based)
            const lineNumber = selection.active.line + 1;
            resolved = resolved.replace(/\$\{lineNumber\}/g, lineNumber.toString());
        }
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
