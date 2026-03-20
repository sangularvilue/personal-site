import { marked } from "marked";

// Custom renderer that auto-embeds YouTube and X/Twitter links
const renderer = new marked.Renderer();

// Override paragraph to detect standalone embed URLs
renderer.paragraph = function ({ tokens }) {
  const text = tokens.map((t: { raw?: string }) => t.raw || "").join("");
  const trimmed = text.trim();

  // YouTube embed: standalone youtube.com or youtu.be link
  const ytMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)(?:\S*)$/
  );
  if (ytMatch) {
    return `<div class="embed-video"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`;
  }

  // X/Twitter embed: standalone x.com or twitter.com status link
  const xMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)\S*$/
  );
  if (xMatch) {
    return `<div class="embed-tweet"><blockquote class="twitter-tweet" data-theme="dark"><a href="https://x.com/${xMatch[1]}/status/${xMatch[2]}"></a></blockquote></div>\n`;
  }

  // Default paragraph
  const body = this.parser!.parseInline(tokens);
  return `<p>${body}</p>\n`;
};

marked.use({ renderer });

/**
 * Preprocess :::aside directives into HTML before marked parses them.
 *
 * Syntax:
 *   :::aside 300
 *   ![alt](url)
 *   :::
 *
 * The number is the max-height in px. The image floats to the right of
 * the following text, vertically centered on the adjacent paragraph.
 */
function preprocessAsides(md: string): string {
  return md.replace(
    /:::aside\s+(\d+)\s*\n!\[([^\]]*)\]\(([^)]+)\)\s*\n:::/g,
    (_match, maxH, alt, src) =>
      `<figure class="text-aside" style="--aside-max:${maxH}px"><img src="${src}" alt="${alt}"></figure>`,
  );
}

export async function renderMarkdown(content: string): Promise<string> {
  const html = await marked(preprocessAsides(content));

  // If the content includes any twitter embeds, append the widget script
  const hasTwitterEmbed = html.includes("twitter-tweet");
  const twitterScript = hasTwitterEmbed
    ? `<script async src="https://platform.twitter.com/widgets.js"></script>`
    : "";

  return html + twitterScript;
}
