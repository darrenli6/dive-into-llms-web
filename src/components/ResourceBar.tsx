import type { Chapter } from "@/lib/source";

export default function ResourceBar({
  chapter,
  current,
  version,
}: {
  chapter: Chapter;
  current: "tutorial" | "notebook" | "slides";
  version: string;
}) {
  const items = [
    { key: "tutorial", href: `/${chapter.slug}/`, label: "教程", show: true },
    { key: "notebook", href: `/${chapter.slug}/notebook/`, label: "实验脚本", show: Boolean(chapter.notebookFile) },
    { key: "slides", href: `/${chapter.slug}/slides/`, label: "课件 PDF", show: Boolean(chapter.pdfFile) },
    {
      key: "github",
      href: `https://github.com/darrenli6/dive-into-llms/tree/main/documents/${chapter.slug}`,
      label: "GitHub 源文件",
      show: true,
    },
  ].filter((i) => i.show);

  return (
    <div className="resources">
      本章资料：
      {items.map((item, idx) => (
        <span key={item.key}>
          {idx ? " · " : ""}
          {item.key === current ? <strong>{item.label}</strong> : <a href={item.href}>{item.label}</a>}
        </span>
      ))}
      {current === "slides" && chapter.pdfFile ? (
        <>
          {" "}
          ·{" "}
          <a href={`/files/${chapter.slug}/${chapter.pdfFile}?v=${version}`} target="_blank" rel="noreferrer">
            直接下载
          </a>
        </>
      ) : null}
    </div>
  );
}
