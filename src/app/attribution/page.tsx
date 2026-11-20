import SiteShell from "@/components/SiteShell";
import { getSourceInfo, listChapters } from "@/lib/source";

export const metadata = { title: "来源与许可" };

export default function AttributionPage() {
  const source = getSourceInfo();
  const chapters = listChapters();
  return (
    <SiteShell chapters={chapters} source={source} current="attribution">
      <article className="doc">
        <h1>来源、作者与许可</h1>
        <p>
          本站用 Next.js 渲染公益教程《动手学大模型 Dive into LLMs》，用于在浏览器中查看教程、课件 PDF 与实验
          Notebook。
        </p>
        <ul>
          <li>
            本站读取的内容仓库：
            <a href={source.repo}>{source.repo}</a>（
            {source.repo.includes("darrenli6") ? "你的公开 fork" : "内容源"}）
          </li>
          <li>
            原始上游：
            <a href={source.upstreamOrigin}>{source.upstreamOrigin}</a>
          </li>
          <li>
            本站使用的 git 提交：
            <a href={`${source.repo}/commit/${source.commit}`}>
              <code>{source.commit}</code>
            </a>
          </li>
        </ul>
        <p>
          教程由上海交通大学《自然语言处理前沿技术》（NIS8021）、《人工智能安全技术》课程（NIS3353）讲义拓展而来，教师为
          张倬胜。完整贡献者名单见首页「贡献者列表」，以上游 README 为准。
        </p>
        <p>
          该提交中的上游仓库<strong>没有</strong> LICENSE 文件。本站不对其许可作额外主张：版权归原作者与贡献者所有。本站只做在线阅读编排（目录、搜索、本地链接），不修改教程正文，也不新增文章。
        </p>
        <p>
          原仓库免责声明仍然适用：内容来自贡献者的个人经验、公开资料和科研积累，仅供参考。若有问题，请到上游 Issues 反馈。如需引用或转载，请直接核对并遵循上游仓库及其作者的要求。
        </p>
      </article>
    </SiteShell>
  );
}
