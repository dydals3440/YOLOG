import { type CollectionEntry, getCollection } from 'astro:content';
import { sortPostsByDate } from './blog-utils';

export interface PostInfoModel {
  title: string;
  description?: string;
  href: string;
  date: Date;
  updatedDate?: Date;
  category?: string;
}

export const isBlogPost = (post: { slug: string }) => {
  return post.slug.includes('blog/');
};

export const getPostCollection = async (): Promise<
  CollectionEntry<'post'>[]
> => {
  const posts = await getCollection('post');
  return sortPostsByDate(posts);
};

export const resolveSlug = (slug: string) => {
  const [_type, ...slugList] = slug.split('/');
  return slugList.join('/');
};

export const getPostInfoList = async (): Promise<PostInfoModel[]> => {
  const posts = await getPostCollection();

  return posts
    .filter((post) => isBlogPost(post))
    .map<PostInfoModel>((post) => ({
      title: post.data.title,
      description: post.data.description,
      href: `/post/${resolveSlug(post.slug)}`,
      date: post.data.date,
      updatedDate: post.data.updatedDate,
      category: post.data.category,
    }));
};

export const generateDescription = (content: string) => {
  const parsedContent = content
    // import/export 문 제거
    .replace(/import\s+.+?\s+from\s+['"].+?['"];?\s*/g, '')
    .replace(/export\s+.+?;?\s*/g, '')
    .replace(/:{3}.*?:{3}/gs, '')
    // HTML 태그 완전히 제거 (script, style 포함 모든 태그)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    // 이미지 마크다운 제거
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 링크 마크다운에서 텍스트만 추출
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // URL 제거
    .replace(/(?<!\S)((http)(s?):\/\/|www\.).+?(?=\s)/g, '')
    // 마크다운 문법 제거
    .replace(/[#*|[\]]|(-{3,})|(`{3})(\S*)(?=\s)/g, '')
    // HTML 엔티티 디코드
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    // 다중 공백을 단일 공백으로
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 157);

  return `${parsedContent}...`;
};

// Table of content
export type TOCSectionModel = {
  slug: string;
  text: string;
};

/**
 * 마크다운 소스에서 H2 제목을 추출하여 TOC를 생성한다
 * @param source 마크다운 소스 문자열
 * @returns TOC 섹션 배열
 */
export const parseToc = (source: string): TOCSectionModel[] => {
  try {
    // 코드 블록 제거 (```로 감싸진 부분)
    const withoutCodeBlocks = source.replace(/```[\s\S]*?```/g, '');

    // H2 헤딩만 필터링
    const h2Lines = withoutCodeBlocks
      .split('\n')
      .filter((line) => /^#{2}\s/.test(line));

    return h2Lines.map((rawHeading) => {
      // 마크다운 문법 제거
      let cleanText = rawHeading
        .replace(/^##\s+/, '') // ## 제거
        .replace(/[*~]{2,}/g, '') // **bold**, ~~strike~~ 제거
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크에서 텍스트만 추출
        .replace(/(?:https?:\/\/|www\.)\S+/g, '') // URL 제거
        .trim();

      // 슬러그 생성: 한글, 영문, 숫자, 공백, 하이픈만 허용
      const slug = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '') // 허용된 문자만 유지
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속된 하이픈을 하나로
        .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거

      return {
        slug,
        text: cleanText,
      };
    });
  } catch (error) {
    console.error('Failed to parse TOC:', error);
    return [];
  }
};
