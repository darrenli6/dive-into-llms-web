import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "动手学大模型",
    template: "%s · 动手学大模型",
  },
  description: "《动手学大模型 Dive into LLMs》阅读站，渲染 darrenli6/dive-into-llms 的教程、课件与 Notebook。",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
