import { describe, expect, it } from "bun:test";

import {
  getCategoryPath,
  getPostMarkdownPath,
  getPostPath,
  parseCategorySlug,
  toCategorySlug,
} from "./routes";

describe("getPostPath", () => {
  it("글 ID로 글 페이지 경로를 만든다", () => {
    // Given
    const postId = "http-cache";

    // When
    const path = getPostPath(postId);

    // Then
    expect(path).toBe("/post/http-cache");
  });
});

describe("getPostMarkdownPath", () => {
  it("글 페이지 경로 뒤에 .md를 붙인다", () => {
    // Given
    const postId = "http-cache";

    // When
    const path = getPostMarkdownPath(postId);

    // Then
    expect(path).toBe("/post/http-cache.md");
  });
});

describe("toCategorySlug", () => {
  it("카테고리를 URL에 쓰는 소문자 값으로 바꾼다", () => {
    // Given
    const category = "DESIGN_PATTERN";

    // When
    const slug = toCategorySlug(category);

    // Then
    expect(slug).toBe("design_pattern");
  });
});

describe("parseCategorySlug", () => {
  it("URL 값을 카테고리로 되돌린다", () => {
    // Given
    const slug = "http";

    // When
    const category = parseCategorySlug(slug);

    // Then
    expect(category).toBe("HTTP");
  });

  it("값이 없으면 null을 반환한다", () => {
    // Given
    const slug = undefined;

    // When
    const category = parseCategorySlug(slug);

    // Then
    expect(category).toBeNull();
  });

  it("정의되지 않은 카테고리면 null을 반환한다", () => {
    // Given
    const slug = "unknown";

    // When
    const category = parseCategorySlug(slug);

    // Then
    expect(category).toBeNull();
  });
});

describe("getCategoryPath", () => {
  it("카테고리 목록 페이지 경로를 만든다", () => {
    // Given
    const category = "STORY";

    // When
    const path = getCategoryPath(category);

    // Then
    expect(path).toBe("/blogs/story");
  });
});
