#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const basePath = path.join(rootDir, 'parts', 'base.json');

function main() {
  try {
    const base = fs.readFileSync(basePath, 'utf8');
    JSON.parse(base);
    process.stdout.write('Theme builder scaffold is ready.\n');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.error(`Missing required theme source: ${basePath}`);
    } else {
      console.error(`Invalid JSON in theme source: ${basePath}`);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};
