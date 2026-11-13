import { z } from "zod";

import { extractParagraphText } from "@/utils/markdown";

import { CategorySchema } from "./category.model";

export const PostSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: CategorySchema,
    tags: z.array(z.string()),
    publishedAt: z.date(),
    updatedAt: z.date(),
    cover: z.string().optional(),
    body: z.string(),
  })
  .strip();

export type Post = z.infer<typeof PostSchema>;

export type FilterPost = (post: Post) => boolean;

export type OrderByPost = (post: Post) => number;

const KOREAN_CHARACTERS_PER_MINUTE = 500;
const ENGLISH_WORDS_PER_MINUTE = 200;
const MINIMUM_READING_MINUTES = 1;

const RELEVANCE_SCORE = {
  sameCategory: 3,
  sharedTag: 2,
  recentlyPublished: 1,
} as const;
const RECENT_PUBLICATION_MONTHS = 6;

const SUMMARY_MAX_LENGTH = 160;
const ELLIPSIS = "...";

export function filterByCategory(post: Post, category?: Post["category"] | null) {
  if (category == null) {
    return true;
  }

  return post.category === category;
}

export function filterByPostId(post: Post, id?: string | null) {
  return id != null ? post.id === id : true;
}

export function excludePostId(post: Post, id?: string | null) {
  return id != null ? post.id !== id : true;
}

export function orderByPublishedAt(post: Post) {
  return post.publishedAt.valueOf();
}

// 한글은 글자 수, 영어는 단어 수로 읽는 시간을 계산하고 1분 단위로 반올림한다.
export function calculateReadingMinutes(text: string) {
  const koreanCharacterCount = text.match(/[ㄱ-힝]/g)?.length ?? 0;
  const englishWordCount = text.match(/[a-zA-Z]+/g)?.length ?? 0;
  const minutes =
    koreanCharacterCount / KOREAN_CHARACTERS_PER_MINUTE +
    englishWordCount / ENGLISH_WORDS_PER_MINUTE;

  return Math.max(MINIMUM_READING_MINUTES, Math.round(minutes));
}

export function countSharedTags(tags: readonly string[], otherTags: readonly string[]) {
  return tags.filter((tag) => otherTags.includes(tag)).length;
}

export function isPublishedWithin(publishedAt: Date, now: Date, months: number) {
  const threshold = new Date(now);
  threshold.setMonth(threshold.getMonth() - months);
  return publishedAt > threshold;
}

// 같은 카테고리 3점, 겹치는 태그마다 2점, 최근 6개월 안에 발행한 글 1점
export function calculateRelevanceScore({
  isSameCategory,
  sharedTagCount,
  isRecentlyPublished,
}: {
  isSameCategory: boolean;
  sharedTagCount: number;
  isRecentlyPublished: boolean;
}) {
  return (
    (isSameCategory ? RELEVANCE_SCORE.sameCategory : 0) +
    sharedTagCount * RELEVANCE_SCORE.sharedTag +
    (isRecentlyPublished ? RELEVANCE_SCORE.recentlyPublished : 0)
  );
}

// 검색 미리보기 요약: 최대 길이를 넘으면 자르고 말줄임표를 붙인다.
export function createSummary(text: string, maxLength = SUMMARY_MAX_LENGTH) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

export const PostPolicy = {
  summary(post: Post) {
    return post.description ?? createSummary(extractParagraphText(post.body));
  },

  readingMinutes(post: Post) {
    return calculateReadingMinutes(post.body);
  },

  isUpdated(post: Post) {
    return post.updatedAt > post.publishedAt;
  },

  relevanceScore(post: Post, basePost: Post, now: Date) {
    return calculateRelevanceScore({
      isSameCategory: post.category === basePost.category,
      sharedTagCount: countSharedTags(post.tags, basePost.tags),
      isRecentlyPublished: isPublishedWithin(post.publishedAt, now, RECENT_PUBLICATION_MONTHS),
    });
  },
};
