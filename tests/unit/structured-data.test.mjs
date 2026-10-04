import assert from "node:assert/strict";
import { it } from "node:test";
import { serializeJsonLd } from "../../src/lib/structured-data.ts";

it("JSON-LD는 원문을 보존하면서 script 태그 탈출을 막는다", () => {
  // Given
  const article = {
    "@type": "BlogPosting",
    headline: '</script><script>alert("xss")</script>',
    description: '한글 & <이미지> "따옴표"',
  };

  // When
  const serialized = serializeJsonLd(article);

  // Then
  assert(!serialized.includes("<"), "HTML이 JSON-LD script 태그를 탈출할 수 있습니다");
  assert.deepEqual(JSON.parse(serialized), article, "직렬화 과정에서 원문이 바뀌었습니다");
});
