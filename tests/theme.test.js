import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const packagePath = path.join(rootDir, "package.json");
const vscodeIgnorePath = path.join(rootDir, ".vscodeignore");
const partsBasePath = path.join(rootDir, "parts", "base.json");
const requiredPartsPaths = [
  path.join(rootDir, "parts", "colors-editor.json"),
  path.join(rootDir, "parts", "colors-ui.json"),
  path.join(rootDir, "parts", "colors-terminal.json"),
  path.join(rootDir, "parts", "tokens.json"),
  path.join(rootDir, "parts", "semantic.json"),
];
const buildScriptPath = path.join(rootDir, "scripts", "build-theme.cjs");
const themePath = path.join(rootDir, "themes", "black-metal-color-theme.json");
const publishWorkflowPath = path.join(rootDir, ".github", "workflows", "publish-marketplace.yml");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function withPatchedFile(filePath, replacement, callback) {
  const original = fs.readFileSync(filePath, "utf8");
  const originalTheme = fs.readFileSync(themePath, "utf8");

  fs.writeFileSync(filePath, replacement);

  try {
    return callback();
  } finally {
    fs.writeFileSync(filePath, original);
    fs.writeFileSync(themePath, originalTheme);
  }
}

describe("package metadata", () => {
  test("contributes the Black Metal theme with expected fields", () => {
    const pkg = readJson(packagePath);

    expect(pkg.name).toBe("black-metal-vscode-theme");
    expect(pkg.publisher).toBe("fu-chen");
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.contributes.themes).toEqual([
      {
        label: "Black Metal",
        uiTheme: "vs-dark",
        path: "./themes/black-metal-color-theme.json",
      },
    ]);
  });

  test("packaging ignores internal agent and Claude scaffolding", () => {
    const vscodeIgnore = fs.readFileSync(vscodeIgnorePath, "utf8");

    expect(vscodeIgnore).toMatch(/^\.agents$/m);
    expect(vscodeIgnore).toMatch(/^\.claude$/m);
    expect(vscodeIgnore).toMatch(/^skills-lock\.json$/m);
  });
});

describe("builder", () => {
  test("theme sources exist and build output matches shipped theme", () => {
    expect(fs.existsSync(partsBasePath)).toBeTruthy();
    for (const requiredPartsPath of requiredPartsPaths) {
      expect(fs.existsSync(requiredPartsPath)).toBeTruthy();
    }
    expect(fs.existsSync(buildScriptPath)).toBeTruthy();

    const buildTheme = require(buildScriptPath);
    expect(typeof buildTheme.main).toBe("function");

    const result = spawnSync(process.execPath, [buildScriptPath], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual(readJson(themePath));
  });

  test("fails when color parts define the same key twice", () => {
    const duplicateColors = `${JSON.stringify(
      {
        foreground: "#123456",
      },
      null,
      2,
    )}\n`;

    const result = withPatchedFile(requiredPartsPaths[1], duplicateColors, () =>
      spawnSync(process.execPath, [buildScriptPath], {
        encoding: "utf8",
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/Duplicate color key "foreground"/);
    expect(result.stderr).toMatch(/colors-editor\.json/);
    expect(result.stderr).toMatch(/colors-ui\.json/);
  });

  test("reports which source file is missing", () => {
    const missingPath = requiredPartsPaths[0];
    const renamedPath = `${missingPath}.tmp`;

    fs.renameSync(missingPath, renamedPath);

    try {
      const result = spawnSync(process.execPath, [buildScriptPath], {
        encoding: "utf8",
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(
        new RegExp(`Missing required theme source: .*${path.basename(missingPath)}`),
      );
    } finally {
      fs.renameSync(renamedPath, missingPath);
    }
  });

  test("reports which source file has invalid JSON", () => {
    const invalidJson = '{\n  "activityBar.background":\n';

    const result = withPatchedFile(requiredPartsPaths[1], invalidJson, () =>
      spawnSync(process.execPath, [buildScriptPath], {
        encoding: "utf8",
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(
      new RegExp(`Invalid JSON in theme source: .*${path.basename(requiredPartsPaths[1])}`),
    );
  });

  test("reports write failures separately from source parsing", () => {
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `
          const fs = require('node:fs');
          const script = require(${JSON.stringify(buildScriptPath)});
          fs.writeFileSync = () => {
            const error = new Error('disk full');
            error.code = 'ENOSPC';
            throw error;
          };
          script.main();
        `,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/Failed to write theme output: .*disk full/);
  });
});

describe("license", () => {
  test("MIT package metadata is matched by a root LICENSE file", () => {
    const pkg = readJson(packagePath);
    const licensePath = path.join(rootDir, "LICENSE");

    expect(pkg.license).toBe("MIT");
    expect(fs.existsSync(licensePath)).toBeTruthy();

    const license = fs.readFileSync(licensePath, "utf8");

    expect(license).toMatch(/MIT License/);
  });
});

describe("theme content", () => {
  test("file exists with the expected top-level shape", () => {
    expect(fs.existsSync(themePath)).toBeTruthy();

    const theme = readJson(themePath);

    expect(theme.name).toBe("Black Metal");
    expect(theme.type).toBe("dark");
    expect(typeof theme.colors).toBe("object");
    expect(Object.keys(theme.colors).length).toBeGreaterThan(0);
    for (const [_key, value] of Object.entries(theme.colors)) {
      expect(typeof value).toBe("string");
    }
    expect(Array.isArray(theme.tokenColors)).toBeTruthy();
    expect(typeof theme.semanticTokenColors).toBe("object");
  });

  test("workbench, editor, and terminal colors match the Black Metal palette", () => {
    const theme = readJson(themePath);
    expect(theme.colors).toMatchSnapshot();
  });

  test("token colors and semantic tokens match the balanced Black Metal syntax strategy", () => {
    const theme = readJson(themePath);
    const normalizeRule = (rule) => ({
      name: rule.name,
      scope: rule.scope,
      settings: rule.settings,
    });

    expect(theme.tokenColors.length).toBeGreaterThan(0);
    expect(theme.tokenColors.map(normalizeRule)).toMatchSnapshot();
    expect(theme.semanticTokenColors).toMatchSnapshot();
  });
});

describe("docs and publishing", () => {
  test("publishing infrastructure is in place", () => {
    const pkg = readJson(packagePath);
    const readmePath = path.join(rootDir, "README.md");
    const readme = fs.readFileSync(readmePath, "utf8");
    const ignoreFile = fs.readFileSync(vscodeIgnorePath, "utf8");
    const gitignorePath = path.join(rootDir, ".gitignore");
    const gitignore = fs.readFileSync(gitignorePath, "utf8");

    // README covers required topics
    expect(readme).toMatch(/## Installation/);
    expect(readme).toMatch(/## Release Publishing/);
    expect(readme).toMatch(/VSCE_PAT/);

    // .vscodeignore excludes build/dev artifacts
    expect(ignoreFile).toMatch(/^tests$/m);
    expect(ignoreFile).toMatch(/^docs$/m);
    expect(ignoreFile).toMatch(/^parts$/m);
    expect(ignoreFile).toMatch(/^scripts$/m);

    // .gitignore excludes generated artifacts
    expect(gitignore).toMatch(/^node_modules\/$/m);
    expect(gitignore).toMatch(/^\*\.vsix$/m);

    // Repository metadata present
    expect(pkg.repository.type).toBe("git");
    expect(pkg.repository.url).toMatch(/black-metal-vscode-theme\.git$/);

    // CI workflow has release trigger and publishing steps
    expect(fs.existsSync(publishWorkflowPath)).toBeTruthy();
    const workflow = fs.readFileSync(publishWorkflowPath, "utf8");
    expect(workflow).toMatch(/release/);
    expect(workflow).toMatch(/published/);
    expect(workflow).toMatch(/VSCE_PAT/);
    expect(workflow).toMatch(/@vscode\/vsce publish/);
  });
});
