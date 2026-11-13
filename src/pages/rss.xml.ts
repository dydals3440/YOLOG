import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

import { getPosts } from "@/apis/posts";
import { AUTHOR, SITE } from "@/constants/site";
import { CATEGORY_LABEL } from "@/domains/category.model";
import { PostPolicy } from "@/domains/post.model";
import { getPostPath } from "@/utils/routes";

export const GET = (async () => {
  const posts = await getPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: SITE.url,
    trailingSlash: false,
    xmlns: { atom: "http://www.w3.org/2005/Atom", dc: "http://purl.org/dc/elements/1.1/" },
    items: posts.map((post) => ({
      title: post.title,
      link: getPostPath(post.id),
      pubDate: post.publishedAt,
      description: PostPolicy.summary(post),
      categories: [CATEGORY_LABEL[post.category], ...post.tags],
      customData: `<dc:creator>${AUTHOR.name}</dc:creator>`,
    })),
    customData: [
      `<language>${SITE.locale}</language>`,
      `<atom:link href="${new URL("/rss.xml", SITE.url).href}" rel="self" type="application/rss+xml"/>`,
    ].join(""),
  });
}) satisfies APIRoute;
