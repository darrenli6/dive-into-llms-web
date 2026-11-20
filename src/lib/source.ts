import fs from "node:fs";
import path from "node:path";

export const PROJECT_ROOT = process.cwd();
export const UPSTREAM_DIR = path.join(PROJECT_ROOT, "content", "upstream");
export const SOURCE_LOCK = path.join(PROJECT_ROOT, "source.lock");

export type SourceInfo = {
  repo: string;
  upstreamOrigin: string;
  commit: string;
  shortCommit: string;
};

export type Chapter = {
  slug: string;
  num: number;
  title: string;
  brief?: string;
  readmePath?: string;
  pdfFile?: string;
  notebookFile?: string;
};

function read(p: string) {
  return fs.readFileSync(p, "utf8");
}

export function getSourceInfo(): SourceInfo {
  const text = read(SOURCE_LOCK);
  const repo = (text.match(/^repo=(.+)$/m) || [])[1]?.trim() || "";
  const upstreamOrigin =
    (text.match(/^upstream_origin=(.+)$/m) || [])[1]?.trim() ||
    "https://github.com/Lordog/dive-into-llms";
  const commit = (text.match(/^commit=(.+)$/m) || [])[1]?.trim() || "";
  const stamped = path.join(PROJECT_ROOT, "content", "SOURCE_COMMIT");
  const actual = fs.existsSync(stamped) ? read(stamped).trim() : commit;
  return { repo, upstreamOrigin, commit: actual || commit, shortCommit: (actual || commit).slice(0, 10) };
}

function firstHeading(md: string) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function briefsFromHome(): Record<string, string> {
  const home = path.join(UPSTREAM_DIR, "README.md");
  if (!fs.existsSync(home)) return {};
  const text = read(home);
  const briefs: Record<string, string> = {};
  const row =
    /\|\s*[^|]+?\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]*\]\(https:\/\/github\.com\/[^/]+\/dive-into-llms\/(?:tree|blob)\/main\/documents\/(chapter\d+)\/[^)]+\)/g;
  let m: RegExpExecArray | null;
  while ((m = row.exec(text))) {
    const brief = m[1].replace(/\s+/g, " ").trim();
    briefs[m[2]] = brief;
  }
  return briefs;
}

export function listChapters(): Chapter[] {
  const docs = path.join(UPSTREAM_DIR, "documents");
  if (!fs.existsSync(docs)) {
    throw new Error("content/upstream/documents missing; run node scripts/sync-content.mjs");
  }
  const briefs = briefsFromHome();
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
    const md = readme ? read(path.join(dir, readme)) : "";
    return {
      slug,
      num: Number(slug.replace(/\D/g, "")),
      title: firstHeading(md) || slug,
      brief: briefs[slug],
      readmePath: readme ? path.join(dir, readme) : undefined,
      pdfFile: pdf,
      notebookFile: notebook,
    };
  });
}

export function getChapter(slug: string): Chapter {
  const ch = listChapters().find((c) => c.slug === slug);
  if (!ch) throw new Error(`unknown chapter: ${slug}`);
  return ch;
}

export function readHomeMarkdown(): string {
  return read(path.join(UPSTREAM_DIR, "README.md"));
}

export function readChapterMarkdown(ch: Chapter): string {
  if (!ch.readmePath) return `# ${ch.title}\n\n（该章没有教程 README。）\n`;
  return read(ch.readmePath);
}

export function readNotebook(ch: Chapter): unknown {
  if (!ch.notebookFile) return null;
  const p = path.join(UPSTREAM_DIR, "documents", ch.slug, ch.notebookFile);
  return JSON.parse(read(p));
}

export function fileUrl(chSlug: string | "pics" | "", rel: string) {
  const cleaned = rel.replace(/^\.\//, "").replace(/^\/+/, "");
  if (!chSlug) return `/files/${cleaned}`;
  return `/files/${chSlug}/${cleaned}`;
}
