import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import { CategorySchema } from "./domains/category.model";

// 지금은 글 폴더의 MDX를 읽는다. 글을 서버로 옮기면 loader만 객체 loader로 바꾼다.
const posts = defineCollection({
  loader: glob({ pattern: "*/index.mdx", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      draft: z.boolean().default(false),
      description: z.string().trim().min(1).optional(),
      date: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      image: image().optional(),
      tags: z.array(z.string()).default([]),
      category: CategorySchema,
    }),
});

export const collections = { posts };
