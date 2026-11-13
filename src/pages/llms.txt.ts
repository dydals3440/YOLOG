import type { APIRoute } from "astro";

import { getPosts } from "@/apis/posts";
import { SITE } from "@/constants/site";
import { CATEGORIES, CATEGORY_LABEL } from "@/domains/category.model";
import { filterByCategory, type Post, PostPolicy } from "@/domains/post.model";
import { getPostPath } from "@/utils/routes";

const toLink = (post: Post) =>
  `- [${post.title}](${new URL(getPostPath(post.id), SITE.url).href}): ${PostPolicy.summary(post)}`;

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
    ...sections,
    `## 피드\n\n- [RSS](${SITE.url}/rss.xml): 전체 포스트 피드\n- [사이트맵](${SITE.url}/sitemap-index.xml): 전체 페이지 목록`,
  ].join("\n\n");

  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}) satisfies APIRoute;
