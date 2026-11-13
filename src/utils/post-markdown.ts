import { SITE } from "@/constants/site";
import { CATEGORY_LABEL } from "@/domains/category.model";
import { type Post, PostPolicy } from "@/domains/post.model";

import { toIsoDate } from "./date";
import { toPortableMarkdown } from "./markdown";
import { getPostPath } from "./routes";

/** llmstxt.org 규격: 글 주소에 .md를 붙이면 같은 글의 마크다운을 돌려준다. */
export function toPostMarkdown(post: Post) {
  return [
    `# ${post.title}`,
    `> ${PostPolicy.summary(post)}`,
    [
      `- 원문: ${new URL(getPostPath(post.id), SITE.url).href}`,
      `- 카테고리: ${CATEGORY_LABEL[post.category]}`,
      `- 발행: ${toIsoDate(post.publishedAt)}`,
      `- 수정: ${toIsoDate(post.updatedAt)}`,
    ].join("\n"),
    toPortableMarkdown(post.body),
  ].join("\n\n");
}
