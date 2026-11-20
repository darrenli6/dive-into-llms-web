import type { ReactNode } from "react";
import type { Chapter, SourceInfo } from "@/lib/source";
import SearchBox from "./SearchBox";

export default function SiteShell({
  children,
  chapters,
  source,
  current,
  toc,
}: {
  children: ReactNode;
  chapters: Chapter[];
  source: SourceInfo;
  current?: string;
  toc?: ReactNode;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            <img src="/files/pics/icon/ai.png" alt="" width={28} height={28} />
            <span>动手学大模型</span>
          </a>
          <div className="topbar-actions">
            <SearchBox />
            <a className="gh" href={source.repo} target="_blank" rel="noreferrer">
              内容来源
            </a>
          </div>
        </div>
        <p className="announce">
          本站用 Next.js 渲染{" "}
          <a href={source.repo} target="_blank" rel="noreferrer">
            darrenli6/dive-into-llms
          </a>{" "}
          的教程、课件与 Notebook。正文来自该公开 fork（源自{" "}
          <a href={source.upstreamOrigin} target="_blank" rel="noreferrer">
            Lordog/dive-into-llms
          </a>
          ），未改写章节内容。上游仓库没有 LICENSE 文件，版权归原作者与贡献者。
        </p>
      </header>
      <div className="body">
        <input id="nav-toggle" type="checkbox" className="nav-toggle" />
        <label htmlFor="nav-toggle" className="nav-toggle-btn">
          目录
        </label>
        <aside className="sidenav" aria-label="章节导航">
          <a href="/" className={!current ? "active" : ""}>
            首页
          </a>
          {chapters.map((ch) => (
            <div key={ch.slug} className="nav-chapter">
              <a href={`/${ch.slug}/`} className={current === ch.slug ? "active" : ""}>
                {ch.num}. {shortTitle(ch.title)}
              </a>
              <div className="nav-sub">
                <a href={`/${ch.slug}/`}>教程</a>
                {ch.notebookFile ? <a href={`/${ch.slug}/notebook/`}>实验脚本</a> : null}
                {ch.pdfFile ? <a href={`/${ch.slug}/slides/`}>课件 PDF</a> : null}
              </div>
            </div>
          ))}
          <a href="/attribution/" className={current === "attribution" ? "active" : ""}>
            来源与许可
          </a>
        </aside>
        <main className="main">{children}</main>
        {toc ? <div className="toc-wrap">{toc}</div> : <div className="toc-wrap empty" />}
      </div>
      <footer className="footer">
        内容版权归原作者与贡献者所有。本站为阅读渲染，镜像提交{" "}
        <a href={`${source.repo}/commit/${source.commit}`} target="_blank" rel="noreferrer">
          {source.shortCommit}
        </a>
        。教师：张倬胜，上海交通大学。详见<a href="/attribution/">来源与许可</a>。
      </footer>
    </div>
  );
}

function shortTitle(title: string) {
  return title.replace(/^动手学大模型[：:]/, "").trim() || title;
}
