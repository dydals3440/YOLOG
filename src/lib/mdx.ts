import { type CollectionEntry, getCollection } from "astro:content";
import type { PostInfoModel, TOCSectionModel } from "@/types";
import { sortPostsByDate } from "./blog-utils";

export type { TOCSectionModel };

export const isBlogPost = (post: { id: string }) => {
  return post.id.includes("blog/");
};

export const getPostCollection = async (): Promise<CollectionEntry<"post">[]> => {
  const posts = await getCollection("post");
  return sortPostsByDate(posts.filter((post) => !post.data.draft && !post.id.includes(".draft")));
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

/**
 * 마크다운 소스에서 H2 제목을 추출하여 TOC를 생성한다
 * @param source 마크다운 소스 문자열
 * @returns TOC 섹션 배열
 */
export const parseToc = (source: string): TOCSectionModel[] => {
  try {
    // 코드 블록 제거 (```로 감싸진 부분)
    const withoutCodeBlocks = source.replace(/```[\s\S]*?```/g, "");

    // H2 헤딩만 필터링
    const h2Lines = withoutCodeBlocks.split("\n").filter((line) => /^#{2}\s/.test(line));

    return h2Lines.map((rawHeading) => {
      // 마크다운 문법 제거
      const cleanText = rawHeading
        .replace(/^##\s+/, "") // ## 제거
        .replace(/[*~]{2,}/g, "") // **bold**, ~~strike~~ 제거
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 링크에서 텍스트만 추출
        .replace(/(?:https?:\/\/|www\.)\S+/g, "") // URL 제거
        .trim();

      // 슬러그 생성: 한글, 영문, 숫자, 공백, 하이픈만 허용
      const slug = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "") // 허용된 문자만 유지
        .replace(/\s+/g, "-") // 공백을 하이픈으로
        .replace(/-+/g, "-") // 연속된 하이픈을 하나로
        .replace(/^-+|-+$/g, ""); // 앞뒤 하이픈 제거

      return {
        slug,
        text: cleanText,
      };
    });
  } catch (error) {
    console.error("Failed to parse TOC:", error);
    return [];
  }
};
