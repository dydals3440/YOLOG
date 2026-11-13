import { describe, expect, it } from "bun:test";

import { formatKoreanDate, toIsoDate, toKstDateTime } from "./date";

const DATE = new Date("2025-10-19T00:00:00.000Z");

describe("formatKoreanDate", () => {
  it("연·월·일을 한국어로 표시한다", () => {
    // When
    const result = formatKoreanDate(DATE);

    // Then
    expect(result).toBe("2025년 10월 19일");
  });
});

describe("toIsoDate", () => {
  it("YYYY-MM-DD 형식으로 바꾼다", () => {
    // When
    const result = toIsoDate(DATE);

    // Then
    expect(result).toBe("2025-10-19");
  });
});

describe("toKstDateTime", () => {
  it("발행일을 한국 시간 자정으로 표시한다", () => {
    // When
    const result = toKstDateTime(DATE);

    // Then
    expect(result).toBe("2025-10-19T00:00:00+09:00");
  });
});
