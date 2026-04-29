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

### 0.1.1 - 2026-04-29

- fix: handle inherited stdio in release script (`78f96f5`)
- feat: add local release automation (`828d290`)
- fix: improve workbench selection contrast (`bea2bec`)
- test: reduce brittleness with snapshot tests and loosen rigid assertions (`0b7b313`)
- test: remove redundant test cases and consolidate docs/publishing checks (`053299e`)
- chore: migrate test suite from node:test to vitest (`febaf03`)
- docs: update CLAUDE.md with lint and format configuration (`612b191`)
- chore: add oxlint and oxfmt for linting and formatting (`117265f`)
- docs: add AGENTS.md as unified AI coding guide (`89a86dc`)
- fix: align publisher ID to fu-chen across tests and docs (`ce0da0a`)
- chore: replace npm lockfile with bun lockfile (`394e426`)
- docs: add preivew image in README (`4168360`)
- chore: publisher id (`bdbfb87`)
- Add VSIX packaging script (`96e4b83`)
- Clarify marketplace release validation (`4e00ccf`)
- Exclude internal tooling from VSCE packaging (`4a1fc6d`)
- docs: document github release publishing (`1a8c164`)
- ci: guard marketplace release publishing (`3f54be7`)
- ci: publish marketplace releases from github (`ba1e854`)
- build: normalize lockfile registry URLs (`3144127`)
- build: prepare extension manifest for marketplace publishing (`fe4fbbf`)
- docs: add marketplace release automation spec (`ac39f73`)
- Add packaging-time theme build hook (`ff96dc6`)
- docs: document theme builder workflow (`f737745`)
- refactor: harden theme builder errors (`f350ec7`)
- refactor: generate theme from parts (`4bde91b`)
- test: make the theme builder scaffold runnable (`4da6202`)
- test: introduce source layout contract (`4ea7dd3`)
- chore: ignore local worktrees (`a1dd26c`)
- docs: add builder refactor design spec (`af2028d`)
- Add VSCode theme skill scaffold (`c83f7e3`)
- chore: add repository metadata and publish gitignore (`07a6e80`)
- Fix badge contrast and add MIT license (`57f09b7`)
- test: require gitignore in vscode packaging (`fda9113`)
- docs: add black metal theme usage and packaging notes (`4002ace`)
- test: enforce full task 4 token contract (`a55edfa`)
- feat: add balanced black metal syntax colors (`caacc77`)
- test: harden task 3 color contracts (`2cc0350`)
- fix: keep theme colors flat (`b2afb2b`)
- feat: add editor states and diagnostics colors (`5c038f1`)
- feat: add black metal workbench and terminal colors (`4cadac5`)
- fix: restore full task one metadata contract (`29a1945`)
- fix: trim package metadata to scaffold spec (`5ca914f`)
- feat: scaffold black metal theme extension (`b79182b`)
- docs: add black metal theme design spec (`a7432b4`)

## Palette Source

This theme is based on Ghostty's Black Metal palette and preserves its terminal ANSI layout while adapting the workbench hierarchy for VS Code.
