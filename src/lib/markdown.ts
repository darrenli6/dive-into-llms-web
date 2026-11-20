import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Chapter } from "./source";

export type TocItem = { id: string; text: string; level: number };

export type RenderedMarkdown = {
  html: string;
  toc: TocItem[];
};

function rewriteUrl(url: string, ctx: { kind: "home" | "chapter"; slug?: string }) {
  if (!url || url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("#") || url.startsWith("data:")) {
    return url;
  }
  const [pathPart, hash] = url.split("#");
  const suffix = hash ? `#${hash}` : "";
  const rel = pathPart.replace(/^\.\//, "");

  if (ctx.kind === "home") {
    const gh = rel.match(
      /(?:https:\/\/github\.com\/[^/]+\/dive-into-llms\/(?:tree|blob)\/main\/)?documents\/(chapter\d+)\/(.+)$/,
    );
    // handled below for absolute github already returned early if http...
    if (rel.startsWith("pics/") || rel.startsWith("./pics/")) {
      return `/files/${rel.replace(/^\.\//, "")}${suffix}`;
    }
  }

  if (ctx.kind === "chapter" && ctx.slug) {
    if (/\.pdf$/i.test(rel)) return `/${ctx.slug}/slides/${suffix}`;
    if (/\.ipynb$/i.test(rel)) return `/${ctx.slug}/notebook/${suffix}`;
    if (rel.startsWith("assets/") || rel.startsWith("figs/") || rel.startsWith("pics/")) {
      return `/files/${ctx.slug}/${rel}${suffix}`;
    }
    // bare relative files stay under the chapter files prefix
    if (!rel.startsWith("/") && !rel.startsWith("documents/")) {
      return `/files/${ctx.slug}/${rel}${suffix}`;
    }
  }
  return url;
}

function rewriteGithubCatalogLinks() {
  return (tree: unknown) => {
    visit(tree as never, "link", (node: { url?: string }) => {
      const url = node.url || "";
      const m = url.match(
        /https:\/\/github\.com\/[^/]+\/dive-into-llms\/(?:tree|blob)\/main\/documents\/(chapter\d+)\/([^)#]+)/,
      );
      if (!m) return;
      const slug = m[1];
      const file = m[2];
      if (/README\.md$/i.test(file)) node.url = `/${slug}/`;
      else if (/\.pdf$/i.test(file)) node.url = `/${slug}/slides/`;
      else if (/\.ipynb$/i.test(file)) node.url = `/${slug}/notebook/`;
    });
    visit(tree as never, "image", (node: { url?: string }) => {
      const url = node.url || "";
      if (url.startsWith("./pics/") || url.startsWith("pics/")) {
        node.url = `/files/${url.replace(/^\.\//, "")}`;
      }
    });
  };
}

function rewriteChapterLinks(slug: string) {
  return (tree: unknown) => {
    visit(tree as never, (node: { type?: string; url?: string; tagName?: string; properties?: Record<string, string> }) => {
      if (node.type === "link" || node.type === "image") {
        if (node.url) node.url = rewriteUrl(node.url, { kind: "chapter", slug });
      }
    });
  };
}

function rewriteRawHtml(ctx: { kind: "home" | "chapter"; slug?: string }) {
  return (tree: unknown) => {
    visit(tree as never, "element", (node: { properties?: Record<string, unknown> }) => {
      const props = node.properties;
      if (!props) return;
      for (const key of ["src", "href"]) {
        const val = props[key];
        if (typeof val === "string") {
          if (ctx.kind === "home" && (val.startsWith("./pics/") || val.startsWith("pics/"))) {
            props[key] = `/files/${val.replace(/^\.\//, "")}`;
          } else if (ctx.kind === "chapter" && ctx.slug) {
            props[key] = rewriteUrl(val, ctx);
          }
        }
      }
    });
  };
}

function extractToc() {
  return (tree: unknown, file: { data: Record<string, unknown> }) => {
    const toc: TocItem[] = [];
    visit(tree as never, "element", (node: { tagName?: string; properties?: { id?: string }; children?: unknown[] }) => {
      const tag = node.tagName || "";
      const m = /^h([1-3])$/.exec(tag);
      if (!m) return;
      const id = node.properties?.id || "";
      const text = textOf(node).trim();
      if (id && text) toc.push({ id, text, level: Number(m[1]) });
    });
    file.data.toc = toc;
  };
}

function textOf(node: { value?: string; children?: unknown[] }): string {
  if (node.value) return node.value;
  return (node.children || []).map((c) => textOf(c as { value?: string; children?: unknown[] })).join("");
}

export async function renderMarkdown(
  markdown: string,
  ctx: { kind: "home" | "chapter"; slug?: string },
): Promise<RenderedMarkdown> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(ctx.kind === "home" ? rewriteGithubCatalogLinks : () => rewriteChapterLinks(ctx.slug || ""))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(() => rewriteRawHtml(ctx))
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(extractToc)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(markdown);
  return {
    html: String(file),
    toc: ((file.data as { toc?: TocItem[] }).toc) || [],
  };
}

export function rewriteHomeNoticeAlreadySeparate() {
  return;
}
