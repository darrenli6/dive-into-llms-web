export type NotebookCellView = {
  type: "markdown" | "code" | "raw";
  source: string;
  language: string;
  outputs: { type: "text" | "html" | "image" | "error"; content: string; mime?: string }[];
};

export type NotebookView = {
  cells: NotebookCellView[];
};

function joinSource(source: unknown): string {
  if (Array.isArray(source)) return source.join("");
  return String(source || "");
}

export function parseNotebook(raw: unknown): NotebookView {
  const nb = (raw || {}) as { cells?: unknown[]; metadata?: { kernelspec?: { language?: string } } };
  const fallbackLang = nb.metadata?.kernelspec?.language || "python";
  const cells: NotebookCellView[] = [];
  for (const item of nb.cells || []) {
    const cell = item as {
      cell_type?: string;
      source?: unknown;
      metadata?: { language?: string };
      outputs?: unknown[];
    };
    const type = cell.cell_type === "markdown" || cell.cell_type === "code" || cell.cell_type === "raw" ? cell.cell_type : "raw";
    const outputs: NotebookCellView["outputs"] = [];
    for (const out of cell.outputs || []) {
      const o = out as {
        output_type?: string;
        text?: unknown;
        data?: Record<string, unknown>;
        evalue?: string;
        traceback?: string[];
      };
      if (o.output_type === "stream" || o.text) {
        outputs.push({ type: "text", content: joinSource(o.text) });
        continue;
      }
      if (o.output_type === "error") {
        outputs.push({ type: "error", content: [o.evalue, ...(o.traceback || [])].filter(Boolean).join("\n") });
        continue;
      }
      const data = o.data || {};
      if (typeof data["text/html"] !== "undefined") {
        outputs.push({ type: "html", content: joinSource(data["text/html"]), mime: "text/html" });
      } else if (typeof data["image/png"] === "string") {
        outputs.push({ type: "image", content: `data:image/png;base64,${data["image/png"]}`, mime: "image/png" });
      } else if (typeof data["image/jpeg"] === "string") {
        outputs.push({ type: "image", content: `data:image/jpeg;base64,${data["image/jpeg"]}`, mime: "image/jpeg" });
      } else if (typeof data["text/plain"] !== "undefined") {
        outputs.push({ type: "text", content: joinSource(data["text/plain"]) });
      }
    }
    cells.push({
      type,
      source: joinSource(cell.source),
      language: cell.metadata?.language || fallbackLang,
      outputs,
    });
  }
  return { cells };
}
