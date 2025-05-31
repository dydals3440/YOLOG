import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { resolveSlug } from '@/lib/mdx';

import { WEBSITE_CONFIG } from '@/consts';

export async function GET(context) {
  const posts = await getCollection('post');
  return rss({
    title: WEBSITE_CONFIG.TITLE,
    description: WEBSITE_CONFIG.DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      ...post.data,
      link: `/post/${resolveSlug(post.slug)}/`,
      pubDate: new Date(post.data.date),
      description: post.data.description || WEBSITE_CONFIG.DESCRIPTION,
    })),
    customData: `<language>ko-KR</language>`,
  });
}
