/**
 * Shared A4 export helpers for generated worksheets / summaries.
 * Download PDF and Print are fully separate actions:
 *  - downloadNodeAsPdf(): builds a multi-page A4 PDF and saves it. Never opens a print dialog.
 *  - printNode(): opens the browser print dialog only. Never downloads a file.
 */

const COLOR_PROPS = [
  "color", "backgroundColor", "borderTopColor", "borderRightColor",
  "borderBottomColor", "borderLeftColor", "outlineColor",
  "textDecorationColor", "caretColor", "columnRuleColor",
] as const;

const isModern = (v: string) => /\b(lab|lch|oklab|oklch|color)\(/.test(v);

/** Tailwind v4 emits oklch()/lab() which html2canvas cannot parse — sanitize the clone. */
function sanitize(doc: Document) {
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) return;
    for (const prop of COLOR_PROPS) {
      const val = cs[prop] as string;
      if (val && isModern(val)) {
        el.style.setProperty(
          prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
          prop === "backgroundColor" ? "transparent" : "#1f2937",
        );
      }
    }
    if (cs.backgroundImage && isModern(cs.backgroundImage)) el.style.backgroundImage = "none";
  });
}

async function renderCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(node, {
    scale: Math.min(2, Math.max(1.5, window.devicePixelRatio || 1.5)),
    backgroundColor: "#ffffff",
    useCORS: true,
    windowWidth: Math.max(node.scrollWidth, 900),
    onclone: (doc: Document) => sanitize(doc),
  });
}

/** Slice one tall canvas into A4-proportioned page images, never cutting mid-content harshly. */
function sliceToA4Pages(canvas: HTMLCanvasElement): string[] {
  const pageH = Math.floor((canvas.width * 297) / 210);
  const pages: string[] = [];
  for (let y = 0; y < canvas.height; y += pageH) {
    const h = Math.min(pageH, canvas.height - y);
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = pageH;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    pages.push(c.toDataURL("image/jpeg", 0.92));
  }
  return pages.length ? pages : [canvas.toDataURL("image/jpeg", 0.92)];
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function safeFileName(base: string) {
  return (base || "document").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 70);
}

/** DOWNLOAD ONLY — produces a real multi-page A4 PDF file. */
export async function downloadNodeAsPdf(node: HTMLElement, fileBase: string) {
  const [canvas, { default: jsPDF }] = await Promise.all([renderCanvas(node), import("jspdf")]);
  const pages = sliceToA4Pages(canvas);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pages.forEach((img, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  });
  saveBlob(pdf.output("blob"), `${safeFileName(fileBase)}.pdf`);
}

/** PRINT ONLY — opens the print dialog with clean A4 pages, downloads nothing. */
export async function printNode(node: HTMLElement, title: string) {
  const canvas = await renderCanvas(node);
  const pages = sliceToA4Pages(canvas);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(
    `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title.replace(/</g, "")}</title>` +
      `<style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:#fff}` +
      `img{display:block;width:100%;height:auto;page-break-after:always;break-after:page}` +
      `img:last-child{page-break-after:auto;break-after:auto}</style></head><body>` +
      pages.map((p) => `<img src="${p}">`).join("") +
      `</body></html>`,
  );
  doc.close();
  const done = () => setTimeout(() => frame.remove(), 1500);
  const start = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      done();
    }
  };
  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; }))),
  );
  setTimeout(start, 120);
}
