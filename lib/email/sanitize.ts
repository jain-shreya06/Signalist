const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "div", "em", "h2", "h3", "i", "li", "ol", "p", "span", "strong", "ul",
]);
const VOID_TAGS = new Set(["br"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeEmailHtml(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, (tagText) => {
      const match = tagText.match(/^<\s*(\/?)\s*([a-z0-9]+)([\s\S]*?)\s*\/?>$/i);
      if (!match) return escapeHtml(tagText);

      const closing = match[1] === "/";
      const tag = match[2].toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return escapeHtml(tagText);
      if (closing) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
      if (tag !== "a") return `<${tag}>`;

      const href = match[3].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = href?.[1] ?? href?.[2] ?? href?.[3];
      if (!rawHref) return "<a>";

      const safeHref = rawHref.trim();
      if (!/^(https?:|mailto:)/i.test(safeHref)) return "<a>";
      return `<a href="${escapeHtml(safeHref)}" rel="noopener noreferrer">`;
    });
}
