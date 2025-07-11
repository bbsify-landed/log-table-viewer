import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LogTableViewerProvider } from './logTableViewerProvider';

export function activate(context: vscode.ExtensionContext) {
    // Create a single provider instance that persists across command invocations
    const provider = new LogTableViewerProvider(context.extensionUri);
    
    const openLogViewerCommand = vscode.commands.registerCommand('logTableViewer.openLogViewer', async (uri?: vscode.Uri) => {
        let filePath: string | undefined;
        
        if (uri) {
            // Command called from context menu with file URI
            filePath = uri.fsPath;
        } else {
            // Command called from command palette or no URI provided
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                filePath = activeEditor.document.fileName;
            }
        }
        
        if (filePath) {
            // Check if file is a log or json file
            if (!filePath.endsWith('.log') && !filePath.endsWith('.json')) {
                vscode.window.showWarningMessage('This command works only with .log and .json files');
                return;
            }
            
            provider.openLogFile(filePath);
        } else {
            // No file available - suggest log files from workspace
            await suggestLogFiles(provider);
        }
    });

    context.subscriptions.push(openLogViewerCommand);
}

async function suggestLogFiles(provider: LogTableViewerProvider) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        // No workspace - just open empty viewer
        provider.openEmptyViewer();
        return;
    }

    // Find log files in workspace
    const logFiles = await findLogFiles(workspaceFolders[0].uri.fsPath);
    
    if (logFiles.length === 0) {
        // No log files found - open empty viewer
        provider.openEmptyViewer();
        return;
    }

    // Suggest up to 3 most recent log files
    const recentLogFiles = logFiles
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        .slice(0, 3);

    const items = recentLogFiles.map(file => ({
        label: path.basename(file.path),
        description: path.relative(workspaceFolders[0].uri.fsPath, file.path),
        detail: `Modified: ${file.mtime.toLocaleString()}`,
        path: file.path
    }));

    // Add option to browse for other files
    items.push({
        label: '$(folder-opened) Browse for log file...',
        description: 'Open file picker',
        detail: 'Select a .log or .json file from anywhere',
        path: ''
    });

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a log file to open in Log Table Viewer'
    });

    if (!selected) {
        return;
    }

    if (selected.path === '') {
        // Browse for file
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Open Log File',
            filters: {
                'Log Files': ['log', 'json']
            }
        });

        if (fileUri && fileUri[0]) {
            provider.openLogFile(fileUri[0].fsPath);
        }
    } else {
        provider.openLogFile(selected.path);
    }
}

async function findLogFiles(workspaceRoot: string): Promise<Array<{path: string; mtime: Date}>> {
    const logFiles: Array<{path: string; mtime: Date}> = [];
    
    try {
        const files = await vscode.workspace.findFiles(
            '**/*.{log,json}',
            '**/node_modules/**',
            50 // Limit to 50 files for performance
        );

        for (const file of files) {
            try {
                const stat = await fs.promises.stat(file.fsPath);
                logFiles.push({
                    path: file.fsPath,
                    mtime: stat.mtime
                });
            } catch (err) {
                // Skip files that can't be accessed
                continue;
            }
        }
    } catch (err) {
        console.error('Error finding log files:', err);
    }

    return logFiles;
}

export function deactivate() {}