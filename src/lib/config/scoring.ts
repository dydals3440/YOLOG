/**
 * 관련 포스트 스코어링 설정
 */
export const RELATED_POSTS = {
  /** 최대 관련 포스트 수 */
  MAX_COUNT: 3,
  /** 최근 포스트로 판단하는 기간 (개월) */
  RECENCY_MONTHS: 6,
  SCORES: {
    /** 같은 카테고리 점수 */
    CATEGORY_MATCH: 3,
    /** 태그 일치 점수 (태그당) */
    TAG_MATCH: 2,
    /** 최근 포스트 보너스 */
    RECENCY_BONUS: 1,
  },
} as const;
