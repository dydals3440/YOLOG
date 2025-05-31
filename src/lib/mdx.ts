import { type CollectionEntry, getCollection } from 'astro:content';

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
  return (await getCollection('post')).sort(sortCollectionDateDesc);
};

export const sortCollectionDateDesc = (
  a: CollectionEntry<'post'>,
  b: CollectionEntry<'post'>
) => {
  return new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf();
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
    .replace(/:{3}.*?:{3}/gs, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/(?<!\S)((http)(s?):\/\/|www\.).+?(?=\s)/g, '')
    .replace(/[#*|[\]]|(-{3,})|(`{3})(\S*)(?=\s)/g, '')
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

export const parseToc = (source: string) => {
  const withoutCodeBlocks = source.replace(/```[\s\S]*?```/g, '');

  return withoutCodeBlocks
    .split('\n')
    .filter((line) => line.match(/(^#{2})\s/))
    .map((rawHeading) => {
      const removeMdx = rawHeading
        .replace(/^##*\s/, '')
        .replace(/[*,~]{2,}/g, '')
        .replace(/(?<=\])\((.*?)\)/g, '')
        .replace(/(?<!\S)((http)(s?):\/\/|www\.).+?(?=\s)/g, '');

      return {
        slug: removeMdx
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9ㄱ-ㅎ|ㅏ-ㅣ|가-힣 -]/g, '')
          .replace(/\s/g, '-'),
        text: removeMdx,
      };
    });
};
