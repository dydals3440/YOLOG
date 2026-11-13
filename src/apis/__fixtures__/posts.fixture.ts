import type { Post } from "@/domains/post.model";

export function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: "http-cache",
    title: "HTTP 캐싱 이해하기",
    category: "HTTP",
    tags: ["HTTP", "Caching"],
    publishedAt: new Date("2025-10-19T00:00:00.000Z"),
    updatedAt: new Date("2025-10-19T00:00:00.000Z"),
    body: "캐시는 한 번 받은 데이터를 다시 쓰는 기술이에요.",
    ...overrides,
  };
}
