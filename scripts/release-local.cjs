const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const packagePath = path.join(rootDir, "package.json");
const readmePath = path.join(rootDir, "README.md");
const validReleaseTypes = new Set(["patch", "minor", "major"]);

function bumpVersion(version, releaseType = "patch") {
  if (!validReleaseTypes.has(releaseType)) {
    throw new Error(`Invalid release type "${releaseType}". Use patch, minor, or major.`);
  }

  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version "${version}". Expected x.y.z.`);
  }

  const next = match.slice(1).map(Number);

  if (releaseType === "major") {
    next[0] += 1;
    next[1] = 0;
    next[2] = 0;
  } else if (releaseType === "minor") {
    next[1] += 1;
    next[2] = 0;
  } else {
    next[2] += 1;
  }

  return next.join(".");
}

function parseReleaseType(args) {
  const releaseType = args[0] || "patch";

  if (!validReleaseTypes.has(releaseType)) {
    throw new Error(`Invalid release type "${releaseType}". Use patch, minor, or major.`);
  }

  return releaseType;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${details ? `:\n${details}` : ""}`);
  }

  return result.stdout.trim();
}

function ensureCleanWorkingTree() {
  const status = runCommand("git", ["status", "--porcelain"]);

  if (status) {
    throw new Error(`Working tree must be clean before preparing a local release:\n${status}`);
  }
}

function parseSemverTag(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag);

  if (!match) {
    return null;
  }

  return {
    tag,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemverTags(left, right) {
  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch ||
    left.tag.localeCompare(right.tag)
  );
}

function getLatestSemverTag() {
  const tags = runCommand("git", ["tag", "--list"])
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map(parseSemverTag)
    .filter(Boolean)
    .toSorted(compareSemverTags);

  return tags.at(-1)?.tag || null;
}

function getCommitEntries(fromTag) {
  const range = fromTag ? `${fromTag}..HEAD` : "HEAD";
  const output = runCommand("git", ["log", "--no-merges", "--format=%h%x09%s", range]);

  if (!output) {
    return [];
  }

  return output.split("\n").map((line) => {
    const [hash, ...subjectParts] = line.split("\t");

    return {
      hash,
      subject: subjectParts.join("\t").trim(),
    };
  });
}

function formatChangelogEntry(version, date, commits) {
  const lines = [`### ${version} - ${date}`, ""];

  if (commits.length === 0) {
    lines.push("- No code changes since previous release.");
  } else {
    for (const commit of commits) {
      lines.push(`- ${commit.subject} (\`${commit.hash}\`)`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function insertChangelog(readme, entry) {
  const changelogHeader = "## Changelog";
  const paletteHeader = "## Palette Source";

  if (readme.includes(changelogHeader)) {
    return readme.replace(`${changelogHeader}\n\n`, `${changelogHeader}\n\n${entry}\n`);
  }

  if (readme.includes(paletteHeader)) {
    return readme.replace(paletteHeader, `${changelogHeader}\n\n${entry}\n${paletteHeader}`);
  }

  return `${readme.trimEnd()}\n\n${changelogHeader}\n\n${entry}`;
}

function updatePackageVersion(nextVersion) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.version = nextVersion;
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function updateReadmeChangelog(nextVersion, commits, date = new Date()) {
  const releaseDate = date.toISOString().slice(0, 10);
  const entry = formatChangelogEntry(nextVersion, releaseDate, commits);
  const readme = fs.readFileSync(readmePath, "utf8");
  fs.writeFileSync(readmePath, insertChangelog(readme, entry));
}

function main() {
  const releaseType = parseReleaseType(process.argv.slice(2));
  ensureCleanWorkingTree();

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const nextVersion = bumpVersion(pkg.version, releaseType);
  const latestTag = getLatestSemverTag();
  const commits = getCommitEntries(latestTag);

  updatePackageVersion(nextVersion);
  updateReadmeChangelog(nextVersion, commits);

  const validationCommands = [
    ["npm", ["test"]],
    ["npm", ["run", "lint"]],
    ["npm", ["run", "fmt:check"]],
    ["npm", ["run", "package:vsix"]],
  ];

  for (const [command, args] of validationCommands) {
    runCommand(command, args, { stdio: "inherit" });
  }

  console.log(`Prepared Black Metal ${nextVersion} local release.`);
  console.log(`Generated black-metal-vscode-theme-${nextVersion}.vsix.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  bumpVersion,
  formatChangelogEntry,
  insertChangelog,
  parseReleaseType,
  parseSemverTag,
};
