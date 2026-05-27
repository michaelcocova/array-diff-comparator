import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

function readPackageVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson.version || "0.0.0";
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function getLatestTag() {
  return runGit(["describe", "--tags", "--abbrev=0"]);
}

function getCommitSubjects(latestTag) {
  const range = latestTag ? `${latestTag}..HEAD` : "HEAD";
  const output = runGit(["log", "--pretty=format:%s", range]);
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeCommitLine(subject) {
  return `- ${subject}`;
}

function renderSection(version, commitSubjects) {
  const lines = commitSubjects.map(normalizeCommitLine);

  return [`## ${version}`, "", ...lines, ""].join("\n");
}

function buildChangelog(version, section) {
  const header = ["# Changelog", "", "本项目的变更记录会维护在这个文件中。", "\n", "\n"].join("\n");

  if (!fs.existsSync(changelogPath)) {
    return `${header}${section}`;
  }

  const current = fs.readFileSync(changelogPath, "utf8");
  if (current.includes(`## ${version}`)) {
    return current;
  }

  const body = current.startsWith("# Changelog") ? current.replace(header, "") : current;
  return `${header}${section}${body.trimStart()}\n`;
}

const version = readPackageVersion();
const latestTag = getLatestTag();
const commitSubjects = getCommitSubjects(latestTag);
const section = renderSection(version, commitSubjects);
const nextContent = buildChangelog(version, section);

fs.writeFileSync(changelogPath, nextContent, "utf8");
process.stdout.write(`Updated CHANGELOG.md for version ${version}\n`);
