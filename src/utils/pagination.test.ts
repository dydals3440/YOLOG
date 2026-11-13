import { describe, expect, it } from "bun:test";

import { getPaginationRange, type PaginationItem } from "./pagination";

const toLabels = (items: PaginationItem[]) =>
  items.map((item) => (item.type === "page" ? item.page : "…"));

describe("getPaginationRange", () => {
  it("페이지가 하나면 1만 보여 준다", () => {
    // When
    const result = getPaginationRange({ currentPage: 1, lastPage: 1 });

    // Then
    expect(toLabels(result)).toStrictEqual([1]);
  });

  it("페이지가 적으면 말줄임 없이 모두 보여 준다", () => {
    // When
    const result = getPaginationRange({ currentPage: 2, lastPage: 4 });

    // Then
    expect(toLabels(result)).toStrictEqual([1, 2, 3, 4]);
  });

  it("가운데 페이지면 양쪽을 말줄임으로 줄인다", () => {
    // When
    const result = getPaginationRange({ currentPage: 7, lastPage: 12 });

    // Then
    expect(toLabels(result)).toStrictEqual([1, "…", 5, 6, 7, 8, 9, "…", 12]);
  });

  it("첫 페이지 근처면 앞쪽 말줄임을 넣지 않는다", () => {
    // When
    const result = getPaginationRange({ currentPage: 2, lastPage: 12 });

    // Then
    expect(toLabels(result)).toStrictEqual([1, 2, 3, 4, "…", 12]);
  });

  it("마지막 페이지 근처면 뒤쪽 말줄임을 넣지 않는다", () => {
    // When
    const result = getPaginationRange({ currentPage: 12, lastPage: 12 });

    // Then
    expect(toLabels(result)).toStrictEqual([1, "…", 10, 11, 12]);
  });
});
