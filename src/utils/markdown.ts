import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { toString } from "mdast-util-to-string";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";

const CALLOUT_MARKER = /^\[![A-Z]+\]\s*/;
const SKIPPED_NODE_TYPES = new Set<Nodes["type"]>(["code", "heading", "table"]);

function collectParagraphs(node: Nodes, paragraphs: string[]) {
  if (node.type === "paragraph") {
    paragraphs.push(toString(node, { includeImageAlt: false }).replace(CALLOUT_MARKER, ""));
    return;
  }
  if (SKIPPED_NODE_TYPES.has(node.type) || !("children" in node)) {
    return;
  }
  for (const child of node.children) {
    collectParagraphs(child, paragraphs);
  }
}

/** MDX 본문에서 문단 텍스트만 이어 붙인다. 코드·제목·표·MDX 요소·콜아웃 표시는 뺀다. */
export function extractParagraphText(markdown: string) {
  const root = fromMarkdown(markdown, {
    extensions: [mdxjs(), gfm()],
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
  });
  const paragraphs: string[] = [];
  collectParagraphs(root, paragraphs);

  return paragraphs.join(" ").replace(/\s+/g, " ").trim();
}
