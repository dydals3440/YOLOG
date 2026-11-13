import { describe, expect, it } from "bun:test";

import { extractParagraphText, toPortableMarkdown } from "./markdown";

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

describe("toPortableMarkdown", () => {
  it("import·export와 내용 없는 JSX 컴포넌트를 지운다", () => {
    // Given
    const markdown = [
      'import Demo from "./Demo";',
      "export const meta = {};",
      "",
      "# 제목",
      "",
      '<Demo scene="login" client:visible />',
      "",
      "본문이에요.",
    ].join("\n");

    // When
    const result = toPortableMarkdown(markdown);

    // Then
    expect(result).toBe("# 제목\n\n본문이에요.");
  });

  it("내용을 감싼 JSX 컴포넌트는 내용만 남긴다", () => {
    // Given
    const markdown = "중요한 <Highlight>문장</Highlight>이에요.";

    // When
    const result = toPortableMarkdown(markdown);

    // Then
    expect(result).toBe("중요한 문장이에요.");
  });

  it("이미지는 대체 텍스트로 바꾼다", () => {
    // Given
    const markdown = "![캐시 흐름도](./1.webp)";

    // When
    const result = toPortableMarkdown(markdown);

    // Then
    expect(result).toBe("(이미지: 캐시 흐름도)");
  });

  it("코드 블록의 언어와 메타 정보를 유지한다", () => {
    // Given
    const markdown = '```ts title="예시" {2}\nconst a = 1;\nconst b = 2;\n```';

    // When
    const result = toPortableMarkdown(markdown);

    // Then
    expect(result).toBe(markdown);
  });
});
