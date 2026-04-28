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
    expect(pkg.version).toBe("0.1.0");
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
    expect(result.stderr).toMatch(
      /Duplicate color key "foreground" found in .*colors-editor\.json and .*colors-ui\.json/,
    );
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

  test("core workbench and terminal colors follow the Black Metal palette", () => {
    const theme = readJson(themePath);
    const { colors } = theme;
    const color = (key) => colors[key];

    expect(color("foreground")).toBe("#c1c1c1");
    expect(color("focusBorder")).toBe("#486e6f");
    expect(color("activityBar.background")).toBe("#050505");
    expect(color("activityBar.foreground")).toBe("#c1c1c1");
    expect(color("activityBar.inactiveForeground")).toBe("#888888");
    expect(color("activityBar.activeBorder")).toBe("#486e6f");
    expect(color("sideBar.background")).toBe("#050505");
    expect(color("sideBar.foreground")).toBe("#aaaaaa");
    expect(color("sideBarTitle.foreground")).toBe("#c1c1c1");
    expect(color("titleBar.activeBackground")).toBe("#050505");
    expect(color("titleBar.activeForeground")).toBe("#c1c1c1");
    expect(color("titleBar.inactiveForeground")).toBe("#888888");
    expect(color("list.activeSelectionBackground")).toBe("#111111");
    expect(color("list.activeSelectionForeground")).toBe("#c1c1c1");
    expect(color("list.activeSelectionBorder")).toBe("#486e6f");
    expect(color("editorGroupHeader.tabsBackground")).toBe("#000000");
    expect(color("tab.activeBackground")).toBe("#101010");
    expect(color("tab.activeForeground")).toBe("#c1c1c1");
    expect(color("tab.inactiveForeground")).toBe("#888888");
    expect(color("tab.activeBorderTop")).toBe("#486e6f");
    expect(color("statusBar.background")).toBe("#0f0f0f");
    expect(color("statusBar.foreground")).toBe("#c1c1c1");
    expect(color("panel.background")).toBe("#050505");
    expect(color("notifications.background")).toBe("#050505");
    expect(color("notifications.foreground")).toBe("#c1c1c1");
    expect(color("notificationCenterHeader.background")).toBe("#0f0f0f");
    expect(color("scrollbarSlider.background")).toBe("#40404066");
    expect(color("scrollbarSlider.hoverBackground")).toBe("#40404099");
    expect(color("terminal.background")).toBe("#000000");
    expect(color("terminal.foreground")).toBe("#c1c1c1");
    expect(color("terminal.ansiBlack")).toBe("#000000");
    expect(color("terminal.ansiRed")).toBe("#486e6f");
    expect(color("terminal.ansiGreen")).toBe("#dd9999");
    expect(color("terminal.ansiYellow")).toBe("#a06666");
    expect(color("terminal.ansiBlue")).toBe("#888888");
    expect(color("terminal.ansiMagenta")).toBe("#999999");
    expect(color("terminal.ansiCyan")).toBe("#aaaaaa");
    expect(color("terminal.ansiWhite")).toBe("#c1c1c1");
    expect(color("terminal.ansiBrightBlack")).toBe("#404040");
    expect(color("terminal.ansiBrightRed")).toBe("#486e6f");
    expect(color("terminal.ansiBrightGreen")).toBe("#dd9999");
    expect(color("terminal.ansiBrightYellow")).toBe("#a06666");
    expect(color("terminal.ansiBrightBlue")).toBe("#888888");
    expect(color("terminal.ansiBrightMagenta")).toBe("#999999");
    expect(color("terminal.ansiBrightCyan")).toBe("#aaaaaa");
    expect(color("terminal.ansiBrightWhite")).toBe("#c1c1c1");
  });

  test("editor interaction colors stay readable without breaking the austere palette", () => {
    const theme = readJson(themePath);
    const { colors } = theme;
    const color = (key) => colors[key];

    expect(color("editor.background")).toBe("#000000");
    expect(color("editor.foreground")).toBe("#c1c1c1");
    expect(color("editorCursor.foreground")).toBe("#c1c1c1");
    expect(color("editor.selectionBackground")).toBe("#c1c1c140");
    expect(color("editor.inactiveSelectionBackground")).toBe("#c1c1c126");
    expect(color("editor.selectionHighlightBackground")).toBe("#486e6f22");
    expect(color("editor.lineHighlightBackground")).toBe("#ffffff08");
    expect(color("editor.wordHighlightBackground")).toBe("#aaaaaa14");
    expect(color("editor.wordHighlightStrongBackground")).toBe("#aaaaaa22");
    expect(color("editor.findMatchBackground")).toBe("#a0666644");
    expect(color("editor.findMatchHighlightBackground")).toBe("#a0666626");
    expect(color("editorBracketMatch.background")).toBe("#486e6f20");
    expect(color("editorBracketMatch.border")).toBe("#486e6f66");
    expect(color("editorLineNumber.foreground")).toBe("#555555");
    expect(color("editorLineNumber.activeForeground")).toBe("#999999");
    expect(color("editorIndentGuide.background1")).toBe("#202020");
    expect(color("editorIndentGuide.activeBackground1")).toBe("#404040");
    expect(color("editorWhitespace.foreground")).toBe("#2a2a2a");
    expect(color("editorRuler.foreground")).toBe("#202020");
    expect(color("editorHoverWidget.background")).toBe("#050505");
    expect(color("editorHoverWidget.border")).toBe("#404040");
    expect(color("peekView.border")).toBe("#404040");
    expect(color("peekViewEditor.background")).toBe("#050505");
    expect(color("peekViewResult.background")).toBe("#0a0a0a");
    expect(color("peekViewResult.selectionBackground")).toBe("#111111");
    expect(color("peekViewResult.selectionForeground")).toBe("#c1c1c1");
    expect(color("peekViewTitle.background")).toBe("#0f0f0f");
    expect(color("diffEditor.insertedTextBackground")).toBe("#486e6f22");
    expect(color("diffEditor.removedTextBackground")).toBe("#a0666622");
    expect(color("editorError.foreground")).toBe("#dd9999");
    expect(color("editorWarning.foreground")).toBe("#a06666");
    expect(color("editorInfo.foreground")).toBe("#486e6f");
    expect(color("input.background")).toBe("#0f0f0f");
    expect(color("input.foreground")).toBe("#c1c1c1");
    expect(color("input.border")).toBe("#404040");
    expect(color("dropdown.background")).toBe("#0f0f0f");
    expect(color("dropdown.foreground")).toBe("#c1c1c1");
    expect(color("dropdown.border")).toBe("#404040");
    expect(color("button.background")).toBe("#111111");
    expect(color("button.foreground")).toBe("#c1c1c1");
    expect(color("button.hoverBackground")).toBe("#171717");
    expect(color("badge.background")).toBe("#486e6f");
    expect(color("badge.foreground")).toBe("#f0f0f0");
  });

  test("token colors and semantic tokens match the balanced Black Metal syntax strategy", () => {
    const theme = readJson(themePath);
    const normalizeRule = (rule) => ({
      name: rule.name,
      scope: rule.scope,
      settings: rule.settings,
    });
    const expectedTokenColors = [
      {
        name: "Black Metal - Comments",
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: "#888888" },
      },
      {
        name: "Black Metal - Keywords",
        scope: ["keyword", "storage", "storage.type"],
        settings: { foreground: "#a06666" },
      },
      {
        name: "Black Metal - Strings",
        scope: ["string", "string punctuation.section.embedded"],
        settings: { foreground: "#dd9999" },
      },
      {
        name: "Black Metal - Constants",
        scope: ["constant", "constant.numeric", "constant.language", "constant.character.escape"],
        settings: { foreground: "#dd9999" },
      },
      {
        name: "Black Metal - Variables",
        scope: ["variable", "variable.other.readwrite", "variable.parameter"],
        settings: { foreground: "#c1c1c1" },
      },
      {
        name: "Black Metal - Functions",
        scope: ["entity.name.function", "support.function", "meta.function-call"],
        settings: { foreground: "#aaaaaa" },
      },
      {
        name: "Black Metal - Types",
        scope: ["entity.name.type", "entity.name.class", "support.type", "storage.type.class"],
        settings: { foreground: "#999999" },
      },
      {
        name: "Black Metal - Tags",
        scope: ["entity.name.tag", "entity.other.attribute-name"],
        settings: { foreground: "#aaaaaa" },
      },
      {
        name: "Black Metal - Punctuation",
        scope: ["punctuation", "meta.brace", "meta.delimiter"],
        settings: { foreground: "#999999" },
      },
      {
        name: "Black Metal - Markup",
        scope: ["markup.heading", "markup.bold", "markup.italic", "markup.list"],
        settings: { foreground: "#c1c1c1" },
      },
    ];

    expect(theme.tokenColors.length).toBe(expectedTokenColors.length);
    expect(theme.tokenColors.map(normalizeRule)).toEqual(expectedTokenColors);
    expect(theme.semanticTokenColors).toEqual({
      parameter: {
        foreground: "#c1c1c1",
      },
      property: {
        foreground: "#c1c1c1",
      },
      "variable.readonly": {
        foreground: "#dd9999",
      },
      "type.defaultLibrary": {
        foreground: "#aaaaaa",
      },
    });
  });
});

describe("docs and publishing", () => {
  test("README and .vscodeignore cover installation, publishing, and packaging", () => {
    const readmePath = path.join(rootDir, "README.md");
    const readme = fs.readFileSync(readmePath, "utf8");
    const ignoreFile = fs.readFileSync(vscodeIgnorePath, "utf8");

    expect(readme).toMatch(/Installation/i);
    expect(readme).toMatch(/Release Publishing/i);
    expect(readme).toMatch(/VSCE_PAT/i);
    expect(readme).toMatch(/GitHub repository secrets/i);
    expect(readme).toMatch(/`0\.1\.0` or `v0\.1\.0`/);
    expect(readme).toMatch(/npm test/i);

    expect(ignoreFile).toMatch(/^tests$/m);
    expect(ignoreFile).toMatch(/^docs$/m);
    expect(ignoreFile).toMatch(/^parts$/m);
    expect(ignoreFile).toMatch(/^scripts$/m);
  });

  test("repository and gitignore support publishing from GitHub", () => {
    const pkg = readJson(packagePath);
    const gitignorePath = path.join(rootDir, ".gitignore");

    expect(pkg.repository).toEqual({
      type: "git",
      url: "https://github.com/aifuxi/black-metal-vscode-theme.git",
    });

    expect(fs.existsSync(gitignorePath)).toBeTruthy();

    const gitignore = fs.readFileSync(gitignorePath, "utf8");

    expect(gitignore).toMatch(/^node_modules\/$/m);
    expect(gitignore).toMatch(/^\*\.vsix$/m);
  });

  test("CI workflow triggers on release and validates tag version", () => {
    expect(fs.existsSync(publishWorkflowPath)).toBeTruthy();

    const workflow = fs.readFileSync(publishWorkflowPath, "utf8");

    expect(workflow).toMatch(/on:\s*\n\s*release:\s*\n\s*types:\s*\n\s*-\s*published/m);
    expect(workflow).toMatch(/VSCE_PAT/m);
    expect(workflow).toMatch(/npm test/m);
    expect(workflow).toMatch(/npx @vscode\/vsce publish/m);
    expect(workflow).toMatch(/\$\{RELEASE_TAG#v\}/);
    expect(workflow).toMatch(/if \[ "\$NORMALIZED_RELEASE_TAG" != "\$PACKAGE_VERSION" \]; then/);
  });
});
