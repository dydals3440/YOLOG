import { describe, expect, it } from "bun:test";

import { extractParagraphText } from "./markdown";

describe("extractParagraphText", () => {
  it("코드·제목·MDX 요소를 빼고 문단만 이어 붙인다", () => {
    // Given
    const markdown = [
      'import Demo from "./Demo";',
      "",
      "## 제목",
      "",
      "첫 문단이에요.",
      "",
      "```ts",
      "const ignored = true;",
      "```",
      "",
      "<Demo />",
      "",
      "[링크](https://example.com)가 있는 두 번째 문단이에요.",
    ].join("\n");

    // When
    const result = extractParagraphText(markdown);

    // Then
    expect(result).toBe("첫 문단이에요. 링크가 있는 두 번째 문단이에요.");
  });

  it("콜아웃 표시는 빼고 내용만 남긴다", () => {
    // Given
    const markdown = "> [!NOTE]\n> 중요한 내용이에요.";

    // When
    const result = extractParagraphText(markdown);

    // Then
    expect(result).toBe("중요한 내용이에요.");
  });

  it("표 안의 글자는 넣지 않는다", () => {
    // Given
    const markdown = "| 헤더 |\n| --- |\n| 셀 |\n\n표 다음 문단이에요.";

    // When
    const result = extractParagraphText(markdown);

    // Then
    expect(result).toBe("표 다음 문단이에요.");
  });
});
