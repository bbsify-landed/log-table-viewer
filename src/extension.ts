import * as vscode from 'vscode';
import { LogTableViewerProvider } from './logTableViewerProvider';

export function activate(context: vscode.ExtensionContext) {
    const openLogViewerCommand = vscode.commands.registerCommand('logTableViewer.openLogViewer', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = activeEditor.document;
        if (!document.fileName.endsWith('.log') && !document.fileName.endsWith('.json')) {
            vscode.window.showWarningMessage('This command works only with .log and .json files');
            return;
        }

        const provider = new LogTableViewerProvider(context.extensionUri);
        provider.openLogFile(document.fileName);
    });

    context.subscriptions.push(openLogViewerCommand);
}

export function deactivate() {}