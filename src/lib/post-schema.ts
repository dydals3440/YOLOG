import type { CollectionEntry } from "astro:content";

import { BLOG_CATEGORIES, type BlogCategory, WEBSITE_CONFIG } from "@/consts";

interface BuildBlogPostingSchemaArgs {
  post: CollectionEntry<"post">;
  description: string;
  site: URL | undefined;
  url: URL;
}

export function buildBlogPostingSchema({
  post,
  description,
  site,
  url,
}: BuildBlogPostingSchemaArgs) {
  const { title, date, updatedDate, image, tags } = post.data;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: image
      ? new URL(image, site).toString()
      : new URL(WEBSITE_CONFIG.OG_IMAGE, site).toString(),
    datePublished: new Date(date).toISOString(),
    dateModified: new Date(updatedDate || date).toISOString(),
    author: {
      "@type": "Person",
      name: "매튜",
      url: site?.toString(),
    },
    publisher: {
      "@type": "Organization",
      name: "YOLOG",
      logo: {
        "@type": "ImageObject",
        url: new URL("/favicon.ico", site).toString(),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url.toString(),
    },
    ...(tags && tags.length > 0 ? { keywords: tags.join(", ") } : {}),
  };
}

interface BuildBreadcrumbSchemaArgs {
  post: CollectionEntry<"post">;
  siteUrl: string;
}

export function buildBreadcrumbSchema({ post, siteUrl }: BuildBreadcrumbSchemaArgs) {
  const { title, category } = post.data;
  const categoryLabel = category ? BLOG_CATEGORIES[category as BlogCategory] : null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "블로그",
        item: `${siteUrl}/blogs`,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: categoryLabel,
              item: `${siteUrl}/blogs/${category.toLowerCase()}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: title,
      },
    ],
  };
}
