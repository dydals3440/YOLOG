/**
 * 콘텐츠 관련 타입 정의
 */

import type { BlogCategory } from "@/consts";

export interface BlogPost {
  title: string;
  description?: string;
  date: string;
  category: BlogCategory;
  tags?: string[];
  image?: string;
}

export interface PostInfoModel {
  title: string;
  description?: string;
  href: string;
  date: Date;
  updatedDate?: Date;
  category?: string;
}

export interface TOCSectionModel {
  slug: string;
  text: string;
}
