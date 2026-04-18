# Black Metal

A VS Code workbench theme adapted from Ghostty's Black Metal palette.

## Design Notes

- Keeps the chrome almost entirely black and gray
- Uses `#486e6f` for structural emphasis such as focus and active states
- Uses `#dd9999` and `#a06666` for syntax, diagnostics, diffs, and terminal ANSI mapping

## Installation

1. Clone this repository.
2. From the repository root, run `code --extensionDevelopmentPath "$(pwd)"`.
3. In the Extension Development Host window, open Command Palette and choose `Preferences: Color Theme`.
4. Select `Black Metal`.

## Development

- Edit `parts/`, then run `npm run build:theme` to regenerate `themes/black-metal-color-theme.json`
- Run `npm test` to validate the extension metadata and theme mapping
- Packaging and publishing regenerate the theme automatically through `npm run vscode:prepublish`
- Inspect the theme inside the Extension Development Host before packaging

## Palette Source

This theme is based on Ghostty's Black Metal palette and preserves its terminal ANSI layout while adapting the workbench hierarchy for VS Code.
