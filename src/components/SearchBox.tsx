"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";

type Hit = { id: string; title: string; url: string; score?: number };

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [mini, setMini] = useState<MiniSearch<Hit> | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || mini) return;
    fetch("/search-index.json")
      .then((r) => {
        if (!r.ok) throw new Error("搜索索引不可用");
        return r.json();
      })
      .then((data) => {
        setMini(MiniSearch.loadJS(data.index, {
          fields: ["title", "text"],
          storeFields: ["title", "url"],
          searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.15 },
        }));
      })
      .catch((e: Error) => setError(e.message));
  }, [open, mini]);

  useEffect(() => {
    if (!mini) return;
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    setHits(mini.search(q).slice(0, 20) as unknown as Hit[]);
  }, [query, mini]);

  const label = useMemo(() => (query ? `${hits.length} 条结果` : "输入关键词搜索教程与脚本"), [query, hits.length]);

  return (
    <>
      <button type="button" className="search-trigger" onClick={() => setOpen(true)} aria-label="搜索">
        <span>搜索</span>
        <kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="search-overlay" onClick={() => setOpen(false)} role="presentation">
          <div className="search-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="全文搜索">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索章节、公式说明、代码与术语…"
              aria-label="搜索词"
            />
            <p className="search-meta">{error || label}</p>
            <ul>
              {hits.map((h) => (
                <li key={h.id}>
                  <a href={h.url} onClick={() => setOpen(false)}>
                    <strong>{h.title}</strong>
                    <span>{h.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
