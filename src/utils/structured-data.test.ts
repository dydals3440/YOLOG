import { describe, expect, it } from "bun:test";

import { serializeJsonLd } from "./structured-data";

describe("serializeJsonLd", () => {
  it("원문을 보존하면서 script 태그 탈출을 막는다", () => {
    // Given
    const article = {
      "@type": "BlogPosting",
      headline: '</script><script>alert("xss")</script>',
      description: '한글 & <이미지> "따옴표"',
    };

    // When
    const serialized = serializeJsonLd(article);

    // Then
    expect(serialized, "HTML이 JSON-LD script 태그를 탈출할 수 있습니다").not.toContain("<");
    expect(JSON.parse(serialized), "직렬화 과정에서 원문이 바뀌었습니다").toStrictEqual(article);
  });
});
