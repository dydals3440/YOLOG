/**
 * 페이지네이션 관련 설정
 */
export const PAGINATION = {
  /** 메인 블로그 목록 페이지당 포스트 수 */
  POSTS_PER_PAGE: 8,
  /** 카테고리별 페이지당 포스트 수 */
  POSTS_PER_PAGE_CATEGORY: 5,
  /** 페이지네이션 컴포넌트의 delta 값 (현재 페이지 좌우로 표시할 페이지 수) */
  DELTA: 2,
} as const;
