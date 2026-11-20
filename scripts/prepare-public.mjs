#!/usr/bin/env node
/**
 * Copy upstream media/PDFs into public/files and build a client search index.
 * Also used as npm prebuild. Does not invent article text.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MiniSearch from "minisearch";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const upstream = path.join(root, "content", "upstream");
const publicDir = path.join(root, "public");
const filesDir = path.join(publicDir, "files");

function mustExist() {
  if (!fs.existsSync(path.join(upstream, "README.md"))) {
    throw new Error("content/upstream missing. Run: node scripts/sync-content.mjs");
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function notebookText(p) {
  try {
    const nb = JSON.parse(read(p));
    const parts = [];
    for (const cell of nb.cells || []) {
      const src = Array.isArray(cell.source) ? cell.source.join("") : String(cell.source || "");
      parts.push(src);
    }
    return parts.join("\n");
  } catch {
    return "";
  }
}

function listChapters() {
  const docs = path.join(upstream, "documents");
  const dirs = fs
    .readdirSync(docs, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^chapter\d+$/i.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));
  return dirs.map((slug) => {
    const dir = path.join(docs, slug);
    const files = fs.readdirSync(dir);
    const readme = files.find((f) => f.toLowerCase() === "readme.md");
    const pdf = files.find((f) => f.toLowerCase().endsWith(".pdf"));
    const notebook = files.find((f) => f.toLowerCase().endsWith(".ipynb"));
    const title = readme ? firstHeading(read(path.join(dir, readme))) || slug : slug;
    return { slug, dir, readme, pdf, notebook, title };
  });
}

mustExist();

fs.rmSync(filesDir, { recursive: true, force: true });
fs.mkdirSync(filesDir, { recursive: true });

const pics = path.join(upstream, "pics");
if (fs.existsSync(pics)) copyDir(pics, path.join(filesDir, "pics"));

const docs = path.join(upstream, "documents");
for (const ent of fs.readdirSync(docs, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  copyDir(path.join(docs, ent.name), path.join(filesDir, ent.name));
}

// Favicon from upstream icon if present
const icon = path.join(upstream, "pics", "icon", "ai.png");
if (fs.existsSync(icon)) {
  fs.copyFileSync(icon, path.join(publicDir, "favicon.png"));
}

const commit = fs.existsSync(path.join(root, "content", "SOURCE_COMMIT"))
  ? read(path.join(root, "content", "SOURCE_COMMIT")).trim()
  : "";

const documents = [];
const home = read(path.join(upstream, "README.md"));
documents.push({
  id: "home",
  title: "首页 · 动手学大模型",
  url: "/",
  text: home.replace(/<[^>]+>/g, " "),
});

for (const ch of listChapters()) {
  if (ch.readme) {
    documents.push({
      id: `${ch.slug}-readme`,
      title: ch.title,
      url: `/${ch.slug}/`,
      text: read(path.join(ch.dir, ch.readme)).replace(/<[^>]+>/g, " "),
    });
  }
  if (ch.notebook) {
    documents.push({
      id: `${ch.slug}-notebook`,
      title: `${ch.title} · 实验脚本`,
      url: `/${ch.slug}/notebook/`,
      text: notebookText(path.join(ch.dir, ch.notebook)),
    });
  }
}

const mini = new MiniSearch({
  fields: ["title", "text"],
  storeFields: ["title", "url"],
  searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.15 },
});
mini.addAll(documents);
const indexPath = path.join(publicDir, "search-index.json");
fs.writeFileSync(
  indexPath,
  JSON.stringify({ commit, documentCount: documents.length, index: mini.toJSON() }),
);
console.log(`prepared public/files and search index (${documents.length} docs)`);
