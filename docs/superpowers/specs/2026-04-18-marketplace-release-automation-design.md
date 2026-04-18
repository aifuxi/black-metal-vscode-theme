# Marketplace Release Automation Design

## Goal

Add the minimum viable automation needed to publish the Black Metal VS Code theme to the official VS Code Marketplace when a GitHub Release is published.

This work should make release publishing reliable and repeatable without introducing broader CI/CD complexity.

## Context

The repository already has most of the packaging foundations needed for marketplace publishing:

- a valid VS Code theme extension manifest in `package.json`
- a committed generated theme artifact in `themes/black-metal-color-theme.json`
- a `build:theme` script
- a `vscode:prepublish` script that rebuilds the generated theme before packaging/publishing

What is still missing is the release-facing layer:

- the real Marketplace publisher id
- a repository-local `vsce` dependency
- a GitHub Actions workflow that publishes on release
- maintainer documentation for release setup and required secrets

## User-Approved Direction

- Publish to the official VS Code Marketplace
- Trigger publication from GitHub Releases, specifically when a release is published
- Keep this as a minimal release automation flow
- Do not add broader CI automation beyond what is needed for publishing

## Scope

This change includes:

- replacing the placeholder `publisher` value with the real Marketplace publisher id `BlackMetalTheme`
- adding `@vscode/vsce` as a project dependency for packaging/publishing
- adding package scripts for local packaging/publishing entrypoints where useful
- adding a GitHub Actions workflow that publishes on `release.published`
- updating README instructions for release setup, including the required `VSCE_PAT` secret
- adding or updating tests that verify release metadata and scripts

This change does not include:

- adding a full pull-request CI matrix
- publishing to Open VSX
- automated version bumping
- release note generation
- marketplace branding polish such as icons, screenshots, or badges

## Publishing Model

The release flow should be:

1. Maintainer updates the extension version in `package.json`
2. Maintainer pushes changes to GitHub
3. Maintainer creates and publishes a GitHub Release
4. GitHub Actions runs the release workflow
5. The workflow installs dependencies, runs tests, and publishes to the VS Code Marketplace using `vsce`

The trigger should be:

```yaml
on:
  release:
    types:
      - published
```

This is preferred over tag-push publishing because it aligns GitHub Releases with marketplace publication and reduces accidental publishes.

## Repository Changes

### `package.json`

The manifest should be updated to:

- set `"publisher": "BlackMetalTheme"`
- add `@vscode/vsce` to `devDependencies`
- retain `build:theme`
- retain `vscode:prepublish`
- add a local packaging script such as `package:vsix`
- optionally add a local publish script such as `publish:vsce` if it improves maintainability

Recommended script surface:

- `build:theme`
- `vscode:prepublish`
- `package:vsix`
- `publish:vsce`
- `test`

The local publish script should rely on `VSCE_PAT` rather than embedding secrets or prompting.

### GitHub Actions workflow

Add a workflow at:

- `.github/workflows/publish-marketplace.yml`

Responsibilities:

1. Trigger on GitHub Release publication
2. Check out the repository
3. Set up Node.js
4. Install dependencies with `npm ci` when a lockfile is present, otherwise `npm install`
5. Run `npm test`
6. Run `npx @vscode/vsce publish`

The workflow should use:

- `VSCE_PAT` from GitHub repository secrets

The workflow should fail fast if the secret is missing or publishing fails.

## Secret and Credential Model

The repository must document one required secret:

- `VSCE_PAT`

This secret should be created from a Marketplace publishing token with the required publish scope.

The workflow should not store credentials in the repository, workflow file, or package scripts.

## Documentation Changes

`README.md` should include a short release section that explains:

- the extension publishes through GitHub Releases
- the repository secret `VSCE_PAT` must be configured first
- the version in `package.json` must be bumped before creating a release
- local development still uses `npm run build:theme` and `npm test`

The documentation should stay concise and operational.

## Testing Strategy

Tests should verify the release-facing contract where practical:

- `package.json` uses `BlackMetalTheme` as publisher
- `package.json` exposes the expected packaging/publishing scripts
- README documents the GitHub Release and `VSCE_PAT` flow

The implementation should also include at least one verification step outside the test suite:

- run `npm test`
- run `npx @vscode/vsce package` or the equivalent package script to confirm the repository is packageable before claiming the release path is ready

## Compatibility Constraints

The automation must preserve:

- the existing theme packaging behavior
- the `vscode:prepublish` build hook
- the current theme output and test suite

The workflow should assume a standard Linux runner unless there is a concrete need for another OS.

## Risks and Tradeoffs

- GitHub Release publishing depends on a correctly configured secret; this is acceptable for a minimal workflow
- A local publish script may duplicate the workflow publish command, but keeping the command visible in `package.json` improves discoverability
- Not adding Open VSX keeps scope tight, but it means marketplace automation is Microsoft-specific for now

## Success Criteria

The automation is complete when all of the following are true:

1. `package.json` uses the real publisher id `BlackMetalTheme`
2. the repository has a committed workflow that publishes on `release.published`
3. the workflow uses `VSCE_PAT` from GitHub Secrets
4. the repository can be packaged successfully with `vsce`
5. README tells a maintainer how to prepare and trigger an automated release

## Recommendation

Implement a focused GitHub Release based marketplace publishing flow with `@vscode/vsce`, `VSCE_PAT`, and a single release-triggered workflow. This gives the repository a reliable official-marketplace publishing path without introducing unnecessary CI/CD complexity.
