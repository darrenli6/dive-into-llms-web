import { notFound } from "next/navigation";
import ResourceBar from "@/components/ResourceBar";
import SiteShell from "@/components/SiteShell";
import { getSourceInfo, listChapters } from "@/lib/source";

export function generateStaticParams() {
  return listChapters()
    .filter((ch) => ch.pdfFile)
    .map((ch) => ({ slug: ch.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ch = listChapters().find((c) => c.slug === slug);
  return { title: `${ch?.title || slug} · 课件` };
}

export default async function SlidesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapters = listChapters();
  const ch = chapters.find((c) => c.slug === slug);
  if (!ch || !ch.pdfFile) notFound();
  const source = getSourceInfo();
  const pdf = `/files/${ch.slug}/${ch.pdfFile}?v=${source.shortCommit}`;
  return (
    <SiteShell chapters={chapters} source={source} current={ch.slug}>
      <ResourceBar chapter={ch} current="slides" version={source.shortCommit} />
      <article className="doc">
        <h1>{ch.title} · 课件</h1>
        <p>
          原课件 PDF，来自上游仓库 <code>{ch.pdfFile}</code>。如无法内嵌预览，请直接
          <a href={pdf}> 下载课件</a>。
        </p>
        <iframe className="pdf-frame" src={pdf} title={`${ch.title} 课件 PDF`} />
      </article>
    </SiteShell>
  );
}
