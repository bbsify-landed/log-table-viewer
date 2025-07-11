# Contributing to Log Table Viewer

Thank you for your interest in contributing to Log Table Viewer! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js (16+)
- pnpm (8+)
- VS Code

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/bbsify-landed/log-table-viewer.git
   cd log-table-viewer
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the extension:
   ```bash
   pnpm run build
   ```

4. Install the extension locally for testing:
   ```bash
   pnpm run package
   pnpm run install-local
   ```

## Project Structure

```
├── src/                          # Extension backend (TypeScript)
│   ├── extension.ts              # Main extension entry point
│   └── logTableViewerProvider.ts # Webview provider logic
├── webview-ui/                   # React frontend
│   ├── src/
│   │   ├── App.tsx              # Main React component
│   │   ├── components/          # React components
│   │   └── types.ts             # TypeScript types
│   ├── index.html               # Webview HTML template
│   └── tsconfig.json            # Frontend TypeScript config
├── vite.config.ts               # Vite build configuration
└── package.json                 # Extension manifest
```

## Development Workflow

### Backend Development (Extension)

The backend code is in `src/` and handles:
- VS Code extension lifecycle
- Command registration
- Webview management
- File reading and log parsing

### Frontend Development (React)

The frontend code is in `webview-ui/src/` and handles:
- Log table rendering
- Filtering and sorting
- User interactions
- VS Code API communication

### Building

- **Development**: `pnpm run dev` (starts Vite dev server)
- **Build**: `pnpm run build` (builds both backend and frontend)
- **Package**: `pnpm run package` (creates .vsix file)

## Testing

1. Build and install the extension locally:
   ```bash
   pnpm run build
   pnpm run package
   pnpm run install-local
   ```

2. Test with sample log files:
   - Create test .log files with various formats
   - Test context menu functionality
   - Test multiple viewer instances
   - Test filtering and sorting

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Create a pull request

## Pull Request Guidelines

- Include a clear description of changes
- Reference any related issues
- Test your changes thoroughly
- Update documentation if needed
- Keep commits focused and atomic

## Adding New Log Formats

To add support for new log formats:

1. Add parsing logic in `src/logTableViewerProvider.ts`
2. Add the new format to the `_extractLogComponents` method
3. Test with sample files
4. Update documentation

## Reporting Issues

When reporting issues:
- Use the GitHub issue template
- Include VS Code version
- Include sample log files (if possible)
- Describe expected vs actual behavior
- Include error messages and console output

## Questions?

Feel free to open an issue for questions or discussions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.