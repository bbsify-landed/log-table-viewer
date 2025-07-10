import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class LogTableViewerProvider {
    private _panel?: vscode.WebviewPanel;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public openLogFile(filePath: string) {
        try {
            const logContent = fs.readFileSync(filePath, 'utf8');
            const logLines = this._parseLogLines(logContent);
            
            // Create and show a new webview panel
            this._panel = vscode.window.createWebviewPanel(
                'logTableViewer',
                `Log Viewer - ${path.basename(filePath)}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [this._extensionUri]
                }
            );

            this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

            this._panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'filter':
                            this._filterLogs(message.text);
                            break;
                    }
                },
                undefined,
                []
            );

            // Send the log data to the webview
            this._panel.webview.postMessage({
                command: 'updateLogs',
                logs: logLines,
                fileName: path.basename(filePath)
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error reading log file: ${error}`);
        }
    }

    private _parseLogLines(content: string): LogLine[] {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, index) => {
            const logLine = this._extractLogComponents(line);
            return {
                lineNumber: index + 1,
                timestamp: logLine.timestamp,
                level: logLine.level,
                message: logLine.message,
                raw: line
            };
        });
    }

    private _extractLogComponents(line: string): { timestamp: string; level: string; message: string } {
        // Try JSON format first
        const jsonResult = this._tryParseJson(line);
        if (jsonResult) {
            return jsonResult;
        }

        // Try slog format
        const slogResult = this._tryParseSlog(line);
        if (slogResult) {
            return slogResult;
        }

        // Common log patterns
        const patterns = [
            // ISO timestamp with level: 2023-10-15T10:30:45.123Z [INFO] Message
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s*\[(\w+)\]\s*(.*)$/,
            // Date/time with level: 2023-10-15 10:30:45 INFO Message
            /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\w+)\s+(.*)$/,
            // Simple timestamp: [10:30:45] INFO: Message
            /^\[(\d{2}:\d{2}:\d{2})\]\s*(\w+):\s*(.*)$/,
            // Level first: INFO 2023-10-15 10:30:45 Message
            /^(\w+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    timestamp: match[1],
                    level: match[2].toUpperCase(),
                    message: match[3]
                };
            }
        }

        // Fallback: no structured format detected
        return {
            timestamp: '',
            level: 'UNKNOWN',
            message: line
        };
    }

    private _tryParseJson(line: string): { timestamp: string; level: string; message: string } | null {
        try {
            const json = JSON.parse(line);
            
            // Common JSON log fields
            const timestamp = json.timestamp || json.time || json.ts || json['@timestamp'] || json.datetime || '';
            const level = json.level || json.severity || json.loglevel || json.priority || 'INFO';
            const message = json.message || json.msg || json.text || json.content || JSON.stringify(json);
            
            return {
                timestamp: timestamp.toString(),
                level: level.toString().toUpperCase(),
                message: message.toString()
            };
        } catch {
            return null;
        }
    }

    private _tryParseSlog(line: string): { timestamp: string; level: string; message: string } | null {
        // slog format: time=2023-10-15T10:30:45.123Z level=INFO msg="Application started" key1=value1 key2=value2
        const slogPattern = /^time=([^\s]+)\s+level=([^\s]+)\s+msg="([^"]+)"(.*)$/;
        const match = line.match(slogPattern);
        
        if (match) {
            const [, timestamp, level, message, attrs] = match;
            
            // Parse additional attributes
            const additionalAttrs = attrs.trim();
            const finalMessage = additionalAttrs ? `${message} ${additionalAttrs}` : message;
            
            return {
                timestamp,
                level: level.toUpperCase(),
                message: finalMessage
            };
        }

        // Alternative slog format without quotes: time=2023-10-15T10:30:45.123Z level=INFO msg=started
        const slogPattern2 = /^time=([^\s]+)\s+level=([^\s]+)\s+msg=([^\s]+)(.*)$/;
        const match2 = line.match(slogPattern2);
        
        if (match2) {
            const [, timestamp, level, message, attrs] = match2;
            const additionalAttrs = attrs.trim();
            const finalMessage = additionalAttrs ? `${message} ${additionalAttrs}` : message;
            
            return {
                timestamp,
                level: level.toUpperCase(),
                message: finalMessage
            };
        }

        return null;
    }

    private _filterLogs(filterText: string) {
        if (!this._panel) {
            return;
        }

        this._panel.webview.postMessage({
            command: 'applyFilter',
            filter: filterText
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Table Viewer</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .header {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .file-name {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .filter-container {
            margin-bottom: 10px;
        }
        .filter-input {
            width: 100%;
            padding: 5px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        .log-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .log-table th, .log-table td {
            border: 1px solid var(--vscode-panel-border);
            padding: 4px 8px;
            text-align: left;
        }
        .log-table th {
            background-color: var(--vscode-editor-selectionBackground);
            font-weight: bold;
            position: sticky;
            top: 0;
            cursor: pointer;
        }
        .log-table th:hover {
            background-color: var(--vscode-editor-selectionHighlightBackground);
        }
        .log-table tr:nth-child(even) {
            background-color: var(--vscode-list-evenBackground);
        }
        .log-table tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .level-ERROR { color: var(--vscode-errorForeground); }
        .level-WARN, .level-WARNING { color: var(--vscode-warningForeground); }
        .level-INFO { color: var(--vscode-textLink-foreground); }
        .level-DEBUG { color: var(--vscode-descriptionForeground); }
        .line-number { color: var(--vscode-editorLineNumber-foreground); }
        .message-col { max-width: 400px; word-wrap: break-word; }
        .stats {
            margin-top: 10px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="file-name" id="fileName">No file selected</div>
        <div class="stats" id="stats">0 lines</div>
    </div>
    
    <div class="filter-container">
        <input type="text" class="filter-input" id="filterInput" placeholder="Filter logs (supports regex)..." />
    </div>

    <table class="log-table" id="logTable">
        <thead>
            <tr>
                <th onclick="sortTable(0)">Line #</th>
                <th onclick="sortTable(1)">Timestamp</th>
                <th onclick="sortTable(2)">Level</th>
                <th onclick="sortTable(3)">Message</th>
            </tr>
        </thead>
        <tbody id="logTableBody">
            <tr>
                <td colspan="4" style="text-align: center; color: var(--vscode-descriptionForeground);">
                    No logs loaded. Open a .log file to view its contents.
                </td>
            </tr>
        </tbody>
    </table>

    <script>
        const vscode = acquireVsCodeApi();
        let allLogs = [];
        let filteredLogs = [];
        let sortColumn = 0;
        let sortDirection = 'asc';

        document.getElementById('filterInput').addEventListener('input', function(e) {
            const filterText = e.target.value;
            applyFilter(filterText);
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateLogs':
                    allLogs = message.logs;
                    filteredLogs = [...allLogs];
                    document.getElementById('fileName').textContent = message.fileName;
                    renderTable();
                    updateStats();
                    break;
                case 'applyFilter':
                    applyFilter(message.filter);
                    break;
            }
        });

        function applyFilter(filterText) {
            if (!filterText) {
                filteredLogs = [...allLogs];
            } else {
                try {
                    const regex = new RegExp(filterText, 'i');
                    filteredLogs = allLogs.filter(log => 
                        regex.test(log.message) || 
                        regex.test(log.level) || 
                        regex.test(log.timestamp)
                    );
                } catch (e) {
                    // If regex is invalid, fall back to simple text search
                    const searchText = filterText.toLowerCase();
                    filteredLogs = allLogs.filter(log => 
                        log.message.toLowerCase().includes(searchText) ||
                        log.level.toLowerCase().includes(searchText) ||
                        log.timestamp.toLowerCase().includes(searchText)
                    );
                }
            }
            renderTable();
            updateStats();
        }

        function sortTable(column) {
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }

            filteredLogs.sort((a, b) => {
                let aVal, bVal;
                switch (column) {
                    case 0: aVal = a.lineNumber; bVal = b.lineNumber; break;
                    case 1: aVal = a.timestamp; bVal = b.timestamp; break;
                    case 2: aVal = a.level; bVal = b.level; break;
                    case 3: aVal = a.message; bVal = b.message; break;
                }

                if (typeof aVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                } else {
                    return sortDirection === 'asc' ? 
                        aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
            });

            renderTable();
        }

        function renderTable() {
            const tbody = document.getElementById('logTableBody');
            tbody.innerHTML = '';

            if (filteredLogs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--vscode-descriptionForeground);">No logs match the current filter.</td></tr>';
                return;
            }

            filteredLogs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td class="line-number">\${log.lineNumber}</td>
                    <td>\${log.timestamp}</td>
                    <td class="level-\${log.level}">\${log.level}</td>
                    <td class="message-col">\${escapeHtml(log.message)}</td>
                \`;
                tbody.appendChild(row);
            });
        }

        function updateStats() {
            const stats = document.getElementById('stats');
            const totalLines = allLogs.length;
            const filteredLines = filteredLogs.length;
            
            if (totalLines === filteredLines) {
                stats.textContent = \`\${totalLines} lines\`;
            } else {
                stats.textContent = \`\${filteredLines} / \${totalLines} lines\`;
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}

interface LogLine {
    lineNumber: number;
    timestamp: string;
    level: string;
    message: string;
    raw: string;
}