#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const basePath = path.join(rootDir, 'parts', 'base.json');
const editorColorsPath = path.join(rootDir, 'parts', 'colors-editor.json');
const uiColorsPath = path.join(rootDir, 'parts', 'colors-ui.json');
const terminalColorsPath = path.join(rootDir, 'parts', 'colors-terminal.json');
const tokensPath = path.join(rootDir, 'parts', 'tokens.json');
const semanticPath = path.join(rootDir, 'parts', 'semantic.json');
const themePath = path.join(rootDir, 'themes', 'black-metal-color-theme.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildTheme() {
  return {
    ...readJson(basePath),
    colors: {
      ...readJson(editorColorsPath),
      ...readJson(uiColorsPath),
      ...readJson(terminalColorsPath)
    },
    tokenColors: readJson(tokensPath),
    semanticTokenColors: readJson(semanticPath)
  };
}

function main() {
  try {
    const theme = buildTheme();
    const serializedTheme = `${JSON.stringify(theme, null, 2)}\n`;

    fs.writeFileSync(themePath, serializedTheme);
    process.stdout.write(serializedTheme);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.error(`Missing required theme source: ${error.path}`);
    } else {
      console.error(`Invalid JSON in theme source: ${error.message}`);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildTheme,
  main
};
