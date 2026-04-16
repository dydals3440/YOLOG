import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { WEBSITE_CONFIG } from "@/consts";
import { resolveSlug } from "@/lib/mdx";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw new Error("Astro config 'site' must be set to generate RSS feed");
  }
  const posts = await getCollection("post");
  return rss({
    title: WEBSITE_CONFIG.TITLE,
    description: WEBSITE_CONFIG.DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      link: `/post/${resolveSlug(post.id)}/`,
      pubDate: new Date(post.data.date),
      description: post.data.description || WEBSITE_CONFIG.DESCRIPTION,
    })),
    customData: `<language>ko-KR</language>`,
  });
}
