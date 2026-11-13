import { type Category, CategorySchema } from "@/domains/category.model";

export function getPostPath(postId: string) {
  return `/post/${postId}`;
}

export function getPostMarkdownPath(postId: string) {
  return `${getPostPath(postId)}.md`;
}

export function toCategorySlug(category: Category) {
  return category.toLowerCase();
}

export function parseCategorySlug(slug: string | undefined): Category | null {
  const result = CategorySchema.safeParse(slug?.toUpperCase());
  return result.success ? result.data : null;
}

export function getCategoryPath(category: Category) {
  return `/blogs/${toCategorySlug(category)}`;
}
