import { defineCollection, z } from 'astro:content'
import { BLOG_CATEGORIES, type BlogCategory } from './consts'

// BLOG_CATEGORIES의 키들을 타입으로 추출 (ALL 제외)
const categoryValues = Object.keys(BLOG_CATEGORIES)
  .filter(key => key !== 'ALL') as [BlogCategory, ...BlogCategory[]]

const post = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.enum(categoryValues).optional(),
  }),
})

export const collections = { post }
