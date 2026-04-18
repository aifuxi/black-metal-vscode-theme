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
const colorPartPaths = [editorColorsPath, uiColorsPath, terminalColorsPath];

function readJson(filePath) {
  let source;

  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      error.message = `Missing required theme source: ${filePath}`;
    }

    throw error;
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    error.message = `Invalid JSON in theme source: ${filePath}`;
    throw error;
  }
}

function mergeColorParts(filePaths) {
  const mergedColors = {};
  const keySources = new Map();

  for (const filePath of filePaths) {
    const colors = readJson(filePath);

    for (const [key, value] of Object.entries(colors)) {
      const existingSource = keySources.get(key);
      if (existingSource) {
        throw new Error(`Duplicate color key "${key}" found in ${existingSource} and ${filePath}`);
      }

      keySources.set(key, filePath);
      mergedColors[key] = value;
    }
  }

  return mergedColors;
}

function buildTheme() {
  return {
    ...readJson(basePath),
    colors: mergeColorParts(colorPartPaths),
    tokenColors: readJson(tokensPath),
    semanticTokenColors: readJson(semanticPath)
  };
}

function main() {
  try {
    const theme = buildTheme();
    const serializedTheme = `${JSON.stringify(theme, null, 2)}\n`;

    try {
      fs.writeFileSync(themePath, serializedTheme);
      process.stdout.write(serializedTheme);
    } catch (error) {
      error.message = `Failed to write theme output: ${error.message}`;
      throw error;
    }
  } catch (error) {
    console.error(error.message);
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
