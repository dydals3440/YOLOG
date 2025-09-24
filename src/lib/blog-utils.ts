import { type CollectionEntry } from 'astro:content';
import { BLOG_CATEGORIES, type BlogCategory } from '@/consts';
import dayjs from 'dayjs';

/**
 * 게시글을 날짜 기준으로 내림차순 정렬합니다.
 * @param posts 정렬할 게시글 배열
 * @returns 정렬된 게시글 배열
 */
export function sortPostsByDate(
  posts: CollectionEntry<'post'>[]
): CollectionEntry<'post'>[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.data.date);
    const dateB = new Date(b.data.date);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * 날짜를 포맷팅합니다.
 * @param date 포맷팅할 날짜
 * @param format 날짜 형식 (기본값: 'YYYY년 MM월 DD일')
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(
  date: Date | string,
  format: string = 'YYYY년 MM월 DD일'
): string {
  return dayjs(date).format(format);
}

/**
 * 카테고리 목록을 생성합니다.
 * @param posts 전체 게시글 배열
 * @returns 카테고리 정보 배열
 */
export function createCategoryList(posts: CollectionEntry<'post'>[]): Array<{
  id: BlogCategory;
  label: string;
  count: number;
}> {
  return Object.entries(BLOG_CATEGORIES).map(([key, value]) => ({
    id: key as BlogCategory,
    label: value,
    count:
      key === 'ALL'
        ? posts.length
        : posts.filter((post) => post.data.category === key).length,
  }));
}

/**
 * 카테고리별로 게시글을 필터링합니다.
 * @param posts 전체 게시글 배열
 * @param category 필터링할 카테고리
 * @returns 필터링된 게시글 배열
 */
export function filterPostsByCategory(
  posts: CollectionEntry<'post'>[],
  category: BlogCategory
): CollectionEntry<'post'>[] {
  if (category === 'ALL') {
    return posts;
  }
  return posts.filter((post) => post.data.category === category);
}

/**
 * 페이지네이션 정보를 계산합니다.
 * @param totalItems 전체 아이템 수
 * @param itemsPerPage 페이지당 아이템 수
 * @param currentPage 현재 페이지 (1부터 시작)
 * @returns 페이지네이션 정보
 */
export function calculatePagination(
  totalItems: number,
  itemsPerPage: number,
  currentPage: number
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const remainingItems = totalItems - endIndex;
  const hasNextPage = remainingItems > 0;

  return {
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: hasNextPage,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: hasNextPage ? currentPage + 1 : null,
  };
}

/**
 * 배열을 페이지네이션합니다.
 * @param items 페이지네이션할 배열
 * @param page 현재 페이지 (1부터 시작)
 * @param itemsPerPage 페이지당 아이템 수
 * @returns 페이지네이션된 결과
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  itemsPerPage: number = 5
): {
  items: T[];
  pagination: ReturnType<typeof calculatePagination>;
} {
  const pagination = calculatePagination(items.length, itemsPerPage, page);
  const paginatedItems = items.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  return {
    items: paginatedItems,
    pagination,
  };
}
