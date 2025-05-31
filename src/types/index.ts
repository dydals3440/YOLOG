import type { BlogCategory } from '@/consts';

export interface SEOModel {
  title?: string;
  description?: string;
  image?: string;
}

export interface BlogPost {
  title: string;
  description?: string;
  date: string;
  category: BlogCategory;
  tags?: string[];
  image?: string;
}
