import { notFound } from "next/navigation";
import ResourceBar from "@/components/ResourceBar";
import SiteShell from "@/components/SiteShell";
import Toc from "@/components/Toc";
import { renderMarkdown } from "@/lib/markdown";
import { getSourceInfo, listChapters, readChapterMarkdown } from "@/lib/source";

export function generateStaticParams() {
  return listChapters().map((ch) => ({ slug: ch.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ch = listChapters().find((c) => c.slug === slug);
  return { title: ch?.title || slug };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapters = listChapters();
  const ch = chapters.find((c) => c.slug === slug);
  if (!ch) notFound();
  const source = getSourceInfo();
  const rendered = await renderMarkdown(readChapterMarkdown(ch), { kind: "chapter", slug: ch.slug });
  return (
    <SiteShell chapters={chapters} source={source} current={ch.slug} toc={<Toc items={rendered.toc} />}>
      <ResourceBar chapter={ch} current="tutorial" version={source.shortCommit} />
      <article className="doc" dangerouslySetInnerHTML={{ __html: rendered.html }} />
    </SiteShell>
  );
}
