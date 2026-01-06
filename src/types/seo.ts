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
}

export type SEOProps = SEOModel;
