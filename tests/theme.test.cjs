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
  assert.deepEqual(theme.colors, {});
  assert.deepEqual(theme.tokenColors, []);
  assert.deepEqual(theme.semanticTokenColors, {});
});
