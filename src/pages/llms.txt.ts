import type { APIRoute } from "astro";

import { getPosts } from "@/apis/posts";
import { SITE } from "@/constants/site";
import { CATEGORIES, CATEGORY_LABEL } from "@/domains/category.model";
import { filterByCategory, type Post, PostPolicy } from "@/domains/post.model";
import { getPostMarkdownPath } from "@/utils/routes";

const toAbsoluteUrl = (path: string) => new URL(path, SITE.url).href;

const toLink = (post: Post) =>
  `- [${post.title}](${toAbsoluteUrl(getPostMarkdownPath(post.id))}): ${PostPolicy.summary(post)}`;

export const GET = (async () => {
  const posts = await getPosts();
  const sections = CATEGORIES.map((category) => {
    const categoryPosts = posts.filter((post) => filterByCategory(post, category));
    return categoryPosts.length > 0
      ? `## ${CATEGORY_LABEL[category]}\n\n${categoryPosts.map(toLink).join("\n")}`
      : null;
  }).filter((section) => section !== null);

  const body = [
    `# ${SITE.title} (${SITE.name})`,
    `> ${SITE.description}`,
    `글 주소에 .md를 붙이면 마크다운 원문을 받을 수 있어요. 전체 글은 [llms-full.txt](${toAbsoluteUrl("/llms-full.txt")})에 있어요.`,
    ...sections,
    [
      "## Optional",
      "",
      `- [RSS](${toAbsoluteUrl("/rss.xml")}): 전체 글 피드`,
      `- [사이트맵](${toAbsoluteUrl("/sitemap-index.xml")}): 전체 페이지 목록`,
    ].join("\n"),
  ].join("\n\n");

  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}) satisfies APIRoute;
