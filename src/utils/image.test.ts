import { describe, expect, it } from "bun:test";

import { getLargestCropSize } from "./image";

describe("getLargestCropSize", () => {
  it("가로로 긴 원본에서 16:9 영역은 높이를 기준으로 자른다", () => {
    // Given
    const source = { width: 1400, height: 700 };

    // When
    const result = getLargestCropSize(source, 16 / 9);

    // Then
    expect(result).toStrictEqual({ width: 1244, height: 700 });
  });

  it("1:1 영역은 짧은 변을 기준으로 자른다", () => {
    // Given
    const source = { width: 1400, height: 700 };

    // When
    const result = getLargestCropSize(source, 1);

    // Then
    expect(result).toStrictEqual({ width: 700, height: 700 });
  });

  it("세로로 긴 원본에서 4:3 영역은 너비를 기준으로 자른다", () => {
    // Given
    const source = { width: 1024, height: 1536 };

    // When
    const result = getLargestCropSize(source, 4 / 3);

    // Then
    expect(result).toStrictEqual({ width: 1024, height: 768 });
  });
});
