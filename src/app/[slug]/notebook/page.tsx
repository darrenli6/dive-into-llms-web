import { notFound } from "next/navigation";
import ResourceBar from "@/components/ResourceBar";
import SiteShell from "@/components/SiteShell";
import { renderMarkdown } from "@/lib/markdown";
import { parseNotebook } from "@/lib/notebook";
import { getSourceInfo, listChapters, readNotebook } from "@/lib/source";

export function generateStaticParams() {
  return listChapters()
    .filter((ch) => ch.notebookFile)
    .map((ch) => ({ slug: ch.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ch = listChapters().find((c) => c.slug === slug);
  return { title: `${ch?.title || slug} · 实验脚本` };
}

export default async function NotebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapters = listChapters();
  const ch = chapters.find((c) => c.slug === slug);
  if (!ch || !ch.notebookFile) notFound();
  const source = getSourceInfo();
  const raw = readNotebook(ch);
  const nb = parseNotebook(raw);
  const cells = [];
  for (const [i, cell] of nb.cells.entries()) {
    if (cell.type === "markdown") {
      const rendered = await renderMarkdown(cell.source, { kind: "chapter", slug: ch.slug });
      cells.push(
        <section key={i} className="nb-cell md" dangerouslySetInnerHTML={{ __html: rendered.html }} />,
      );
    } else if (cell.type === "code") {
      const fence = "```" + (cell.language || "python") + "\n" + cell.source + "\n```";
      const rendered = await renderMarkdown(fence, { kind: "chapter", slug: ch.slug });
      cells.push(
        <section key={i} className="nb-cell code">
          <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
          {cell.outputs.map((out, j) =>
            out.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={j} src={out.content} alt="notebook output" />
            ) : out.type === "html" ? (
              <div key={j} className="nb-html" dangerouslySetInnerHTML={{ __html: out.content }} />
            ) : (
              <pre key={j} className={out.type === "error" ? "nb-error" : "nb-out"}>
                {out.content}
              </pre>
            ),
          )}
        </section>,
      );
    } else if (cell.source.trim()) {
      cells.push(
        <section key={i} className="nb-cell raw">
          <pre>{cell.source}</pre>
        </section>,
      );
    }
  }
  return (
    <SiteShell chapters={chapters} source={source} current={ch.slug}>
      <ResourceBar chapter={ch} current="notebook" version={source.shortCommit} />
      <article className="doc">
        <h1>{ch.title} · 实验脚本</h1>
        <p>
          上游 Notebook <code>{ch.notebookFile}</code> 的只读渲染，未在本站执行代码。可在
          <a href={`/files/${ch.slug}/${ch.notebookFile}`}> 下载原始 .ipynb</a>。
        </p>
        <div className="notebook">{cells}</div>
      </article>
    </SiteShell>
  );
}
