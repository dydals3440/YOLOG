import { type CollectionEntry, getCollection } from "astro:content";
import type { PostInfoModel } from "@/types";
import { sortPostsByDate } from "./blog-utils";

export const isBlogPost = (post: { id: string }) => {
  return post.id.includes("blog/");
};

export const getPostCollection = async (): Promise<CollectionEntry<"post">[]> => {
  const posts = await getCollection("post", ({ data }) => !data.draft);
  return sortPostsByDate(posts);
};

export const resolveSlug = (slug: string) => {
  const [_type, ...slugList] = slug.split("/");
  return slugList.join("/");
};

export const getPostInfoList = async (): Promise<PostInfoModel[]> => {
  const posts = await getPostCollection();

  return posts
    .filter((post) => isBlogPost(post))
    .map<PostInfoModel>((post) => ({
      title: post.data.title,
      description: post.data.description,
      href: `/post/${resolveSlug(post.id)}`,
      date: post.data.date,
      updatedDate: post.data.updatedDate,
      category: post.data.category,
    }));
};

export const generateDescription = (content: string) => {
  const text = content
    // 코드·MDX 컴포넌트·제목 대신 본문의 설명을 검색 미리보기에 사용한다.
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, "")
    .replace(/^export\s+.*$/gm, "")
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/^:{3}.*$/gm, "")
    .replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+|www\.\S+/g, "")
    .replace(/[#*|`~]|(-{3,})/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= 160) return text;
  return `${text.slice(0, 157).trimEnd()}...`;
};
