interface GetPaginationUrlsArgs {
  category: string | null;
  currentPage: number;
  totalPages: number;
  siteUrl: string;
}

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
