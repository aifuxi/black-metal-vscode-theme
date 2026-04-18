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

test('theme file exists with the expected top-level shape', () => {
  assert.ok(fs.existsSync(themePath), 'theme JSON should exist');

  const theme = readJson(themePath);

  assert.equal(theme.name, 'Black Metal');
  assert.equal(theme.type, 'dark');
  assert.equal(typeof theme.colors, 'object');
  assert.ok(Object.keys(theme.colors).length > 0);
  assert.deepEqual(theme.tokenColors, []);
  assert.deepEqual(theme.semanticTokenColors, {});
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

  assert.equal(colors.editor.background, '#000000');
  assert.equal(colors.editor.foreground, '#c1c1c1');
  assert.equal(colors.editorCursor.foreground, '#c1c1c1');
  assert.equal(colors.editor.selectionBackground, '#c1c1c140');
  assert.equal(colors.editor.inactiveSelectionBackground, '#c1c1c126');
  assert.equal(colors.editor.selectionHighlightBackground, '#486e6f22');
  assert.equal(colors.editor.lineHighlightBackground, '#ffffff08');
  assert.equal(colors.editor.wordHighlightBackground, '#aaaaaa14');
  assert.equal(colors.editor.wordHighlightStrongBackground, '#aaaaaa22');
  assert.equal(colors.editor.findMatchBackground, '#a0666644');
  assert.equal(colors.editor.findMatchHighlightBackground, '#a0666626');
  assert.equal(colors.editorBracketMatch.background, '#486e6f20');
  assert.equal(colors.editorBracketMatch.border, '#486e6f66');
  assert.equal(colors.diffEditor.insertedTextBackground, '#486e6f22');
  assert.equal(colors.diffEditor.removedTextBackground, '#a0666622');
  assert.equal(colors.editorError.foreground, '#dd9999');
  assert.equal(colors.editorWarning.foreground, '#a06666');
  assert.equal(colors.editorInfo.foreground, '#486e6f');
  assert.equal(colors.input.background, '#0f0f0f');
  assert.equal(colors.input.foreground, '#c1c1c1');
  assert.equal(colors.input.border, '#404040');
  assert.equal(colors.dropdown.background, '#0f0f0f');
  assert.equal(colors.dropdown.foreground, '#c1c1c1');
  assert.equal(colors.dropdown.border, '#404040');
  assert.equal(colors.button.background, '#111111');
  assert.equal(colors.button.foreground, '#c1c1c1');
  assert.equal(colors.button.hoverBackground, '#171717');
  assert.equal(colors.badge.background, '#486e6f');
  assert.equal(colors.badge.foreground, '#000000');
});
