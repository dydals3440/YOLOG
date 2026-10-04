import type { APIContext } from "astro";
import { buildBlogListingPaths } from "@/lib/blog-paths";
import { getSiteUrl } from "@/lib/config";
import { getPostInfoList } from "@/lib/mdx";

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function GET(context: APIContext) {
  const siteUrl = getSiteUrl(context.site);
  const [posts, listings] = await Promise.all([getPostInfoList(), buildBlogListingPaths()]);
  const renderUrl = (path: string, lastmod?: Date) =>
    `<url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc>${
      lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""
    }</url>`;

  // 실제 생성되는 카테고리와 페이지네이션 URL까지 포함한다.
  // 목록의 lastmod는 빌드 시각으로 꾸미지 않는다.
  const urls = [
    renderUrl("/"),
    renderUrl("/blogs"),
    ...listings.map(({ params }) => renderUrl(`/blogs/${params.slug}`)),
    ...posts.map((post) => renderUrl(post.href, post.updatedDate ?? post.date)),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
