/**
 * UI 관련 설정
 */

/** 토스트 관련 설정 */
export const TOAST = {
  MESSAGES: {
    LINK_COPIED: "링크가 복사되었어요!",
    CODE_COPIED: "코드가 복사되었어요!",
  },
  /** 토스트 자동 닫힘 시간 (ms) */
  DURATION_MS: 3000,
} as const;

/** 딜레이 관련 설정 */
export const DELAYS = {
  /** 복사 완료 아이콘 복원 시간 (ms) */
  COPY_ICON_RESTORE_MS: 2000,
  /** CopyLinkButton 복사 완료 아이콘 복원 시간 (ms) */
  COPY_LINK_ICON_RESTORE_MS: 1000,
} as const;
