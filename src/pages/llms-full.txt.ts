import type { APIRoute } from "astro";

import { getPosts } from "@/apis/posts";
import { SITE } from "@/constants/site";
import { toPostMarkdown } from "@/utils/post-markdown";

export const GET = (async () => {
  const posts = await getPosts();
  const body = [
    `# ${SITE.title} (${SITE.name}) 전체 글`,
    `> ${SITE.description}`,
    ...posts.map(toPostMarkdown),
  ].join("\n\n---\n\n");

  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}) satisfies APIRoute;
