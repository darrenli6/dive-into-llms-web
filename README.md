# dive-into-llms-web（Next.js）

用 **Next.js（App Router + TypeScript）** 把公开仓库 [darrenli6/dive-into-llms](https://github.com/darrenli6/dive-into-llms)《动手学大模型》渲染成中文阅读站，部署于 [https://llm.qqx.ai](https://llm.qqx.ai)。

这是真正的 Next.js 静态站点（`output: "export"`），不是把旧 MkDocs 页面用 iframe 套进来。教程正文、课件 PDF 和 Notebook 来自上述公开 fork（源自 [Lordog/dive-into-llms](https://github.com/Lordog/dive-into-llms)），构建时按 `source.lock` 的固定 commit 读取，不改写、不增补章节。该 commit **没有 LICENSE 文件**；版权归原作者与贡献者，详见 [NOTICE](NOTICE)。

当前锁定提交：`f84c04268794ef94f8949808bbc14ab8636763a0`（2025-10-10 14:25:47 +0800，Asia/Shanghai）。

## 要求

- Node.js 20+（构建环境为 Node 24 亦可）
- 本压缩包若已包含 `content/upstream/`，可离线构建，无需登录 GitHub
- 若没有内容快照，需要能够访问 GitHub 以运行 `npm run sync`

## 构建与本地预览

```bash
# 若没有 content/upstream，先拉取锁定的源仓库
npm run sync

npm ci
npm run build          # prebuild 会复制图片/PDF 并生成搜索索引，然后静态导出到 out/
python3 serve.py --host 127.0.0.1 --port 8091
```

然后打开 http://127.0.0.1:8091 。也可用任意静态文件服务器托管 `out/`。

开发模式：

```bash
npm run sync   # 按需
npm run dev
```

## 仓库结构

```
source.lock                 # 固定内容仓库与 commit
scripts/sync-content.mjs    # 拉取/校验源内容到 content/upstream
scripts/prepare-public.mjs  # 复制静态资源到 public/files，生成搜索索引
src/app/                    # App Router 页面
src/components/             # 导航、搜索、目录
src/lib/                    # 源内容清单、Markdown / Notebook 渲染
content/upstream/           # 源内容快照（不含 .git）
out/                        # next build 的静态导出（不入库）
```

## 部署说明

当前生产站点由独立 HTTP 服务在 `127.0.0.1:8091` 提供静态文件，再经既有 `llm-qqx` 隧道绑定 https://llm.qqx.ai。切换时只替换静态目录，不改端口、不改其他站点或 DNS。旧的 MkDocs 导出可保留作回滚。

真实的 Cloudflare 隧道配置和凭证不要放进本仓库。

## 已知限制

- 第 8 章原文中有些指向 `data/`、`code/`、`ckpt/` 的相对链接，源仓库本身没有这些文件，本站保持原样。
- Notebook 为只读渲染，不会在服务器上执行代码。
