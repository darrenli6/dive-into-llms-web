import SiteShell from "@/components/SiteShell";
import Toc from "@/components/Toc";
import { renderMarkdown } from "@/lib/markdown";
import { getSourceInfo, listChapters, readHomeMarkdown } from "@/lib/source";

export default async function HomePage() {
  const source = getSourceInfo();
  const chapters = listChapters();
  const noticeMd = `> **关于本站**  \n这是 [${source.repo.replace("https://github.com/", "")}](${source.repo})《动手学大模型 Dive into LLMs》的在线阅读站点，方便直接浏览教程、课件和 Notebook。正文来自该公开 fork，未改写、未增补章节内容。教师：[张倬胜](https://bcmi.sjtu.edu.cn/home/zhangzs/)，上海交通大学。本站镜像提交：[\`${source.shortCommit}\`](${source.repo}/commit/${source.commit})。上游仓库未附带 LICENSE 文件，版权归原作者与贡献者所有。原始上游：[Lordog/dive-into-llms](${source.upstreamOrigin})。\n\n`;
  const rendered = await renderMarkdown(noticeMd + readHomeMarkdown(), { kind: "home" });
  return (
    <SiteShell chapters={chapters} source={source} toc={<Toc items={rendered.toc} />}>
      <article className="doc" dangerouslySetInnerHTML={{ __html: rendered.html }} />
    </SiteShell>
  );
}
