# Black Metal

A VS Code workbench theme adapted from Ghostty's Black Metal palette.

![Preview](./assets/preview.avif)

## Design Notes

- Keeps the chrome almost entirely black and gray
- Uses `#486e6f` for structural emphasis such as focus and active states
- Uses `#dd9999` and `#a06666` for syntax, diagnostics, diffs, and terminal ANSI mapping

## Installation

### Marketplace

1. Open the Extensions view in VS Code.
2. Search for `Black Metal`.
3. Install the theme published by `fu-chen`.
4. Open Command Palette and choose `Preferences: Color Theme`.
5. Select `Black Metal`.

You can also install it from the command line:

```bash
code --install-extension fu-chen.black-metal-vscode-theme
```

### Local Development

1. Clone this repository.
2. Install dependencies with `npm install`.
3. Run `npm run build:theme` to regenerate the theme from `parts/`.
4. From the repository root, run `code --extensionDevelopmentPath "$(pwd)"`.
5. In the Extension Development Host window, open Command Palette and choose `Preferences: Color Theme`.
6. Select `Black Metal`.

## Development

- Edit `parts/`, then run `npm run build:theme` to regenerate `themes/black-metal-color-theme.json`
- Run `npm test` to validate the extension metadata and theme mapping
- Packaging and publishing regenerate the theme automatically through `npm run vscode:prepublish`
- Inspect the theme inside the Extension Development Host before packaging

## Release Publishing

- Run `npm run release:local -- [patch|minor|major]` to bump the local version, update this changelog, validate the extension, and build a `.vsix` package. The default release type is `patch`.
- Create a GitHub Release from the `package.json` version, using either `0.1.0` or `v0.1.0`.
- Run `npm test` and `npm run package:vsix` before publishing if you are not using `release:local`.
- Set the `VSCE_PAT` secret in the GitHub repository secrets for `fu-chen` so `npx @vscode/vsce publish` can upload the extension.

## Changelog

## Palette Source

This theme is based on Ghostty's Black Metal palette and preserves its terminal ANSI layout while adapting the workbench hierarchy for VS Code.
