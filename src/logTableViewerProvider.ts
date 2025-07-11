import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class LogTableViewerProvider {
  private _panels: Map<string, vscode.WebviewPanel> = new Map();

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public openEmptyViewer() {
    this._createViewer("empty", "Log Table Viewer", [], "No file selected");
  }

  public openLogFile(filePath: string) {
    try {
      const logContent = fs.readFileSync(filePath, "utf8");
      const logLines = this._parseLogLines(logContent);
      const fileName = path.basename(filePath);
      
      this._createViewer(filePath, `Log Viewer - ${fileName}`, logLines, fileName);
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading log file: ${error}`);
    }
  }

  private _createViewer(key: string, title: string, logs: LogLine[], fileName: string) {
    const panel = vscode.window.createWebviewPanel(
      "logTableViewer",
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
        retainContextWhenHidden: true,
      }
    );

    this._panels.set(key, panel);
    panel.webview.html = this._getHtmlForWebview(panel.webview);

    // Store the state for this panel
    const panelState = {
      key,
      title,
      logs,
      fileName,
    };

    // Set up message handler
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "filter":
            this._filterLogs(panel, message.text);
            break;
        }
      },
      undefined,
      []
    );

    // Handle webview becoming visible again (restore state)
    panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible) {
          // Re-send the log data when panel becomes visible
          panel.webview.postMessage({
            command: "updateLogs",
            logs: panelState.logs,
            fileName: panelState.fileName,
          });
        }
      },
      null,
      []
    );

    // Handle panel disposal
    panel.onDidDispose(
      () => {
        this._panels.delete(key);
      },
      null,
      []
    );

    // Send the log data to the webview
    panel.webview.postMessage({
      command: "updateLogs",
      logs: logs,
      fileName: fileName,
    });
  }

  private _parseLogLines(content: string): LogLine[] {
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    return lines.map((line, index) => {
      const logLine = this._extractLogComponents(line);
      return {
        lineNumber: index + 1,
        timestamp: logLine.timestamp,
        level: logLine.level,
        message: logLine.message,
        raw: line,
      };
    });
  }

  private _extractLogComponents(line: string): {
    timestamp: string;
    level: string;
    message: string;
  } {
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
      /^(\w+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2].toUpperCase(),
          message: match[3],
        };
      }
    }

    // Fallback: no structured format detected
    return {
      timestamp: "",
      level: "UNKNOWN",
      message: line,
    };
  }

  private _tryParseJson(
    line: string
  ): { timestamp: string; level: string; message: string } | null {
    try {
      const json = JSON.parse(line);

      // Common JSON log fields
      const timestamp =
        json.timestamp ||
        json.time ||
        json.ts ||
        json["@timestamp"] ||
        json.datetime ||
        "";
      const level =
        json.level || json.severity || json.loglevel || json.priority || "INFO";
      const message =
        json.message ||
        json.msg ||
        json.text ||
        json.content ||
        JSON.stringify(json);

      return {
        timestamp: timestamp.toString(),
        level: level.toString().toUpperCase(),
        message: message.toString(),
      };
    } catch {
      return null;
    }
  }

  private _tryParseSlog(
    line: string
  ): { timestamp: string; level: string; message: string } | null {
    // slog format: time=2023-10-15T10:30:45.123Z level=INFO msg="Application started" key1=value1 key2=value2
    const slogPattern = /^time=([^\s]+)\s+level=([^\s]+)\s+msg="([^"]+)"(.*)$/;
    const match = line.match(slogPattern);

    if (match) {
      const [, timestamp, level, message, attrs] = match;

      // Parse additional attributes
      const additionalAttrs = attrs.trim();
      const finalMessage = additionalAttrs
        ? `${message} ${additionalAttrs}`
        : message;

      return {
        timestamp,
        level: level.toUpperCase(),
        message: finalMessage,
      };
    }

    // Alternative slog format without quotes: time=2023-10-15T10:30:45.123Z level=INFO msg=started
    const slogPattern2 = /^time=([^\s]+)\s+level=([^\s]+)\s+msg=([^\s]+)(.*)$/;
    const match2 = line.match(slogPattern2);

    if (match2) {
      const [, timestamp, level, message, attrs] = match2;
      const additionalAttrs = attrs.trim();
      const finalMessage = additionalAttrs
        ? `${message} ${additionalAttrs}`
        : message;

      return {
        timestamp,
        level: level.toUpperCase(),
        message: finalMessage,
      };
    }

    return null;
  }

  private _filterLogs(panel: vscode.WebviewPanel, filterText: string) {
    panel.webview.postMessage({
      command: "applyFilter",
      filter: filterText,
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const mainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'main.js')
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'assets', 'main.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Table Viewer</title>
    <link rel="stylesheet" href="${cssUri}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="${mainUri}"></script>
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
