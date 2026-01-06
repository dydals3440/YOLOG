/**
 * 컴포넌트 Props 타입 정의
 */

import type { CollectionEntry } from "astro:content";
import type { BlogCategory } from "@/consts";
import type { SEOProps } from "./seo";

// BaseLayout Props
export interface BaseLayoutProps {
  seo?: SEOProps;
  class?: string;
}

// BlogCard Props
export interface BlogCardProps {
  post: CollectionEntry<"post">;
}

// CategoryList Props
export interface CategoryListProps {
  categories: Array<{
    id: BlogCategory;
    label: string;
    count: number;
  }>;
  currentPath: string;
}

// Pagination Props
export interface PaginationProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    previousPage: number | null;
    nextPage: number | null;
  };
  basePath: string;
}

// PostNavigation Props
export interface PostNavigationProps {
  prevPost?: CollectionEntry<"post">;
  nextPost?: CollectionEntry<"post">;
}

// PostLayout Props
export interface PostLayoutProps {
  post: CollectionEntry<"post">;
  prevPost?: CollectionEntry<"post">;
  nextPost?: CollectionEntry<"post">;
}

// PostImage Props
export interface PostImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
}

// GoogleAdsense Props
export interface GoogleAdsenseProps {
  slot: string;
  className?: string;
}
