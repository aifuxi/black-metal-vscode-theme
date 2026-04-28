# AI Coding Guide

This file provides guidance to AI coding assistants (Claude Code, Codex, OpenCode, etc.) when working with code in this repository.

## Project Overview

A VS Code workbench color theme extension adapted from Ghostty's Black Metal palette. Extremely austere dark theme with near-black backgrounds (`#000000`), gray neutrals, and restrained teal/rose accents. Published as "Black Metal" on the VS Code Marketplace.

## Repository Structure

```
parts/                         # Hand-edited theme source files (ONLY edit these)
  base.json                    # Theme name, type ("dark")
  colors-editor.json           # Editor surface colors (background, cursor, selection, diffs, diagnostics)
  colors-ui.json               # UI chrome colors (activity bar, sidebar, tabs, status bar, notifications)
  colors-terminal.json         # Terminal ANSI color mapping
  tokens.json                  # TextMate syntax token rules (array of scope→color rules)
  semantic.json                # Semantic token color overrides
scripts/
  build-theme.cjs              # Node build script: merges parts/ → themes/black-metal-color-theme.json
tests/
  theme.test.cjs               # Node test suite (--test runner)
themes/
  black-metal-color-theme.json # Generated output (committed but do NOT edit directly)
assets/
  preview.avif                 # Theme preview image for README
docs/superpowers/specs/        # Design specifications
  2026-04-18-black-metal-vscode-theme-design.md
  2026-04-18-black-metal-builder-refactor-design.md
  2026-04-18-marketplace-release-automation-design.md
.github/workflows/
  publish-marketplace.yml      # Publishes to VS Code Marketplace on GitHub Release
.agents/skills/vscode-theme/   # Agent skill scaffolding (SKILL.md + template + theme-builder.js)
.oxlintrc.json                 # Oxlint configuration
.oxfmtrc.json                  # Oxfmt formatter configuration
.vscode/settings.json          # VSCode editor settings for oxc integration
```

## Key Commands

| Command                | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run build:theme`  | Merge `parts/` into `themes/black-metal-color-theme.json`                      |
| `npm run lint`         | Run oxlint to check for code issues                                            |
| `npm run lint:fix`     | Run oxlint with auto-fix                                                       |
| `npm run fmt`          | Format code with oxfmt                                                         |
| `npm run fmt:check`    | Check formatting without writing (for CI)                                      |
| `npm test`             | Run full test suite (metadata, build integrity, palette contract)              |
| `npm run package:vsix` | Build `.vsix` package (runs `vscode:prepublish` → `build:theme` automatically) |
| `npm run publish:vsce` | Publish to VS Code Marketplace (requires `VSCE_PAT` env var)                   |

## Development Workflow

1. Edit files in `parts/` — these are the ONLY hand-edited theme sources
2. Run `npm run build:theme` to regenerate `themes/black-metal-color-theme.json`
3. Run `npm test` to validate
4. Preview in VS Code with `code --extensionDevelopmentPath "$(pwd)"`
5. Commit both `parts/` changes AND the regenerated theme JSON in the same commit

**Never edit `themes/black-metal-color-theme.json` directly** — it is generated output.

## Build System

- **Runtime**: Node.js (no transpilation, no TypeScript)
- **Lock file**: `bun.lock` (Bun lockfile format, not npm)
- **Dev dependency**: `@vscode/vsce ^3.6.2` (packaging/publishing)
- **Engine requirement**: VS Code `^1.90.0`
- **Test runner**: `node --test` (built-in Node test runner, no framework)
- **Build script**: `scripts/build-theme.cjs` — CommonJS module using `node:fs` and `node:path`

The build script:

1. Reads `parts/base.json` for name/type metadata
2. Merges `parts/colors-editor.json`, `parts/colors-ui.json`, `parts/colors-terminal.json` into a single `colors` object (fails on duplicate keys)
3. Reads `parts/tokens.json` for `tokenColors`
4. Reads `parts/semantic.json` for `semanticTokenColors`
5. Writes combined JSON to `themes/black-metal-color-theme.json`

## Linting and Formatting

- **Linter**: oxlint (Rust-based, 50-100x faster than ESLint)
- **Formatter**: oxfmt (Rust-based, 30x faster than Prettier)
- **Config files**: `.oxlintrc.json`, `.oxfmtrc.json`
- **VSCode integration**: `.vscode/settings.json` enables format on save and lint fixes

Run `npm run lint` and `npm run fmt` before committing. The linter and formatter ignore `node_modules/`, `themes/`, `parts/`, `.worktrees/`, `.agents/`, `.claude/` directories.

## Palette Reference

| Token              | Hex                 | Usage                                                 |
| ------------------ | ------------------- | ----------------------------------------------------- |
| Base background    | `#000000`           | Editor, terminal, true black                          |
| Surface 1          | `#050505`           | Activity bar, sidebar, panel, hover widget            |
| Surface 2          | `#0f0f0f`           | Status bar, title bar, input, dropdown                |
| Surface 3          | `#101010`–`#171717` | Active tab, list hover, button hover                  |
| Borders            | `#404040`           | Separators, inactive indent guides                    |
| Primary foreground | `#c1c1c1`           | Default text, cursor                                  |
| Secondary text     | `#aaaaaa`           | Functions, tags, sidebar text                         |
| Muted text         | `#999999`           | Types, punctuation, inactive line numbers             |
| Very muted         | `#888888`           | Comments, inactive UI text                            |
| Structural accent  | `#486e6f`           | Focus borders, active indicators, bracket match, info |
| Warm accent        | `#dd9999`           | Strings, constants, errors, terminal green            |
| Deep warm accent   | `#a06666`           | Keywords, warnings, terminal yellow, find matches     |

## Release Publishing

1. Bump version in `package.json`
2. Create a GitHub Release with tag matching the version (`0.1.0` or `v0.1.0`)
3. GitHub Actions triggers on `release.published`
4. Workflow: checkout → setup Node 20 → install deps → `npm test` → `npx @vscode/vsce publish`
5. Requires `VSCE_PAT` secret in GitHub repository secrets (publisher: `fu-chen`)

## Test Suite

Run with `npm test` (or `node --test tests/theme.test.cjs`). Tests validate:

- **Package metadata**: name, display name, publisher (`fu-chen`), version, engine, categories, keywords, scripts, contributes theme entry
- **Build integrity**: parts/ files exist, builder runs successfully, output matches shipped theme
- **Error handling**: duplicate color keys, missing files, invalid JSON, write failures
- **Palette contract**: exact hex values for ~40+ workbench/terminal/editor colors
- **Token colors**: all 10 TextMate rules and 4 semantic token overrides
- **Documentation**: README contains required sections (installation, release publishing, VSCE_PAT, build commands)
- **Packaging**: .vscodeignore excludes internal scaffolding (.agents, .claude, skills-lock.json)
- **CI/CD**: workflow triggers on release.published, validates tag↔version match, uses VSCE_PAT

## Conventions

- Publisher ID: `fu-chen`
- Repository: `https://github.com/aifuxi/black-metal-vscode-theme.git`
- License: MIT
- `.vscodeignore` excludes: `tests/`, `docs/`, `parts/`, `scripts/`, `.superpowers/`, `.agents/`, `.claude/`, `skills-lock.json`, `.gitignore`, `.git/`, `.github/`, `.worktrees/`, `node_modules/`, `package-lock.json`, `*.vsix`
- Accent color `#486e6f` is reserved for structural emphasis (focus, active, selected states) — do not use for broad syntax categories
- Theme is `vs-dark` type (dark theme)
- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`)

## Common Pitfalls

- Do not edit `themes/black-metal-color-theme.json` directly — always edit `parts/` then rebuild
- Do not add duplicate color keys across `colors-editor.json`, `colors-ui.json`, and `colors-terminal.json` — the builder will fail
- The lock file is `bun.lock` (Bun format), not `package-lock.json`
- Publisher ID is `fu-chen`, matching `package.json`
- `vscode:prepublish` hook auto-runs `build:theme` before packaging — no manual rebuild needed for `.vsix`
