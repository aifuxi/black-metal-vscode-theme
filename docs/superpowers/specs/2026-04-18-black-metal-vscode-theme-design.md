# Black Metal VS Code Theme Design

## Goal

Create a complete VS Code workbench theme inspired by Ghostty's Black Metal palette, preserving the stark black-and-gray aesthetic while adding a restrained semantic layer so the theme remains usable across the full VS Code interface.

## Source Palette

### Ghostty base colors

- `background`: `#000000`
- `foreground`: `#c1c1c1`
- `cursor-color`: `#c1c1c1`
- `cursor-text`: `#8e8e8e`
- `selection-background`: `#c1c1c1`
- `selection-foreground`: `#000000`

### ANSI palette

- `0`: `#000000`
- `1`: `#486e6f`
- `2`: `#dd9999`
- `3`: `#a06666`
- `4`: `#888888`
- `5`: `#999999`
- `6`: `#aaaaaa`
- `7`: `#c1c1c1`
- `8`: `#404040`
- `9`: `#486e6f`
- `10`: `#dd9999`
- `11`: `#a06666`
- `12`: `#888888`
- `13`: `#999999`
- `14`: `#aaaaaa`
- `15`: `#c1c1c1`

## User-Approved Direction

- Theme scope: complete VS Code workbench theme, not editor-only
- Adaptation style: enhanced edition based on the Ghostty palette
- UI mood: extremely restrained black/gray chrome
- Syntax mood: balanced highlighting, with clear distinctions but no loud rainbow effect
- Accent strategy:
  - `#486e6f` is reserved for structural emphasis such as active, selected, or focused states
  - `#dd9999` and `#a06666` are reserved mainly for semantic/editor meaning such as strings, diagnostics, and diffs

## Architecture

The repository will be structured as a standard VS Code color theme extension with a minimal, maintainable layout:

- `package.json`
  - Declares extension metadata and contributes the theme entry
- `themes/black-metal-color-theme.json`
  - Holds the full theme definition
  - Contains `colors`, `tokenColors`, and a small `semanticTokenColors` section where it improves editor clarity
- `README.md`
  - Documents the palette source, design intent, installation, and preview notes
- Optional small asset files
  - Only if needed for marketplace presentation, such as an icon or screenshots later

The initial implementation should keep the theme definition in one primary JSON file instead of splitting by subsystem. This is simpler for a first release and matches how many VS Code theme extensions are distributed. Organization inside the JSON should still be deliberate, grouped by workbench and editor concerns.

## Color Mapping Strategy

### Base surfaces

VS Code needs more surface separation than Ghostty. The theme will therefore preserve `#000000` as the true base while introducing a few near-black support surfaces for hierarchy:

- Base background: `#000000`
- Surface 1: around `#050505`
- Surface 2: around `#0f0f0f`
- Surface 3: around `#151515`

These support surfaces are derived for usability, not to change the core aesthetic. They allow the activity bar, sidebar, tabs, editors, and panels to remain distinguishable without abandoning the Black Metal look.

### Neutral text and borders

- Primary foreground: `#c1c1c1`
- High-secondary text: `#aaaaaa`
- Secondary text: `#999999`
- Muted text: `#888888`
- Borders and separators: `#404040`

These neutrals will carry most of the interface, ensuring the UI feels predominantly monochrome.

### Accent and semantic colors

- Structural accent: `#486e6f`
  - Used for active outlines, selected states, focus cues, active tab indicators, and similar hierarchy signals
- Semantic warm accent: `#dd9999`
  - Used for strings, positive semantic contrast inside the editor, and some terminal ANSI slots
- Semantic deep warm accent: `#a06666`
  - Used for keywords, diagnostics, diff emphasis, and other semantic states that need separation without becoming saturated

The key rule is that accent colors do not flood the chrome. They appear intentionally and sparingly.

## Workbench Coverage

The first version should cover the workbench areas that matter in everyday use:

- Activity bar
- Side bar
- Explorer/list states
- Editor group and tabs
- Panel and terminal panel
- Status bar and title bar
- Input controls, dropdowns, buttons, and badges
- Notifications and hover surfaces
- Scrollbars
- Peek view
- Search highlighting
- Diff editor colors
- Editor rulers, line highlights, selections, guides, and bracket match visuals

### Workbench behavior rules

- Most chrome surfaces remain black or near-black
- Active and focused states use restrained teal signaling rather than large filled areas
- Inactive text should stay legible but subdued
- Borders should remain subtle and avoid creating a grid-heavy feeling
- Feedback colors such as error, warning, and info may use darkened semantic variants if needed for legibility, but they should still feel part of the same palette family

## Editor and Terminal Coverage

### Editor core

- Editor background: `#000000`
- Editor foreground: `#c1c1c1`
- Cursor: `#c1c1c1`
- Selection model:
  - Inspired by Ghostty's inverse selection
  - Adapted slightly to reduce glare during large selections in VS Code
- Current line, search match, word highlight, and bracket match:
  - Prefer dark overlays and restrained contrast
  - Avoid large teal or rose blocks that would dominate the page

### Terminal

The integrated terminal should map the ANSI palette as directly as possible so the VS Code terminal remains visually aligned with Ghostty's Black Metal theme.

## Syntax Highlighting Strategy

The editor should read as balanced rather than loud.

### Principles

- Default source text stays on the neutral gray ramp
- Comments are clearly muted
- Strings and constants carry the warmer `#dd9999` tone
- Keywords use `#a06666`
- Types, classes, and some identifiers use gray differentiation rather than bright color jumps
- Function and method names should be slightly lifted in contrast, but not neonized
- `#486e6f` should be used sparingly in code, not as a broad language category color

### Initial token categories

The first release should explicitly cover common TextMate scopes for:

- Comments
- Keywords and storage modifiers
- Strings
- Numbers and constants
- Variables and parameters
- Functions and methods
- Classes, types, and interfaces
- Tags and attributes
- Regular expressions
- Punctuation and delimiters where helpful
- Markdown basics
- JSON property names and values

### Semantic tokens

Semantic token support should be additive, not foundational. The theme must remain coherent even in languages or environments where semantic tokens are incomplete or disabled.

## Deliverables

The initial deliverable set is:

- A functional VS Code theme extension scaffold
- A complete `black-metal` theme JSON
- Workbench coverage for common UI surfaces
- Token color coverage for common language categories
- Terminal ANSI mapping aligned with Ghostty
- A README describing usage and design intent

## Testing and Validation

Success for the first implementation is defined by these checks:

1. The workbench feels clearly Black Metal: mostly black and gray, with restrained accent placement
2. Navigation hierarchy is clear in tabs, sidebars, lists, and focus states
3. Editor reading remains comfortable for normal coding sessions
4. Syntax is distinct enough to scan quickly without looking overly colorful
5. Integrated terminal colors match the Ghostty source palette closely
6. The extension installs and appears correctly in VS Code as a selectable dark theme

## Out of Scope for the First Pass

- Exhaustive hand-tuning for every niche language scope
- Multiple theme variants
- Marketplace polish beyond a usable README and basic metadata
- Radical separation of theme data into many files

## Implementation Notes for the Next Phase

- Start from a minimal extension scaffold, then build theme data incrementally
- Prioritize workbench completeness over obscure token coverage
- Prefer explicit token mappings over speculative semantic richness
- Verify the theme in a real VS Code window before calling it complete
