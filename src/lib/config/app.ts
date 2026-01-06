/**
 * 앱 기본 설정
 */

/** 사이트 기본 URL (trailing slash 없음) */
export const SITE_URL = "https://www.yolog.co.kr" as const;

/**
 * Astro.site에서 안전하게 사이트 URL 가져오기
 * @param astroSite - Astro.site 값 (URL | undefined)
 * @returns trailing slash가 제거된 사이트 URL
 */
export function getSiteUrl(astroSite: URL | undefined): string {
  if (astroSite) {
    return astroSite.toString().replace(/\/$/, "");
  }
  return SITE_URL;
}
