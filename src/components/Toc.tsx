"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown";

export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return;
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav className="toc" aria-label="本页目录">
      <h2>本页目录</h2>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-level={item.level} className={item.id === active ? "active" : ""}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
