import type { APIContext } from "astro";

/** Search Console에 제출된 과거 사이트맵 주소를 계속 유효하게 유지한다. */
export function GET({ site }: APIContext) {
  if (!site) throw new Error("Astro site is required");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${new URL("/sitemap.xml", site).href}</loc></sitemap></sitemapindex>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
