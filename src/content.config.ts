import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import { type BlogCategory, isBlogCategory } from "./consts";

type PostCategory = Exclude<BlogCategory, "ALL">;

const isPostCategory = (value: unknown): value is PostCategory =>
  isBlogCategory(value) && value !== "ALL";

const post = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}", "!**/*.draft.{md,mdx}"], base: "./src/content/post" }),
  schema: z.object({
    title: z.string().trim().min(1),
    draft: z.boolean().default(false),
    description: z.string().trim().min(1).optional(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.custom<PostCategory>(isPostCategory).optional(),
  }),
});

export const collections = { post };
