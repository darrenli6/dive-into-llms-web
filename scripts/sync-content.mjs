#!/usr/bin/env node
/**
 * Fetch the pinned public fork into content/upstream (no .git in the snapshot).
 * If a correct snapshot already exists, this is a no-op.
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = path.join(root, "source.lock");
const dest = path.join(root, "content", "upstream");
const stamp = path.join(root, "content", "SOURCE_COMMIT");

function readLock() {
  const text = fs.readFileSync(lockPath, "utf8");
  const repo = (text.match(/^repo=(.+)$/m) || [])[1]?.trim();
  const commit = (text.match(/^commit=(.+)$/m) || [])[1]?.trim();
  if (!repo || !commit) throw new Error("source.lock must contain repo= and commit=");
  return { repo, commit };
}

function currentStamp() {
  return fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
}

function hasTree(commit) {
  return (
    currentStamp() === commit &&
    fs.existsSync(path.join(dest, "README.md")) &&
    fs.existsSync(path.join(dest, "documents"))
  );
}

const { repo, commit } = readLock();
if (hasTree(commit)) {
  console.log(`content/upstream already at ${commit}`);
  process.exit(0);
}

const tmp = path.join(root, ".cache", "upstream-git");
fs.mkdirSync(path.dirname(tmp), { recursive: true });

function git(args, cwd) {
  execFileSync("git", args, { cwd, stdio: "inherit" });
}

if (fs.existsSync(path.join(tmp, ".git"))) {
  git(["remote", "set-url", "origin", repo], tmp);
  git(["fetch", "--depth", "1", "origin", commit], tmp);
  git(["checkout", "--force", "--detach", "FETCH_HEAD"], tmp);
} else {
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  git(["init"], tmp);
  git(["remote", "add", "origin", repo], tmp);
  git(["fetch", "--depth", "1", "origin", commit], tmp);
  git(["checkout", "--force", "--detach", "FETCH_HEAD"], tmp);
}

const got = execFileSync("git", ["rev-parse", "HEAD"], { cwd: tmp, encoding: "utf8" }).trim();
if (got !== commit) {
  throw new Error(`expected ${commit} but checked out ${got}`);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
execSync(`cp -a "${tmp}/." "${dest}"`, { stdio: "inherit" });
fs.rmSync(path.join(dest, ".git"), { recursive: true, force: true });
fs.writeFileSync(stamp, `${commit}\n`);
console.log(`content/upstream ready at ${commit}`);
