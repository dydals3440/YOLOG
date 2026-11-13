import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { getPosts } from "@/apis/posts";
import { toPostMarkdown } from "@/utils/post-markdown";

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props }) =>
  new Response(`${toPostMarkdown(props.post)}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
