import type { CollectionEntry } from "astro:content";

import { RELATED_POSTS } from "@/lib/config";

interface GetRelatedPostsArgs {
  currentPost: CollectionEntry<"post">;
  allPosts: CollectionEntry<"post">[];
  maxPosts: number;
}

export function getRelatedPosts({ currentPost, allPosts, maxPosts }: GetRelatedPostsArgs) {
  return allPosts
    .map((post) => ({ post, score: calculateRelevance(currentPost, post) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score === a.score) {
        return new Date(b.post.data.date).getTime() - new Date(a.post.data.date).getTime();
      }
      return b.score - a.score;
    })
    .slice(0, maxPosts)
    .map(({ post }) => post);
}

function calculateRelevance(
  currentPost: CollectionEntry<"post">,
  post: CollectionEntry<"post">,
): number {
  if (post.id === currentPost.id) return -1;

  const currentTags = currentPost.data.tags || [];
  const currentCategory = currentPost.data.category;
  const postTags = post.data.tags || [];

  let score = 0;

  if (post.data.category === currentCategory) {
    score += RELATED_POSTS.SCORES.CATEGORY_MATCH;
  }

  const commonTags = currentTags.filter((tag) => postTags.includes(tag));
  score += commonTags.length * RELATED_POSTS.SCORES.TAG_MATCH;

  const recentDate = new Date();
  recentDate.setMonth(recentDate.getMonth() - RELATED_POSTS.RECENCY_MONTHS);
  if (new Date(post.data.date) > recentDate) {
    score += RELATED_POSTS.SCORES.RECENCY_BONUS;
  }

  return score;
}
