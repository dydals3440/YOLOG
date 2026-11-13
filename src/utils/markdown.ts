import type { Nodes, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";
import { CONTINUE, SKIP, visit } from "unist-util-visit";

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

function parseMdx(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [mdxjs(), gfm()],
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
  });
}

/** MDX 본문에서 문단 텍스트만 이어 붙인다. 코드·제목·표·MDX 요소·콜아웃 표시는 뺀다. */
export function extractParagraphText(markdown: string) {
  const root = parseMdx(markdown);
  const paragraphs: string[] = [];
  collectParagraphs(root, paragraphs);

  return paragraphs.join(" ").replace(/\s+/g, " ").trim();
}

const MDX_ONLY_NODE_TYPES = new Set(["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]);

/** MDX 전용 문법(import·export·JSX·표현식)을 걷어낸 표준 마크다운으로 바꾼다. */
export function toPortableMarkdown(markdown: string) {
  const root = parseMdx(markdown);

  visit(root, (node, index, parent) => {
    if (parent === undefined || index === undefined) {
      return CONTINUE;
    }
    if (MDX_ONLY_NODE_TYPES.has(node.type)) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    // 상대 경로 이미지는 밖에서 열 수 없으므로 대체 텍스트만 남긴다.
    if (node.type === "image") {
      parent.children.splice(
        index,
        1,
        ...(node.alt ? [{ type: "text" as const, value: `(이미지: ${node.alt})` }] : []),
      );
      return [SKIP, index];
    }
    // JSX 컴포넌트는 감싼 내용만 남기고, 내용이 없는 인터랙션 컴포넌트는 지운다.
    if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
      parent.children.splice(index, 1, ...node.children);
      return [SKIP, index];
    }
    return CONTINUE;
  });

  return toMarkdown(root, { extensions: [gfmToMarkdown()] }).trim();
}
