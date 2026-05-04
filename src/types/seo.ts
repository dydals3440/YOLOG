/**
 * SEO 관련 타입 정의
 */

export interface SEOModel {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
  prevUrl?: string | null;
  nextUrl?: string | null;
  ogType?: "website" | "article";
  publishedTime?: Date;
  modifiedTime?: Date;
  author?: string;
  articleSection?: string;
  articleTags?: string[];
  excludeWebPageSchema?: boolean;
}

export type SEOProps = SEOModel;
