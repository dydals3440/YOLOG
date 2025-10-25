import { defineCollection, z } from 'astro:content'
import { BLOG_CATEGORIES, type BlogCategory } from './consts'

// BLOG_CATEGORIES의 키들을 타입으로 추출 (ALL 제외)
const categoryKeys = Object.keys(BLOG_CATEGORIES).filter(key => key !== 'ALL')

// 최소 1개 요소를 보장하는 타입 가드
if (categoryKeys.length === 0) {
  throw new Error('BLOG_CATEGORIES must have at least one category besides ALL')
}

const categoryValues = categoryKeys as [BlogCategory, ...BlogCategory[]]

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
