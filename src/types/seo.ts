/**
 * SEO 관련 타입 정의
 */

export interface SEOModel {
  noindex?: boolean | undefined;
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  keywords?: string[] | undefined;
  prevUrl?: string | null | undefined;
  nextUrl?: string | null | undefined;
  ogType?: "website" | "article" | undefined;
  publishedTime?: Date | undefined;
  modifiedTime?: Date | undefined;
  author?: string | undefined;
  articleSection?: string | undefined;
  articleTags?: string[] | undefined;
  excludeWebPageSchema?: boolean | undefined;
}

export type SEOProps = SEOModel;
