import { describe, expect, it } from "bun:test";

import { createPost } from "@/apis/__fixtures__/posts.fixture";

import { toPostMarkdown } from "./post-markdown";

describe("toPostMarkdown", () => {
  it("제목·요약·원문 주소·카테고리·날짜와 본문 마크다운을 담는다", () => {
    // Given
    const post = createPost({
      id: "http-cache",
      title: "HTTP 캐싱 이해하기",
      description: "캐시 요약",
      category: "HTTP",
      publishedAt: new Date("2025-10-19T00:00:00.000Z"),
      updatedAt: new Date("2025-10-20T00:00:00.000Z"),
      body: 'import Demo from "./Demo";\n\n본문이에요.',
    });

    // When
    const result = toPostMarkdown(post);

    // Then
    expect(result).toBe(
      [
        "# HTTP 캐싱 이해하기",
        "> 캐시 요약",
        [
          "- 원문: https://www.yolog.co.kr/post/http-cache",
          "- 카테고리: HTTP",
          "- 발행: 2025-10-19",
          "- 수정: 2025-10-20",
        ].join("\n"),
        "본문이에요.",
      ].join("\n\n"),
    );
  });
});
