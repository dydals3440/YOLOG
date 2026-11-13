import { describe, expect, it } from "bun:test";

import { createPost } from "@/apis/__fixtures__/posts.fixture";

import {
  calculateReadingMinutes,
  calculateRelevanceScore,
  countSharedTags,
  excludePostId,
  createSummary,
  filterByCategory,
  filterByPostId,
  isPublishedWithin,
  orderByPublishedAt,
  PostPolicy,
} from "./post.model";

describe("filterByCategory", () => {
  it("category가 null이면 true를 반환한다", () => {
    // Given
    const post = createPost({ category: "HTTP" });

    // When
    const result = filterByCategory(post, null);

    // Then
    expect(result).toBe(true);
  });

  it("category가 undefined이면 true를 반환한다", () => {
    // Given
    const post = createPost({ category: "HTTP" });

    // When
    const result = filterByCategory(post, undefined);

    // Then
    expect(result).toBe(true);
  });

  it("글의 카테고리와 같으면 true를 반환한다", () => {
    // Given
    const post = createPost({ category: "HTTP" });

    // When
    const result = filterByCategory(post, "HTTP");

    // Then
    expect(result).toBe(true);
  });

  it("글의 카테고리와 다르면 false를 반환한다", () => {
    // Given
    const post = createPost({ category: "HTTP" });

    // When
    const result = filterByCategory(post, "REVIEW");

    // Then
    expect(result).toBe(false);
  });
});

describe("filterByPostId", () => {
  it("id가 null이면 true를 반환한다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = filterByPostId(post, null);

    // Then
    expect(result).toBe(true);
  });

  it("id가 글의 id와 같으면 true를 반환한다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = filterByPostId(post, "http-cache");

    // Then
    expect(result).toBe(true);
  });

  it("id가 글의 id와 다르면 false를 반환한다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = filterByPostId(post, "http-cors");

    // Then
    expect(result).toBe(false);
  });
});

describe("excludePostId", () => {
  it("id가 null이면 true를 반환한다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = excludePostId(post, null);

    // Then
    expect(result).toBe(true);
  });

  it("id가 글의 id와 같으면 false를 반환해 목록에서 뺀다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = excludePostId(post, "http-cache");

    // Then
    expect(result).toBe(false);
  });

  it("id가 글의 id와 다르면 true를 반환한다", () => {
    // Given
    const post = createPost({ id: "http-cache" });

    // When
    const result = excludePostId(post, "http-cors");

    // Then
    expect(result).toBe(true);
  });
});

describe("orderByPublishedAt", () => {
  it("발행 시각을 밀리초로 반환해 최신 글이 큰 값을 갖는다", () => {
    // Given
    const older = createPost({ publishedAt: new Date("2025-01-01T00:00:00.000Z") });
    const newer = createPost({ publishedAt: new Date("2026-01-01T00:00:00.000Z") });

    // When
    const result = orderByPublishedAt(newer) - orderByPublishedAt(older);

    // Then
    expect(result).toBeGreaterThan(0);
  });
});

describe("calculateReadingMinutes", () => {
  it("한글 500자는 1분으로 계산한다", () => {
    // Given
    const text = "가".repeat(500);

    // When
    const result = calculateReadingMinutes(text);

    // Then
    expect(result).toBe(1);
  });

  it("한글 글자 수와 영어 단어 수를 더해 반올림한다", () => {
    // Given
    // 한글 1,000자(2분) + 영어 300단어(1.5분) = 3.5분 → 4분
    const text = `${"가".repeat(1000)} ${"word ".repeat(300)}`;

    // When
    const result = calculateReadingMinutes(text);

    // Then
    expect(result).toBe(4);
  });

  it("본문이 짧아도 최소 1분을 반환한다", () => {
    // Given
    const text = "짧은 글";

    // When
    const result = calculateReadingMinutes(text);

    // Then
    expect(result).toBe(1);
  });
});

describe("countSharedTags", () => {
  it("두 글에 모두 있는 태그 수를 센다", () => {
    // Given
    const tags = ["HTTP", "Caching", "ETag"];
    const otherTags = ["HTTP", "ETag", "CORS"];

    // When
    const result = countSharedTags(tags, otherTags);

    // Then
    expect(result).toBe(2);
  });

  it("겹치는 태그가 없으면 0을 반환한다", () => {
    // Given
    const tags = ["HTTP"];
    const otherTags = ["React"];

    // When
    const result = countSharedTags(tags, otherTags);

    // Then
    expect(result).toBe(0);
  });
});

describe("isPublishedWithin", () => {
  const now = new Date("2026-11-14T00:00:00.000Z");

  it("기간 안에 발행했으면 true를 반환한다", () => {
    // Given
    const publishedAt = new Date("2026-08-01T00:00:00.000Z");

    // When
    const result = isPublishedWithin(publishedAt, now, 6);

    // Then
    expect(result).toBe(true);
  });

  it("기간보다 오래전에 발행했으면 false를 반환한다", () => {
    // Given
    const publishedAt = new Date("2026-01-01T00:00:00.000Z");

    // When
    const result = isPublishedWithin(publishedAt, now, 6);

    // Then
    expect(result).toBe(false);
  });

  it("정확히 기간 경계에 발행했으면 false를 반환한다", () => {
    // Given
    const publishedAt = new Date("2026-05-14T00:00:00.000Z");

    // When
    const result = isPublishedWithin(publishedAt, now, 6);

    // Then
    expect(result).toBe(false);
  });
});

describe("calculateRelevanceScore", () => {
  it("같은 카테고리, 겹치는 태그, 최근 발행 점수를 더한다", () => {
    // Given
    const signals = { isSameCategory: true, sharedTagCount: 2, isRecentlyPublished: true };

    // When
    const result = calculateRelevanceScore(signals);

    // Then
    // 3 + 2 × 2 + 1 = 8
    expect(result).toBe(8);
  });

  it("관련 신호가 없으면 0을 반환한다", () => {
    // Given
    const signals = { isSameCategory: false, sharedTagCount: 0, isRecentlyPublished: false };

    // When
    const result = calculateRelevanceScore(signals);

    // Then
    expect(result).toBe(0);
  });
});

describe("createSummary", () => {
  it("최대 길이 이하면 그대로 반환한다", () => {
    // Given
    const text = "짧은 요약이에요.";

    // When
    const result = createSummary(text, 160);

    // Then
    expect(result).toBe("짧은 요약이에요.");
  });

  it("최대 길이와 같으면 자르지 않는다", () => {
    // Given
    const text = "가".repeat(10);

    // When
    const result = createSummary(text, 10);

    // Then
    expect(result).toBe("가".repeat(10));
  });

  it("최대 길이를 넘으면 자르고 말줄임표를 붙인다", () => {
    // Given
    const text = "가".repeat(11);

    // When
    const result = createSummary(text, 10);

    // Then
    expect(result).toBe(`${"가".repeat(7)}...`);
  });
});

describe("PostPolicy", () => {
  describe("summary", () => {
    it("설명이 있으면 설명을 요약으로 쓴다", () => {
      // Given
      const post = createPost({ description: "직접 쓴 설명", body: "본문 문단" });

      // When
      const result = PostPolicy.summary(post);

      // Then
      expect(result).toBe("직접 쓴 설명");
    });

    it("설명이 없으면 본문 문단으로 요약을 만든다", () => {
      // Given
      const post = createPost({ body: "## 제목\n\n본문 문단" });

      // When
      const result = PostPolicy.summary(post);

      // Then
      expect(result).toBe("본문 문단");
    });
  });

  describe("readingMinutes", () => {
    it("본문 길이로 읽는 시간을 계산한다", () => {
      // Given
      const post = createPost({ body: "가".repeat(1500) });

      // When
      const result = PostPolicy.readingMinutes(post);

      // Then
      expect(result).toBe(3);
    });
  });

  describe("isUpdated", () => {
    it("수정일이 발행일보다 늦으면 true를 반환한다", () => {
      // Given
      const post = createPost({
        publishedAt: new Date("2025-10-19T00:00:00.000Z"),
        updatedAt: new Date("2025-10-20T00:00:00.000Z"),
      });

      // When
      const result = PostPolicy.isUpdated(post);

      // Then
      expect(result).toBe(true);
    });

    it("수정일이 발행일과 같으면 false를 반환한다", () => {
      // Given
      const post = createPost({
        publishedAt: new Date("2025-10-19T00:00:00.000Z"),
        updatedAt: new Date("2025-10-19T00:00:00.000Z"),
      });

      // When
      const result = PostPolicy.isUpdated(post);

      // Then
      expect(result).toBe(false);
    });
  });

  describe("relevanceScore", () => {
    it("기준 글과 카테고리·태그가 겹치고 최근 글이면 높은 점수를 준다", () => {
      // Given
      const now = new Date("2026-11-14T00:00:00.000Z");
      const basePost = createPost({ id: "http-cache", category: "HTTP", tags: ["HTTP", "ETag"] });
      const post = createPost({
        id: "http-cors",
        category: "HTTP",
        tags: ["HTTP"],
        publishedAt: new Date("2026-10-01T00:00:00.000Z"),
      });

      // When
      const result = PostPolicy.relevanceScore(post, basePost, now);

      // Then
      // 같은 카테고리 3 + 태그 1개 2 + 최근 발행 1 = 6
      expect(result).toBe(6);
    });
  });
});
