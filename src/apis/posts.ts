import { type CollectionEntry, getCollection, getEntry, render } from "astro:content";
import { memoize, orderBy as sortByCriteria } from "es-toolkit";

import {
  type FilterPost,
  type OrderByPost,
  orderByPublishedAt,
  type Post,
  PostSchema,
} from "@/domains/post.model";

// 지금은 Content Layer의 로컬 MDX를 읽는다. 서버로 옮기면 이 파일의 조회부만 바꾼다.
const COLLECTION = "post";
const ENTRY_ID_PREFIX = "blog/";

type PostEntry = CollectionEntry<typeof COLLECTION>;

const toPost = memoize(
  (entry: PostEntry): Post =>
    PostSchema.parse({
      id: entry.id.replace(ENTRY_ID_PREFIX, ""),
      title: entry.data.title,
      description: entry.data.description,
      category: entry.data.category,
      tags: entry.data.tags ?? [],
      publishedAt: entry.data.date,
      updatedAt: entry.data.updatedDate ?? entry.data.date,
      cover: entry.data.image,
      body: entry.body ?? "",
    }),
  { getCacheKey: (entry) => `${entry.id}:${entry.digest ?? ""}` },
);

interface GetPostsParams {
  filters?: FilterPost[];
  orderBy?: OrderByPost;
  limit?: number;
}

export async function getPosts({
  filters = [],
  orderBy = orderByPublishedAt,
  limit,
}: GetPostsParams = {}): Promise<Post[]> {
  const entries = await getCollection(COLLECTION, ({ data }) => !data.draft);
  const posts = entries.map(toPost).filter((post) => filters.every((filter) => filter(post)));

  return sortByCriteria(posts, [orderBy, orderByPublishedAt], ["desc", "desc"]).slice(0, limit);
}

export async function getPost(id: string): Promise<Post | null> {
  const entry = await getEntry(COLLECTION, `${ENTRY_ID_PREFIX}${id}`);
  return entry ? toPost(entry) : null;
}

export async function renderPost(id: string) {
  const entry = await getEntry(COLLECTION, `${ENTRY_ID_PREFIX}${id}`);
  if (!entry) {
    throw new Error(`글을 찾을 수 없어요: ${id}`);
  }
  return render(entry);
}
