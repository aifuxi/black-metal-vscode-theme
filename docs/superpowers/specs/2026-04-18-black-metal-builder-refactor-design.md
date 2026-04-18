# Black Metal Builder Refactor Design

## Goal

Refactor the Black Metal VS Code theme repository from a hand-maintained single theme JSON into a source-driven builder workflow based on `parts/` inputs and a generated `themes/black-metal-color-theme.json` output.

The refactor must preserve the current visual result of the theme. This is a maintenance and workflow redesign, not a visual redesign.

## Context

The repository currently ships a valid theme extension with a single committed theme file at `themes/black-metal-color-theme.json`. That structure is simple, but it creates a poor editing experience as the theme grows:

- workbench colors, editor colors, terminal colors, token colors, and semantic colors all live in one file
- updates are harder to review because intent is mixed together
- the repository now includes a `vscode-theme` skill scaffold and builder, but the main project does not use that workflow

This leaves the codebase in an inconsistent state: the repository contains a builder-oriented pattern and a hand-maintained production theme at the same time.

## User-Approved Direction

- Use the full `parts + merge/build` workflow
- Do not maintain dual sources of truth
- Preserve the current Black Metal appearance and extension behavior
- Keep the generated theme file committed so VS Code can consume it directly and diffs remain reviewable

## Scope

This refactor includes:

- introducing a canonical `parts/` directory for theme source data
- making the final theme JSON a generated artifact
- wiring package scripts around the builder workflow
- updating tests to validate both generation and final theme behavior
- updating README instructions to describe the new maintenance flow

This refactor does not include:

- changing the Black Metal palette or style direction
- adding new theme variants
- introducing marketplace assets or publishing automation
- expanding language coverage beyond what the current theme already defines

## Repository Shape

The target repository structure is:

```text
.
├── package.json
├── README.md
├── parts/
│   ├── base.json
│   ├── colors-editor.json
│   ├── colors-terminal.json
│   ├── colors-ui.json
│   ├── semantic.json
│   └── tokens.json
├── scripts/
│   └── build-theme.cjs
├── tests/
│   └── theme.test.cjs
└── themes/
    └── black-metal-color-theme.json
```

Notes:

- `parts/` is the only hand-edited theme source
- `themes/black-metal-color-theme.json` remains in git, but is treated as generated output
- the builder entrypoint should live inside the project itself, not only inside the skill directory, so the repository remains self-contained

## Builder Design

The builder is responsible for:

1. Reading `parts/base.json`
2. Merging the color sections from `parts/colors-editor.json`, `parts/colors-ui.json`, and `parts/colors-terminal.json`
3. Reading `parts/tokens.json`
4. Reading `parts/semantic.json`
5. Producing `themes/black-metal-color-theme.json`

The output schema must remain the standard VS Code theme structure:

- `name`
- `type`
- `semanticHighlighting` when defined
- `colors`
- `tokenColors`
- `semanticTokenColors` when non-empty

The merge must be deterministic. Running the build repeatedly without changing `parts/` should produce identical output bytes aside from intentional formatting.

## Source of Truth Rules

To avoid drift, the repository should follow these rules:

- developers edit `parts/`, not `themes/black-metal-color-theme.json`
- tests may read both source and generated files, but assertions about authored intent should prefer `parts/`
- package metadata continues to point VS Code at `./themes/black-metal-color-theme.json`
- when the theme changes, the generated file is rebuilt and committed in the same change

This keeps the extension consumable while making maintenance disciplined.

## Script Design

`package.json` should expose a small, explicit workflow:

- `build:theme`
  - runs the project-local builder to regenerate the theme JSON
- `test`
  - runs the test suite

If a packaging script is added later, it should depend on the generated theme already being present rather than hiding generation implicitly.

## Testing Strategy

The tests should be reorganized around two responsibilities.

### 1. Build integrity

The suite should verify that:

- required `parts/` files exist
- the builder output exists and has the expected top-level shape
- merged output reflects the data authored in `parts/`

This makes generation failures easy to diagnose.

### 2. Theme contract

The suite should continue to verify the important Black Metal guarantees:

- package metadata contributes the expected theme
- README and packaging files describe the extension correctly
- key workbench colors still match the approved palette
- key editor interaction colors remain intact
- token colors and semantic tokens preserve the current syntax strategy

The intent is to keep behavior-focused assertions while reducing coupling to one manually edited monolith.

## Migration Plan

Implementation should proceed in this order:

1. Add a failing test that expects the repository to have canonical `parts/` inputs and a project-local build flow
2. Introduce the builder entrypoint and `parts/` directory by extracting the current theme into source sections
3. Generate `themes/black-metal-color-theme.json` from those source files
4. Update package scripts and README to describe the new workflow
5. Expand or adjust tests so they validate both source-driven generation and the existing Black Metal visual contract

This order keeps the refactor grounded in observable behavior instead of file moving alone.

## Error Handling and Failure Modes

The builder should fail fast when:

- a required source file is missing
- a source file contains invalid JSON
- merged output cannot be written

Failure messages should name the missing or invalid file directly so maintenance stays cheap.

## Compatibility Constraints

The refactor must preserve:

- extension name, display name, and contributed theme path
- current theme filename
- current visual palette and token strategy
- compatibility with the existing `node --test` test setup

If implementation needs to relocate internal helper code, it should do so without requiring a new runtime dependency.

## Success Criteria

The refactor is complete when all of the following are true:

1. `parts/` is the sole authored theme source
2. `themes/black-metal-color-theme.json` is generated from `parts/`
3. the generated file matches the current Black Metal behavior closely enough that existing key palette assertions still pass
4. `npm test` passes from a clean checkout
5. the README tells a maintainer how to rebuild the theme after editing `parts/`

## Risks and Tradeoffs

- Committing generated output adds duplication, but it is the right tradeoff here because VS Code consumes the generated file directly and reviewers benefit from seeing the final artifact
- Keeping tests too literal against the generated JSON could make future maintenance noisy, so test coverage should distinguish authored structure from behavior guarantees
- Reusing the skill's builder code directly from `.agents/` would reduce duplication, but it would make the extension depend on repository-local agent scaffolding; the main project should instead own its own build entrypoint

## Recommendation

Implement the refactor as a full migration to a project-local `parts + build` workflow, with no dual-maintenance path. That produces the cleanest repository model and aligns the Black Metal theme with the skill-backed workflow already present in the repository.
