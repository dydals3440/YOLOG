/**
 * 페이지 번호 → URL 변환.
 * 1페이지는 루트, 그 외는 `/page/N` 로 구성한다.
 */
export function getPageUrl(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}/page/${page}`;
}

interface GetPaginationUrlsArgs {
  category: string | null;
  currentPage: number;
  totalPages: number;
  siteUrl: string;
}

/**
 * SEO용 rel="prev"/rel="next" 전체 URL을 계산.
 */
export function getPaginationUrls({
  category,
  currentPage,
  totalPages,
  siteUrl,
}: GetPaginationUrlsArgs) {
  const base = category ? `${siteUrl}/blogs/${category}` : `${siteUrl}/blogs`;

  const prevUrl =
    currentPage <= 1 ? null : currentPage === 2 ? base : `${base}/page/${currentPage - 1}`;

  const nextUrl = currentPage >= totalPages ? null : `${base}/page/${currentPage + 1}`;

  return { prevUrl, nextUrl };
}
