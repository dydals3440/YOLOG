/** script 태그 안의 JSON-LD가 HTML 종료 태그로 해석되지 않도록 직렬화한다. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
