import { getPostInfoList } from '@/lib/mdx';

export async function GET() {
  const siteUrl = import.meta.env.SITE || 'https://www.yolog.co.kr';
  const posts = await getPostInfoList();

  const renderUrl = (slug: string) => `<url><loc>${siteUrl}${slug}</loc></url>`;

  const result = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${renderUrl('/')}
      ${renderUrl('/blogs')}
      ${posts
        .map((post) => {
          const lastMod = (post.updatedDate ?? post.date).toISOString();
          return `<url><loc>${siteUrl}${post.href}/</loc><lastmod>${lastMod}</lastmod></url>`;
        })
        .join('\n')}
    </urlset>
  `.trim();

  return new Response(result, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
