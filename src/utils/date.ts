const KOREAN_DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

const KST_OFFSET = "+09:00";

/** 2025년 10월 19일 */
export function formatKoreanDate(date: Date) {
  return KOREAN_DATE_FORMAT.format(date);
}

/** 2025-10-19 */
export function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** 날짜만 적힌 발행일을 한국 시간 자정으로 표시한다: 2025-10-19T00:00:00+09:00 */
export function toKstDateTime(date: Date) {
  return `${toIsoDate(date)}T00:00:00${KST_OFFSET}`;
}
