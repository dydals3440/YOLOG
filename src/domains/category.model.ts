import { z } from "zod";

export const CategorySchema = z.enum(["DEVELOPMENT", "REVIEW", "HTTP", "STORY", "DESIGN_PATTERN"]);

export type Category = z.infer<typeof CategorySchema>;

export const CATEGORIES = CategorySchema.options;

export const CATEGORY_LABEL = {
  DEVELOPMENT: "개발",
  REVIEW: "회고",
  HTTP: "HTTP",
  STORY: "이야기",
  DESIGN_PATTERN: "디자인 패턴",
} as const satisfies Record<Category, string>;
