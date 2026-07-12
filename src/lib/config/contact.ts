/**
 * 연락처 설정
 */

const EMAIL = "matthew@redband.co.kr";

/** 이메일 및 메일 작성 링크 */
export const CONTACT = {
  /** 대표 이메일 주소 */
  EMAIL,
  /** 기본 메일 클라이언트로 여는 링크 */
  MAILTO_URL: `mailto:${EMAIL}`,
  /** Gmail 웹에서 새 메일 작성 화면을 여는 링크 */
  GMAIL_COMPOSE_URL: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}`,
} as const;
