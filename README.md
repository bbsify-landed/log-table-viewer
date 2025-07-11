# Log Table Viewer

A VS Code extension that provides a clean, table-based view for log files with filtering and sorting capabilities.

## Features

- **Multiple Format Support**: JSON, slog, and common log formats
- **Table View**: Clean, organized table display with columns for timestamp, level, and message
- **Multiple Viewers**: Open multiple log files simultaneously in separate tabs
- **Real-time Filtering**: Filter logs with onBlur behavior (press Enter or click away to apply)
- **Expandable Rows**: Click on any row to see the full raw log line
- **Sorting**: Sort by timestamp, level, or message
- **Context Menu**: Right-click on .log or .json files to open in table viewer

## Supported Log Formats

- **JSON logs**: `{"timestamp": "2023-10-15T10:30:45Z", "level": "INFO", "message": "Server started"}`
- **slog format**: `time=2023-10-15T10:30:45Z level=INFO msg="Server started" component=http`
- **Standard formats**: `2023-10-15 10:30:45 INFO Server started`
- **Timestamped logs**: `[10:30:45] INFO: Server started`

## Usage

1. **Command Palette**: Open Command Palette (Ctrl+Shift+P) and run "Open Log Table Viewer"
2. **Context Menu**: Right-click on any .log or .json file in the Explorer and select "Open Log Table Viewer"
3. **Multiple Files**: Open multiple log files simultaneously - each opens in its own tab

## Installation

Install from the VS Code Marketplace or download the .vsix file and install manually:

```bash
code --install-extension log-table-viewer-1.0.0.vsix
```

## Development

This extension is built with:
- **Backend**: TypeScript with VS Code Extension API
- **Frontend**: React + TypeScript with Vite build system
- **Package Manager**: pnpm

### Building

```bash
pnpm install
pnpm run build
pnpm run package
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT - See [LICENSE](LICENSE) file for details.

## Repository

[GitHub Repository](https://github.com/bbsify-landed/log-table-viewer)