const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'package.json');
const themePath = path.join(rootDir, 'themes', 'black-metal-color-theme.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('package metadata contributes the Black Metal theme', () => {
  assert.ok(fs.existsSync(packagePath), 'package.json should exist');

  const pkg = readJson(packagePath);

  assert.equal(pkg.name, 'black-metal-vscode-theme');
  assert.equal(pkg.displayName, 'Black Metal');
  assert.equal(pkg.description, "A VS Code theme adapted from Ghostty's Black Metal palette.");
  assert.equal(pkg.version, '0.1.0');
  assert.equal(pkg.publisher, 'local');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines.vscode, '^1.90.0');
  assert.deepEqual(pkg.categories, ['Themes']);
  assert.deepEqual(pkg.keywords, ['theme', 'dark theme', 'black metal', 'ghostty', 'vscode']);
  assert.equal(pkg.contributes.themes.length, 1);
  assert.equal(pkg.contributes.themes[0].label, 'Black Metal');
  assert.equal(pkg.contributes.themes[0].uiTheme, 'vs-dark');
  assert.equal(pkg.contributes.themes[0].path, './themes/black-metal-color-theme.json');
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
  assert.match(readme, /npm test/i);
  assert.match(readme, /terminal ANSI/i);

  assert.match(ignoreFile, /^tests$/m);
  assert.match(ignoreFile, /^docs$/m);
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
