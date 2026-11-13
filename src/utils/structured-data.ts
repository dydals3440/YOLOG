import type {
  BlogPosting,
  BreadcrumbList,
  ListItem,
  Person,
  ProfilePage,
  WebSite,
  WithContext,
} from "schema-dts";

import { AUTHOR, SITE } from "@/constants/site";
import { CATEGORY_LABEL } from "@/domains/category.model";
import type { Post } from "@/domains/post.model";

import { toKstDateTime } from "./date";
import { getCategoryPath, getPostPath } from "./routes";

const PERSON_ID = `${SITE.url}/#person`;

/** script 태그 안의 JSON-LD가 HTML 종료 태그로 해석되지 않도록 직렬화한다. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toAbsoluteUrl(path: string) {
  return new URL(path, SITE.url).href;
}

function buildPerson(): Person {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: AUTHOR.name,
    url: SITE.url,
    sameAs: Object.values(AUTHOR.profiles),
  };
}

export function buildWebSiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.title,
    alternateName: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: SITE.locale,
  };
}

export function buildProfilePageSchema(): WithContext<ProfilePage> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: SITE.url,
    mainEntity: buildPerson(),
  };
}

export function buildBlogPostingSchema({
  post,
  description,
  images,
}: {
  post: Post;
  description: string;
  images: string[];
}): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    inLanguage: SITE.locale,
    image: images.map(toAbsoluteUrl),
    datePublished: toKstDateTime(post.publishedAt),
    dateModified: toKstDateTime(post.updatedAt),
    author: { "@id": PERSON_ID, "@type": "Person", name: AUTHOR.name, url: SITE.url },
    publisher: buildPerson(),
    mainEntityOfPage: { "@type": "WebPage", "@id": toAbsoluteUrl(getPostPath(post.id)) },
    keywords: post.tags,
  };
}

export function buildBreadcrumbSchema(post: Post): WithContext<BreadcrumbList> {
  const crumbs: ListItem[] = [
    { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
    { "@type": "ListItem", position: 2, name: "블로그", item: toAbsoluteUrl("/blogs") },
    {
      "@type": "ListItem",
      position: 3,
      name: CATEGORY_LABEL[post.category],
      item: toAbsoluteUrl(getCategoryPath(post.category)),
    },
    { "@type": "ListItem", position: 4, name: post.title },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  };
}
