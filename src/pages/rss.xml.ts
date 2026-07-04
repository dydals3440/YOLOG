import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { BLOG_CATEGORIES, type BlogCategory, WEBSITE_CONFIG } from "@/consts";
import { generateDescription, getPostCollection, resolveSlug } from "@/lib/mdx";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error("Astro config 'site' must be set to generate RSS feed");
  }
  const posts = await getPostCollection();
  return rss({
    title: WEBSITE_CONFIG.TITLE,
    description: WEBSITE_CONFIG.DESCRIPTION,
    site: context.site,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      dc: "http://purl.org/dc/elements/1.1/",
    },
    items: posts.map((post) => {
      const categoryLabel = post.data.category
        ? BLOG_CATEGORIES[post.data.category as BlogCategory]
        : undefined;
      return {
        title: post.data.title,
        link: `/post/${resolveSlug(post.id)}/`,
        pubDate: new Date(post.data.date),
        description: post.data.description || generateDescription(post.body ?? ""),
        categories: [...(categoryLabel ? [categoryLabel] : []), ...(post.data.tags ?? [])],
        customData: `<dc:creator>${WEBSITE_CONFIG.AUTHOR}</dc:creator>`,
      };
    }),
    customData: [
      `<language>ko-KR</language>`,
      `<atom:link href="${new URL("/rss.xml", context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(""),
  });
}
