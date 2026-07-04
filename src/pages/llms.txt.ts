import type { APIContext } from "astro";
import { BLOG_CATEGORIES, WEBSITE_CONFIG } from "@/consts";
import { getSiteUrl } from "@/lib/config";
import { generateDescription, getPostCollection, resolveSlug } from "@/lib/mdx";

export async function GET(context: APIContext) {
  const siteUrl = getSiteUrl(context.site);
  const posts = await getPostCollection();

  const sections = Object.entries(BLOG_CATEGORIES)
    .filter(([key]) => key !== "ALL")
    .map(([key, label]) => {
      const categoryPosts = posts.filter((post) => post.data.category === key);
      if (categoryPosts.length === 0) {
        return null;
      }
      const items = categoryPosts.map((post) => {
        const description = post.data.description || generateDescription(post.body ?? "");
        return `- [${post.data.title}](${siteUrl}/post/${resolveSlug(post.id)}/): ${description}`;
      });
      return `## ${label}\n\n${items.join("\n")}`;
    })
    .filter(Boolean);

  const body = [
    `# ${WEBSITE_CONFIG.TITLE} (YOLOG)`,
    `> ${WEBSITE_CONFIG.DESCRIPTION}`,
    ...sections,
    `## 피드\n\n- [RSS](${siteUrl}/rss.xml): 전체 포스트 피드\n- [사이트맵](${siteUrl}/sitemap.xml): 전체 페이지 목록`,
  ].join("\n\n");

  return new Response(`${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
