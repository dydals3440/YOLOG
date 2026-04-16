import { getCollection } from "astro:content";

import { BLOG_CATEGORIES, type BlogCategory } from "@/consts";
import {
  createCategoryList,
  filterPostsByCategory,
  paginateArray,
  sortPostsByDate,
} from "@/lib/blog-utils";
import { PAGINATION } from "@/lib/config";

export async function buildBlogListingPaths() {
  const allPosts = await getCollection("post");
  const categories = Object.keys(BLOG_CATEGORIES)
    .filter((c) => c !== "ALL")
    .map((c) => c.toLowerCase());

  const paths = [];
  const sortedAll = sortPostsByDate(allPosts);

  const totalAllPages = Math.ceil(sortedAll.length / PAGINATION.POSTS_PER_PAGE);
  for (let page = 2; page <= totalAllPages; page++) {
    const { items, pagination } = paginateArray(sortedAll, page, PAGINATION.POSTS_PER_PAGE);
    paths.push({
      params: { slug: `page/${page}` },
      props: {
        posts: items,
        pagination: { ...pagination, totalPosts: allPosts.length },
        categories: createCategoryList(allPosts),
        category: null,
        categoryLabel: "All",
      },
    });
  }

  for (const category of categories) {
    const key = category.toUpperCase() as BlogCategory;
    const sorted = sortPostsByDate(filterPostsByCategory(allPosts, key));
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGINATION.POSTS_PER_PAGE_CATEGORY));

    for (let page = 1; page <= totalPages; page++) {
      const { items, pagination } = paginateArray(sorted, page, PAGINATION.POSTS_PER_PAGE_CATEGORY);
      paths.push({
        params: { slug: page === 1 ? category : `${category}/page/${page}` },
        props: {
          posts: items,
          pagination: { ...pagination, totalPosts: sorted.length },
          categories: createCategoryList(allPosts),
          category,
          categoryLabel: BLOG_CATEGORIES[key],
          totalPostsInCategory: sorted.length,
        },
      });
    }
  }

  return paths;
}
