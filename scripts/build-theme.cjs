#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const partsDir = path.join(rootDir, 'parts');
const themesDir = path.join(rootDir, 'themes');
const outputPath = path.join(themesDir, 'black-metal-color-theme.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`Missing required theme source: ${filePath}`);
    }

    throw new Error(`Invalid JSON in theme source: ${filePath}`);
  }
}

function loadRequiredPart(fileName) {
  const filePath = path.join(partsDir, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required theme source: ${filePath}`);
  }

  return readJson(filePath);
}

function buildTheme() {
  const base = loadRequiredPart('base.json');
  const editorColors = loadRequiredPart('colors-editor.json');
  const uiColors = loadRequiredPart('colors-ui.json');
  const terminalColors = loadRequiredPart('colors-terminal.json');
  const tokenColors = loadRequiredPart('tokens.json');
  const semanticTokenColors = loadRequiredPart('semantic.json');

  const theme = {
    ...base,
    colors: {
      ...editorColors,
      ...uiColors,
      ...terminalColors
    },
    tokenColors
  };

  if (Object.keys(semanticTokenColors).length > 0) {
    theme.semanticTokenColors = semanticTokenColors;
  }

  return theme;
}

function main() {
  try {
    const theme = buildTheme();

    fs.mkdirSync(themesDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
