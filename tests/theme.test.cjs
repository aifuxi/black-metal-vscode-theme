const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'package.json');
const vscodeIgnorePath = path.join(rootDir, '.vscodeignore');
const partsBasePath = path.join(rootDir, 'parts', 'base.json');
const requiredPartsPaths = [
  path.join(rootDir, 'parts', 'colors-editor.json'),
  path.join(rootDir, 'parts', 'colors-ui.json'),
  path.join(rootDir, 'parts', 'colors-terminal.json'),
  path.join(rootDir, 'parts', 'tokens.json'),
  path.join(rootDir, 'parts', 'semantic.json')
];
const buildScriptPath = path.join(rootDir, 'scripts', 'build-theme.cjs');
const themePath = path.join(rootDir, 'themes', 'black-metal-color-theme.json');
const publishWorkflowPath = path.join(rootDir, '.github', 'workflows', 'publish-marketplace.yml');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function withPatchedFile(filePath, replacement, callback) {
  const original = fs.readFileSync(filePath, 'utf8');
  const originalTheme = fs.readFileSync(themePath, 'utf8');

  fs.writeFileSync(filePath, replacement);

  try {
    return callback();
  } finally {
    fs.writeFileSync(filePath, original);
    fs.writeFileSync(themePath, originalTheme);
  }
}

test('package metadata contributes the Black Metal theme', () => {
  assert.ok(fs.existsSync(packagePath), 'package.json should exist');

  const pkg = readJson(packagePath);

  assert.equal(pkg.name, 'black-metal-vscode-theme');
  assert.equal(pkg.displayName, 'Black Metal');
  assert.equal(pkg.description, "A VS Code theme adapted from Ghostty's Black Metal palette.");
  assert.equal(pkg.version, '0.1.0');
  assert.equal(pkg.publisher, 'fu-chen');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines.vscode, '^1.90.0');
  assert.deepEqual(pkg.categories, ['Themes']);
  assert.deepEqual(pkg.keywords, ['theme', 'dark theme', 'black metal', 'ghostty', 'vscode']);
  assert.equal(pkg.scripts['build:theme'], 'node scripts/build-theme.cjs');
  assert.equal(pkg.scripts['vscode:prepublish'], 'npm run build:theme');
  assert.equal(pkg.scripts['package:vsix'], 'vsce package');
  assert.equal(pkg.scripts['publish:vsce'], 'vsce publish');
  assert.equal(pkg.scripts.test, 'node --test tests/theme.test.cjs');
  assert.equal(pkg.devDependencies['@vscode/vsce'], '^3.6.2');
  assert.equal(pkg.contributes.themes.length, 1);
  assert.equal(pkg.contributes.themes[0].label, 'Black Metal');
  assert.equal(pkg.contributes.themes[0].uiTheme, 'vs-dark');
  assert.equal(pkg.contributes.themes[0].path, './themes/black-metal-color-theme.json');
});

test('packaging ignores internal agent and Claude scaffolding', () => {
  const vscodeIgnore = fs.readFileSync(vscodeIgnorePath, 'utf8');

  assert.match(vscodeIgnore, /^\.agents$/m);
  assert.match(vscodeIgnore, /^\.claude$/m);
  assert.match(vscodeIgnore, /^skills-lock\.json$/m);
});

test('project-local theme sources exist for the builder workflow', () => {
  assert.ok(fs.existsSync(partsBasePath), 'parts/base.json should exist');
  for (const requiredPartsPath of requiredPartsPaths) {
    assert.ok(fs.existsSync(requiredPartsPath), `${path.relative(rootDir, requiredPartsPath)} should exist`);
  }
  assert.ok(fs.existsSync(buildScriptPath), 'scripts/build-theme.cjs should exist');

  const buildTheme = require(buildScriptPath);
  assert.equal(typeof buildTheme.main, 'function');

  const result = spawnSync(process.execPath, [buildScriptPath], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.deepEqual(
    JSON.parse(result.stdout),
    readJson(themePath)
  );
});

test('builder output stays in parity with the shipped theme file', () => {
  const result = spawnSync(process.execPath, [buildScriptPath], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), readJson(themePath));
});

test('builder fails when color parts define the same key twice', () => {
  const duplicateColors = `${JSON.stringify({
    foreground: '#123456'
  }, null, 2)}\n`;

  const result = withPatchedFile(requiredPartsPaths[1], duplicateColors, () =>
    spawnSync(process.execPath, [buildScriptPath], {
      encoding: 'utf8'
    })
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(
    result.stderr,
    /Duplicate color key "foreground" found in .*colors-editor\.json and .*colors-ui\.json/
  );
});

test('builder reports which source file is missing', () => {
  const missingPath = requiredPartsPaths[0];
  const renamedPath = `${missingPath}.tmp`;

  fs.renameSync(missingPath, renamedPath);

  try {
    const result = spawnSync(process.execPath, [buildScriptPath], {
      encoding: 'utf8'
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`Missing required theme source: .*${path.basename(missingPath)}`));
  } finally {
    fs.renameSync(renamedPath, missingPath);
  }
});

test('builder reports which source file has invalid JSON', () => {
  const invalidJson = '{\n  "activityBar.background":\n';

  const result = withPatchedFile(requiredPartsPaths[1], invalidJson, () =>
    spawnSync(process.execPath, [buildScriptPath], {
      encoding: 'utf8'
    })
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, new RegExp(`Invalid JSON in theme source: .*${path.basename(requiredPartsPaths[1])}`));
});

test('builder reports write failures separately from source parsing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
        const fs = require('node:fs');
        const script = require(${JSON.stringify(buildScriptPath)});
        fs.writeFileSync = () => {
          const error = new Error('disk full');
          error.code = 'ENOSPC';
          throw error;
        };
        script.main();
      `
    ],
    {
      encoding: 'utf8'
    }
  );

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Failed to write theme output: .*disk full/);
});

test('MIT package metadata is matched by a root LICENSE file', () => {
  const pkg = readJson(packagePath);
  const licensePath = path.join(rootDir, 'LICENSE');

  assert.equal(pkg.license, 'MIT');
  assert.ok(fs.existsSync(licensePath), 'LICENSE should exist when package.json declares MIT');

  const license = fs.readFileSync(licensePath, 'utf8');

  assert.match(license, /MIT License/);
});

test('theme file exists with the expected top-level shape', () => {
  assert.ok(fs.existsSync(themePath), 'theme JSON should exist');

  const theme = readJson(themePath);

  assert.equal(theme.name, 'Black Metal');
  assert.equal(theme.type, 'dark');
  assert.equal(typeof theme.colors, 'object');
  assert.ok(Object.keys(theme.colors).length > 0);
  for (const [key, value] of Object.entries(theme.colors)) {
    assert.equal(typeof value, 'string', `theme.colors.${key} should be a flat string value`);
  }
  assert.ok(Array.isArray(theme.tokenColors));
  assert.equal(typeof theme.semanticTokenColors, 'object');
});

test('core workbench and terminal colors follow the Black Metal palette', () => {
  const theme = readJson(themePath);
  const { colors } = theme;
  const color = (key) => colors[key];

  assert.equal(color('foreground'), '#c1c1c1');
  assert.equal(color('focusBorder'), '#486e6f');
  assert.equal(color('activityBar.background'), '#050505');
  assert.equal(color('activityBar.foreground'), '#c1c1c1');
  assert.equal(color('activityBar.inactiveForeground'), '#888888');
  assert.equal(color('activityBar.activeBorder'), '#486e6f');
  assert.equal(color('sideBar.background'), '#050505');
  assert.equal(color('sideBar.foreground'), '#aaaaaa');
  assert.equal(color('sideBarTitle.foreground'), '#c1c1c1');
  assert.equal(color('titleBar.activeBackground'), '#050505');
  assert.equal(color('titleBar.activeForeground'), '#c1c1c1');
  assert.equal(color('titleBar.inactiveForeground'), '#888888');
  assert.equal(color('list.activeSelectionBackground'), '#111111');
  assert.equal(color('list.activeSelectionForeground'), '#c1c1c1');
  assert.equal(color('list.activeSelectionBorder'), '#486e6f');
  assert.equal(color('editorGroupHeader.tabsBackground'), '#000000');
  assert.equal(color('tab.activeBackground'), '#101010');
  assert.equal(color('tab.activeForeground'), '#c1c1c1');
  assert.equal(color('tab.inactiveForeground'), '#888888');
  assert.equal(color('tab.activeBorderTop'), '#486e6f');
  assert.equal(color('statusBar.background'), '#0f0f0f');
  assert.equal(color('statusBar.foreground'), '#c1c1c1');
  assert.equal(color('panel.background'), '#050505');
  assert.equal(color('notifications.background'), '#050505');
  assert.equal(color('notifications.foreground'), '#c1c1c1');
  assert.equal(color('notificationCenterHeader.background'), '#0f0f0f');
  assert.equal(color('scrollbarSlider.background'), '#40404066');
  assert.equal(color('scrollbarSlider.hoverBackground'), '#40404099');
  assert.equal(color('terminal.background'), '#000000');
  assert.equal(color('terminal.foreground'), '#c1c1c1');
  assert.equal(color('terminal.ansiBlack'), '#000000');
  assert.equal(color('terminal.ansiRed'), '#486e6f');
  assert.equal(color('terminal.ansiGreen'), '#dd9999');
  assert.equal(color('terminal.ansiYellow'), '#a06666');
  assert.equal(color('terminal.ansiBlue'), '#888888');
  assert.equal(color('terminal.ansiMagenta'), '#999999');
  assert.equal(color('terminal.ansiCyan'), '#aaaaaa');
  assert.equal(color('terminal.ansiWhite'), '#c1c1c1');
  assert.equal(color('terminal.ansiBrightBlack'), '#404040');
  assert.equal(color('terminal.ansiBrightRed'), '#486e6f');
  assert.equal(color('terminal.ansiBrightGreen'), '#dd9999');
  assert.equal(color('terminal.ansiBrightYellow'), '#a06666');
  assert.equal(color('terminal.ansiBrightBlue'), '#888888');
  assert.equal(color('terminal.ansiBrightMagenta'), '#999999');
  assert.equal(color('terminal.ansiBrightCyan'), '#aaaaaa');
  assert.equal(color('terminal.ansiBrightWhite'), '#c1c1c1');
});

test('editor interaction colors stay readable without breaking the austere palette', () => {
  const theme = readJson(themePath);
  const { colors } = theme;
  const color = (key) => colors[key];

  assert.equal(color('editor.background'), '#000000');
  assert.equal(color('editor.foreground'), '#c1c1c1');
  assert.equal(color('editorCursor.foreground'), '#c1c1c1');
  assert.equal(color('editor.selectionBackground'), '#c1c1c140');
  assert.equal(color('editor.inactiveSelectionBackground'), '#c1c1c126');
  assert.equal(color('editor.selectionHighlightBackground'), '#486e6f22');
  assert.equal(color('editor.lineHighlightBackground'), '#ffffff08');
  assert.equal(color('editor.wordHighlightBackground'), '#aaaaaa14');
  assert.equal(color('editor.wordHighlightStrongBackground'), '#aaaaaa22');
  assert.equal(color('editor.findMatchBackground'), '#a0666644');
  assert.equal(color('editor.findMatchHighlightBackground'), '#a0666626');
  assert.equal(color('editorBracketMatch.background'), '#486e6f20');
  assert.equal(color('editorBracketMatch.border'), '#486e6f66');
  assert.equal(color('editorLineNumber.foreground'), '#555555');
  assert.equal(color('editorLineNumber.activeForeground'), '#999999');
  assert.equal(color('editorIndentGuide.background1'), '#202020');
  assert.equal(color('editorIndentGuide.activeBackground1'), '#404040');
  assert.equal(color('editorWhitespace.foreground'), '#2a2a2a');
  assert.equal(color('editorRuler.foreground'), '#202020');
  assert.equal(color('editorHoverWidget.background'), '#050505');
  assert.equal(color('editorHoverWidget.border'), '#404040');
  assert.equal(color('peekView.border'), '#404040');
  assert.equal(color('peekViewEditor.background'), '#050505');
  assert.equal(color('peekViewResult.background'), '#0a0a0a');
  assert.equal(color('peekViewResult.selectionBackground'), '#111111');
  assert.equal(color('peekViewResult.selectionForeground'), '#c1c1c1');
  assert.equal(color('peekViewTitle.background'), '#0f0f0f');
  assert.equal(color('diffEditor.insertedTextBackground'), '#486e6f22');
  assert.equal(color('diffEditor.removedTextBackground'), '#a0666622');
  assert.equal(color('editorError.foreground'), '#dd9999');
  assert.equal(color('editorWarning.foreground'), '#a06666');
  assert.equal(color('editorInfo.foreground'), '#486e6f');
  assert.equal(color('input.background'), '#0f0f0f');
  assert.equal(color('input.foreground'), '#c1c1c1');
  assert.equal(color('input.border'), '#404040');
  assert.equal(color('dropdown.background'), '#0f0f0f');
  assert.equal(color('dropdown.foreground'), '#c1c1c1');
  assert.equal(color('dropdown.border'), '#404040');
  assert.equal(color('button.background'), '#111111');
  assert.equal(color('button.foreground'), '#c1c1c1');
  assert.equal(color('button.hoverBackground'), '#171717');
  assert.equal(color('badge.background'), '#486e6f');
  assert.equal(color('badge.foreground'), '#f0f0f0');
});

test('token colors and semantic tokens match the balanced Black Metal syntax strategy', () => {
  const theme = readJson(themePath);
  const normalizeRule = (rule) => ({
    name: rule.name,
    scope: rule.scope,
    settings: rule.settings
  });
  const expectedTokenColors = [
    {
      name: 'Black Metal - Comments',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#888888' }
    },
    {
      name: 'Black Metal - Keywords',
      scope: ['keyword', 'storage', 'storage.type'],
      settings: { foreground: '#a06666' }
    },
    {
      name: 'Black Metal - Strings',
      scope: ['string', 'string punctuation.section.embedded'],
      settings: { foreground: '#dd9999' }
    },
    {
      name: 'Black Metal - Constants',
      scope: ['constant', 'constant.numeric', 'constant.language', 'constant.character.escape'],
      settings: { foreground: '#dd9999' }
    },
    {
      name: 'Black Metal - Variables',
      scope: ['variable', 'variable.other.readwrite', 'variable.parameter'],
      settings: { foreground: '#c1c1c1' }
    },
    {
      name: 'Black Metal - Functions',
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#aaaaaa' }
    },
    {
      name: 'Black Metal - Types',
      scope: ['entity.name.type', 'entity.name.class', 'support.type', 'storage.type.class'],
      settings: { foreground: '#999999' }
    },
    {
      name: 'Black Metal - Tags',
      scope: ['entity.name.tag', 'entity.other.attribute-name'],
      settings: { foreground: '#aaaaaa' }
    },
    {
      name: 'Black Metal - Punctuation',
      scope: ['punctuation', 'meta.brace', 'meta.delimiter'],
      settings: { foreground: '#999999' }
    },
    {
      name: 'Black Metal - Markup',
      scope: ['markup.heading', 'markup.bold', 'markup.italic', 'markup.list'],
      settings: { foreground: '#c1c1c1' }
    }
  ];

  assert.equal(theme.tokenColors.length, expectedTokenColors.length);
  assert.deepEqual(theme.tokenColors.map(normalizeRule), expectedTokenColors);
  assert.deepEqual(theme.semanticTokenColors, {
    parameter: {
      foreground: '#c1c1c1'
    },
    property: {
      foreground: '#c1c1c1'
    },
    'variable.readonly': {
      foreground: '#dd9999'
    },
    'type.defaultLibrary': {
      foreground: '#aaaaaa'
    }
  });
});

test('documentation and packaging files describe and ship the theme cleanly', () => {
  const readmePath = path.join(rootDir, 'README.md');
  const ignorePath = path.join(rootDir, '.vscodeignore');

  assert.ok(fs.existsSync(readmePath), 'README.md should exist');
  assert.ok(fs.existsSync(ignorePath), '.vscodeignore should exist');

  const readme = fs.readFileSync(readmePath, 'utf8');
  const ignoreFile = fs.readFileSync(ignorePath, 'utf8');

  assert.match(readme, /Ghostty/i);
  assert.match(readme, /Black Metal/i);
  assert.match(readme, /Installation/i);
  assert.match(readme, /npm run build:theme/i);
  assert.match(readme, /npm run vscode:prepublish/i);
  assert.match(readme, /edit `parts\/`/i);
  assert.match(readme, /terminal ANSI/i);
  assert.match(readme, /Release Publishing/i);
  assert.match(readme, /GitHub Release/i);
  assert.match(readme, /VSCE_PAT/i);
  assert.match(readme, /fu-chen/i);
  assert.match(readme, /package\.json/i);
  assert.match(readme, /npx @vscode\/vsce package/i);
  assert.match(readme, /npm test/i);

  assert.match(ignoreFile, /^tests$/m);
  assert.match(ignoreFile, /^docs$/m);
  assert.match(ignoreFile, /^parts$/m);
  assert.match(ignoreFile, /^scripts$/m);
  assert.match(ignoreFile, /^\.superpowers$/m);
  assert.match(ignoreFile, /^\.gitignore$/m);
});

test('repository metadata and gitignore entries support publishing from GitHub', () => {
  const pkg = readJson(packagePath);
  const gitignorePath = path.join(rootDir, '.gitignore');

  assert.deepEqual(pkg.repository, {
    type: 'git',
    url: 'https://github.com/aifuxi/black-metal-vscode-theme.git'
  });

  assert.ok(fs.existsSync(gitignorePath), '.gitignore should exist');

  const gitignore = fs.readFileSync(gitignorePath, 'utf8');

  assert.match(gitignore, /^\.superpowers\/$/m);
  assert.match(gitignore, /^docs\/superpowers\/plans\/$/m);
  assert.match(gitignore, /^node_modules\/$/m);
  assert.match(gitignore, /^\*\.vsix$/m);
  assert.match(gitignore, /^\.DS_Store$/m);
});

test('release publishing workflow triggers on release.published and uses VSCE_PAT, npm test, and vsce publish', () => {
  assert.ok(fs.existsSync(publishWorkflowPath), '.github/workflows/publish-marketplace.yml should exist');

  const workflow = fs.readFileSync(publishWorkflowPath, 'utf8');

  assert.match(workflow, /on:\s*\n\s*release:\s*\n\s*types:\s*\n\s*-\s*published/m);
  assert.match(workflow, /Validate release metadata/);
  assert.match(workflow, /github\.event\.release\.prerelease/);
  assert.match(workflow, /github\.event\.release\.tag_name/);
  assert.match(workflow, /package\.json/);
  assert.match(workflow, /VSCE_PAT/m);
  assert.match(workflow, /npm test/m);
  assert.match(workflow, /npx @vscode\/vsce publish/m);
});

test('release publishing workflow accepts both bare and v-prefixed release tags for the package version', () => {
  const workflow = fs.readFileSync(publishWorkflowPath, 'utf8');

  assert.match(workflow, /\$\{RELEASE_TAG#v\}/);
  assert.match(workflow, /NORMALIZED_RELEASE_TAG="\$\{RELEASE_TAG#v\}"/);
  assert.match(workflow, /if \[ "\$NORMALIZED_RELEASE_TAG" != "\$PACKAGE_VERSION" \]; then/);
});

test('release publishing docs name the GitHub repository secrets location and accepted tag formats', () => {
  const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');

  assert.match(readme, /GitHub repository secrets/i);
  assert.match(readme, /`VSCE_PAT`/);
  assert.match(readme, /`0\.1\.0` or `v0\.1\.0`/);
});
