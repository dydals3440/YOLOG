export type PaginationItem =
  | { type: "page"; page: number }
  | { type: "ellipsis"; position: "start" | "end" };

const FIRST_PAGE = 1;

/** 첫·마지막 페이지와 현재 페이지 주변(siblings)만 보여 주고 나머지는 말줄임으로 줄인다. */
export function getPaginationRange({
  currentPage,
  lastPage,
  siblings = 2,
}: {
  currentPage: number;
  lastPage: number;
  siblings?: number;
}): PaginationItem[] {
  if (lastPage <= FIRST_PAGE) {
    return [{ type: "page", page: FIRST_PAGE }];
  }

  const start = Math.max(currentPage - siblings, FIRST_PAGE + 1);
  const end = Math.min(currentPage + siblings, lastPage - 1);
  const middle = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => ({
    type: "page" as const,
    page: start + index,
  }));

  return [
    { type: "page", page: FIRST_PAGE },
    ...(start > FIRST_PAGE + 1 ? [{ type: "ellipsis" as const, position: "start" as const }] : []),
    ...middle,
    ...(end < lastPage - 1 ? [{ type: "ellipsis" as const, position: "end" as const }] : []),
    { type: "page", page: lastPage },
  ];
}
