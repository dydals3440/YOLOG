import type { Nodes, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { toString } from "mdast-util-to-string";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";
import { z } from "zod";

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
const CALLOUT_MARKER = /^\[![A-Z]+\]\s*/;

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

function collectParagraphs(node: Nodes, paragraphs: string[]) {
  if (node.type === "paragraph") {
    paragraphs.push(toString(node, { includeImageAlt: false }).replace(CALLOUT_MARKER, ""));
    return;
  }
  if (node.type === "code" || node.type === "heading" || node.type === "table") {
    return;
  }
  if ("children" in node) {
    for (const child of node.children) {
      collectParagraphs(child, paragraphs);
    }
  }
}

function parseMarkdown(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [mdxjs(), gfm()],
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
  });
}

// 본문 문단만 이어 붙여 검색 미리보기용 요약을 만든다. 코드·제목·표·MDX 요소는 제외한다.
export function extractSummary(markdown: string, maxLength = SUMMARY_MAX_LENGTH) {
  const paragraphs: string[] = [];
  collectParagraphs(parseMarkdown(markdown), paragraphs);
  const text = paragraphs.join(" ").replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}

export const PostPolicy = {
  summary(post: Post) {
    return post.description ?? extractSummary(post.body);
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
