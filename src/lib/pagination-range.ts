/**
 * 페이지네이션에 표시될 항목 한 개.
 *  - "page": 실제 페이지 번호 버튼
 *  - "ellipsis": 축약 표시 (…)
 */
export type PaginationItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: "start" | "end" };

interface BuildPaginationRangeArgs {
  currentPage: number;
  totalPages: number;
  /** 현재 페이지 좌우로 몇 개까지 노출할지 (기본 2) */
  siblings?: number;
}

/**
 * 현재 페이지와 총 페이지 수로부터 화면에 표시할 페이지 항목 배열을 만든다.
 *
 * 규칙:
 *  1. 첫 페이지(1)과 마지막 페이지(totalPages)는 **항상** 표시.
 *  2. 현재 페이지 기준 좌우 `siblings`개 표시.
 *  3. 경계와 중간 사이에 gap이 있으면 ellipsis로 축약.
 *
 * @example
 *   buildPaginationRange({ currentPage: 1, totalPages: 1 })
 *   // → [{ type: "page", page: 1 }]
 *
 *   buildPaginationRange({ currentPage: 7, totalPages: 12, siblings: 2 })
 *   // → [1, …, 5, 6, 7, 8, 9, …, 12]  (type 생략)
 */
export function buildPaginationRange({
  currentPage,
  totalPages,
  siblings = 2,
}: BuildPaginationRangeArgs): PaginationItem[] {
  if (totalPages <= 1) {
    return [{ type: "page", page: 1 }];
  }

  const firstPage = 1;
  const lastPage = totalPages;
  const leftSibling = Math.max(currentPage - siblings, firstPage + 1);
  const rightSibling = Math.min(currentPage + siblings, lastPage - 1);

  const items: PaginationItem[] = [{ type: "page", page: firstPage }];

  if (leftSibling > firstPage + 1) {
    items.push({ type: "ellipsis", key: "start" });
  }

  for (let page = leftSibling; page <= rightSibling; page++) {
    items.push({ type: "page", page });
  }

  if (rightSibling < lastPage - 1) {
    items.push({ type: "ellipsis", key: "end" });
  }

  items.push({ type: "page", page: lastPage });

  return items;
}
